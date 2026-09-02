// Capo math: a capo at fret N raises everything N semitones, so the player
// reads chords N semitones BELOW concert pitch. A negative capo means the
// opposite (piano reading above concert pitch). All math delegates to the
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
