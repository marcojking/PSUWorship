---
name: pitch-detection
description: Expert knowledge of pitch detection algorithms and audio signal processing. Use when implementing pitch tracking, building tuners, analyzing singing voice frequency, handling real-time audio, or solving pitch detection problems like octave errors, noise, and overtones.
---

# Pitch Detection: Theory and Practice

This skill provides comprehensive knowledge for detecting the fundamental frequency (pitch) from audio signals, particularly singing voice. It covers algorithms, implementation details, challenges, and solutions.

---

## 1. Fundamentals of Pitch Detection

### What is Pitch?

**Pitch** is the perceptual quality of sound that allows us to order sounds on a frequency-related scale from low to high. It's not the same as frequency:
- **Frequency (f0)**: The physical property measured in Hz
- **Pitch**: The human perception of frequency

For periodic signals (like sung notes), pitch corresponds closely to the **fundamental frequency (f0)** of the signal.

### The Core Challenge

Audio signals contain multiple frequency components:
- **Fundamental (f0)**: The lowest frequency, determines perceived pitch
- **Harmonics**: Integer multiples of f0 (2f0, 3f0, 4f0, ...)
- **Formants**: Resonant frequencies of the vocal tract (define vowel sounds)
- **Noise**: Random frequency components

The pitch detector must identify f0 even when:
- Harmonics are louder than the fundamental
- The fundamental is weak or missing entirely
- Noise corrupts the signal
- Multiple pitches are present (polyphonic)

### Human Voice Frequency Ranges

| Voice Type | Typical f0 Range |
|------------|------------------|
| Bass | 80 - 350 Hz |
| Baritone | 100 - 400 Hz |
| Tenor | 130 - 500 Hz |
| Alto | 175 - 700 Hz |
| Soprano | 250 - 1000 Hz |
| Child | 250 - 500 Hz |

**Full speech range**: 50 - 800 Hz (nearly 4 octaves)

---

## 2. Time-Domain Methods

Time-domain methods analyze the raw audio waveform to find periodicity.

### 2.1 Autocorrelation

**Concept**: Correlate the signal with a delayed copy of itself. Periodic signals produce peaks at delays equal to the period.

**Mathematical Definition**:
```
r(τ) = Σ x(t) × x(t + τ)
```
Where τ is the lag (delay) in samples.

**How It Works**:
1. Take a window of audio samples
2. Compute autocorrelation for various lags
3. Find the lag τ that produces the highest peak (after lag 0)
4. Period = τ samples → f0 = sample_rate / τ

**Strengths**:
- Intuitive and well-understood
- Works well for clean, periodic signals
- More accurate than FFT for single pitches

**Weaknesses**:
- O(N²) complexity (slow)
- Can produce octave errors (half/double pitch)
- Needs at least 2 periods to detect (latency)

**Minimum Detection Time**:
```
For 40 Hz (lowest bass): 1/40 × 2 = 50 ms minimum
For 80 Hz: 25 ms minimum
For 200 Hz: 10 ms minimum
```

### 2.2 AMDF (Average Magnitude Difference Function)

**Concept**: Instead of multiplying (autocorrelation), compute the average difference between the signal and delayed copies.

**Formula**:
```
AMDF(τ) = (1/N) × Σ |x(t) - x(t + τ)|
```

**How It Works**:
1. For periodic signals, AMDF shows **dips** (minima) at the period
2. The first significant dip after lag 0 indicates the period
3. No multiplications needed—only subtractions and absolute values

**Strengths**:
- Computationally cheap (no multiplies)
- Good for embedded/real-time systems
- Works well with 16-bit integer arithmetic

**Weaknesses**:
- "Falling tendency"—values decrease at higher lags
- Double/half pitch errors in noisy conditions
- Less accurate than autocorrelation

### 2.3 Zero Crossing Rate (ZCR)

**Concept**: Count how often the signal crosses zero per unit time.

**Formula**:
```
ZCR = (1/N) × Σ |sign(x(t)) - sign(x(t-1))| / 2
```

