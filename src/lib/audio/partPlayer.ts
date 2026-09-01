// Playback engine for fixed SATB arrangements.
//
// Deliberately separate from `piano.ts`, which serves the pitch-detection
// trainer and is hardcoded to a melody/harmony pair. This module only shares
// the audio context helpers, so changes here cannot affect /harmony.
//
// Timing note: every note is scheduled at an absolute AudioContext time.
// JavaScript timers are only used to queue the *next* loop iteration, never
// to trigger a note.

import { SplendidGrandPiano } from 'smplr';
import { getAudioContext, resumeAudioContext } from './piano';
import {
  type Arrangement,
  type ArrangedNote,
  type PartId,
  PART_IDS,
  notesInRange,
  firstNoteFrom,
} from '../music/arrangements/types';

/** Seconds of headroom between calling play() and the first note. */
const SCHEDULE_LEAD = 0.15;
/** Seconds before an iteration ends to queue the next one. */
const LOOP_REARM = 0.25;
/** Ramp applied to volume changes so they don't click. */
const GAIN_RAMP = 0.02;

export interface PlayOptions {
  fromBeat: number;
  /** Exclusive. */
  toBeat: number;
  bpm: number;
  loop: boolean;
  /** Beats of metronome click before the first note. 0 disables. */
  countInBeats: number;
}

export type PartVolumes = Record<PartId, number>;

export function beatsToSeconds(beats: number, bpm: number): number {
  return (beats * 60) / bpm;
}

export class PartPlayer {
  private ctx: AudioContext;
  private gains: Record<PartId, GainNode>;
  private pianos: Partial<Record<PartId, SplendidGrandPiano>> = {};

  /** Fader position per part, independent of mute state. */
  private levels: PartVolumes = { soprano: 1, alto: 1, tenor: 1, bass: 1 };
  /**
   * Octave displacement per part, in octaves. Exists because the melody is
   * sung in two octaves at once here: a woman on the written soprano line and
   * a man an octave below it. Whoever is practising alone needs to hear their
   * own octave, not the other one.
   */
  private octaves: Record<PartId, number> = {
    soprano: 0,
    alto: 0,
    tenor: 0,
    bass: 0,
  };
  /**
   * Which arranged line each bus plays. Defaults to itself, so an untouched
   * player is plain SATB. Reassigning lets a bus sing a line it is not named
   * after — the melody is doubled in two octaves in our voicing, so the tenor
   * bus carries the soprano line rather than the written tenor part. The
   * arrangement data stays a faithful transcription; the substitution is a
   * property of who is singing, not of the music.
   */
  private sources: Record<PartId, PartId> = {
    soprano: 'soprano',
    alto: 'alto',
    tenor: 'tenor',
    bass: 'bass',
  };
  private muted: Record<PartId, boolean> = {
    soprano: false,
    alto: false,
    tenor: false,
    bass: false,
  };

  private loaded = false;
  private loadPromise: Promise<void> | null = null;

