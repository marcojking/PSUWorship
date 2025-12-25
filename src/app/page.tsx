'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import StaffVisualizer from '@/components/StaffVisualizer';
import ControlBar from '@/components/ControlBar';
import SettingsMenu from '@/components/SettingsMenu';
import Logo from '@/components/Logo';
import { generateMelody, generateHarmony, Note, getTotalBeats, beatsToSeconds, MelodyType } from '@/lib/music/melodyGenerator';
import { ScaleType, VocalRange, VOCAL_RANGES, getRecommendedKey } from '@/lib/music/theory';
import { getPianoPlayer, resumeAudioContext, getAudioContext } from '@/lib/audio/piano';
import { getPitchDetector, PitchResult } from '@/lib/audio/pitchDetector';

// Default settings
const DEFAULT_VOCAL_RANGE: VocalRange = 'tenor';  // Common starting point
const DEFAULT_SCALE: ScaleType = 'major';
const DEFAULT_TEMPO = 100;
const DEFAULT_MEASURES = 4;
const DEFAULT_COMPLEXITY = 0;  // Start with easiest
const DEFAULT_MELODY_TYPE: MelodyType = 'scale';  // Start with scale
const DEFAULT_HARMONY_INTERVAL = 3;  // Third above
const DEFAULT_MELODY_VOLUME = 0.8;
const DEFAULT_HARMONY_VOLUME = 0.5;

// Pitch history for trail
interface PitchPoint {
  midi: number;
  timestamp: number;
}

