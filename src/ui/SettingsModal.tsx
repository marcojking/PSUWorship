/**
 * Settings Modal Component
 * Popup menu for configuring practice settings
 */

import { Text } from '@/components/Themed';
import {
    HarmonyInterval,
    MusicalKey,
    NoteDuration,
    PracticeMode,
    PracticeSettings,
} from '@/src/types/PracticeSettings';
import React from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from 'react-native';

interface SettingsModalProps {
    visible: boolean;
    settings: PracticeSettings;
    onClose: () => void;
    onSettingsChange: (settings: PracticeSettings) => void;
}

const HARMONY_INTERVALS: HarmonyInterval[] = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'];
const KEYS: MusicalKey[] = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Am', 'Em', 'Dm'];
const DURATIONS: NoteDuration[] = ['short', 'medium', 'long', 'mixed'];
const NOTES_RANGE = [2, 3, 4, 5, 6, 7, 8];

export function SettingsModal({ visible, settings, onClose, onSettingsChange }: SettingsModalProps) {
    const update = (partial: Partial<PracticeSettings>) => {
        onSettingsChange({ ...settings, ...partial });
    };

    const updateMelodyIntervals = (key: keyof PracticeSettings['melodyIntervals'], value: boolean) => {
        onSettingsChange({
            ...settings,
            melodyIntervals: { ...settings.melodyIntervals, [key]: value },
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Settings</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </Pressable>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Practice Mode */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mode</Text>
                            <View style={styles.buttonRow}>
                                {(['loop', 'continuous'] as PracticeMode[]).map((mode) => (
                                    <Pressable
                                        key={mode}
                                        style={[styles.chip, settings.practiceMode === mode && styles.chipActive]}
                                        onPress={() => update({ practiceMode: mode })}
                                    >
                                        <Text style={[styles.chipText, settings.practiceMode === mode && styles.chipTextActive]}>
                                            {mode === 'loop' ? '🔁 Loop' : '∞ Continuous'}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Key */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Key</Text>
                            <View style={styles.buttonRow}>
                                {KEYS.map((key) => (
                                    <Pressable
                                        key={key}
                                        style={[styles.chip, styles.chipSmall, settings.key === key && styles.chipActive]}
                                        onPress={() => update({ key })}
                                    >
                                        <Text style={[styles.chipText, settings.key === key && styles.chipTextActive]}>
                                            {key}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Harmony Interval */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Harmony Interval</Text>
                            <View style={styles.buttonRow}>
                                {HARMONY_INTERVALS.map((interval) => (
                                    <Pressable
                                        key={interval}
                                        style={[styles.chip, styles.chipSmall, settings.harmonyInterval === interval && styles.chipActive]}
                                        onPress={() => update({ harmonyInterval: interval })}
                                    >
                                        <Text style={[styles.chipText, settings.harmonyInterval === interval && styles.chipTextActive]}>
                                            {interval}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Notes per Loop */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Notes per Loop</Text>
                            <View style={styles.buttonRow}>
                                {NOTES_RANGE.map((n) => (
                                    <Pressable
                                        key={n}
                                        style={[styles.chip, styles.chipTiny, settings.notesPerLoop === n && styles.chipActive]}
                                        onPress={() => update({ notesPerLoop: n })}
                                    >
                                        <Text style={[styles.chipText, settings.notesPerLoop === n && styles.chipTextActive]}>
                                            {n}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Note Duration */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Note Duration</Text>
                            <View style={styles.buttonRow}>
                                {DURATIONS.map((dur) => (
                                    <Pressable
                                        key={dur}
                                        style={[styles.chip, settings.noteDuration === dur && styles.chipActive]}
                                        onPress={() => update({ noteDuration: dur })}
                                    >
                                        <Text style={[styles.chipText, settings.noteDuration === dur && styles.chipTextActive]}>
                                            {dur}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Melody Intervals (jumps) */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Melody Jumps</Text>
                            <Text style={styles.hint}>Which intervals can appear in the melody</Text>

                            {[
                                { key: 'step', label: 'Steps (2nds)' },
                                { key: 'third', label: '3rds' },
                                { key: 'fourth', label: '4ths' },
                                { key: 'fifth', label: '5ths' },
                                { key: 'octave', label: 'Octaves' },
                            ].map(({ key, label }) => (
                                <View key={key} style={styles.toggleRow}>
                                    <Text style={styles.toggleLabel}>{label}</Text>
                                    <Switch
                                        value={settings.melodyIntervals[key as keyof typeof settings.melodyIntervals]}
                                        onValueChange={(v) => updateMelodyIntervals(key as keyof PracticeSettings['melodyIntervals'], v)}
                                        trackColor={{ false: '#374151', true: '#6366f1' }}
                                    />
                                </View>
                            ))}
                        </View>

                        {/* Features */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Features</Text>

                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>📳 Haptics</Text>
                                <Switch
                                    value={settings.hapticsEnabled}
                                    onValueChange={(v) => update({ hapticsEnabled: v })}
                                    trackColor={{ false: '#374151', true: '#10b981' }}
                                />
                            </View>

                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>👻 Ghost Mode</Text>
                                <Switch
                                    value={settings.ghostMode}
                                    onValueChange={(v) => update({ ghostMode: v })}
                                    trackColor={{ false: '#374151', true: '#8b5cf6' }}
                                />
                            </View>
                            <Text style={styles.hint}>Harmony only plays when you're on pitch</Text>
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: '#1f2937',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        fontSize: 16,
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9ca3af',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    hint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    chipSmall: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    chipTiny: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        minWidth: 40,
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: '#6366f1',
    },
    chipText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    toggleLabel: {
        fontSize: 16,
        color: '#e5e7eb',
    },
});
