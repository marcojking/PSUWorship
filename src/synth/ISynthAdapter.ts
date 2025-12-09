/**
 * ISynthAdapter Interface
 * Defines the contract for audio synthesis/playback
 */

import { MidiNote } from '../generator/IGenerator';

export interface ISynthAdapter {
    /**
     * Initialize the audio engine
     */
    initialize(): Promise<void>;

    /**
     * Load a phrase for playback
     * @param notes - Array of MIDI notes to play
     */
    loadPhrase(notes: MidiNote[]): Promise<void>;

    /**
     * Start playback
     * @param loop - If true, loop the phrase indefinitely
     */
    play(loop?: boolean): void;

    /**
     * Stop playback
     */
    stop(): void;

    /**
     * Pause playback
     */
    pause(): void;

    /**
     * Resume playback from pause
     */
    resume(): void;

    /**
     * Set master volume
     * @param volume - Volume level 0.0 to 1.0
     */
    setVolume(volume: number): void;

    /**
     * Mute/unmute the harmony track (for ghost mode)
     * @param muted - Whether harmony should be muted
     */
    setHarmonyMuted(muted: boolean): void;

    /**
     * Get current playback position in milliseconds
     */
    getCurrentPosition(): number;

    /**
     * Clean up resources
     */
    dispose(): void;
}
