import type { Section, ChordLine, ChordPosition, Song } from '../db';
import { isChord } from '../chords/transposition';

// Dynamic import for PDF.js (browser only)
async function getPdfjs() {
  const pdfjsLib = await import('pdfjs-dist');
  // Use local worker file from public folder
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjsLib;
}

interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
}

interface ParsedPdfResult {
  title: string;
  artist: string;
  key: string;
  sections: Section[];
}

// Extract text items with positions from PDF
async function extractTextItems(file: File): Promise<TextItem[][]> {
  const pdfjsLib = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: TextItem[][] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    const items: TextItem[] = textContent.items
      .filter((item) => 'str' in item && (item as { str: string }).str.trim().length > 0)
      .map((item) => {
        const textItem = item as { str: string; transform: number[]; width: number; height: number; fontName?: string };
        return {
          str: textItem.str,
          x: textItem.transform[4],
          y: textItem.transform[5],
          width: textItem.width,
          height: textItem.height,
          fontName: textItem.fontName || '',
        };
      });

    pages.push(items);
  }

  return pages;
}

// Group items by Y coordinate (same line)
function groupByLine(items: TextItem[], tolerance: number = 5): TextItem[][] {
  if (items.length === 0) return [];

  // Sort by Y descending (PDF coordinates: 0,0 is bottom-left)
  const sorted = [...items].sort((a, b) => b.y - a.y);

  const lines: TextItem[][] = [];
  let currentLine: TextItem[] = [sorted[0]];
  let currentY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.y - currentY) <= tolerance) {
      currentLine.push(item);
    } else {
      // Sort current line by X before adding
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine);
      currentLine = [item];
      currentY = item.y;
    }
  }

  // Don't forget the last line
  currentLine.sort((a, b) => a.x - b.x);
  lines.push(currentLine);

  return lines;
}

// Build a text string from line items, preserving spacing for chord alignment
function lineToString(items: TextItem[], preserveSpacing: boolean = false): string {
  if (items.length === 0) return '';

  // Sort by X position
  const sorted = [...items].sort((a, b) => a.x - b.x);

  let result = '';
  let lastX = sorted[0].x;
  const baseX = sorted[0].x;

  for (const item of sorted) {
    // Add spaces for gaps
    const gap = item.x - lastX;
    if (gap > 8 && result.length > 0) {
      // Estimate number of spaces based on gap (adjust divisor for font size)
      const spaces = preserveSpacing ? Math.max(1, Math.round(gap / 7)) : 1;
      result += ' '.repeat(spaces);
    }
    result += item.str;
    lastX = item.x + item.width;
  }

  return result;
}

// Check if a line looks like a section label
function isSectionLabel(text: string): boolean {
  return /^\[(Intro|Verse|Chorus|Bridge|Pre-?Chorus|Outro|Instrumental|Tag|Interlude)(\s*\d*)?\]$/i.test(text.trim());
}

// Parse section type from label
function parseSectionType(label: string): Section['type'] {
  const lower = label.toLowerCase();
  if (lower.includes('intro')) return 'intro';
  if (lower.includes('verse')) return 'verse';
  if (lower.includes('chorus')) return 'chorus';
  if (lower.includes('bridge')) return 'bridge';
  if (lower.includes('pre-chorus') || lower.includes('prechorus')) return 'pre-chorus';
  if (lower.includes('outro')) return 'outro';
  if (lower.includes('instrumental') || lower.includes('interlude')) return 'instrumental';
  if (lower.includes('tag')) return 'tag';
  return 'verse'; // default
}

// Check if line is all chords
function isChordLine(text: string): boolean {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const chordCount = tokens.filter(t => isChord(t)).length;
  return chordCount > 0 && chordCount / tokens.length >= 0.5;
}

