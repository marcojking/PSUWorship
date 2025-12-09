/**
 * ScoringEngine Interface
 * Calculates accuracy scores based on pitch detection vs target
 */

import { MidiNote } from '../generator/IGenerator';
import { PitchResult } from '../pitch/IPitchDetector';

export interface NoteResult {
    /** The target MIDI note */
    targetNote: number;
    /** Target note start time */
    startMs: number;
    /** Target note duration */
    durationMs: number;
    /** Number of frames where pitch was detected */
    voicedFrames: number;
    /** Number of frames within tolerance */
    correctFrames: number;
    /** Percentage of time on target (0-100) */
    scorePercent: number;
    /** Average cents deviation when voiced */
    avgCentsDeviation: number;
}

export interface RunScore {
    /** Overall score as percentage (0-100) */
    overallScore: number;
    /** Per-note breakdown */
    noteResults: NoteResult[];
    /** Total voiced frames */
    totalVoicedFrames: number;
    /** Total correct frames */
    totalCorrectFrames: number;
    /** Duration of the run in ms */
    durationMs: number;
}

export interface IScoringEngine {
    /**
     * Start scoring a new run
     * @param harmonyNotes - The target harmony notes to score against
     */
    startRun(harmonyNotes: MidiNote[]): void;

    /**
     * Process a pitch detection result
     * @param pitch - The detected pitch
     * @param currentTimeMs - Current playback position
     */
    processPitch(pitch: PitchResult, currentTimeMs: number): void;

    /**
     * Check if user is currently on target
     * @returns True if current pitch matches target within tolerance
     */
    isOnTarget(): boolean;

    /**
     * Get the current target note based on playback position
     * @param currentTimeMs - Current playback position
     */
    getCurrentTarget(currentTimeMs: number): MidiNote | null;

    /**
     * End the run and calculate final scores
     * @returns Final run score
     */
    endRun(): RunScore;

    /**
     * Set pitch tolerance in cents (default 50)
     */
    setTolerance(cents: number): void;
}
