# Live Lyrics Control System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a foot-pedal-driven lyrics control system that simultaneously drives a fullscreen projector display, a band confidence monitor with chords, and wmaac.org/live for online viewers — all from a Node.js bridge app controlled by keyboard shortcuts (MIDI hardware added in Phase 6).

**Architecture:** A Node.js bridge app reads keyboard/MIDI input, runs a pure state machine, broadcasts updates via local WebSocket to three HTML pages served on localhost:8765, and fires Convex mutations for the Vercel-hosted online views. The bridge lives in a `bridge/` subdirectory of the WMA project; it shares the Convex generated API types with the Next.js app.

**Tech Stack:** Node.js 20 LTS, TypeScript (tsx runner), Vitest, Express 4, ws 8, Convex (ConvexHttpClient), Next.js 16, Tailwind CSS

---

## File Map

**New files — bridge app:**
- `bridge/package.json` — Node project config, ESM, no compile step
- `bridge/tsconfig.json` — TypeScript config for bridge
- `bridge/vitest.config.ts` — Vitest config
- `bridge/index.ts` — entry point, wires all modules
- `bridge/state.ts` — pure state machine + WSPayload builder (no I/O)
- `bridge/chords.ts` — ChordLine→ChordPro conversion utilities
- `bridge/midi.ts` — keyboard stdin fallback + (Phase 6) MIDI input
- `bridge/server.ts` — Express HTTP server + WebSocket server on port 8765
- `bridge/convex.ts` — ConvexHttpClient wrapper (fire-and-forget mutations)
- `bridge/pages/display.html` — fullscreen audience lyrics
- `bridge/pages/monitor.html` — band confidence monitor with chords
- `bridge/pages/emulator.html` — pedalboard LCD emulator (dev only)

**New files — Convex:**
- `convex/liveSetlist.ts` — push + get mutations/queries
- `convex/liveSession.ts` — update + get mutations/queries

**New files — WMA website:**
- `src/lib/live/convert.ts` — ChordLine→ChordPro shared utilities
- `src/app/live/page.tsx` — online audience view
- `src/app/monitor/page.tsx` — online musician cue view

**Modified files:**
- `convex/schema.ts` — add liveSetlist + liveSession tables
- `src/app/setlist/[id]/page.tsx` — add Push to Live button

---

## Phase 1 — Convex Foundation

### Task 1: Add liveSetlist and liveSession to Convex schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add the two tables to schema.ts**

Add after the `donations` table definition (before the closing `}`):

```typescript
  liveSetlist: defineTable({
    name:     v.string(),
    pushedAt: v.number(),
    songs: v.array(v.object({
      title: v.string(),
      key:   v.optional(v.string()),
      sections: v.array(v.object({
        type:   v.string(),
        label:  v.string(),
        lyrics: v.string(),
        chords: v.string(),
      }))
    }))
  }),

  liveSession: defineTable({
    currentSong:    v.number(),
    currentSection: v.number(),
    queuedSong:     v.number(),
    queuedSection:  v.number(),
    mode:           v.union(v.literal('song'), v.literal('section')),
    isBlackout:     v.boolean(),
    isLive:         v.boolean(),
    updatedAt:      v.number(),
  }),
```

- [ ] **Step 2: Verify types compile**

```bash
cd "C:\Users\marco\Desktop\ProjectOS\PROJECTS\WMA\WMA_Website\30_CODE\WMA"
npx convex dev --once
```

Expected: no TypeScript errors, Convex generates updated `convex/_generated/` files.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts convex/_generated/
git commit -m "feat: add liveSetlist and liveSession Convex tables"
```

---

### Task 2: Convex functions for liveSetlist

**Files:**
- Create: `convex/liveSetlist.ts`

- [ ] **Step 1: Create convex/liveSetlist.ts**

```typescript
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const push = mutation({
  args: {
    name: v.string(),
    songs: v.array(v.object({
      title: v.string(),
      key:   v.optional(v.string()),
      sections: v.array(v.object({
        type:   v.string(),
        label:  v.string(),
        lyrics: v.string(),
        chords: v.string(),
      }))
    }))
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('liveSetlist').first()
    if (existing) await ctx.db.delete(existing._id)
    return ctx.db.insert('liveSetlist', {
      name:     args.name,
      pushedAt: Date.now(),
      songs:    args.songs,
    })
  }
})

export const get = query({
  args: {},
  handler: async (ctx) => ctx.db.query('liveSetlist').first()
})
```

- [ ] **Step 2: Verify with convex dev**

```bash
npx convex dev --once
```

Expected: `liveSetlist` appears in the generated API, no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/liveSetlist.ts convex/_generated/
git commit -m "feat: add liveSetlist Convex functions (push, get)"
```

---

### Task 3: Convex functions for liveSession

**Files:**
- Create: `convex/liveSession.ts`

- [ ] **Step 1: Create convex/liveSession.ts**

```typescript
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const update = mutation({
  args: {
    currentSong:    v.number(),
    currentSection: v.number(),
    queuedSong:     v.number(),
    queuedSection:  v.number(),
    mode:           v.union(v.literal('song'), v.literal('section')),
    isBlackout:     v.boolean(),
    isLive:         v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('liveSession').first()
    if (existing) {
      return ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() })
    }
    return ctx.db.insert('liveSession', { ...args, updatedAt: Date.now() })
  }
})

export const get = query({
  args: {},
  handler: async (ctx) => ctx.db.query('liveSession').first()
})
```

- [ ] **Step 2: Verify**

```bash
npx convex dev --once
```

