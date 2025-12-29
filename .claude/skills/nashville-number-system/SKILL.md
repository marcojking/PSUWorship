# Nashville Number System

Expert knowledge of the Nashville Number System for chord chart conversion and worship music applications.

## Overview

The Nashville Number System (NNS) replaces chord letter names with numbers representing scale degrees. This allows musicians to transpose instantly and communicate chord progressions regardless of key.

## Core Concepts

### Scale Degree Mapping

In any major key, the numbers map to scale degrees:

| Number | Scale Degree | Chord Quality | Example in C | Example in G |
|--------|--------------|---------------|--------------|--------------|
| 1 | Tonic | Major | C | G |
| 2 | Supertonic | Minor | Dm | Am |
| 3 | Mediant | Minor | Em | Bm |
| 4 | Subdominant | Major | F | C |
| 5 | Dominant | Major | G | D |
| 6 | Submediant | Minor | Am | Em |
| 7 | Leading Tone | Diminished | Bdim | F#dim |

### Chord Quality Notation

```
Major:      1, 4, 5 (no suffix needed)
Minor:      2-, 3-, 6- (dash suffix) OR 2m, 3m, 6m
Seventh:    1⁷, 5⁷ (superscript 7)
Major 7:    1^, 1maj7, 1Δ
Minor 7:    2-⁷, 6-⁷
Diminished: 7° or 7dim
Augmented:  1+ or 1aug
Sus4:       1sus, 1sus4
Sus2:       1sus2
Add9:       1add9, 1(9)
```

### Slash Chords / Inversions

Bass note after slash, also numbered:
```
1/3  = C/E in key of C (1 chord with 3 in bass)
4/5  = F/G in key of C
5/7  = G/B in key of C
```

### Accidentals (Non-Diatonic Chords)

Use ♭ or ♯ before the number:
```
♭7   = Bb major in key of C (borrowed from parallel minor)
♯4   = F# in key of C
♭3   = Eb major in key of C
♭6   = Ab major in key of C
```

### Common Borrowed Chords in Worship

```
♭7 - Very common (mixolydian)
♭6 - Common in worship (emotional, building)
♭3 - Less common
4- - Minor 4 chord (borrowed from parallel minor)
```

## Conversion Algorithm

### Letter Chord to Nashville Number

```typescript
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Major scale intervals (in semitones from root)
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

function chordToNashville(chord: string, key: string): string {
  // Parse chord root and quality
  const { root, quality, bass } = parseChord(chord);
  const keyIndex = getNoteIndex(key);
  const chordIndex = getNoteIndex(root);

  // Calculate interval from key
  const interval = (chordIndex - keyIndex + 12) % 12;

  // Find scale degree (1-7) or accidental
  const scaleDegree = MAJOR_SCALE.indexOf(interval);

  if (scaleDegree !== -1) {
    // Diatonic chord
    return (scaleDegree + 1) + quality;
  } else {
    // Non-diatonic - find nearest and add accidental
    // ... handle flats/sharps
  }
}
```

### Nashville Number to Letter Chord

```typescript
function nashvilleToChord(number: string, key: string): string {
  const { degree, accidental, quality, bass } = parseNashville(number);
  const keyIndex = getNoteIndex(key);

  // Get semitones for scale degree
  const semitones = MAJOR_SCALE[degree - 1];

  // Apply accidental
  const adjustedSemitones = semitones + (accidental === '♭' ? -1 : accidental === '♯' ? 1 : 0);

  // Calculate root note
  const rootIndex = (keyIndex + adjustedSemitones) % 12;
  const root = getNoteName(rootIndex, key);

  return root + quality + (bass ? '/' + convertBass(bass, key) : '');
}
```

## Key Detection Algorithm

To detect the key from a chord progression:

1. **Find the most common chords** - The 1, 4, 5 are most frequent
2. **Look for the V-I cadence** - Strong indicator of key
3. **Check for the vi chord** - Often the relative minor
4. **First and last chords** - Often the tonic

```typescript
function detectKey(chords: string[]): string {
  // Count chord occurrences
  const counts = new Map<string, number>();
  chords.forEach(c => counts.set(c, (counts.get(c) || 0) + 1));

  // Try each possible key and score
  let bestKey = 'C';
  let bestScore = 0;

  for (const key of NOTES) {
    let score = 0;
    // Check if common chords fit this key
    const I = key;
    const IV = transpose(key, 5);
    const V = transpose(key, 7);
    const vi = transpose(key, 9) + 'm';

    score += (counts.get(I) || 0) * 3;  // Weight tonic heavily
    score += (counts.get(IV) || 0) * 2;
    score += (counts.get(V) || 0) * 2;
    score += (counts.get(vi) || 0) * 1;

    // Bonus if song starts/ends on this chord
    if (chords[0] === I) score += 2;
    if (chords[chords.length - 1] === I) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  return bestKey;
}
```

## Minor Key Handling

For songs in minor keys, two approaches:

### Approach 1: Relative Major Reference
Write as if in relative major, 6- becomes the "home" chord:
- Am = 6- in C major context
- Common in Nashville

### Approach 2: Minor as 1
Treat minor as the tonic:
- Am = 1- (explicitly minor)
- C = ♭3
- G = ♭7
- Less common but clearer for minor-key songs

## Rhythmic Notation

```
Underline = 2 beats (in 4/4)
No marking = 4 beats (full measure)
Diamond ◇ = held/fermata
^ = push/anticipation
```

## Worship Music Patterns

Common Nashville progressions in worship:

```
1 - 5 - 6- - 4         (I V vi IV) - Most common!
1 - 4 - 1 - 5          (I IV I V)
6- - 4 - 1 - 5         (vi IV I V)
1 - 1/3 - 4 - 5        (I I/III IV V)
4 - 5 - 1              (IV V I) - Tag ending
1 - 5/7 - 6-           (I V/VII vi)
```

## Edge Cases

1. **Enharmonic keys**: Use consistent notation (prefer flats in flat keys, sharps in sharp keys)
2. **Modulations**: Indicate new key with "Key: X" marker
3. **Polychords**: Rare in worship, write as slash chord
4. **Altered dominants**: 5⁷♭9, 5⁷♯9 - keep alterations

## Implementation Notes

- Store both Nashville number AND original chord for reversibility
- Allow user to set key explicitly (don't always auto-detect)
- Support "capo" adjustments (display key vs actual key)
- Common worship keys: G, C, D, E, A, B (guitar-friendly)
