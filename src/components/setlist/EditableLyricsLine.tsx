'use client';

import { useRef, useCallback, useMemo } from 'react';

interface ChordPosition {
  chord: string;
  position: number;
}

interface EditableLyricsLineProps {
  lyrics: string;
  chords: ChordPosition[];
  onChordClick: (position: number, screenPosition: { x: number; y: number }) => void;
  activePosition: number | null;
  isInstrumental?: boolean;
  beatsPerBar?: number;
  totalBeats?: number;
}

// Build chord line string with proper spacing
// If chord positions are beyond lyrics length, redistribute them proportionally
function buildChordLine(
  chords: ChordPosition[],
  lyricsLength: number
): { line: string; chordPositions: Map<number, { start: number; end: number; chord: string }> } {
  const chordPositions = new Map<number, { start: number; end: number; chord: string }>();
  const minLength = Math.max(lyricsLength, 1);

  if (chords.length === 0) {
    return { line: ' '.repeat(minLength), chordPositions };
  }

  // Sort chords by position
  const sortedChords = [...chords].sort((a, b) => a.position - b.position);

  // Check if any chord position is beyond lyrics length - if so, redistribute
  const maxStoredPos = Math.max(...sortedChords.map(c => c.position));
  const needsRedistribution = maxStoredPos >= lyricsLength && lyricsLength > 0;

  // Calculate display positions
  const placements: { chord: string; displayPosition: number; originalPosition: number }[] = [];
  let nextAvailablePosition = 0;
  const MIN_GAP = 1;

  for (let i = 0; i < sortedChords.length; i++) {
    const { chord, position } = sortedChords[i];

    let targetPosition: number;
    if (needsRedistribution) {
      // Redistribute: spread chords evenly across the lyrics
      // First chord at 0, last chord near end, others proportionally spaced
      if (sortedChords.length === 1) {
        targetPosition = 0;
      } else {
        const maxDisplayPos = Math.max(0, lyricsLength - chord.length);
        targetPosition = Math.round((i / (sortedChords.length - 1)) * maxDisplayPos);
      }
    } else {
      targetPosition = position;
    }

    // Ensure no overlap with previous chord
    const displayPosition = Math.max(targetPosition, nextAvailablePosition);
    placements.push({ chord, displayPosition, originalPosition: position });
    nextAvailablePosition = displayPosition + chord.length + MIN_GAP;
  }

  // Calculate line length
  const lastPlacement = placements[placements.length - 1];
  const requiredLength = lastPlacement.displayPosition + lastPlacement.chord.length;
  const lineLength = Math.max(minLength, requiredLength, 1);

  // Build the chord line
  const chars: string[] = new Array(lineLength).fill(' ');

  for (const { chord, displayPosition, originalPosition } of placements) {
    for (let i = 0; i < chord.length && displayPosition + i < lineLength; i++) {
      chars[displayPosition + i] = chord[i];
    }
    // Map the original position to where it's displayed
    chordPositions.set(originalPosition, {
      start: displayPosition,
      end: displayPosition + chord.length - 1,
      chord,
    });
  }

  return { line: chars.join(''), chordPositions };
}

