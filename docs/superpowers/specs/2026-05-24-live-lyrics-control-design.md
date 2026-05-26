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
  currentSong:     number   // index into liveSetlist.songs; -1 = nothing live yet
  currentSection:  number   // index into current song's sections
  queuedSong:      number   // -1 = no queue (end of setlist / nothing queued)
  queuedSection:   number   // -1 = no queue
  isBlackout:      boolean
  isLive:          boolean  // false = standby screen shown
}
```

> **Sentinel convention**: `-1` means "no value" for any index field. `currentSong = -1` is the cold-start state (standby logo, nothing pushed live yet). `queuedSong = -1` means GO is a no-op. This is distinct from `liveSession.get` returning `null`, which means **the bridge is offline entirely** — the `/live` and `/monitor` pages must render these two states differently (standby slide vs. "service not running").

### Button Actions

| Button | Song Mode | Section Mode |
|--------|-----------|--------------|
| 1–6 | Set `queuedSong = i`, `queuedSection = 0` (ignored if `i >= setlist.songs.length`) | Set `queuedSection = i` within currentSong (ignored if `i >= currentSong.sections.length`) |

> **Bounds guards (required)**: every selection button press is validated against the current setlist before mutating state. A press that targets a song or section index that doesn't exist is a **no-op** — never set a queue to an out-of-range index, or GO will crash on `sections[undefined]`. In section mode, also no-op if `currentSong === -1` (nothing live yet).

> **Empty / missing setlist**: if no `liveSetlist` is loaded (`songs.length === 0`), all selection and GO presses are no-ops. The state machine must never index into an empty setlist. Pages show the standby slide.

> **Song mode 6-song limit**: buttons 1–6 map to songs 1–6 in the setlist. If the setlist has more than 6 songs, buttons always show songs 1–6. To reach songs 7+, the operator presses GO to advance normally — the emulator display shifts its window as the current song advances past index 5. This is a known constraint of the 6-button layout.
| MODE (7) | Toggle `mode` between `'song'` and `'section'` | same |
| BLACKOUT (8) | Toggle `isBlackout` | same |
| GO (9) | Advance to queued position (also brings the show live — see below) | same |

> **Going live / standby**: `isLive` starts `false` (standby logo). The **first GO** sets `isLive = true` and shows the first slide. To return to standby at the end of service, **hold GO for 1.5s** (long-press) → sets `isLive = false`, `currentSong = -1`. Long-press is detected in `midi.ts`/stdin by timing button-down to button-up; the keyboard fallback uses a dedicated key (`S`) since stdin can't easily measure hold duration. This is the only path that toggles `isLive` — there is no separate button.

### GO Logic
```
if setlist.songs.length == 0:       // nothing pushed
  no-op
elif isBlackout:
  isBlackout = false                // clear blackout, don't advance slide
elif queuedSong == -1:              // end of setlist, nothing queued
  no-op                             // slide stays on last section
else:
  isLive         = true             // first GO brings the show live
  currentSong    = queuedSong
  currentSection = queuedSection
  → auto-queue next:
      if currentSection + 1 < song.sections.length:
        queuedSection = currentSection + 1   // next section, same song
      else if currentSong + 1 < setlist.songs.length:
        queuedSong    = currentSong + 1      // next song, first section
        queuedSection = 0
      else:
        queuedSong = -1; queuedSection = -1  // end of setlist — GO becomes a no-op
