/**
 * YIN Pitch Detection Algorithm
 * Pure JavaScript implementation of the YIN algorithm for pitch detection
 * 
 * Reference: De Cheveigné, A., & Kawahara, H. (2002). 
 * "YIN, a fundamental frequency estimator for speech and music"
 */

/**
 * YIN pitch detection parameters
 */
export interface YinParams {
    /** Sample rate in Hz (default: 44100) */
    sampleRate?: number;
    /** Threshold for pitch detection (default: 0.1) */
    threshold?: number;
    /** Minimum frequency to detect in Hz (default: 50) */
    minFrequency?: number;
    /** Maximum frequency to detect in Hz (default: 800) */
    maxFrequency?: number;
}

/**
 * Result of pitch detection
 */
export interface YinResult {
    /** Detected pitch in Hz (0 if unvoiced) */
    pitch: number;
    /** Whether voice/pitch was detected */
    isVoiced: boolean;
    /** Confidence/probability (0-1) */
    probability: number;
}

const DEFAULT_PARAMS: Required<YinParams> = {
    sampleRate: 44100,
    threshold: 0.15,
    minFrequency: 50,
    maxFrequency: 800,
};

/**
 * Compute the difference function d(τ), then compute the 
 * cumulative mean normalized difference function d'(τ)
 */
function cumulativeMeanNormalizedDifference(
    audioBuffer: Float32Array,
    yinBufferSize: number
): Float32Array {
    const yinBuffer = new Float32Array(yinBufferSize);

    // Difference function
    for (let tau = 0; tau < yinBufferSize; tau++) {
        yinBuffer[tau] = 0;
        for (let i = 0; i < yinBufferSize; i++) {
            const delta = audioBuffer[i] - audioBuffer[i + tau];
            yinBuffer[tau] += delta * delta;
        }
    }

    // Cumulative mean normalized difference function
    yinBuffer[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau < yinBufferSize; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
    }

    return yinBuffer;
}

/**
 * Find the first minimum below threshold using absolute threshold
 */
function absoluteThreshold(
    yinBuffer: Float32Array,
    threshold: number
): number {
    let tau = 2;
    const size = yinBuffer.length;

    // Find first value below threshold
    while (tau < size) {
        if (yinBuffer[tau] < threshold) {
            // Make sure it's a local minimum
            while (tau + 1 < size && yinBuffer[tau + 1] < yinBuffer[tau]) {
                tau++;
            }
            return tau;
        }
        tau++;
    }

    // No pitch found, return -1
    return -1;
}

/**
 * Parabolic interpolation to get better pitch estimate
 */
function parabolicInterpolation(
    yinBuffer: Float32Array,
    tauEstimate: number
): number {
    const x0 = tauEstimate - 1;
    const x2 = tauEstimate + 1;

    if (x0 < 0 || x2 >= yinBuffer.length) {
        return tauEstimate;
    }

    const s0 = yinBuffer[x0];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[x2];

    // Parabolic interpolation formula
    const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));

    if (isNaN(adjustment) || !isFinite(adjustment)) {
        return tauEstimate;
    }

    return tauEstimate + adjustment;
}

/**
 * Detect pitch from audio buffer using YIN algorithm
 * @param audioBuffer - Float32Array of audio samples (-1 to 1)
 * @param params - YIN parameters
 * @returns Pitch detection result
 */
export function detectPitch(
    audioBuffer: Float32Array,
    params: YinParams = {}
): YinResult {
    const { sampleRate, threshold, minFrequency, maxFrequency } = {
        ...DEFAULT_PARAMS,
        ...params,
    };

    // Calculate buffer size based on frequency range
    const minTau = Math.floor(sampleRate / maxFrequency);
    const maxTau = Math.floor(sampleRate / minFrequency);
    const yinBufferSize = Math.min(maxTau + 1, Math.floor(audioBuffer.length / 2));

    if (audioBuffer.length < yinBufferSize * 2) {
        return { pitch: 0, isVoiced: false, probability: 0 };
    }

    // Check if there's enough signal (avoid detecting noise)
    let rms = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
        rms += audioBuffer[i] * audioBuffer[i];
    }
    rms = Math.sqrt(rms / audioBuffer.length);

    if (rms < 0.01) {
        // Signal too weak
        return { pitch: 0, isVoiced: false, probability: 0 };
    }

    // Compute cumulative mean normalized difference function
    const yinBuffer = cumulativeMeanNormalizedDifference(audioBuffer, yinBufferSize);

    // Find the first minimum below threshold
    let tauEstimate = absoluteThreshold(yinBuffer, threshold);

    if (tauEstimate === -1) {
        return { pitch: 0, isVoiced: false, probability: 0 };
    }

    // Ensure tau is within valid range
    if (tauEstimate < minTau) {
        tauEstimate = minTau;
    }

    // Parabolic interpolation for better accuracy
    const betterTau = parabolicInterpolation(yinBuffer, tauEstimate);

    // Calculate pitch
    const pitch = sampleRate / betterTau;

    // Check frequency bounds
    if (pitch < minFrequency || pitch > maxFrequency) {
        return { pitch: 0, isVoiced: false, probability: 0 };
    }

    // Calculate probability (1 - yinBuffer value at tau)
    const probability = 1 - yinBuffer[tauEstimate];

    return {
        pitch,
        isVoiced: true,
        probability: Math.max(0, Math.min(1, probability)),
    };
}

/**
 * Convert frequency in Hz to MIDI note number
 * A4 (440Hz) = MIDI 69
 */
export function frequencyToMidi(frequency: number): number {
    if (frequency <= 0) return 0;
    return 69 + 12 * Math.log2(frequency / 440);
}

/**
 * Convert MIDI note number to frequency in Hz
 */
export function midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Calculate cents deviation from target frequency
 * @param detectedFreq - Detected frequency in Hz
 * @param targetFreq - Target frequency in Hz
 * @returns Cents deviation (-1200 to +1200 for octave)
 */
export function centsDifference(detectedFreq: number, targetFreq: number): number {
    if (detectedFreq <= 0 || targetFreq <= 0) return 0;
    return 1200 * Math.log2(detectedFreq / targetFreq);
}

/**
 * Get note name from MIDI number
 */
export function midiToNoteName(midiNote: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = noteNames[Math.round(midiNote) % 12];
    return `${note}${octave}`;
}