export default function EditableLyricsLine({
  lyrics,
  chords,
  onChordClick,
  activePosition,
  isInstrumental = false,
  beatsPerBar = 4,
  totalBeats = 8,
}: EditableLyricsLineProps) {
  const lyricsRef = useRef<HTMLDivElement>(null);

  // Build chord line for display
  const { line: chordLine, chordPositions } = useMemo(
    () => buildChordLine(chords, lyrics.length || 1),
    [chords, lyrics.length]
  );

  // Map chords by their original position for highlighting
  const chordsByPosition = useMemo(() => {
    const map = new Map<number, string>();
    for (const chord of chords) {
      map.set(chord.position, chord.chord);
    }
    return map;
  }, [chords]);

  // Handle click on lyrics - calculate character position
  const handleLyricsClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!lyricsRef.current) return;

    const rect = lyricsRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;

    // Calculate character width using a measurement approach
    // With monospace font, all characters have the same width
    const testSpan = document.createElement('span');
    testSpan.style.fontFamily = 'ui-monospace, monospace';
    testSpan.style.fontSize = getComputedStyle(lyricsRef.current).fontSize;
    testSpan.style.visibility = 'hidden';
    testSpan.style.position = 'absolute';
    testSpan.textContent = 'M'; // Use M as reference character
    document.body.appendChild(testSpan);
    const charWidth = testSpan.getBoundingClientRect().width;
    document.body.removeChild(testSpan);

    // Calculate character position
    const charPosition = Math.max(0, Math.floor(clickX / charWidth));

    // Get screen position for chord picker
    const screenX = rect.left + (charPosition * charWidth) + (charWidth / 2);
    const screenY = rect.top - 10;

    onChordClick(charPosition, { x: screenX, y: screenY });
  }, [onChordClick]);

  // Handle click on chord line - find if clicking on existing chord
  const handleChordLineClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!lyricsRef.current) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;

    // Calculate character width
    const testSpan = document.createElement('span');
    testSpan.style.fontFamily = 'ui-monospace, monospace';
    testSpan.style.fontSize = getComputedStyle(event.currentTarget).fontSize;
    testSpan.style.visibility = 'hidden';
    testSpan.style.position = 'absolute';
    testSpan.textContent = 'M';
    document.body.appendChild(testSpan);
    const charWidth = testSpan.getBoundingClientRect().width;
    document.body.removeChild(testSpan);

    const clickPosition = Math.floor(clickX / charWidth);

    // Check if clicking on an existing chord
    for (const [originalPos, { start, end }] of chordPositions) {
      if (clickPosition >= start && clickPosition <= end) {
        // Clicked on existing chord - use original position
        const screenX = rect.left + (start * charWidth) + ((end - start + 1) * charWidth / 2);
        const screenY = rect.top - 10;
        onChordClick(originalPos, { x: screenX, y: screenY });
        return;
      }
    }

    // Clicked on empty space in chord line - treat as new chord at that position
    const screenX = rect.left + (clickPosition * charWidth) + (charWidth / 2);
    const screenY = rect.top - 10;
    onChordClick(clickPosition, { x: screenX, y: screenY });
  }, [chordPositions, onChordClick]);

  // Instrumental mode - show beat markers with bar lines
  if (isInstrumental || (!lyrics.trim() && chords.length > 0)) {
    const beats = Array.from({ length: totalBeats }, (_, i) => i);
    const chordsByBeat = new Map<number, string>();
    for (const chord of chords) {
      chordsByBeat.set(chord.position, chord.chord);
    }

    return (
      <div className="relative py-1">
        {/* Chord row */}
        <div className="flex items-end min-h-[1.5rem] font-mono text-sm">
          {beats.map((beatIndex) => {
            const chord = chordsByBeat.get(beatIndex);
            const isBarStart = beatIndex % beatsPerBar === 0;

            return (
              <div key={`chord-${beatIndex}`} className="flex items-end">
                {isBarStart && beatIndex > 0 && (
                  <span className="text-primary/30 mx-1">|</span>
                )}
                <span
                  className="inline-block text-center"
                  style={{ minWidth: '4ch' }}
                >
                  {chord && (
                    <span className="text-primary font-bold">{chord}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Beat markers row */}
        <div className="flex font-mono text-sm">
          {beats.map((beatIndex) => {
            const hasChord = chordsByBeat.has(beatIndex);
            const isActive = activePosition === beatIndex;
            const isBarStart = beatIndex % beatsPerBar === 0;
            const beatInBar = (beatIndex % beatsPerBar) + 1;

            return (
              <div key={`beat-${beatIndex}`} className="flex items-center">
                {isBarStart && beatIndex > 0 && (
                  <span className="text-primary/30 mx-1">|</span>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    onChordClick(beatIndex, {
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10,
                    });
                  }}
                  className={`
                    inline-flex items-center justify-center w-8 h-6 rounded transition-colors cursor-pointer
                    ${isActive
                      ? 'bg-primary text-secondary'
                      : hasChord
                        ? 'bg-primary/20 hover:bg-primary/30 text-primary'
                        : 'bg-primary/5 hover:bg-primary/10 text-primary/40'
                    }
                  `}
                  title={hasChord ? 'Click to edit chord' : `Beat ${beatInBar} - click to add chord`}
                >
                  {beatInBar}
                </button>
              </div>
            );
          })}
          <span className="text-primary/30 mx-1">|</span>
        </div>
      </div>
    );
  }

  // Empty lyrics - show placeholder
  if (!lyrics.trim() && chords.length === 0) {
    return (
      <div className="py-2 px-1 text-primary/40 text-sm italic">
        (empty line - type lyrics below)
      </div>
    );
  }

  // Regular lyrics mode with character-level chord placement
  // Pad lyrics to ensure there's space for chords beyond the text
  const displayLyrics = lyrics.padEnd(Math.max(lyrics.length, chordLine.length), ' ');

  return (
    <div className="relative py-1 font-mono text-sm select-none">
      {/* Chord line - clickable to edit existing chords */}
      <div
        className="text-primary font-bold whitespace-pre cursor-pointer hover:bg-primary/5 rounded min-h-[1.25rem]"
        onClick={handleChordLineClick}
        title="Click to add or edit chord"
      >
        {chordLine || ' '}
      </div>

      {/* Lyrics line - clickable to place new chords */}
      <div
        ref={lyricsRef}
        className="whitespace-pre cursor-pointer hover:bg-primary/5 rounded"
        onClick={handleLyricsClick}
        title="Click to place chord at this position"
      >
        {displayLyrics || ' '}
      </div>

      {/* Active position indicator */}
      {activePosition !== null && (
        <div
          className="absolute top-0 w-0.5 h-full bg-primary/50 pointer-events-none"
          style={{ left: `${activePosition}ch` }}
        />
      )}
    </div>
  );
}
