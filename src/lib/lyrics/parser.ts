import type { Section, ChordLine } from '../db';

// Word boundary information for chord placement
export interface WordBoundary {
  word: string;
  start: number;  // character index where word starts
  end: number;    // character index where word ends
}

/**
 * Extract word boundaries from a lyrics line.
 * Used for snapping chord positions to word starts.
 */
export function getWordBoundaries(lyrics: string): WordBoundary[] {
  const boundaries: WordBoundary[] = [];
  const regex = /\S+/g;
  let match;

  while ((match = regex.exec(lyrics)) !== null) {
    boundaries.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length - 1
    });
  }

  return boundaries;
}

/**
 * Snap a character position to the nearest word boundary start.
 * Returns the start position of the word containing or nearest to the given position.
 */
export function snapToWordBoundary(position: number, lyrics: string): number {
  const boundaries = getWordBoundaries(lyrics);

  if (boundaries.length === 0) return 0;

  // Find the word that contains the position
  for (const boundary of boundaries) {
    if (position >= boundary.start && position <= boundary.end) {
      return boundary.start;
    }
  }

  // If between words, find the nearest word start
  let closest = boundaries[0];
  let minDist = Math.abs(position - closest.start);

  for (const boundary of boundaries) {
    const dist = Math.abs(position - boundary.start);
    if (dist < minDist) {
      minDist = dist;
      closest = boundary;
    }
  }

  return closest.start;
}

/**
 * Get the word index (0-based) at a given character position.
 * Returns -1 if position is not within any word.
 */
export function getWordIndexAtPosition(position: number, lyrics: string): number {
  const boundaries = getWordBoundaries(lyrics);

  for (let i = 0; i < boundaries.length; i++) {
    if (position >= boundaries[i].start && position <= boundaries[i].end) {
      return i;
    }
  }

  return -1;
}

/**
 * Get the character position for a word by its index.
 * Returns the start position of the word.
 */
export function getPositionForWordIndex(wordIndex: number, lyrics: string): number {
  const boundaries = getWordBoundaries(lyrics);

  if (wordIndex < 0 || wordIndex >= boundaries.length) {
    return 0;
  }

  return boundaries[wordIndex].start;
}

// Section type patterns for auto-detection
const SECTION_PATTERNS: { pattern: RegExp; type: Section['type'] }[] = [
  { pattern: /^\s*\[?\s*(intro)\s*\d*\s*\]?\s*$/i, type: 'intro' },
  { pattern: /^\s*\[?\s*(verse|v)\s*\d*\s*\]?\s*$/i, type: 'verse' },
  { pattern: /^\s*\[?\s*(pre[-\s]?chorus|pre)\s*\d*\s*\]?\s*$/i, type: 'pre-chorus' },
  { pattern: /^\s*\[?\s*(chorus|c)\s*\d*\s*\]?\s*$/i, type: 'chorus' },
  { pattern: /^\s*\[?\s*(bridge|b)\s*\d*\s*\]?\s*$/i, type: 'bridge' },
  { pattern: /^\s*\[?\s*(outro|ending)\s*\d*\s*\]?\s*$/i, type: 'outro' },
  { pattern: /^\s*\[?\s*(tag)\s*\d*\s*\]?\s*$/i, type: 'tag' },
  { pattern: /^\s*\[?\s*(instrumental|inst|interlude|solo)\s*\d*\s*\]?\s*$/i, type: 'instrumental' },
];

/**
 * Check if a line is a section marker and extract the type and label.
 */
function parseSectionMarker(line: string): { type: Section['type']; label: string } | null {
  const trimmed = line.trim();

  for (const { pattern, type } of SECTION_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      // Extract the label (remove brackets if present)
      let label = trimmed.replace(/^\[/, '').replace(/\]$/, '').trim();
      // Capitalize first letter of each word
      label = label.replace(/\b\w/g, c => c.toUpperCase());
      return { type, label };
    }
  }

  return null;
}

/**
 * Parse pasted lyrics text into structured sections.
 * Auto-detects section markers like [Verse 1], [Chorus], etc.
 * Groups consecutive non-empty lines into sections.
 */
export function parseLyricsToSections(text: string): Section[] {
  const sections: Section[] = [];
  const lines = text.split('\n');

  let currentSection: Section | null = null;
  let verseCount = 1;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for section marker
    const sectionInfo = parseSectionMarker(trimmed);
    if (sectionInfo) {
      // Save current section if it has content
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection);
      }

      currentSection = {
        type: sectionInfo.type,
        label: sectionInfo.label,
        lines: []
      };

      // Track counts for auto-labeling
      if (sectionInfo.type === 'verse') verseCount++;
      continue;
    }

    // Empty line - could indicate section break
    if (!trimmed) {
      // If we have a substantial section, save it and prepare for next
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection);
        currentSection = null;
      }
      continue;
    }

    // Regular lyric line
    if (!currentSection) {
      // Create a new section (default to verse)
      currentSection = {
        type: 'verse',
        label: `Verse ${verseCount}`,
        lines: []
      };
      verseCount++;
    }

    // Add line to current section
    const chordLine: ChordLine = {
      lyrics: trimmed,
      chords: []
    };
    currentSection.lines.push(chordLine);
  }

  // Save final section
  if (currentSection && currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  // Post-process: if only one section and it's a generic verse, don't number it
  if (sections.length === 1 && sections[0].type === 'verse' && sections[0].label === 'Verse 1') {
    sections[0].label = 'Verse';
  }

  return sections;
}

/**
 * Merge a chord into a line's chord array.
 * If a chord already exists at the same position, update it.
 * If chord is empty string, remove the chord at that position.
 */
export function mergeChordAtPosition(
  existingChords: { chord: string; position: number }[],
  chord: string,
  position: number
): { chord: string; position: number }[] {
  const chords = existingChords.filter(c => c.position !== position);

  if (chord.trim()) {
    chords.push({ chord: chord.trim(), position });
    chords.sort((a, b) => a.position - b.position);
  }

  return chords;
}

/**
 * Get the chord at a specific word index in a line.
 */
export function getChordAtWordIndex(
  chords: { chord: string; position: number }[],
  wordIndex: number,
  lyrics: string
): string | null {
  const boundaries = getWordBoundaries(lyrics);

  if (wordIndex < 0 || wordIndex >= boundaries.length) {
    return null;
  }

  const wordStart = boundaries[wordIndex].start;
  const chord = chords.find(c => c.position === wordStart);

  return chord?.chord || null;
}
