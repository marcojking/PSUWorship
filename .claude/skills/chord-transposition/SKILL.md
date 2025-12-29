# Chord Transposition

Expert knowledge of chord transposition algorithms, music theory, and implementation patterns.

## Core Concepts

### Chromatic Scale

The 12 notes of Western music, each a semitone apart:

```
C - C#/Db - D - D#/Eb - E - F - F#/Gb - G - G#/Ab - A - A#/Bb - B
```

### Transposition = Moving by Semitones

To transpose a chord:
1. Find the root note's position (0-11)
2. Add the number of semitones to transpose
3. Wrap around using modulo 12
4. Keep the chord quality unchanged

```typescript
const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function transpose(chord: string, semitones: number, preferFlats: boolean = false): string {
  const { root, quality, bass } = parseChord(chord);

  const notes = preferFlats ? FLAT_NOTES : SHARP_NOTES;
  const rootIndex = getNoteIndex(root);
  const newIndex = (rootIndex + semitones + 12) % 12;
  const newRoot = notes[newIndex];

  let result = newRoot + quality;

  if (bass) {
    const bassIndex = getNoteIndex(bass);
    const newBassIndex = (bassIndex + semitones + 12) % 12;
    result += '/' + notes[newBassIndex];
  }

  return result;
}
```

## Enharmonic Equivalents

Same pitch, different names:

| Sharps | Flats |
|--------|-------|
| C# | Db |
| D# | Eb |
| F# | Gb |
| G# | Ab |
| A# | Bb |

### When to Use Sharps vs Flats

**Rule of thumb**: Match the target key signature.

| Target Key | Use |
|------------|-----|
| C, G, D, A, E, B, F# | Sharps |
| F, Bb, Eb, Ab, Db, Gb | Flats |

```typescript
const SHARP_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

function preferFlats(targetKey: string): boolean {
  return FLAT_KEYS.includes(targetKey);
}
```

## Circle of Fifths

Essential for understanding key relationships:

```
        C
    F       G
  Bb          D
 Eb            A
  Ab          E
    Db      B
       F#/Gb
```

- Moving clockwise: up a 5th (7 semitones)
- Moving counter-clockwise: up a 4th (5 semitones)
- Adjacent keys share 6 of 7 notes

### Transposition Intervals

| Interval | Semitones | Example C→ |
|----------|-----------|------------|
| m2 (up half step) | +1 | C# |
| M2 (up whole step) | +2 | D |
| m3 | +3 | Eb |
| M3 | +4 | E |
| P4 | +5 | F |
| Tritone | +6 | F#/Gb |
| P5 | +7 | G |
| m6 | +8 | Ab |
| M6 | +9 | A |
| m7 | +10 | Bb |
| M7 | +11 | B |
| Octave | +12 | C |

## Chord Parsing

### Regex Pattern for Chord Symbols

```typescript
const CHORD_REGEX = /^([A-G][#b]?)(m|min|minor|maj|major|dim|diminished|aug|augmented|\+|°|ø)?(2|4|5|6|7|9|11|13)?(sus[24]?)?(add[29]|add11|add13)?(\([^)]+\))?(\/[A-G][#b]?)?$/i;

interface ParsedChord {
  root: string;           // C, D#, Bb, etc.
  quality: string;        // m, dim, aug, maj, ""
  extension: string;      // 7, 9, 11, 13
  suspension: string;     // sus2, sus4
  additions: string;      // add9, add11
  alterations: string;    // (b5), (#9)
  bass: string | null;    // /E, /G#
}

function parseChord(chord: string): ParsedChord {
  const match = chord.match(CHORD_REGEX);
  if (!match) throw new Error(`Invalid chord: ${chord}`);

  return {
    root: match[1],
    quality: normalizeQuality(match[2] || ''),
    extension: match[3] || '',
    suspension: match[4] || '',
    additions: match[5] || '',
    alterations: match[6] || '',
    bass: match[7]?.slice(1) || null,
  };
}
```

### Quality Normalization

Different ways to write the same thing:

```typescript
function normalizeQuality(q: string): string {
  const lower = q.toLowerCase();

  // Minor variations
  if (['m', 'min', 'minor', '-'].includes(lower)) return 'm';

  // Major variations (usually implicit)
  if (['maj', 'major', 'M'].includes(lower)) return 'maj';

  // Diminished
  if (['dim', 'diminished', '°', 'o'].includes(lower)) return 'dim';

  // Augmented
  if (['aug', 'augmented', '+'].includes(lower)) return 'aug';

  // Half-diminished
  if (['ø', 'Ø', 'm7b5'].includes(lower)) return 'ø';

  return q;
}
```

