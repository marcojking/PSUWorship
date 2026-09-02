# /practice Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unlisted public page at wmaac.org/practice showing the HUB Lawn Sept 13 set in running order with per-person capo/shape chord views.

**Architecture:** Static typed song data files (concert key) in `src/lib/music/setlist/`, transformed client-side through the existing `src/lib/chords/transposition.ts` into per-player capo shapes, rendered by a chart component on a single `'use client'` page. No Convex, no auth.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind (site theme), vitest (new, root-level, for the shapes module only).

## Global Constraints

- Page is UNLISTED: no link from `/sept13`, no link in `SiteNav.tsx`.
- Keys are locked per spec: Doxology A (link only, no chart), Amazing E, Washed E, Peace Like A River G. The Cost Is A Joy and I Have Decided To Follow Jesus TBD → placeholder card until content task completes.
- Running order: Doxology → Amazing → Washed (Amazing/Washed are one mashup card) → Peace Like A River → The Cost Is A Joy → I Have Decided To Follow Jesus.
- Reuse `ChordLine`/`ChordPosition`/`Section` types from `src/lib/db/index.ts` and `transposeChord`/`transposeChordToKey` from `src/lib/chords/transposition.ts`. Do not fork chord math.
- Mobile-first, readable in sunlight: base text ≥16px, chords bold, high contrast with site theme colors (cream #fff7eb, navy #003049, rust #b45741, blue-grey #7fa0af).
- Content tasks marked **[MAIN SESSION]** need Marco's browser (Ultimate Guitar Pro via claude-in-chrome) and must NOT be dispatched to subagents.

## File Structure

- `src/lib/music/setlist/shapes.ts` — capo/shape math (new, tested)
- `src/lib/music/setlist/shapes.test.ts` — vitest tests
- `src/lib/music/setlist/types.ts` — `PracticeSong`, `PlayerView`, `SetEntry`
- `src/lib/music/setlist/people.ts` — player config (Marco/Grant/Clair)
- `src/lib/music/setlist/songs/peaceLikeARiver.ts` — chart data (G)
- `src/lib/music/setlist/songs/amazing.ts` — chart data (E)
- `src/lib/music/setlist/songs/washed.ts` — chart data (E)
- `src/lib/music/setlist/songs/theCostIsAJoy.ts` — chart data (key TBD at content task)
- `src/lib/music/setlist/songs/iHaveDecided.ts` — chart data (key TBD at content task)
- `src/lib/music/setlist/order.ts` — running order + transition notes
- `src/components/practice/ChordChartView.tsx` — chords-above-lyrics renderer
- `src/components/practice/SongCard.tsx` — song/mashup/link/placeholder cards + capo override
- `src/app/practice/page.tsx` — the page (person picker, order render)

---

### Task 1: Vitest setup + shapes module

**Files:**
- Modify: `package.json` (add vitest devDependency + `"test": "vitest run"` script)
- Create: `vitest.config.ts`
- Create: `src/lib/music/setlist/shapes.ts`
- Test: `src/lib/music/setlist/shapes.test.ts`

**Interfaces:**
- Consumes: `transposeChord(chord, semitones, targetKey?)` from `src/lib/chords/transposition.ts`
- Produces: `shapeKeyFor(concertKey: string, capo: number): string`, `displayChord(chord: string, capo: number, concertKey: string): string`, `capoLabel(capo: number): string`

- [ ] **Step 1: Install vitest and add config**

```bash
npm install -D vitest
```

Add to `package.json` scripts: `"test": "vitest run"`.

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
```

- [ ] **Step 2: Write the failing tests**

`src/lib/music/setlist/shapes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { capoLabel, displayChord, shapeKeyFor } from './shapes';

describe('shapeKeyFor', () => {
  it('E with capo 4 is played from C shapes', () => {
    expect(shapeKeyFor('E', 4)).toBe('C');
  });
  it('E with capo 2 is played from D shapes', () => {
    expect(shapeKeyFor('E', 2)).toBe('D');
  });
  it('capo 0 returns the concert key', () => {
    expect(shapeKeyFor('G', 0)).toBe('G');
  });
});

describe('displayChord', () => {
  it('maps E-key chords to C shapes at capo 4', () => {
    expect(displayChord('E', 4, 'E')).toBe('C');
    expect(displayChord('C#m7', 4, 'E')).toBe('Am7');
    expect(displayChord('B7sus', 4, 'E')).toBe('G7sus');
    expect(displayChord('A2', 4, 'E')).toBe('F2');
  });
  it('maps E-key chords to D shapes at capo 2', () => {
    expect(displayChord('E', 2, 'E')).toBe('D');
    expect(displayChord('C#m7', 2, 'E')).toBe('Bm7');
    expect(displayChord('F#m7', 2, 'E')).toBe('Em7');
  });
  it('handles slash chords', () => {
    expect(displayChord('E/G#', 2, 'E')).toBe('D/F#');
  });
  it('capo 0 passes through', () => {
    expect(displayChord('G', 0, 'G')).toBe('G');
  });
});

describe('capoLabel', () => {
  it('says No capo for 0', () => {
    expect(capoLabel(0)).toBe('No capo');
  });
  it('names the fret otherwise', () => {
    expect(capoLabel(4)).toBe('Capo 4');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/music/setlist/shapes.test.ts`
Expected: FAIL — cannot resolve `./shapes`.

- [ ] **Step 4: Implement shapes.ts**

```ts
// Capo math: a capo at fret N raises everything N semitones, so the player
// reads chords N semitones BELOW concert pitch. All math delegates to the
// existing transposition lib.
import { transposeChord } from '@/lib/chords/transposition';

export function shapeKeyFor(concertKey: string, capo: number): string {
  if (capo === 0) return concertKey;
  return transposeChord(concertKey, -capo, undefined);
}

export function displayChord(chord: string, capo: number, concertKey: string): string {
  if (capo === 0) return chord;
  const shapeKey = shapeKeyFor(concertKey, capo);
  return transposeChord(chord, -capo, shapeKey);
}

export function capoLabel(capo: number): string {
  return capo === 0 ? 'No capo' : `Capo ${capo}`;
}
```

Note: `transposeChord`'s `targetKey` picks sharp/flat spelling via its
`FLAT_KEYS` list; passing the shape key keeps spellings sane (C shapes → F2
not E#2). If a test fails on spelling (e.g. `A2 → F2`), check what
`transposeChord(-4)` actually returns for the shape key and fix the
expectation to the musically-correct spelling, not the code.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/music/setlist/shapes.test.ts`
Expected: PASS (all).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/music/setlist/
git commit -m "feat(practice): capo shape math + vitest setup"
```

### Task 2: Types, people config, running order

**Files:**
- Create: `src/lib/music/setlist/types.ts`
- Create: `src/lib/music/setlist/people.ts`
- Create: `src/lib/music/setlist/order.ts`

**Interfaces:**
- Consumes: `Section` from `src/lib/db/index.ts`
- Produces (used by Tasks 3–6):

```ts
// types.ts
import type { Section } from '@/lib/db';

export interface PracticeSong {
  id: string;
  title: string;
  artist: string;
  concertKey: string;   // key the band sounds in
  tempo?: number;
  lead?: string;        // e.g. 'Janae / Grant'
  sourceNote?: string;  // provenance, e.g. 'From SongSelect chart, verified vs UG'
  sections: Section[];  // chords stored in concertKey
}

export type SetEntry =
  | { kind: 'link'; title: string; keyLabel: string; lead: string; href: string; note: string }
  | { kind: 'mashup'; title: string; songs: PracticeSong[]; note?: string }
  | { kind: 'song'; song: PracticeSong }
  | { kind: 'placeholder'; title: string; artist?: string; note: string };

export interface TransitionNote {
  afterIndex: number; // render after entries[afterIndex]
  text: string;
}

export interface PlayerView {
  id: string;          // 'everyone' | 'marco' | 'grant' | 'clair'
  name: string;
  instrument: 'concert' | 'acoustic' | 'piano';
  // concert key -> default capo for this player; keys not listed default to 0
  capoByKey: Record<string, number>;
  hint?: string;       // shown under the picker when selected
}
```

- [ ] **Step 1: Write types.ts** (exactly the block above)

- [ ] **Step 2: Write people.ts**

```ts
import type { PlayerView } from './types';

export const PLAYERS: PlayerView[] = [
  { id: 'everyone', name: 'Everyone', instrument: 'concert', capoByKey: {} },
  {
    id: 'marco',
    name: 'Marco',
    instrument: 'acoustic',
    // E via capo 4 C-shapes (his familiar Amazing fingering, one fret down); G open.
    capoByKey: { E: 4, G: 0 },
  },
  {
    id: 'grant',
    name: 'Grant',
    instrument: 'acoustic',
    // E via capo 2 D-shapes so the two acoustics don't stack identical voicings.
    capoByKey: { E: 2, G: 0 },
  },
  {
    id: 'clair',
    name: 'Clair',
    instrument: 'piano',
    capoByKey: {},
    hint: 'Concert key. If E (4 sharps) feels awkward, set the keyboard transpose to −3 and pick the "read in G" view.',
  },
];
```

- [ ] **Step 3: Write order.ts**

```ts
import type { SetEntry, TransitionNote } from './types';
import { AMAZING } from './songs/amazing';
import { WASHED } from './songs/washed';
import { PEACE_LIKE_A_RIVER } from './songs/peaceLikeARiver';

export const SET_ENTRIES: SetEntry[] = [
  {
    kind: 'link',
    title: 'Doxology (chorus)',
    keyLabel: 'A · a cappella',
    lead: 'Janae / Marco',
    href: '/doxology',
    note: 'Practice parts on the Doxology trainer — we sing it in A, exactly as trained.',
  },
  {
    kind: 'mashup',
    title: 'Amazing! / Washed',
    songs: [AMAZING, WASHED],
    note: "Out of Amazing's tag the band drops out — Washed's first chorus is a cappella, band back in on chorus 2.",
  },
  { kind: 'song', song: PEACE_LIKE_A_RIVER },
  {
    kind: 'placeholder',
    title: 'The Cost Is A Joy',
    artist: 'SEU Worship',
    note: 'Chart coming — key being picked.',
  },
  {
    kind: 'placeholder',
    title: 'I Have Decided To Follow Jesus',
    note: 'Chart coming — key being picked.',
  },
];

export const TRANSITIONS: TransitionNote[] = [
  {
    afterIndex: 0,
    text:
      'Hold the final “A—men” (A chord). Clair ghosts a low E pedal under it. ' +
      'Count in at ~145 during the hold; band lands Amazing’s intro vamp in E — ' +
      'the held A is the IV of E, so the entry resolves like a second Amen.',
  },
];
```

(Import of the three song files will fail to compile until Task 3 — Tasks 2
and 3 land as one commit.)

- [ ] **Step 4: Commit with Task 3** (see Task 3 step 5)

### Task 3: Song data — Peace Like A River, Amazing, Washed

**Files:**
- Create: `src/lib/music/setlist/songs/peaceLikeARiver.ts`
- Create: `src/lib/music/setlist/songs/amazing.ts`
- Create: `src/lib/music/setlist/songs/washed.ts`

**Interfaces:**
- Consumes: `PracticeSong` from `../types`
- Produces: `PEACE_LIKE_A_RIVER`, `AMAZING`, `WASHED` constants

**Chord position convention:** `position` is the character index in `lyrics`
where the chord lands. For instrumental lines use `lyrics: ''` and positions
spaced 0, 8, 16, 24.

- [ ] **Step 1: peaceLikeARiver.ts** — complete data from Janae's PDF (already in G, verbatim):

```ts
import type { PracticeSong } from '../types';

export const PEACE_LIKE_A_RIVER: PracticeSong = {
  id: 'peace-like-a-river',
  title: 'Peace Like A River',
  artist: 'Marco King',
  concertKey: 'G',
  lead: 'Marco',
  sourceNote: "From Janae's chart PDF (2026-09-01).",
  sections: [
    {
      type: 'verse',
      label: 'Verse',
      lines: [
        { lyrics: 'When I go out, with all of my pain', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 14 }] },
        { lyrics: 'When I get older and see everything', chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 18 }] },
        { lyrics: "When life's unfair, when it's unkind", chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 16 }] },
        { lyrics: 'When I have no control over my life', chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 19 }] },
      ],
    },
    {
      type: 'chorus',
      label: 'Chorus',
      lines: [
        { lyrics: "Take me back to the part where you're slowing me down", chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 26 }] },
        { lyrics: "Keep my head from a hurry, cause yours has a crown", chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 26 }] },
        { lyrics: 'The list I should do gets longer and longer', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 22 }] },
        { lyrics: "Help me know you're stronger, you're stronger!", chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 23 }] },
      ],
    },
    {
      type: 'bridge',
      label: 'Bridge',
      lines: [
        { lyrics: 'Peace like a river', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 11 }] },
        { lyrics: 'I keep turning, return me', chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 15 }] },
        { lyrics: 'Peace like a river', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 11 }] },
        { lyrics: 'Sweep me off my feet', chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 9 }] },
      ],
    },
  ],
};
```

Chord positions within lines are eyeballed from the PDF's inline placement —
executor: open the PDF (Drive file `peace-like-a-river-chords.pdf`) only if a
position looks wrong when rendered; the chord SEQUENCE above is exact.

- [ ] **Step 2: amazing.ts and washed.ts — structure + chords in E**

Both SongSelect PDFs are in Gb; store in E (down 2 semitones). Chord map
(Gb→E): Gb→E · Gbsus→Esus · Gb/Bb→E/G# · Cb→A · Cb2→A2 · Db→B · Db(4)→B(4) ·
Db/F→B/D# · Db7sus→B7sus · Ebm→C#m · Ebm7→C#m7 · Abm→F#m · Abm7(4)→F#m7(4).

Write both files with this section skeleton (chords are ground truth from the
PDFs; lyric text and chord positions to be FINALIZED in Task 6's content pass
because the SongSelect text extraction is interleaved/garbled — until then use
the recognizable lyric lines below, which are enough to practice from):

`amazing.ts` — `id: 'amazing'`, title `Amazing!`, artist `ELEVATION RHYTHM & Josiah Queen`, concertKey `E`, tempo 145, lead `Janae / Grant`, sourceNote `SongSelect chart in Gb transposed to E; lyrics pending UG verification.` Sections:
- intro `Intro`: instrumental line, chords E · E · Esus · Esus
- chorus `Chorus`: "I was stuck in my shame but now I've been set free" (E, position 0; Esus near end), "I once was blind but now I see" (E), "I was headed for hell until He rescued me" (Ebm→C#m line: C#m, A), "Now heaven's my home for all eternity" (A, E)
- verse `Verse`: "I believe He died to save my name" (C#m, A, B), "That He walked right out the grave" (E, B/D#), "I believe He cleared my name" (C#m, A), "Full of life I'm dancing in Jesus' grace" (B, A, E), "Isn't that amazing" (B, A, E)
- bridge `Bridge`: "Hallelujah to the man on the middle cross" (E, E/G#), "'Cause He didn't owe the debt but He paid it off" (C#m, A), "And He rolled away the stone now I'm gettin' up" (E, E/G#), "I'm gettin' up, I'm gettin' up" (C#m, A)
- tag `Tag`: "I'm gettin' up, I'm gettin' up" (F#m, E/G#, A, C#m, B/D#, E)

`washed.ts` — `id: 'washed'`, title `Washed`, artist `Elevation Rhythm`, concertKey `E`, tempo 139, lead `Marco`, sourceNote `SongSelect chart in Gb transposed to E; lyrics pending UG verification.` Sections:
- chorus `Chorus (1st x a cappella)`: "I've been washed in the water, washed in the blood" (E, A2), "I'm as good as new, oh hallelujah" (C#m7, B7sus), "I've been washed in the water, washed in the blood" (E, A2), "All because of You, oh hallelujah" (C#m7, B7sus)
- instrumental `Turnaround`: instrumental line, chords E/G# · A2 · B(4) · C#m7 (x2)
- verse `Verse 1`: "I'm clean, sin was stained on me" (E/G#, A2, B(4), C#m7), "Shame was running deep" (E/G#, A2), "But love was spilled on Calvary, hallelujah" (B(4), C#m7, F#m7(4), B7sus), "I'm clean, God how can it be" (E/G#, A2, B(4), C#m7), "I'm ransomed and redeemed" (E/G#, A2), "Standing in Your victory, hallelujah" (B(4), C#m7, F#m7(4), B7sus)
- verse `Verse 2`: "I'm clean, it's not what I have done" (E/G#, A2, B(4), C#m7), "But what You've done for me" (E/G#, A2), "You paid it all upon that tree, hallelujah" (B(4), C#m7, F#m7(4), B7sus), "I'm clean, Your love has overcome" (E/G#, A2, B(4), C#m7), "Your mercy is supreme" (E/G#, A2), "I'm dancing in Your victory, hallelujah" (B(4), C#m7, F#m7(4), B7sus)
- bridge `Bridge`: "'Cause You took away my shame" (E), "And You nailed it to the cross" (A2), "You got me running out the grave" (C#m7), "Hallelujah here I come" (A2)
- tag `Tag`: "Hallelujah here I come" ×4 (E, A2, C#m7, A2)

Set each line's chord positions at sensible word boundaries (start of the
word being sung on the change); Task 6 verifies against UG.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: clean (order.ts from Task 2 now compiles).

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit Tasks 2+3**

```bash
git add src/lib/music/setlist/
git commit -m "feat(practice): set data model, people config, running order, first three charts"
```

### Task 4: Chart renderer + song cards

**Files:**
- Create: `src/components/practice/ChordChartView.tsx`
- Create: `src/components/practice/SongCard.tsx`

**Interfaces:**
- Consumes: `PracticeSong`, `SetEntry`, `PlayerView` from `@/lib/music/setlist/types`; `displayChord`, `shapeKeyFor`, `capoLabel` from `@/lib/music/setlist/shapes`
- Produces: `<ChordChartView song capo />`, `<SongCard entry player />`

- [ ] **Step 1: ChordChartView.tsx**

Renders sections; per line, builds a chord row above the lyric row using
`ChordPosition.position` padding in a monospace grid:

```tsx
import type { PracticeSong } from '@/lib/music/setlist/types';
import type { ChordLine } from '@/lib/db';
import { displayChord } from '@/lib/music/setlist/shapes';

