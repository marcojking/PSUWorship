import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { ConvexHttpClient } from 'convex/browser'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { api } from '../../convex/_generated/api'
import { songToSlides } from '@/lib/live/slides'
import {
  initialState, applyEvent, buildPayload, EMPTY_SETLIST,
  type BridgeState, type LiveSetlist, type LiveSetlistSong, type ButtonEvent,
} from './state'

const CONVEX_URL = process.env.WMA_CONVEX_URL ?? 'https://fearless-dotterel-730.convex.cloud'

// One setlist, pre-built into projector slides, ready to run offline.
interface CachedSetlist {
  id: string
  name: string
  date: string
  songs: LiveSetlistSong[]
}

const RENDERER = join(__dirname, '..', 'renderer')

let controlWin: BrowserWindow | null = null
let projectorWin: BrowserWindow | null = null
let monitorWin: BrowserWindow | null = null

let convex: ConvexHttpClient | null = null
let library: CachedSetlist[] = []
let activeSetlist: LiveSetlist = EMPTY_SETLIST
let state: BridgeState = initialState()
let broadcast = false

const cachePath = () => join(app.getPath('userData'), 'setlists.json')
const statePath = () => join(app.getPath('userData'), 'state.json')

// ---------- persistence ----------

function loadCache(): void {
  try {
    if (existsSync(cachePath())) library = JSON.parse(readFileSync(cachePath(), 'utf8'))
  } catch { library = [] }
}

function saveCache(): void {
  try { writeFileSync(cachePath(), JSON.stringify(library)) } catch {}
}

function loadState(): void {
  try {
    if (existsSync(statePath())) {
      const s = JSON.parse(readFileSync(statePath(), 'utf8'))
      if (s && typeof s.currentSlide === 'number') state = s
    }
  } catch {}
}

function saveState(): void {
  try { writeFileSync(statePath(), JSON.stringify(state)) } catch {}
}

// ---------- Convex ----------

async function refreshLibrary(): Promise<CachedSetlist[]> {
  if (!convex) return library
  const [setlists, songs] = await Promise.all([
    convex.query(api.setlists.list, {}),
    convex.query(api.songs.list, {}),
  ])
  const songById = new Map(songs.map(s => [s._id, s]))
  library = setlists.map(setlist => {
    const built: LiveSetlistSong[] = []
    for (const entry of [...setlist.songs].sort((a, b) => a.order - b.order)) {
      const song = songById.get(entry.songId)
      if (!song) continue
      const displayKey = entry.transposedKey ?? song.key
      built.push({
        title: song.title,
        key: displayKey,
        slides: songToSlides(song.sections, song.key, displayKey),
      })
    }
    return { id: setlist._id as string, name: setlist.name, date: setlist.date, songs: built }
  })
  saveCache()
  return library
}

function pushSetlistOnline(): void {
  if (!convex || !broadcast) return
  convex.mutation(api.liveSetlist.push, {
    name: activeSetlist.name,
    songs: activeSetlist.songs,
  }).catch(() => {})
}

function pushSessionOnline(): void {
  if (!convex || !broadcast) return
  convex.mutation(api.liveSession.update, {
    currentSong:  state.currentSong,
    currentSlide: state.currentSlide,
    queuedSong:   state.queuedSong,
    queuedSlide:  state.queuedSlide,
    mode:         state.mode,
    isBlackout:   state.isBlackout,
    isLive:       state.isLive,
  }).catch(() => {})
}

function pushStandbyOnline(): void {
  if (!convex) return
  convex.mutation(api.liveSession.update, {
    currentSong: -1, currentSlide: -1, queuedSong: 0, queuedSlide: 0,
    mode: 'song', isBlackout: false, isLive: false,
  }).catch(() => {})
}

// ---------- broadcast to local windows ----------

function broadcastPayload(): void {
  const payload = buildPayload(state, activeSetlist)
  for (const w of [controlWin, projectorWin, monitorWin]) {
    if (w && !w.isDestroyed()) w.webContents.send('payload', payload)
  }
}

// ---------- windows ----------

