/**
 * LocalSynthAdapter
 * Cross-platform audio playback using expo-av
 * Generates and plays synthesized tones for melody and harmony
 */

import { Audio } from 'expo-av';
import { MidiNote } from '../generator/IGenerator';
import { ISynthAdapter } from './ISynthAdapter';
import { generatePianoTone, midiToFrequency } from './ToneGenerator';

interface LoadedNote {
    note: MidiNote;
    sound: Audio.Sound;
    isHarmony: boolean;
}

export class LocalSynthAdapter implements ISynthAdapter {
    private melodyNotes: LoadedNote[] = [];
    private harmonyNotes: LoadedNote[] = [];
    private isPlaying: boolean = false;
    private isPaused: boolean = false;
    private isLooping: boolean = false;
    private volume: number = 1.0;
    private harmonyMuted: boolean = false;
    private currentPosition: number = 0;
    private startTime: number = 0;
    private phraseDuration: number = 0;
    private playbackTimer: ReturnType<typeof setTimeout> | null = null;
    private initialized: boolean = false;

    /**
     * Initialize the audio engine
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Configure audio mode for playback
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }

    /**
     * Load a phrase for playback
     * @param notes - Melody notes to play
     * @param harmonyNotes - Optional harmony notes (if not provided, only melody plays)
     */
    async loadPhrase(notes: MidiNote[], harmonyNotes?: MidiNote[]): Promise<void> {
        // Unload any existing sounds
        await this.unloadAll();

        // Calculate phrase duration
        if (notes.length > 0) {
            const lastNote = notes[notes.length - 1];
            this.phraseDuration = lastNote.start_ms + lastNote.duration_ms;
        }

        // Generate and load melody sounds
        for (const note of notes) {
            try {
                const frequency = midiToFrequency(note.note);
                const wavUri = generatePianoTone(frequency, note.duration_ms);

                const { sound } = await Audio.Sound.createAsync(
                    { uri: wavUri },
                    { volume: this.volume }
                );

                this.melodyNotes.push({ note, sound, isHarmony: false });
            } catch (error) {
                console.error(`Failed to load melody note ${note.note}:`, error);
            }
        }

        // Generate and load harmony sounds if provided
        if (harmonyNotes) {
            for (const note of harmonyNotes) {
                try {
                    const frequency = midiToFrequency(note.note);
                    const wavUri = generatePianoTone(frequency, note.duration_ms);

                    const { sound } = await Audio.Sound.createAsync(
                        { uri: wavUri },
                        { volume: this.harmonyMuted ? 0 : this.volume * 0.7 } // Harmony slightly quieter
                    );

                    this.harmonyNotes.push({ note, sound, isHarmony: true });
                } catch (error) {
                    console.error(`Failed to load harmony note ${note.note}:`, error);
                }
            }
        }
    }

    /**
     * Start playback
     * @param loop - If true, loop the phrase indefinitely
     */
    play(loop: boolean = false): void {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.isPaused = false;
        this.isLooping = loop;
        this.startTime = Date.now() - this.currentPosition;

        this.scheduleNotes();
    }

    /**
     * Schedule notes for playback
     */
    private scheduleNotes(): void {
        if (!this.isPlaying || this.isPaused) return;

        const elapsed = Date.now() - this.startTime;
        this.currentPosition = elapsed % this.phraseDuration;

        const loopOffset = Math.floor(elapsed / this.phraseDuration) * this.phraseDuration;

        // Check melody notes
        for (const loaded of this.melodyNotes) {
            const noteStart = loaded.note.start_ms;
            const noteEnd = noteStart + loaded.note.duration_ms;
            const adjustedElapsed = elapsed - loopOffset;

            // If we're at the start of this note, play it
            if (adjustedElapsed >= noteStart && adjustedElapsed < noteStart + 50) {
                this.playNote(loaded);
            }
        }

        // Check harmony notes
        if (!this.harmonyMuted) {
            for (const loaded of this.harmonyNotes) {
                const noteStart = loaded.note.start_ms;
                const adjustedElapsed = elapsed - loopOffset;

                if (adjustedElapsed >= noteStart && adjustedElapsed < noteStart + 50) {
                    this.playNote(loaded);
                }
            }
        }

        // Check if we've reached the end
        if (elapsed >= this.phraseDuration) {
            if (this.isLooping) {
                // Reset for next loop
                this.startTime = Date.now();
            } else {
                this.isPlaying = false;
                return;
            }
        }

        // Schedule next check
        this.playbackTimer = setTimeout(() => this.scheduleNotes(), 20); // 50Hz check rate
    }