Expected: `liveSession` in generated API, no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/liveSession.ts convex/_generated/
git commit -m "feat: add liveSession Convex functions (update, get)"
```

---

## Phase 2 — Bridge Core

### Task 4: Bridge project setup

**Files:**
- Create: `bridge/package.json`
- Create: `bridge/tsconfig.json`
- Create: `bridge/vitest.config.ts`
- Create: `bridge/.env.example`

- [ ] **Step 1: Create bridge/package.json**

```json
{
  "name": "wma-bridge",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "npx tsx index.ts",
    "test":  "npx vitest run"
  },
  "dependencies": {
    "convex":   "^1.13.0",
    "express":  "^4.18.0",
    "ws":       "^8.17.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node":    "^20.0.0",
    "@types/ws":      "^8.5.0",
    "tsx":            "^4.0.0",
    "typescript":     "^5.0.0",
    "vitest":         "^1.6.0"
  }
}
```

- [ ] **Step 2: Create bridge/tsconfig.json**

```json
{
  "compilerOptions": {
    "target":           "ES2022",
    "module":           "ESNext",
    "moduleResolution": "bundler",
    "strict":           true,
    "skipLibCheck":     true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create bridge/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node' }
})
```

- [ ] **Step 4: Create bridge/.env.example**

```
CONVEX_URL=https://your-deployment.convex.cloud
```

- [ ] **Step 5: Install dependencies**

```bash
cd bridge
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
git add bridge/package.json bridge/tsconfig.json bridge/vitest.config.ts bridge/.env.example
git commit -m "feat: bridge project scaffold"
```

---

### Task 5: Bridge state machine

**Files:**
- Create: `bridge/state.ts`
- Create: `bridge/state.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `bridge/state.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  initialState, applyGo, applySelection, applyModeToggle,
  applyBlackout, applyStandby, buildPayload,
  EMPTY_SETLIST, type LiveSetlist,
} from './state.js'

const SETLIST: LiveSetlist = {
  name: 'Sunday',
  pushedAt: 1000,
  songs: [
    {
      title: 'Amazing Grace', key: 'G',
      sections: [
        { type: 'verse',  label: 'Verse 1', lyrics: 'Amazing grace',    chords: '[G]Amazing grace' },
        { type: 'chorus', label: 'Chorus',  lyrics: 'My chains are gone', chords: '[G]My chains' },
      ]
    },
    {
      title: 'How Great', key: 'A',
      sections: [
        { type: 'verse', label: 'Verse 1', lyrics: 'O Lord my God', chords: '[A]O Lord' },
      ]
    }
  ]
}

describe('initialState', () => {
  it('starts in standby, song 0 queued', () => {
    const s = initialState()
    expect(s.isLive).toBe(false)
    expect(s.currentSong).toBe(-1)
    expect(s.queuedSong).toBe(0)
    expect(s.queuedSection).toBe(0)
    expect(s.mode).toBe('song')
  })
})

describe('applyGo', () => {
  it('no-op on empty setlist', () => {
    expect(applyGo(initialState(), EMPTY_SETLIST)).toEqual(initialState())
  })
  it('sets isLive on first GO', () => {
    const s = applyGo(initialState(), SETLIST)
    expect(s.isLive).toBe(true)
    expect(s.currentSong).toBe(0)
    expect(s.currentSection).toBe(0)
  })
  it('auto-queues next section', () => {
    const s = applyGo(initialState(), SETLIST)
    expect(s.queuedSong).toBe(0)
    expect(s.queuedSection).toBe(1)
  })
  it('auto-queues next song at last section', () => {
    let s = applyGo(initialState(), SETLIST)   // song0/sec0 → queued 0/1
    s = applyGo(s, SETLIST)                    // song0/sec1 → queued 1/0
    expect(s.currentSong).toBe(0)
    expect(s.currentSection).toBe(1)
    expect(s.queuedSong).toBe(1)
    expect(s.queuedSection).toBe(0)
  })
  it('sets queued to -1 at end of setlist', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyGo(s, SETLIST)
    s = applyGo(s, SETLIST)
    expect(s.queuedSong).toBe(-1)
    expect(s.queuedSection).toBe(-1)
  })
  it('no-op when queuedSong is -1', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyGo(s, SETLIST)
    s = applyGo(s, SETLIST)
    const atEnd = s
    expect(applyGo(atEnd, SETLIST)).toEqual(atEnd)
  })
  it('clears blackout without advancing', () => {
    let s = applyGo(initialState(), SETLIST)
    const songBefore = s.currentSong
    s = applyBlackout(s)
    s = applyGo(s, SETLIST)
    expect(s.isBlackout).toBe(false)
    expect(s.currentSong).toBe(songBefore)
  })
})

describe('applySelection — song mode', () => {
  it('queues a specific song', () => {
    const s = applySelection(initialState(), 1, SETLIST)
    expect(s.queuedSong).toBe(1)
    expect(s.queuedSection).toBe(0)
  })
  it('no-op when index out of bounds', () => {
    const s = initialState()
    expect(applySelection(s, 5, SETLIST)).toEqual(s)
  })
  it('no-op on empty setlist', () => {
    const s = initialState()
    expect(applySelection(s, 0, EMPTY_SETLIST)).toEqual(s)
  })
})

describe('applySelection — section mode', () => {
  it('no-op when nothing is live', () => {
    const s = applyModeToggle(initialState())
    expect(applySelection(s, 0, SETLIST)).toEqual(s)
  })
  it('queues a specific section', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyModeToggle(s)
    s = applySelection(s, 1, SETLIST)
    expect(s.queuedSong).toBe(0)
    expect(s.queuedSection).toBe(1)
  })
  it('no-op when section index out of bounds', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyModeToggle(s)
    const before = s
    expect(applySelection(s, 5, SETLIST)).toEqual(before)
  })
})

describe('applyModeToggle', () => {
  it('toggles song ↔ section', () => {
    let s = initialState()
    s = applyModeToggle(s)
    expect(s.mode).toBe('section')
    s = applyModeToggle(s)
    expect(s.mode).toBe('song')
  })
})

describe('applyStandby', () => {
  it('resets to standby', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyStandby(s)
    expect(s.isLive).toBe(false)
    expect(s.currentSong).toBe(-1)
    expect(s.currentSection).toBe(-1)
  })
})

describe('buildPayload', () => {
  it('empty lyrics before going live', () => {
    const p = buildPayload(initialState(), SETLIST)
    expect(p.currentLyrics).toBe('')
    expect(p.songNumber).toBe(0)
  })
  it('correct lyrics after GO', () => {
    const s = applyGo(initialState(), SETLIST)
    const p = buildPayload(s, SETLIST)
    expect(p.currentLyrics).toBe('Amazing grace')
    expect(p.nextLyrics).toBe('My chains are gone')
    expect(p.songNumber).toBe(1)
    expect(p.sectionNumber).toBe(1)
  })
  it('6 buttonLabels always returned', () => {
    const p = buildPayload(initialState(), SETLIST)
    expect(p.buttonLabels).toHaveLength(6)
    expect(p.buttonLabels[2]).toBe('')
  })
  it('null next at end of setlist', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyGo(s, SETLIST)
    s = applyGo(s, SETLIST)
    const p = buildPayload(s, SETLIST)
    expect(p.nextLyrics).toBeNull()
    expect(p.nextSongTitle).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — verify they all fail**

```bash
cd bridge
npm test
```

Expected: all tests FAIL with "Cannot find module './state.js'"

- [ ] **Step 3: Implement bridge/state.ts**

```typescript
export type Mode = 'song' | 'section'

export interface LiveSetlistSection {
  type: string; label: string; lyrics: string; chords: string
}

export interface LiveSetlistSong {
  title: string; key?: string; sections: LiveSetlistSection[]
}

export interface LiveSetlist {
  name: string; pushedAt: number; songs: LiveSetlistSong[]
}

