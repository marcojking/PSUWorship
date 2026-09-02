// Capo math: a capo at fret N raises everything N semitones, so the player
// reads chords N semitones BELOW concert pitch. A negative capo means the
// opposite (piano reading above concert pitch). All math delegates to the
// existing transposition lib; this module only validates the capo and picks
// the key spelling.
import { transposeChord } from '@/lib/chords/transposition';

const MIN_CAPO = -12;
const MAX_CAPO = 12;

// transposeChord spells accidentals sharp unless its targetKey is one of its
// FLAT_KEYS, which gives shape keys like D# where a musician writes Eb. Any
// flat key works as the selector; 'F' just means "spell this one flat".
// Naturals are unaffected, so the real capo-5 (C) and capo-3 (D) views are
// untouched.
const SPELL_FLAT = 'F';

// transposeChord indexes a 12-note table with `(i + semitones + 12) % 12`,
// which goes negative past a full octave and yields the string 'undefined'.
// Guard here rather than there so the shared lib stays untouched.
function assertCapo(capo: number): void {
  if (!Number.isInteger(capo) || capo < MIN_CAPO || capo > MAX_CAPO) {
    throw new RangeError(
      `capo must be an integer from ${MIN_CAPO} to ${MAX_CAPO}, got ${capo}`
    );
  }
}

export function shapeKeyFor(concertKey: string, capo: number): string {
  assertCapo(capo);
  if (capo === 0) return concertKey;
  return transposeChord(concertKey, -capo, SPELL_FLAT);
}

export function displayChord(chord: string, capo: number, concertKey: string): string {
  assertCapo(capo);
  if (capo === 0) return chord;
  // Passing the shape key as targetKey makes the chords adopt its spelling.
  return transposeChord(chord, -capo, shapeKeyFor(concertKey, capo));
}

export function capoLabel(capo: number): string {
  assertCapo(capo);
  if (capo === 0) return 'No capo';
  // No such fret as a negative one: that view is a piano transpose.
  if (capo < 0) return `Transpose −${Math.abs(capo)}`;
  return `Capo ${capo}`;
}
