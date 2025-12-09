/**
 * Practice Screen
 * Main screen for harmony singing practice with line graph visualizer
 */

import { Text, View } from '@/components/Themed';
import { MidiNote } from '@/src/generator/IGenerator';
import { LocalGenerator } from '@/src/generator/LocalGenerator';
import { HarmonyEngine } from '@/src/harmony/HarmonyEngine';
import { PitchDetector } from '@/src/pitch/PitchDetector';
import { frequencyToMidi } from '@/src/pitch/YinPitchDetection';
import { ScoringEngine } from '@/src/scoring/ScoringEngine';
import { LocalSynthAdapter } from '@/src/synth/LocalSynthAdapter';
import {
  DEFAULT_SETTINGS,
  harmonyIntervalToSemitones,
  PracticeSettings,
} from '@/src/types/PracticeSettings';
import { HapticManager } from '@/src/ui/HapticManager';
import { LineGraphVisualizer } from '@/src/ui/LineGraphVisualizer';
import { SettingsModal } from '@/src/ui/SettingsModal';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

interface PitchPoint {
  timeMs: number;
  pitchMidi: number;
  accuracy: number;
}

export default function PracticeScreen() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState<PracticeSettings>(DEFAULT_SETTINGS);
  const [currentSeed, setCurrentSeed] = useState(12345);

  // Melody & harmony
  const [melodyNotes, setMelodyNotes] = useState<MidiNote[]>([]);
  const [harmonyNotes, setHarmonyNotes] = useState<MidiNote[]>([]);
  const [phraseDuration, setPhraseDuration] = useState(0);

  // Real-time state
  const [currentPosition, setCurrentPosition] = useState(0);
  const [currentPitchMidi, setCurrentPitchMidi] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [userPitchHistory, setUserPitchHistory] = useState<PitchPoint[]>([]);
  const [score, setScore] = useState(0);

  // Refs for singletons
  const synthRef = useRef(new LocalSynthAdapter());
  const pitchDetectorRef = useRef(new PitchDetector());
  const scoringEngineRef = useRef(new ScoringEngine());
  const hapticManagerRef = useRef(new HapticManager());
  const animationFrameRef = useRef<number | null>(null);

  // Initialize
  useEffect(() => {
    synthRef.current.initialize().catch(console.error);

    return () => {
      synthRef.current.dispose();
      pitchDetectorRef.current.dispose();
      hapticManagerRef.current.dispose();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update haptics setting
  useEffect(() => {
    hapticManagerRef.current.setEnabled(settings.hapticsEnabled);
  }, [settings.hapticsEnabled]);

  // Pitch callback
  const handlePitch = useCallback((result: { pitchHz: number; isVoiced: boolean; confidence: number; timestamp: number }) => {
    const synth = synthRef.current;
    const scoring = scoringEngineRef.current;
    const haptic = hapticManagerRef.current;

    const currentTimeMs = synth.getCurrentPosition();
    scoring.processPitch(result, currentTimeMs);

    const onTarget = scoring.isOnTarget();
    haptic.update(onTarget);

    // Ghost mode: unmute harmony when on target
    if (settings.ghostMode) {
      synth.setHarmonyMuted(!onTarget);
    }

    // Update current pitch display
    if (result.isVoiced && result.pitchHz > 0) {
      const midiNote = frequencyToMidi(result.pitchHz);
      const accuracy = onTarget ? 1 : Math.max(0, 1 - Math.abs(scoring.getCurrentTargetMidi() - midiNote) / 6);

      setCurrentPitchMidi(midiNote);
      setCurrentAccuracy(accuracy);

      setUserPitchHistory(prev => {
        const newHistory = [...prev, { timeMs: currentTimeMs, pitchMidi: midiNote, accuracy }];
        return newHistory.slice(-500);
      });
    } else {
      setCurrentPitchMidi(0);
      setCurrentAccuracy(0);
    }
  }, [settings.ghostMode]);

  // Animation loop for position updates
  const updatePosition = useCallback(() => {
    if (!isPlaying) return;

    const pos = synthRef.current.getCurrentPosition();
    setCurrentPosition(pos);

    // Update running score
    const frames = (scoringEngineRef.current as any).frames;
    if (frames && frames.length > 0) {
      const correctFrames = frames.filter((f: any) => f.isCorrect).length;
      setScore((correctFrames / frames.length) * 100);
    }

    animationFrameRef.current = requestAnimationFrame(updatePosition);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      updatePosition();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updatePosition]);

  // Generate melody and harmony
  const generatePhrase = useCallback(() => {
    const generator = new LocalGenerator();
    const melody = generator.generate({
      seed: currentSeed,
      key: settings.key,
      difficulty: 1,
      lengthInNotes: settings.notesPerLoop,
    });

    const harmonyEngine = new HarmonyEngine();
    const harmony = harmonyEngine.computeHarmony({
      melody,
      interval: harmonyIntervalToSemitones(settings.harmonyInterval),
      mode: 'diatonic',
      key: settings.key,
      direction: 1,
    });

    const duration = melody.length > 0
      ? melody[melody.length - 1].start_ms + melody[melody.length - 1].duration_ms
      : 0;

    setMelodyNotes(melody);
    setHarmonyNotes(harmony);
    setPhraseDuration(duration);

    return { melody, harmony };
  }, [currentSeed, settings.key, settings.notesPerLoop, settings.harmonyInterval]);

  // Start practice
  const startPractice = async () => {
    setIsLoading(true);
    setUserPitchHistory([]);
    setScore(0);

    try {
      const { melody, harmony } = generatePhrase();

      await synthRef.current.loadPhrase(melody, harmony);

      pitchDetectorRef.current.onPitch(handlePitch);
      await pitchDetectorRef.current.start();

      scoringEngineRef.current.startRun(harmony);
      scoringEngineRef.current.setTolerance(settings.pitchToleranceCents);

      if (settings.ghostMode) {
        synthRef.current.setHarmonyMuted(true);
      }

      synthRef.current.play(settings.practiceMode === 'loop');
      setIsPlaying(true);

    } catch (error) {
      console.error('Failed to start practice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop practice
  const stopPractice = async () => {
    synthRef.current.stop();
    setIsPlaying(false);

    pitchDetectorRef.current.offPitch(handlePitch);
    await pitchDetectorRef.current.stop();

    const runScore = scoringEngineRef.current.endRun();
    setScore(runScore.overallScore);
  };

  // New melody
  const handleNewMelody = () => {
    if (isPlaying) stopPractice();
    setCurrentSeed(Math.floor(Math.random() * 1000000));
    setUserPitchHistory([]);
    setScore(0);
    generatePhrase();
  };

  // Generate initial phrase
  useEffect(() => {
    generatePhrase();
  }, [generatePhrase]);

  return (
    <View style={styles.container}>
      {/* Line Graph Visualizer - Full screen */}
      <View style={styles.graphContainer}>
        <LineGraphVisualizer
          melodyNotes={melodyNotes}
          harmonyNotes={harmonyNotes}
          userPitchHistory={userPitchHistory}
          currentPitchMidi={currentPitchMidi}
          currentAccuracy={currentAccuracy}
          currentPositionMs={currentPosition}
          phraseDurationMs={phraseDuration}
          isPlaying={isPlaying}
          score={score}
        />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.iconButton} onPress={handleNewMelody}>
          <Text style={styles.iconText}>🎲</Text>
        </Pressable>

        {isLoading ? (
          <ActivityIndicator size="large" color="#6366f1" />
        ) : (
          <Pressable
            style={[styles.mainButton, isPlaying ? styles.stopButton : styles.playButton]}
            onPress={isPlaying ? stopPractice : startPractice}
          >
            <Text style={styles.mainButtonText}>
              {isPlaying ? '⏹' : '▶'}
            </Text>
          </Pressable>
        )}

        <Pressable style={styles.iconButton} onPress={() => setSettingsVisible(true)}>
          <Text style={styles.iconText}>⚙️</Text>
        </Pressable>
      </View>

      {/* Info bar */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {settings.key} • {settings.harmonyInterval} • {settings.notesPerLoop} notes
        </Text>
      </View>

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        settings={settings}
        onClose={() => setSettingsVisible(false)}
        onSettingsChange={setSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  graphContainer: {
    flex: 1,
    paddingTop: 50,
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 20,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  mainButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  mainButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  infoBar: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  infoText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
    letterSpacing: 1,
  },
});
