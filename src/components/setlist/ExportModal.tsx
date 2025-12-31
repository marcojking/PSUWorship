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

interface ExportOption {
  id: string;
  label: string;
  desc: string;
  hasPageBreaks?: boolean;
  hasShowKey?: boolean;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { id: 'lyrics', label: 'Lyrics Only', desc: 'For congregation', hasPageBreaks: true },
  { id: 'letters', label: 'Letter Chords', desc: 'G, C, Em7', hasPageBreaks: true, hasShowKey: true },
  { id: 'numerals', label: 'Roman Numerals', desc: 'I, IV, vi, V', hasPageBreaks: true, hasShowKey: true },
  { id: 'infographic', label: 'Worship Night Flyer', desc: 'PSUWorship branded' },
];

interface FormatSettings {
  pageBreaks: boolean;
  showKey: boolean;
}

export default function ExportModal({ setlist, songs, onClose }: ExportModalProps) {
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(['letters']));
  const [formatSettings, setFormatSettings] = useState<Record<string, FormatSettings>>({
    lyrics: { pageBreaks: true, showKey: true },
    letters: { pageBreaks: true, showKey: true },
    numerals: { pageBreaks: true, showKey: true },
  });
  const [exporting, setExporting] = useState(false);

  const toggleFormat = (id: string) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateSetting = (formatId: string, setting: keyof FormatSettings, value: boolean) => {
    setFormatSettings(prev => ({
      ...prev,
      [formatId]: { ...prev[formatId], [setting]: value },
    }));
  };

  const handleExport = async () => {
    if (selectedFormats.size === 0) return;

    setExporting(true);

    try {
      const formats = Array.from(selectedFormats);
      for (let i = 0; i < formats.length; i++) {
        const fmt = formats[i];
        if (fmt === 'infographic') {
          await exportInfographic();
        } else {
          const settings = formatSettings[fmt];
          exportSingleFormat(fmt as 'lyrics' | 'letters' | 'numerals', settings);
        }
        // Small delay between exports
        if (i < formats.length - 1) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportInfographic = async () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background color (cream) - #FFF1DC
    doc.setFillColor(255, 241, 220);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Render PSUWorship title using canvas for proper thin/bold fonts
    await renderTitleToDoc(doc, pageWidth);

    // Dark banner - taller to match reference
    const bannerY = 230;
    const bannerHeight = 175;
    doc.setFillColor(27, 53, 78);
    doc.rect(55, bannerY, pageWidth - 110, bannerHeight, 'F');

    // Event name in banner - smaller, elegant
    doc.setTextColor(255, 241, 220);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(setlist.name || 'Worship Night!', pageWidth / 2, bannerY + (bannerHeight / 2) + 6, { align: 'center' });

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

    // Calculate positions to center date/location between banner and song list
    const bannerBottom = bannerY + bannerHeight;
    const songListY = 600; // Fixed position for song list section
    const availableSpace = songListY - bannerBottom;

    // Content height: date line + separator + location (if exists)
    const hasLocation = !!setlist.location;
    const contentHeight = hasLocation ? 44 : 0; // 44pt span if location exists

    // Center the content block in the available space
    let infoY = bannerBottom + (availableSpace - contentHeight) / 2;

    // Date, time, location - centered in middle section
    doc.setTextColor(27, 53, 78);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');

    doc.text(dateTimeStr, pageWidth / 2, infoY, { align: 'center' });

    if (setlist.location) {
      infoY += 22;
      doc.text('-', pageWidth / 2, infoY, { align: 'center' });
      infoY += 22;
      doc.text(setlist.location, pageWidth / 2, infoY, { align: 'center' });
    }

    // Song list section
    doc.setDrawColor(27, 53, 78);
    doc.setLineWidth(1);
    doc.line(80, songListY, pageWidth - 80, songListY);

    // Song list - normal weight, not bold
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');

    const songTitles = songs.map(s => s.title);
    const songListText = songTitles.join(' • ');

    // Word wrap the song list
    const maxWidth = pageWidth - 160;
    const lines = doc.splitTextToSize(songListText, maxWidth);

    let textY = songListY + 28;
    lines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, textY, { align: 'center' });
      textY += 20;
    });

    // Bottom line
    doc.line(80, textY + 12, pageWidth - 80, textY + 12);

    doc.save(`${setlist.name || 'worship-night'}-infographic.pdf`);
  };

  const exportSingleFormat = (fmt: 'lyrics' | 'letters' | 'numerals', settings: FormatSettings) => {
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
      if (songIndex > 0 && settings.pageBreaks) {
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
      if (settings.showKey && fmt !== 'lyrics') {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Export Setlist</h2>

        {/* Format Selection - Checkboxes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select formats to export</label>
          <div className="space-y-2">
            {EXPORT_OPTIONS.map((opt) => {
              const isSelected = selectedFormats.has(opt.id);
              const settings = formatSettings[opt.id];

              return (
                <div
                  key={opt.id}
                  className={`rounded-lg border transition-colors ${isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-primary/20 hover:border-primary/40'
                    }`}
                >
                  <label className="flex items-center p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFormat(opt.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-sm opacity-60">{opt.desc}</div>
                    </div>
                  </label>

                  {/* Inline settings when selected */}
                  {isSelected && (opt.hasPageBreaks || opt.hasShowKey) && (
                    <div className="px-3 pb-3 pt-1 ml-6 space-y-2 border-t border-primary/10">
                      {opt.hasPageBreaks && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={settings?.pageBreaks ?? true}
                            onChange={(e) => updateSetting(opt.id, 'pageBreaks', e.target.checked)}
                          />
                          Page break between songs
                        </label>
                      )}
                      {opt.hasShowKey && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={settings?.showKey ?? true}
                            onChange={(e) => updateSetting(opt.id, 'showKey', e.target.checked)}
                          />
                          Show key at top of each song
                        </label>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
            disabled={exporting || selectedFormats.size === 0}
            className="flex-1 bg-primary text-secondary py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : `Download${selectedFormats.size > 1 ? ` (${selectedFormats.size})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Render PSUWorship title using canvas for custom font support
async function renderTitleToDoc(doc: jsPDF, pageWidth: number): Promise<void> {
  // Load Lato Light (300) for thin PSU and Lato Bold for Worship
  const fontLight = new FontFace(
    'LatoLight',
    'url(https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh7USSwiPGQ3q5d0.woff2)'
  );
  const fontBold = new FontFace(
    'LatoBold',
    'url(https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2)'
  );

  let useLightFont = false;
  let useBoldFont = false;

  try {
    await fontLight.load();
    document.fonts.add(fontLight);
    useLightFont = true;
  } catch (e) {
    console.warn('Could not load light font');
  }

  try {
    await fontBold.load();
    document.fonts.add(fontBold);
    useBoldFont = true;
  } catch (e) {
    console.warn('Could not load bold font');
  }

  await document.fonts.ready;

  // Create high-res canvas for crisp text
  const scale = 4;
  const canvas = document.createElement('canvas');
  const width = 900;
  const height = 160;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Clear with transparent background
  ctx.clearRect(0, 0, width, height);

  const fontSize = 130;
  ctx.fillStyle = '#1b354e';

  // Set fonts - use loaded fonts or fallback
  const lightFontFamily = useLightFont ? 'LatoLight' : 'Helvetica';
  const boldFontFamily = useBoldFont ? 'LatoBold' : 'Helvetica';

  // Measure PSU with light font
  ctx.font = `${fontSize}px ${lightFontFamily}, sans-serif`;
  const psuWidth = ctx.measureText('PSU').width;

  // Measure Worship with bold font
  ctx.font = `${fontSize}px ${boldFontFamily}, sans-serif`;
  const worshipWidth = ctx.measureText('Worship').width;

  // Calculate total width and starting position
  const totalWidth = psuWidth + worshipWidth;
  const startX = (width - totalWidth) / 2;

  // Draw PSU with light font
  ctx.font = `${fontSize}px ${lightFontFamily}, sans-serif`;
  ctx.fillText('PSU', startX, 120);

  // Draw Worship with bold font
  ctx.font = `${fontSize}px ${boldFontFamily}, sans-serif`;
  ctx.fillText('Worship', startX + psuWidth, 120);

  // Add canvas as image to PDF
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 500;
  const imgHeight = imgWidth * (height / width);
  const imgX = (pageWidth - imgWidth) / 2;
  doc.addImage(imgData, 'PNG', imgX, 70, imgWidth, imgHeight);
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
