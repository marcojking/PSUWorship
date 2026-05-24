# Live Lyrics Control System — Design Spec
*2026-05-24*

## Overview

A foot-pedal-driven lyrics control system for WM&A worship services. One button advances the current slide simultaneously on the main projector, a band confidence monitor, and the wmaac.org/live page for online viewers. Musicians get a chord-aware cue view. Everything runs offline-capable locally; Convex syncs online viewers when internet is available.

---

## System Architecture

```
Show Laptop
│
├─ Bridge App (Node.js, `node index.js`)
│   ├── MIDI input (USB foot pedal)  ─┐
│   ├── Keyboard fallback (stdin) ────┤──► State Machine
│   │                                  │       │
│   │                                  │       ├──► WebSocket broadcast  (ws://localhost:8766)
│   │                                  │       └──► Convex mutation      (liveSession update)
│   │
│   └── HTTP server (http://localhost:8765)
│         GET /display    → fullscreen audience lyrics page
│         GET /monitor    → band confidence monitor page
│         GET /emulator   → pedalboard LCD emulator (dev only)
│
├─ Chrome → localhost:8765/display  → HDMI out 1 → Main Projector (audience)
├─ Chrome → localhost:8765/monitor  → HDMI out 2 → Confidence Monitor (band)
└─ Chrome → localhost:8765/emulator → Dev window  → Pedalboard LCD sim
                    │
              Convex Cloud
                    │
       ┌────────────┴────────────┐
       wmaac.org/live            wmaac.org/monitor
       (online audience)         (musicians on WiFi)
```

### Key Properties
- Local HDMI outputs work with **zero internet** — driven by local WebSocket
- Convex sync is best-effort — if internet drops, HDMI and local WiFi keep working
- Bridge is a single terminal command; no Electron, no GUI required
- Any class-compliant USB MIDI device works as the foot pedal (Arduino Pro Micro, commercial controller, etc.)

---

## Hardware

### MVP (keyboard testing)
- No hardware needed. Bridge reads keyboard input from stdin as button simulation.

### Production Foot Pedal
- **Controller**: Arduino Pro Micro (ATmega32u4) — required for native USB MIDI. NOT compatible with Arduino Uno/Mega.
- **Buttons**: 9 momentary footswitches
- **Circuit**: Each switch → GPIO pin + GND. Use `INPUT_PULLUP` on all pins. No resistors needed.
- **Firmware**: Arduino `Control Surface` library — handles debouncing and USB MIDI automatically.
- **Display (v2)**: Pi Pico W or ESP32 + 2.4" TFT LCD. Display updates via local WebSocket. Buttons still send USB MIDI (reliable even if WiFi drops).

### Button Layout
```
[1][2][3][4][5][6]   [MODE]   [BLACKOUT]   [GO]
 ←── wide display panel ──→
```

---

## State Machine

### State Shape
```typescript
interface BridgeState {
  mode:            'song' | 'section'
  currentSong:     number   // index into liveSetlist.songs
  currentSection:  number   // index into current song's sections
  queuedSong:      number
  queuedSection:   number
  isBlackout:      boolean
  isLive:          boolean  // false = standby screen shown
}
```

### Button Actions

| Button | Song Mode | Section Mode |
|--------|-----------|--------------|
| 1–6 | Set `queuedSong = i`, `queuedSection = 0` | Set `queuedSection = i` (within currentSong) |

> **Song mode 6-song limit**: buttons 1–6 map to songs 1–6 in the setlist. If the setlist has more than 6 songs, buttons always show songs 1–6. To reach songs 7+, the operator presses GO to advance normally — the emulator display shifts its window as the current song advances past index 5. This is a known constraint of the 6-button layout.
| MODE (7) | Toggle `mode` between `'song'` and `'section'` | same |
| BLACKOUT (8) | Toggle `isBlackout` | same |
| GO (9) | Advance to queued position | same |

### GO Logic
```
if isBlackout:
  isBlackout = false         // clear blackout, don't advance slide
else:
  currentSong    = queuedSong
  currentSection = queuedSection
  → auto-queue next:
      if currentSection + 1 < song.sections.length:
        queuedSection = currentSection + 1   // next section, same song
      else if currentSong + 1 < setlist.songs.length:
        queuedSong    = currentSong + 1      // next song, first section
        queuedSection = 0
      else:
        queued = null                        // end of setlist — GO does nothing, slide stays
```

