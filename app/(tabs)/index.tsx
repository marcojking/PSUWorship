/**
 * Practice Screen
 * Main screen for harmony singing practice with visualizer, scoring, and ghost mode
 */

import { Text, View } from '@/components/Themed';
import { MidiNote } from '@/src/generator/IGenerator';
import { LocalGenerator } from '@/src/generator/LocalGenerator';
import { HarmonyEngine, INTERVALS } from '@/src/harmony/HarmonyEngine';
import { PitchDetector } from '@/src/pitch/PitchDetector';
import { ScoringEngine } from '@/src/scoring/ScoringEngine';
import { LocalSynthAdapter } from '@/src/synth/LocalSynthAdapter';
import { HapticManager } from '@/src/ui/HapticManager';
import { Visualizer } from '@/src/ui/Visualizer';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch } from 'react-native';

export default function PracticeScreen() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentSeed, setCurrentSeed] = useState(12345);
  const [ghostMode, setGhostMode] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Pitch & scoring state
  const [currentPitch, setCurrentPitch] = useState(0);
  const [targetNote, setTargetNote] = useState(0);
  const [isOnTarget, setIsOnTarget] = useState(false);
  const [score, setScore] = useState(0);

  // Harmony notes (for scoring)
  const [harmonyNotes, setHarmonyNotes] = useState<MidiNote[]>([]);

  // Singletons
  const [synth] = useState(() => new LocalSynthAdapter());
  const [pitchDetector] = useState(() => new PitchDetector());
  const [scoringEngine] = useState(() => new ScoringEngine());
  const [hapticManager] = useState(() => new HapticManager());

  // Initialize on mount
  useEffect(() => {
    synth.initialize().catch(console.error);

    return () => {
      synth.dispose();
      pitchDetector.dispose();
      hapticManager.dispose();
    };
  }, [synth, pitchDetector, hapticManager]);

  // Handle pitch updates
  const handlePitch = useCallback((result: { pitchHz: number; isVoiced: boolean; confidence: number; timestamp: number }) => {
    setCurrentPitch(result.pitchHz);

    // Update scoring
    const currentTimeMs = synth.getCurrentPosition();
    scoringEngine.processPitch(result, currentTimeMs);

    const onTarget = scoringEngine.isOnTarget();
    setIsOnTarget(onTarget);

    // Update target note display
    const targetMidi = scoringEngine.getCurrentTargetMidi();
    setTargetNote(targetMidi);

    // Haptic feedback
    hapticManager.update(onTarget);

    // Ghost mode: unmute harmony when on target
    if (ghostMode) {
      synth.setHarmonyMuted(!onTarget);
    }
  }, [synth, scoringEngine, hapticManager, ghostMode]);

  // Start practice session
  const startPractice = async () => {
    setIsLoading(true);

    try {
      // Generate melody and harmony
      const generator = new LocalGenerator();
      const melody = generator.generate({
        seed: currentSeed,
        key: 'C',
        difficulty: 1,
        lengthInNotes: 8,
      });

      const harmonyEngine = new HarmonyEngine();
      const harmony = harmonyEngine.computeHarmony({
        melody,
        interval: INTERVALS.MAJOR_THIRD,
        mode: 'diatonic',
        key: 'C',
        direction: 1,
      });

      setHarmonyNotes(harmony);

      // Load audio
      await synth.loadPhrase(melody, harmony);

      // Start pitch detection
      pitchDetector.onPitch(handlePitch);
      await pitchDetector.start();
      setIsListening(true);

      // Start scoring
      scoringEngine.startRun(harmony);

      // Ghost mode: start with harmony muted
      if (ghostMode) {
        synth.setHarmonyMuted(true);
      }

      // Start playback (looping)
      synth.play(true);
      setIsPlaying(true);

    } catch (error) {
      console.error('Failed to start practice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop practice session
  const stopPractice = async () => {
    synth.stop();
    setIsPlaying(false);

    if (isListening) {
      pitchDetector.offPitch(handlePitch);
      await pitchDetector.stop();
      setIsListening(false);
    }

    // Get final score
    const runScore = scoringEngine.endRun();
    setScore(runScore.overallScore);

    // Reset state
    setCurrentPitch(0);
    setIsOnTarget(false);
  };

  // New melody
  const handleNewMelody = () => {
    stopPractice();
    setCurrentSeed(Math.floor(Math.random() * 1000000));
    setScore(0);
  };

  // Toggle ghost mode
  const toggleGhostMode = (value: boolean) => {
    setGhostMode(value);
    if (isPlaying) {
      synth.setHarmonyMuted(value && !isOnTarget);
    }
  };

  // Toggle haptics
  const toggleHaptics = (value: boolean) => {
    setHapticsEnabled(value);
    hapticManager.setEnabled(value);
  };

  // Update score periodically
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      // Calculate running score
      const frames = (scoringEngine as any).frames;
      if (frames && frames.length > 0) {
        const correctFrames = frames.filter((f: any) => f.isCorrect).length;
        const runningScore = (correctFrames / frames.length) * 100;
        setScore(runningScore);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, scoringEngine]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 VocalHarmony</Text>

      {/* Visualizer */}
      <Visualizer
        currentPitch={currentPitch}
        targetNote={targetNote}
        isOnTarget={isOnTarget}
        score={score}
      />

      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      {/* Controls */}
      <View style={styles.controls}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#6366f1" />
        ) : isPlaying ? (
          <Pressable style={[styles.button, styles.stopButton]} onPress={stopPractice}>
            <Text style={styles.buttonText}>⏹ Stop</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, styles.playButton]}
            onPress={startPractice}
          >
            <Text style={styles.buttonText}>🎤 Start Practice</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.button, styles.newButton]}
          onPress={handleNewMelody}
        >
          <Text style={styles.buttonText}>🎲 New</Text>
        </Pressable>
      </View>

      {/* Settings */}
      <View style={styles.settings}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>👻 Ghost Mode</Text>
          <Switch
            value={ghostMode}
            onValueChange={toggleGhostMode}
            trackColor={{ false: '#374151', true: '#6366f1' }}
            thumbColor={ghostMode ? '#fff' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.settingHint}>
          Harmony only plays when you're on pitch
        </Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>📳 Haptics</Text>
          <Switch
            value={hapticsEnabled}
            onValueChange={toggleHaptics}
            trackColor={{ false: '#374151', true: '#10b981' }}
            thumbColor={hapticsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Seed: {currentSeed}</Text>
        <Text style={styles.infoText}>Key: C Major | Interval: Major 3rd</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  separator: {
    marginVertical: 16,
    height: 1,
    width: '100%',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  newButton: {
    backgroundColor: '#f59e0b',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settings: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(100,100,100,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingHint: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: 'rgba(100,100,100,0.05)',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 320,
  },
  infoText: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});
