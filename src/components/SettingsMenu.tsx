'use client';

import { AVAILABLE_KEYS, ScaleType, VOCAL_RANGES, VocalRange } from '@/lib/music/theory';
import { MelodyType } from '@/lib/music/melodyGenerator';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  vocalRange: VocalRange;
  onVocalRangeChange: (range: VocalRange) => void;
  melodyType: MelodyType;
  onMelodyTypeChange: (type: MelodyType) => void;
  selectedKey: number;
  onKeyChange: (keyMidi: number) => void;
  scaleType: ScaleType;
  onScaleTypeChange: (scale: ScaleType) => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
  measures: number;
  onMeasuresChange: (measures: number) => void;
  complexity: number;
  onComplexityChange: (complexity: number) => void;
  harmonyInterval: number;
  onHarmonyIntervalChange: (interval: number) => void;
  onNewMelody: () => void;
}

// Get label for complexity level
function getComplexityLabel(complexity: number, melodyType: MelodyType): string {
  if (complexity === 0) return 'Whole notes only';
  if (complexity <= 3) return 'Whole & half notes';
  if (complexity <= 6) return 'Quarter notes';
  if (complexity <= 8) return 'Eighth notes';
  return 'Fast rhythms';
}

export default function SettingsMenu({
  isOpen,
  onClose,
  vocalRange,
  onVocalRangeChange,
  melodyType,
  onMelodyTypeChange,
  selectedKey,
  onKeyChange,
  scaleType,
  onScaleTypeChange,
  tempo,
  onTempoChange,
  measures,
  onMeasuresChange,
  complexity,
  onComplexityChange,
  harmonyInterval,
  onHarmonyIntervalChange,
  onNewMelody,
}: SettingsMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Menu panel */}
      <div className="fixed bottom-20 right-2 sm:right-4 w-[calc(100vw-1rem)] sm:w-96 max-w-md bg-[#1b354e] border border-[#2a4a6a] rounded-lg shadow-xl z-50 max-h-[calc(100vh-7rem)] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a4a6a] flex-shrink-0">
          <h2 className="text-lg font-semibold text-[#fff1dc]">Settings</h2>
          <button
            onClick={onClose}
            className="text-[#fff1dc]/70 hover:text-[#fff1dc]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-4 overflow-y-auto flex-1 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Voice type selector */}
          <div>
            <label className="block text-sm text-[#fff1dc]/70 mb-1">Voice Type</label>
            <select
              value={vocalRange}
              onChange={(e) => onVocalRangeChange(e.target.value as VocalRange)}
              className="w-full bg-[#2a4a6a] text-[#fff1dc] rounded px-3 py-2 border border-[#3a5a7a]"
            >
              {Object.entries(VOCAL_RANGES).map(([key, range]) => (
                <option key={key} value={key}>
                  {range.label} ({range.note})
                </option>
              ))}
            </select>
          </div>

          {/* Melody type selector */}
          <div>
            <label className="block text-sm text-[#fff1dc]/70 mb-1">Melody Type</label>
            <select
              value={melodyType}
              onChange={(e) => onMelodyTypeChange(e.target.value as MelodyType)}
              className="w-full bg-[#2a4a6a] text-[#fff1dc] rounded px-3 py-2 border border-[#3a5a7a]"
            >
              <option value="scale">Scale (up & down)</option>
              <option value="random">Random melody</option>
            </select>
          </div>

          {/* Key selector */}
          <div>
            <label className="block text-sm text-[#fff1dc]/70 mb-1">Key</label>
            <select
              value={selectedKey}
              onChange={(e) => onKeyChange(parseInt(e.target.value))}
              className="w-full bg-[#2a4a6a] text-[#fff1dc] rounded px-3 py-2 border border-[#3a5a7a]"
            >
              {AVAILABLE_KEYS.map((key) => (
                <option key={key.midi} value={key.midi}>
                  {key.name} Major
                </option>
              ))}
            </select>
          </div>

          {/* Scale type */}
          <div>
            <label className="block text-sm text-[#fff1dc]/70 mb-1">Scale</label>
            <select
              value={scaleType}
              onChange={(e) => onScaleTypeChange(e.target.value as ScaleType)}
              className="w-full bg-[#2a4a6a] text-[#fff1dc] rounded px-3 py-2 border border-[#3a5a7a]"
            >
              <option value="major">Major</option>
              <option value="minor">Natural Minor</option>
              <option value="harmonicMinor">Harmonic Minor</option>
              <option value="melodicMinor">Melodic Minor</option>
            </select>
          </div>

          {/* Tempo */}
          <div>
            <label className="block text-sm text-[#fff1dc]/70 mb-1">
              Tempo: {tempo} BPM
            </label>
            <input
              type="range"
              min="60"
              max="180"
              value={tempo}
              onChange={(e) => onTempoChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Measures */}
          <div>
            <label className="block text-sm text-[#fff1dc]/70 mb-1">
              Measures: {measures}
            </label>
            <input
              type="range"
              min="2"
              max="8"
              value={measures}
              onChange={(e) => onMeasuresChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Complexity */}
          <div>
            <label className="block text-sm text-[#fff1dc]/70 mb-1">
              Rhythm: {getComplexityLabel(complexity, melodyType)}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={complexity}
              onChange={(e) => onComplexityChange(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#fff1dc]/50 mt-1">
              <span>Simple</span>
              <span>Complex</span>
            </div>
          </div>

          {/* Harmony interval */}
          <div>
            <label className="block text-sm text-[#fff1dc]/70 mb-1">Harmony Type</label>
            <select
              value={harmonyInterval}
              onChange={(e) => onHarmonyIntervalChange(parseInt(e.target.value))}
              className="w-full bg-[#2a4a6a] text-[#fff1dc] rounded px-3 py-2 border border-[#3a5a7a]"
            >
              <option value="3">Third Above</option>
              <option value="-3">Third Below</option>
              <option value="4">Fourth Above</option>
              <option value="5">Fifth Above</option>
              <option value="6">Sixth Above</option>
              <option value="-6">Sixth Below</option>
            </select>
          </div>

          {/* Generate new melody button */}
          <button
            onClick={() => {
              onNewMelody();
              onClose();
            }}
            className="w-full bg-[#fff1dc] hover:bg-[#ffe8c8] text-[#1b354e] font-medium py-2 px-4 rounded transition-colors"
          >
            Generate New Melody
          </button>
        </div>
      </div>
    </>
  );
}
