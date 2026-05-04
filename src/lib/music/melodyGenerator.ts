// Melody generator using constrained random walk
import { buildScale, ScaleType, getHarmonyNote } from './theory';

export interface Note {
  midi: number;
  duration: number; // in beats
  startBeat: number;
}

export type MelodyType = 'scale' | 'random';

export interface MelodyOptions {
  rootMidi: number;      // Root note of the key (MIDI number)
  scaleType: ScaleType;  // Scale type
  measures: number;      // Number of measures
  beatsPerMeasure: number;
  rangeMin: number;      // Lowest allowed MIDI note
  rangeMax: number;      // Highest allowed MIDI note
  complexity: number;    // 0-10: affects rhythm (and intervals for random type)
  melodyType: MelodyType; // 'scale' or 'random'
}

// Rhythm patterns by complexity level
// Level 0: Only whole notes
// Level 1-3: Whole and half notes
// Level 4-6: Add quarter notes
// Level 7-10: Add eighth notes

function getRhythmPatternsForComplexity(complexity: number, beatsPerMeasure: number): number[][] {
  if (complexity === 0) {
    // Just whole notes
    return [[beatsPerMeasure]];
  }

  if (complexity <= 3) {
    // Whole and half notes only
    return [
      [beatsPerMeasure],           // Whole note
      [2, 2],                       // Two halves
    ];
  }

  if (complexity <= 6) {
    // Add quarter notes
    return [
      [beatsPerMeasure],           // Whole note
      [2, 2],                       // Two halves
      [2, 1, 1],                    // Half + two quarters
      [1, 1, 2],                    // Two quarters + half
      [1, 2, 1],                    // Quarter, half, quarter
    ];
  }

  // High complexity: add eighth notes
  return [
    [2, 2],                       // Two halves
    [2, 1, 1],                    // Half + two quarters
    [1, 1, 2],                    // Two quarters + half
    [1, 1, 1, 1],                 // Four quarters
    [1, 2, 1],                    // Quarter, half, quarter
    [1, 1, 0.5, 0.5, 1],          // Mixed with eighth notes
    [0.5, 0.5, 1, 1, 1],          // Start with eighths
    [1, 0.5, 0.5, 1, 1],          // Eighths in middle
  ];
}

// Get weighted movement based on complexity (for random melodies)
function getMovementForComplexity(complexity: number): number {
  const rand = Math.random();

  if (complexity === 0) {
    return 0;
  }

  if (complexity <= 2) {
    if (rand < 0.7) return 0;
    if (rand < 0.85) return -1;
    return 1;
  }

  if (complexity <= 4) {
    if (rand < 0.4) return 0;
    if (rand < 0.6) return -1;
    if (rand < 0.8) return 1;
    if (rand < 0.9) return -2;
    return 2;
  }

  if (complexity <= 6) {
    if (rand < 0.2) return 0;
    if (rand < 0.4) return -1;
    if (rand < 0.6) return 1;
    if (rand < 0.75) return -2;
    if (rand < 0.9) return 2;
    if (rand < 0.95) return -3;
    return 3;
  }

  // High complexity
  if (rand < 0.1) return 0;
  if (rand < 0.25) return -1;
  if (rand < 0.4) return 1;
  if (rand < 0.55) return -2;
  if (rand < 0.7) return 2;
  if (rand < 0.8) return -3;
  if (rand < 0.9) return 3;
  if (rand < 0.95) return -4;
  return 4;
}

