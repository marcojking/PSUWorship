/**
 * HarmonyEngine
 * Computes harmony notes from a melody based on interval rules
 */

import { MidiNote } from '../generator/IGenerator';

export type IntervalMode = 'fixed' | 'diatonic';

export interface HarmonyParams {
    /** The melody to harmonize */
    melody: MidiNote[];
    /** Interval in semitones (e.g., 4 = major third, 7 = perfect fifth) */
    interval: number;
    /** Mode: 'fixed' uses exact interval, 'diatonic' stays in key */
    mode: IntervalMode;
    /** Musical key for diatonic mode (e.g., "C", "G", "Am") */
    key?: string;
    /** Direction: 1 = above melody, -1 = below melody */
    direction?: 1 | -1;
}

export interface IHarmonyEngine {
    /**
     * Compute harmony from melody
     * @param params - Harmony parameters
     * @returns Array of harmony notes
     */
    computeHarmony(params: HarmonyParams): MidiNote[];

    /**
     * Get the scale degrees for a given key
     * @param key - Musical key (e.g., "C", "Am")
     * @returns Array of MIDI note offsets (0-11) in the scale
     */
    getScaleDegrees(key: string): number[];
}
