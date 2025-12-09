import { Text, View } from '@/components/Themed';
import { LocalGenerator } from '@/src/generator/LocalGenerator';
import { HarmonyEngine, INTERVALS } from '@/src/harmony/HarmonyEngine';
import { LocalSynthAdapter } from '@/src/synth/LocalSynthAdapter';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

export default function PracticeScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentSeed, setCurrentSeed] = useState(12345);
  const [synth] = useState(() => new LocalSynthAdapter());

  useEffect(() => {
    // Initialize synth on mount
    synth.initialize().catch(console.error);

    // Cleanup on unmount
    return () => {
      synth.dispose();
    };
  }, [synth]);

  const loadAndPlay = async (loop: boolean = false) => {
    setIsLoading(true);

    try {
      // Generate a melody
      const generator = new LocalGenerator();
      const melody = generator.generate({
        seed: currentSeed,
        key: 'C',
        difficulty: 1,
        lengthInNotes: 8,
      });

      // Generate harmony (major third above)
      const harmonyEngine = new HarmonyEngine();
      const harmony = harmonyEngine.computeHarmony({
        melody,
        interval: INTERVALS.MAJOR_THIRD,
        mode: 'diatonic',
        key: 'C',
        direction: 1,
      });

      // Load and play
      await synth.loadPhrase(melody, harmony);
      synth.play(loop);
      setIsPlaying(true);
      setIsLooping(loop);
    } catch (error) {
      console.error('Failed to play:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    synth.stop();
    setIsPlaying(false);
    setIsLooping(false);
  };

  const handleNewMelody = () => {
    handleStop();
    setCurrentSeed(Math.floor(Math.random() * 1000000));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 VocalHarmony</Text>
      <Text style={styles.subtitle}>Harmony Singing Trainer</Text>

      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      <View style={styles.controls}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#6366f1" />
        ) : isPlaying ? (
          <Pressable style={[styles.button, styles.stopButton]} onPress={handleStop}>
            <Text style={styles.buttonText}>⏹ Stop</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={[styles.button, styles.playButton]}
              onPress={() => loadAndPlay(false)}
            >
              <Text style={styles.buttonText}>▶️ Play Once</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.loopButton]}
              onPress={() => loadAndPlay(true)}
            >
              <Text style={styles.buttonText}>🔁 Loop</Text>
            </Pressable>
          </>
        )}

        <Pressable
          style={[styles.button, styles.newButton]}
          onPress={handleNewMelody}
        >
          <Text style={styles.buttonText}>🎲 New Melody</Text>
        </Pressable>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Seed: {currentSeed}</Text>
        <Text style={styles.infoText}>Key: C Major</Text>
        <Text style={styles.infoText}>Interval: Major Third</Text>
        <Text style={styles.infoText}>Mode: {isLooping ? '🔁 Looping' : isPlaying ? '▶️ Playing' : '⏸ Stopped'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#10b981',
  },
  loopButton: {
    backgroundColor: '#6366f1',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  newButton: {
    backgroundColor: '#f59e0b',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(100,100,100,0.1)',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
});
