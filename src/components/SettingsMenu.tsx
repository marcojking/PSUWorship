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
      <div className="fixed bottom-20 right-4 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Voice type selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Voice Type</label>
            <select
              value={vocalRange}
              onChange={(e) => onVocalRangeChange(e.target.value as VocalRange)}
              className="w-full bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
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
            <label className="block text-sm text-gray-400 mb-1">Melody Type</label>
            <select
              value={melodyType}
              onChange={(e) => onMelodyTypeChange(e.target.value as MelodyType)}
              className="w-full bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
            >
              <option value="scale">Scale (up & down)</option>
              <option value="random">Random melody</option>
            </select>
          </div>

          {/* Key selector */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Key</label>
            <select
              value={selectedKey}
              onChange={(e) => onKeyChange(parseInt(e.target.value))}
              className="w-full bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
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
            <label className="block text-sm text-gray-400 mb-1">Scale</label>
            <select
              value={scaleType}
              onChange={(e) => onScaleTypeChange(e.target.value as ScaleType)}
              className="w-full bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
            >
              <option value="major">Major</option>
              <option value="minor">Natural Minor</option>
              <option value="harmonicMinor">Harmonic Minor</option>
              <option value="melodicMinor">Melodic Minor</option>
            </select>
          </div>

          {/* Tempo */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
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
            <label className="block text-sm text-gray-400 mb-1">
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
            <label className="block text-sm text-gray-400 mb-1">
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
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Simple</span>
              <span>Complex</span>
            </div>
          </div>

          {/* Harmony interval */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Harmony Type</label>
            <select
              value={harmonyInterval}
              onChange={(e) => onHarmonyIntervalChange(parseInt(e.target.value))}
              className="w-full bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
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
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Generate New Melody
          </button>
        </div>
      </div>
    </>
  );
}