// Extract chord positions from a chord line relative to a lyric line
function extractChordPositions(chordLine: TextItem[], lyricLine: TextItem[]): ChordPosition[] {
  const chords: ChordPosition[] = [];

  // Build a character position map for the lyric line
  let lyricText = '';
  const charPositions: number[] = []; // x position of each character

  for (const item of lyricLine.sort((a, b) => a.x - b.x)) {
    for (let i = 0; i < item.str.length; i++) {
      const charX = item.x + (item.width / item.str.length) * i;
      charPositions.push(charX);
      lyricText += item.str[i];
    }
    // Add space between items
    if (item !== lyricLine[lyricLine.length - 1]) {
      charPositions.push(item.x + item.width);
      lyricText += ' ';
    }
  }

  // For each chord, find its position relative to the lyrics
  for (const chordItem of chordLine) {
    const chord = chordItem.str.trim();
    if (!isChord(chord)) continue;

    // Find the character position closest to this chord's X position
    let bestPos = 0;
    let bestDist = Infinity;

    for (let i = 0; i < charPositions.length; i++) {
      const dist = Math.abs(charPositions[i] - chordItem.x);
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = i;
      }
    }

    chords.push({ chord, position: bestPos });
  }

  // Sort by position
  return chords.sort((a, b) => a.position - b.position);
}

// Simple extraction for chord-only lines (no lyrics below)
function extractChordsSimple(text: string): ChordPosition[] {
  const tokens = text.trim().split(/\s+/);
  const chords: ChordPosition[] = [];
  let position = 0;

  for (const token of tokens) {
    if (isChord(token)) {
      chords.push({ chord: token, position });
    }
    position += token.length + 1; // +1 for space
  }

  return chords;
}

// Check if line is part of chord diagram section (to skip)
function isChordDiagramLine(text: string): boolean {
  // Chord diagram lines often contain fret numbers like "132", "1 2", etc.
  // or are just chord names followed by diagram markers
  const trimmed = text.trim();
  // Skip lines that are just numbers (fret positions)
  if (/^[\d\s]+$/.test(trimmed) && trimmed.length < 20) return true;
  // Skip "CHORDS" header
  if (trimmed === 'CHORDS') return true;
  // Skip lines with "fr" (fret indicator)
  if (/\d+fr/.test(trimmed)) return true;
  return false;
}

// Check if this looks like a metadata line to skip
function isMetadataLine(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith('difficulty:') ||
         trimmed.startsWith('tuning:') ||
         trimmed.startsWith('capo:') ||
         trimmed === 'chords' ||
         /^page \d+\/\d+$/i.test(trimmed);
}

