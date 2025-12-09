/**
 * HarmonyEngine Tests
 * Verifies harmony computation in fixed and diatonic modes
 */

import { MidiNote } from '../../generator/IGenerator';
import { HarmonyEngine, INTERVALS } from '../HarmonyEngine';

describe('HarmonyEngine', () => {
    const engine = new HarmonyEngine();

    // Helper to create a simple melody
    const createMelody = (notes: number[]): MidiNote[] => {
        return notes.map((note, i) => ({
            note,
            start_ms: i * 500,
            duration_ms: 500,
        }));
    };

    describe('fixed mode', () => {
        it('should add exact semitone interval above melody', () => {
            const melody = createMelody([60, 62, 64]); // C4, D4, E4

            const harmony = engine.computeHarmony({
                melody,
                interval: INTERVALS.MAJOR_THIRD, // +4 semitones
                mode: 'fixed',
                direction: 1,
            });

            expect(harmony.map(n => n.note)).toEqual([64, 66, 68]); // E4, F#4, G#4
        });

        it('should add exact semitone interval below melody', () => {
            const melody = createMelody([60, 62, 64]); // C4, D4, E4

            const harmony = engine.computeHarmony({
                melody,
                interval: INTERVALS.MAJOR_THIRD, // -4 semitones
                mode: 'fixed',
                direction: -1,
            });

            expect(harmony.map(n => n.note)).toEqual([56, 58, 60]); // G#3, A#3, C4
        });

        it('should preserve timing from melody', () => {
            const melody = createMelody([60, 64, 67]);

            const harmony = engine.computeHarmony({
                melody,
                interval: INTERVALS.PERFECT_FIFTH,
                mode: 'fixed',
            });

            harmony.forEach((note, i) => {
                expect(note.start_ms).toBe(melody[i].start_ms);
                expect(note.duration_ms).toBe(melody[i].duration_ms);
            });
        });

        it('should handle perfect fifth interval', () => {
            const melody = createMelody([60]); // C4

            const harmony = engine.computeHarmony({
                melody,
                interval: INTERVALS.PERFECT_FIFTH, // +7 semitones
                mode: 'fixed',
                direction: 1,
            });

            expect(harmony[0].note).toBe(67); // G4
        });

        it('should handle octave interval', () => {
            const melody = createMelody([60]); // C4

            const harmony = engine.computeHarmony({
                melody,
                interval: INTERVALS.OCTAVE, // +12 semitones
                mode: 'fixed',
                direction: 1,
            });

            expect(harmony[0].note).toBe(72); // C5
        });
    });

    describe('diatonic mode', () => {
        it('should produce thirds that stay in C major', () => {
            // In C major, third above C is E (4 semitones)
            // Third above E is G (3 semitones) - stays diatonic!
            const melody = createMelody([60, 64]); // C4, E4

            const harmony = engine.computeHarmony({
                melody,
                interval: 2, // Third (2 scale degrees)
                mode: 'diatonic',
                key: 'C',
                direction: 1,
            });

            // C -> E (skip 2 degrees: C-D-E)
            // E -> G (skip 2 degrees: E-F-G)
            expect(harmony.map(n => n.note)).toEqual([64, 67]); // E4, G4
        });

        it('should work with A minor scale', () => {
            const melody = createMelody([69]); // A4

            const harmony = engine.computeHarmony({
                melody,
                interval: 2, // Third (2 scale degrees)
                mode: 'diatonic',
                key: 'Am',
                direction: 1,
            });

            // A minor: A-B-C-D-E-F-G, third above A (skipping B) is C
            // In this implementation, the scale wraps, so A4 + 2 degrees = C (lower octave representation)
            // The important thing is the interval is correct (+3 semitones = minor third)
            const intervalSemitones = harmony[0].note - melody[0].note;
            expect(intervalSemitones).toBe(3); // A to C is a minor third (3 semitones)
        });
    });

    describe('getScaleDegrees', () => {
        it('should return C major scale degrees', () => {
            const scale = engine.getScaleDegrees('C');
            expect(scale).toEqual([0, 2, 4, 5, 7, 9, 11]); // C D E F G A B
        });

        it('should return A minor scale degrees', () => {
            const scale = engine.getScaleDegrees('Am');
            expect(scale).toEqual([9, 11, 0, 2, 4, 5, 7]); // A B C D E F G
        });

        it('should fallback to C major for unknown key', () => {
            const scale = engine.getScaleDegrees('X#');
            expect(scale).toEqual([0, 2, 4, 5, 7, 9, 11]);
        });

        it('should fallback to A minor for unknown minor key', () => {
            const scale = engine.getScaleDegrees('Xm');
            expect(scale).toEqual([9, 11, 0, 2, 4, 5, 7]);
        });
    });

    describe('edge cases', () => {
        it('should handle empty melody', () => {
            const harmony = engine.computeHarmony({
                melody: [],
                interval: 4,
                mode: 'fixed',
            });

            expect(harmony).toEqual([]);
        });

        it('should handle unison interval', () => {
            const melody = createMelody([60, 62, 64]);

            const harmony = engine.computeHarmony({
                melody,
                interval: INTERVALS.UNISON,
                mode: 'fixed',
            });

            expect(harmony.map(n => n.note)).toEqual([60, 62, 64]);
        });
    });
});
