'use client';

import { type Section, type ChordLine } from '@/lib/db';
import { transposeChordToKey } from '@/lib/chords/transposition';
import { chordToRomanNumeral } from '@/lib/chords/nashville';

interface ChordChartProps {
  sections: Section[];
  songKey: string;
  displayKey?: string; // If transposing
  displayMode?: 'letters' | 'numerals' | 'none';
}

export default function ChordChart({
  sections,
  songKey,
  displayKey,
  displayMode = 'letters',
}: ChordChartProps) {
  const effectiveKey = displayKey || songKey;
  const shouldTranspose = displayKey && displayKey !== songKey;

  // Get display chord based on mode and transposition
  const getDisplayChord = (chord: string): string => {
    let displayChord = chord;

    // Transpose if needed
    if (shouldTranspose) {
      displayChord = transposeChordToKey(chord, songKey, effectiveKey);
    }

    // Convert to numerals if needed
    if (displayMode === 'numerals') {
      displayChord = chordToRomanNumeral(displayChord, effectiveKey);
    }

    return displayChord;
  };

  return (
    <div className="font-mono text-sm sm:text-base leading-relaxed">
      {sections.map((section, sIdx) => (
        <div key={sIdx} className="mb-6">
          {/* Section Label */}
          <div className="font-bold text-primary/60 mb-2">
            [{section.label}]
          </div>

          {/* Lines */}
          {section.lines.map((line, lIdx) => (
            <ChordLineDisplay
              key={lIdx}
              line={line}
              getDisplayChord={displayMode === 'none' ? undefined : getDisplayChord}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ChordLineDisplayProps {
  line: ChordLine;
  getDisplayChord?: (chord: string) => string;
}

function ChordLineDisplay({ line, getDisplayChord }: ChordLineDisplayProps) {
  // If no chords or hiding chords, just show lyrics
  if (!getDisplayChord || line.chords.length === 0) {
    return (
      <div className="mb-1">
        {line.lyrics || '\u00A0'}
      </div>
    );
  }

  // Build chord line with proper spacing
  const chordLine = buildChordLine(line.chords, line.lyrics.length, getDisplayChord);

  return (
    <div className="mb-1">
      {/* Chord line */}
      <div className="text-primary font-bold whitespace-pre">
        {chordLine}
      </div>
      {/* Lyric line */}
      <div className="whitespace-pre">
        {line.lyrics || '\u00A0'}
      </div>
    </div>
  );
}

// Build a chord line string with proper spacing, preventing overlaps
function buildChordLine(
  chords: { chord: string; position: number }[],
  lyricLength: number,
  getDisplayChord: (chord: string) => string
): string {
  if (chords.length === 0) return '';

  // Sort chords by position
  const sortedChords = [...chords].sort((a, b) => a.position - b.position);

  // Build chord placements, pushing right if overlap would occur
  const placements: { chord: string; position: number }[] = [];
  let nextAvailablePosition = 0;
  const MIN_GAP = 1; // Minimum space between chords

  for (const { chord, position } of sortedChords) {
    const displayChord = getDisplayChord(chord);

    // Determine actual position (push right if would overlap)
    const actualPosition = Math.max(position, nextAvailablePosition);

    placements.push({ chord: displayChord, position: actualPosition });

    // Update next available position (after this chord + gap)
    nextAvailablePosition = actualPosition + displayChord.length + MIN_GAP;
  }

  // Calculate required length
  const lastPlacement = placements[placements.length - 1];
  const requiredLength = lastPlacement.position + lastPlacement.chord.length;
  const maxLength = Math.max(lyricLength, requiredLength, 40);

  // Build the chord line
  const chars: string[] = new Array(maxLength).fill(' ');

  for (const { chord, position } of placements) {
    for (let i = 0; i < chord.length && position + i < maxLength; i++) {
      chars[position + i] = chord[i];
    }
  }

  // Trim trailing spaces
  return chars.join('').trimEnd();
}