export interface BridgeState {
  mode:           Mode
  currentSong:    number  // -1 = standby
  currentSection: number  // -1 = standby
  queuedSong:     number  // -1 = end of setlist / no queue
  queuedSection:  number  // -1 = no queue
  isBlackout:     boolean
  isLive:         boolean
}

export interface WSPayload {
  type: 'state'
  state: BridgeState
  currentLyrics:    string
  currentChords:    string
  currentLabel:     string
  currentSongTitle: string
  nextLyrics:       string | null
  nextChords:       string | null
  nextLabel:        string | null
  nextSongTitle:    string | null
  buttonLabels:     string[]
  setlistName:      string
  songCount:        number
  sectionCount:     number
  songNumber:       number
  sectionNumber:    number
}

export const EMPTY_SETLIST: LiveSetlist = { name: '', pushedAt: 0, songs: [] }

export function initialState(): BridgeState {
  return {
    mode: 'song', currentSong: -1, currentSection: -1,
    queuedSong: 0, queuedSection: 0, isBlackout: false, isLive: false,
  }
}

export function applyGo(state: BridgeState, setlist: LiveSetlist): BridgeState {
  if (setlist.songs.length === 0) return state
  if (state.isBlackout) return { ...state, isBlackout: false }
  if (state.queuedSong === -1) return state

  const newSong = state.queuedSong
  const newSection = state.queuedSection
  const song = setlist.songs[newSong]

  let nextQueuedSong: number, nextQueuedSection: number
  if (newSection + 1 < song.sections.length) {
    nextQueuedSong = newSong; nextQueuedSection = newSection + 1
  } else if (newSong + 1 < setlist.songs.length) {
    nextQueuedSong = newSong + 1; nextQueuedSection = 0
  } else {
    nextQueuedSong = -1; nextQueuedSection = -1
  }

  return {
    ...state, isLive: true,
    currentSong: newSong, currentSection: newSection,
    queuedSong: nextQueuedSong, queuedSection: nextQueuedSection,
  }
}

export function applySelection(state: BridgeState, buttonIndex: number, setlist: LiveSetlist): BridgeState {
  if (setlist.songs.length === 0) return state
  if (state.mode === 'song') {
    if (buttonIndex >= setlist.songs.length) return state
    return { ...state, queuedSong: buttonIndex, queuedSection: 0 }
  }
  if (state.currentSong === -1) return state
  const currentSong = setlist.songs[state.currentSong]
  if (buttonIndex >= currentSong.sections.length) return state
  return { ...state, queuedSong: state.currentSong, queuedSection: buttonIndex }
}

export function applyModeToggle(state: BridgeState): BridgeState {
  return { ...state, mode: state.mode === 'song' ? 'section' : 'song' }
}

export function applyBlackout(state: BridgeState): BridgeState {
  return { ...state, isBlackout: !state.isBlackout }
}

export function applyStandby(state: BridgeState): BridgeState {
  return { ...state, isLive: false, currentSong: -1, currentSection: -1 }
}

