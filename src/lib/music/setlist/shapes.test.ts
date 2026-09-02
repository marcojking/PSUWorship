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

describe('capoLabel', () => {
  it('says No capo for 0', () => {
    expect(capoLabel(0)).toBe('No capo');
  });
  it('names the fret otherwise', () => {
    expect(capoLabel(4)).toBe('Capo 4');
  });
});