    /**
     * Play a single note
     */
    private async playNote(loaded: LoadedNote): Promise<void> {
        try {
            await loaded.sound.setPositionAsync(0);
            await loaded.sound.playAsync();
        } catch (error) {
            console.error('Failed to play note:', error);
        }
    }

    /**
     * Stop playback
     */
    stop(): void {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentPosition = 0;

        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }

        // Stop all sounds
        this.stopAllSounds();
    }

    /**
     * Pause playback
     */
    pause(): void {
        if (!this.isPlaying || this.isPaused) return;

        this.isPaused = true;
        this.currentPosition = Date.now() - this.startTime;

        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }

        this.stopAllSounds();
    }

    /**
     * Resume playback from pause
     */
    resume(): void {
        if (!this.isPaused) return;

        this.isPaused = false;
        this.startTime = Date.now() - this.currentPosition;
        this.scheduleNotes();
    }

    /**
     * Set master volume
     * @param volume - Volume level 0.0 to 1.0
     */
    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));

        // Update all loaded sounds
        for (const loaded of [...this.melodyNotes, ...this.harmonyNotes]) {
            loaded.sound.setVolumeAsync(
                loaded.isHarmony && !this.harmonyMuted
                    ? this.volume * 0.7
                    : this.volume
            ).catch(console.error);
        }
    }

    /**
     * Mute/unmute the harmony track (for ghost mode)
     * @param muted - Whether harmony should be muted
     */
    setHarmonyMuted(muted: boolean): void {
        this.harmonyMuted = muted;

        for (const loaded of this.harmonyNotes) {
            loaded.sound.setVolumeAsync(muted ? 0 : this.volume * 0.7).catch(console.error);
        }
    }

    /**
     * Get current playback position in milliseconds
     */
    getCurrentPosition(): number {
        if (this.isPlaying && !this.isPaused) {
            return (Date.now() - this.startTime) % this.phraseDuration;
        }
        return this.currentPosition;
    }

    /**
     * Get phrase duration in milliseconds
     */
    getPhraseDuration(): number {
        return this.phraseDuration;
    }

    /**
     * Check if currently playing
     */
    isCurrentlyPlaying(): boolean {
        return this.isPlaying && !this.isPaused;
    }

    /**
     * Stop all currently playing sounds
     */
    private async stopAllSounds(): Promise<void> {
        for (const loaded of [...this.melodyNotes, ...this.harmonyNotes]) {
            try {
                await loaded.sound.stopAsync();
            } catch (error) {
                // Ignore errors when stopping
            }
        }
    }

    /**
     * Unload all sounds from memory
     */
    private async unloadAll(): Promise<void> {
        for (const loaded of [...this.melodyNotes, ...this.harmonyNotes]) {
            try {
                await loaded.sound.unloadAsync();
            } catch (error) {
                // Ignore errors when unloading
            }
        }
        this.melodyNotes = [];
        this.harmonyNotes = [];
    }

    /**
     * Clean up resources
     */
    async dispose(): Promise<void> {
        this.stop();
        await this.unloadAll();
        this.initialized = false;
    }
}

// Export a singleton instance
export const localSynthAdapter = new LocalSynthAdapter();
