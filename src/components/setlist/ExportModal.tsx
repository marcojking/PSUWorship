'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import type { Song, Setlist } from '@/lib/db';
import { transposeChordToKey } from '@/lib/chords/transposition';
import { chordToRomanNumeral } from '@/lib/chords/nashville';

interface ExportModalProps {
  setlist: Setlist;
  songs: (Song & { transposedKey?: string })[];
  onClose: () => void;
}

type ExportFormat = 'lyrics' | 'letters' | 'numerals' | 'all' | 'infographic';

export default function ExportModal({ setlist, songs, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('letters');
  const [pageBreaks, setPageBreaks] = useState(true);
  const [showKey, setShowKey] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      if (format === 'infographic') {
        exportInfographic();
      } else if (format === 'all') {
        exportAllFormats();
      } else {
        exportSingleFormat(format);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportInfographic = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background color (cream)
    doc.setFillColor(255, 241, 220);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // PSUWorship title
    doc.setTextColor(27, 53, 78);
    doc.setFontSize(48);
    doc.setFont('helvetica', 'normal');
    doc.text('PSU', pageWidth / 2 - 60, 100, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text('Worship', pageWidth / 2 - 55, 100, { align: 'left' });

    // Dark banner
    const bannerY = 160;
    const bannerHeight = 100;
    doc.setFillColor(27, 53, 78);
    doc.rect(40, bannerY, pageWidth - 80, bannerHeight, 'F');

    // Event name in banner
    doc.setTextColor(255, 241, 220);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(setlist.name || 'Worship Night!', pageWidth / 2, bannerY + 60, { align: 'center' });

    // Date, time, location
    doc.setTextColor(27, 53, 78);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');

    let infoY = bannerY + bannerHeight + 60;

    // Format date nicely
    const dateObj = new Date(setlist.date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    const dateTimeStr = setlist.time
      ? `${formattedDate} • ${setlist.time}`
      : formattedDate;

    doc.text(dateTimeStr, pageWidth / 2, infoY, { align: 'center' });

    if (setlist.location) {
      infoY += 20;
      doc.text('-', pageWidth / 2, infoY, { align: 'center' });
      infoY += 20;
      doc.text(setlist.location, pageWidth / 2, infoY, { align: 'center' });
    }

    // Horizontal lines
    const songListY = infoY + 60;
    doc.setDrawColor(27, 53, 78);
    doc.setLineWidth(1);
    doc.line(60, songListY, pageWidth - 60, songListY);

    // Song list
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');

    const songTitles = songs.map(s => s.title);
    const songListText = songTitles.join(' • ');

    // Word wrap the song list
    const maxWidth = pageWidth - 120;
    const lines = doc.splitTextToSize(songListText, maxWidth);

    let textY = songListY + 30;
    lines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, textY, { align: 'center' });
      textY += 20;
    });

    // Bottom line
    doc.line(60, textY + 10, pageWidth - 60, textY + 10);

    doc.save(`${setlist.name || 'worship-night'}-infographic.pdf`);
  };

  const exportSingleFormat = (fmt: 'lyrics' | 'letters' | 'numerals') => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    const maxWidth = pageWidth - margin * 2;

    let y = margin;

    songs.forEach((song, songIndex) => {
      if (songIndex > 0 && pageBreaks) {
        doc.addPage();
        y = margin;
      }

      const displayKey = song.transposedKey || song.key;
      const shouldTranspose = song.transposedKey && song.transposedKey !== song.key;

      // Song title
      doc.setFontSize(18);
      doc.setFont('courier', 'bold');
      doc.text(song.title, margin, y);
      y += 24;

      // Key (if enabled)
      if (showKey && fmt !== 'lyrics') {
        doc.setFontSize(12);
        doc.setFont('courier', 'normal');
        doc.text(`Key: ${displayKey}`, margin, y);
        y += 20;
      }

      y += 10;

      // Sections
      doc.setFontSize(11);

      song.sections.forEach((section) => {
        // Check for page break
        if (y > pageHeight - margin - 60) {
          doc.addPage();
          y = margin;
        }

        // Section label
        doc.setFont('courier', 'bold');
        doc.text(`[${section.label}]`, margin, y);
        y += 16;
        doc.setFont('courier', 'normal');

        // Lines
        section.lines.forEach((line) => {
          if (y > pageHeight - margin - 30) {
            doc.addPage();
            y = margin;
          }

          // Chord line (if not lyrics-only)
          if (fmt !== 'lyrics' && line.chords.length > 0) {
            const chordLine = buildChordLine(
              line.chords,
              line.lyrics.length,
              (chord) => {
                let c = chord;
                if (shouldTranspose) {
                  c = transposeChordToKey(c, song.key, displayKey);
                }
                if (fmt === 'numerals') {
                  c = chordToRomanNumeral(c, displayKey);
                }
                return c;
              }
            );
            doc.setFont('courier', 'bold');
            doc.text(chordLine, margin, y);
            y += 12;
          }

          // Lyric line
          doc.setFont('courier', 'normal');
          doc.text(line.lyrics || ' ', margin, y);
          y += 14;
        });

        y += 8;
      });

      y += 20;
    });

    const formatNames = {
      lyrics: 'lyrics',
      letters: 'chords',
      numerals: 'numerals',
    };

    doc.save(`${setlist.name || 'setlist'}-${formatNames[fmt]}.pdf`);
  };

  const exportAllFormats = () => {
    exportSingleFormat('lyrics');
    setTimeout(() => exportSingleFormat('letters'), 100);
    setTimeout(() => exportSingleFormat('numerals'), 200);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Export Setlist</h2>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Format</label>
          <div className="space-y-2">
            {[
              { value: 'lyrics', label: 'Lyrics Only', desc: 'For congregation' },
              { value: 'letters', label: 'Letter Chords', desc: 'G, C, Em7' },
              { value: 'numerals', label: 'Roman Numerals', desc: 'I, IV, vi, V' },
              { value: 'all', label: 'All Three', desc: 'Downloads 3 PDFs' },
              { value: 'infographic', label: 'Worship Night Flyer', desc: 'PSUWorship branded' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  format === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-primary/20 hover:border-primary/40'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={opt.value}
                  checked={format === opt.value}
                  onChange={() => setFormat(opt.value as ExportFormat)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-sm opacity-60">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Options (not for infographic) */}
        {format !== 'infographic' && (
          <div className="mb-6 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pageBreaks}
                onChange={(e) => setPageBreaks(e.target.checked)}
              />
              <span className="text-sm">Page break between songs</span>
            </label>
            {format !== 'lyrics' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showKey}
                  onChange={(e) => setShowKey(e.target.checked)}
                />
                <span className="text-sm">Show key at top of each song</span>
              </label>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 bg-primary text-secondary py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Build a chord line string with proper spacing
function buildChordLine(
  chords: { chord: string; position: number }[],
  lyricLength: number,
  transform: (chord: string) => string
): string {
  const maxLength = Math.max(lyricLength, 80);
  const chars: string[] = new Array(maxLength).fill(' ');

  for (const { chord, position } of chords) {
    const displayChord = transform(chord);
    for (let i = 0; i < displayChord.length && position + i < maxLength; i++) {
      chars[position + i] = displayChord[i];
    }
  }

  return chars.join('').trimEnd();
}
