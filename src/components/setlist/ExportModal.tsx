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
  hasPamphlet?: boolean;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { id: 'lyrics', label: 'Lyrics Only', desc: 'For congregation', hasPageBreaks: true, hasPamphlet: true },
  { id: 'letters', label: 'Letter Chords', desc: 'G, C, Em7', hasPageBreaks: true, hasShowKey: true },
  { id: 'numerals', label: 'Roman Numerals', desc: 'I, IV, vi, V', hasPageBreaks: true, hasShowKey: true },
  { id: 'infographic', label: 'Worship Night Flyer', desc: 'PSUWorship branded' },
];

interface FormatSettings {
  pageBreaks: boolean;
  showKey: boolean;
  pamphletMode: boolean;
}

export default function ExportModal({ setlist, songs, onClose }: ExportModalProps) {
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(['letters']));
  const [formatSettings, setFormatSettings] = useState<Record<string, FormatSettings>>({
    lyrics: { pageBreaks: true, showKey: true, pamphletMode: false },
    letters: { pageBreaks: true, showKey: true, pamphletMode: false },
    numerals: { pageBreaks: true, showKey: true, pamphletMode: false },
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
          if (fmt === 'lyrics' && settings.pamphletMode) {
            await exportPamphlet();
          } else {
            exportSingleFormat(fmt as 'lyrics' | 'letters' | 'numerals', settings);
          }
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

    // Background color (cream) - #fff7eb
    doc.setFillColor(255, 247, 235);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Render PSUWorship title using canvas for proper thin/bold fonts
    await renderTitleToDoc(doc, pageWidth);

    // Dark banner - taller to match reference
    const bannerY = 230;
    const bannerHeight = 175;
    doc.setFillColor(27, 53, 78);
    doc.rect(55, bannerY, pageWidth - 110, bannerHeight, 'F');

    // Event name in banner - smaller, elegant
    doc.setTextColor(255, 247, 235);
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

  // Export pamphlet (booklet format with cover and bible verse)
  const exportPamphlet = async () => {
    // Font settings for readability
    const TITLE_FONT_SIZE = 13;
    const LYRICS_FONT_SIZE = 11;
    const LINE_HEIGHT = 14;
    const SECTION_GAP = 8;
    const TITLE_HEIGHT = 20;

    // Create a temporary PDF to calculate text heights
    const tempDoc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'letter',
    });
    const pageHeight = tempDoc.internal.pageSize.getHeight();
    const columnWidth = tempDoc.internal.pageSize.getWidth() / 2;
    const margin = 30;
    const contentWidth = columnWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2 - 10;

    // Pre-calculate content chunks for each song
    // A chunk represents content that fits on one panel
    type ContentChunk = {
      type: 'cover' | 'lyrics' | 'back' | 'blank';
      songIndex?: number;
      startSection?: number;
      startLine?: number;
      isFirstChunk?: boolean;
    };

    const contentPages: ContentChunk[] = [];

    // Front cover (panel 1)
    contentPages.push({ type: 'cover' });

    // Calculate how much space each song needs and split into chunks
    songs.forEach((song, songIdx) => {
      tempDoc.setFontSize(LYRICS_FONT_SIZE);

      let currentChunkHeight = TITLE_HEIGHT; // Start with title height
      let chunkStartSection = 0;
      let chunkStartLine = 0;
      let isFirstChunk = true;

      song.sections.forEach((section, sectionIdx) => {
        const sectionLabelHeight = LINE_HEIGHT + 4; // Section label + small gap
        let sectionContentHeight = sectionLabelHeight;

        section.lines.forEach((line, lineIdx) => {
          const wrappedLines = tempDoc.splitTextToSize(line.lyrics || ' ', contentWidth);
          const lineHeight = wrappedLines.length * LINE_HEIGHT;

          // Check if adding this line would overflow the panel
          if (currentChunkHeight + sectionContentHeight + lineHeight > availableHeight) {
            // Save current chunk and start a new one
            contentPages.push({
              type: 'lyrics',
              songIndex: songIdx,
              startSection: chunkStartSection,
              startLine: chunkStartLine,
              isFirstChunk,
            });

            // Start new chunk from current position
            isFirstChunk = false;
            chunkStartSection = sectionIdx;
            chunkStartLine = lineIdx;
            currentChunkHeight = LINE_HEIGHT; // Just continuation indicator height
            sectionContentHeight = sectionLabelHeight;
          }

          sectionContentHeight += lineHeight;
        });

        currentChunkHeight += sectionContentHeight + SECTION_GAP;
      });

      // Add final chunk for this song
      contentPages.push({
        type: 'lyrics',
        songIndex: songIdx,
        startSection: chunkStartSection,
        startLine: chunkStartLine,
        isFirstChunk,
      });
    });

    // Calculate how many panels we need (must be multiple of 4)
    // We need: 1 cover + N songs + padding + 1 back
    const contentWithoutBack = contentPages.length;
    const totalNeeded = Math.ceil((contentWithoutBack + 1) / 4) * 4;  // +1 for back cover

    // Add blank padding panels (leaving last spot for back cover)
    while (contentPages.length < totalNeeded - 1) {
      contentPages.push({ type: 'blank' });
    }

    // Back cover with bible verse (LAST panel - so it's physical back when folded)
    contentPages.push({ type: 'back' });

    const totalPanels = contentPages.length;
    const totalSheets = totalPanels / 4; // Each sheet has 4 panels (2 per side)

    // Create booklet imposition order
    // For a booklet, sheets are arranged so when stacked and folded, pages are in order
    const impositionOrder: number[] = [];
    for (let sheet = 0; sheet < totalSheets; sheet++) {
      // Front of sheet: [lastPage, firstPage]
      // Back of sheet: [firstPage+1, lastPage-1]
      const frontLeft = totalPanels - 1 - (sheet * 2);
      const frontRight = sheet * 2;
      const backLeft = sheet * 2 + 1;
      const backRight = totalPanels - 2 - (sheet * 2);

      impositionOrder.push(frontLeft, frontRight, backLeft, backRight);
    }

    // Create PDF in landscape (reuse dimensions from tempDoc)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Render each physical page (2 columns per page)
    for (let i = 0; i < impositionOrder.length; i += 2) {
      if (i > 0) doc.addPage();

      const leftPanelIdx = impositionOrder[i];
      const rightPanelIdx = impositionOrder[i + 1];

      // Render left column
      await renderPanel(doc, contentPages[leftPanelIdx], 0, margin, contentWidth, pageHeight, margin);

      // Render right column
      await renderPanel(doc, contentPages[rightPanelIdx], columnWidth, margin, contentWidth, pageHeight, margin);
    }

    doc.save(`${setlist.name || 'setlist'}-pamphlet.pdf`);

    // Helper function to render a single panel
    async function renderPanel(
      doc: jsPDF,
      panel: ContentChunk,
      xOffset: number,
      yMargin: number,
      width: number,
      height: number,
      xMargin: number
    ) {
      const x = xOffset + xMargin;

      if (panel.type === 'blank') {
        // Empty panel
        return;
      }

      if (panel.type === 'cover') {
        // Render cover - EXACT same design as flyer but adapted for half-page
        // White background to save ink
        doc.setFillColor(255, 255, 255);
        doc.rect(xOffset, 0, width + xMargin * 2, height, 'F');

        const panelWidth = width + xMargin * 2;
        const centerX = xOffset + panelWidth / 2;

        // Flyer is 612x792, pamphlet panel is ~396x612
        // Width scale for fonts/horizontal sizing: 396/612 ≈ 0.65
        // Height scale for vertical positioning: 612/792 ≈ 0.77
        const wScale = panelWidth / 612;
        const hScale = height / 792;

        // Render PSUWorship title using canvas (scaled by width)
        await renderTitleToPamphlet(doc, xOffset, panelWidth, wScale);

        // Dark banner - position scaled by height, width margins by wScale
        const bannerY = 185 * hScale;  // Y position scaled by height ratio
        const bannerHeight = 140 * hScale;  // Height scaled by height ratio
        doc.setFillColor(0, 48, 73); // #003049
        doc.rect(xOffset + 30 * wScale, bannerY, panelWidth - 60 * wScale, bannerHeight, 'F');

        // Event name in banner
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18 * wScale);  // Font scaled by width
        doc.setFont('helvetica', 'bold');
        doc.text(setlist.name || 'Worship Night!', centerX, bannerY + (bannerHeight / 2) + 6 * hScale, { align: 'center' });

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

        // Calculate positions like the flyer does
        const bannerBottom = bannerY + bannerHeight;
        const songListY = 490 * hScale;  // Scaled from flyer's 600
        const availableSpace = songListY - bannerBottom;

        const hasLocation = !!setlist.location;
        const locContentHeight = hasLocation ? 44 * hScale : 0;

        let infoY = bannerBottom + (availableSpace - locContentHeight) / 2;

        doc.setTextColor(0, 48, 73);
        doc.setFontSize(14 * wScale);
        doc.setFont('helvetica', 'normal');

        doc.text(dateTimeStr, centerX, infoY, { align: 'center' });

        if (setlist.location) {
          infoY += 18 * hScale;
          doc.text('-', centerX, infoY, { align: 'center' });
          infoY += 18 * hScale;
          doc.text(setlist.location, centerX, infoY, { align: 'center' });
        }

        // Song list section
        doc.setDrawColor(0, 48, 73);
        doc.setLineWidth(0.8);
        doc.line(xOffset + 50 * wScale, songListY, xOffset + panelWidth - 50 * wScale, songListY);

        // Song list
        doc.setFontSize(11 * wScale);
        doc.setFont('helvetica', 'normal');

        const songTitles = songs.map(s => s.title);
        const songListText = songTitles.join(' • ');

        const maxTextWidth = panelWidth - 100 * wScale;
        const songLines = doc.splitTextToSize(songListText, maxTextWidth);

        let songTextY = songListY + 22 * hScale;
        songLines.forEach((line: string) => {
          doc.text(line, centerX, songTextY, { align: 'center' });
          songTextY += 16 * hScale;
        });

        // Bottom line
        doc.line(xOffset + 50 * wScale, songTextY + 10 * hScale, xOffset + panelWidth - 50 * wScale, songTextY + 10 * hScale);

        return;
      }

      if (panel.type === 'back') {
        // Render back cover with bible verse
        doc.setFillColor(255, 255, 255);  // White to save ink
        doc.rect(xOffset, 0, width + xMargin * 2, height, 'F');

        const panelWidth = width + xMargin * 2;
        const centerX = xOffset + panelWidth / 2;

        let verseBottomY = height / 2;  // Default center if no verse

        if (setlist.bibleVerse) {
          // Parse verse - format: "Reference - Text" or just text
          const verseText = setlist.bibleVerse;
          const parts = verseText.split(' - ');
          const reference = parts.length > 1 ? parts[0] : '';
          const text = parts.length > 1 ? parts.slice(1).join(' - ') : verseText;

          doc.setTextColor(0, 48, 73);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'italic');

          // Word wrap the verse text
          const wrappedLines = doc.splitTextToSize(`"${text}"`, width - 20);
          // Start verse in the middle of the page with whitespace above
          let verseY = height / 2 - (wrappedLines.length * 14) / 2;  // Center vertically in page

          wrappedLines.forEach((line: string) => {
            doc.text(line, centerX, verseY, { align: 'center' });
            verseY += 14;
          });

          // Reference below
          if (reference) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`— ${reference}`, centerX, verseY + 20, { align: 'center' });
            verseBottomY = verseY + 40;
          } else {
            verseBottomY = verseY + 20;
          }
        }

        // Load and draw flower logo centered below verse (or centered if no verse)
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';

          await new Promise<void>((resolve, reject) => {
            logoImg.onload = () => resolve();
            logoImg.onerror = () => reject(new Error('Failed to load logo'));
            logoImg.src = '/logos/psuworship-flower.png';
          });

          // Get natural aspect ratio of logo
          const naturalWidth = logoImg.naturalWidth;
          const naturalHeight = logoImg.naturalHeight;
          const aspectRatio = naturalWidth / naturalHeight;

          // Draw logo smaller (max 40pt height) and preserve aspect ratio
          const logoAvailableHeight = height - verseBottomY - 40;
          const logoHeight = Math.min(40, logoAvailableHeight * 0.4);  // Max 40pt height
          const logoWidth = logoHeight * aspectRatio;  // Preserve aspect ratio
          const logoY = verseBottomY + (logoAvailableHeight - logoHeight) / 2;
          const logoX = centerX - logoWidth / 2;

          doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch (e) {
          // If logo fails to load, just show text footer
          console.warn('Could not load logo:', e);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(0, 48, 73);
          doc.text('PSUWorship', centerX, height - 30, { align: 'center' });
        }

        return;
      }

      if (panel.type === 'lyrics' && panel.songIndex !== undefined) {
        // Render song lyrics with chunked content support
        const song = songs[panel.songIndex];
        const startSection = panel.startSection ?? 0;
        const startLine = panel.startLine ?? 0;
        const isFirstChunk = panel.isFirstChunk ?? true;

        let y = yMargin + 10;

        // Song title (show on first chunk, or as continuation indicator)
        doc.setTextColor(0, 48, 73);
        doc.setFontSize(TITLE_FONT_SIZE);
        doc.setFont('courier', 'bold');

        if (isFirstChunk) {
          doc.text(song.title, x, y);
        } else {
          doc.text(`${song.title} (cont.)`, x, y);
        }
        y += TITLE_HEIGHT;

        // Set font for lyrics content
        doc.setFontSize(LYRICS_FONT_SIZE);

        // Render sections starting from the specified position
        song.sections.forEach((section, sectionIdx) => {
          // Skip sections before our start position
          if (sectionIdx < startSection) return;

          // Check if we're running out of space
          if (y > height - yMargin - 20) return;

          // Section label
          doc.setFont('courier', 'bold');
          doc.text(`[${section.label}]`, x, y);
          y += LINE_HEIGHT;
          doc.setFont('courier', 'normal');

          // Lines
          section.lines.forEach((line, lineIdx) => {
            // Skip lines before our start position (only for the first section of this chunk)
            if (sectionIdx === startSection && lineIdx < startLine) return;

            if (y > height - yMargin - LINE_HEIGHT) return;

            // Only lyrics (no chords in pamphlet)
            const wrappedLines = doc.splitTextToSize(line.lyrics || ' ', width);
            wrappedLines.forEach((wl: string) => {
              if (y > height - yMargin - LINE_HEIGHT) return;
              doc.text(wl, x, y);
              y += LINE_HEIGHT;
            });
          });

          y += SECTION_GAP;
        });

        return;
      }
    }
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
                  {isSelected && (opt.hasPageBreaks || opt.hasShowKey || opt.hasPamphlet) && (
                    <div className="px-3 pb-3 pt-1 ml-6 space-y-2 border-t border-primary/10">
                      {opt.hasPamphlet && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={settings?.pamphletMode ?? false}
                            onChange={(e) => updateSetting(opt.id, 'pamphletMode', e.target.checked)}
                          />
                          Foldable pamphlet (booklet format)
                        </label>
                      )}
                      {opt.hasPageBreaks && !settings?.pamphletMode && (
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
  ctx.fillStyle = '#003049';

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

// Render PSUWorship title for pamphlet (scaled version)
async function renderTitleToPamphlet(doc: jsPDF, xOffset: number, panelWidth: number, scale: number): Promise<void> {
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
  const canvasScale = 4;
  const canvas = document.createElement('canvas');
  const width = 900;
  const height = 160;
  canvas.width = width * canvasScale;
  canvas.height = height * canvasScale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(canvasScale, canvasScale);

  // Clear with transparent background
  ctx.clearRect(0, 0, width, height);

  const fontSize = 130;
  ctx.fillStyle = '#003049';

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

  // Add canvas as image to PDF (scaled for pamphlet)
  const imgData = canvas.toDataURL('image/png');
  // Title on flyer is 500pt wide at y=70 on 612×792
  // For pamphlet, scale to fit the narrower width but keep it prominent
  const imgWidth = Math.min(panelWidth * 0.85, 420 * scale);
  const imgHeight = imgWidth * (height / width);
  const imgX = xOffset + (panelWidth - imgWidth) / 2;
  // Position title at roughly same relative Y (70/792 ≈ 0.088 of page height)
  const imgY = 55;  // Fixed position near top
  doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);
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