// Generate a scale melody (ascending then descending)
function generateScaleMelody(options: MelodyOptions): Note[] {
  const { rootMidi, scaleType, measures, beatsPerMeasure, complexity } = options;

  // Build one octave scale (8 notes including octave)
  const scale = buildScale(rootMidi, scaleType, 1);

  // Create the scale sequence: up then down
  // Up: C D E F G A B C, Down: B A G F E D C
  const scaleUp = scale.slice(0, 8);  // Root to octave
  const scaleDown = scale.slice(0, 7).reverse();  // B down to C (excluding top C to avoid repeat)
  const fullSequence = [...scaleUp, ...scaleDown]; // 15 notes total

  const melody: Note[] = [];
  let currentBeat = 0;
  let noteIndex = 0;

  // Get rhythm patterns for this complexity
  const patterns = getRhythmPatternsForComplexity(complexity, beatsPerMeasure);

  // Generate measures
  for (let m = 0; m < measures; m++) {
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    for (const duration of pattern) {
      // Get the next note in the scale sequence (loop if needed)
      const midi = fullSequence[noteIndex % fullSequence.length];

      melody.push({
        midi,
        duration,
        startBeat: currentBeat,
      });

      currentBeat += duration;
      noteIndex++;
    }
  }

  return melody;
}

// Generate a random melody
function generateRandomMelody(options: MelodyOptions): Note[] {
  const { rootMidi, scaleType, measures, beatsPerMeasure, rangeMin, rangeMax, complexity = 5 } = options;

  // Build scale for the full range
  const scale = buildScale(rootMidi - 24, scaleType, 6)
    .filter(note => note >= rangeMin && note <= rangeMax);

  if (scale.length === 0) {
    throw new Error('No notes in range for given scale');
  }

  const melody: Note[] = [];
  let currentBeat = 0;

  // Start near the middle of the range
  const middleNote = scale[Math.floor(scale.length / 2)];
  let currentNoteIndex = scale.indexOf(middleNote);

  // Get rhythm patterns for this complexity
  const patterns = getRhythmPatternsForComplexity(complexity, beatsPerMeasure);

  // Generate each measure
  for (let m = 0; m < measures; m++) {
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    for (const duration of pattern) {
      const movement = getMovementForComplexity(complexity);
      currentNoteIndex = Math.max(0, Math.min(scale.length - 1, currentNoteIndex + movement));

      melody.push({
        midi: scale[currentNoteIndex],
        duration,
        startBeat: currentBeat,
      });

      currentBeat += duration;
    }
  }

  // Apply phrase structure: end on tonic or fifth
  if (melody.length > 0) {
    const lastNote = melody[melody.length - 1];
    const tonicNotes = scale.filter(n => n % 12 === rootMidi % 12);
    const fifthNotes = scale.filter(n => n % 12 === (rootMidi + 7) % 12);
    const endingNotes = [...tonicNotes, ...fifthNotes];

    if (endingNotes.length > 0) {
      let closest = endingNotes[0];
      let minDiff = Math.abs(lastNote.midi - closest);

      for (const note of endingNotes) {
        const diff = Math.abs(lastNote.midi - note);
        if (diff < minDiff) {
          minDiff = diff;
          closest = note;
        }
      }

      lastNote.midi = closest;
    }
  }

  return melody;
}

// Main generate function
export function generateMelody(options: MelodyOptions): Note[] {
  const { melodyType = 'random' } = options;

  if (melodyType === 'scale') {
    return generateScaleMelody(options);
  }

  return generateRandomMelody(options);
}

// Generate harmony line for a melody
export function generateHarmony(
  melody: Note[],
  rootMidi: number,
  scaleType: ScaleType,
  interval: number = 3,
): Note[] {
  return melody.map(note => ({
    midi: getHarmonyNote(note.midi, rootMidi, scaleType, interval),
    duration: note.duration,
    startBeat: note.startBeat,
  }));
}

// Calculate total duration in beats
export function getTotalBeats(melody: Note[]): number {
  if (melody.length === 0) return 0;
  const lastNote = melody[melody.length - 1];
  return lastNote.startBeat + lastNote.duration;
}

// Get duration in seconds at a given tempo
export function beatsToSeconds(beats: number, tempo: number): number {
  return (beats / tempo) * 60;
}

// Get beat at a given time
export function secondsToBeats(seconds: number, tempo: number): number {
  return (seconds * tempo) / 60;
}
