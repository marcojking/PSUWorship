// Pitch detection using the YIN algorithm
import { getAudioContext, resumeAudioContext } from './piano';

export interface PitchResult {
  frequency: number;      // Detected frequency in Hz (0 if no pitch)
  clarity: number;        // Confidence 0-1
  midi: number;           // MIDI note number (fractional)
  timestamp: number;      // When detected
}

// YIN algorithm parameters
const YIN_THRESHOLD = 0.15;
const MIN_FREQUENCY = 80;   // ~E2
const MAX_FREQUENCY = 1000; // ~B5

// YIN pitch detection
function yin(buffer: Float32Array, sampleRate: number): { frequency: number; clarity: number } {
  const bufferSize = buffer.length;
  const halfBuffer = Math.floor(bufferSize / 2);

  // Step 1 & 2: Squared difference function
  const yinBuffer = new Float32Array(halfBuffer);

  for (let tau = 0; tau < halfBuffer; tau++) {
    let sum = 0;
    for (let i = 0; i < halfBuffer; i++) {
      const diff = buffer[i] - buffer[i + tau];
      sum += diff * diff;
    }
    yinBuffer[tau] = sum;
  }

  // Step 3: Cumulative mean normalized difference
  yinBuffer[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau < halfBuffer; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / runningSum;
  }

  // Step 4: Absolute threshold
  let tau = 2;
  while (tau < halfBuffer) {
    if (yinBuffer[tau] < YIN_THRESHOLD) {
      // Step 5: Parabolic interpolation
      while (tau + 1 < halfBuffer && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }

      // Parabolic interpolation for sub-sample accuracy
      const betterTau = parabolicInterpolation(yinBuffer, tau);
      const frequency = sampleRate / betterTau;
      const clarity = 1 - yinBuffer[tau];

      // Validate frequency range
      if (frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY) {
        return { frequency, clarity };
      }
    }
    tau++;
  }

  return { frequency: 0, clarity: 0 };
}

// Parabolic interpolation for better accuracy
function parabolicInterpolation(array: Float32Array, x: number): number {
  if (x < 1 || x >= array.length - 1) return x;

  const s0 = array[x - 1];
  const s1 = array[x];
  const s2 = array[x + 1];

  const shift = (s0 - s2) / (2 * (s0 - 2 * s1 + s2));

  return x + shift;
}

// Pitch detector class
export class PitchDetector {
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isRunning = false;
  private animationFrame: number | null = null;
  private onPitchCallback: ((result: PitchResult) => void) | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;

  // Start listening for pitch
  async start(onPitch: (result: PitchResult) => void): Promise<void> {
    if (this.isRunning) return;

    await resumeAudioContext();
    const ctx = getAudioContext();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      const source = ctx.createMediaStreamSource(this.mediaStream);

      // Create analyser with good settings for pitch detection
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;

      source.connect(this.analyser);

      this.buffer = new Float32Array(this.analyser.fftSize) as Float32Array<ArrayBuffer>;
      this.onPitchCallback = onPitch;
      this.isRunning = true;

      this.detect();
    } catch (error) {
      console.error('Failed to start pitch detection:', error);
      throw error;
    }
  }

  // Stop listening
  stop(): void {
    this.isRunning = false;

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }

    this.analyser = null;
    this.onPitchCallback = null;
  }

  // Detection loop
  private detect(): void {
    if (!this.isRunning || !this.analyser || !this.buffer || !this.onPitchCallback) {
      return;
    }

    this.analyser.getFloatTimeDomainData(this.buffer);

    const ctx = getAudioContext();
    const { frequency, clarity } = yin(this.buffer, ctx.sampleRate);

    const result: PitchResult = {
      frequency,
      clarity,
      midi: frequency > 0 ? 69 + 12 * Math.log2(frequency / 440) : 0,
      timestamp: performance.now(),
    };

    this.onPitchCallback(result);

    this.animationFrame = requestAnimationFrame(() => this.detect());
  }

  // Check if running
  get running(): boolean {
    return this.isRunning;
  }
}

// Global pitch detector instance
let pitchDetector: PitchDetector | null = null;

export function getPitchDetector(): PitchDetector {
  if (!pitchDetector) {
    pitchDetector = new PitchDetector();
  }
  return pitchDetector;
}
