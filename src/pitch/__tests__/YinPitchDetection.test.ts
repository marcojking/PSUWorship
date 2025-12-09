/**
 * YIN Pitch Detection Tests
 * Verifies pitch detection accuracy
 */

import { centsDifference, detectPitch, frequencyToMidi, midiToFrequency, midiToNoteName } from '../YinPitchDetection';

describe('YinPitchDetection', () => {
    // Helper to generate a sine wave
    function generateSineWave(frequency: number, sampleRate: number, duration: number): Float32Array {
        const numSamples = Math.floor(sampleRate * duration);
        const samples = new Float32Array(numSamples);

        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            samples[i] = Math.sin(2 * Math.PI * frequency * t) * 0.5;
        }

        return samples;
    }

    describe('detectPitch', () => {
        it('should detect 440Hz (A4) within ±3 cents', () => {
            const targetFreq = 440;
            const sampleRate = 44100;
            const samples = generateSineWave(targetFreq, sampleRate, 0.1);

            const result = detectPitch(samples, { sampleRate });

            expect(result.isVoiced).toBe(true);
            expect(result.pitch).toBeGreaterThan(0);

            const cents = Math.abs(centsDifference(result.pitch, targetFreq));
            expect(cents).toBeLessThan(3); // Within ±3 cents
        });

        it('should detect 261.63Hz (C4) within ±5 cents', () => {
            const targetFreq = 261.63;
            const sampleRate = 44100;
            const samples = generateSineWave(targetFreq, sampleRate, 0.1);

            const result = detectPitch(samples, { sampleRate });

            expect(result.isVoiced).toBe(true);
            const cents = Math.abs(centsDifference(result.pitch, targetFreq));
            expect(cents).toBeLessThan(5);
        });

        it('should detect 329.63Hz (E4) within ±5 cents', () => {
            const targetFreq = 329.63;
            const sampleRate = 44100;
            const samples = generateSineWave(targetFreq, sampleRate, 0.1);

            const result = detectPitch(samples, { sampleRate });

            expect(result.isVoiced).toBe(true);
            const cents = Math.abs(centsDifference(result.pitch, targetFreq));
            expect(cents).toBeLessThan(5);
        });

        it('should return isVoiced=false for silence', () => {
            const samples = new Float32Array(4096).fill(0);

            const result = detectPitch(samples);

            expect(result.isVoiced).toBe(false);
            expect(result.pitch).toBe(0);
        });

        it('should return isVoiced=false for very quiet signal', () => {
            const samples = new Float32Array(4096);
            for (let i = 0; i < samples.length; i++) {
                samples[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.001; // Very quiet
            }

            const result = detectPitch(samples);

            expect(result.isVoiced).toBe(false);
        });

        it('should detect 110Hz (A2) - low frequency', () => {
            const targetFreq = 110;
            const sampleRate = 44100;
            const samples = generateSineWave(targetFreq, sampleRate, 0.2); // Longer for low freq

            const result = detectPitch(samples, { sampleRate, minFrequency: 50 });

            expect(result.isVoiced).toBe(true);
            const cents = Math.abs(centsDifference(result.pitch, targetFreq));
            expect(cents).toBeLessThan(10);
        });

        it('should reject frequencies outside range', () => {
            const samples = generateSineWave(30, 44100, 0.2); // Below min

            const result = detectPitch(samples, { minFrequency: 50 });

            expect(result.isVoiced).toBe(false);
        });
    });

    describe('frequencyToMidi', () => {
        it('should convert 440Hz to MIDI 69 (A4)', () => {
            expect(frequencyToMidi(440)).toBeCloseTo(69, 1);
        });

        it('should convert 261.63Hz to MIDI 60 (C4)', () => {
            expect(frequencyToMidi(261.63)).toBeCloseTo(60, 0);
        });

        it('should convert 880Hz to MIDI 81 (A5)', () => {
            expect(frequencyToMidi(880)).toBeCloseTo(81, 1);
        });

        it('should return 0 for invalid frequency', () => {
            expect(frequencyToMidi(0)).toBe(0);
            expect(frequencyToMidi(-100)).toBe(0);
        });
    });

    describe('midiToFrequency', () => {
        it('should convert MIDI 69 to 440Hz (A4)', () => {
            expect(midiToFrequency(69)).toBeCloseTo(440, 1);
        });

        it('should convert MIDI 60 to ~261.63Hz (C4)', () => {
            expect(midiToFrequency(60)).toBeCloseTo(261.63, 0);
        });
    });

    describe('centsDifference', () => {
        it('should return 0 for same frequency', () => {
            expect(centsDifference(440, 440)).toBe(0);
        });

        it('should return 100 cents for a semitone up', () => {
            const A4 = 440;
            const Asharp4 = A4 * Math.pow(2, 1 / 12);
            expect(centsDifference(Asharp4, A4)).toBeCloseTo(100, 0);
        });

        it('should return -100 cents for a semitone down', () => {
            const A4 = 440;
            const Gsharp4 = A4 / Math.pow(2, 1 / 12);
            expect(centsDifference(Gsharp4, A4)).toBeCloseTo(-100, 0);
        });

        it('should return 1200 cents for an octave', () => {
            expect(centsDifference(880, 440)).toBeCloseTo(1200, 0);
        });
    });

    describe('midiToNoteName', () => {
        it('should convert MIDI 60 to C4', () => {
            expect(midiToNoteName(60)).toBe('C4');
        });

        it('should convert MIDI 69 to A4', () => {
            expect(midiToNoteName(69)).toBe('A4');
        });

        it('should convert MIDI 72 to C5', () => {
            expect(midiToNoteName(72)).toBe('C5');
        });

        it('should handle sharps', () => {
            expect(midiToNoteName(61)).toBe('C#4');
            expect(midiToNoteName(70)).toBe('A#4');
        });
    });
});