// Main parse function
export async function parsePdf(file: File): Promise<ParsedPdfResult> {
  const pages = await extractTextItems(file);

  // Debug: log raw text items
  console.log('PDF Pages:', pages.length, 'Raw items on page 1:', pages[0]?.length);
  if (pages[0] && pages[0].length > 0) {
    console.log('First 10 text items:', pages[0].slice(0, 10).map(i => ({ str: i.str, x: Math.round(i.x), y: Math.round(i.y) })));
  }

  // Process each page separately to maintain structure
  const allLines: { items: TextItem[]; text: string; pageNum: number }[] = [];

  for (let pageNum = 0; pageNum < pages.length; pageNum++) {
    const pageLines = groupByLine(pages[pageNum]);
    for (const lineItems of pageLines) {
      const text = lineToString(lineItems);
      if (text.trim()) {
        allLines.push({ items: lineItems, text: text.trim(), pageNum });
      }
    }
  }

  // Debug: log grouped lines
  console.log('Grouped lines (first 20):', allLines.slice(0, 20).map((l, i) => `${i}: ${l.text.substring(0, 80)}`));

  // Extract metadata from first page header
  let title = '';
  let artist = '';
  let key = 'C';
  let headerEndIdx = 0;

  // Look for title/artist in first few lines
  const firstPageLines = allLines.filter(l => l.pageNum === 0).slice(0, 20);

  for (let i = 0; i < firstPageLines.length; i++) {
    const text = firstPageLines[i].text;

    // Skip metadata lines
    if (isMetadataLine(text)) continue;

    // Look for "Chords by" pattern (Ultimate Guitar format)
    // Title might be split: "Highest Praise We Get Low Chords by MBL"
    // with "Worship & Brennan Joseph" on next conceptual line
    const chordsbyMatch = text.match(/^(.+?)\s*Chords\s+by\s+(.+)$/i);
    if (chordsbyMatch && !title) {
      title = chordsbyMatch[1].trim();
      artist = chordsbyMatch[2].trim();

      // Check if artist continues on next line (e.g., "MBL" then "Worship & Brennan Joseph")
      if (i + 1 < firstPageLines.length) {
        const nextLine = firstPageLines[i + 1].text;
        // If next line doesn't look like metadata or section, append to artist
        if (!isMetadataLine(nextLine) && !isSectionLabel(nextLine) &&
            !nextLine.match(/^(Difficulty|Tuning|Key|CHORDS)/i) &&
            nextLine.length < 50 && !isChordLine(nextLine)) {
          artist = artist + ' ' + nextLine.trim();
          headerEndIdx = i + 2;
        } else {
          headerEndIdx = i + 1;
        }
      } else {
        headerEndIdx = i + 1;
      }
      continue;
    }

    // Look for just "by" pattern
    const byMatch = text.match(/^(.+?)\s+by\s+(.+)$/i);
    if (byMatch && !title && text.length > 5) {
      title = byMatch[1].replace(/\s*Chords?\s*$/i, '').trim();
      artist = byMatch[2].trim();

      // Check if artist continues on next line
      if (i + 1 < firstPageLines.length) {
        const nextLine = firstPageLines[i + 1].text;
        if (!isMetadataLine(nextLine) && !isSectionLabel(nextLine) &&
            !nextLine.match(/^(Difficulty|Tuning|Key|CHORDS)/i) &&
            nextLine.length < 50 && !isChordLine(nextLine)) {
          artist = artist + ' ' + nextLine.trim();
          headerEndIdx = i + 2;
        } else {
          headerEndIdx = i + 1;
        }
      } else {
        headerEndIdx = i + 1;
      }
      continue;
    }

    // Look for key line - handle various formats
    const keyMatch = text.match(/^Key[:\s]+([A-G][#b]?m?)(\s|$)/i);
    if (keyMatch) {
      key = keyMatch[1];
      headerEndIdx = Math.max(headerEndIdx, i + 1);
      continue;
    }

    // If we find a section label, we're past the header
    if (isSectionLabel(text)) {
      break;
    }
  }

  // Find where actual song content starts (first section label)
  let contentStartIdx = 0;
  for (let i = 0; i < allLines.length; i++) {
    const text = allLines[i].text;
    if (isSectionLabel(text)) {
      contentStartIdx = i;
      break;
    }
    // Also check for chord-only lines that might indicate song start
    if (i > headerEndIdx && isChordLine(text) && !isChordDiagramLine(text)) {
      contentStartIdx = i;
      break;
    }
  }

  // Parse sections
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let pendingChordLine: { items: TextItem[]; text: string } | null = null;

  for (let i = contentStartIdx; i < allLines.length; i++) {
    const { items: lineItems, text } = allLines[i];

    // Skip chord diagram lines and metadata
    if (isChordDiagramLine(text) || isMetadataLine(text)) continue;

    // Section label
    if (isSectionLabel(text)) {
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        type: parseSectionType(text),
        label: text.replace(/[\[\]]/g, ''),
        lines: [],
      };
      pendingChordLine = null;
      continue;
    }

    // Initialize default section if needed (content before first label)
    if (!currentSection) {
      currentSection = {
        type: 'verse',
        label: 'Verse 1',
        lines: [],
      };
    }

    // Check if this is a chord line
    if (isChordLine(text)) {
      // If we have a pending chord line with no lyrics, add it as chord-only
      if (pendingChordLine) {
        const chordsOnly = extractChordsSimple(pendingChordLine.text);
        if (chordsOnly.length > 0) {
          currentSection.lines.push({ lyrics: '', chords: chordsOnly });
        }
      }
      pendingChordLine = { items: lineItems, text };
      continue;
    }

    // This is a lyric line (or transition text like "And we bring...")
    const lyrics = text;

    // If we have a pending chord line, associate it with these lyrics
    if (pendingChordLine) {
      const chords = extractChordPositions(pendingChordLine.items, lineItems);
      currentSection.lines.push({ lyrics, chords });
      pendingChordLine = null;
    } else {
      // Lyric line without chords above
      currentSection.lines.push({ lyrics, chords: [] });
    }
  }

  // Handle any remaining pending chord line
  if (pendingChordLine && currentSection) {
    const chordsOnly = extractChordsSimple(pendingChordLine.text);
    if (chordsOnly.length > 0) {
      currentSection.lines.push({ lyrics: '', chords: chordsOnly });
    }
  }

  // Don't forget the last section
  if (currentSection && currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return {
    title: title || 'Untitled',
    artist: artist || 'Unknown Artist',
    key,
    sections,
  };
}

// Convert parsed result to Song object
export function parsedResultToSong(result: ParsedPdfResult): Omit<Song, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: result.title,
    artist: result.artist,
    key: result.key,
    sections: result.sections,
  };
}
