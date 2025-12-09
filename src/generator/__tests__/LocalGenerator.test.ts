/**
 * LocalGenerator Tests
 * Verifies deterministic melody generation
 */

import { GeneratorParams } from '../IGenerator';
import { LocalGenerator } from '../LocalGenerator';

describe('LocalGenerator', () => {
    const generator = new LocalGenerator();

    describe('determinism', () => {
        it('should produce identical melodies for the same seed', () => {
            const params: GeneratorParams = {
                seed: 12345,
                key: 'C',
                difficulty: 2,
                lengthInNotes: 8,
            };

            const melody1 = generator.generate(params);
            const melody2 = generator.generate(params);

            expect(melody1).toEqual(melody2);
        });

        it('should produce different melodies for different seeds', () => {
            const params1: GeneratorParams = {
                seed: 12345,
                key: 'C',
                difficulty: 2,
                lengthInNotes: 8,
            };

            const params2: GeneratorParams = {
                ...params1,
                seed: 54321,
            };

            const melody1 = generator.generate(params1);
            const melody2 = generator.generate(params2);

            // At least some notes should be different
            const isDifferent = melody1.some(
                (note, i) => note.note !== melody2[i].note
            );
            expect(isDifferent).toBe(true);
        });

        it('should produce the same melody across multiple calls', () => {
            const params: GeneratorParams = {
                seed: 99999,
                key: 'G',
                difficulty: 1,
                lengthInNotes: 16,
            };

            // Generate 5 times and verify all are identical
            const melodies = Array.from({ length: 5 }, () => generator.generate(params));

            for (let i = 1; i < melodies.length; i++) {
                expect(melodies[i]).toEqual(melodies[0]);
            }
        });
    });

    describe('melody structure', () => {
        it('should generate the correct number of notes', () => {
            const params: GeneratorParams = {
                seed: 11111,
                key: 'C',
                difficulty: 2,
                lengthInNotes: 12,
            };

            const melody = generator.generate(params);
            expect(melody).toHaveLength(12);
        });

        it('should have sequential, non-overlapping timing', () => {
            const params: GeneratorParams = {
                seed: 22222,
                key: 'Am',
                difficulty: 3,
                lengthInNotes: 8,
            };

            const melody = generator.generate(params);

            for (let i = 1; i < melody.length; i++) {
                const prevEnd = melody[i - 1].start_ms + melody[i - 1].duration_ms;
                expect(melody[i].start_ms).toBe(prevEnd);
            }
        });

        it('should generate notes in vocal range (MIDI 60-72)', () => {
            const params: GeneratorParams = {
                seed: 33333,
                key: 'C',
                difficulty: 2,
                lengthInNotes: 20,
            };

            const melody = generator.generate(params);

            melody.forEach((note) => {
                expect(note.note).toBeGreaterThanOrEqual(60);
                expect(note.note).toBeLessThanOrEqual(72);
            });
        });
    });

    describe('difficulty levels', () => {
        it('should have longer notes on easy difficulty', () => {
            const easyParams: GeneratorParams = {
                seed: 44444,
                key: 'C',
                difficulty: 1,
                lengthInNotes: 10,
            };

            const hardParams: GeneratorParams = {
                ...easyParams,
                difficulty: 3,
            };

            const easyMelody = generator.generate(easyParams);
            const hardMelody = generator.generate(hardParams);

            const easyAvgDuration = easyMelody.reduce((sum, n) => sum + n.duration_ms, 0) / easyMelody.length;
            const hardAvgDuration = hardMelody.reduce((sum, n) => sum + n.duration_ms, 0) / hardMelody.length;

            // Easy should have longer average duration
            expect(easyAvgDuration).toBeGreaterThan(hardAvgDuration);
        });
    });

    describe('different keys', () => {
        it('should work with major keys', () => {
            const keys = ['C', 'G', 'D', 'A', 'E', 'F'];

            keys.forEach((key) => {
                const params: GeneratorParams = {
                    seed: 55555,
                    key,
                    difficulty: 2,
                    lengthInNotes: 4,
                };

                const melody = generator.generate(params);
                expect(melody).toHaveLength(4);
            });
        });

        it('should work with minor keys', () => {
            const keys = ['Am', 'Em', 'Dm', 'Gm'];

            keys.forEach((key) => {
                const params: GeneratorParams = {
                    seed: 66666,
                    key,
                    difficulty: 2,
                    lengthInNotes: 4,
                };

                const melody = generator.generate(params);
                expect(melody).toHaveLength(4);
            });
        });
    });
});
