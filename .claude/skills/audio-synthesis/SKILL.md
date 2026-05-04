---
name: audio-synthesis
description: Expert knowledge of audio synthesis and playback in React Native/Expo. Use when generating tones, playing sounds, implementing synthesizers, scheduling audio events, or working with oscillators, ADSR envelopes, and real-time audio.
---

# Audio Synthesis in React Native

This skill covers generating and playing audio programmatically in React Native, including oscillators, envelopes, note scheduling, and library choices.

---

## 1. Library Options

### react-native-audio-api (Recommended for Synthesis)

The best choice for generating tones programmatically. It brings Web Audio API concepts to React Native.

**Installation**:
```bash
npm install react-native-audio-api
```

**Key Features**:
- Web Audio API-compatible interface
- Oscillators for tone generation
- Gain nodes for volume control
- Biquad filters for frequency shaping
- Low latency (<10ms achievable)
- Runs on UI thread via JSI (no bridge overhead)

### expo-audio (For Playback Only)

Good for playing pre-recorded sounds, not for synthesis.

```bash
npx expo install expo-audio
```

Use this for: sound effects, UI feedback, playing MP3/WAV files.

### Summary

| Library | Use Case |
|---------|----------|
| react-native-audio-api | Generating tones, real-time synthesis |
| expo-audio | Playing pre-recorded audio files |

---

## 2. Basic Oscillator

An oscillator generates a periodic waveform at a specified frequency.

```javascript
import { AudioContext, OscillatorNode, GainNode } from 'react-native-audio-api';

const audioContext = new AudioContext();

function playTone(frequency, duration) {
  const oscillator = new OscillatorNode(audioContext, {
    type: 'sine',      // 'sine', 'square', 'sawtooth', 'triangle'
    frequency: frequency
  });

  const gainNode = new GainNode(audioContext, { gain: 0.5 });

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// Play A4 (440 Hz) for 1 second
playTone(440, 1.0);
```

### Waveform Types

| Type | Sound Character | Use For |
|------|-----------------|---------|
| sine | Pure, smooth, flute-like | Clean tones, testing |
| square | Hollow, clarinet-like | Retro, 8-bit sounds |
| sawtooth | Bright, buzzy, brass-like | Rich leads, strings |
| triangle | Softer than square, mellow | Soft leads, bass |

---

## 3. ADSR Envelope

ADSR controls how a note's volume changes over time.

### The Four Stages

```
Volume
  ^
  |     /\
  |    /  \___________
  |   /               \
  |  /                 \
  +--A---D-----S--------R--> Time
```

- **Attack (A)**: Time to rise from 0 to peak (in seconds)
- **Decay (D)**: Time to fall from peak to sustain level
- **Sustain (S)**: Level held while note is pressed (0-1)
- **Release (R)**: Time to fall from sustain to 0 after note released

### Implementation

```javascript
function playNoteWithEnvelope(frequency, adsr) {
  const { attack, decay, sustain, release } = adsr;
  const now = audioContext.currentTime;

  const oscillator = new OscillatorNode(audioContext, { frequency });
  const envelope = new GainNode(audioContext, { gain: 0 });

  oscillator.connect(envelope);
  envelope.connect(audioContext.destination);

  // Attack: ramp up to full volume
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(1.0, now + attack);

  // Decay: ramp down to sustain level
  envelope.gain.linearRampToValueAtTime(sustain, now + attack + decay);

  // Sustain is held automatically

  // Schedule oscillator
  oscillator.start(now);

  return {
    stop: () => {
      const releaseStart = audioContext.currentTime;
      // Release: ramp down to 0
      envelope.gain.cancelScheduledValues(releaseStart);
      envelope.gain.setValueAtTime(envelope.gain.value, releaseStart);
      envelope.gain.linearRampToValueAtTime(0, releaseStart + release);
      oscillator.stop(releaseStart + release);
    }
  };
}

// Example: piano-like envelope
const pianoADSR = {
  attack: 0.01,   // Fast attack
  decay: 0.3,     // Medium decay
  sustain: 0.4,   // Moderate sustain
  release: 0.5    // Medium release
};

const note = playNoteWithEnvelope(440, pianoADSR);
// Later: note.stop();
```

### Typical ADSR Values by Instrument