> **End of setlist**: when queued is null, pressing GO is a no-op. The display stays on the last slide. The emulator shows all 6 slots dimmed.

### Keyboard Testing Map (dev mode, no MIDI device)
| Key | Action |
|-----|--------|
| 1–6 | Selection buttons 1–6 |
| M | MODE toggle |
| B | BLACKOUT |
| Space / Enter | GO |

---

## Convex Schema Additions

Two new tables added to `convex/schema.ts`. Existing IndexedDB setlist system is unchanged.

### `liveSetlist`
Snapshot of the active setlist pushed from the WMA admin before service. Bridge subscribes and reloads when this changes.

```typescript
liveSetlist: defineTable({
  name:     v.string(),
  pushedAt: v.number(),
  songs: v.array(v.object({
    title:  v.string(),
    key:    v.optional(v.string()),
    sections: v.array(v.object({
      type:   v.string(),   // 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'tag' | 'intro' | 'outro'
      label:  v.string(),   // 'Verse 1', 'Chorus', 'Bridge' — shown on monitor + emulator
      lyrics: v.string(),   // plain text — shown on /display and /live
      chords: v.string(),   // raw ChordPro string — rendered as chord chart on /monitor
    }))
  }))
})
```

### `liveSession`
Current bridge state. Updated on every button press. Subscribed to by `/live` and `/monitor` Vercel pages.

```typescript
liveSession: defineTable({
  currentSong:    v.number(),
  currentSection: v.number(),
  queuedSong:     v.number(),
  queuedSection:  v.number(),
  mode:           v.union(v.literal('song'), v.literal('section')),
  isBlackout:     v.boolean(),
  isLive:         v.boolean(),
  updatedAt:      v.number(),
})
```

### Singleton Pattern for `liveSession`
Only one `liveSession` document should exist at a time. The `update` mutation uses an upsert pattern: fetch all documents, replace if exists, insert if empty. The bridge always operates on the single latest session document.

### New Convex Functions
- `api.liveSetlist.push` — mutation, replaces any existing liveSetlist document (singleton)
- `api.liveSetlist.get` — query, returns the single active setlist (or null)
- `api.liveSession.update` — mutation, upserts the single session document
- `api.liveSession.get` — query, returns current session state (or null = bridge offline)

### Access Control
`/live` and `/monitor` on wmaac.org are publicly accessible URLs — no auth. This is intentional: congregation members and musicians should be able to open them without logging in. The "Push to Live" button in the admin is not protected beyond being in the `/setlist` admin UI.

---

## Bridge App

### File Structure
```
bridge/
  package.json         Node.js project, ESM
  .env                 CONVEX_URL, CONVEX_DEPLOY_KEY
  index.ts             Entry point — wires all modules together
  midi.ts              easymidi listener + keyboard stdin fallback
  state.ts             State machine — pure functions, no I/O
  server.ts            HTTP server (serves HTML pages) + WebSocket server
  convex.ts            ConvexHttpClient wrapper, mutation helpers
  pages/
    display.html       Fullscreen audience lyrics
    monitor.html       Band confidence monitor
    emulator.html      Pedalboard LCD emulator
```

### Dependencies
```json
{
  "easymidi": "^3.0.0",   // MIDI input — Node v20 LTS required, pre-built binaries
  "ws": "^8.0.0",         // WebSocket server
  "convex": "latest",     // ConvexHttpClient imported from "convex/browser"
  "express": "^4.18.0"   // HTTP server + routing /display /monitor /emulator to HTML files
}
```

### Startup Sequence
1. Load `liveSetlist` from Convex (or warn if none pushed yet)
2. Initialize state machine with `currentSong=0, currentSection=0, queuedSong=0, queuedSection=0`
3. Start WebSocket server on port 8766
4. Start HTTP server on port 8765
5. Open MIDI input (if device found) or fall back to keyboard
6. Log: `Bridge ready. Open http://localhost:8765/display in Chrome → HDMI 1`

### WebSocket Message Format
Bridge broadcasts JSON on every state change:

```typescript
{
  type: 'state',
  state: BridgeState,
  currentLyrics: string,       // plain text of current section
  currentChords: string,       // ChordPro of current section
  currentLabel:  string,       // 'Verse 1'
  currentSongTitle: string,
  nextLyrics:    string | null,
  nextChords:    string | null,
  nextLabel:     string | null,
  nextSongTitle: string | null,
  buttonLabels:  string[],     // 6 labels for emulator display, context-aware
  setlistName:   string,
}
```

---

## Local Pages

All served by the bridge HTTP server. These are standalone HTML files — no build step, no framework.

### `/display` — Audience Projector (HDMI 1)
- **Font**: Cormorant Garamond (WMA design system), large (~10vw)
- **Background**: Dark (`#0a0a0a` default, per-song color in v2)
- **Transitions**: CSS crossfade (300ms) between sections
- **Song title slide**: Auto-shown for 2s before Verse 1 of each song
- **Blackout**: CSS `opacity: 0` fade on body — instant, reversible
- **Standby**: When `isLive = false`, shows WM&A logo centered

### `/monitor` — Band Confidence Monitor (HDMI 2)
Layout:
```
┌─────────────────────────────────────────────────────┐
│  [Song: Amazing Grace]  [CHORUS]         [2 of 5 │ 3 of 4]  │
├─────────────────────────────────────────────────────┤
│                                                       │
│   [G]Amazing [D]grace how [Em]sweet the [C]sound    │  ← chord chart
│   Amazing grace how sweet the sound                 │  ← lyrics
│   That saved a wretch like me                       │
│                                                       │
├─────────────────────────────────────────────────────┤
│  NEXT: [BRIDGE]                                      │
│  [G]Through many [D]dangers...   (smaller, dimmed)  │
└─────────────────────────────────────────────────────┘
│  MODE: SONG ●  BLACKOUT: OFF                         │
└─────────────────────────────────────────────────────┘
```

### `/emulator` — Pedalboard LCD Emulator (Dev Window)
- Pixel-accurate mockup of the hardware TFT display under 6 buttons
- Shows 6 labeled slots, updates on mode toggle
- Highlighted slot = currently queued button (yellow border)
- Below buttons: MODE badge, QUEUED indicator, current song/section
- Used during development only — not opened on show day

---

## WMA Website Additions

### New Pages
- `src/app/live/page.tsx` — Online audience view. Subscribes to `liveSession` + `liveSetlist` via Convex. Displays current lyrics fullscreen. Shows "not live" state when bridge is offline (`isLive = false`).
- `src/app/monitor/page.tsx` — Online musician cue view. Same layout as local `/monitor` page, Convex-backed.

### Admin Changes
- `src/app/setlist/[id]/page.tsx` — Add **"Push to Live"** button in the setlist detail view.
  - Reads setlist + songs from IndexedDB
  - Strips ChordLine objects to plain lyrics text + raw ChordPro string
  - Calls `api.liveSetlist.push` mutation
  - Shows confirmation toast

---

## Pre-Service Workflow

1. Build the setlist in WMA as normal (`/setlist`)
2. Open the setlist detail page → click **Push to Live**
3. On the show laptop: `cd bridge && node index.js`
4. Open Chrome, navigate to `localhost:8765/display` → drag to HDMI 1 → F11
5. Open Chrome, navigate to `localhost:8765/monitor` → drag to HDMI 2 → F11
6. (Dev) Open `localhost:8765/emulator` in a browser window on your screen
7. Plug in foot pedal (or use keyboard shortcuts)
8. Test: press Space → first slide appears on all outputs
9. Service starts

---

## Development Phases

| Phase | What ships |
|-------|-----------|
| **1 — Foundation** | Convex tables + mutations/queries. `liveSetlist.push` mutation. Basic schema. |
| **2 — Bridge core** | `state.ts` (pure state machine), `midi.ts` (keyboard fallback first), `server.ts` (WebSocket + HTTP). `display.html` and `monitor.html` wired to WebSocket. |
| **3 — Integration** | Bridge writes to Convex on state change. `/live` and `/monitor` Vercel pages subscribe to Convex. |
| **4 — Admin** | "Push to Live" button in WMA setlist admin. |
| **5 — Emulator** | `emulator.html` — pedalboard LCD simulation. |
| **6 — MIDI hardware** | Test with real Arduino Pro Micro + footswitches. |
| **7 — Polish** | Song title auto-slide, per-song background colors, freeform announcement slides. |
