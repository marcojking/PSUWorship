// Chart-content integrity, not component behaviour.
//
// transposeChord returns a chord it cannot parse UNCHANGED. That is a silent
// failure with real consequences: an altered extension like Am7b5 or Cmaj7#11
// would sit in a capo view still spelled at concert pitch, looking perfectly
// normal, and the first anyone hears of it is a wrong chord at rehearsal.
// These tests make bad chart content fail here instead.
import { describe, expect, it } from 'vitest';
import { parseChord } from '@/lib/chords/transposition';
import { displayChord } from './shapes';
import { SET_ENTRIES } from './order';
import type { PracticeSong } from './types';

// Capo positions actually in use: concert (everyone/piano), Grant's 3, Marco's 5.
const CAPOS_IN_USE = [0, 3, 5];

const songs: PracticeSong[] = SET_ENTRIES.flatMap((entry) => {
  if (entry.kind === 'song') return [entry.song];
  if (entry.kind === 'mashup') return entry.songs;
  return [];
});

interface ChordRef {
  song: string;
  section: string;
  chord: string;
  concertKey: string;
}

const chordRefs: ChordRef[] = songs.flatMap((song) =>
  song.sections.flatMap((section) =>
    section.lines.flatMap((line) =>
      line.chords.map(({ chord }) => ({
        song: song.title,
        section: section.label,
        chord,
        concertKey: song.concertKey,
      })),
    ),
  ),
);

describe('chart integrity', () => {
  it('has charts to check', () => {
    // Guards the guard: if the flatMap above ever stops finding songs, every
    // test below would pass vacuously.
    expect(songs.length).toBeGreaterThan(0);
    expect(chordRefs.length).toBeGreaterThan(20);
  });

  it('every chord in the set parses', () => {
    const unparseable = chordRefs
      .filter((ref) => parseChord(ref.chord) === null)
      .map((ref) => `${ref.song} / ${ref.section}: ${ref.chord}`);
    expect(unparseable).toEqual([]);
  });

  it('every chord actually transposes at every capo in use', () => {
    // A 3- or 5-semitone shift moves every root to a different letter, so an
    // unchanged chord at a non-zero capo means the transposition silently
    // no-opped on something it could not read.
    const stuck: string[] = [];
    for (const capo of CAPOS_IN_USE.filter((c) => c !== 0)) {
      for (const ref of chordRefs) {
        const shown = displayChord(ref.chord, capo, ref.concertKey);
        if (shown === ref.chord) {
          stuck.push(`${ref.song} / ${ref.section}: ${ref.chord} unchanged at capo ${capo}`);
        }
      }
    }
    expect(stuck).toEqual([]);
  });

  it('passes chords through unchanged at capo 0', () => {
    for (const ref of chordRefs) {
      expect(displayChord(ref.chord, 0, ref.concertKey)).toBe(ref.chord);
    }
  });

  it('never renders the string "undefined" as a chord', () => {
    for (const capo of CAPOS_IN_USE) {
      for (const ref of chordRefs) {
        expect(displayChord(ref.chord, capo, ref.concertKey)).not.toContain('undefined');
      }
    }
  });

  it('reads the chord shapes the next two charts need', () => {
    // The Cost Is A Joy uses Bbmaj7; I Have Decided uses G7. Both are safe.
    for (const chord of ['Bbmaj7', 'G7', 'Fsus2', 'Fsus4', 'Bb2', 'C(4)', 'D/F#', 'Fadd9']) {
      expect(parseChord(chord), `${chord} should parse`).not.toBeNull();
    }
  });

  it('records the shapes parseChord still cannot read', () => {
    // NOT aspirational — this is what the parser does today, pinned so the gap
    // is visible instead of folklore. Altered extensions, word-tones in
    // parentheses and non-chord markers all fail, and a chord that fails to
    // parse is passed through UNCHANGED by transposeChord, which is the silent
    // wrong-chord-at-rehearsal case.
    //
    // Nothing in the set uses these, and the "every chord in the set parses"
    // test above blocks any chart that starts to. If a future chart genuinely
    // needs one, widen the regex in @/lib/chords/transposition (it is shared
    // with the setlist importer and the UG parser, so that is its own change)
    // and delete the entry here.
    for (const chord of ['Am7b5', 'F#m7b5', 'Cmaj7#11', 'C7#9', 'Am(add9)', 'N.C.']) {
      expect(parseChord(chord), `${chord} unexpectedly parses now — update this list`).toBeNull();
    }
  });
});