**Primary Use**: Voiced/Unvoiced Detection (not pitch estimation)

| Signal Type | Typical ZCR (20ms frame) |
|-------------|-------------------------|
| Voiced speech | < 0.1 |
| Silence | 0.1 - 0.3 |
| Unvoiced speech | > 0.3 |

**For Pitch Estimation**:
- Very rough estimate: f0 ≈ ZCR × sample_rate / 2
- Not reliable on its own
- Best combined with other methods

---

## 3. Frequency-Domain Methods

Frequency-domain methods transform the signal using FFT and analyze the spectrum.

### 3.1 FFT Peak Picking

**Concept**: Find peaks in the magnitude spectrum; the fundamental is the lowest significant peak.

**Process**:
1. Apply window (Hamming, Hann) to reduce spectral leakage
2. Compute FFT
3. Find magnitude peaks
4. Select the lowest peak above a threshold

**Problems**:
- Harmonics may be stronger than fundamental
- Spectral leakage can create false peaks
- Resolution limited by window size

**Frequency Resolution**:
```
Δf = sample_rate / N

Example: 44100 Hz sample rate, 2048 samples
Δf = 44100 / 2048 ≈ 21.5 Hz per bin
```

This is too coarse for accurate pitch detection—interpolation is needed.

### 3.2 Harmonic Product Spectrum (HPS)

**Concept**: Exploit the fact that harmonics are at integer multiples of f0.

**Algorithm**:
1. Compute magnitude spectrum |X(f)|
2. Downsample spectrum by 2, 3, 4, ... (compress harmonics)
3. Multiply all downsampled spectra together
4. Peak location = fundamental frequency

```
HPS(f) = |X(f)| × |X(2f)| × |X(3f)| × |X(4f)| × ...
```

**Why It Works**:
- 2nd harmonic (2f0) compressed by 2 lands on f0
- 3rd harmonic (3f0) compressed by 3 lands on f0
- All harmonics align at f0, creating a strong peak

**Strengths**:
- Simple to implement
- Handles missing fundamental
- Real-time capable

**Weaknesses**:
- Octave errors common (may detect 2f0)
- Missing harmonics cause failures (product becomes 0)
- Requires good frequency resolution

### 3.3 Cepstral Analysis

**Concept**: Take the spectrum of the spectrum to separate pitch from timbre.

**Algorithm**:
1. Compute FFT → magnitude spectrum
2. Take log of magnitude
3. Compute IFFT (inverse FFT)
4. Find peak in the "quefrency" domain

**Why It Works**:
Speech = Excitation (pitch) × Vocal Tract (formants)
Log(speech) = Log(excitation) + Log(vocal_tract)
IFFT separates additive components → pitch is clearly visible

**Quefrency to Frequency**:
```
f0 = sample_rate / quefrency_samples

Example: peak at quefrency = 100 samples, SR = 44100
f0 = 44100 / 100 = 441 Hz
```

**Strengths**:
- Cleanly separates pitch from formants
- Good for speech analysis
- Robust to some noise

**Weaknesses**:
- Cannot detect pure sine waves (no harmonics)
- Computationally more expensive
- Initial estimate—often refined with other methods

---

## 4. The YIN Algorithm (Gold Standard)

YIN is the most widely used algorithm for monophonic pitch detection, developed by de Cheveigné & Kawahara (2002).

### 4.1 The Six Steps of YIN

**Step 1: Difference Function**
```
d(τ) = Σ (x(t) - x(t + τ))²
```
Like autocorrelation, but measures difference instead of similarity.

**Step 2: Cumulative Mean Normalized Difference (CMND)**
```
d'(τ) = d(τ) / [(1/τ) × Σ d(j)] for j = 1 to τ
d'(0) = 1
```
Normalizes to prevent the "falling tendency" of AMDF.

**Step 3: Absolute Threshold**
- Search for first dip in d'(τ) that falls below threshold (typically 0.1 - 0.2)
- This prevents selecting a harmonic-related peak

