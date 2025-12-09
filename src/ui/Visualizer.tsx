/**
 * Visualizer Component
 * Single-line pitch visualizer showing target band and user pitch dot
 */

import { Text } from '@/components/Themed';
import { midiToNoteName } from '@/src/pitch/YinPitchDetection';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

interface VisualizerProps {
    /** Current detected pitch in Hz */
    currentPitch: number;
    /** Target MIDI note number */
    targetNote: number;
    /** Whether user is on target (within tolerance) */
    isOnTarget: boolean;
    /** Tolerance in cents */
    toleranceCents?: number;
    /** Current score percentage */
    score?: number;
}

const VISIBLE_SEMITONES = 12; // Show one octave range
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function Visualizer({
    currentPitch,
    targetNote,
    isOnTarget,
    toleranceCents = 50,
    score = 0,
}: VisualizerProps) {
    // Calculate positions
    const centerX = SCREEN_WIDTH / 2;
    const pixelsPerSemitone = (SCREEN_WIDTH - 40) / VISIBLE_SEMITONES;

    // Calculate target band width based on tolerance
    // 50 cents = half semitone
    const bandWidth = (toleranceCents / 100) * pixelsPerSemitone * 2;

    // Calculate pitch dot position
    let pitchDotX = centerX;
    let showPitchDot = false;

    if (currentPitch > 0 && targetNote > 0) {
        // Convert pitch to MIDI
        const currentMidi = 69 + 12 * Math.log2(currentPitch / 440);
        const semitoneDiff = currentMidi - targetNote;

        // Clamp to visible range
        const clampedDiff = Math.max(-VISIBLE_SEMITONES / 2, Math.min(VISIBLE_SEMITONES / 2, semitoneDiff));
        pitchDotX = centerX + clampedDiff * pixelsPerSemitone;
        showPitchDot = true;
    }

    const targetNoteName = targetNote > 0 ? midiToNoteName(targetNote) : '?';

    return (
        <View style={styles.container}>
            {/* Note label */}
            <View style={styles.labelRow}>
                <Text style={styles.noteLabel}>Target: {targetNoteName}</Text>
                <Text style={styles.scoreLabel}>{score.toFixed(0)}%</Text>
            </View>

            {/* Visualizer track */}
            <View style={styles.track}>
                {/* Piano-style markers */}
                {Array.from({ length: VISIBLE_SEMITONES + 1 }).map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.marker,
                            { left: 20 + i * pixelsPerSemitone - 1 },
                            i === VISIBLE_SEMITONES / 2 && styles.centerMarker,
                        ]}
                    />
                ))}

                {/* Target band (green zone) */}
                <View
                    style={[
                        styles.targetBand,
                        {
                            left: centerX - bandWidth / 2,
                            width: bandWidth,
                        },
                    ]}
                />

                {/* Center line */}
                <View style={[styles.centerLine, { left: centerX - 1 }]} />

                {/* Pitch dot */}
                {showPitchDot && (
                    <View
                        style={[
                            styles.pitchDot,
                            {
                                left: pitchDotX - 12,
                                backgroundColor: isOnTarget ? '#10b981' : '#ef4444',
                            },
                        ]}
                    />
                )}
            </View>

            {/* Status indicator */}
            <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: isOnTarget ? '#10b981' : '#6b7280' }]} />
                <Text style={styles.statusText}>
                    {isOnTarget ? 'On Target! 🎯' : currentPitch > 0 ? 'Keep adjusting...' : 'Sing now!'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 16,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    noteLabel: {
        fontSize: 18,
        fontWeight: '600',
    },
    scoreLabel: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    track: {
        height: 80,
        backgroundColor: 'rgba(100, 100, 100, 0.1)',
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    marker: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: 'rgba(100, 100, 100, 0.2)',
    },
    centerMarker: {
        backgroundColor: 'rgba(100, 100, 100, 0.4)',
        width: 3,
    },
    targetBand: {
        position: 'absolute',
        top: 10,
        bottom: 10,
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#10b981',
    },
    centerLine: {
        position: 'absolute',
        top: 20,
        bottom: 20,
        width: 2,
        backgroundColor: '#6366f1',
    },
    pitchDot: {
        position: 'absolute',
        top: '50%',
        marginTop: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
    },
});
