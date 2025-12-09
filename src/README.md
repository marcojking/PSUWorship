# VocalHarmony - Source Module Architecture

A modular mobile app for teaching harmony singing with real-time pitch detection.

## Module Overview

```
src/
├── generator/      # Melody generation
├── harmony/        # Harmony computation
├── synth/          # Audio playback
├── pitch/          # Pitch detection
├── scoring/        # Accuracy scoring
├── db/             # SQLite persistence
└── ui/             # React Native components
```

## Module Responsibilities

### `generator/` - Melody Generation
- **IGenerator.ts** - Interface for melody generators
- Produces deterministic MIDI-like note sequences from a seed
- Same seed + params = identical melody (reproducible)

### `harmony/` - Harmony Engine
- **IHarmonyEngine.ts** - Interface for harmony computation
- Computes harmony notes based on:
  - **Fixed mode**: Exact interval (e.g., always +4 semitones)
  - **Diatonic mode**: Interval adjusted to stay in key

### `synth/` - Audio Synthesis
- **ISynthAdapter.ts** - Interface for audio playback
- Cross-platform audio (Expo Audio / expo-av)
- Handles loop mode with sample-accurate timing
- Supports harmony muting for Ghost Mode

### `pitch/` - Pitch Detection
- **IPitchDetector.ts** - Interface for pitch detection
- Real-time microphone analysis (~50Hz updates)
- Implementations: CREPE (TFLite) or YIN fallback
- Smoothing and median filtering

### `scoring/` - Accuracy Scoring
- **IScoringEngine.ts** - Interface for scoring
- Calculates % time on target per note
- Configurable tolerance (default ±50 cents)
- Produces per-note and overall run statistics

### `db/` - Persistence
- **schema.ts** - SQLite schema definitions
- Tables: sessions, runs, interval_stats, user_settings
- SCHEMA_VERSION for migrations

### `ui/` - User Interface
- React Native components
- Visualizer: horizontal target band + pitch dot
- Practice screen, settings, history

## Key Features

| Feature | Description |
|---------|-------------|
| **Loop Mode** | Repeat phrase indefinitely |
| **Infinite Mode** | Generate endless new phrases |
| **Ghost Harmony** | Harmony audible only when on-target |
| **Haptic Feedback** | Vibration when hitting target |
| **Offline-First** | Works without network |

## Testing

```bash
# Run all tests
npm test

# Run specific module tests
npm test -- --grep "LocalGenerator"
npm test -- --grep "HarmonyEngine"
```

## Future Modules (Post-MVP)

- `sync/` - Cloud sync with Supabase
- `recommendations/` - AI-powered practice suggestions
- `lyria/` - Lyria RealTime audio synthesis