export function buildPayload(state: BridgeState, setlist: LiveSetlist): WSPayload {
  const curSong    = state.currentSong >= 0 ? setlist.songs[state.currentSong] : null
  const curSection = curSong && state.currentSection >= 0 ? curSong.sections[state.currentSection] : null
  const nxtSong    = state.queuedSong >= 0 ? (setlist.songs[state.queuedSong] ?? null) : null
  const nxtSection = nxtSong && state.queuedSection >= 0 ? (nxtSong.sections[state.queuedSection] ?? null) : null

  const buttonLabels = state.mode === 'song'
    ? Array.from({ length: 6 }, (_, i) => setlist.songs[i]?.title.slice(0, 12) ?? '')
    : Array.from({ length: 6 }, (_, i) => curSong?.sections[i]?.label ?? '')

  return {
    type: 'state', state,
    currentLyrics:    curSection?.lyrics ?? '',
    currentChords:    curSection?.chords ?? '',
    currentLabel:     curSection?.label  ?? '',
    currentSongTitle: curSong?.title     ?? '',
    nextLyrics:       nxtSection?.lyrics  ?? null,
    nextChords:       nxtSection?.chords  ?? null,
    nextLabel:        nxtSection?.label   ?? null,
    nextSongTitle:    nxtSong?.title      ?? null,
    buttonLabels,
    setlistName:  setlist.name,
    songCount:    setlist.songs.length,
    sectionCount: curSong?.sections.length ?? 0,
    songNumber:   state.currentSong    >= 0 ? state.currentSong    + 1 : 0,
    sectionNumber: state.currentSection >= 0 ? state.currentSection + 1 : 0,
  }
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test
```

Expected: all 19 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add bridge/state.ts bridge/state.test.ts
git commit -m "feat: bridge state machine with full test coverage"
```

---

### Task 6: ChordLine-to-ChordPro conversion utilities

**Files:**
- Create: `bridge/chords.ts`
- Create: `bridge/chords.test.ts`
- Create: `src/lib/live/convert.ts`

- [ ] **Step 1: Write failing tests**

Create `bridge/chords.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { chordLineToChordPro, sectionToChordPro, sectionToLyrics } from './chords.js'

describe('chordLineToChordPro', () => {
  it('inserts chord at position 0', () => {
    expect(chordLineToChordPro({ lyrics: 'Amazing grace', chords: [{ chord: 'G', position: 0 }] }))
      .toBe('[G]Amazing grace')
  })
  it('inserts multiple chords in correct order', () => {
    expect(chordLineToChordPro({
      lyrics: 'Amazing grace how sweet',
      chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 8 }]
    })).toBe('[G]Amazing [D]grace how sweet')
  })
  it('returns plain lyrics when no chords', () => {
    expect(chordLineToChordPro({ lyrics: 'Amazing grace', chords: [] }))
      .toBe('Amazing grace')
  })
  it('clamps position beyond lyrics length', () => {
    expect(chordLineToChordPro({ lyrics: 'Hi', chords: [{ chord: 'G', position: 999 }] }))
      .toBe('Hi[G]')
  })
})

describe('sectionToChordPro', () => {
  it('joins lines with newline', () => {
    expect(sectionToChordPro([
      { lyrics: 'Line one', chords: [{ chord: 'G', position: 0 }] },
      { lyrics: 'Line two', chords: [] },
    ])).toBe('[G]Line one\nLine two')
  })
})

describe('sectionToLyrics', () => {
  it('strips chords', () => {
    expect(sectionToLyrics([
      { lyrics: 'Amazing grace', chords: [{ chord: 'G', position: 0 }] },
      { lyrics: 'How sweet', chords: [] },
    ])).toBe('Amazing grace\nHow sweet')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — "Cannot find module './chords.js'"

- [ ] **Step 3: Create bridge/chords.ts**

```typescript
export interface ChordPosition { chord: string; position: number }
export interface ChordLine { lyrics: string; chords: ChordPosition[] }

export function chordLineToChordPro(line: ChordLine): string {
  if (!line.chords.length) return line.lyrics
  const sorted = [...line.chords].sort((a, b) => b.position - a.position)
  let result = line.lyrics
  for (const { chord, position } of sorted) {
    const pos = Math.min(position, result.length)
    result = result.slice(0, pos) + `[${chord}]` + result.slice(pos)
  }
  return result
}

export function sectionToChordPro(lines: ChordLine[]): string {
  return lines.map(chordLineToChordPro).join('\n')
}

export function sectionToLyrics(lines: Pick<ChordLine, 'lyrics'>[]): string {
  return lines.map(l => l.lyrics).join('\n')
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Create src/lib/live/convert.ts (shared with WMA app)**

```typescript
import type { Section, ChordLine } from '@/lib/db'

export function chordLineToChordPro(line: ChordLine): string {
  if (!line.chords.length) return line.lyrics
  const sorted = [...line.chords].sort((a, b) => b.position - a.position)
  let result = line.lyrics
  for (const { chord, position } of sorted) {
    const pos = Math.min(position, result.length)
    result = result.slice(0, pos) + `[${chord}]` + result.slice(pos)
  }
  return result
}

export function sectionToChordPro(section: Section): string {
  return section.lines.map(chordLineToChordPro).join('\n')
}

export function sectionToLyrics(section: Section): string {
  return section.lines.map(l => l.lyrics).join('\n')
}
```

- [ ] **Step 6: Commit**

```bash
git add bridge/chords.ts bridge/chords.test.ts src/lib/live/convert.ts
git commit -m "feat: ChordLine→ChordPro conversion utilities with tests"
```

---

### Task 7: Bridge keyboard input

**Files:**
- Create: `bridge/midi.ts`

- [ ] **Step 1: Create bridge/midi.ts**

```typescript
import { EventEmitter } from 'node:events'

export type ButtonEvent =
  | { type: 'selection'; index: number }
  | { type: 'mode' }
  | { type: 'blackout' }
  | { type: 'go' }
  | { type: 'standby' }

export class InputSource extends EventEmitter {
  startKeyboard(): void {
    if (!process.stdin.isTTY) {
      console.log('[input] Not a TTY — keyboard fallback unavailable')
      return
    }
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    process.stdin.on('data', (key: string) => {
      if (key === '') { console.log('\n[bridge] Goodbye.'); process.exit(0) }
      const k = key.toLowerCase()
      if (k >= '1' && k <= '6')       this.emit('button', { type: 'selection', index: +k - 1 })
      else if (k === 'm')              this.emit('button', { type: 'mode' })
      else if (k === 'b')              this.emit('button', { type: 'blackout' })
      else if (k === ' ' || k === '\r') this.emit('button', { type: 'go' })
      else if (k === 's')              this.emit('button', { type: 'standby' })
    })

    console.log('[input] Keyboard: 1-6=select  M=mode  B=blackout  Space=GO  S=standby  Ctrl+C=quit')
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add bridge/midi.ts
git commit -m "feat: bridge keyboard input (stdin fallback)"
```

---

### Task 8: Bridge HTTP + WebSocket server

**Files:**
- Create: `bridge/server.ts`
- Create: `bridge/pages/` (directory — will be populated in Tasks 11-13)

- [ ] **Step 1: Create bridge/server.ts**

```typescript
import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { WSPayload } from './state.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function createBridgeServer() {
  const app = express()
  const httpServer = createServer(app)
  const wss = new WebSocketServer({ server: httpServer })

  app.get('/display',  (_, res) => res.sendFile(join(__dirname, 'pages', 'display.html')))
  app.get('/monitor',  (_, res) => res.sendFile(join(__dirname, 'pages', 'monitor.html')))
  app.get('/emulator', (_, res) => res.sendFile(join(__dirname, 'pages', 'emulator.html')))

  let lastPayload: WSPayload | null = null

  wss.on('connection', (ws) => {
    if (lastPayload) ws.send(JSON.stringify(lastPayload))
  })

  function broadcast(payload: WSPayload): void {
    lastPayload = payload
    const msg = JSON.stringify(payload)
    wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg) })
  }

  function listen(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      httpServer.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`[server] Port ${port} is in use — is another bridge instance running?`)
          process.exit(1)
        }
        reject(err)
      })
      httpServer.listen(port, () => {
        console.log(`[server] http://localhost:${port}/display  → open in Chrome → HDMI 1`)
        console.log(`[server] http://localhost:${port}/monitor  → open in Chrome → HDMI 2`)
        console.log(`[server] http://localhost:${port}/emulator → dev window`)
        resolve()
      })
    })
  }

  return { broadcast, listen }
}
```

- [ ] **Step 2: Create pages directory placeholder**

```bash
mkdir bridge/pages
echo "" > bridge/pages/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add bridge/server.ts bridge/pages/.gitkeep
git commit -m "feat: bridge HTTP + WebSocket server"
```

---

### Task 9: Bridge Convex client

**Files:**
- Create: `bridge/convex.ts`

- [ ] **Step 1: Create bridge/convex.ts**

```typescript
import { ConvexHttpClient } from 'convex/browser'
import type { BridgeState, LiveSetlist } from './state.js'

let client: ConvexHttpClient | null = null

export async function initConvex(url: string): Promise<{ api: typeof import('../convex/_generated/api.js') }> {
  client = new ConvexHttpClient(url)
  const api = await import('../convex/_generated/api.js')
  console.log('[convex] Connected to', url)
  return { api }
}

let _api: Awaited<ReturnType<typeof initConvex>>['api'] | null = null

export function setApi(api: Awaited<ReturnType<typeof initConvex>>['api']) {
  _api = api
}

export function pushSession(state: BridgeState): void {
  if (!client || !_api) return
  client.mutation(_api.liveSession.update, {
    currentSong:    state.currentSong,
    currentSection: state.currentSection,
    queuedSong:     state.queuedSong,
    queuedSection:  state.queuedSection,
    mode:           state.mode,
    isBlackout:     state.isBlackout,
    isLive:         state.isLive,
  }).catch(err => console.error('[convex] session update failed:', err.message))
}