export default function Home() {
  // Settings state
  const [vocalRange, setVocalRange] = useState<VocalRange>(DEFAULT_VOCAL_RANGE);
  const [selectedKey, setSelectedKey] = useState(() => getRecommendedKey(DEFAULT_VOCAL_RANGE));
  const [scaleType, setScaleType] = useState<ScaleType>(DEFAULT_SCALE);
  const [tempo, setTempo] = useState(DEFAULT_TEMPO);
  const [measures, setMeasures] = useState(DEFAULT_MEASURES);
  const [complexity, setComplexity] = useState(DEFAULT_COMPLEXITY);
  const [melodyType, setMelodyType] = useState<MelodyType>(DEFAULT_MELODY_TYPE);
  const [harmonyInterval, setHarmonyInterval] = useState(DEFAULT_HARMONY_INTERVAL);

  // Get the current vocal range limits
  const rangeMin = VOCAL_RANGES[vocalRange].min;
  const rangeMax = VOCAL_RANGES[vocalRange].max;

  // Volume state
  const [melodyVolume, setMelodyVolume] = useState(DEFAULT_MELODY_VOLUME);
  const [harmonyVolume, setHarmonyVolume] = useState(DEFAULT_HARMONY_VOLUME);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBeat, setCurrentBeat] = useState(0);

  // Menu state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Melody and harmony
  const [melody, setMelody] = useState<Note[]>([]);
  const [harmony, setHarmony] = useState<Note[]>([]);

  // User pitch
  const [userPitch, setUserPitch] = useState<number | null>(null);
  const [pitchHistory, setPitchHistory] = useState<PitchPoint[]>([]);

  // Refs for playback
  const playbackStartRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  // Generate new melody
  const generateNewMelody = useCallback(() => {
    const newMelody = generateMelody({
      rootMidi: selectedKey,
      scaleType,
      measures,
      beatsPerMeasure: 4,
      rangeMin,
      rangeMax,
      complexity,
      melodyType,
    });

    const newHarmony = generateHarmony(newMelody, selectedKey, scaleType, harmonyInterval);

    setMelody(newMelody);
    setHarmony(newHarmony);
    setCurrentBeat(0);
  }, [selectedKey, scaleType, measures, rangeMin, rangeMax, complexity, melodyType, harmonyInterval]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Load piano samples
        const piano = getPianoPlayer();
        await piano.load();

        // Generate initial melody
        generateNewMelody();
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
      setIsLoading(false);
    };

    init();
  }, []);

  // Update volumes when they change
  useEffect(() => {
    const piano = getPianoPlayer();
    piano.setMelodyVolume(melodyVolume);
  }, [melodyVolume]);

  useEffect(() => {
    const piano = getPianoPlayer();
    piano.setHarmonyVolume(harmonyVolume);
  }, [harmonyVolume]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const totalBeats = getTotalBeats(melody);
    if (totalBeats === 0) return;

    const animate = () => {
      const ctx = getAudioContext();
      const elapsed = ctx.currentTime - playbackStartRef.current;
      const beat = (elapsed * tempo) / 60;

      // Loop
      if (beat >= totalBeats) {
        playbackStartRef.current = ctx.currentTime;
        schedulePlayback();
        setCurrentBeat(0);
      } else {
        setCurrentBeat(beat);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, melody, tempo]);

  // Schedule notes for playback
  const schedulePlayback = useCallback(() => {
    const piano = getPianoPlayer();
    const ctx = getAudioContext();

    piano.stop();
    piano.scheduleNotes(melody, tempo, ctx.currentTime, true);
    piano.scheduleNotes(harmony, tempo, ctx.currentTime, false);
  }, [melody, harmony, tempo]);

  // Play/Pause handler
  const handlePlayPause = async () => {
    if (isLoading) return;

    await resumeAudioContext();

    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      const piano = getPianoPlayer();
      piano.stop();

      // Stop pitch detection
      const detector = getPitchDetector();
      detector.stop();
    } else {
      // Play
      const ctx = getAudioContext();
      playbackStartRef.current = ctx.currentTime;

      // Schedule notes
      schedulePlayback();

      setIsPlaying(true);

      // Start pitch detection
      const detector = getPitchDetector();
      try {
        await detector.start((result: PitchResult) => {
          if (result.clarity > 0.8 && result.frequency > 0) {
            setUserPitch(result.midi);
            setPitchHistory(prev => {
              const now = performance.now();
              // Keep only recent history (last 2 seconds)
              const filtered = prev.filter(p => now - p.timestamp < 2000);
              return [...filtered, { midi: result.midi, timestamp: now }];
            });
          } else {
            setUserPitch(null);
          }
        });
      } catch (error) {
        console.error('Microphone access denied:', error);
      }
    }
  };

  // Handle new melody
  const handleNewMelody = () => {
    const wasPlaying = isPlaying;

    if (wasPlaying) {
      setIsPlaying(false);
      const piano = getPianoPlayer();
      piano.stop();
    }

    generateNewMelody();

    if (wasPlaying) {
      setTimeout(() => {
        handlePlayPause();
      }, 100);
    }
  };

  // Regenerate harmony when interval changes
  useEffect(() => {
    if (melody.length > 0) {
      const newHarmony = generateHarmony(melody, selectedKey, scaleType, harmonyInterval);
      setHarmony(newHarmony);
    }
  }, [harmonyInterval, melody, selectedKey, scaleType]);

  return (
    <div className="flex flex-col h-screen bg-[#fff1dc] text-[#1b354e]">
      {/* Logo */}
      <div className="absolute top-4 left-4 z-10">
        <Logo />
      </div>

      {/* Main visualization area */}
      <div className="flex-1 relative">
        <StaffVisualizer
          melody={melody}
          harmony={harmony}
          tempo={tempo}
          currentBeat={currentBeat}
          userPitch={userPitch}
          userPitchHistory={pitchHistory}
          isPlaying={isPlaying}
        />
      </div>

      {/* Control bar */}
      <ControlBar
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        melodyVolume={melodyVolume}
        onMelodyVolumeChange={setMelodyVolume}
        harmonyVolume={harmonyVolume}
        onHarmonyVolumeChange={setHarmonyVolume}
        onSettingsClick={() => setSettingsOpen(true)}
        isLoading={isLoading}
      />

      {/* Settings menu */}
      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        vocalRange={vocalRange}
        onVocalRangeChange={(range) => {
          setVocalRange(range);
          // Update key to fit the new vocal range
          setSelectedKey(getRecommendedKey(range));
        }}
        melodyType={melodyType}
        onMelodyTypeChange={setMelodyType}
        selectedKey={selectedKey}
        onKeyChange={setSelectedKey}
        scaleType={scaleType}
        onScaleTypeChange={setScaleType}
        tempo={tempo}
        onTempoChange={setTempo}
        measures={measures}
        onMeasuresChange={setMeasures}
        complexity={complexity}
        onComplexityChange={setComplexity}
        harmonyInterval={harmonyInterval}
        onHarmonyIntervalChange={setHarmonyInterval}
        onNewMelody={handleNewMelody}
      />
    </div>
  );
}
