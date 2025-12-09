/**
 * LocalGenerator
 * Generates deterministic melodies from a seed
 * Same seed + params = identical melody (reproducible for practice)
 */

import { GeneratorParams, IGenerator, MidiNote } from './IGenerator';

// Scale definitions (semitones from root)
const SCALES: Record<string, number[]> = {
    // Major scales
    'C': [0, 2, 4, 5, 7, 9, 11],
    'G': [7, 9, 11, 0, 2, 4, 6],
    'D': [2, 4, 6, 7, 9, 11, 1],
    'A': [9, 11, 1, 2, 4, 6, 8],
    'E': [4, 6, 8, 9, 11, 1, 3],
    'F': [5, 7, 9, 10, 0, 2, 4],
    'Bb': [10, 0, 2, 3, 5, 7, 9],
    'Eb': [3, 5, 7, 8, 10, 0, 2],
    // Minor scales (natural minor)
    'Am': [9, 11, 0, 2, 4, 5, 7],
    'Em': [4, 6, 7, 9, 11, 0, 2],
    'Dm': [2, 4, 5, 7, 9, 10, 0],
    'Gm': [7, 9, 10, 0, 2, 3, 5],
    'Cm': [0, 2, 3, 5, 7, 8, 10],
    'Fm': [5, 7, 8, 10, 0, 1, 3],
};

// Note durations by difficulty (in ms)
const DURATIONS: Record<number, number[]> = {
    1: [800, 1000, 1200],           // Easy: longer notes
    2: [400, 600, 800, 1000],       // Medium: varied
    3: [200, 300, 400, 600, 800],   // Hard: faster, more variety
};

// Interval jumps by difficulty (in scale degrees)
const MAX_JUMP: Record<number, number> = {
    1: 2,  // Easy: steps and small skips
    2: 3,  // Medium: up to thirds
    3: 5,  // Hard: larger leaps
};

/**
 * Seeded pseudo-random number generator (Mulberry32)
 * Deterministic: same seed always produces same sequence
 */
class SeededRandom {
    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    /** Returns a number between 0 and 1 */
    next(): number {
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /** Returns an integer between min and max (inclusive) */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /** Pick a random element from an array */
    pick<T>(arr: T[]): T {
        return arr[this.nextInt(0, arr.length - 1)];
    }
}

export class LocalGenerator implements IGenerator {
    /**
     * Generate a deterministic melody
     * @param params - Generation parameters
     * @returns Array of MIDI notes
     */
    generate(params: GeneratorParams): MidiNote[] {
        const { seed, key, difficulty, lengthInNotes } = params;
        const rng = new SeededRandom(seed);

        // Get scale for the key (default to C major if unknown)
        const scale = SCALES[key] || SCALES['C'];
        const durations = DURATIONS[difficulty];
        const maxJump = MAX_JUMP[difficulty];

        // Start in a comfortable vocal range (C4 to C5, MIDI 60-72)
        const baseOctave = 4;
        const baseMidi = 60; // C4

        const notes: MidiNote[] = [];
        let currentTimeMs = 0;
        let currentScaleDegree = rng.nextInt(0, scale.length - 1);

        for (let i = 0; i < lengthInNotes; i++) {
            // Calculate MIDI note number
            const scaleNote = scale[currentScaleDegree];
            const midiNote = baseMidi + scaleNote;

            // Pick duration
            const duration = rng.pick(durations);

            notes.push({
                note: midiNote,
                start_ms: currentTimeMs,
                duration_ms: duration,
            });

            currentTimeMs += duration;

            // Move to next note (constrained by difficulty)
            const jump = rng.nextInt(-maxJump, maxJump);
            currentScaleDegree = Math.max(0, Math.min(scale.length - 1, currentScaleDegree + jump));
        }

        return notes;
    }
}

// Export a singleton instance for convenience
export const localGenerator = new LocalGenerator();