  private playing = false;
  private opts: PlayOptions | null = null;
  /** AudioContext time corresponding to `opts.fromBeat` of the current pass. */
  private passStart = 0;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private arrangement: Arrangement) {
    this.ctx = getAudioContext();
    this.gains = {
      soprano: this.ctx.createGain(),
      alto: this.ctx.createGain(),
      tenor: this.ctx.createGain(),
      bass: this.ctx.createGain(),
    };
    for (const id of PART_IDS) {
      this.gains[id].gain.value = 1;
      this.gains[id].connect(this.ctx.destination);
    }
  }

  /**
   * Loads piano samples. One instrument per part, because smplr routes an
   * instrument to a single destination and we need four independent buses.
   * The browser HTTP cache means only the first instance pays full download.
   */
  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      for (const id of PART_IDS) {
        this.pianos[id] = new SplendidGrandPiano(this.ctx, {
          volume: 100,
          destination: this.gains[id],
        });
      }
      await Promise.all(PART_IDS.map((id) => this.pianos[id]!.load));
      this.loaded = true;
    })();

    return this.loadPromise;
  }

  get isLoaded(): boolean {
    return this.loaded;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  async play(opts: PlayOptions): Promise<void> {
    await resumeAudioContext();
    await this.load();

    this.stop();
    this.opts = opts;
    this.playing = true;

    const countInSecs = beatsToSeconds(opts.countInBeats, opts.bpm);
    const firstNoteAt = this.ctx.currentTime + SCHEDULE_LEAD + countInSecs;

    if (opts.countInBeats > 0) {
      this.scheduleCountIn(
        this.ctx.currentTime + SCHEDULE_LEAD,
        opts.countInBeats,
        opts.bpm,
      );
    }

    this.schedulePass(firstNoteAt);
  }

  /** Schedules one pass of [fromBeat, toBeat) starting at `startTime`. */
  private schedulePass(startTime: number): void {
    const opts = this.opts;
    if (!opts) return;

    this.passStart = startTime;

    for (const id of PART_IDS) {
      const notes = notesInRange(
        this.arrangement.parts[this.sources[id]],
        opts.fromBeat,
        opts.toBeat,
      );
      for (const n of notes) {
        this.scheduleNote(id, n, startTime, opts);
      }
    }

    const passSeconds = beatsToSeconds(opts.toBeat - opts.fromBeat, opts.bpm);

    if (opts.loop) {
      const rearmIn = Math.max(0, passSeconds - LOOP_REARM);
      this.loopTimer = setTimeout(
        () => {
          if (!this.playing) return;
          this.schedulePass(startTime + passSeconds);
        },
        rearmIn * 1000,
      );
    } else {
      this.loopTimer = setTimeout(
        () => {
          this.playing = false;
        },
        (passSeconds + 0.2) * 1000,
      );
    }
  }

  private scheduleNote(
    id: PartId,
    note: ArrangedNote,
    startTime: number,
    opts: PlayOptions,
  ): void {
    const piano = this.pianos[id];
    if (!piano) return;

    const offset = beatsToSeconds(note.startBeat - opts.fromBeat, opts.bpm);
    // Slight detach so repeated pitches re-articulate instead of blurring.
    const duration = beatsToSeconds(note.beats, opts.bpm) * 0.95;

    piano.start({
      note: note.midi + 12 * this.octaves[id],
      time: startTime + offset,
      duration,
      velocity: 80,
    });
  }

  /** Short blips on the beat before the music starts. */
  private scheduleCountIn(at: number, beats: number, bpm: number): void {
    const spb = beatsToSeconds(1, bpm);
    for (let i = 0; i < beats; i++) {
      const t = at + i * spb;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      // Accent the downbeat so the singer can feel where "one" is.
      osc.frequency.value = i === 0 ? 1600 : 1100;
      env.gain.value = 0;
      osc.connect(env);
      env.connect(this.ctx.destination);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.18, t + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      osc.start(t);
      osc.stop(t + 0.12);
    }
  }

  /** Sounds a part's first note in the given range, so a singer can find it. */
  async playStartingPitch(id: PartId, fromBeat: number): Promise<void> {
    await resumeAudioContext();
    await this.load();
    const note = firstNoteFrom(this.arrangement.parts[this.sources[id]], fromBeat);
    if (!note) return;
    this.pianos[id]?.start({
      note: note.midi + 12 * this.octaves[id],
      time: this.ctx.currentTime + 0.05,
      duration: 1.5,
      velocity: 85,
    });
  }

  /**
   * Displaces a part by whole octaves. Like a tempo change, this affects notes
   * scheduled from here on, so mid-playback it lands on the next loop pass
   * rather than cutting the current one short.
   */
  setPartOctave(id: PartId, octaves: number): void {
    this.octaves[id] = octaves;
  }

  getPartOctave(id: PartId): number {
    return this.octaves[id];
  }

  /** Points a bus at a different arranged line. Takes effect on newly scheduled notes. */
  setPartSource(id: PartId, source: PartId): void {
    this.sources[id] = source;
  }

  stop(): void {
    this.playing = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    for (const id of PART_IDS) {
      this.pianos[id]?.stop();
    }
  }

  setPartVolume(id: PartId, level: number): void {
    this.levels[id] = Math.max(0, Math.min(1, level));
    this.applyGain(id);
  }

  setPartMuted(id: PartId, isMuted: boolean): void {
    this.muted[id] = isMuted;
    this.applyGain(id);
  }

  getPartVolume(id: PartId): number {
    return this.levels[id];
  }

  isPartMuted(id: PartId): boolean {
    return this.muted[id];
  }

  private applyGain(id: PartId): void {
    const target = this.muted[id] ? 0 : this.levels[id];
    const g = this.gains[id].gain;
    const now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(target, now + GAIN_RAMP);
  }

  /**
   * Current position in beats, derived from the audio clock so the playhead
   * cannot drift away from what is actually sounding. Returns null when
   * stopped or still counting in.
   */
  getCurrentBeat(): number | null {
    if (!this.playing || !this.opts) return null;
    const elapsed = this.ctx.currentTime - this.passStart;
    if (elapsed < 0) return null;
    const span = this.opts.toBeat - this.opts.fromBeat;
    const beats = (elapsed * this.opts.bpm) / 60;
    if (!this.opts.loop && beats > span) return null;
    return this.opts.fromBeat + (beats % span);
  }

  dispose(): void {
    this.stop();
    for (const id of PART_IDS) {
      try {
        this.gains[id].disconnect();
      } catch {
        // already disconnected
      }
    }
  }
}