```

> **End of setlist**: when `queuedSong == -1`, pressing GO is a no-op. The display stays on the last slide. The emulator shows all 6 slots dimmed.

### Keyboard Testing Map (dev mode, no MIDI device)
| Key | Action |
|-----|--------|
| 1–6 | Selection buttons 1–6 |
| M | MODE toggle |
| B | BLACKOUT |
| Space / Enter | GO (first press also goes live) |
| S | Return to standby (`isLive = false`) — keyboard equivalent of long-press GO |
| Ctrl+C | Quit cleanly (must be handled manually — see Bridge App) |

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
Only one `liveSession` document should exist at a time. The `update` mutation uses an upsert pattern: `db.query("liveSession").first()` → `db.patch` if it exists, `db.insert` if not. Convex mutations are serialized under OCC, so concurrent presses won't double-insert. The bridge always operates on the single session document. The same first-or-insert pattern applies to `liveSetlist`.

### New Convex Functions
- `api.liveSetlist.push` — mutation, replaces any existing liveSetlist document (singleton). Takes a `secret` arg checked against `LIVE_PUSH_SECRET` (Convex env var) — see Access Control.
- `api.liveSetlist.get` — query, returns the single active setlist (or null)
- `api.liveSession.update` — mutation, upserts the single session document
- `api.liveSession.get` — query, returns current session state (or null = bridge offline)

### Write Path Is Fire-and-Forget
Convex mutations are **best-effort and must never block the local broadcast**. On every button press the bridge does, in order: (1) compute new state, (2) broadcast over local WebSocket and `await` that, (3) call `liveSession.update` **without awaiting**, wrapped in `.catch(logAndContinue)`. If the internet is down or slow, the pedal must still feel instant on the HDMI outputs. Never `await` the Convex call in the press handler.

### Access Control
`/live` and `/monitor` on wmaac.org are publicly accessible read-only URLs — no auth. This is intentional: congregation and musicians open them without logging in.

The **write** mutations are a different risk. Because `NEXT_PUBLIC_CONVEX_URL` is public, anyone could call `liveSetlist.push` and overwrite the live setlist mid-service. `push` therefore requires a `secret` argument validated server-side against the `LIVE_PUSH_SECRET` Convex env var; the admin "Push to Live" button supplies it. `liveSession.update` is only ever called by the bridge (which holds the same secret) — gate it the same way. This is cheap and removes the only realistic griefing vector.

---

## Bridge App

### File Structure
```
bridge/
  package.json         Node.js project, ESM
  .env                 CONVEX_URL (the deployment URL), LIVE_PUSH_SECRET
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
  "easymidi": "^3.0.0",   // MIDI input — Phase 6 only; native (node-gyp) build, see note
  "ws": "^8.0.0",         // WebSocket server
  "convex": "latest",     // ConvexHttpClient imported from "convex/browser"
  "express": "^4.18.0"   // HTTP server + routing /display /monitor /emulator to HTML files
}
```

> **`easymidi` is a native module and a Windows build risk.** It wraps the `midi` package (node-gyp). Prebuilt binaries are Node-version-sensitive and can fail to install on this Windows laptop. Mitigations: (1) pin Node to **v20 LTS** in `.nvmrc`/`engines` from day one; (2) keep `easymidi` out of Phases 1–5 — install it only at Phase 6, so a failed native build can never block the keyboard-driven system that's already service-usable. No Convex deploy key is needed in the bridge: calling public mutations via `ConvexHttpClient` requires only `CONVEX_URL`. Do **not** put a `CONVEX_DEPLOY_KEY` on the show laptop — it can overwrite the entire backend.

### Startup Sequence
1. Load `liveSetlist` from Convex (or warn loudly if none pushed yet — do not crash; run with an empty setlist).
2. **Hydrate state from `liveSession.get`** if a session doc exists (recover position after a crash/restart). Only if none exists, cold-start with `currentSong=-1, currentSection=0, queuedSong=0, queuedSection=0, isLive=false`. State is also mirrored to a local `state.json` on every press as a fallback if Convex is unreachable at startup.
3. Start WebSocket server on port 8766. On `EADDRINUSE`, print a human message ("port 8766 busy — an old bridge is still running; close it and retry") and exit, rather than a raw stack trace.
4. Start HTTP server on port 8765 (same `EADDRINUSE` handling).
5. **Always start the keyboard (stdin) listener.** Additionally open MIDI input if a device is found. Both feed the same state machine, so a pedal that dies or unplugs mid-service has an instant manual backup — they are not mutually exclusive.
6. Register a `SIGINT`/`` handler that restores stdin and exits cleanly (see stdin note), and an `uncaughtException`/`unhandledRejection` handler that logs and keeps the process alive rather than dying mid-service.
7. Log: `Bridge ready. Open http://localhost:8765/display in Chrome → HDMI 1`

