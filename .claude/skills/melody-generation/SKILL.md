---
name: melody-generation
description: Expert knowledge of algorithmic melody generation. Use when creating procedural melodies, implementing random walk algorithms, building singable phrase generators, or working with musical structure like contour, rhythm, and phrasing.
---

# Melody Generation

This skill covers generating singable, musical melodies algorithmically for the harmony training app.

---

## 1. Core Principles

### What Makes a Melody Singable

1. **Stepwise motion** (mostly): Move by 2nds (whole/half steps), occasional 3rds
2. **Limited range**: Stay within an octave or so
3. **Diatonic**: Use notes from the key (no accidentals for beginners)
4. **Repetition**: Repeat patterns to create coherence
5. **Phrase structure**: Clear beginning, middle, end
6. **Arch contour**: Rise to a peak, then descend

### Range Constraints

For a harmony training app, keep melodies in a comfortable singing range:

| Voice Type | Suggested Range (MIDI) | Notes |
|------------|------------------------|-------|
| Low | 48-65 | C3 to F4 |
| Medium | 55-72 | G3 to C5 |
| High | 60-77 | C4 to F5 |

---

## 2. Scale and Note Selection

### Building a Scale

```javascript
const SCALE_PATTERNS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10]
};

function buildScale(rootMidi, scaleType, octaves = 2) {
  const pattern = SCALE_PATTERNS[scaleType];
  const notes = [];

  for (let octave = 0; octave < octaves; octave++) {
    for (const interval of pattern) {
      notes.push(rootMidi + octave * 12 + interval);
    }
  }

  return notes;
}

// C major scale from C4: [60, 62, 64, 65, 67, 69, 71, 72, 74, ...]
const cMajor = buildScale(60, 'major', 2);
```

### Constraining to Scale

```javascript
function constrainToScale(midiNote, scale) {
  // Find closest note in scale
  let closest = scale[0];
  let minDistance = Math.abs(midiNote - closest);

  for (const note of scale) {
    const distance = Math.abs(midiNote - note);
    if (distance < minDistance) {
      minDistance = distance;
      closest = note;
    }
  }

  return closest;
}
```

---

## 3. Random Walk Generator

The simplest approach: wander through the scale with small steps.

### Basic Random Walk

```javascript
function generateRandomWalk(startNote, scale, length, stepBias = 0.7) {
  const melody = [startNote];
  let currentIndex = scale.indexOf(startNote);

  for (let i = 1; i < length; i++) {
    // Decide step size
    const rand = Math.random();
    let step;

    if (rand < stepBias) {
      // Small step (conjunct motion)
      step = Math.random() < 0.5 ? -1 : 1;
    } else if (rand < stepBias + 0.2) {
      // Medium step (skip)
      step = Math.random() < 0.5 ? -2 : 2;
    } else {
      // Same note (repetition)
      step = 0;
    }

    // Apply step with bounds checking
    currentIndex = Math.max(0, Math.min(scale.length - 1, currentIndex + step));
    melody.push(scale[currentIndex]);
  }

  return melody;
}
```

### Improved Random Walk with Range Constraint

```javascript
function generateConstrainedMelody(options) {
  const {
    scale,
    length,
    minNote,
    maxNote,
    startNote = null
  } = options;

  // Filter scale to range
  const rangeScale = scale.filter(n => n >= minNote && n <= maxNote);

  // Start in middle of range
  const middleIndex = Math.floor(rangeScale.length / 2);
  let currentIndex = startNote
    ? rangeScale.indexOf(startNote)
    : middleIndex;

  const melody = [rangeScale[currentIndex]];

  for (let i = 1; i < length; i++) {
    // Bias toward center when near edges
    const distFromCenter = currentIndex - middleIndex;
    const centerBias = distFromCenter * 0.1;  // Pull toward center

    // Random step with center bias
    let step = Math.random() < 0.5 ? -1 : 1;
    if (Math.random() < Math.abs(centerBias)) {
      step = centerBias > 0 ? -1 : 1;  // Move toward center
    }

    // Occasional same note or skip
    if (Math.random() < 0.15) step = 0;
    if (Math.random() < 0.1) step *= 2;

    currentIndex = Math.max(0, Math.min(rangeScale.length - 1, currentIndex + step));
    melody.push(rangeScale[currentIndex]);
  }

  return melody;
}
```

---

## 4. Phrase Structure

### The Period: Antecedent + Consequent

A classic 8-bar structure:
- **Bars 1-4 (Antecedent)**: Ask a musical "question"
- **Bars 5-8 (Consequent)**: Answer it

