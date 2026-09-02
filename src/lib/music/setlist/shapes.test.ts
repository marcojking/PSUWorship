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
  it('reads above concert pitch for a negative capo (piano)', () => {
    expect(displayChord('E', -3, 'E')).toBe('G');
    expect(displayChord('C#m7', -3, 'E')).toBe('Em7');
  });
});

// The set is in F: Marco reads capo 5 (C shapes), Grant capo 3 (D shapes).
// Both land on naturals, so these cover the manual capo-override dropdown,
// where a shape key can land on a black note and needs a readable name.
describe('shapeKeyFor spelling', () => {
  it('spells F shape keys the way a musician writes them', () => {
    expect(shapeKeyFor('F', 1)).toBe('E');
    expect(shapeKeyFor('F', 2)).toBe('Eb');
    expect(shapeKeyFor('F', 3)).toBe('D');
    expect(shapeKeyFor('F', 4)).toBe('Db');
    expect(shapeKeyFor('F', 5)).toBe('C');
    expect(shapeKeyFor('F', 6)).toBe('B');
    expect(shapeKeyFor('F', 7)).toBe('Bb');
  });
  it('spells G shape keys the way a musician writes them', () => {
    // Gb, not F#: the chords under it read Ebm/Abm/Bbm instead of D#m/G#m/A#m,
    // and there are far more chords on a chart than key labels.
    expect(shapeKeyFor('G', 1)).toBe('Gb');
    expect(shapeKeyFor('G', 2)).toBe('F');
    expect(shapeKeyFor('G', 3)).toBe('E');
    expect(shapeKeyFor('G', 4)).toBe('Eb');
    expect(shapeKeyFor('G', 5)).toBe('D');
  });
  it('makes the chords follow the shape key spelling', () => {
    // Eb shape key, so the chords are flat-spelled too: Ab2, not G#2.
    expect(displayChord('F', 2, 'F')).toBe('Eb');
    expect(displayChord('Bb2', 2, 'F')).toBe('Ab2');
    expect(displayChord('Gm7', 2, 'F')).toBe('Fm7');
  });
  it('keeps the real practice-set views on naturals', () => {
    expect(shapeKeyFor('F', 5)).toBe('C');
    expect(shapeKeyFor('F', 3)).toBe('D');
    expect(displayChord('Bb2', 5, 'F')).toBe('F2');
    expect(displayChord('F/A', 3, 'F')).toBe('D/F#');
  });
});

describe('capo validation', () => {
  it('rejects out-of-range capos instead of emitting "undefined"', () => {
    expect(() => shapeKeyFor('C', 13)).toThrow(RangeError);
    expect(() => shapeKeyFor('C', -13)).toThrow(RangeError);
    expect(() => displayChord('C', 13, 'C')).toThrow(RangeError);
    expect(() => capoLabel(13)).toThrow(RangeError);
  });
  it('rejects non-integer and non-finite capos', () => {
    expect(() => displayChord('C', 1.5, 'C')).toThrow(RangeError);
    expect(() => displayChord('C', NaN, 'C')).toThrow(RangeError);
    expect(() => displayChord('C', Infinity, 'C')).toThrow(RangeError);
  });
  it('accepts the full octave in both directions', () => {
    expect(shapeKeyFor('C', 12)).toBe('C');
    expect(shapeKeyFor('C', -12)).toBe('C');
  });
});

describe('capoLabel', () => {
  it('says No capo for 0', () => {
    expect(capoLabel(0)).toBe('No capo');
  });
  it('names the fret otherwise', () => {
    expect(capoLabel(4)).toBe('Capo 4');
  });
  // A negative capo is the piano read-above-concert view, where "Capo -3"
  // is meaningless — there is no such fret.
  it('calls a negative capo a transpose', () => {
    expect(capoLabel(-3)).toBe('Transpose −3');
    expect(capoLabel(-1)).toBe('Transpose −1');
  });
});
