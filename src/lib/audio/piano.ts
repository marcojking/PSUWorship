// Piano audio playback using smplr
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

// Piano player class
export class PianoPlayer {
  private melodyPiano: SplendidGrandPiano | null = null;
  private harmonyPiano: SplendidGrandPiano | null = null;
  private melodyGain: GainNode;
  private harmonyGain: GainNode;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    const ctx = getAudioContext();
    this.melodyGain = ctx.createGain();
    this.harmonyGain = ctx.createGain();
    this.melodyGain.connect(ctx.destination);
    this.harmonyGain.connect(ctx.destination);
  }

  // Load the piano samples
  async load(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      const ctx = getAudioContext();

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
      this.isLoaded = true;
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

  // Play a single note immediately
  playNote(midi: number, duration: number, isMelody: boolean = true): void {
    const piano = isMelody ? this.melodyPiano : this.harmonyPiano;
    if (!piano) return;

    piano.start({
      note: midi,
      duration: duration,
      velocity: 80,
    });
  }

  // Schedule notes for playback
  scheduleNotes(
    notes: Note[],
    tempo: number,
    startTime: number,
    isMelody: boolean = true,
  ): void {
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
  }

  // Stop all sounds
  stop(): void {
    if (this.melodyPiano) {
      this.melodyPiano.stop();
    }
    if (this.harmonyPiano) {
      this.harmonyPiano.stop();
    }
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
