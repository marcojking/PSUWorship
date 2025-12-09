/**
 * HarmonyEngine
 * Computes harmony notes from a melody based on interval rules
 */

import { MidiNote } from '../generator/IGenerator';
import { HarmonyParams, IHarmonyEngine } from './IHarmonyEngine';

// Scale definitions for diatonic harmony (same as generator)
const MAJOR_SCALES: Record<string, number[]> = {
    'C': [0, 2, 4, 5, 7, 9, 11],
    'G': [7, 9, 11, 0, 2, 4, 6],
    'D': [2, 4, 6, 7, 9, 11, 1],
    'A': [9, 11, 1, 2, 4, 6, 8],
    'E': [4, 6, 8, 9, 11, 1, 3],
    'F': [5, 7, 9, 10, 0, 2, 4],
    'Bb': [10, 0, 2, 3, 5, 7, 9],
    'Eb': [3, 5, 7, 8, 10, 0, 2],
};

const MINOR_SCALES: Record<string, number[]> = {
    'Am': [9, 11, 0, 2, 4, 5, 7],
    'Em': [4, 6, 7, 9, 11, 0, 2],
    'Dm': [2, 4, 5, 7, 9, 10, 0],
    'Gm': [7, 9, 10, 0, 2, 3, 5],
    'Cm': [0, 2, 3, 5, 7, 8, 10],
    'Fm': [5, 7, 8, 10, 0, 1, 3],
};

/**
 * Get the diatonic interval for a given scale degree
 * In diatonic mode, we adjust the interval to stay within the scale
 */
function getDiatonicInterval(
    melodyNote: number,
    interval: number,
    scale: number[],
    direction: 1 | -1
): number {
    const noteClass = melodyNote % 12;
    const octave = Math.floor(melodyNote / 12);

    // Find the melody note's position in the scale
    let scalePosition = scale.indexOf(noteClass);
    if (scalePosition === -1) {
        // Note not in scale, find closest
        const distances = scale.map((n, i) => ({ i, d: Math.abs(n - noteClass) }));
        distances.sort((a, b) => a.d - b.d);
        scalePosition = distances[0].i;
    }

    // Move by the interval in scale degrees
    const targetPosition = scalePosition + (interval * direction);

    // Handle octave wrapping properly
    let octaveShift = 0;
    let wrappedPosition = targetPosition;

    while (wrappedPosition >= scale.length) {
        wrappedPosition -= scale.length;
        octaveShift++;
    }
    while (wrappedPosition < 0) {
        wrappedPosition += scale.length;
        octaveShift--;
    }

    const targetNoteClass = scale[wrappedPosition];

    // Calculate the target MIDI note, accounting for scale notes that wrap around 12
    // If target note class is lower than source, it's in the next octave
    let targetMidi = (octave + octaveShift) * 12 + targetNoteClass;

    // Ensure we go in the correct direction
    if (direction === 1 && targetMidi <= melodyNote && interval > 0) {
        targetMidi += 12;
    } else if (direction === -1 && targetMidi >= melodyNote && interval > 0) {
        targetMidi -= 12;
    }

    return targetMidi - melodyNote;
}

export class HarmonyEngine implements IHarmonyEngine {
    /**
     * Compute harmony from melody
     * @param params - Harmony parameters
     * @returns Array of harmony notes
     */
    computeHarmony(params: HarmonyParams): MidiNote[] {
        const {
            melody,
            interval,
            mode,
            key = 'C',
            direction = 1
        } = params;

        const scale = this.getScaleDegrees(key);

        return melody.map((note) => {
            let harmonyInterval: number;

            if (mode === 'fixed') {
                // Fixed mode: exact semitone interval
                harmonyInterval = interval * direction;
            } else {
                // Diatonic mode: interval adjusted to stay in key
                harmonyInterval = getDiatonicInterval(note.note, interval, scale, direction);
            }

            return {
                note: note.note + harmonyInterval,
                start_ms: note.start_ms,
                duration_ms: note.duration_ms,
            };
        });
    }

    /**
     * Get the scale degrees for a given key
     * @param key - Musical key (e.g., "C", "Am")
     * @returns Array of MIDI note offsets (0-11) in the scale
     */
    getScaleDegrees(key: string): number[] {
        // Check if minor key
        if (key.endsWith('m')) {
            return MINOR_SCALES[key] || MINOR_SCALES['Am'];
        }
        return MAJOR_SCALES[key] || MAJOR_SCALES['C'];
    }
}

// Common interval names for reference
export const INTERVALS = {
    UNISON: 0,
    MINOR_SECOND: 1,
    MAJOR_SECOND: 2,
    MINOR_THIRD: 3,
    MAJOR_THIRD: 4,
    PERFECT_FOURTH: 5,
    TRITONE: 6,
    PERFECT_FIFTH: 7,
    MINOR_SIXTH: 8,
    MAJOR_SIXTH: 9,
    MINOR_SEVENTH: 10,
    MAJOR_SEVENTH: 11,
    OCTAVE: 12,
};

// Export a singleton instance
export const harmonyEngine = new HarmonyEngine();