```javascript
function generatePeriod(scale, beatsPerMeasure = 4) {
  // Generate antecedent (4 bars)
  const antecedent = generatePhrase(scale, beatsPerMeasure * 4, 'open');

  // Consequent starts similarly but ends conclusively
  const consequent = generatePhrase(scale, beatsPerMeasure * 4, 'closed', antecedent);

  return [...antecedent, ...consequent];
}

function generatePhrase(scale, length, ending, model = null) {
  let melody;

  if (model) {
    // Start similar to model, diverge at end
    melody = [...model.slice(0, Math.floor(length * 0.6))];
    const remaining = length - melody.length;
    melody.push(...generateRandomWalk(melody[melody.length - 1], scale, remaining));
  } else {
    melody = generateRandomWalk(scale[Math.floor(scale.length / 2)], scale, length);
  }

  // Adjust ending
  if (ending === 'closed') {
    // End on tonic (first note of scale)
    melody[melody.length - 1] = scale[0];
  } else {
    // End on dominant or other non-tonic
    melody[melody.length - 1] = scale[4];  // 5th scale degree
  }

  return melody;
}
```

---

## 5. Melodic Contour

### The Arch Shape

Most melodies rise to a peak and descend. This feels natural and complete.

```javascript
function applyArchContour(melody, peakPosition = 0.6) {
  const peakIndex = Math.floor(melody.length * peakPosition);
  const scale = getScaleFromMelody(melody);

  // Find current min/max
  const minNote = Math.min(...melody);
  const maxNote = Math.max(...melody);
  const range = maxNote - minNote;

  // Reshape to arch
  return melody.map((note, i) => {
    // Calculate target height (0 at ends, 1 at peak)
    let targetHeight;
    if (i <= peakIndex) {
      targetHeight = i / peakIndex;
    } else {
      targetHeight = (melody.length - 1 - i) / (melody.length - 1 - peakIndex);
    }

    // Blend original note with arch shape
    const archNote = minNote + range * targetHeight;
    const blended = note * 0.7 + archNote * 0.3;

    return constrainToScale(Math.round(blended), scale);
  });
}
```

### Other Contours

```javascript
const CONTOURS = {
  arch: (i, len) => Math.sin(Math.PI * i / len),
  descending: (i, len) => 1 - i / len,
  ascending: (i, len) => i / len,
  wave: (i, len) => 0.5 + 0.5 * Math.sin(2 * Math.PI * i / len),
  static: () => 0.5
};

function applyContour(melody, contourType, strength = 0.3) {
  const contourFn = CONTOURS[contourType];
  const scale = getScaleFromMelody(melody);
  const minNote = Math.min(...melody);
  const maxNote = Math.max(...melody);
  const range = maxNote - minNote || 12;

  return melody.map((note, i) => {
    const contourValue = contourFn(i, melody.length);
    const targetNote = minNote + range * contourValue;
    const blended = note * (1 - strength) + targetNote * strength;
    return constrainToScale(Math.round(blended), scale);
  });
}
```

---

## 6. Rhythm Generation

### Note Durations

```javascript
const DURATIONS = {
  whole: 4,      // 4 beats
  half: 2,       // 2 beats
  quarter: 1,    // 1 beat
  eighth: 0.5,   // half beat
  sixteenth: 0.25
};

function generateRhythm(totalBeats, options = {}) {
  const {
    minDuration = 0.5,
    maxDuration = 2,
    preferredDuration = 1
  } = options;

  const rhythm = [];
  let remainingBeats = totalBeats;

  while (remainingBeats > 0) {
    // Weight toward preferred duration
    let duration;
    const rand = Math.random();

    if (rand < 0.5) {
      duration = preferredDuration;
    } else if (rand < 0.75) {
      duration = minDuration;
    } else {
      duration = maxDuration;
    }

    // Don't exceed remaining beats
    duration = Math.min(duration, remainingBeats);
    rhythm.push(duration);
    remainingBeats -= duration;
  }

  return rhythm;
}
```

### Combining Pitch and Rhythm

```javascript
function generateMelodyWithRhythm(scale, measures, beatsPerMeasure) {
  const totalBeats = measures * beatsPerMeasure;

  // Generate rhythm first
  const rhythm = generateRhythm(totalBeats);

  // Generate pitches to match rhythm length
  const pitches = generateConstrainedMelody({
    scale,
    length: rhythm.length,
    minNote: scale[0],
    maxNote: scale[scale.length - 1]
  });

  // Combine into notes
  return pitches.map((pitch, i) => ({
    pitch,
    duration: rhythm[i],
    type: durationToType(rhythm[i])
  }));
}

function durationToType(beats) {
  if (beats >= 4) return 'whole';
  if (beats >= 2) return 'half';
  if (beats >= 1) return 'quarter';
  if (beats >= 0.5) return 'eighth';
  return 'sixteenth';
}
```

