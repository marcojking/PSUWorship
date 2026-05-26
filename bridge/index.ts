import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import {
  initialState, applyGo, applyBack, applySelection, applyModeToggle,
  applyBlackout, applyStandby, buildPayload, EMPTY_SETLIST,
  type BridgeState, type LiveSetlist,
} from './state.js'
import { InputSource, type ButtonEvent } from './midi.js'
import { createBridgeServer } from './server.js'
import { initConvex, pushSession, loadSetlist } from './convex.js'

// Load .env file manually (tsx doesn't auto-load it)
try {
  const envFile = new URL('.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
  if (existsSync(envFile)) {
    const lines = readFileSync(envFile, 'utf8').split('\n')
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    }
  }
} catch {}

const HTTP_PORT  = 8765
const STATE_FILE = new URL('bridge-state.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const CONVEX_URL = process.env.CONVEX_URL ?? ''

function loadPersistedState(): BridgeState {
  try {
    if (existsSync(STATE_FILE)) {
      const s = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
      // Validate the slide-centric shape; older files used currentSection/queuedSection.
      if (s && typeof s.currentSlide === 'number' && typeof s.queuedSlide === 'number'
            && (s.mode === 'song' || s.mode === 'slide')) {
        return s as BridgeState
      }
    }
  } catch {}
  return initialState()
}

function persistState(s: BridgeState): void {
  try { writeFileSync(STATE_FILE, JSON.stringify(s)) } catch {}
}

async function main() {
  let setlist: LiveSetlist = EMPTY_SETLIST

  if (CONVEX_URL) {
    await initConvex(CONVEX_URL)
    setlist = (await loadSetlist()) ?? EMPTY_SETLIST
  } else {
    console.warn('[bridge] CONVEX_URL not set — Convex sync disabled, local-only mode')
  }

  if (setlist.songs.length === 0) {
    console.warn('[bridge] No setlist loaded — push one from the WMA admin at /setlist')
  } else {
    console.log(`[bridge] Setlist: "${setlist.name}" (${setlist.songs.length} songs)`)
  }

  let state = loadPersistedState()
  const { broadcast, listen } = createBridgeServer()
  const input = new InputSource()

  input.on('button', (event: ButtonEvent) => {
    const prev = state
    switch (event.type) {
      case 'selection': state = applySelection(state, event.index, setlist); break
      case 'go':        state = applyGo(state, setlist);        break
      case 'back':      state = applyBack(state, setlist);      break
      case 'mode':      state = applyModeToggle(state);         break
      case 'blackout':  state = applyBlackout(state);           break
      case 'standby':   state = applyStandby(state);            break
    }
    if (state !== prev) {
      persistState(state)
      const payload = buildPayload(state, setlist)
      broadcast(payload)
      pushSession(state)
    }
  })

  // Poll Convex every 30s for setlist updates
  if (CONVEX_URL) {
    setInterval(async () => {
      const fresh = await loadSetlist()
      if (fresh && fresh.pushedAt !== setlist.pushedAt) {
        setlist = fresh
        console.log(`[bridge] Setlist updated: "${setlist.name}"`)
        broadcast(buildPayload(state, setlist))
      }
    }, 30_000)
  }

  process.on('uncaughtException', (err: Error) => console.error('[bridge] Uncaught:', err.message))

  await listen(HTTP_PORT)
  input.startKeyboard()
  broadcast(buildPayload(state, setlist))

  console.log('\n[bridge] Ready — keyboard controls active above.')
}

main()
