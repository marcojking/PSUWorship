/**
 * ScoringEngine
 * Calculates accuracy scores based on pitch detection vs target notes
 */

import { MidiNote } from '../generator/IGenerator';
import { PitchResult } from '../pitch/IPitchDetector';
import { centsDifference, midiToFrequency } from '../pitch/YinPitchDetection';
import { IScoringEngine, NoteResult, RunScore } from './IScoringEngine';

/**
 * Frame-level pitch data
 */
interface PitchFrame {
    timestamp: number;
    pitchHz: number;
    isVoiced: boolean;
    targetNote: number;
    centsDeviation: number;
    isCorrect: boolean;
}

export class ScoringEngine implements IScoringEngine {
    private harmonyNotes: MidiNote[] = [];
    private frames: PitchFrame[] = [];
    private toleranceCents: number = 50;
    private isRunning: boolean = false;
    private startTime: number = 0;
    private currentTargetIndex: number = -1;
    private onTargetNow: boolean = false;

    /**
     * Start scoring a new run
     */
    startRun(harmonyNotes: MidiNote[]): void {
        this.harmonyNotes = harmonyNotes;
        this.frames = [];
        this.isRunning = true;
        this.startTime = Date.now();
        this.currentTargetIndex = -1;
        this.onTargetNow = false;
    }

    /**
     * Process a pitch detection result
     */
    processPitch(pitch: PitchResult, currentTimeMs: number): void {
        if (!this.isRunning) return;

        const target = this.getCurrentTarget(currentTimeMs);
        if (!target) return;

        let centsDeviation = 0;
        let isCorrect = false;

        if (pitch.isVoiced && pitch.pitchHz > 0) {
            const targetFreq = midiToFrequency(target.note);
            centsDeviation = centsDifference(pitch.pitchHz, targetFreq);
            isCorrect = Math.abs(centsDeviation) <= this.toleranceCents;
        }

        this.onTargetNow = isCorrect;

        this.frames.push({
            timestamp: currentTimeMs,
            pitchHz: pitch.pitchHz,
            isVoiced: pitch.isVoiced,
            targetNote: target.note,
            centsDeviation,
            isCorrect,
        });
    }

    /**
     * Check if user is currently on target
     */
    isOnTarget(): boolean {
        return this.onTargetNow;
    }

    /**
     * Get current target note
     */
    getCurrentTarget(currentTimeMs: number): MidiNote | null {
        for (let i = 0; i < this.harmonyNotes.length; i++) {
            const note = this.harmonyNotes[i];
            if (currentTimeMs >= note.start_ms && currentTimeMs < note.start_ms + note.duration_ms) {
                this.currentTargetIndex = i;
                return note;
            }
        }
        return null;
    }

    /**
     * Get the current target MIDI note number
     */
    getCurrentTargetMidi(): number {
        if (this.currentTargetIndex >= 0 && this.currentTargetIndex < this.harmonyNotes.length) {
            return this.harmonyNotes[this.currentTargetIndex].note;
        }
        return 0;
    }

    /**
     * End the run and calculate final scores
     */
    endRun(): RunScore {
        this.isRunning = false;
        const durationMs = Date.now() - this.startTime;

        // Group frames by target note
        const noteFrames = new Map<number, PitchFrame[]>();

        for (const frame of this.frames) {
            const noteIndex = this.harmonyNotes.findIndex(
                n => frame.timestamp >= n.start_ms && frame.timestamp < n.start_ms + n.duration_ms
            );
            if (noteIndex >= 0) {
                if (!noteFrames.has(noteIndex)) {
                    noteFrames.set(noteIndex, []);
                }
                noteFrames.get(noteIndex)!.push(frame);
            }
        }

        // Calculate per-note results
        const noteResults: NoteResult[] = [];
        let totalVoicedFrames = 0;
        let totalCorrectFrames = 0;

        for (let i = 0; i < this.harmonyNotes.length; i++) {
            const note = this.harmonyNotes[i];
            const frames = noteFrames.get(i) || [];

            const voicedFrames = frames.filter(f => f.isVoiced).length;
            const correctFrames = frames.filter(f => f.isCorrect).length;
            const scorePercent = frames.length > 0 ? (correctFrames / frames.length) * 100 : 0;

            const voicedWithDeviation = frames.filter(f => f.isVoiced);
            const avgCentsDeviation = voicedWithDeviation.length > 0
                ? voicedWithDeviation.reduce((sum, f) => sum + Math.abs(f.centsDeviation), 0) / voicedWithDeviation.length
                : 0;

            totalVoicedFrames += voicedFrames;
            totalCorrectFrames += correctFrames;

            noteResults.push({
                targetNote: note.note,
                startMs: note.start_ms,
                durationMs: note.duration_ms,
                voicedFrames,
                correctFrames,
                scorePercent,
                avgCentsDeviation,
            });
        }

        const overallScore = this.frames.length > 0
            ? (totalCorrectFrames / this.frames.length) * 100
            : 0;

        return {
            overallScore,
            noteResults,
            totalVoicedFrames,
            totalCorrectFrames,
            durationMs,
        };
    }

    /**
     * Set pitch tolerance in cents
     */
    setTolerance(cents: number): void {
        this.toleranceCents = cents;
    }

    /**
     * Get tolerance in cents
     */
    getTolerance(): number {
        return this.toleranceCents;
    }
}

// Export singleton
export const scoringEngine = new ScoringEngine();