---

## 7. Repetition and Pattern

### Repeating Motifs

Repetition is crucial for musicality. Repeat a short pattern with variation.

```javascript
function generateWithMotif(scale, measures, beatsPerMeasure) {
  const motifLength = beatsPerMeasure;  // 1 measure motif
  const motif = generateMelodyWithRhythm(scale, 1, beatsPerMeasure);

  const melody = [];

  for (let m = 0; m < measures; m++) {
    if (m % 2 === 0) {
      // Original motif
      melody.push(...motif);
    } else {
      // Varied motif
      melody.push(...varyMotif(motif, scale));
    }
  }

  return melody;
}

function varyMotif(motif, scale) {
  const variation = Math.random();

  if (variation < 0.33) {
    // Transpose up a step
    return motif.map(note => ({
      ...note,
      pitch: constrainToScale(note.pitch + 2, scale)
    }));
  } else if (variation < 0.66) {
    // Transpose down a step
    return motif.map(note => ({
      ...note,
      pitch: constrainToScale(note.pitch - 2, scale)
    }));
  } else {
    // Change last note
    const varied = [...motif];
    const lastIndex = varied.length - 1;
    varied[lastIndex] = {
      ...varied[lastIndex],
      pitch: constrainToScale(varied[lastIndex].pitch + (Math.random() < 0.5 ? 2 : -2), scale)
    };
    return varied;
  }
}
```

### Call and Response

```javascript
function generateCallResponse(scale, measures, beatsPerMeasure) {
  const halfMeasures = measures / 2;

  // Generate call
  const call = generateMelodyWithRhythm(scale, halfMeasures, beatsPerMeasure);

  // Response echoes call but with different ending
  const response = call.map((note, i) => {
    if (i >= call.length - 2) {
      // Vary the ending
      return {
        ...note,
        pitch: i === call.length - 1 ? scale[0] : note.pitch  // End on tonic
      };
    }
    return note;
  });

  return [...call, ...response];
}
```

---

## 8. Complete Melody Generator

### Full Implementation

```javascript
class MelodyGenerator {
  constructor(options = {}) {
    this.rootNote = options.rootNote || 60;  // C4
    this.scaleType = options.scaleType || 'major';
    this.tempo = options.tempo || 100;
    this.beatsPerMeasure = options.beatsPerMeasure || 4;

    this.scale = buildScale(this.rootNote, this.scaleType, 2);
    this.rangeMin = this.rootNote;
    this.rangeMax = this.rootNote + 12;  // One octave
  }

  generate(measures) {
    // Generate base melody
    let melody = this.generateBase(measures);

    // Apply arch contour
    melody = this.applyContour(melody);

    // Ensure good ending
    melody = this.fixEnding(melody);

    // Add timing information
    return this.addTiming(melody);
  }

  generateBase(measures) {
    const totalNotes = measures * this.beatsPerMeasure;
    const rangeScale = this.scale.filter(
      n => n >= this.rangeMin && n <= this.rangeMax
    );

    const startIndex = Math.floor(rangeScale.length / 2);
    let currentIndex = startIndex;
    const melody = [];

    for (let i = 0; i < totalNotes; i++) {
      melody.push({ pitch: rangeScale[currentIndex] });

      // Decide next step
      const step = this.getNextStep(currentIndex, startIndex, rangeScale.length);
      currentIndex = Math.max(0, Math.min(rangeScale.length - 1, currentIndex + step));
    }

    return melody;
  }

  getNextStep(current, center, length) {
    // 70% stepwise, 15% repeat, 15% skip
    const rand = Math.random();

    if (rand < 0.15) return 0;  // Repeat

    let step = Math.random() < 0.5 ? -1 : 1;

    // Skip occasionally
    if (rand > 0.85) step *= 2;

    // Bias toward center when near edges
    const distFromCenter = current - center;
    if (Math.abs(distFromCenter) > length / 3) {
      if (Math.random() < 0.6) {
        step = distFromCenter > 0 ? -1 : 1;
      }
    }

    return step;
  }

  applyContour(melody) {
    const peakPos = 0.6;  // Peak at 60%
    const strength = 0.25;

    return melody.map((note, i) => {
      const t = i / (melody.length - 1);
      let contour;

      if (t < peakPos) {
        contour = t / peakPos;
      } else {
        contour = (1 - t) / (1 - peakPos);
      }

      const range = this.rangeMax - this.rangeMin;
      const target = this.rangeMin + range * contour;
      const blended = note.pitch * (1 - strength) + target * strength;

      return {
        ...note,
        pitch: constrainToScale(Math.round(blended), this.scale)
      };
    });
  }

  fixEnding(melody) {
    // Second to last note: leading tone or step away
    // Last note: tonic
    const tonic = this.scale[0];

    melody[melody.length - 1].pitch = tonic;

    // Approach tonic by step
    const secondLast = melody[melody.length - 2];
    if (Math.abs(secondLast.pitch - tonic) > 2) {
      secondLast.pitch = tonic + (Math.random() < 0.5 ? 2 : -1);
      secondLast.pitch = constrainToScale(secondLast.pitch, this.scale);
    }

    return melody;
  }

  addTiming(melody) {
    let beat = 0;
    return melody.map((note, i) => {
      const duration = this.getDuration(i, melody.length);
      const result = {
        ...note,
        startBeat: beat,
        duration,
        type: durationToType(duration)
      };
      beat += duration;
      return result;
    });
  }

  getDuration(index, total) {
    // Mostly quarter notes, some variety
    const rand = Math.random();

    if (index === total - 1) return 2;  // Longer final note

    if (rand < 0.7) return 1;      // Quarter
    if (rand < 0.85) return 0.5;   // Eighth
    return 2;                       // Half
  }

  setKey(rootNote) {
    this.rootNote = rootNote;
    this.scale = buildScale(rootNote, this.scaleType, 2);
    this.rangeMin = rootNote;
    this.rangeMax = rootNote + 12;
  }

  setTempo(tempo) {
    this.tempo = tempo;
  }
}
```

