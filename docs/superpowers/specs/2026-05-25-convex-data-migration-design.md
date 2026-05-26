# Convex Data Migration Design Spec
*2026-05-25*

## Overview

Move the worship song/setlist data from the website's local IndexedDB (Dexie) + Airtable sync to **Convex as the single source of truth**. The website reads/writes Convex directly (real-time), and the future WMA Live desktop app reads the same data. Retire Dexie and Airtable.

This is the **foundation** sub-project. It ships on its own: when done, the website works exactly as before but backed by Convex, online. The desktop app (separate spec) builds on top.

### Goals
- Songs and setlists live in Convex; one schema, real-time across devices.
- Website pages use Convex queries/mutations instead of Dexie helpers.
- One-time, in-browser migration moves existing IndexedDB data into Convex with no loss.
- Remove the Airtable sync and the Dexie layer once migrated.

### Non-goals
- No changes to the song parsers (Ultimate Guitar / lyrics / chordpro / PDF) — they still output `Section[]`.
- No changes to slide-building logic (`songToSlides`) — still runs client-side at push time.
- No offline support on the website (it becomes online-only; offline lives in the desktop app's cache).

### Accepted tradeoff
The website now requires internet to author. This was explicitly approved — local-first authoring is given up in exchange for one shared store.

---

## Data model

Mirror the existing TS interfaces (`src/lib/db/index.ts`) as Convex tables. Numeric Dexie ids become Convex document ids.

```
songs: {
  title: string
  artist: string
  key: string
  sections: Array<{
    type: string           // 'verse' | 'chorus' | ... (kept as string in Convex)
    label: string
    lines: Array<{ lyrics: string; chords: Array<{ chord: string; position: number }> }>
    slideBreaks?: number[]
  }>
  createdAt: number
  updatedAt: number
}  // index by_title

setlists: {
  name: string
  date: string
  time: string
  location: string
  bibleVerse?: string
  songs: Array<{ songId: Id<'songs'>; transposedKey?: string; order: number }>
  createdAt: number
  updatedAt: number
}  // index by_date
```

The existing `liveSetlist` / `liveSession` tables stay as-is (they carry built slides + live state for online viewers).

### Shared TS types
Keep `Song`, `Section`, `ChordLine`, `ChordPosition`, `Setlist`, `SetlistSong` as TS interfaces in a types module, but ids become Convex `Id<'songs'>` / `Id<'setlists'>` (strings) instead of `number`. Route params (`[id]`) are already strings — drop the `parseInt` calls.

---

## Convex functions

`convex/songs.ts`
- `list` — all songs ordered by title
- `get({ id })`
- `create({ ...song })` → returns id
- `update({ id, ...patch })`
- `remove({ id })`

`convex/setlists.ts`
- `list` — all setlists, newest first
- `get({ id })`
- `getWithSongs({ id })` — setlist plus its songs joined and ordered (replaces `getSetlistWithSongs`), returning `{ setlist, songs: (Song & { transposedKey? })[] }`
- `create`, `update`, `remove`

These replace the helpers in `src/lib/db/index.ts`.

---

## Website rewire

Swap Dexie calls for Convex `useQuery` / `useMutation` across the setlist module (all `'use client'`):

- `setlist/page.tsx` (dashboard) — `useQuery(api.setlists.list)`
- `setlist/[id]/page.tsx` — `useQuery(api.setlists.getWithSongs)`; key change, song removal, reorder, slide-break edits become mutations; "Go Live" push unchanged (still builds slides via `songToSlides`)
- `setlist/[id]/edit/page.tsx`, `setlist/create/page.tsx`
- `setlist/songs/page.tsx` (library), `songs/[id]/page.tsx`, `songs/[id]/edit/page.tsx`, `songs/create/page.tsx`
- `setlist/songs/import/page.tsx` — parsers unchanged; `addSong` → `api.songs.create`
- `setlist/[id]/perform/page.tsx` — reads via Convex

Reactivity is a bonus: pages that manually `useEffect`+`await` become live `useQuery`.

---

## One-time migration

An in-browser migration (a `/setlist/migrate` page or a guarded button on the dashboard), run once while online:
1. Read all songs from Dexie; for each, `api.songs.create`, recording `oldNumericId → newConvexId`.
2. Read all setlists from Dexie; for each, remap `songs[].songId` via the id map, then `api.setlists.create`.
3. Show progress + a final count; guard against double-runs (e.g. skip if Convex already has songs, or mark a localStorage flag).

After the user confirms their data is present in Convex, the Dexie/Airtable code is removed in a follow-up step.

---

## Retire Dexie + Airtable
- Remove `src/lib/db/sync.ts` (Airtable sync) and `src/lib/airtable/*`.
- Remove the Dexie `WorshipDB` class and helper functions from `src/lib/db/index.ts`; keep only the shared TS interfaces (or move them to `src/lib/types.ts`).
- Drop `dexie` from dependencies. Remove Airtable env vars from docs.

---

## Error handling
- Convex unreachable: pages show a loading/empty state (standard `useQuery === undefined`); no silent data loss since there's no local write buffer.
- Migration partial failure: it's idempotent per-record where possible; re-running skips already-created songs (matched by title+artist+createdAt or the localStorage flag).
- Setlist referencing a missing song id: `getWithSongs` skips missing songs (same as today).

---

## Testing
- Convex function units: create→get→update→remove round-trips for songs and setlists; `getWithSongs` ordering + join.
- Migration: dry-run against a seeded Dexie snapshot in a browser; verify counts and that setlist→song references resolve.
- Manual: full click-through of the setlist module (create song, import, build setlist, transpose, slide breaks, Go Live) against Convex.

---

## Open questions
1. Migration entry point: a dedicated `/setlist/migrate` page vs a one-time banner on the dashboard? (Leaning: dedicated page, linked once.)
2. Keep `artist` and `location`/`time`/`bibleVerse` exactly as-is (yes — no schema cleanup in this pass).
3. Do we need per-user separation, or is this a single shared club library? (Assume single shared library — matches current Airtable usage.)
