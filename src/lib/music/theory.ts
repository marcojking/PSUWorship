// Music theory utilities for the harmony training app

// Note names for display
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// Scale patterns (intervals in semitones)
export const SCALE_PATTERNS = {
  major: [2, 2, 1, 2, 2, 2, 1],
  minor: [2, 1, 2, 2, 1, 2, 2],
  harmonicMinor: [2, 1, 2, 2, 1, 3, 1],
  melodicMinor: [2, 1, 2, 2, 2, 2, 1],
} as const;

export type ScaleType = keyof typeof SCALE_PATTERNS;

// Convert MIDI note number to frequency in Hz
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Convert frequency to MIDI note number (can be fractional for pitch detection)
export function frequencyToMidi(frequency: number): number {
  if (frequency <= 0) return 0;
  return 69 + 12 * Math.log2(frequency / 440);
}

// Get note name from MIDI number
export function midiToNoteName(midi: number): string {
  const noteName = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteName}${octave}`;
}

// Parse note name to MIDI number
export function noteNameToMidi(noteName: string): number | null {
  const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return null;

  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr);

  // Handle flats by converting to sharps
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11,
  };

  const noteIndex = noteMap[note];
  if (noteIndex === undefined) return null;

  return (octave + 1) * 12 + noteIndex;
}

// Build a scale from a root note
export function buildScale(rootMidi: number, scaleType: ScaleType, octaves: number = 1): number[] {
  const pattern = SCALE_PATTERNS[scaleType];
  const scale: number[] = [rootMidi];

  let current = rootMidi;
  for (let o = 0; o < octaves; o++) {
    for (const interval of pattern) {
      current += interval;
      scale.push(current);
    }
  }

  return scale;
}

// Check if a note is in a scale
export function isInScale(midi: number, rootMidi: number, scaleType: ScaleType): boolean {
  const scale = buildScale(rootMidi % 12, scaleType, 1);
  const normalizedMidi = midi % 12;
  return scale.some(note => note % 12 === normalizedMidi);
}

// Get the scale degree of a note (1-7, or null if not in scale)
export function getScaleDegree(midi: number, rootMidi: number, scaleType: ScaleType): number | null {
  const scale = buildScale(rootMidi % 12, scaleType, 1).slice(0, 7);
  const normalizedMidi = midi % 12;

  for (let i = 0; i < scale.length; i++) {
    if (scale[i] % 12 === normalizedMidi) {
      return i + 1;
    }
  }
  return null;
}

// Get harmony note (diatonic interval above or below)
export function getHarmonyNote(
  melodyMidi: number,
  rootMidi: number,
  scaleType: ScaleType,
  interval: number, // positive = above, negative = below (in scale degrees, e.g., 3 = third above)
): number {
  // Build scale covering a wide range (6 octaves starting 2 octaves below root)
  // This ensures we cover all vocal ranges from bass to soprano
  const scaleStart = rootMidi - 24;
  const scale = buildScale(scaleStart, scaleType, 6);

  // Find melody note in scale (closest match)
  let melodyIndex = -1;
  let minDiff = Infinity;

  for (let i = 0; i < scale.length; i++) {
    const diff = Math.abs(scale[i] - melodyMidi);
    if (diff < minDiff) {
      minDiff = diff;
      melodyIndex = i;
    }
  }

  if (melodyIndex === -1) return melodyMidi; // Fallback

  // Calculate harmony index
  // For interval of 3 (third), we move 2 scale positions (0-indexed)
  const harmonyIndex = melodyIndex + (interval - 1) * Math.sign(interval);

  // Clamp to valid range
  const clampedIndex = Math.max(0, Math.min(scale.length - 1, harmonyIndex));

  return scale[clampedIndex];
}

// Get cents difference between two frequencies
export function getCentsDifference(freq1: number, freq2: number): number {
  if (freq1 <= 0 || freq2 <= 0) return 0;
  return 1200 * Math.log2(freq1 / freq2);
}

// Quantize a MIDI note to the nearest note in a scale
export function quantizeToScale(midi: number, rootMidi: number, scaleType: ScaleType): number {
  const scale = buildScale(rootMidi, scaleType, 8); // Large range

  let closest = scale[0];
  let minDiff = Math.abs(midi - closest);

  for (const note of scale) {
    const diff = Math.abs(midi - note);
    if (diff < minDiff) {
      minDiff = diff;
      closest = note;
    }
  }

  return closest;
}

// Comfortable vocal ranges (MIDI) - narrower than full range for easy singing
// Based on standard tessitura (comfortable singing range) for each voice type
export const VOCAL_RANGES = {
  bass:         { min: 40, max: 60, label: 'Bass',           note: 'E2-C4' },
  baritone:     { min: 43, max: 64, label: 'Baritone',       note: 'G2-E4' },
  tenor:        { min: 48, max: 67, label: 'Tenor',          note: 'C3-G4' },
  alto:         { min: 53, max: 74, label: 'Alto',           note: 'F3-D5' },
  mezzosoprano: { min: 57, max: 77, label: 'Mezzo-Soprano',  note: 'A3-F5' },
  soprano:      { min: 60, max: 81, label: 'Soprano',        note: 'C4-A5' },
} as const;

export type VocalRange = keyof typeof VOCAL_RANGES;

// Get recommended key for a vocal range (root note in comfortable range)
export function getRecommendedKey(vocalRange: VocalRange): number {
  const range = VOCAL_RANGES[vocalRange];
  // Pick a key where the root is in the lower-middle of the range
  const targetRoot = range.min + Math.floor((range.max - range.min) * 0.3);
  // Round to nearest C, G, D, F (common keys)
  const commonRoots = [48, 53, 55, 60, 65, 67, 72]; // C3, F3, G3, C4, F4, G4, C5
  let closest = commonRoots[0];
  for (const root of commonRoots) {
    if (Math.abs(root - targetRoot) < Math.abs(closest - targetRoot)) {
      closest = root;
    }
  }
  return closest;
}

// Available keys for the app
export const AVAILABLE_KEYS = [
  { name: 'C', midi: 60 },
  { name: 'G', midi: 67 },
  { name: 'D', midi: 62 },
  { name: 'A', midi: 69 },
  { name: 'E', midi: 64 },
  { name: 'F', midi: 65 },
  { name: 'Bb', midi: 70 },
  { name: 'Eb', midi: 63 },
] as const;