> **WebSocket connection handling (required):** on every new `ws` connection, immediately send the **current** state payload to that client. Without this, a page that loads or refreshes shows nothing until the next button press. Combined with client-side reconnect (see Local Pages), this makes a mid-service browser refresh or bridge restart self-healing.

> **stdin raw mode caveat:** capturing single keypresses needs `process.stdin.setRawMode(true)`, which disables the default Ctrl+C → SIGINT. You must watch for the `` byte and call `process.exit(0)` yourself, restoring `setRawMode(false)` first. Guard the whole thing with `process.stdin.isTTY` — `setRawMode` throws when there's no TTY (e.g. launched under a process manager without a console).

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
  songCount:     number,       // total songs — for monitor "song 2 of 5"
  sectionCount:  number,       // sections in current song — for "section 3 of 4"
  songNumber:    number,       // 1-based current song index, for display
  sectionNumber: number,       // 1-based current section index, for display
  buttonLabels:  string[],     // 6 labels for emulator display, context-aware
  setlistName:   string,
}
```

> The local pages have **only** the WebSocket — no Convex access. Every value a page needs to render must be in this payload. The monitor's "2 of 5 │ 3 of 4" header and the emulator's slot labels cannot be derived without `songCount`/`sectionCount`, so they're included here rather than expecting the page to hold the setlist.

---

## Local Pages

All served by the bridge HTTP server. These are standalone HTML files — no build step, no framework.

> **Auto-reconnect is mandatory on all three pages.** Each page wraps its WebSocket in a reconnect loop: on `onclose` or `onerror`, wait ~1s and open a fresh `WebSocket`. Without this, a single bridge restart freezes every HDMI output permanently — the most common live-show failure. Because the bridge sends current state on connect (see Bridge App), reconnection silently restores the correct slide. While disconnected, `/display` should hold the last slide (not blank) so a brief blip is invisible to the audience.

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
- `src/app/live/page.tsx` — Online audience view. Subscribes to `liveSession` + `liveSetlist` via Convex. Displays current lyrics fullscreen. Three distinct states: (1) `liveSession.get === null` → **bridge offline** ("service not running"); (2) session exists but `isLive === false` → **standby** (WM&A logo, "starting soon"); (3) `isLive === true` → current slide. Don't collapse offline and standby into one screen.
- `src/app/monitor/page.tsx` — Online musician cue view. Same layout as local `/monitor` page, Convex-backed.

### Admin Changes
- `src/app/setlist/[id]/page.tsx` — Add **"Push to Live"** button in the setlist detail view.
  - Reads setlist + songs from IndexedDB
  - Converts each section to `{ lyrics, chords }` (see below)
  - Calls `api.liveSetlist.push` mutation with the `LIVE_PUSH_SECRET`
  - Applies the setlist's `transposedKey` before pushing, so the live chords match what the band rehearsed
  - Shows confirmation toast

> **Chord conversion is the most underestimated task in this spec — budget real time for it.** The app stores chords as `ChordLine` = `{ lyrics: string, chords: ChordPosition[] }` where each `ChordPosition` is `{ chord, position }` indexed into the lyric string (see `src/lib/db` / CLAUDE.md). The `/monitor` chord chart needs **inline ChordPro** (`[G]Amazing [D]grace`). Producing that means walking each lyric line and splicing `[chord]` markers in at the recorded character offsets, sorting positions ascending, and handling chords whose position is past end-of-line (trailing chords). Write this as a pure function `chordLineToChordPro(line: ChordLine): string` with a unit test against at least one known multi-line song before wiring the button. The plain-`lyrics` field is just the raw lyric strings joined by newline. Apply transposition to the chord names during this conversion, not after.

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
| **1 — Foundation** | Convex tables + mutations/queries with `secret` gating. `liveSetlist.push`/`get`, `liveSession.update`/`get`. Singleton first-or-insert. |
| **2 — Bridge core** | `state.ts` (pure state machine incl. all bounds guards, `-1` sentinels, empty-setlist no-ops). `midi.ts` (keyboard-first, always-on stdin, raw-mode + Ctrl+C handling). `server.ts` (WebSocket + HTTP, **send-state-on-connect**, `EADDRINUSE` handling). `display.html`/`monitor.html` wired to WebSocket **with auto-reconnect**. |
| **3 — Integration** | Bridge hydrates from `liveSession` on startup + `state.json` mirror. Fire-and-forget Convex writes on state change. `/live` and `/monitor` Vercel pages subscribe to Convex (offline / standby / live states). |
| **4 — Admin** | "Push to Live" button + `chordLineToChordPro()` conversion **with a unit test** + transposition applied. |
| **5 — Emulator** | `emulator.html` — pedalboard LCD simulation. |
| **6 — MIDI hardware** | Install `easymidi` (pin Node v20), test with real Arduino Pro Micro + footswitches, long-press GO for standby. |
| **7 — Polish** | Song title auto-slide, per-song background colors, freeform announcement slides. |

> **Load-bearing, not polish**: send-state-on-connect + auto-reconnect (Phase 2) and `chordLineToChordPro` (Phase 4) look small but are the things that break the show or block `/monitor` if skipped. Do not defer them into Phase 7. A keyboard-driven system is fully service-usable at the end of Phase 4; Phases 5–7 are genuinely optional.


---

# v2 Addendum — Slide-Centric Rework (2026-05-25)

**Problem with v1:** the projector page = a whole section (verse/chorus). Too much text on one screen for a worship room. Operator had no BACK button and no way to control how much shows per page.

## What changes

### 1. Slide layer
A **slide** is a chunk of contiguous lyric lines within a section. Sections auto-split into slides at **~10 words** (whole lines stay intact — never split mid-line). Manual overrides are stored on `Section.slideBreaks?: number[]` (line indices where a new slide begins). Slides are computed at **push time** (Next.js) and stored flat in Convex; the bridge and online viewers just navigate the slide arrays.

### 2. Navigation = slide-centric
`BridgeState` tracks `currentSong/currentSlide` + `queuedSong/queuedSlide`. Navigation flows slide-by-slide across the whole setlist (end of song's slides → next song slide 0).

### 3. Controller = 10 buttons
- **Top 6:** selection. `TOGGLE` flips them between SONG mode (jump to songs 1–6) and SLIDE mode (jump to slides 1–6 of the current song).
- **Bottom 4:** GO (take queued live, advance queue), BACK (step live back one slide immediately), BLANK (blackout toggle), TOGGLE (mode).

### 4. State transitions
- `applyGo`: clears blackout if set; else promotes queued→current, sets isLive, auto-queues next slide; no-op at end.
- `applyBack`: if live, moves current back one slide (across song boundaries) and re-displays it immediately; queue = slide after. No-op at first slide / standby.
- `applySelection(i)`: song mode → queue song i slide 0; slide mode → queue slide i of current song.
- `applyToggle` / `applyBlackout` / `applyStandby`: unchanged in spirit.

### 5. Transposition fix
Slides are built with chords transposed to the setlist's display key (v1 pushed untransposed chords).

### 6. Slide-break editor
`SlidePreview` component renders computed slides for each song in the setlist detail page; clicking a divider between lines toggles a manual break (saved to the Song).
