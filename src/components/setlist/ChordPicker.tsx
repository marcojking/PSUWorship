'use client';

import { useState, useRef, useEffect } from 'react';
import { ALL_KEYS, isChord } from '@/lib/chords/transposition';

interface ChordPickerProps {
  songKey: string;
  currentChord: string | null;
  recentChords: string[];
  position: { x: number; y: number };
  onSelect: (chord: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

// Generate diatonic chords for a given key
function getDiatonicChords(key: string): string[] {
  // Semitone offsets for major scale degrees
  const majorScaleOffsets = [0, 2, 4, 5, 7, 9, 11];
  // Chord qualities for each degree: I, ii, iii, IV, V, vi, vii°
  const qualities = ['', 'm', 'm', '', '', 'm', 'dim'];

  const keyIndex = ALL_KEYS.indexOf(key);
  if (keyIndex === -1) {
    // Fallback to C major
    return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'];
  }

  return majorScaleOffsets.map((offset, i) => {
    const noteIndex = (keyIndex + offset) % 12;
    return ALL_KEYS[noteIndex] + qualities[i];
  });
}

// Common chord extensions to suggest
const COMMON_EXTENSIONS = ['7', 'maj7', 'sus4', 'sus2', 'add9', '2'];

export default function ChordPicker({
  songKey,
  currentChord,
  recentChords,
  position,
  onSelect,
  onRemove,
  onClose,
}: ChordPickerProps) {
  const [customChord, setCustomChord] = useState('');
  const [showExtensions, setShowExtensions] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const diatonicChords = getDiatonicChords(songKey);

  // Filter recent chords to exclude diatonic ones (avoid duplicates)
  const uniqueRecentChords = recentChords.filter(
    chord => !diatonicChords.includes(chord) && chord !== currentChord
  ).slice(0, 4);

  // Position the picker within viewport
  useEffect(() => {
    if (pickerRef.current) {
      const rect = pickerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust horizontal position
      if (adjustedX + rect.width > viewportWidth - 10) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (adjustedX < 10) {
        adjustedX = 10;
      }

      // Adjust vertical position (prefer above, flip below if needed)
      if (adjustedY < 10) {
        adjustedY = position.y + 40; // Show below instead
      }
      if (adjustedY + rect.height > viewportHeight - 10) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      pickerRef.current.style.left = `${adjustedX}px`;
      pickerRef.current.style.top = `${adjustedY}px`;
    }
  }, [position]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChordClick = (chord: string) => {
    onSelect(chord);
  };

  const handleExtensionClick = (baseChord: string, extension: string) => {
    // Remove existing quality suffix before adding extension
    const root = baseChord.replace(/(m|dim|aug)$/, '');
    const quality = baseChord.match(/(m|dim|aug)$/)?.[0] || '';
    onSelect(root + quality + extension);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customChord.trim() && isChord(customChord.trim())) {
      onSelect(customChord.trim());
      setCustomChord('');
    }
  };

  return (
    <div
      ref={pickerRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-primary/20 p-3 min-w-[280px]"
      style={{ left: position.x, top: position.y }}
    >
      {/* Current chord indicator */}
      {currentChord && (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-primary/10">
          <span className="text-sm text-primary/60">Current:</span>
          <span className="font-bold text-primary text-lg">{currentChord}</span>
        </div>
      )}

      {/* Diatonic chords for current key */}
      <div className="mb-3">
        <div className="text-xs text-primary/50 mb-1.5">Key of {songKey}</div>
        <div className="flex flex-wrap gap-1.5">
          {diatonicChords.map((chord) => (
            <div key={chord} className="relative">
              <button
                onClick={() => handleChordClick(chord)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowExtensions(showExtensions === chord ? null : chord);
                }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                  ${currentChord === chord
                    ? 'bg-primary text-secondary'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
              >
                {chord}
              </button>
              {/* Extensions popup */}
              {showExtensions === chord && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-primary/20 rounded shadow-lg p-1 z-10 flex gap-1">
                  {COMMON_EXTENSIONS.map(ext => (
                    <button
                      key={ext}
                      onClick={() => {
                        handleExtensionClick(chord, ext);
                        setShowExtensions(null);
                      }}
                      className="px-2 py-1 text-xs bg-primary/5 hover:bg-primary/15 rounded"
                    >
                      {ext}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-primary/40 mt-1">Right-click for extensions</div>
      </div>

      {/* Recent chords */}
      {uniqueRecentChords.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-primary/50 mb-1.5">Recent</div>
          <div className="flex flex-wrap gap-1.5">
            {uniqueRecentChords.map((chord) => (
              <button
                key={chord}
                onClick={() => handleChordClick(chord)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
                  ${currentChord === chord
                    ? 'bg-accent text-white'
                    : 'bg-accent/10 text-accent hover:bg-accent/20'
                  }`}
              >
                {chord}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom chord input */}
      <form onSubmit={handleCustomSubmit} className="mb-3">
        <div className="text-xs text-primary/50 mb-1.5">Custom</div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={customChord}
            onChange={(e) => setCustomChord(e.target.value)}
            placeholder="e.g., F#m7, Bb/D"
            className="flex-1 px-2 py-1.5 text-sm border border-primary/20 rounded focus:outline-none focus:border-primary/40"
          />
          <button
            type="submit"
            disabled={!customChord.trim() || !isChord(customChord.trim())}
            className="px-3 py-1.5 bg-primary text-secondary text-sm rounded disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </form>

      {/* Remove chord button */}
      {currentChord && (
        <button
          onClick={onRemove}
          className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          Remove Chord
        </button>
      )}

      {/* Close hint */}
      <div className="text-xs text-primary/40 text-center mt-2 pt-2 border-t border-primary/10">
        Press Esc or click outside to close
      </div>
    </div>
  );
}
