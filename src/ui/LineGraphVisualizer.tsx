/**
 * LineGraphVisualizer
 * Scrolling line graph showing melody, harmony target, and user's sung pitch
 * 
 * X-axis: Measures/beats
 * Y-axis: Pitch (MIDI notes)
 * 
 * Lines:
 * - White solid: Melody being played
 * - White dotted: Target harmony (what user should sing)
 * - Orange→Green: User's pitch (color changes based on accuracy)
 */

import { MidiNote } from '@/src/generator/IGenerator';
import { midiToNoteName } from '@/src/pitch/YinPitchDetection';
import React, { useMemo } from 'react';
import { Dimensions, Text as RNText, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PitchPoint {
    timeMs: number;
    pitchMidi: number;
    accuracy: number; // 0-1, where 1 = perfect
}

interface LineGraphVisualizerProps {
    /** Melody notes being played */
    melodyNotes: MidiNote[];
    /** Harmony target notes */
    harmonyNotes: MidiNote[];
    /** User's sung pitch history */
    userPitchHistory: PitchPoint[];
    /** Current playback position in ms */
    currentPositionMs: number;
    /** Total phrase duration in ms */
    phraseDurationMs: number;
    /** Is currently playing */
    isPlaying: boolean;
    /** Current score percentage */
    score: number;
}

// Constants
const GRAPH_HEIGHT = 280;
const GRAPH_PADDING = { top: 30, bottom: 40, left: 40, right: 20 };
const GRAPH_WIDTH = SCREEN_WIDTH - 32;
const PLOT_WIDTH = GRAPH_WIDTH - GRAPH_PADDING.left - GRAPH_PADDING.right;
const PLOT_HEIGHT = GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom;

/**
 * Interpolate color from orange to green based on accuracy
 * @param accuracy 0-1 where 1 = green, 0 = orange
 */
function getAccuracyColor(accuracy: number): string {
    const clamped = Math.max(0, Math.min(1, accuracy));

    // Orange: #f97316 (249, 115, 22)
    // Green: #10b981 (16, 185, 129)
    const r = Math.round(249 + (16 - 249) * clamped);
    const g = Math.round(115 + (185 - 115) * clamped);
    const b = Math.round(22 + (129 - 22) * clamped);

    return `rgb(${r},${g},${b})`;
}

export function LineGraphVisualizer({
    melodyNotes,
    harmonyNotes,
    userPitchHistory,
    currentPositionMs,
    phraseDurationMs,
    isPlaying,
    score,
}: LineGraphVisualizerProps) {
    // Calculate pitch range
    const { minPitch, maxPitch, pitchRange } = useMemo(() => {
        const allPitches = [
            ...melodyNotes.map(n => n.note),
            ...harmonyNotes.map(n => n.note),
            ...userPitchHistory.map(p => p.pitchMidi).filter(p => p > 0),
        ];

        if (allPitches.length === 0) {
            return { minPitch: 60, maxPitch: 72, pitchRange: 12 };
        }

        const min = Math.min(...allPitches) - 2;
        const max = Math.max(...allPitches) + 2;
        return { minPitch: min, maxPitch: max, pitchRange: max - min };
    }, [melodyNotes, harmonyNotes, userPitchHistory]);

    // Convert time to X position
    const timeToX = (timeMs: number): number => {
        if (phraseDurationMs <= 0) return GRAPH_PADDING.left;
        return GRAPH_PADDING.left + (timeMs / phraseDurationMs) * PLOT_WIDTH;
    };

    // Convert MIDI pitch to Y position
    const pitchToY = (midi: number): number => {
        const normalized = (midi - minPitch) / pitchRange;
        return GRAPH_PADDING.top + PLOT_HEIGHT - normalized * PLOT_HEIGHT;
    };

    // Generate melody path (stepped line)
    const melodyPath = useMemo(() => {
        if (melodyNotes.length === 0) return '';

        let d = '';
        melodyNotes.forEach((note, i) => {
            const x1 = timeToX(note.start_ms);
            const x2 = timeToX(note.start_ms + note.duration_ms);
            const y = pitchToY(note.note);

            if (i === 0) {
                d += `M ${x1} ${y}`;
            } else {
                d += ` L ${x1} ${y}`;
            }
            d += ` L ${x2} ${y}`;
        });
        return d;
    }, [melodyNotes, phraseDurationMs, minPitch, pitchRange]);

    // Generate harmony path (stepped line, dotted)
    const harmonyPath = useMemo(() => {
        if (harmonyNotes.length === 0) return '';

        let d = '';
        harmonyNotes.forEach((note, i) => {
            const x1 = timeToX(note.start_ms);
            const x2 = timeToX(note.start_ms + note.duration_ms);
            const y = pitchToY(note.note);

            if (i === 0) {
                d += `M ${x1} ${y}`;
            } else {
                d += ` L ${x1} ${y}`;
            }
            d += ` L ${x2} ${y}`;
        });
        return d;
    }, [harmonyNotes, phraseDurationMs, minPitch, pitchRange]);

    // Generate grid lines for pitch
    const pitchGridLines = useMemo(() => {
        const lines = [];
        for (let pitch = Math.ceil(minPitch); pitch <= Math.floor(maxPitch); pitch++) {
            const y = pitchToY(pitch);
            const isC = pitch % 12 === 0;
            lines.push({ pitch, y, isC, label: midiToNoteName(pitch) });
        }
        return lines;
    }, [minPitch, maxPitch, pitchRange]);

    // Current playhead position
    const playheadX = timeToX(currentPositionMs);

    // Measure markers (assuming 4 beats per measure at 120 BPM = 2000ms per measure)
    const measureMarkers = useMemo(() => {
        const msPerMeasure = 2000; // Adjust based on tempo
        const markers = [];
        for (let ms = 0; ms <= phraseDurationMs; ms += msPerMeasure) {
            markers.push({
                x: timeToX(ms),
                measure: Math.floor(ms / msPerMeasure) + 1,
            });
        }
        return markers;
    }, [phraseDurationMs]);

    return (
        <View style={styles.container}>
            {/* Score display */}
            <View style={styles.scoreContainer}>
                <View style={[styles.scoreBadge, score >= 80 ? styles.scoreBadgeGood : score >= 50 ? styles.scoreBadgeOk : {}]}>
                    <RNText style={styles.scoreText}>{score.toFixed(0)}%</RNText>
                </View>
            </View>

            <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
                {/* Background */}
                <Rect
                    x={GRAPH_PADDING.left}
                    y={GRAPH_PADDING.top}
                    width={PLOT_WIDTH}
                    height={PLOT_HEIGHT}
                    fill="#0f172a"
                    rx={8}
                />

                {/* Pitch grid lines */}
                {pitchGridLines.map(({ pitch, y, isC, label }) => (
                    <G key={pitch}>
                        <Line
                            x1={GRAPH_PADDING.left}
                            y1={y}
                            x2={GRAPH_WIDTH - GRAPH_PADDING.right}
                            y2={y}
                            stroke={isC ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}
                            strokeWidth={isC ? 1 : 0.5}
                        />
                        {/* Show note labels for C notes and every 4th */}
                        {(isC || pitch % 4 === 0) && (
                            <SvgText
                                x={GRAPH_PADDING.left - 8}
                                y={y + 4}
                                fill="#6b7280"
                                fontSize={10}
                                textAnchor="end"
                            >
                                {label}
                            </SvgText>
                        )}
                    </G>
                ))}

                {/* Measure markers */}
                {measureMarkers.map(({ x, measure }) => (
                    <G key={measure}>
                        <Line
                            x1={x}
                            y1={GRAPH_PADDING.top}
                            x2={x}
                            y2={GRAPH_HEIGHT - GRAPH_PADDING.bottom}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth={1}
                        />
                        <SvgText
                            x={x}
                            y={GRAPH_HEIGHT - GRAPH_PADDING.bottom + 16}
                            fill="#6b7280"
                            fontSize={10}
                            textAnchor="middle"
                        >
                            {measure}
                        </SvgText>
                    </G>
                ))}

                {/* Melody line (white solid) */}
                <Path
                    d={melodyPath}
                    stroke="#ffffff"
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Harmony line (white dotted) */}
                <Path
                    d={harmonyPath}
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth={2.5}
                    fill="none"
                    strokeDasharray="8,5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* User's pitch line (color changes based on accuracy) */}
                {userPitchHistory.length > 1 && userPitchHistory.slice(-100).map((point, i, arr) => {
                    if (i === 0 || point.pitchMidi <= 0) return null;
                    const prev = arr[i - 1];
                    if (prev.pitchMidi <= 0) return null;

                    return (
                        <Line
                            key={i}
                            x1={timeToX(prev.timeMs)}
                            y1={pitchToY(prev.pitchMidi)}
                            x2={timeToX(point.timeMs)}
                            y2={pitchToY(point.pitchMidi)}
                            stroke={getAccuracyColor(point.accuracy)}
                            strokeWidth={3}
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* Current pitch dot */}
                {userPitchHistory.length > 0 && userPitchHistory[userPitchHistory.length - 1].pitchMidi > 0 && (
                    <Circle
                        cx={timeToX(userPitchHistory[userPitchHistory.length - 1].timeMs)}
                        cy={pitchToY(userPitchHistory[userPitchHistory.length - 1].pitchMidi)}
                        r={6}
                        fill={getAccuracyColor(userPitchHistory[userPitchHistory.length - 1].accuracy)}
                        stroke="#fff"
                        strokeWidth={2}
                    />
                )}

                {/* Playhead */}
                {isPlaying && (
                    <Line
                        x1={playheadX}
                        y1={GRAPH_PADDING.top}
                        x2={playheadX}
                        y2={GRAPH_HEIGHT - GRAPH_PADDING.bottom}
                        stroke="#f59e0b"
                        strokeWidth={2}
                    />
                )}

                {/* Legend */}
                <G transform={`translate(${GRAPH_PADDING.left + 10}, ${GRAPH_PADDING.top + 10})`}>
                    <Line x1={0} y1={0} x2={20} y2={0} stroke="#ffffff" strokeWidth={2} />
                    <SvgText x={25} y={4} fill="#9ca3af" fontSize={9}>Melody</SvgText>

                    <Line x1={70} y1={0} x2={90} y2={0} stroke="rgba(255,255,255,0.85)" strokeWidth={2} strokeDasharray="4,3" />
                    <SvgText x={95} y={4} fill="#9ca3af" fontSize={9}>Target</SvgText>

                    <Circle cx={145} cy={0} r={4} fill="#10b981" />
                    <SvgText x={153} y={4} fill="#9ca3af" fontSize={9}>You</SvgText>
                </G>
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 16,
    },
    scoreContainer: {
        position: 'absolute',
        top: 8,
        right: 24,
        zIndex: 10,
    },
    scoreBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    scoreBadgeOk: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    scoreBadgeGood: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    scoreText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});
