// Chromatic scale with sharps and flats
const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Keys that typically use flats
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];

// All valid keys for selection
export const ALL_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Get note index (0-11)
function getNoteIndex(note: string): number {
  // Normalize the note
  const normalized = note.replace('♯', '#').replace('♭', 'b');

  let index = SHARP_NOTES.indexOf(normalized);
  if (index === -1) {
    index = FLAT_NOTES.indexOf(normalized);
  }
  return index;
}

// Determine if we should use flats for a given key
function shouldUseFlats(key: string): boolean {
  return FLAT_KEYS.includes(key);
}

// Get the note name given an index and whether to use flats
function getNoteName(index: number, useFlats: boolean): string {
  const notes = useFlats ? FLAT_NOTES : SHARP_NOTES;
  return notes[index % 12];
}

// Parse a chord into its components
export interface ParsedChord {
  root: string;
  quality: string; // m, maj, dim, aug, etc.
  extension: string; // 7, 9, 11, 13
  suffix: string; // sus4, add9, etc.
  bass: string | null; // for slash chords
}

export function parseChord(chord: string): ParsedChord | null {
  // Match chord pattern: Root + quality + extension + suffix + optional bass
  const match = chord.match(/^([A-G][#b♯♭]?)(m|min|maj|dim|aug|\+|°|ø)?(\d+)?(sus[24]?|add[29]|add11|add13)?(?:\/([A-G][#b♯♭]?))?$/i);

  if (!match) return null;

  return {
    root: match[1],
    quality: normalizeQuality(match[2] || ''),
    extension: match[3] || '',
    suffix: match[4] || '',
    bass: match[5] || null,
  };
}

function normalizeQuality(q: string): string {
  if (!q) return '';
  const lower = q.toLowerCase();
  if (['m', 'min', 'minor', '-'].includes(lower)) return 'm';
  if (['maj', 'major'].includes(lower)) return 'maj';
  if (['dim', 'diminished', '°'].includes(lower)) return 'dim';
  if (['aug', 'augmented', '+'].includes(lower)) return 'aug';
  if (['ø'].includes(lower)) return 'ø';
  return q;
}

// Transpose a single chord
export function transposeChord(chord: string, semitones: number, targetKey?: string): string {
  const parsed = parseChord(chord);
  if (!parsed) return chord; // Return unchanged if can't parse

  const useFlats = targetKey ? shouldUseFlats(targetKey) : false;

  // Transpose root
  const rootIndex = getNoteIndex(parsed.root);
  if (rootIndex === -1) return chord;
  const newRootIndex = (rootIndex + semitones + 12) % 12;
  const newRoot = getNoteName(newRootIndex, useFlats);

  // Transpose bass if present
  let newBass = '';
  if (parsed.bass) {
    const bassIndex = getNoteIndex(parsed.bass);
    if (bassIndex !== -1) {
      const newBassIndex = (bassIndex + semitones + 12) % 12;
      newBass = '/' + getNoteName(newBassIndex, useFlats);
    }
  }

  return newRoot + parsed.quality + parsed.extension + parsed.suffix + newBass;
}

// Get the transposition interval between two keys
export function getTranspositionInterval(fromKey: string, toKey: string): number {
  const fromIndex = getNoteIndex(fromKey);
  const toIndex = getNoteIndex(toKey);
  if (fromIndex === -1 || toIndex === -1) return 0;
  return (toIndex - fromIndex + 12) % 12;
}

// Transpose a chord from one key to another
export function transposeChordToKey(chord: string, fromKey: string, toKey: string): string {
  const semitones = getTranspositionInterval(fromKey, toKey);
  return transposeChord(chord, semitones, toKey);
}

// Check if a string is a valid chord
export function isChord(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 12) return false;
  return parseChord(trimmed) !== null;
}

// Detect if a line is primarily chords
export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  const chordCount = tokens.filter(t => isChord(t)).length;
  return chordCount / tokens.length > 0.5;
}
