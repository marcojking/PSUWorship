'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Section } from '@/lib/db';
import { mergeChordAtPosition } from '@/lib/lyrics/parser';
import EditableLyricsLine from './EditableLyricsLine';
import ChordPicker from './ChordPicker';

const SECTION_TYPES: Section['type'][] = [
  'intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'instrumental', 'outro', 'tag'
];

interface VisualChordEditorProps {
  sections: Section[];
  songKey: string;
  onChange: (sections: Section[]) => void;
}

interface ActiveChord {
  sectionIndex: number;
  lineIndex: number;
  position: number; // Character position (or beat index for instrumental)
  screenPosition: { x: number; y: number };
}

export default function VisualChordEditor({
  sections,
  songKey,
  onChange,
}: VisualChordEditorProps) {
  const [activeChord, setActiveChord] = useState<ActiveChord | null>(null);

  // Collect all chords used in the song for "recent" suggestions
  const recentChords = useMemo(() => {
    const chords = new Set<string>();
    for (const section of sections) {
      for (const line of section.lines) {
        for (const chord of line.chords) {
          chords.add(chord.chord);
        }
      }
    }
    return Array.from(chords);
  }, [sections]);

  // Get current chord at active position
  const getCurrentChord = useCallback((): string | null => {
    if (!activeChord) return null;

    const section = sections[activeChord.sectionIndex];
    if (!section) return null;

    const line = section.lines[activeChord.lineIndex];
    if (!line) return null;

    const chord = line.chords.find(c => c.position === activeChord.position);
    return chord?.chord || null;
  }, [activeChord, sections]);

  // Handle click on lyrics/chord line - open chord picker
  const handleChordClick = useCallback((
    sectionIndex: number,
    lineIndex: number,
    position: number,
    screenPosition: { x: number; y: number }
  ) => {
    setActiveChord({ sectionIndex, lineIndex, position, screenPosition });
  }, []);

  // Handle chord selection from picker
  const handleChordSelect = useCallback((chord: string) => {
    if (!activeChord) return;

    const newSections = [...sections];
    const section = newSections[activeChord.sectionIndex];
    const line = section.lines[activeChord.lineIndex];

    line.chords = mergeChordAtPosition(line.chords, chord, activeChord.position);

    onChange(newSections);
    setActiveChord(null);
  }, [activeChord, sections, onChange]);

  // Handle chord removal
  const handleChordRemove = useCallback(() => {
    if (!activeChord) return;

    const newSections = [...sections];
    const section = newSections[activeChord.sectionIndex];
    const line = section.lines[activeChord.lineIndex];

    line.chords = mergeChordAtPosition(line.chords, '', activeChord.position);

    onChange(newSections);
    setActiveChord(null);
  }, [activeChord, sections, onChange]);

  // Close chord picker
  const handleClosePicker = useCallback(() => {
    setActiveChord(null);
  }, []);

  // Section management
  const updateSection = (index: number, updates: Partial<Section>) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], ...updates };
    onChange(newSections);
  };

  const addSection = () => {
    const newSection: Section = {
      type: 'verse',
      label: `Verse ${sections.filter(s => s.type === 'verse').length + 1}`,
      lines: [{ lyrics: '', chords: [] }],
    };
    onChange([...sections, newSection]);
  };

  const removeSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    onChange(newSections);
  };

  // Line management
  const addLine = (sectionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].lines.push({ lyrics: '', chords: [] });
    onChange(newSections);
  };

  const updateLineLyrics = (sectionIndex: number, lineIndex: number, lyrics: string) => {
    const newSections = [...sections];
    const line = newSections[sectionIndex].lines[lineIndex];

    // Keep chords that are still within the new lyrics length
    // (or keep all if new lyrics is longer)
    const newChords = line.chords.filter(chord =>
      chord.position < lyrics.length || lyrics.length >= line.lyrics.length
    );

    line.lyrics = lyrics;
    line.chords = newChords;
    onChange(newSections);
  };

  const removeLine = (sectionIndex: number, lineIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].lines = newSections[sectionIndex].lines.filter((_, i) => i !== lineIndex);
    onChange(newSections);
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Tip:</strong> Click anywhere on the lyrics or chord line to place/edit a chord at that position. For instrumental sections, click on beat markers.
      </div>

      {/* Sections */}
      {sections.map((section, sIdx) => (
        <div key={sIdx} className="bg-white border border-primary/10 rounded-lg overflow-hidden">
          {/* Section Header */}
          <div className="bg-primary/5 p-3 flex items-center gap-3">
            <select
              value={section.type}
              onChange={(e) => updateSection(sIdx, { type: e.target.value as Section['type'] })}
              className="bg-white border border-primary/20 rounded px-2 py-1 text-sm"
            >
              {SECTION_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={section.label}
              onChange={(e) => updateSection(sIdx, { label: e.target.value })}
              className="flex-1 bg-white border border-primary/20 rounded px-2 py-1 text-sm font-medium"
              placeholder="Section label"
            />
            <div className="flex gap-1">
              <button
                onClick={() => moveSection(sIdx, 'up')}
                disabled={sIdx === 0}
                className="p-1 text-primary/60 hover:text-primary disabled:opacity-30"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => moveSection(sIdx, 'down')}
                disabled={sIdx === sections.length - 1}
                className="p-1 text-primary/60 hover:text-primary disabled:opacity-30"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => removeSection(sIdx)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Delete section"
              >
                ×
              </button>
            </div>
          </div>

          {/* Lines */}
          <div className="p-3 space-y-2">
            {section.lines.map((line, lIdx) => {
              const isInstrumentalSection = section.type === 'instrumental' || section.type === 'intro' || section.type === 'outro';
              const showBeatMarkers = isInstrumentalSection && !line.lyrics.trim();

              return (
                <div key={lIdx} className="group">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      {/* Visual chord/lyrics display (click to place chords) */}
                      <EditableLyricsLine
                        lyrics={line.lyrics}
                        chords={line.chords}
                        onChordClick={(position, screenPosition) =>
                          handleChordClick(sIdx, lIdx, position, screenPosition)
                        }
                        activePosition={
                          activeChord?.sectionIndex === sIdx && activeChord?.lineIndex === lIdx
                            ? activeChord.position
                            : null
                        }
                        isInstrumental={showBeatMarkers}
                      />

                      {/* Editable lyrics input - hidden for instrumental beat lines */}
                      {!showBeatMarkers && (
                        <input
                          type="text"
                          value={line.lyrics}
                          onChange={(e) => updateLineLyrics(sIdx, lIdx, e.target.value)}
                          placeholder={isInstrumentalSection ? "Add lyrics (optional) or leave empty for beat markers" : "Enter lyrics..."}
                          className="w-full mt-1 bg-primary/5 border-0 rounded px-2 py-1 text-sm font-mono"
                        />
                      )}
                      {showBeatMarkers && (
                        <div className="mt-1 text-xs text-primary/40">
                          Click beats to add chords •
                          <button
                            onClick={() => updateLineLyrics(sIdx, lIdx, ' ')}
                            className="ml-1 text-primary/60 hover:text-primary underline"
                          >
                            Add lyrics instead
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removeLine(sIdx, lIdx)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 px-2 transition-opacity"
                      title="Delete line"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => addLine(sIdx)}
              className="text-sm text-primary/60 hover:text-primary"
            >
              + Add line
            </button>
          </div>
        </div>
      ))}

      {/* Add Section Button */}
      <button
        onClick={addSection}
        className="w-full py-3 border-2 border-dashed border-primary/20 rounded-lg text-primary/60 hover:border-primary/40 hover:text-primary transition-colors"
      >
        + Add Section
      </button>

      {/* Chord Picker (portal-style, positioned absolutely) */}
      {activeChord && (
        <ChordPicker
          songKey={songKey}
          currentChord={getCurrentChord()}
          recentChords={recentChords}
          position={activeChord.screenPosition}
          onSelect={handleChordSelect}
          onRemove={handleChordRemove}
          onClose={handleClosePicker}
        />
      )}
    </div>
  );
}
