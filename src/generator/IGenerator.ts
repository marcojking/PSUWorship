/**
 * IGenerator Interface
 * Defines the contract for melody generation
 */

export interface MidiNote {
    /** MIDI note number (60 = C4, 69 = A4) */
    note: number;
    /** Start time in milliseconds */
    start_ms: number;
    /** Duration in milliseconds */
    duration_ms: number;
}

export interface GeneratorParams {
    /** Seed for deterministic generation (same seed = same melody) */
    seed: number;
    /** Musical key, e.g., "C", "G", "Am", "F#m" */
    key: string;
    /** Difficulty level: 1=easy, 2=medium, 3=hard */
    difficulty: 1 | 2 | 3;
    /** Number of notes to generate */
    lengthInNotes: number;
}

export interface IGenerator {
    /**
     * Generate a deterministic melody
     * @param params - Generation parameters
     * @returns Array of MIDI notes
     */
    generate(params: GeneratorParams): MidiNote[];
}
