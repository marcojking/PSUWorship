# WMA Live — Desktop App Design Spec
*2026-05-25*

## Overview

Repackage the live lyrics control system as a single **Electron desktop app** ("WMA Live") that a volunteer can launch with one icon, plug into HDMI + a MIDI foot pedal, and run a worship service — **fully offline if needed**. It replaces the three-terminal dev setup (Convex dev + Next dev + Node bridge + browser windows) with one application.

Authoring stays on the website. The desktop app is a **runtime**: it reads existing setlists, lets the operator pick one, drives the projector/monitor locally, and optionally mirrors live state to Convex for online viewers (wmaac.org/live + /monitor).

### Goals
- One app to launch; no terminal, no Node process, no internet required in the room.
- Detect MIDI foot pedals; map buttons via a one-time MIDI Learn; keyboard always works as backup.
- Spawn Projector and Monitor windows, fullscreen on chosen displays.
- Read the operator's existing setlists, select one to run.
- Optionally broadcast live state to Convex when online (toggle).

### Non-goals
- No song/setlist *authoring* in the app (no editor, import, transpose). That stays on the website.
- No new lyric/slide logic — reuse the existing tested state machine and slide model.
- Auto-detecting which physical monitor is "the projector" is best-effort; the operator confirms placement.

---

## Architecture

Electron app, three window types, one shared state.

```
WMA Live (Electron)
│
├─ Main process
│    ├── window lifecycle + display placement (screen API)
│    ├── setlist cache on disk (userData/setlists.json)
│    ├── Convex client (read library; write live session/setlist when broadcasting)
│    └── IPC relay between windows
│
├─ Control window  (opens on launch)  ── operator console
│     • setlist picker (from cached library)
│     • 6 section/song buttons + GO / BACK / BLANK / TOGGLE (clickable)
│     • MIDI device detect + MIDI Learn; keyboard shortcuts
│     • "Open Projector" / "Open Monitor" buttons
│     • "Broadcast online" toggle + connection indicator
│     • OWNS the state machine
│
├─ Projector window (on demand)  ── audience lyrics (fullscreen on a display)
└─ Monitor window   (on demand)  ── band chords + next slide (fullscreen on a display)
```

### Why Electron over Tauri
Chromium guarantees solid **Web MIDI** and trivial **multi-window placement** (BrowserWindow + `screen.getAllDisplays()` → fullscreen on a target monitor). Tauri's smaller bundle isn't worth its fussier MIDI/multi-window story on Windows for show-critical software. Cost accepted: ~150 MB install and a packaged build to maintain.

### State + broadcast flow
The **Control window owns the state machine** (the existing pure `state.ts`). On each action (click / MIDI / key):
1. compute new state + `WSPayload` (existing `buildPayload`),
2. send payload to Projector + Monitor windows via IPC (relayed by main),
3. persist state to disk,
4. if "Broadcast online" is on AND connected, write session (and the active setlist) to Convex.

Projector/Monitor windows are **dumb renderers** — they receive a payload and draw it. This is the same contract the current `display.html` / `monitor.html` use, swapping the WebSocket for Electron IPC.

---

## Setlist selection (reads canonical Convex data)

**Depends on the Convex Data Migration sub-project** (songs + setlists live in Convex). The app reads the same `songs` / `setlists` tables the website writes — no separate sync table.

### App data flow + offline cache
- On launch (and on manual "Refresh"), if online the app pulls all `setlists` (+ the songs they reference) from Convex, builds slides locally via the shared `songToSlides` (applying each song's transposed key), and writes the result to `userData/setlists.json`.
- The picker reads from this local cache, so it works fully offline with whatever was last synced.
- Selecting a setlist loads it as the **active** setlist for the service (held in memory + persisted).

### Going "live" / online mirror
- Local projector/monitor run purely from the selected (cached, slide-built) setlist — no Convex needed.
- When "Broadcast online" is on and connected, the app pushes the **selected setlist** to the existing `liveSetlist` record and streams `liveSession` updates, so wmaac.org/live + /monitor mirror exactly what's on the local screens. Toggling off stops all network writes (fully local night). On quit / toggle-off, set the session to standby so online viewers don't see a frozen service.

---

## Input

- On launch, request Web MIDI access (in the Control renderer) and list devices; show connection status.
- **MIDI Learn:** for each action (Select 1–6, GO, BACK, BLANK, TOGGLE), the operator presses the corresponding pedal button once; the app records the incoming MIDI message signature (status + data1) and saves the mapping to disk. Works with any pedal.
- Incoming MIDI messages are matched against the saved mapping → emit the same `ButtonEvent`s the state machine already handles.
- **Keyboard** mirrors the current bridge mapping (Space/→ = GO, Backspace/← = BACK, 1–6 select, T toggle, B blank, S standby) and always works as a backup.

---

## Display management

- "Open Projector" / "Open Monitor" create fullscreen `BrowserWindow`s.
- The app enumerates displays (`screen.getAllDisplays()`); the operator assigns each window to a display (remembered for next time). Default heuristic: put the projector on the largest non-primary display.
- Windows can be closed and reopened freely; reopening re-sends the current payload so they catch up instantly.
- Blackout fades the projector (existing behavior); Monitor keeps showing chords during blackout.

---

## Reused components
- **State machine:** `bridge/state.ts` (pure, 45 tests) → shared module, unchanged logic. This is the heart and it already works.
- **Slide model:** shared `songToSlides` (`src/lib/live/slides.ts`) — the app builds slides locally from Convex songs/setlists when caching.
- **Views:** `display.html` / `monitor.html` → Electron renderers, WebSocket swapped for IPC.
- **Control surface:** the current `emulator.html` is promoted into the interactive Control console.
- **Convex tables:** existing `songs` / `setlists` (from the migration), `liveSetlist` / `liveSession` (online mirror). No new tables.

---

## Error handling
- Offline / Convex unreachable: app runs from cache; broadcast writes are skipped silently with a dimmed "offline" indicator; retried when reconnected.
- No setlist selected: Control shows a picker; Projector/Monitor show standby.
- No MIDI device: keyboard-only; Control shows "no pedal detected."
- Corrupt/missing cache: app starts with an empty picker and prompts to go online and refresh.
- Display unplugged: window falls back to the primary display rather than vanishing.

---

## Testing
- **State machine:** existing 45 vitest tests carry over unchanged (pure module).
- **Slide build / sync:** unit-test the website sync payload shape (slides round-trip).
- **MIDI mapping:** unit-test the match function (message signature → action) with sample MIDI bytes.
- **Manual show rehearsal:** launch app, select setlist, open both screens on real monitors, drive with keyboard + pedal, verify online mirror toggles correctly. (Requires the physical setup — operator-verified.)

---

## Build / packaging
- `electron` + `electron-builder` (or `electron-forge`) producing a Windows installer.
- Dev: `npm run app:dev` launches Electron against local files; `npm run app:build` packages the installer.
- The Electron app lives in its own folder (e.g. `desktop/`) with its own package.json, reusing shared TS modules.

---

## Open questions
1. Cache scope: cache all setlists on refresh, or only the ones the operator stars/selects? (Leaning: cache all — setlist text is small.)
2. Pedal: confirm the target MIDI pedal model when chosen, to verify it sends standard MIDI (most BLE/USB worship pedals do).