**Step 4: Parabolic Interpolation**
- Fit parabola to the selected dip and its neighbors
- Find true minimum (sub-sample accuracy)
- Greatly improves precision

**Step 5: Best Local Estimate**
- Search around initial estimate for better minimum
- Reduces rapid fluctuations

**Step 6: (Optional) Pitch Tracking**
- Use temporal continuity to smooth results
- Reject implausible jumps

### 4.2 YIN Parameters

| Parameter | Typical Value | Purpose |
|-----------|---------------|---------|
| Window size | 2048 samples | Analysis window |
| Threshold | 0.1 - 0.2 | CMND threshold |
| Min f0 | 50 Hz | Lowest detectable |
| Max f0 | 1000 Hz | Highest detectable |

### 4.3 YIN Performance

- **Gross Error Rate**: ~0.5% (state-of-the-art for classical methods)
- **Latency**: Requires ~2 periods minimum
- **Complexity**: O(N log N) using FFT for autocorrelation

---

## 5. pYIN (Probabilistic YIN)

An improvement over YIN that uses probabilistic modeling.

### 5.1 Key Innovation

Instead of outputting one pitch per frame, pYIN:
1. Outputs **multiple pitch candidates** with probabilities
2. Uses a **Hidden Markov Model (HMM)** to find the most likely pitch sequence
3. Provides **voicing detection** (is there a pitch at all?)

### 5.2 How It Works

**Stage 1: Multiple Candidates**
- Replace fixed threshold with a **threshold distribution**
- For each possible threshold, get a different pitch candidate
- Assign probabilities based on the threshold distribution

**Stage 2: HMM Decoding**
- States = possible pitches
- Observations = pitch candidates from Stage 1
- Transitions = smooth pitch movement (penalize big jumps)
- Viterbi decode to find optimal pitch track

### 5.3 Benefits

| Improvement | Reduction |
|-------------|-----------|
| Gross pitch errors | 30-50% fewer |
| Octave errors | 0.5-2% rate |
| Voicing errors | 5-8% miss rate |

---

## 6. Neural Network Approaches

### 6.1 CREPE (Convolutional Representation for Pitch Estimation)

**Architecture**: Deep CNN operating directly on waveform

**Network Structure**:
- Input: 1024 samples of audio (64ms at 16kHz)
- 6 convolutional layers (filters: 3, stride: 1)
- Channels: 64 × [1, 2, 4, 8, 8, 8]
- Output: 360 pitch classes (C1 to B7, 20 cents resolution)
- Size: ~22M parameters, 89 MB

**Output**:
- Probability distribution over 360 pitch bins
- 20 cents spacing (1/5 of a semitone)
- Take argmax for pitch estimate

**Performance**:
- State-of-the-art accuracy (2018)
- Outperforms pYIN, SWIPE
- Handles noise, room acoustics better

**Limitations**:
- Large model size
- Higher latency
- Computationally expensive

### 6.2 SPICE (Self-supervised Pitch Estimation)

**Key Innovation**: Trained without labeled pitch data (self-supervised)

**Architecture**:
- Encoder: 6 conv layers with max pooling
- Decoder: Mirror of encoder
- Trained to reconstruct pitch-shifted versions of input

**Benefits**:
- Mobile-compatible (TensorFlow Lite)
- Works with TensorFlow.js (web)
- 16 kHz mono input
- 10ms time steps (default)

**Output**:
- Pitch value (continuous)
- Confidence score (1 - uncertainty)

**Usage**:
```python
import tensorflow_hub as hub
model = hub.load("https://tfhub.dev/google/spice/2")
output = model.signatures["serving_default"](audio)
pitch = output["pitch"]
confidence = 1.0 - output["uncertainty"]
```

### 6.3 Comparison

| Algorithm | Accuracy | Latency | Size | Real-time |
|-----------|----------|---------|------|-----------|
| YIN | Good | Low | Tiny | Yes |
| pYIN | Better | Medium | Tiny | Yes |
| CREPE | Best | High | 89 MB | Difficult |
| SPICE | Good | Medium | ~10 MB | Yes |