function chordRow(line: ChordLine, capo: number, concertKey: string): string {
  let row = '';
  for (const { chord, position } of line.chords) {
    const at = Math.max(position, row.length === 0 ? 0 : row.length + 1);
    row = row.padEnd(at, ' ') + displayChord(chord, capo, concertKey);
  }
  return row;
}

export default function ChordChartView({ song, capo }: { song: PracticeSong; capo: number }) {
  return (
    <div className="space-y-5">
      {song.sections.map((section, i) => (
        <div key={i}>
          <div className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">
            {section.label}
          </div>
          <div className="font-mono text-[15px] leading-tight overflow-x-auto">
            {section.lines.map((line, j) => (
              <div key={j} className="mb-2">
                <div className="font-bold text-[#b45741] whitespace-pre">
                  {chordRow(line, capo, song.concertKey) || ' '}
                </div>
                {line.lyrics && <div className="whitespace-pre-wrap">{line.lyrics}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: SongCard.tsx**

One component switching on `entry.kind`:
- `link` → card with title, key label, lead, note, and a prominent button-styled `<Link href={entry.href}>Open the Doxology trainer</Link>`.
- `song` / `mashup` → header (title, lead, tempo, and for the current player: `capoLabel(capo)` + `shapeKeyFor` shapes label, e.g. "Capo 4 · C shapes"), a capo override `<select>` (options: No capo, Capo 1…Capo 7, default = player's `capoByKey[song.concertKey] ?? 0`, state per song via `useState` keyed reset on player change with `key={player.id}` from the parent), then `ChordChartView` per song (mashup: both songs stacked with a divider and `entry.note` between them).
- `placeholder` → muted card with title, artist, note.

Header key line always shows concert key too: `Key of E` (and when capo > 0: `Key of E · Capo 4 · play C shapes`). Piano player (`instrument === 'piano'`) shows `hint` if present and replaces the capo select with a read-key select: `Concert` (capo 0) and `Keyboard transpose −3 · read G` (internally capo −3 — note the sign: piano transpose reads ABOVE concert, guitar capo reads BELOW; `displayChord(chord, -3, 'E')` already yields G-shape chords via `transposeChord(+3)`). Add one test to `shapes.test.ts`: `expect(displayChord('E', -3, 'E')).toBe('G')` and `expect(displayChord('C#m7', -3, 'E')).toBe('Em7')`.

- [ ] **Step 3: Type-check + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/practice/
git commit -m "feat(practice): chord chart renderer and song cards"
```

### Task 5: /practice page

**Files:**
- Create: `src/app/practice/page.tsx`

**Interfaces:**
- Consumes: `SET_ENTRIES`, `TRANSITIONS` from `@/lib/music/setlist/order`; `PLAYERS` from `@/lib/music/setlist/people`; `SongCard`

- [ ] **Step 1: Build the page**

`'use client'`. Structure:
- Header: `Logo` (link home, same pattern as `/setlist` page), title "HUB Lawn — Sept 13 · Practice", subtitle "Set list in running order".
- Sticky person picker under the header (`sticky top-0 z-10` with theme background): segmented buttons from `PLAYERS`; selection stored via `useState` + `localStorage` key `practice.player` (read in `useEffect` to stay SSR-safe); show `player.hint` under the picker when present.
- Body: map `SET_ENTRIES` → `<SongCard key={i} entry={...} player={player} />`, and after index i render any `TRANSITIONS` with `afterIndex === i` as an italic callout card ("→ Transition" label + text).
- Footer note: "Doxology parts → /doxology".

- [ ] **Step 2: Verify in dev**

Run: `npm run dev`, open `http://localhost:3000/practice`.
Check: order correct; switching Marco/Grant re-chords Amazing/Washed (C shapes vs D shapes); Clair sees concert chords + hint, no capo select; transition callout appears after Doxology card; placeholders render; page usable at 390px width (no horizontal body scroll — chart lines scroll inside their own container).

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/practice/
git commit -m "feat(practice): unlisted /practice page with person picker"
```

### Task 6: [MAIN SESSION] Content pass — UG verification + the two TBD songs

Not subagent work: needs Marco's Chrome (UG Pro) via claude-in-chrome, and two key decisions from Marco.

- [ ] **Step 1: Verify Amazing + Washed lyrics/positions against UG**

Fetch the top-rated UG chords pages for "Amazing Josiah Queen" and "Washed Elevation Rhythm" (print-friendly view). Correct lyric lines and chord positions in `amazing.ts` / `washed.ts` (chords themselves are already ground-truthed from SongSelect; flag any chord-level disagreement to Marco instead of silently changing). Update each `sourceNote` to `verified vs UG <date>`.

- [ ] **Step 2: The Cost Is A Joy (SEU Worship)**

Fetch the UG chart, note its original key, propose to Marco a key that (a) suits the singers and (b) flows after G — check vocal range vs the record like we did for Amazing/Washed. On Marco's confirmation, write `theCostIsAJoy.ts` (full sections, concert key) and replace the placeholder entry in `order.ts` with `{ kind: 'song', song: THE_COST_IS_A_JOY }`.

- [ ] **Step 3: I Have Decided To Follow Jesus**

Same flow; multiple arrangements exist on UG — pick the one matching how the team sings it (ask Marco which version: traditional hymn vs a modern arrangement) before transcribing. Write `iHaveDecided.ts`, replace the placeholder.

- [ ] **Step 4: Proofread every chart on the rendered page** (each song, each player view) against its source. Fix data files as needed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/music/setlist/
git commit -m "feat(practice): verified charts + The Cost Is A Joy and I Have Decided"
```

### Task 7: Ship

- [ ] **Step 1: Full check**

Run: `npx vitest run && npm run build && npm run lint`
Expected: all clean.

- [ ] **Step 2: Confirm unlisted** — `grep -rn "practice" src/components/SiteNav.tsx src/app/sept13/` returns no links to `/practice`.

- [ ] **Step 3: Deploy per the repo's normal flow** (push; Vercel builds). Verify `wmaac.org/practice` live on a phone.

- [ ] **Step 4: Text-ready summary for Marco** — the URL + one line per player ("Marco: capo 4 C shapes on the mashup, open G elsewhere…").
