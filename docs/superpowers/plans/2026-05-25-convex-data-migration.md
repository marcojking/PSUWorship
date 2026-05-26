# Convex Data Migration Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Convex the single source of truth for songs + setlists, rewire the website off Dexie/Airtable, migrate existing data, with the site fully working throughout.

**Architecture:** Add additive Convex tables + functions first (nothing breaks), migrate Dexie data into Convex via an in-browser page, then flip each page group from Dexie helpers to Convex `useQuery`/`useMutation`, then delete Dexie + Airtable. Ids change from numeric to Convex string ids.

**Tech Stack:** Convex, Next.js 16 App Router, TypeScript, vitest (Convex fn tests via convex-test or thin unit tests).

---

## Sequencing principle
The site keeps working until the final flip. Tables/functions are additive; the migration page is additive; only the page rewire changes behavior; deletion is last.

---

### Task 1: Convex schema — songs + setlists tables

**Files:** Modify `convex/schema.ts`

- [ ] Add `songs` table: title, artist, key, sections (array of {type:string, label:string, lines:[{lyrics, chords:[{chord, position}]}], slideBreaks: optional number[]}), createdAt:number, updatedAt:number. Index `by_title`.
- [ ] Add `setlists` table: name, date, time, location, bibleVerse(optional), songs:[{songId: v.id('songs'), transposedKey: optional, order:number}], createdAt, updatedAt. Index `by_date`.
- [ ] Deploy: `npx convex dev --once`. Expected: schema deploys clean (additive).

### Task 2: Convex functions — songs.ts

**Files:** Create `convex/songs.ts`

- [ ] `list` query → all songs ordered by title.
- [ ] `get({ id })` query.
- [ ] `create({title, artist, key, sections})` mutation → set createdAt/updatedAt, return id.
- [ ] `update({id, ...patch})` mutation → set updatedAt.
- [ ] `remove({id})` mutation.
- [ ] Deploy + smoke test via a throwaway script (create→get→update→remove).

### Task 3: Convex functions — setlists.ts

**Files:** Create `convex/setlists.ts`

- [ ] `list` query → newest first (by date desc).
- [ ] `get({id})` query.
- [ ] `getWithSongs({id})` query → returns `{ setlist, songs: (song + transposedKey)[] }` ordered by setlistSong.order, skipping missing songs. Mirrors old `getSetlistWithSongs`.
- [ ] `create`, `update`, `remove` mutations.
- [ ] Deploy + smoke test round-trip incl. getWithSongs join/order.

### Task 4: Shared types module

**Files:** Modify `src/lib/db/index.ts` (or new `src/lib/types.ts`)

- [ ] Keep `Song`, `Section`, `ChordLine`, `ChordPosition`, `Setlist`, `SetlistSong` interfaces but change id fields to `Id<'songs'>`/`Id<'setlists'>` where they appear (`Song.id`, `Setlist.id`, `SetlistSong.songId`). Keep Dexie code temporarily (removed in Task 9).
- [ ] Export an `api`-typed convex client helper if useful.

### Task 5: Migration page

**Files:** Create `src/app/setlist/migrate/page.tsx`

- [ ] `'use client'` page. Reads all Dexie songs+setlists. For each song → `api.songs.create`, build `oldId(number) → newId(Id)` map. For each setlist → remap `songs[].songId`, `api.setlists.create`.
- [ ] Guard double-run: check `api.songs.list` already non-empty OR a localStorage flag `wma-migrated`; show "already migrated" if so.
- [ ] Show progress (n/total) + final counts + "done" state. Manual trigger button.

### Task 6: Rewire songs library + song pages

**Files:** Modify `setlist/songs/page.tsx`, `songs/[id]/page.tsx`, `songs/[id]/edit/page.tsx`, `songs/create/page.tsx`

- [ ] Replace Dexie helpers with `useQuery(api.songs.*)` / `useMutation`. Drop `parseInt(id)` — use string id as `Id<'songs'>`.
- [ ] Verify create / edit / delete / view flows compile + typecheck.

### Task 7: Rewire import

**Files:** Modify `setlist/songs/import/page.tsx`

- [ ] Parsers unchanged; replace `addSong` with `api.songs.create`.

### Task 8: Rewire setlist pages

**Files:** Modify `setlist/page.tsx`, `setlist/[id]/page.tsx`, `setlist/[id]/edit/page.tsx`, `setlist/create/page.tsx`, `setlist/[id]/perform/page.tsx`

- [ ] `setlist/page.tsx` → `useQuery(api.setlists.list)`.
- [ ] `setlist/[id]/page.tsx` → `useQuery(api.setlists.getWithSongs)`; key change / remove / reorder / slide-break edits → mutations; "Go Live" push unchanged (still `songToSlides` + `api.liveSetlist.push`).
- [ ] edit / create / perform → Convex.
- [ ] Typecheck + `npm run build` clean.

### Task 9: Retire Dexie + Airtable

**Files:** Delete `src/lib/db/sync.ts`, `src/lib/airtable/*`; clean `src/lib/db/index.ts` to types-only; remove `dexie` dep.

- [ ] Grep for remaining imports of removed modules; fix.
- [ ] `npm run build` clean. Manual click-through of the whole setlist module against Convex.

### Task 10: Verify + commit + push

- [ ] Typecheck, build, manual smoke. Commit in logical chunks throughout; final push.

---

## Self-review notes
- Ids: every numeric-id assumption (`parseInt`, `song.id!` as number) must become string Convex ids. Audit during Tasks 6–8.
- `getWithSongs` must preserve order + skip missing songs (parity with old behavior).
- Keep the live system (`liveSetlist`/`liveSession`, slide build, bridge) untouched — it already works.
- Migration must be idempotent / guarded to avoid duplicate songs.