---

## 9. Generating Harmony Line

Once you have a melody, generate the harmony line:

```javascript
function generateHarmonyLine(melody, scale, intervalType) {
  const intervals = {
    'third-above': 2,   // 2 scale degrees up
    'third-below': -2,  // 2 scale degrees down
    'sixth-above': 5,   // 5 scale degrees up
    'fifth-above': 4,   // 4 scale degrees up
  };

  const interval = intervals[intervalType];

  return melody.map(note => {
    const noteIndex = scale.indexOf(note.pitch);
    if (noteIndex === -1) {
      // Note not in scale, find closest
      const closest = constrainToScale(note.pitch, scale);
      const closestIndex = scale.indexOf(closest);
      return {
        ...note,
        pitch: scale[closestIndex + interval] || scale[closestIndex]
      };
    }

    const harmonyIndex = noteIndex + interval;

    // Handle out of range
    if (harmonyIndex < 0 || harmonyIndex >= scale.length) {
      // Wrap to different octave
      const wrapped = ((harmonyIndex % 7) + 7) % 7;
      const octaveAdjust = Math.floor(harmonyIndex / 7) * 12;
      return {
        ...note,
        pitch: scale[wrapped] + octaveAdjust
      };
    }

    return {
      ...note,
      pitch: scale[harmonyIndex]
    };
  });
}
```

---

## 10. Usage Example

```javascript
// Create generator
const generator = new MelodyGenerator({
  rootNote: 60,      // C4
  scaleType: 'major',
  tempo: 100,
  beatsPerMeasure: 4
});

// Generate 4 measures
const melody = generator.generate(4);

// Generate harmony a third above
const scale = buildScale(60, 'major', 2);
const harmony = generateHarmonyLine(melody, scale, 'third-above');

// Result:
// melody = [
//   { pitch: 64, startBeat: 0, duration: 1, type: 'quarter' },
//   { pitch: 65, startBeat: 1, duration: 1, type: 'quarter' },
//   ...
// ]
// harmony = [
//   { pitch: 67, startBeat: 0, duration: 1, type: 'quarter' },
//   { pitch: 69, startBeat: 1, duration: 1, type: 'quarter' },
//   ...
// ]
```

---

## Summary

For the harmony training app:

1. **Use constrained random walk** for simple, singable melodies
2. **Keep range to one octave** in comfortable singing range
3. **Apply arch contour** for natural phrasing
4. **End on tonic** for resolution
5. **Generate diatonic 3rds** for harmony line (not fixed semitones)
6. **Include note durations** for visual display and timing
7. **Support regeneration** with same settings for practice variety
