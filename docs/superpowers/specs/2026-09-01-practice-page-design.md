# /practice — HUB Lawn Sept 13 chord & practice page

**Date:** 2026-09-01 · **Status:** approved pending review · **Event:** HUB Lawn worship night, Sept 13

## Purpose

A public, read-only, mobile-first page at **wmaac.org/practice** where the band
practices the student set: songs in running order, chords per song, and a person
picker that re-renders every chart for that player's instrument and capo
position. Doxology links to the existing `/doxology` acapella trainer.

## Set list (running order) and keys — DECIDED

| # | Song | Key | Lead | Notes |
|---|------|-----|------|-------|
| 1 | Doxology (chorus only) | **A** | Janae/Marco | Acapella. Key unchanged from the `/doxology` trainer (deliberately in A for outdoor voices — see `src/lib/music/arrangements/old100th.ts`). NOT Gb as on Janae's PDF. |
| 2 | Amazing! (mashup, part 1) | **E** | Janae/Grant | Whole step below the Gb record → vocal headroom (Gb was "a tiny bit high"). |
| 3 | Washed (mashup, part 2) | **E** | Marco | Same key as Amazing (mashup). 2 semitones below the practiced Gb — **verify not too low at rehearsal** (record is in B, so still far below original). |
| 4 | Peace Like A River | **G** | Marco | Marco's original; Janae's PDF chart is the source of truth (G/C/Em/D as written). |
| 5 | The Cost Is A Joy (SEU Worship) | TBD | TBD | Chart from Ultimate Guitar; key proposed at import to fit voices + flow after G. |
| 6 | I Have Decided To Follow Jesus | TBD | TBD | Same — many arrangements exist; pick version + key at import. |

### Transitions (printed on the page between songs)

- **Doxology → Amazing:** Doxology ends on the plagal Amen (D → held A). The A
  chord contains the note E; band swells in under the final Amen and lands
  Amazing's intro vamp (| E | E | Esus |). A is IV of E, so the entry is a second
  plagal cadence — sounds composed, not like a key change. Insurance outdoors:
  piano ghosts a quiet E pedal under the held Amen.
- **Amazing → Washed:** same key. Out of Amazing's tag the band drops out;
  Washed's first chorus is sung a cappella (as its chart marks), band re-enters
  on chorus 2. Acapella bookends inside the medley.

## Approach — songs as files in the repo (Approach A)

No Convex, no CMS. Each song is a typed data file, same spirit as
`old100th.ts`. The page is static content + client-side chord transformation.

### Components & data

- `src/lib/music/setlist/` — one file per song exporting a `PracticeSong`:
  metadata (title, artist, concertKey, tempo, lead, mashupGroup, sourceNote) and
  sections of `ChordLine`s (lyrics + positioned chords, **stored in concert
  key**) — reusing the existing `ChordLine` model.
- `src/lib/music/setlist/people.ts` — player config: id, display name,
  instrument, and default view per song context (e.g. Marco: acoustic, capo 4
  C-shapes in E / open in G; Grant: acoustic, capo 2 D-shapes in E so the two
  guitars don't stack identical voicings; Clair: piano, concert key with an
  optional "transpose keyboard −3, read G shapes" view for the E songs).
  Adding a player or changing a capo is a one-line edit.
- `src/lib/music/setlist/order.ts` — running order + transition notes.
- `src/app/practice/page.tsx` — renders order; Doxology renders as a slot card
  linking to `/doxology` (with the pivot note), mashup renders as one connected
  medley card.
- Chart component: chords above lyrics, monospace alignment, section labels
  (V1/CH/BR/TAG), per-song header (key, tempo, capo for the selected person).

### Person picker

Sticky at top: **Everyone (concert) · Marco · Grant · Clair**. Selection in
localStorage. Every chart also gets a manual capo/shape override dropdown
(computed via the existing `src/lib/chords/transposition.ts`). Person views are
pure client-side presentation — song data never changes.

### Data flow

Song file (concert key) → transposition lib (capo/shape math for selected
person or override) → chart component. No network beyond the static page.

### Error handling

Static typed data — main risk is wrong chords, mitigated by cross-checking
sources (below) and git review. Transposition lib already has tests/usage in the
setlist manager. If a TBD song's chart isn't ready, its card renders a
"chart coming" placeholder rather than breaking the page.

### Testing

- Unit: shape/capo mapping for the person views (E → capo 4 C-shapes, capo 2
  D-shapes; G → open) through the transposition lib.
- Manual: every chart proofread against source (UG/PDF); page checked on a phone.

## Chord data sourcing

- **Amazing, Washed:** clean versions fetched from Ultimate Guitar (Marco's Pro
  account, via claude-in-chrome), cross-checked against the SongSelect PDFs in
  the Drive folder, stored in E.
- **Peace Like A River:** transcribed from Janae's PDF (already clean).
- **The Cost Is A Joy, I Have Decided:** UG lookup; propose key before storing.
- **Doxology:** no chart needed on /practice (links to `/doxology`).

## Entry points

- **Unlisted**: no link from `/sept13` (that's the public promo page) or the
  site nav. The band gets the URL directly: `wmaac.org/practice`.

## Out of scope

- Editing UI, auth, Convex storage (the `/setlist` manager already serves that
  general need).
- Audio playback, autoscroll (nice-to-haves; not for this event).
- Re-pitching the `/doxology` trainer (staying in A).
