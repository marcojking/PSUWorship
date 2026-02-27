'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import type { Song } from '@/lib/db';
import { transposeChordToKey, ALL_KEYS, getTranspositionInterval } from '@/lib/chords/transposition';
import { chordToRomanNumeral } from '@/lib/chords/nashville';
import { exportToChordPro } from '@/lib/chordpro/parser';

interface SongExportModalProps {
    song: Song;
    initialKey?: string; // currently displayed key (may be transposed)
    onClose: () => void;
}

type PdfFormat = 'letters' | 'numerals' | 'lyrics';

const PDF_FORMATS: { id: PdfFormat; label: string; desc: string }[] = [
    { id: 'letters', label: 'Letter Chords', desc: 'G, Am, C/E above lyrics' },
    { id: 'numerals', label: 'Roman Numerals', desc: 'Nashville / I–IV–V style' },
    { id: 'lyrics', label: 'Lyrics Only', desc: 'Clean sheet for congregation' },
];

export default function SongExportModal({ song, initialKey, onClose }: SongExportModalProps) {
    const [exportKey, setExportKey] = useState(initialKey || song.key);
    const [selectedPdf, setSelectedPdf] = useState<Set<PdfFormat>>(new Set(['letters']));
    const [chordProEnabled, setChordProEnabled] = useState(false);
    const [showKey, setShowKey] = useState(true);
    const [exporting, setExporting] = useState(false);

    const togglePdf = (id: PdfFormat) => {
        setSelectedPdf(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const totalFormats = selectedPdf.size + (chordProEnabled ? 1 : 0);

    const handleExport = async () => {
        if (totalFormats === 0) return;
        setExporting(true);
        try {
            for (const fmt of Array.from(selectedPdf)) {
                exportSongPdf(fmt);
                await new Promise(r => setTimeout(r, 80));
            }
            if (chordProEnabled) {
                exportChordPro();
            }
        } catch (err) {
            console.error('Export error:', err);
            alert('Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    // ─── ChordPro (.cho) ──────────────────────────────────────────────────────

    const exportChordPro = () => {
        const shouldTranspose = exportKey !== song.key;
        // Build sections with optionally transposed chords
        const transposedSections = shouldTranspose
            ? song.sections.map(section => ({
                ...section,
                lines: section.lines.map(line => ({
                    ...line,
                    chords: line.chords.map(cp => ({
                        ...cp,
                        chord: transposeChordToKey(cp.chord, song.key, exportKey),
                    })),
                })),
            }))
            : song.sections;

        const content = exportToChordPro(song.title, song.artist, exportKey, transposedSections);
        const sanitized = song.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        downloadText(content, `${sanitized}.cho`);
    };

    // ─── PDF ─────────────────────────────────────────────────────────────────

    const exportSongPdf = (fmt: PdfFormat) => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 54;
        const maxWidth = pageWidth - margin * 2;
        let y = margin;

        const shouldTranspose = exportKey !== song.key;

        const transformChord = (chord: string): string => {
            let c = shouldTranspose ? transposeChordToKey(chord, song.key, exportKey) : chord;
            if (fmt === 'numerals') c = chordToRomanNumeral(c, exportKey);
            return c;
        };

        // ── Song header ─────────────────────────────────────────────────────────
        doc.setFontSize(20);
        doc.setFont('courier', 'bold');
        doc.setTextColor(0, 48, 73);
        doc.text(song.title, margin, y);
        y += 26;

        doc.setFontSize(12);
        doc.setFont('courier', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(song.artist, margin, y);
        y += 18;

        if (fmt !== 'lyrics' && showKey) {
            doc.setFontSize(11);
            doc.setFont('courier', 'normal');
            doc.setTextColor(0, 48, 73);
            const keyLabel = fmt === 'numerals' ? `Key: ${exportKey} (Roman numerals)` : `Key: ${exportKey}`;
            doc.text(keyLabel, margin, y);
            y += 18;
        }

        // Divider line
        doc.setDrawColor(0, 48, 73);
        doc.setLineWidth(0.5);
        doc.line(margin, y + 4, pageWidth - margin, y + 4);
        y += 18;

        // ── Sections ────────────────────────────────────────────────────────────
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        for (const section of song.sections) {
            // Page-overflow check before section header
            if (y > pageHeight - margin - 60) {
                doc.addPage();
                y = margin;
            }

            // Section label
            doc.setFont('courier', 'bold');
            doc.setTextColor(0, 48, 73);
            doc.text(`[${section.label}]`, margin, y);
            y += 16;
            doc.setFont('courier', 'normal');
            doc.setTextColor(30, 30, 30);

            for (const line of section.lines) {
                if (y > pageHeight - margin - 30) {
                    doc.addPage();
                    y = margin;
                }

                // Chord line
                if (fmt !== 'lyrics' && line.chords.length > 0) {
                    const chordLine = buildChordLine(line.chords, line.lyrics.length, transformChord);
                    doc.setFont('courier', 'bold');
                    doc.setTextColor(0, 48, 73);
                    // Wrap chord line if too long
                    const chordLines = doc.splitTextToSize(chordLine, maxWidth);
                    chordLines.forEach((cl: string) => {
                        doc.text(cl, margin, y);
                        y += 12;
                    });
                }

                // Lyric line
                doc.setFont('courier', 'normal');
                doc.setTextColor(30, 30, 30);
                const lyricLines = doc.splitTextToSize(line.lyrics || ' ', maxWidth);
                lyricLines.forEach((ll: string) => {
                    doc.text(ll, margin, y);
                    y += 14;
                });
            }

            y += 10; // gap between sections
        }

        const suffixMap: Record<PdfFormat, string> = {
            letters: 'chords',
            numerals: 'numerals',
            lyrics: 'lyrics',
        };
        const sanitized = song.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        doc.save(`${sanitized}-${suffixMap[fmt]}.pdf`);
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div
                className="bg-background rounded-xl p-6 max-w-md w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-1">Export Song</h2>
                <p className="text-sm opacity-60 mb-5">{song.title}</p>

                {/* Key picker */}
                <div className="mb-5">
                    <label className="block text-sm font-medium mb-2">Export in key</label>
                    <div className="flex items-center gap-2">
                        <select
                            value={exportKey}
                            onChange={e => setExportKey(e.target.value)}
                            className="bg-white border border-primary/20 rounded px-2 py-1.5 font-mono text-sm flex-1"
                        >
                            {ALL_KEYS.map(k => {
                                const interval = getTranspositionInterval(song.key, k);
                                const display =
                                    k === song.key
                                        ? `${k} (original)`
                                        : `${k} (${interval > 6 ? interval - 12 : interval > 0 ? '+' + interval : interval})`;
                                return <option key={k} value={k}>{display}</option>;
                            })}
                        </select>
                    </div>
                </div>

                {/* PDF formats */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">PDF formats</label>
                    <div className="space-y-2">
                        {PDF_FORMATS.map(opt => {
                            const selected = selectedPdf.has(opt.id);
                            return (
                                <label
                                    key={opt.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-primary/20 hover:border-primary/40'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() => togglePdf(opt.id)}
                                        className="accent-primary"
                                    />
                                    <div>
                                        <div className="font-medium text-sm">{opt.label}</div>
                                        <div className="text-xs opacity-60">{opt.desc}</div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Show key toggle (only relevant for chord formats) */}
                {(selectedPdf.has('letters') || selectedPdf.has('numerals')) && (
                    <label className="flex items-center gap-2 text-sm mb-4 ml-1">
                        <input
                            type="checkbox"
                            checked={showKey}
                            onChange={e => setShowKey(e.target.checked)}
                            className="accent-primary"
                        />
                        Show key header on PDF
                    </label>
                )}

                {/* ChordPro */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Text formats</label>
                    <label
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${chordProEnabled ? 'border-primary bg-primary/5' : 'border-primary/20 hover:border-primary/40'
                            }`}
                    >
                        <input
                            type="checkbox"
                            checked={chordProEnabled}
                            onChange={e => setChordProEnabled(e.target.checked)}
                            className="accent-primary"
                        />
                        <div>
                            <div className="font-medium text-sm">ChordPro (.cho)</div>
                            <div className="text-xs opacity-60">Industry standard · works with OnSong, Planning Center, Chord\u00fa</div>
                        </div>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting || totalFormats === 0}
                        className="flex-1 bg-primary text-secondary py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                    >
                        {exporting ? 'Exporting…' : `Download${totalFormats > 1 ? ` (${totalFormats})` : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildChordLine(
    chords: { chord: string; position: number }[],
    lyricLength: number,
    transform: (chord: string) => string
): string {
    const maxLength = Math.max(lyricLength, 80);
    const chars: string[] = new Array(maxLength).fill(' ');
    for (const { chord, position } of chords) {
        const display = transform(chord);
        for (let i = 0; i < display.length && position + i < maxLength; i++) {
            chars[position + i] = display[i];
        }
    }
    return chars.join('').trimEnd();
}

function downloadText(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
