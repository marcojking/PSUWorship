/**
 * ToneGenerator
 * Generates audio buffers for MIDI notes using Web Audio API concepts
 * For Expo, we generate WAV data that can be played via expo-av
 */

/**
 * Convert MIDI note number to frequency in Hz
 * A4 (MIDI 69) = 440 Hz
 */
export function midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Generate a sine wave audio buffer as base64 WAV
 * @param frequency - Frequency in Hz
 * @param durationMs - Duration in milliseconds
 * @param sampleRate - Sample rate (default 44100)
 * @returns Base64-encoded WAV data URI
 */
export function generateSineWave(
    frequency: number,
    durationMs: number,
    sampleRate: number = 44100
): string {
    const numSamples = Math.floor((durationMs / 1000) * sampleRate);
    const samples = new Int16Array(numSamples);

    // Apply envelope (attack-decay-sustain-release) to avoid clicks
    const attackSamples = Math.min(Math.floor(sampleRate * 0.01), numSamples / 4); // 10ms attack
    const releaseSamples = Math.min(Math.floor(sampleRate * 0.05), numSamples / 4); // 50ms release

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let amplitude = 0.3; // Base amplitude (30% to avoid clipping)

        // Apply envelope
        if (i < attackSamples) {
            amplitude *= i / attackSamples; // Attack
        } else if (i > numSamples - releaseSamples) {
            amplitude *= (numSamples - i) / releaseSamples; // Release
        }

        // Generate sine wave sample
        const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude;
        samples[i] = Math.floor(sample * 32767); // Convert to 16-bit integer
    }

    return createWavDataUri(samples, sampleRate);
}

/**
 * Generate a piano-like tone (sine + harmonics) as base64 WAV
 * @param frequency - Frequency in Hz
 * @param durationMs - Duration in milliseconds
 * @param sampleRate - Sample rate (default 44100)
 * @returns Base64-encoded WAV data URI
 */
export function generatePianoTone(
    frequency: number,
    durationMs: number,
    sampleRate: number = 44100
): string {
    const numSamples = Math.floor((durationMs / 1000) * sampleRate);
    const samples = new Int16Array(numSamples);

    // Harmonic weights for piano-like timbre
    const harmonics = [1.0, 0.5, 0.25, 0.125, 0.0625];

    // Envelope parameters
    const attackSamples = Math.floor(sampleRate * 0.005); // 5ms attack
    const decaySamples = Math.floor(sampleRate * 0.1); // 100ms decay
    const sustainLevel = 0.6;
    const releaseSamples = Math.floor(sampleRate * 0.1); // 100ms release

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let envelope = 0;

        // ADSR envelope
        if (i < attackSamples) {
            envelope = i / attackSamples;
        } else if (i < attackSamples + decaySamples) {
            const decayProgress = (i - attackSamples) / decaySamples;
            envelope = 1 - (1 - sustainLevel) * decayProgress;
        } else if (i < numSamples - releaseSamples) {
            envelope = sustainLevel;
        } else {
            envelope = sustainLevel * (numSamples - i) / releaseSamples;
        }

        // Sum harmonics
        let sample = 0;
        for (let h = 0; h < harmonics.length; h++) {
            const harmonicFreq = frequency * (h + 1);
            if (harmonicFreq < sampleRate / 2) { // Nyquist limit
                sample += harmonics[h] * Math.sin(2 * Math.PI * harmonicFreq * t);
            }
        }

        // Apply envelope and normalize
        const amplitude = 0.25; // Reduce amplitude to prevent clipping from harmonics
        samples[i] = Math.floor(sample * envelope * amplitude * 32767);
    }

    return createWavDataUri(samples, sampleRate);
}

/**
 * Create a WAV data URI from audio samples
 */
function createWavDataUri(samples: Int16Array, sampleRate: number): string {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = samples.length * (bitsPerSample / 8);
    const fileSize = 44 + dataSize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Audio data
    for (let i = 0; i < samples.length; i++) {
        view.setInt16(44 + i * 2, samples[i], true);
    }

    // Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}