| Instrument | Attack | Decay | Sustain | Release |
|------------|--------|-------|---------|---------|
| Piano | 0.01 | 0.3 | 0.3 | 0.5 |
| Organ | 0.05 | 0.1 | 0.9 | 0.1 |
| Strings | 0.3 | 0.2 | 0.7 | 0.5 |
| Pluck | 0.001 | 0.2 | 0.0 | 0.2 |
| Pad | 0.5 | 0.5 | 0.8 | 1.0 |

---

## 4. Frequency and Note Conversion

### MIDI Note to Frequency

```javascript
function midiToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Examples:
// midiToFrequency(69)  -> 440 Hz (A4)
// midiToFrequency(60)  -> 261.63 Hz (C4, middle C)
// midiToFrequency(72)  -> 523.25 Hz (C5)
```

### Frequency to MIDI Note

```javascript
function frequencyToMidi(frequency) {
  return 69 + 12 * Math.log2(frequency / 440);
}
```

### Note Name to MIDI

```javascript
const NOTE_OFFSETS = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11
};

function noteNameToMidi(noteName) {
  // Parse "C4", "F#5", "Bb3", etc.
  const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return null;

  const [, note, octave] = match;
  return NOTE_OFFSETS[note] + (parseInt(octave) + 1) * 12;
}

// noteNameToMidi('A4')  -> 69
// noteNameToMidi('C4')  -> 60
// noteNameToMidi('F#3') -> 54
```

### Common Reference Frequencies

| Note | MIDI | Frequency |
|------|------|-----------|
| C4 (Middle C) | 60 | 261.63 Hz |
| A4 (Concert A) | 69 | 440.00 Hz |
| C5 | 72 | 523.25 Hz |

---

## 5. Scheduling Notes with Timing

JavaScript's setTimeout is not precise enough for music. Use the audio context's clock.

### The Two-Clock System

```javascript
const LOOKAHEAD = 25.0;        // How often to check (ms)
const SCHEDULE_AHEAD = 0.1;    // How far ahead to schedule (seconds)

let nextNoteTime = 0;
let currentNote = 0;
let tempo = 120;  // BPM
let isPlaying = false;

function scheduler() {
  while (nextNoteTime < audioContext.currentTime + SCHEDULE_AHEAD) {
    scheduleNote(currentNote, nextNoteTime);
    advanceNote();
  }

  if (isPlaying) {
    setTimeout(scheduler, LOOKAHEAD);
  }
}

function scheduleNote(noteIndex, time) {
  // Get the note to play from your sequence
  const frequency = getFrequencyForNote(noteIndex);

  const osc = new OscillatorNode(audioContext, { frequency });
  const gain = new GainNode(audioContext, { gain: 0.5 });

  osc.connect(gain);
  gain.connect(audioContext.destination);

  const noteDuration = 60.0 / tempo * 0.5;  // Half a beat

  osc.start(time);
  osc.stop(time + noteDuration);
}

function advanceNote() {
  const secondsPerBeat = 60.0 / tempo;
  nextNoteTime += secondsPerBeat;
  currentNote++;
}

function start() {
  isPlaying = true;
  nextNoteTime = audioContext.currentTime;
  scheduler();
}

function stop() {
  isPlaying = false;
}
```

### Key Timing Concepts

- **audioContext.currentTime**: High-precision clock in seconds
- **Schedule ahead**: Queue notes before they need to play
- **Lookahead**: How often JS checks if more notes need scheduling
- **BPM to seconds**: `secondsPerBeat = 60 / bpm`

### Note Duration Calculations

```javascript
function getNoteDuration(noteType, tempo) {
  const beatDuration = 60 / tempo;  // seconds per beat

  switch (noteType) {
    case 'whole':   return beatDuration * 4;
    case 'half':    return beatDuration * 2;
    case 'quarter': return beatDuration;
    case 'eighth':  return beatDuration / 2;
    case 'sixteenth': return beatDuration / 4;
  }
}
```

---

## 6. Volume Control

### Master Volume

```javascript
const masterGain = new GainNode(audioContext, { gain: 1.0 });
masterGain.connect(audioContext.destination);

// All oscillators connect to masterGain instead of destination
oscillator.connect(masterGain);

// Adjust volume (0 = silent, 1 = full)
function setMasterVolume(level) {
  masterGain.gain.setValueAtTime(level, audioContext.currentTime);
}
```

