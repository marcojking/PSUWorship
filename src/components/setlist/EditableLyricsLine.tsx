'use client';

import { useMemo } from 'react';
import { getWordBoundaries } from '@/lib/lyrics/parser';

interface ChordPosition {
  chord: string;
  position: number;
}

interface EditableLyricsLineProps {
  lyrics: string;
  chords: ChordPosition[];
  onWordClick: (wordIndex: number, screenPosition: { x: number; y: number }) => void;
  onBeatClick?: (beatIndex: number, screenPosition: { x: number; y: number }) => void;
  activeWordIndex: number | null;
  isInstrumental?: boolean;
  beatsPerBar?: number;
  totalBeats?: number;
}

export default function EditableLyricsLine({
  lyrics,
  chords,
  onWordClick,
  onBeatClick,
  activeWordIndex,
  isInstrumental = false,
  beatsPerBar = 4,
  totalBeats = 8,
}: EditableLyricsLineProps) {
  // Parse lyrics into words with their positions
  const wordBoundaries = useMemo(() => getWordBoundaries(lyrics), [lyrics]);

  // Map chords to word indices for display (lyrics mode)
  const chordsByWordIndex = useMemo(() => {
    const map = new Map<number, string>();

    for (const chord of chords) {
      // Find which word this chord position belongs to
      for (let i = 0; i < wordBoundaries.length; i++) {
        if (chord.position === wordBoundaries[i].start) {
          map.set(i, chord.chord);
          break;
        }
      }
    }

    return map;
  }, [chords, wordBoundaries]);

  // Map chords to beat indices for display (instrumental mode)
  const chordsByBeatIndex = useMemo(() => {
    const map = new Map<number, string>();
    for (const chord of chords) {
      map.set(chord.position, chord.chord);
    }
    return map;
  }, [chords]);

  const handleWordClick = (wordIndex: number, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    onWordClick(wordIndex, {
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleBeatClick = (beatIndex: number, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!onBeatClick) return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    onBeatClick(beatIndex, {
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  // Instrumental mode - show beat markers with bar lines
  if (isInstrumental || (!lyrics.trim() && chords.length > 0)) {
    const beats = Array.from({ length: totalBeats }, (_, i) => i);

    return (
      <div className="relative py-1">
        {/* Chord row */}
        <div className="flex items-end min-h-[1.5rem] font-mono text-sm">
          {beats.map((beatIndex) => {
            const chord = chordsByBeatIndex.get(beatIndex);
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
            const hasChord = chordsByBeatIndex.has(beatIndex);
            const isActive = activeWordIndex === beatIndex;
            const isBarStart = beatIndex % beatsPerBar === 0;
            const beatInBar = (beatIndex % beatsPerBar) + 1;

            return (
              <div key={`beat-${beatIndex}`} className="flex items-center">
                {isBarStart && beatIndex > 0 && (
                  <span className="text-primary/30 mx-1">|</span>
                )}
                <button
                  onClick={(e) => handleBeatClick(beatIndex, e)}
                  onTouchEnd={(e) => handleBeatClick(beatIndex, e)}
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

  // Empty lyrics with no chords - show option to add as instrumental or lyrics
  if (!lyrics.trim() && wordBoundaries.length === 0) {
    return (
      <div className="py-2 px-1 text-primary/40 text-sm flex items-center gap-2">
        <span className="italic">(empty line)</span>
        <span className="text-primary/30">-</span>
        <span className="text-xs">Type lyrics below, or leave empty for instrumental</span>
      </div>
    );
  }

  // Regular lyrics mode
  return (
    <div className="relative py-1">
      {/* Chord row */}
      <div className="flex flex-wrap items-end min-h-[1.5rem] font-mono text-sm">
        {wordBoundaries.map((boundary, index) => {
          const chord = chordsByWordIndex.get(index);
          return (
            <span
              key={`chord-${index}`}
              className="inline-block text-center"
              style={{ minWidth: `${boundary.word.length + 1}ch` }}
            >
              {chord && (
                <span className="text-primary font-bold">{chord}</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Lyrics row with clickable words */}
      <div className="flex flex-wrap font-mono text-sm">
        {wordBoundaries.map((boundary, index) => {
          const hasChord = chordsByWordIndex.has(index);
          const isActive = activeWordIndex === index;

          return (
            <button
              key={`word-${index}`}
              onClick={(e) => handleWordClick(index, e)}
              onTouchEnd={(e) => handleWordClick(index, e)}
              className={`
                inline-block px-0.5 py-0.5 rounded transition-colors cursor-pointer
                ${isActive
                  ? 'bg-primary text-secondary'
                  : hasChord
                    ? 'bg-primary/10 hover:bg-primary/20'
                    : 'hover:bg-primary/10'
                }
              `}
              style={{ marginRight: '0.5ch' }}
              title={hasChord ? `Click to edit chord` : `Click to add chord`}
            >
              {boundary.word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