## Common Chord Types

| Symbol | Name | Structure |
|--------|------|-----------|
| C | Major | 1 3 5 |
| Cm | Minor | 1 b3 5 |
| C7 | Dominant 7 | 1 3 5 b7 |
| Cmaj7 | Major 7 | 1 3 5 7 |
| Cm7 | Minor 7 | 1 b3 5 b7 |
| Cdim | Diminished | 1 b3 b5 |
| Cdim7 | Diminished 7 | 1 b3 b5 bb7 |
| Cø7 | Half-dim | 1 b3 b5 b7 |
| Caug | Augmented | 1 3 #5 |
| Csus2 | Suspended 2 | 1 2 5 |
| Csus4 | Suspended 4 | 1 4 5 |
| Cadd9 | Add 9 | 1 3 5 9 |
| C6 | Major 6 | 1 3 5 6 |
| C9 | Dominant 9 | 1 3 5 b7 9 |

## Transposition Implementation

### Full Implementation

```typescript
type ChordPart = {
  original: string;
  transposed: string;
  position: number;  // character position in line
};

function transposeChordLine(
  line: string,
  semitones: number,
  targetKey?: string
): { line: string; chords: ChordPart[] } {
  const useFlats = targetKey ? preferFlats(targetKey) : false;
  const chordPositions: ChordPart[] = [];

  // Find all chords in line
  const chordPattern = /\b([A-G][#b]?(?:m|min|maj|dim|aug|sus[24]?|\+|°)?(?:7|9|11|13)?(?:add[29])?(?:\/[A-G][#b]?)?)\b/g;

  let result = line;
  let offset = 0;

  let match;
  while ((match = chordPattern.exec(line)) !== null) {
    const original = match[1];
    const transposed = transpose(original, semitones, useFlats);

    chordPositions.push({
      original,
      transposed,
      position: match.index,
    });

    // Replace in result (accounting for length changes)
    const before = result.slice(0, match.index + offset);
    const after = result.slice(match.index + offset + original.length);
    result = before + transposed + after;
    offset += transposed.length - original.length;
  }

  return { line: result, chords: chordPositions };
}
```

### Key-to-Key Transposition

```typescript
function getTranspositionInterval(fromKey: string, toKey: string): number {
  const fromIndex = getNoteIndex(fromKey);
  const toIndex = getNoteIndex(toKey);
  return (toIndex - fromIndex + 12) % 12;
}

// Example: C to G = 7 semitones up
// Example: G to C = 5 semitones up (or -7, same result mod 12)
```

## Capo Handling

Capo affects the sounding key but not the chord shapes:

```typescript
interface CapoInfo {
  capo: number;
  shapesKey: string;    // What you play (e.g., "G shapes")
  soundingKey: string;  // What it sounds like (e.g., "A")
}

function calculateCapo(shapesKey: string, soundingKey: string): number {
  const shapeIndex = getNoteIndex(shapesKey);
  const soundIndex = getNoteIndex(soundingKey);
  return (soundIndex - shapeIndex + 12) % 12;
}

// If you want to play G shapes but sound in A: capo 2
// If you want to play C shapes but sound in E: capo 4
```

## Common Worship Transpositions

| Original Key | Common Transpositions |
|--------------|----------------------|
| C | → G (+7), → D (+2), → A (-3) |
| G | → C (-7), → D (-5), → A (+2) |
| D | → G (+5), → C (-2), → A (-5) |
| E | → G (+3), → A (-5), → B (-5) |
| A | → G (-2), → D (+5), → E (+7) |

## Edge Cases

1. **Double sharps/flats**: Avoid in output (F## → G)
2. **Theoretical keys**: Cb, C#, Fb rarely used - convert
3. **Slash chords**: Transpose BOTH parts (C/E → D/F#)
4. **Polychords**: Rare, transpose both (C|G → D|A)
5. **Chord-over-chord**: Am/F → Bm/G (both move)

## Testing Transposition

```typescript
// Test cases
assert(transpose('C', 2) === 'D');
assert(transpose('C', 7) === 'G');
assert(transpose('Am', 2) === 'Bm');
assert(transpose('G7', 5) === 'C7');
assert(transpose('F#m', 1) === 'Gm');
assert(transpose('Bb', 2) === 'C');
assert(transpose('C/E', 2) === 'D/F#');
assert(transpose('Ebmaj7', 3) === 'Gbmaj7');  // stays in flats
```
