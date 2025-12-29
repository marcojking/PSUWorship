import type { Section, ChordLine, ChordPosition } from '../db';

interface UGParseResult {
  title: string;
  artist: string;
  key: string;
  sections: Section[];
}

// Decode HTML entities commonly found in Ultimate Guitar content
function decodeHtmlEntities(text: string): string {
  return text
    // Apostrophes and quotes
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    // Special characters
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // Dashes
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Numeric entities (common ones)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

// Check if a line is metadata/header content that should be skipped
function isMetadataLine(line: string): boolean {
  const trimmed = line.trim();

  // Skip common metadata prefixes
  if (/^(Artist|Song|Title|Key|Capo|Tuning|Tempo|BPM|Time|Difficulty|Author|Tabbed by):/i.test(trimmed)) {
    return true;
  }

  // Skip parenthetical notes about capo/transposition
  if (/^\(no capo/i.test(trimmed) || /^transpose/i.test(trimmed)) {
    return true;
  }

  // Skip separator lines (just dashes, pipes, or whitespace)
  if (/^[-–—|_\s]+$/.test(trimmed) && trimmed.length > 0) {
    return true;
  }

  // Skip single pipe character
  if (trimmed === '|') {
    return true;
  }

  // Skip standalone performance instructions if they're only instructions
  if (/^\((x\d+|repeat|softly|loud|build|quiet|slowly|fast|freely|a tempo)\)$/i.test(trimmed)) {
    return true;
  }

  return false;
}

// Check if line is a section label
function isSectionLabel(line: string): RegExpMatchArray | null {
  // Match common section labels with optional numbers
  // Supports: [Verse 1], [Chorus], [Pre-Chorus], [Bridge 2], [Intro], [Outro], [Tag],
  // [Instrumental], [Interlude], [Hook], [Solo], [Break], [Ending], [Inst], [Refrain]
  return line.match(/^\s*\[(Intro|Verse|Chorus|Bridge|Pre-?Chorus|Outro|Instrumental|Inst|Tag|Interlude|Hook|Solo|Break|Ending|Refrain)(\s*\d*)?\]\s*$/i);
}

// Parse Ultimate Guitar content format
// UG uses [ch]G[/ch] for chords and plain text for lyrics
export function parseUGContent(
  content: string,
  title: string,
  artist: string,
  key: string
): UGParseResult {
  // Remove [tab] wrappers and decode HTML entities
  let text = content.replace(/\[tab\]/g, '').replace(/\[\/tab\]/g, '');
  text = decodeHtmlEntities(text);

  // Split into lines
  const lines = text.split('\n');

  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for section label
    const sectionMatch = isSectionLabel(line);

    if (sectionMatch) {
      // Save previous section if it has content
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection);
      }

      currentSection = {
        type: parseSectionType(sectionMatch[1]),
        label: `${sectionMatch[1]}${sectionMatch[2] || ''}`.trim(),
        lines: [],
      };
      continue;
    }

    // Skip empty lines
    if (!line.trim()) continue;

    // Skip metadata lines BEFORE creating any section
    if (isMetadataLine(line)) continue;

    // Check if line contains chord markers [ch]...[/ch]
    const hasChords = line.includes('[ch]');

    // Only create a default section when we have actual chord/lyric content
    if (!currentSection && hasChords) {
      currentSection = {
        type: 'intro',
        label: 'Intro',
        lines: [],
      };
    } else if (!currentSection && line.trim() && !isMetadataLine(line)) {
      // Non-chord content before any section - likely verse
      currentSection = {
        type: 'verse',
        label: 'Verse 1',
        lines: [],
      };
    }

    if (!currentSection) continue;

    if (hasChords) {
      // This is a chord line - extract chords and their positions
      const chordLine = parseChordLine(line);

      // Skip if no valid chords were found (e.g., line was just dashes)
      if (chordLine.chords.length === 0) continue;

      // Check if next line is a lyric line (not chords, not section, not empty, not metadata)
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const nextHasChords = nextLine.includes('[ch]');
      const nextIsSection = isSectionLabel(nextLine) !== null;
      const nextIsEmpty = !nextLine.trim();
      const nextIsMetadata = isMetadataLine(nextLine);

      if (!nextHasChords && !nextIsSection && !nextIsEmpty && !nextIsMetadata) {
        // Next line is lyrics - associate chords with it
        const lyrics = decodeHtmlEntities(nextLine.trim());
        currentSection.lines.push({
          lyrics,
          chords: chordLine.chords,
        });
        i++; // Skip the lyric line since we processed it
      } else {
        // Chord-only line (like intro/outro/instrumental)
        currentSection.lines.push({
          lyrics: '',
          chords: chordLine.chords,
        });
      }
    } else {
      // This is a lyric-only line (no chords above it)
      currentSection.lines.push({
        lyrics: decodeHtmlEntities(line.trim()),
        chords: [],
      });
    }
  }

  // Save last section if it has content
  if (currentSection && currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return {
    title,
    artist,
    key,
    sections,
  };
}

// Check if a token is a valid chord (not just a dash or number)
function isValidChord(chord: string): boolean {
  const trimmed = chord.trim();
  // Must start with a note letter
  if (!/^[A-Ga-g]/.test(trimmed)) return false;
  // Skip if it's just dashes or separators
  if (/^[-–—]+$/.test(trimmed)) return false;
  return true;
}

// Parse a chord line with [ch]...[/ch] markers
function parseChordLine(line: string): { chords: ChordPosition[]; text: string } {
  const chords: ChordPosition[] = [];
  let position = 0;
  let plainText = '';

  // Process the line character by character, tracking position
  let i = 0;
  while (i < line.length) {
    if (line.slice(i, i + 4) === '[ch]') {
      // Find the closing tag
      const endIdx = line.indexOf('[/ch]', i + 4);
      if (endIdx !== -1) {
        const chord = line.slice(i + 4, endIdx).trim();
        // Only add valid chords (not dashes or separators)
        if (isValidChord(chord)) {
          chords.push({ chord, position });
        }
        i = endIdx + 5; // Skip past [/ch]
        continue;
      }
    }

    // Regular character - add to position counter
    plainText += line[i];
    position++;
    i++;
  }

  return { chords, text: plainText };
}

// Parse section type from label
function parseSectionType(label: string): Section['type'] {
  const lower = label.toLowerCase();

  if (lower.includes('intro')) return 'intro';
  if (lower.includes('verse') || lower.includes('refrain')) return 'verse';
  if (lower.includes('chorus')) return 'chorus';
  if (lower.includes('bridge')) return 'bridge';
  if (lower.includes('pre-chorus') || lower.includes('prechorus') || lower === 'pre') return 'pre-chorus';
  if (lower.includes('outro') || lower.includes('ending')) return 'outro';
  if (lower.includes('tag')) return 'tag';

  // Instrumental sections
  if (lower.includes('instrumental') ||
      lower.includes('interlude') ||
      lower.includes('inst') ||
      lower.includes('hook') ||
      lower.includes('solo') ||
      lower.includes('break')) {
    return 'instrumental';
  }

  return 'verse';
}
