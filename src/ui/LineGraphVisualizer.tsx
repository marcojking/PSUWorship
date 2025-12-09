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
import React, { useMemo } from 'react';
import { Dimensions, Text as RNText, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    /** Current pitch in MIDI (0 if not singing) */
    currentPitchMidi: number;
    /** Current pitch accuracy (0-1) */
    currentAccuracy: number;
    /** Current playback position in ms */
    currentPositionMs: number;
    /** Total phrase duration in ms */
    phraseDurationMs: number;
    /** Is currently playing */
    isPlaying: boolean;
    /** Current score percentage */
    score: number;
}

// Graph fills most of screen, leaving room for buttons at bottom
const GRAPH_HEIGHT = SCREEN_HEIGHT - 200; // Leave space for bottom controls
const GRAPH_PADDING = { top: 60, bottom: 40, left: 50, right: 20 };
const GRAPH_WIDTH = SCREEN_WIDTH - 16;
const PLOT_WIDTH = GRAPH_WIDTH - GRAPH_PADDING.left - GRAPH_PADDING.right;
const PLOT_HEIGHT = GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom;

// Treble clef staff lines (bottom to top): E4, G4, B4, D5, F5
const STAFF_LINES = [
    { midi: 64, name: 'E4' },  // Bottom line
    { midi: 67, name: 'G4' },  // Second line
    { midi: 71, name: 'B4' },  // Third line (middle)
    { midi: 74, name: 'D5' },  // Fourth line
    { midi: 77, name: 'F5' },  // Top line
];

// Staff spaces represent: F4, A4, C5, E5
const STAFF_SPACES = [
    { midi: 65, name: 'F4' },  // Bottom space
    { midi: 69, name: 'A4' },  // Second space
    { midi: 72, name: 'C5' },  // Third space (middle C is ledger below)
    { midi: 76, name: 'E5' },  // Top space
];

// Extended range for ledger lines
const LEDGER_BELOW = [
    { midi: 60, name: 'C4' },  // Middle C - 2 ledger lines below
    { midi: 62, name: 'D4' },  // Space below E4
];
const LEDGER_ABOVE = [
    { midi: 79, name: 'G5' },  // Ledger above F5
    { midi: 81, name: 'A5' },  // Space above
];

// Full range for visualization (C4 to A5)
const STAFF_MIN_MIDI = 60; // C4 (middle C)
const STAFF_MAX_MIDI = 81; // A5
const STAFF_RANGE = STAFF_MAX_MIDI - STAFF_MIN_MIDI;

// Spacing between staff lines
const LINE_SPACING = PLOT_HEIGHT / 12; // 12 semitones from C4 to C5

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
    currentPitchMidi,
    currentAccuracy,
    currentPositionMs,
    phraseDurationMs,
    isPlaying,
    score,
}: LineGraphVisualizerProps) {
    // Fixed staff range (C4 to A5 covers treble clef and common vocal range)
    const minPitch = STAFF_MIN_MIDI;
    const maxPitch = STAFF_MAX_MIDI;
    const pitchRange = STAFF_RANGE;

    // Convert time to X position
    const timeToX = (timeMs: number): number => {
        if (phraseDurationMs <= 0) return GRAPH_PADDING.left;
        return GRAPH_PADDING.left + (timeMs / phraseDurationMs) * PLOT_WIDTH;
    };

    // Convert MIDI pitch to Y position (staff-based)
    const pitchToY = (midi: number): number => {
        // Each semitone gets equal vertical spacing
        const normalized = (midi - STAFF_MIN_MIDI) / STAFF_RANGE;
        // Invert Y (higher pitch = higher on screen = lower Y value)
        return GRAPH_PADDING.top + PLOT_HEIGHT - (normalized * PLOT_HEIGHT);
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
    }, [harmonyNotes, phraseDurationMs]);

    // Generate staff lines data
    const staffLineData = useMemo(() => {
        return STAFF_LINES.map(line => ({
            ...line,
            y: pitchToY(line.midi)
        }));
    }, []);

    // Middle C ledger line
    const middleCY = pitchToY(60);

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

                {/* 5-Line Treble Clef Staff */}
                {staffLineData.map(({ midi, name, y }) => (
                    <G key={midi}>
                        {/* Staff line */}
                        <Line
                            x1={GRAPH_PADDING.left}
                            y1={y}
                            x2={GRAPH_WIDTH - GRAPH_PADDING.right}
                            y2={y}
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth={1.5}
                        />
                        {/* Note label on left */}
                        <SvgText
                            x={GRAPH_PADDING.left - 8}
                            y={y + 4}
                            fill="#9ca3af"
                            fontSize={11}
                            textAnchor="end"
                            fontWeight="500"
                        >
                            {name}
                        </SvgText>
                    </G>
                ))}

                {/* Middle C ledger line (short, only when needed) */}
                <Line
                    x1={GRAPH_PADDING.left}
                    y1={middleCY}
                    x2={GRAPH_PADDING.left + 30}
                    y2={middleCY}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                />
                <SvgText
                    x={GRAPH_PADDING.left - 8}
                    y={middleCY + 4}
                    fill="#6b7280"
                    fontSize={10}
                    textAnchor="end"
                >
                    C4
                </SvgText>

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

                {/* Current pitch dot - always visible */}
                {(() => {
                    // Determine dot position
                    const dotX = isPlaying ? playheadX : GRAPH_PADDING.left + 10;
                    let dotY = GRAPH_PADDING.top + PLOT_HEIGHT / 2; // center if no pitch
                    let showUpArrow = false;
                    let showDownArrow = false;

                    if (currentPitchMidi > 0) {
                        if (currentPitchMidi > maxPitch) {
                            dotY = GRAPH_PADDING.top + 10;
                            showDownArrow = true; // Arrow pointing down toward center
                        } else if (currentPitchMidi < minPitch) {
                            dotY = GRAPH_HEIGHT - GRAPH_PADDING.bottom - 10;
                            showUpArrow = true; // Arrow pointing up toward center
                        } else {
                            dotY = pitchToY(currentPitchMidi);
                        }
                    }

                    const dotColor = currentPitchMidi > 0
                        ? getAccuracyColor(currentAccuracy)
                        : 'rgba(255,255,255,0.3)';

                    return (
                        <G>
                            {/* The dot */}
                            <Circle
                                cx={dotX}
                                cy={dotY}
                                r={8}
                                fill={dotColor}
                                stroke="#fff"
                                strokeWidth={2}
                            />
                            {/* Arrow pointing down (pitch too high) */}
                            {showDownArrow && (
                                <Polygon
                                    points={`${dotX},${dotY + 18} ${dotX - 6},${dotY + 12} ${dotX + 6},${dotY + 12}`}
                                    fill={dotColor}
                                />
                            )}
                            {/* Arrow pointing up (pitch too low) */}
                            {showUpArrow && (
                                <Polygon
                                    points={`${dotX},${dotY - 18} ${dotX - 6},${dotY - 12} ${dotX + 6},${dotY - 12}`}
                                    fill={dotColor}
                                />
                            )}
                        </G>
                    );
                })()}

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