export async function loadSetlist(): Promise<LiveSetlist | null> {
  if (!client || !_api) return null
  try {
    return (await client.query(_api.liveSetlist.get, {})) as LiveSetlist | null
  } catch (err: unknown) {
    console.error('[convex] failed to load setlist:', (err as Error).message)
    return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add bridge/convex.ts
git commit -m "feat: bridge Convex HTTP client (fire-and-forget session sync)"
```

---

### Task 10: Bridge entry point

**Files:**
- Create: `bridge/index.ts`

- [ ] **Step 1: Create bridge/index.ts**

```typescript
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import {
  initialState, applyGo, applySelection, applyModeToggle,
  applyBlackout, applyStandby, buildPayload, EMPTY_SETLIST,
  type BridgeState, type LiveSetlist,
} from './state.js'
import { InputSource, type ButtonEvent } from './midi.js'
import { createBridgeServer } from './server.js'
import { initConvex, setApi, pushSession, loadSetlist } from './convex.js'

const HTTP_PORT   = 8765
const STATE_FILE  = './bridge-state.json'
const CONVEX_URL  = process.env.CONVEX_URL ?? ''

function loadPersistedState(): BridgeState {
  try {
    if (existsSync(STATE_FILE)) return JSON.parse(readFileSync(STATE_FILE, 'utf8'))
  } catch {}
  return initialState()
}

function persistState(s: BridgeState): void {
  try { writeFileSync(STATE_FILE, JSON.stringify(s)) } catch {}
}

async function main() {
  let setlist: LiveSetlist = EMPTY_SETLIST

  if (CONVEX_URL) {
    const { api } = await initConvex(CONVEX_URL)
    setApi(api)
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

  process.on('uncaughtException', err => console.error('[bridge] Uncaught:', err.message))

  await listen(HTTP_PORT)
  input.startKeyboard()
  broadcast(buildPayload(state, setlist))

  console.log('\n[bridge] Ready — keyboard controls active above.')
}

main()
```

- [ ] **Step 2: Create bridge/.env with your Convex URL**

```bash
# In bridge/ directory:
copy .env.example .env
# Then edit .env and set CONVEX_URL to your Convex deployment URL
# Find it in the WMA app's .env.local as NEXT_PUBLIC_CONVEX_URL
```

- [ ] **Step 3: Start the bridge and verify it runs**

```bash
cd bridge
npm start
```

Expected output:
```
[bridge] CONVEX_URL not set — Convex sync disabled, local-only mode   (if no .env)
[bridge] No setlist loaded — push one from the WMA admin at /setlist
[server] http://localhost:8765/display  → open in Chrome → HDMI 1
[server] http://localhost:8765/monitor  → open in Chrome → HDMI 2
[server] http://localhost:8765/emulator → dev window
[input] Keyboard: 1-6=select  M=mode  B=blackout  Space=GO  S=standby  Ctrl+C=quit
[bridge] Ready — keyboard controls active above.
```

Press Ctrl+C to stop.

- [ ] **Step 4: Commit**

```bash
git add bridge/index.ts bridge/.env.example
git commit -m "feat: bridge entry point — wires state machine, input, server, Convex"
```

---

## Phase 3 — Local HTML Pages

### Task 11: /display — fullscreen audience page

**Files:**
- Create: `bridge/pages/display.html`

- [ ] **Step 1: Create bridge/pages/display.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WM&A Display</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0a; color: #f5f5f0;
      font-family: 'Cormorant Garamond', Georgia, serif;
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      overflow: hidden;
      transition: opacity 0.4s ease;
    }
    body.blackout { opacity: 0 !important; }
    #slide { text-align: center; padding: 4vw; max-width: 90vw; transition: opacity 0.3s ease; }
    #slide.fade { opacity: 0; }
    #song-title { font-size: 2.5vw; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.4; margin-bottom: 3vw; }
    #section-label { font-size: 1.5vw; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.25; margin-bottom: 2vw; }
    #lyrics { font-size: 7vw; font-weight: 300; line-height: 1.45; white-space: pre-line; }
    #standby { opacity: 0.12; font-size: 4vw; letter-spacing: 0.5em; text-transform: uppercase; }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div id="slide">
    <div id="standby">WM&amp;A</div>
    <div id="song-title"    class="hidden"></div>
    <div id="section-label" class="hidden"></div>
    <div id="lyrics"        class="hidden"></div>
  </div>

  <script>
    const slide = document.getElementById('slide')
    const standby = document.getElementById('standby')
    const songTitle = document.getElementById('song-title')
    const sectionLabel = document.getElementById('section-label')
    const lyrics = document.getElementById('lyrics')

    function render(msg) {
      document.body.classList.toggle('blackout', msg.state.isBlackout)

      if (!msg.state.isLive) {
        standby.classList.remove('hidden')
        songTitle.classList.add('hidden')
        sectionLabel.classList.add('hidden')
        lyrics.classList.add('hidden')
        return
      }

      slide.classList.add('fade')
      setTimeout(() => {
        standby.classList.add('hidden')
        songTitle.textContent = msg.currentSongTitle
        songTitle.classList.remove('hidden')
        sectionLabel.textContent = msg.currentLabel
        sectionLabel.classList.remove('hidden')
        lyrics.textContent = msg.currentLyrics
        lyrics.classList.remove('hidden')
        slide.classList.remove('fade')
      }, 300)
    }

    let ws
    function connect() {
      ws = new WebSocket(`ws://${location.host}`)
      ws.onmessage = ({ data }) => { const m = JSON.parse(data); if (m.type === 'state') render(m) }
      ws.onclose = () => setTimeout(connect, 2000)
    }
    connect()
  </script>
</body>
</html>
```

- [ ] **Step 2: Start bridge and open display page — verify it works**

```bash
# Terminal 1: start bridge
cd bridge && npm start

# Browser: open http://localhost:8765/display
# Press Space in the terminal → lyrics should appear
# Press B → screen should fade to black
# Press B again → screen should restore
```

Expected: fullscreen dark page, WM&A text in standby, lyrics appear after Space.

- [ ] **Step 3: Commit**

```bash
git add bridge/pages/display.html
git commit -m "feat: /display fullscreen audience lyrics page"
```

---

### Task 12: /monitor — band confidence monitor

**Files:**
- Create: `bridge/pages/monitor.html`

- [ ] **Step 1: Create bridge/pages/monitor.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WM&A Monitor</title>
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600&family=Cormorant+Garamond:wght@300;400&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #111; color: #f0ede8; font-family: 'Source Sans 3', sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    header { background: #1a1a1a; border-bottom: 1px solid #2a2a2a; padding: 8px 16px; display: flex; align-items: center; gap: 12px; font-size: 12px; flex-shrink: 0; }
    .badge { padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
    .badge-song    { background: #1e3a5f; color: #7eb8f7; }
    .badge-section { background: #3a1e5f; color: #b07ef7; }
    .badge-live    { background: #1e4a1e; color: #7af07a; }
    .badge-blackout { background: #5f1e1e; color: #f07a7a; }
    #song-name { font-weight: 600; }
    #position  { margin-left: auto; opacity: 0.5; }
    main { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
    .pane { background: #1a1a1a; border: 1px solid #252525; border-radius: 6px; padding: 14px; overflow: hidden; }
    .pane-current { flex: 0 0 62%; }
    .pane-next    { flex: 1; opacity: 0.6; }
    .pane-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #888; margin-bottom: 10px; }
    .section-badge { display: inline-block; padding: 1px 7px; border-radius: 3px; background: #1e3a5f; color: #7eb8f7; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
    .chord-block { font-family: 'Courier New', monospace; font-size: 14px; color: #f0c060; white-space: pre; line-height: 1.5; margin-bottom: 6px; }
    .lyric-block { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; line-height: 1.4; white-space: pre-line; }
    .pane-next .lyric-block { font-size: 16px; }
    .pane-next .chord-block { font-size: 12px; }
    #standby { flex: 1; display: flex; align-items: center; justify-content: center; opacity: 0.2; font-size: 16px; letter-spacing: 0.2em; text-transform: uppercase; }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <header>
    <span class="badge badge-song" id="mode-badge">SONG</span>
    <span class="badge badge-live" id="live-badge">LIVE</span>
    <span class="badge badge-blackout hidden" id="blackout-badge">BLACKOUT</span>
    <span id="song-name">—</span>
    <span id="position">—</span>
  </header>

  <div id="standby">Service not started — press GO</div>

  <main id="main" class="hidden">
    <div class="pane pane-current">
      <div class="section-badge" id="cur-badge"></div>
      <div class="chord-block" id="cur-chords"></div>
      <div class="lyric-block" id="cur-lyrics"></div>
    </div>
    <div class="pane pane-next">
      <div class="pane-label">NEXT — <span id="nxt-badge"></span></div>
      <div class="chord-block" id="nxt-chords"></div>
      <div class="lyric-block" id="nxt-lyrics"></div>
    </div>
  </main>

  <script>
    function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;') }

    function render(msg) {
      const { state, currentLabel, currentSongTitle, currentChords, currentLyrics,
              nextLabel, nextSongTitle, nextChords, nextLyrics,
              songNumber, sectionNumber, songCount, sectionCount } = msg

      document.getElementById('mode-badge').textContent = state.mode.toUpperCase()
      document.getElementById('mode-badge').className = `badge badge-${state.mode}`
      document.getElementById('live-badge').classList.toggle('hidden', !state.isLive)
      document.getElementById('blackout-badge').classList.toggle('hidden', !state.isBlackout)
      document.getElementById('song-name').textContent = currentSongTitle || '—'
      document.getElementById('position').textContent = state.isLive
        ? `Song ${songNumber}/${songCount} · Sec ${sectionNumber}/${sectionCount}` : ''

      const standby = document.getElementById('standby')
      const main    = document.getElementById('main')
      standby.classList.toggle('hidden', state.isLive)
      main.classList.toggle('hidden', !state.isLive)

      if (!state.isLive) return

      document.getElementById('cur-badge').textContent  = currentLabel
      document.getElementById('cur-chords').textContent = currentChords
      document.getElementById('cur-lyrics').textContent = currentLyrics
      document.getElementById('nxt-badge').textContent  = nextLabel ?? 'End of setlist'
      document.getElementById('nxt-chords').textContent = nextChords ?? ''
      document.getElementById('nxt-lyrics').textContent = nextLyrics ?? '(end)'
    }

    let ws
    function connect() {
      ws = new WebSocket(`ws://${location.host}`)
      ws.onmessage = ({ data }) => { const m = JSON.parse(data); if (m.type === 'state') render(m) }
      ws.onclose = () => setTimeout(connect, 2000)
    }
    connect()
  </script>
</body>
</html>
```

- [ ] **Step 2: Open and test monitor page**

```bash
# With bridge running (npm start in bridge/):
# Open http://localhost:8765/monitor in a second Chrome window
# Press Space several times — current lyrics + chords should update
# Press M — MODE badge should toggle
```

Expected: dark monitor view, current lyrics + chords in top pane, next cue in bottom pane.

- [ ] **Step 3: Commit**

```bash
git add bridge/pages/monitor.html
git commit -m "feat: /monitor band confidence monitor with chords + next cue"
```

---

### Task 13: /emulator — pedalboard LCD emulator

**Files:**
- Create: `bridge/pages/emulator.html`

- [ ] **Step 1: Create bridge/pages/emulator.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WM&A Pedalboard Emulator</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #141414; color: #e0e0e0; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 20px; padding: 20px; }
    h2 { font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.4; }
    .lcd-panel { background: #1e2e10; border: 3px solid #2e4e18; border-radius: 6px; padding: 10px; display: flex; gap: 4px; }
    .slot { width: 90px; height: 44px; background: #162008; border: 1px solid #2a4010; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6acd2a; text-align: center; padding: 4px; line-height: 1.3; word-break: break-word; transition: all 0.1s; }
    .slot.queued { border-color: #f0c030; color: #f0c030; background: #281e00; }
    .slot.empty  { color: #2a4010; }
    .button-row { display: flex; gap: 6px; align-items: flex-end; }
    .btn { border-radius: 8px; border: 2px solid #333; background: #1e1e1e; color: #e0e0e0; font-family: monospace; font-size: 11px; font-weight: bold; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 8px 4px; cursor: default; }
    .btn-sel  { width: 90px; height: 70px; border-color: #2a4a7a; }
    .btn-mode { width: 74px; height: 58px; border-color: #7a5a2a; }
    .btn-blk  { width: 74px; height: 58px; border-color: #7a2a2a; }
    .btn-go   { width: 74px; height: 58px; border-color: #2a7a2a; background: #0e200e; }
    .btn-num  { font-size: 16px; }
    .status { font-size: 12px; color: #666; text-align: center; line-height: 2; }
    .live { color: #6acd2a; } .mode-tag { color: #7ab8f7; }
    #conn { font-size: 11px; color: #f07a30; }
  </style>
</head>
<body>
  <h2>Pedalboard LCD Emulator</h2>
  <div class="lcd-panel" id="lcd">
    <div class="slot empty" id="s0">—</div>
    <div class="slot empty" id="s1">—</div>
    <div class="slot empty" id="s2">—</div>
    <div class="slot empty" id="s3">—</div>
    <div class="slot empty" id="s4">—</div>
    <div class="slot empty" id="s5">—</div>
  </div>
  <div class="button-row">
    <div class="btn btn-sel"><span class="btn-num">1</span></div>
    <div class="btn btn-sel"><span class="btn-num">2</span></div>
    <div class="btn btn-sel"><span class="btn-num">3</span></div>
    <div class="btn btn-sel"><span class="btn-num">4</span></div>
    <div class="btn btn-sel"><span class="btn-num">5</span></div>
    <div class="btn btn-sel"><span class="btn-num">6</span></div>
    <div class="btn btn-mode"><span>MODE</span><span id="mode-val">SONG</span></div>
    <div class="btn btn-blk"><span>BLKOUT</span></div>
    <div class="btn btn-go"><span style="font-size:18px">▶</span><span>GO</span></div>
  </div>
  <div class="status" id="status">—</div>
  <div id="conn">Connecting...</div>

  <script>
    function render(msg) {
      const { state, buttonLabels, setlistName, songNumber, sectionNumber, songCount, sectionCount, currentSongTitle, currentLabel, nextSongTitle, nextLabel } = msg

      for (let i = 0; i < 6; i++) {
        const el = document.getElementById(`s${i}`)
        const label = buttonLabels[i]
        const isQ = state.mode === 'song' ? state.queuedSong === i : state.queuedSection === i
        el.textContent = label || '—'
        el.className = `slot ${!label ? 'empty' : ''} ${isQ ? 'queued' : ''}`
      }

      document.getElementById('mode-val').textContent = state.mode.toUpperCase()
      document.getElementById('conn').textContent = ''

      const liveStr = state.isLive
        ? `<span class="live">● LIVE</span> — ${currentSongTitle} / ${currentLabel}`
        : 'Standby (press Space to go live)'
      const qStr = state.queuedSong >= 0
        ? `Queued → ${nextSongTitle ?? ''} / ${nextLabel ?? ''}`
        : '<span style="color:#7a2a2a">End of setlist</span>'

      document.getElementById('status').innerHTML = [
        `<span class="mode-tag">MODE: ${state.mode.toUpperCase()}</span>`,
        liveStr,
        state.isLive ? `Song ${songNumber}/${songCount} · Sec ${sectionNumber}/${sectionCount}` : '',
        qStr,
        `Setlist: ${setlistName || '(none loaded)'}`,
      ].filter(Boolean).join('<br>')
    }

    let ws
    function connect() {
      ws = new WebSocket(`ws://${location.host}`)
      ws.onopen  = () => { document.getElementById('conn').textContent = 'Connected' }
      ws.onmessage = ({ data }) => { const m = JSON.parse(data); if (m.type === 'state') render(m) }
      ws.onclose = () => {
        document.getElementById('conn').textContent = 'Disconnected — reconnecting...'
        setTimeout(connect, 2000)
      }
    }
    connect()
  </script>