function createControlWindow(): void {
  controlWin = new BrowserWindow({
    width: 1100, height: 760, title: 'WMA Live — Control',
    webPreferences: { preload: join(__dirname, 'preload.cjs') },
  })
  controlWin.loadFile(join(RENDERER, 'control.html'))
  controlWin.on('closed', () => { controlWin = null })
}

function displayById(id: number) {
  return screen.getAllDisplays().find(d => d.id === id) ?? screen.getPrimaryDisplay()
}

function createDisplayWindow(kind: 'projector' | 'monitor', displayId: number): BrowserWindow {
  const d = displayById(displayId)
  const win = new BrowserWindow({
    x: d.bounds.x + 40, y: d.bounds.y + 40,
    width: Math.min(1280, d.bounds.width - 80),
    height: Math.min(720, d.bounds.height - 80),
    backgroundColor: '#000000',
    title: kind === 'projector' ? 'WMA Live — Projector' : 'WMA Live — Monitor',
    webPreferences: { preload: join(__dirname, 'preload.cjs') },
  })
  win.loadFile(join(RENDERER, `${kind}.html`))
  win.once('ready-to-show', () => { win.setFullScreen(true) })
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('payload', buildPayload(state, activeSetlist))
  })
  return win
}

// ---------- IPC ----------

function registerIpc(): void {
  ipcMain.handle('get-displays', () => {
    const primaryId = screen.getPrimaryDisplay().id
    return screen.getAllDisplays().map(d => ({
      id: d.id,
      label: d.label || `Display ${d.id}`,
      width: d.bounds.width,
      height: d.bounds.height,
      primary: d.id === primaryId,
    }))
  })

  ipcMain.handle('list-setlists', () => library.map(s => ({ id: s.id, name: s.name, date: s.date })))

  ipcMain.handle('refresh-library', async () => {
    try {
      await refreshLibrary()
      return { ok: true, setlists: library.map(s => ({ id: s.id, name: s.name, date: s.date })) }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('select-setlist', (_e, id: string) => {
    const found = library.find(s => s.id === id)
    if (!found) return { ok: false }
    activeSetlist = { name: found.name, pushedAt: Date.now(), songs: found.songs }
    state = initialState()
    saveState()
    pushSetlistOnline()
    pushSessionOnline()
    broadcastPayload()
    return { ok: true }
  })

  ipcMain.handle('action', (_e, event: ButtonEvent) => {
    const next = applyEvent(state, event, activeSetlist)
    if (next !== state) {
      state = next
      saveState()
      broadcastPayload()
      pushSessionOnline()
    }
    return buildPayload(state, activeSetlist)
  })

  ipcMain.handle('get-payload', () => buildPayload(state, activeSetlist))

  ipcMain.handle('open-window', (_e, kind: 'projector' | 'monitor', displayId: number) => {
    if (kind === 'projector') {
      if (projectorWin && !projectorWin.isDestroyed()) projectorWin.close()
      projectorWin = createDisplayWindow('projector', displayId)
      projectorWin.on('closed', () => { projectorWin = null })
    } else {
      if (monitorWin && !monitorWin.isDestroyed()) monitorWin.close()
      monitorWin = createDisplayWindow('monitor', displayId)
      monitorWin.on('closed', () => { monitorWin = null })
    }
    return { ok: true }
  })

  ipcMain.handle('set-broadcast', (_e, on: boolean) => {
    broadcast = on
    if (on) { pushSetlistOnline(); pushSessionOnline() }
    else { pushStandbyOnline() }
    return { broadcast }
  })

  ipcMain.handle('get-config', () => ({ broadcast, convexUrl: CONVEX_URL, connected: convex !== null }))
}

// ---------- lifecycle ----------

app.whenReady().then(async () => {
  loadCache()
  loadState()
  try { convex = new ConvexHttpClient(CONVEX_URL) } catch { convex = null }
  registerIpc()
  createControlWindow()

  // Best-effort online refresh on launch; offline falls back to cache.
  refreshLibrary().then(() => {
    if (controlWin && !controlWin.isDestroyed()) {
      controlWin.webContents.send('library-updated', library.map(s => ({ id: s.id, name: s.name, date: s.date })))
    }
  }).catch(() => {})

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlWindow()
  })
})

app.on('before-quit', () => { if (broadcast) pushStandbyOnline() })

app.on('window-all-closed', () => { app.quit() })
