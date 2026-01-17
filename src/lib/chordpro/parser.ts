/**
 * ChordPro Parser
 *
 * Parses ChordPro format files into our Section[] structure.
 * ChordPro format uses:
 * - {title: Song Title} or {t: Song Title} for metadata
 * - {artist: Artist Name} or {a: Artist Name}
 * - {key: G}
 * - [G]Amazing [C]grace - inline chords in brackets
 * - {start_of_verse} or {sov} / {end_of_verse} or {eov} for sections
 * - {comment: text} or {c: text} for comments/section labels
 */

import type { Section, ChordLine } from '../db';

export interface ChordProMetadata {
  title: string;
  artist: string;
  key: string;
}

export interface ChordProParseResult {
  metadata: ChordProMetadata;
  sections: Section[];
}

// Map directive names to section types
const SECTION_DIRECTIVES: Record<string, Section['type']> = {
  'start_of_verse': 'verse',
  'sov': 'verse',
  'start_of_chorus': 'chorus',
  'soc': 'chorus',
  'start_of_bridge': 'bridge',
  'sob': 'bridge',
  'start_of_tab': 'instrumental',
  'sot': 'instrumental',
  'start_of_grid': 'instrumental',
  'sog': 'instrumental',
};

const END_DIRECTIVES = [
  'end_of_verse', 'eov',
  'end_of_chorus', 'eoc',
  'end_of_bridge', 'eob',
  'end_of_tab', 'eot',
  'end_of_grid', 'eog',
];

// Section type patterns in comments (for {c: Verse 1} style)
const COMMENT_SECTION_PATTERNS: { pattern: RegExp; type: Section['type'] }[] = [
  { pattern: /^intro/i, type: 'intro' },
  { pattern: /^verse/i, type: 'verse' },
  { pattern: /^pre[-\s]?chorus/i, type: 'pre-chorus' },
  { pattern: /^chorus/i, type: 'chorus' },
  { pattern: /^bridge/i, type: 'bridge' },
  { pattern: /^outro/i, type: 'outro' },
  { pattern: /^tag/i, type: 'tag' },
  { pattern: /^instrumental|^interlude|^solo/i, type: 'instrumental' },
];

/**
 * Parse a ChordPro directive line like {title: Song Name}
 */
function parseDirective(line: string): { name: string; value: string } | null {
  const match = line.match(/^\s*\{([^:}]+)(?::(.+))?\}\s*$/);
  if (!match) return null;

  return {
    name: match[1].trim().toLowerCase(),
    value: (match[2] || '').trim()
  };
}

/**
 * Parse a line with inline chords like "[G]Amazing [C]grace"
 * Returns the lyrics and chord positions
 */
function parseChordLine(line: string): ChordLine {
  const chords: { chord: string; position: number }[] = [];
  let lyrics = '';
  let pos = 0;
  let i = 0;

  while (i < line.length) {
    if (line[i] === '[') {
      // Find the closing bracket
      const closeIdx = line.indexOf(']', i);
      if (closeIdx !== -1) {
        const chord = line.substring(i + 1, closeIdx);
        if (chord.trim()) {
          chords.push({ chord: chord.trim(), position: pos });
        }
        i = closeIdx + 1;
        continue;
      }
    }

    lyrics += line[i];
    pos++;
    i++;
  }

  return { lyrics: lyrics.trim(), chords };
}

/**
 * Detect section type from a comment string
 */
function detectSectionType(comment: string): { type: Section['type']; label: string } {
  for (const { pattern, type } of COMMENT_SECTION_PATTERNS) {
    if (pattern.test(comment)) {
      // Capitalize first letter of each word for label
      const label = comment.replace(/\b\w/g, c => c.toUpperCase());
      return { type, label };
    }
  }

  // Default to verse if no pattern matches
  return { type: 'verse', label: comment || 'Verse' };
}

/**
 * Parse ChordPro format text into structured sections
 */
