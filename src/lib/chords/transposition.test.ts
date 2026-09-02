import { describe, it, expect } from 'vitest';
import { parseChord, transposeChord } from './transposition';

describe('parseChord', () => {
  it('parses plain and extended chords', () => {
    expect(parseChord('E')).toMatchObject({ root: 'E', quality: '', extension: '', suffix: '', paren: '', bass: null });
    expect(parseChord('C#m7')).toMatchObject({ root: 'C#', quality: 'm', extension: '7' });
    expect(parseChord('Esus')).toMatchObject({ root: 'E', suffix: 'sus' });
    expect(parseChord('E/G#')).toMatchObject({ root: 'E', bass: 'G#' });
  });

  // SongSelect writes added tones in parentheses. Without this the chord fails
  // to parse and transposeChord silently returns it unchanged, which puts a
  // concert-pitch chord in the middle of a capo view.
  it('parses SongSelect parenthesized added tones', () => {
    expect(parseChord('B(4)')).toMatchObject({ root: 'B', extension: '', paren: '(4)' });
    expect(parseChord('F#m7(4)')).toMatchObject({ root: 'F#', quality: 'm', extension: '7', paren: '(4)' });
    expect(parseChord('B(4)/D#')).toMatchObject({ root: 'B', paren: '(4)', bass: 'D#' });
  });

  it('rejects non-chords', () => {
    expect(parseChord('hallelujah')).toBeNull();
    expect(parseChord('(4)')).toBeNull();
  });
});

describe('transposeChord', () => {
  it('transposes roots, qualities and bass notes', () => {
    expect(transposeChord('E', -4, 'C')).toBe('C');
    expect(transposeChord('C#m7', -4, 'C')).toBe('Am7');
    expect(transposeChord('E/G#', -4, 'C')).toBe('C/E');
    expect(transposeChord('Esus', -2, 'D')).toBe('Dsus');
  });

  it('transposes parenthesized added tones and keeps the tone', () => {
    expect(transposeChord('B(4)', -4, 'C')).toBe('G(4)');
    expect(transposeChord('B(4)', -2, 'D')).toBe('A(4)');
    expect(transposeChord('F#m7(4)', -4, 'C')).toBe('Dm7(4)');
    expect(transposeChord('F#m7(4)', -2, 'D')).toBe('Em7(4)');
  });

  // The /practice set: Washed in concert F, read by Marco at capo 5 (C shapes)
  // and Grant at capo 3 (D shapes).
  it('handles the practice set capo views', () => {
    expect(transposeChord('C(4)', -5, 'C')).toBe('G(4)');
    expect(transposeChord('C(4)', -3, 'D')).toBe('A(4)');
    expect(transposeChord('Gm7(4)', -5, 'C')).toBe('Dm7(4)');
    expect(transposeChord('Gm7(4)', -3, 'D')).toBe('Em7(4)');
    expect(transposeChord('Bb2', -5, 'C')).toBe('F2');
    expect(transposeChord('F/A', -5, 'C')).toBe('C/E');
    expect(transposeChord('F/A', -3, 'D')).toBe('D/F#');
  });

  it('returns unparseable text unchanged', () => {
    expect(transposeChord('N.C.', -4, 'C')).toBe('N.C.');
  });
});