### Smooth Volume Changes

```javascript
// Fade to new volume over time (avoids clicks)
function fadeVolume(gainNode, targetLevel, duration) {
  gainNode.gain.linearRampToValueAtTime(
    targetLevel,
    audioContext.currentTime + duration
  );
}
```

### Separate Channels

For the harmony app, you want separate volume for melody and harmony:

```javascript
const melodyGain = new GainNode(audioContext, { gain: 1.0 });
const harmonyGain = new GainNode(audioContext, { gain: 0.5 });

melodyGain.connect(audioContext.destination);
harmonyGain.connect(audioContext.destination);

// Connect melody oscillators to melodyGain
// Connect harmony oscillators to harmonyGain
```

---

## 7. Playing Scales and Sequences

### Generate a Scale

```javascript
function getScaleFrequencies(rootMidi, scalePattern) {
  const frequencies = [];
  let currentNote = rootMidi;

  frequencies.push(midiToFrequency(currentNote));

  for (const interval of scalePattern) {
    currentNote += interval;
    frequencies.push(midiToFrequency(currentNote));
  }

  return frequencies;
}

// Scale patterns (intervals in semitones)
const MAJOR_SCALE = [2, 2, 1, 2, 2, 2, 1];
const MINOR_SCALE = [2, 1, 2, 2, 1, 2, 2];

// C major scale starting from C4 (MIDI 60)
const cMajor = getScaleFrequencies(60, MAJOR_SCALE);
// [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]
```

### Play a Sequence

```javascript
async function playSequence(frequencies, noteDuration, gap = 0) {
  for (const freq of frequencies) {
    playTone(freq, noteDuration);
    await sleep((noteDuration + gap) * 1000);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 8. Real-Time Considerations

### Latency Budget

For real-time harmony feedback:
- Target: < 50ms total latency
- Audio buffer: 256-512 samples (~6-12ms at 44.1kHz)
- Processing: < 10ms
- Display: < 16ms (60fps)

### Starting Audio Context

iOS/Android require user interaction before starting audio:

```javascript
async function initAudio() {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

// Call on button press
<Button onPress={initAudio} title="Start" />
```

### Cleanup

```javascript
function cleanup() {
  // Stop all scheduled sounds
  // Close context when done
  audioContext.close();
}
```

---

## 9. Complete Example: Simple Synth

```javascript
import { AudioContext, OscillatorNode, GainNode } from 'react-native-audio-api';

class SimpleSynth {
  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = new GainNode(this.audioContext, { gain: 0.5 });
    this.masterGain.connect(this.audioContext.destination);
    this.activeNotes = new Map();
  }

  noteOn(midiNote, velocity = 1.0) {
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
    const now = this.audioContext.currentTime;

    const osc = new OscillatorNode(this.audioContext, {
      type: 'sine',
      frequency
    });

    const env = new GainNode(this.audioContext, { gain: 0 });

    osc.connect(env);
    env.connect(this.masterGain);

    // Attack
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(velocity, now + 0.01);

    osc.start(now);

    this.activeNotes.set(midiNote, { osc, env });
  }

  noteOff(midiNote) {
    const note = this.activeNotes.get(midiNote);
    if (!note) return;

    const now = this.audioContext.currentTime;
    const { osc, env } = note;

    // Release
    env.gain.cancelScheduledValues(now);
    env.gain.setValueAtTime(env.gain.value, now);
    env.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.stop(now + 0.3);
    this.activeNotes.delete(midiNote);
  }

  setVolume(level) {
    this.masterGain.gain.setValueAtTime(level, this.audioContext.currentTime);
  }
}

// Usage
const synth = new SimpleSynth();
synth.noteOn(60);  // Play C4
// Later...
synth.noteOff(60); // Stop C4
```

---

## Summary

For the harmony training app:

1. Use **react-native-audio-api** for generating melody and harmony tones
2. Create **separate gain nodes** for melody and harmony volume control
3. Use **ADSR envelopes** for natural-sounding notes
4. **Schedule notes** using the audio context clock, not setTimeout
5. Convert between **MIDI numbers and frequencies** for note manipulation
6. Keep **latency low** by using small buffers and efficient scheduling