</body>
</html>
```

- [ ] **Step 2: Open emulator and test full keyboard workflow**

```bash
# With bridge running:
# Open all three pages:
#   http://localhost:8765/display
#   http://localhost:8765/monitor
#   http://localhost:8765/emulator
#
# In the terminal:
# Press Space → emulator shows song 0 highlighted, display shows lyrics
# Press 2 → emulator shows slot 2 queued (song 2)
# Press Space → jumps to song 2
# Press M → emulator label changes to section names
# Press B → display fades to black, monitor shows BLACKOUT badge
```

- [ ] **Step 3: Commit**

```bash
git add bridge/pages/emulator.html
git commit -m "feat: /emulator pedalboard LCD simulation"
```

---

## Phase 4 — WMA Website Integration

### Task 14: Push to Live button in setlist admin

**Files:**
- Create: `src/lib/live/convert.ts` (already done in Task 6 Step 5)
- Modify: `src/app/setlist/[id]/page.tsx`

- [ ] **Step 1: Add state + handler to SetlistDetailPage**

In `src/app/setlist/[id]/page.tsx`, add the following imports at the top:

```typescript
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { sectionToChordPro, sectionToLyrics } from '@/lib/live/convert'
```

Add inside `SetlistDetailPage` (after the existing state declarations at line 23):

```typescript
const pushLive   = useMutation(api.liveSetlist.push)
const [pushing, setPushing]       = useState(false)
const [pushStatus, setPushStatus] = useState<'idle' | 'success' | 'error'>('idle')
```

Add this handler function after `loadSetlist()` (before `handleUpdateKey`):

```typescript
const handlePushToLive = async () => {
  if (!setlist || songs.length === 0) return
  setPushing(true)
  setPushStatus('idle')
  try {
    await pushLive({
      name: setlist.name,
      songs: songs.map(song => ({
        title: song.title,
        key:   song.transposedKey ?? song.key,
        sections: song.sections.map(section => ({
          type:   section.type,
          label:  section.label,
          lyrics: sectionToLyrics(section),
          chords: sectionToChordPro(section),
        }))
      }))
    })
    setPushStatus('success')
    setTimeout(() => setPushStatus('idle'), 3000)
  } catch {
    setPushStatus('error')
    setTimeout(() => setPushStatus('idle'), 4000)
  } finally {
    setPushing(false)
  }
}
```

- [ ] **Step 2: Add the Push to Live button to the Action Buttons section**

In the JSX, find the `{/* Action Buttons */}` section (around line 147). Add the Push to Live button after the Export button:

```tsx
{/* Action Buttons */}
<div className="flex gap-3 mb-6">
  <button
    onClick={() => setShowExport(true)}
    className="flex-1 bg-primary text-secondary py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
  >
    Export
  </button>
  <button
    onClick={handlePushToLive}
    disabled={pushing || songs.length === 0}
    className={`px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-40 ${
      pushStatus === 'success' ? 'bg-green-600 text-white' :
      pushStatus === 'error'   ? 'bg-red-600 text-white' :
      'bg-primary/10 border border-primary/20 hover:bg-primary/20'
    }`}
  >
    {pushing        ? 'Pushing...' :
     pushStatus === 'success' ? '✓ Live!' :
     pushStatus === 'error'   ? 'Failed' :
     '▶ Go Live'}
  </button>
  <Link
    href={`/setlist/${id}/edit`}
    className="px-6 py-3 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
  >
    Edit
  </Link>