export function parseChordPro(content: string): ChordProParseResult {
  const lines = content.split('\n');
  const metadata: ChordProMetadata = {
    title: 'Untitled',
    artist: 'Unknown',
    key: 'C'
  };
  const sections: Section[] = [];

  let currentSection: Section | null = null;
  let verseCount = 0;
  let chorusCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip empty lines (but don't close sections)
    if (!line) {
      // Add empty line to current section if it exists and has content
      if (currentSection && currentSection.lines.length > 0) {
        // Don't add multiple empty lines
        const lastLine = currentSection.lines[currentSection.lines.length - 1];
        if (lastLine.lyrics !== '') {
          currentSection.lines.push({ lyrics: '', chords: [] });
        }
      }
      continue;
    }

    // Check for directive
    const directive = parseDirective(line);
    if (directive) {
      const { name, value } = directive;

      // Metadata directives
      if (name === 'title' || name === 't') {
        metadata.title = value || 'Untitled';
        continue;
      }
      if (name === 'artist' || name === 'a' || name === 'subtitle' || name === 'st') {
        metadata.artist = value || 'Unknown';
        continue;
      }
      if (name === 'key') {
        metadata.key = value || 'C';
        continue;
      }

      // Section start directives
      if (SECTION_DIRECTIVES[name]) {
        // Save current section
        if (currentSection && currentSection.lines.length > 0) {
          sections.push(currentSection);
        }

        const type = SECTION_DIRECTIVES[name];
        let label = value;

        if (!label) {
          if (type === 'verse') {
            verseCount++;
            label = `Verse ${verseCount}`;
          } else if (type === 'chorus') {
            chorusCount++;
            label = chorusCount > 1 ? `Chorus ${chorusCount}` : 'Chorus';
          } else {
            label = type.charAt(0).toUpperCase() + type.slice(1);
          }
        }

        currentSection = { type, label, lines: [] };
        continue;
      }

      // Section end directives
      if (END_DIRECTIVES.includes(name)) {
        if (currentSection && currentSection.lines.length > 0) {
          sections.push(currentSection);
        }
        currentSection = null;
        continue;
      }

      // Comment directive - often used as section label
      if (name === 'comment' || name === 'c' || name === 'ci') {
        // Save current section
        if (currentSection && currentSection.lines.length > 0) {
          sections.push(currentSection);
        }

        const { type, label } = detectSectionType(value);

        // Update counters
        if (type === 'verse') verseCount++;
        if (type === 'chorus') chorusCount++;

        currentSection = { type, label, lines: [] };
        continue;
      }

      // Skip other directives
      continue;
    }

    // Regular line with potential chords
    const chordLine = parseChordLine(line);

    // If no current section, create one
    if (!currentSection) {
      verseCount++;
      currentSection = {
        type: 'verse',
        label: `Verse ${verseCount}`,
        lines: []
      };
    }

    // Only add if there's content
    if (chordLine.lyrics || chordLine.chords.length > 0) {
      currentSection.lines.push(chordLine);
    }
  }

  // Save final section
  if (currentSection && currentSection.lines.length > 0) {
    // Remove trailing empty lines
    while (currentSection.lines.length > 0 &&
           currentSection.lines[currentSection.lines.length - 1].lyrics === '' &&
           currentSection.lines[currentSection.lines.length - 1].chords.length === 0) {
      currentSection.lines.pop();
    }
    if (currentSection.lines.length > 0) {
      sections.push(currentSection);
    }
  }

  return { metadata, sections };
}

/**
 * Export song data to ChordPro format
 */
export function exportToChordPro(
  title: string,
  artist: string,
  key: string,
  sections: Section[]
): string {
  const lines: string[] = [];

  // Metadata
  lines.push(`{title: ${title}}`);
  lines.push(`{artist: ${artist}}`);
  lines.push(`{key: ${key}}`);
  lines.push('');

  // Sections
  for (const section of sections) {
    // Section header as comment
    lines.push(`{c: ${section.label}}`);

    // Lines with inline chords
    for (const line of section.lines) {
      if (!line.lyrics && line.chords.length === 0) {
        lines.push('');
        continue;
      }

      // Build line with inline chords
      let result = '';
      let lastPos = 0;

      // Sort chords by position
      const sortedChords = [...line.chords].sort((a, b) => a.position - b.position);

      for (const chord of sortedChords) {
        // Add lyrics up to this chord position
        if (chord.position >= lastPos) {
          result += line.lyrics.substring(lastPos, chord.position);
          result += `[${chord.chord}]`;
          lastPos = chord.position;
        }
      }

      // Add remaining lyrics
      result += line.lyrics.substring(lastPos);

      lines.push(result || line.lyrics);
    }

    lines.push('');
  }

  return lines.join('\n');
}
