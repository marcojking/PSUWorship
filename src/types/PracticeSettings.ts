/**
 * Practice Settings Types
 * Configuration options for harmony practice sessions
 */

/**
 * Harmony interval to sing
 */
export type HarmonyInterval = 'unison' | '2nd' | '3rd' | '4th' | '5th' | '6th' | '7th' | 'octave';

/**
 * Allowed intervals for melody generation (how far notes can jump)
 */
export interface MelodyIntervals {
    step: boolean;      // 2nds (1-2 semitones)
    third: boolean;     // 3rds (3-4 semitones)
    fourth: boolean;    // 4ths (5 semitones)
    fifth: boolean;     // 5ths (7 semitones)
    octave: boolean;    // Octave (12 semitones)
}

/**
 * Note duration settings
 */
export type NoteDuration = 'short' | 'medium' | 'long' | 'mixed';

/**
 * Musical key options
 */
export type MusicalKey = 'C' | 'G' | 'D' | 'A' | 'E' | 'F' | 'Bb' | 'Eb' |
    'Am' | 'Em' | 'Dm' | 'Gm' | 'Cm' | 'Fm';

/**
 * Practice mode
 */
export type PracticeMode = 'loop' | 'continuous';

/**
 * Complete practice settings
 */
export interface PracticeSettings {
    // Core settings
    key: MusicalKey;
    harmonyInterval: HarmonyInterval;
    practiceMode: PracticeMode;

    // Difficulty settings
    notesPerLoop: number;           // 1-10
    noteDuration: NoteDuration;
    melodyIntervals: MelodyIntervals;

    // Features
    hapticsEnabled: boolean;
    ghostMode: boolean;

    // Tolerance
    pitchToleranceCents: number;    // 25, 50, 75, 100
}

/**
 * Default practice settings
 */
export const DEFAULT_SETTINGS: PracticeSettings = {
    key: 'C',
    harmonyInterval: '3rd',
    practiceMode: 'loop',
    notesPerLoop: 4,
    noteDuration: 'medium',
    melodyIntervals: {
        step: true,
        third: true,
        fourth: false,
        fifth: false,
        octave: false,
    },
    hapticsEnabled: true,
    ghostMode: false,
    pitchToleranceCents: 50,
};

/**
 * Convert harmony interval name to semitones
 */
export function harmonyIntervalToSemitones(interval: HarmonyInterval): number {
    const map: Record<HarmonyInterval, number> = {
        'unison': 0,
        '2nd': 2,
        '3rd': 4,
        '4th': 5,
        '5th': 7,
        '6th': 9,
        '7th': 11,
        'octave': 12,
    };
    return map[interval];
}

/**
 * Get allowed jump intervals in semitones from settings
 */
export function getAllowedJumps(intervals: MelodyIntervals): number[] {
    const jumps: number[] = [];
    if (intervals.step) jumps.push(1, 2);
    if (intervals.third) jumps.push(3, 4);
    if (intervals.fourth) jumps.push(5);
    if (intervals.fifth) jumps.push(7);
    if (intervals.octave) jumps.push(12);
    return jumps.length > 0 ? jumps : [1, 2]; // Default to steps
}

/**
 * Get note duration in ms from setting
 */
export function getNoteDurationMs(duration: NoteDuration): { min: number; max: number } {
    const map: Record<NoteDuration, { min: number; max: number }> = {
        'short': { min: 300, max: 500 },
        'medium': { min: 500, max: 800 },
        'long': { min: 800, max: 1200 },
        'mixed': { min: 300, max: 1200 },
    };
    return map[duration];
}