</div>
```

- [ ] **Step 3: Test Push to Live**

```bash
# Terminal 1: make sure Convex dev is running
npx convex dev

# Terminal 2: start Next.js
npm run dev

# Browser:
# 1. Navigate to /setlist — open any setlist
# 2. Click "Go Live" — button should show "Pushing..." then "✓ Live!"
# 3. Start the bridge: cd bridge && npm start
# 4. Verify bridge logs: "[bridge] Setlist: "Your Setlist Name" (N songs)"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/setlist/[id]/page.tsx src/lib/live/convert.ts
git commit -m "feat: Push to Live button syncs setlist to Convex for bridge"
```

---

### Task 15: /live — online audience page

**Files:**
- Create: `src/app/live/page.tsx`

- [ ] **Step 1: Create src/app/live/page.tsx**

```tsx
'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export default function LivePage() {
  const session = useQuery(api.liveSession.get)
  const setlist = useQuery(api.liveSetlist.get)

  // Loading
  if (session === undefined || setlist === undefined) {
    return <div className="min-h-screen bg-black" />
  }

  // Bridge offline
  if (session === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/20 text-sm uppercase tracking-[0.3em]">Service not active</p>
      </div>
    )
  }

  // Standby
  if (!session.isLive) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-white/15 text-3xl tracking-[0.5em] uppercase" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
          WM&amp;A
        </p>
      </div>
    )
  }

  const song    = setlist?.songs[session.currentSong]
  const section = song?.sections[session.currentSection]

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] flex items-center justify-center transition-opacity duration-500"
      style={{ opacity: session.isBlackout ? 0 : 1 }}
    >
      <div className="text-center px-8 max-w-5xl w-full">
        <p className="text-white/30 text-sm uppercase tracking-[0.25em] mb-8 font-light">
          {song?.title}
        </p>
        <p
          className="text-white font-light leading-relaxed whitespace-pre-line"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(1.5rem, 5vw, 4rem)' }}
        >
          {section?.lyrics ?? ''}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add Cormorant Garamond font to the app layout (if not already present)**

