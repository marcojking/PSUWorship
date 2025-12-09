/**
 * IPitchDetector Interface
 * Defines the contract for real-time pitch detection
 */

export interface PitchResult {
    /** Detected pitch in Hz (0 if unvoiced) */
    pitchHz: number;
    /** Whether the input contains voiced audio (singing) */
    isVoiced: boolean;
    /** Confidence level 0.0 to 1.0 */
    confidence: number;
    /** Timestamp in milliseconds */
    timestamp: number;
}

export type PitchCallback = (result: PitchResult) => void;

export interface IPitchDetector {
    /**
     * Start listening for pitch
     * Requests microphone permission if not already granted
     */
    start(): Promise<void>;

    /**
     * Stop listening
     */
    stop(): void;

    /**
     * Register a callback for pitch updates (~50Hz)
     * @param callback - Function to call with pitch results
     */
    onPitch(callback: PitchCallback): void;

    /**
     * Remove a previously registered callback
     * @param callback - The callback to remove
     */
    offPitch(callback: PitchCallback): void;

    /**
     * Check if currently detecting
     */
    isRunning(): boolean;

    /**
     * Clean up resources
     */
    dispose(): void;
}