---

## 7. Handling Common Problems

### 7.1 Octave Errors

**Cause**: Algorithm detects a harmonic (2f0, 3f0) or subharmonic (f0/2) instead of f0.

**Prevention Strategies**:

1. **Low-pass filter** before analysis
   - Cut harmonics that might be louder than fundamental
   - Typical: 1000 Hz cutoff for voice

2. **Cumulative mean normalization** (YIN Step 2)
   - Prevents selecting later peaks

3. **Pitch tracking**
   - Reject implausible jumps (> 1 octave between frames)
   - Use HMM for temporal smoothing (pYIN)

4. **Multiple candidate evaluation**
   - Don't just take the first/strongest peak
   - Consider pitch continuity

5. **Hybrid spectral/temporal**
   - Cross-validate frequency and time domain estimates
   - YAAPT algorithm does this

### 7.2 The Missing Fundamental

**Problem**: The fundamental frequency is weak or absent, but we still hear the pitch.

**Why It Happens**:
- Telephone filtering (cuts < 300 Hz)
- Small speakers (can't reproduce low frequencies)
- Some instruments (bells, chimes)

**Solutions**:

1. **Harmonic Product Spectrum**
   - Finds f0 by aligning harmonics

2. **Subharmonic Summation**
   - Add energy at f0, f0/2, f0/3... from each spectral peak
   - Peak indicates fundamental

3. **Difference of Harmonics**
   - Measure spacing between harmonics
   - Spacing = fundamental frequency

4. **Neural networks**
   - Learn to infer fundamental from harmonic pattern

### 7.3 Noise

**Types**:
- Background noise (HVAC, traffic)
- Room acoustics (reverb)
- Microphone noise
- Other voices/instruments

**Solutions**:

1. **Pre-filtering**
   - Band-pass filter for expected pitch range
   - Noise reduction algorithms

2. **Confidence thresholds**
   - Reject estimates with low confidence
   - YIN: use CMND threshold
   - SPICE: use uncertainty output

3. **Noise-robust algorithms**
   - Extended AMDF (EAMDF)
   - RAPT (Robust Algorithm for Pitch Tracking)
   - Neural networks (trained on noisy data)

4. **Median filtering**
   - Post-process pitch track
   - Remove outliers

### 7.4 Vibrato

**Characteristics**:
- Rate: 5-8 Hz typically
- Extent: ±50-100 cents (half to full semitone)

**Challenges**:
- Pitch varies continuously
- May confuse simple peak-pickers

**Solutions**:

1. **Increase analysis window**
   - Average over vibrato cycle

2. **Track the center pitch**
   - Low-pass filter the pitch track
   - Separate vibrato rate/extent from center pitch

3. **Expectation of variation**
   - Don't reject small pitch movements as errors

### 7.5 Jitter and Shimmer

**Definitions**:
- **Jitter**: Cycle-to-cycle variation in pitch period
- **Shimmer**: Cycle-to-cycle variation in amplitude

**Impact**:
- Make pitch detection noisier
- Normal in human voice (< 1% jitter is healthy)
- Elevated levels indicate pathology

**Solutions**:
- Longer analysis windows (average out variation)
- Pitch tracking with smoothing
- Don't over-correct (natural variation is expected)

---

## 8. Real-Time Considerations

### 8.1 Latency Components

Total latency = Input buffer + Processing + Output buffer

**Input Buffer**:
```
Latency (ms) = Buffer_size / Sample_rate × 1000

Examples at 44.1 kHz:
256 samples → 5.8 ms
512 samples → 11.6 ms
1024 samples → 23.2 ms
2048 samples → 46.4 ms
```

**Processing Latency**:
- YIN: ~1-5 ms on modern CPU
- CREPE: 50-200 ms (depends on hardware)
- SPICE: 10-30 ms

### 8.2 Minimum Theoretical Latency

You need at least **one period** to detect pitch, but for reliability, **two periods** is common.

```
At f0 = 100 Hz (low male voice):
  Period = 10 ms
  Minimum = 10-20 ms

At f0 = 400 Hz (female voice):
  Period = 2.5 ms
  Minimum = 2.5-5 ms
```

**Practical minimum for voice**: 20-30 ms

### 8.3 Buffer Size Selection

| Buffer Size | Latency (44.1kHz) | Use Case |
|-------------|-------------------|----------|
| 64 samples | 1.5 ms | Monitoring (no processing) |
| 128 samples | 2.9 ms | Ultra-low latency |
| 256 samples | 5.8 ms | Real-time effects |
| 512 samples | 11.6 ms | Standard pitch detection |
| 1024 samples | 23.2 ms | Better accuracy |
| 2048 samples | 46.4 ms | Best accuracy |

### 8.4 Overlap for Continuous Tracking

Standard approach: 50% overlap with hop size = window/2

```
Window: 2048 samples (46 ms)
Hop: 1024 samples (23 ms)
→ New pitch estimate every 23 ms
```

For faster updates:
```
Window: 1024 samples (23 ms)
Hop: 256 samples (5.8 ms)
→ New estimate every 5.8 ms
```

### 8.5 Platform-Specific Notes

**iOS (Core Audio)**:
- Hardware buffer: 5.8 ms at 256 samples
- Can achieve < 10 ms round-trip

**Android**:
- Higher latency historically
- AAudio (Android 8+): Can achieve < 20 ms
- Oboe library recommended

**Web Audio**:
- Worklet-based: ~3-5 ms latency possible
- ScriptProcessor (deprecated): 20-50 ms typical

**Windows**:
- WASAPI exclusive mode: < 10 ms
- WASAPI shared mode: 20-40 ms

---

## 9. Implementation Checklist

### 9.1 Audio Input Setup

```
[ ] Sample rate: 16000 Hz or 44100 Hz
[ ] Bit depth: 16-bit or 32-bit float
[ ] Channels: Mono (convert stereo if needed)
[ ] Buffer size: 512-2048 samples
[ ] Overlapping frames with 50% hop
```

### 9.2 Preprocessing

```
[ ] Remove DC offset (high-pass filter ~20 Hz)
[ ] Apply band-pass filter (50 Hz - 1000 Hz for voice)
[ ] Apply window function (Hamming or Hann)
[ ] Normalize amplitude (optional)
```

### 9.3 Algorithm Selection

| Scenario | Recommended Algorithm |
|----------|----------------------|
| Mobile app, CPU-limited | YIN, AMDF |
| Best accuracy needed | CREPE, pYIN |
| Web-based | SPICE (TF.js), YIN |
| Embedded system | AMDF, simplified YIN |
| Speech only | YIN with voicing detection |
| Music + noise | CREPE, SPICE |

### 9.4 Post-Processing

```
[ ] Confidence threshold (reject low-confidence)
[ ] Median filter (remove outliers)
[ ] Pitch tracking (temporal smoothing)
[ ] Convert to musical units (MIDI, note name)
```

### 9.5 Conversion Formulas

**Hz to MIDI note number**:
```
MIDI = 69 + 12 × log2(f / 440)

Example: 440 Hz → 69 (A4)
         261.63 Hz → 60 (C4)
```

**MIDI to Hz**:
```
f = 440 × 2^((MIDI - 69) / 12)
```

**Hz to cents from A440**:
```
cents = 1200 × log2(f / 440)
```

**Cents deviation from nearest semitone**:
```
cents_deviation = 100 × (MIDI - round(MIDI))
```

---

## 10. Algorithm Comparison Summary

| Algorithm | Accuracy | Speed | Complexity | Octave Errors | Best For |
|-----------|----------|-------|------------|---------------|----------|
| Autocorrelation | Medium | Medium | O(N²) | Common | Simple cases |
| FFT Autocorr | Medium | Fast | O(N log N) | Common | Real-time |
| AMDF | Low-Medium | Very Fast | O(N²) | Common | Embedded |
| HPS | Medium | Fast | O(N log N) | Common | Missing fundamental |
| Cepstrum | Medium | Medium | O(N log N) | Rare | Speech analysis |
| **YIN** | **High** | **Fast** | **O(N log N)** | **Rare** | **General purpose** |
| pYIN | Very High | Medium | O(N log N) | Very Rare | When accuracy matters |
| CREPE | Highest | Slow | O(?) | Very Rare | Noise, studio work |
| SPICE | High | Medium | O(?) | Rare | Mobile, web |

---

## 11. Quick Reference: Common Issues & Solutions

| Problem | Symptoms | Solution |
|---------|----------|----------|
| Octave up | Detected pitch is 2x correct | Low-pass filter, check threshold |
| Octave down | Detected pitch is 0.5x correct | Increase min f0 parameter |
| Jumping pitch | Rapid incorrect changes | Add pitch tracking/smoothing |
| No detection | Always returns 0 or null | Check audio levels, voicing detection |
| Wrong during vibrato | Pitch track follows wobble | Increase window size |
| Noise causes errors | Random pitch during silence | Add voicing detection, confidence threshold |
| High latency | Pitch lags behind singing | Reduce buffer size, use faster algorithm |
| CPU too high | App lags or heats up | Use AMDF or reduce sample rate |

---

## 12. Recommended Libraries & Tools

### JavaScript / Web
- **Pitchfinder**: Multiple algorithms (YIN, AMDF, etc.)
- **ml5.js**: CREPE model wrapper
- **Meyda**: Audio feature extraction including pitch

### Python
- **librosa**: pYIN implementation
- **crepe**: Official CREPE model
- **parselmouth**: Praat wrapper

### iOS (Swift)
- **AudioKit**: Pitch tracking built-in
- **TarsosDSP**: Java library, can bridge

### Android (Kotlin/Java)
- **TarsosDSP**: YIN, FFT methods
- **TensorFlow Lite**: SPICE model

### C/C++
- **Aubio**: YIN, FFT methods
- **WORLD**: High-quality pitch/voice analysis
- **Essentia**: Comprehensive audio analysis

---

## 13. Testing Your Pitch Detector

### 13.1 Test Signals

1. **Pure sine waves**: Easy baseline (use synthesizer)
2. **Sawtooth/square waves**: Has harmonics
3. **Recorded speech**: Real-world voiced test
4. **Sung notes**: Target use case
5. **Chromatic scale**: Test full range
6. **Vibrato**: Test pitch tracking
7. **Silence + noise**: Test voicing detection

### 13.2 Metrics

**Gross Pitch Error (GPE)**: % of frames > 1 semitone off
**Fine Pitch Error (FPE)**: Average cents deviation (for correct frames)
**Voicing Detection Recall**: % of voiced frames correctly detected
**Voicing Detection Precision**: % of detected frames that are voiced

### 13.3 Ground Truth

- **MIDI-controlled synth**: Known exact pitches
- **Reference recordings**: MIR-1K, MedleyDB datasets
- **Manual annotation**: Praat, Sonic Visualiser

---

## Summary

For a **singing app** targeting real-time performance:

1. **Start with YIN** — it's fast, accurate, and well-documented
2. **Add voicing detection** — use energy + ZCR + CMND threshold
3. **Implement pitch tracking** — smooth with median filter or HMM
4. **Use 1024-2048 sample windows** at 44.1 kHz with 50% overlap
5. **Post-process** — convert to MIDI/note names, filter outliers
6. **Consider SPICE** if you need better noise robustness on mobile

For **best accuracy** regardless of speed: Use CREPE or pYIN

For **lowest latency**: Use optimized YIN with small buffers + pitch tracking

The key insight: **No single algorithm is perfect**. Real-world systems often combine:
- Fast initial estimate (AMDF, ZCR)
- Accurate refinement (YIN, autocorrelation)
- Temporal smoothing (median filter, HMM)
- Confidence scoring (reject uncertain estimates)
