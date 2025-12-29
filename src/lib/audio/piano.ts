// Piano audio playback using smplr with fallback synth
import { SplendidGrandPiano } from 'smplr';
import { Note, beatsToSeconds } from '../music/melodyGenerator';

// Singleton audio context
let audioContext: AudioContext | null = null;

// Get or create audio context
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Resume audio context (required after user interaction)
export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

// Convert MIDI note to frequency
function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Simple oscillator-based synth for instant playback before piano loads
class SimpleSynth {
  private ctx: AudioContext;
  private melodyGain: GainNode;
  private harmonyGain: GainNode;
  private activeOscillators: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();

  constructor(melodyGain: GainNode, harmonyGain: GainNode) {
    this.ctx = getAudioContext();
    this.melodyGain = melodyGain;
    this.harmonyGain = harmonyGain;
  }

  playNote(midi: number, duration: number, isMelody: boolean = true): void {
    const freq = midiToFrequency(midi);
    const destination = isMelody ? this.melodyGain : this.harmonyGain;

    // Create oscillator with softer waveform
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    // Create envelope for smoother sound
    const envelope = this.ctx.createGain();
    envelope.gain.value = 0;

    osc.connect(envelope);
    envelope.connect(destination);

    const now = this.ctx.currentTime;
    const attackTime = 0.02;
    const releaseTime = 0.1;

    // Attack
    envelope.gain.linearRampToValueAtTime(0.3, now + attackTime);
    // Sustain
    envelope.gain.setValueAtTime(0.3, now + duration - releaseTime);
    // Release
    envelope.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  scheduleNotes(
    notes: Note[],
    tempo: number,
    startTime: number,
    isMelody: boolean = true,
  ): void {
    const destination = isMelody ? this.melodyGain : this.harmonyGain;

    for (const note of notes) {
      const noteStartTime = startTime + beatsToSeconds(note.startBeat, tempo);
      const noteDuration = beatsToSeconds(note.duration, tempo);

      if (noteStartTime >= this.ctx.currentTime) {
        const freq = midiToFrequency(note.midi);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const envelope = this.ctx.createGain();
        envelope.gain.value = 0;

        osc.connect(envelope);
        envelope.connect(destination);

        const attackTime = 0.02;
        const releaseTime = 0.1;
        const actualDuration = noteDuration * 0.9;

        // Schedule envelope
        envelope.gain.setValueAtTime(0, noteStartTime);
        envelope.gain.linearRampToValueAtTime(isMelody ? 0.3 : 0.2, noteStartTime + attackTime);
        envelope.gain.setValueAtTime(isMelody ? 0.3 : 0.2, noteStartTime + actualDuration - releaseTime);
        envelope.gain.linearRampToValueAtTime(0, noteStartTime + actualDuration);

        osc.start(noteStartTime);
        osc.stop(noteStartTime + actualDuration + 0.1);

        // Track for cleanup
        const id = `${note.midi}-${noteStartTime}`;
        this.activeOscillators.set(id, { osc, gain: envelope });

        // Auto-cleanup
        osc.onended = () => {
          this.activeOscillators.delete(id);
        };
      }
    }
  }

  stop(): void {
    const now = this.ctx.currentTime;
    for (const [id, { osc, gain }] of this.activeOscillators) {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.stop(now + 0.1);
      } catch (e) {
        // Ignore already stopped oscillators
      }
    }
    this.activeOscillators.clear();
  }
}

// Progress callback type
export type LoadProgressCallback = (progress: number) => void;

// Piano player class
export class PianoPlayer {
  private melodyPiano: SplendidGrandPiano | null = null;
  private harmonyPiano: SplendidGrandPiano | null = null;
  private melodyGain: GainNode;
  private harmonyGain: GainNode;
  private simpleSynth: SimpleSynth;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private progressCallback: LoadProgressCallback | null = null;

  constructor() {
    const ctx = getAudioContext();
    this.melodyGain = ctx.createGain();
    this.harmonyGain = ctx.createGain();
    this.melodyGain.connect(ctx.destination);
    this.harmonyGain.connect(ctx.destination);

    // Create simple synth for immediate playback
    this.simpleSynth = new SimpleSynth(this.melodyGain, this.harmonyGain);
  }

  // Set progress callback
  onProgress(callback: LoadProgressCallback): void {
    this.progressCallback = callback;
  }

  // Load the piano samples (can be called in background)
  async load(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      const ctx = getAudioContext();

      // Simulate progress since smplr doesn't provide it
      // Typical load takes 2-5 seconds, use exponential curve
      let progress = 0;
      const progressInterval = setInterval(() => {
        // Asymptotically approach 0.9 (leave room for completion)
        progress += (0.9 - progress) * 0.1;
        if (this.progressCallback) {
          this.progressCallback(progress);
        }
      }, 100);

      // Create separate piano instances for melody and harmony
      // Each routes through its own gain node for independent volume control
      this.melodyPiano = new SplendidGrandPiano(ctx, {
        volume: 100,
        destination: this.melodyGain,
      });
      this.harmonyPiano = new SplendidGrandPiano(ctx, {
        volume: 100,
        destination: this.harmonyGain,
      });

      await Promise.all([this.melodyPiano.load, this.harmonyPiano.load]);

      clearInterval(progressInterval);
      this.isLoaded = true;

      if (this.progressCallback) {
        this.progressCallback(1);
      }
    })();

    return this.loadPromise;
  }

  // Check if loaded
  get loaded(): boolean {
    return this.isLoaded;
  }

  // Set melody volume (0-1)
  setMelodyVolume(volume: number): void {
    this.melodyGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  // Set harmony volume (0-1)
  setHarmonyVolume(volume: number): void {
    this.harmonyGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  // Play a single note immediately (uses simple synth if piano not loaded)
  playNote(midi: number, duration: number, isMelody: boolean = true): void {
    if (this.isLoaded) {
      const piano = isMelody ? this.melodyPiano : this.harmonyPiano;
      if (piano) {
        piano.start({
          note: midi,
          duration: duration,
          velocity: 80,
        });
      }
    } else {
      // Use simple synth as fallback
      this.simpleSynth.playNote(midi, duration, isMelody);
    }
  }

  // Schedule notes for playback (uses simple synth if piano not loaded)
  scheduleNotes(
    notes: Note[],
    tempo: number,
    startTime: number,
    isMelody: boolean = true,
  ): void {
    if (this.isLoaded) {
      const piano = isMelody ? this.melodyPiano : this.harmonyPiano;
      if (!piano) return;

      const ctx = getAudioContext();

      for (const note of notes) {
        const noteStartTime = startTime + beatsToSeconds(note.startBeat, tempo);
        const noteDuration = beatsToSeconds(note.duration, tempo);

        // Only schedule future notes
        if (noteStartTime >= ctx.currentTime) {
          piano.start({
            note: note.midi,
            time: noteStartTime,
            duration: noteDuration * 0.9, // Slightly shorter for articulation
            velocity: isMelody ? 80 : 60,
          });
        }
      }
    } else {
      // Use simple synth as fallback
      this.simpleSynth.scheduleNotes(notes, tempo, startTime, isMelody);
    }
  }

  // Stop all sounds
  stop(): void {
    if (this.melodyPiano) {
      this.melodyPiano.stop();
    }
    if (this.harmonyPiano) {
      this.harmonyPiano.stop();
    }
    this.simpleSynth.stop();
  }
}

// Global piano instance
let pianoPlayer: PianoPlayer | null = null;

export function getPianoPlayer(): PianoPlayer {
  if (!pianoPlayer) {
    pianoPlayer = new PianoPlayer();
  }
  return pianoPlayer;
}
