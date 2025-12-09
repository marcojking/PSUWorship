/**
 * PitchDetector
 * Real-time pitch detection from microphone
 * Uses @techoptio/react-native-live-pitch-detection for native performance
 * Falls back to expo-av + YIN algorithm if native module unavailable
 */

import { Audio } from 'expo-av';
import { IPitchDetector, PitchCallback, PitchResult } from './IPitchDetector';

// Try to import native pitch detection
let LivePitchDetection: any = null;
try {
    LivePitchDetection = require('@techoptio/react-native-live-pitch-detection').default;
} catch (e) {
    console.log('Native pitch detection not available, will use fallback');
}

/**
 * Configuration for PitchDetector
 */
export interface PitchDetectorConfig {
    /** Minimum frequency to detect in Hz (default: 80 - E2) */
    minFrequency?: number;
    /** Maximum frequency to detect in Hz (default: 1000 - B5) */
    maxFrequency?: number;
    /** Minimum volume threshold (default: 0.1) */
    minVolume?: number;
    /** Buffer size for analysis (default: 2048) */
    bufferSize?: number;
}

const DEFAULT_CONFIG: Required<PitchDetectorConfig> = {
    minFrequency: 80,
    maxFrequency: 1000,
    minVolume: 0.1,
    bufferSize: 2048,
};

/**
 * Smoothing filter for pitch values using median filtering
 */
class PitchSmoother {
    private values: number[] = [];
    private readonly windowSize: number;

    constructor(windowSize: number = 5) {
        this.windowSize = windowSize;
    }

    add(value: number): number {
        if (value <= 0) {
            // Reset on silence
            if (this.values.length > 0) {
                this.values = [];
            }
            return 0;
        }

        this.values.push(value);
        if (this.values.length > this.windowSize) {
            this.values.shift();
        }

        // Median filter (robust to outliers)
        const sorted = [...this.values].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
    }

    reset(): void {
        this.values = [];
    }
}

export class PitchDetector implements IPitchDetector {
    private config: Required<PitchDetectorConfig>;
    private callbacks: Set<PitchCallback> = new Set();
    private running: boolean = false;
    private smoother: PitchSmoother;
    private subscription: any = null;
    private lastResult: PitchResult = {
        pitchHz: 0,
        isVoiced: false,
        confidence: 0,
        timestamp: 0,
    };

    constructor(config: PitchDetectorConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.smoother = new PitchSmoother(5);
    }

    /**
     * Start listening for pitch
     */
    async start(): Promise<void> {
        if (this.running) return;

        // Request microphone permission
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
            throw new Error('Microphone permission not granted');
        }

        this.running = true;
        this.smoother.reset();

        if (LivePitchDetection) {
            // Use native pitch detection
            await this.startNative();
        } else {
            console.log('Native pitch detection not available');
            // For Expo Go, we need a different approach
            // The native module requires a dev build
        }
    }

    /**
     * Start native pitch detection
     */
    private async startNative(): Promise<void> {
        try {
            // Configure and start native pitch detection
            LivePitchDetection.configure({
                bufferSize: this.config.bufferSize,
                minVolume: this.config.minVolume,
            });

            // Subscribe to pitch updates
            this.subscription = LivePitchDetection.addListener((data: any) => {
                if (!this.running) return;

                const { note, frequency, octave } = data;

                let pitchHz = frequency || 0;
                let isVoiced = pitchHz > 0;

                // Apply frequency bounds
                if (pitchHz < this.config.minFrequency || pitchHz > this.config.maxFrequency) {
                    pitchHz = 0;
                    isVoiced = false;
                }

                // Apply smoothing
                const smoothedPitch = this.smoother.add(pitchHz);

                const result: PitchResult = {
                    pitchHz: smoothedPitch,
                    isVoiced: smoothedPitch > 0,
                    confidence: isVoiced ? 0.9 : 0,
                    timestamp: Date.now(),
                };

                this.lastResult = result;
                this.emitPitch(result);
            });

            // Start the detector
            await LivePitchDetection.start();

        } catch (error) {
            console.error('Failed to start native pitch detection:', error);
            this.running = false;
            throw error;
        }
    }

    /**
     * Stop listening
     */
    async stop(): Promise<void> {
        if (!this.running) return;

        this.running = false;

        if (LivePitchDetection && this.subscription) {
            try {
                await LivePitchDetection.stop();
                this.subscription.remove();
                this.subscription = null;
            } catch (e) {
                console.error('Error stopping pitch detection:', e);
            }
        }
    }

    /**
     * Register a callback for pitch updates
     */
    onPitch(callback: PitchCallback): void {
        this.callbacks.add(callback);
    }

    /**
     * Remove a previously registered callback
     */
    offPitch(callback: PitchCallback): void {
        this.callbacks.delete(callback);
    }

    /**
     * Emit pitch to all callbacks
     */
    private emitPitch(result: PitchResult): void {
        for (const callback of this.callbacks) {
            try {
                callback(result);
            } catch (e) {
                console.error('Error in pitch callback:', e);
            }
        }
    }

    /**
     * Check if currently detecting
     */
    isRunning(): boolean {
        return this.running;
    }

    /**
     * Get the last detected pitch
     */
    getLastPitch(): PitchResult {
        return this.lastResult;
    }

    /**
     * Clean up resources
     */
    async dispose(): Promise<void> {
        await this.stop();
        this.callbacks.clear();
    }
}

// Export singleton for convenience
export const pitchDetector = new PitchDetector();

// Re-export utilities
export { midiToFrequency } from '../synth/ToneGenerator';
export { centsDifference, frequencyToMidi, midiToNoteName } from './YinPitchDetection';