Check `src/app/layout.tsx`. If the Google Fonts import for Cormorant Garamond is missing, add it to the `<head>`:

```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: Test the live page**

```bash
# With bridge running and a setlist pushed:
# Open http://localhost:3000/live
# Press Space in bridge terminal → lyrics should appear
# Press B → page should fade to black
# Stop bridge (Ctrl+C) → page should show "Service not active"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/live/page.tsx
git commit -m "feat: /live online audience page with Convex realtime"
```

---

### Task 16: /monitor — online musician cue page

**Files:**
- Create: `src/app/monitor/page.tsx`

- [ ] **Step 1: Create src/app/monitor/page.tsx**

```tsx
'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export default function OnlineMonitorPage() {
  const session = useQuery(api.liveSession.get)
  const setlist = useQuery(api.liveSetlist.get)

  if (session === undefined || setlist === undefined) {
    return <div className="min-h-screen bg-[#111]" />
  }

  if (session === null) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <p className="text-white/20 text-sm uppercase tracking-widest">Bridge offline</p>
      </div>
    )
  }

  const curSong    = session.currentSong >= 0 ? setlist?.songs[session.currentSong] : null
  const curSection = curSong && session.currentSection >= 0 ? curSong.sections[session.currentSection] : null
  const nxtSong    = session.queuedSong >= 0 ? setlist?.songs[session.queuedSong] ?? null : null
  const nxtSection = nxtSong && session.queuedSection >= 0 ? nxtSong.sections[session.queuedSection] ?? null : null

  return (
    <div className="min-h-screen bg-[#111] text-[#f0ede8] flex flex-col">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-2 flex items-center gap-3 text-xs">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${session.mode === 'song' ? 'bg-[#1e3a5f] text-[#7eb8f7]' : 'bg-[#3a1e5f] text-[#b07ef7]'}`}>
          {session.mode}
        </span>
        {session.isLive && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#1e4a1e] text-[#7af07a]">LIVE</span>}
        {session.isBlackout && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#5f1e1e] text-[#f07a7a]">BLACKOUT</span>}
        <span className="font-semibold">{curSong?.title ?? '—'}</span>
        <span className="ml-auto opacity-50">
          {session.isLive && curSong
            ? `Song ${session.currentSong + 1}/${setlist?.songs.length} · Sec ${session.currentSection + 1}/${curSong.sections.length}`
            : 'Standby'}
        </span>
      </header>

      <main className="flex-1 p-3 flex flex-col gap-3 overflow-hidden">
        {!session.isLive ? (
          <div className="flex-1 flex items-center justify-center opacity-20 text-sm tracking-widest uppercase">
            Press GO to start service
          </div>
        ) : (
          <>
            {/* Current section */}
            <div className="flex-[3] bg-[#1a1a1a] border border-[#252525] rounded-lg p-4 overflow-auto">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#7eb8f7] mb-2">{curSection?.label}</div>
              <pre className="font-mono text-sm text-[#f0c060] whitespace-pre-wrap mb-2">{curSection?.chords ?? ''}</pre>
              <pre className="font-serif text-xl whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{curSection?.lyrics ?? ''}</pre>
            </div>

            {/* Next section */}
            <div className="flex-[1] bg-[#161616] border border-[#202020] rounded-lg p-3 overflow-hidden opacity-60">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1">
                NEXT — {nxtSection?.label ?? 'End of setlist'}
              </div>
              <pre className="font-mono text-xs text-[#f0c060] whitespace-pre-wrap">{nxtSection?.chords ?? ''}</pre>
              <pre className="font-serif text-sm whitespace-pre-wrap mt-1" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{nxtSection?.lyrics ?? '(end)'}</pre>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Test the online monitor page**

```bash
# With bridge running and setlist pushed:
# Open http://localhost:3000/monitor on a phone or second browser
# Press Space in bridge terminal → lyrics + chords should appear
# Verify current and next sections both update correctly
```

- [ ] **Step 3: Commit**

```bash
git add src/app/monitor/page.tsx
git commit -m "feat: /monitor online musician cue page with Convex realtime"
```

---

## End-to-End Test (MVP Checkpoint)

At this point the keyboard-controlled system is service-ready. Run through the full workflow:

- [ ] **Step 1: Push a setlist to Convex**
  1. `npm run dev` in the WMA project root
  2. Open a setlist at `/setlist/[id]`
  3. Click **Go Live** — button shows "✓ Live!"

- [ ] **Step 2: Start the bridge**
  ```bash
  cd bridge
  npm start
  ```
  Expected: bridge logs the setlist name and song count.

- [ ] **Step 3: Open all four outputs**
  - `localhost:8765/display` — fullscreen projector
  - `localhost:8765/monitor` — band monitor
  - `localhost:8765/emulator` — pedalboard LCD sim
  - `localhost:3000/live` — online audience

- [ ] **Step 4: Run through a service**
  | Action | Key | Expected |
  |--------|-----|----------|
  | Start service | Space | All pages show Verse 1 lyrics |
  | Next section | Space | All advance to next section |
  | Jump to song 2 | `2` then Space | Emulator highlights slot 2, GO jumps there |
  | Section mode | M | Emulator shows section names |
  | Jump to chorus | `2` then Space (section mode) | Jumps to section 2 of current song |
  | Blackout | B | Display fades to black |
  | Clear blackout | Space | Clears blackout without advancing |
  | End of setlist | Space until end | Emulator dims all slots, GO becomes no-op |
  | Standby | S | All pages return to standby/logo |

- [ ] **Step 5: Commit final test**
  ```bash
  git add -A
  git commit -m "feat: live lyrics control system — keyboard MVP complete"
  ```

---

## Phase 5 — MIDI Hardware (Future)

> Add `easymidi` to `bridge/package.json` and implement `InputSource.startMidi()` in `bridge/midi.ts`. Use Node v20 LTS. Requires Arduino Pro Micro with Control Surface firmware.

## Phase 6 — Polish (Future)

> Song title auto-slide (2s display before Verse 1), per-song background colors in `/display`, freeform announcement slides in the admin.
