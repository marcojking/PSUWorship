'use client';

import { useState } from 'react';

interface ControlBarProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  melodyVolume: number;
  onMelodyVolumeChange: (volume: number) => void;
  harmonyVolume: number;
  onHarmonyVolumeChange: (volume: number) => void;
  onSettingsClick: () => void;
  isLoading: boolean;
}

export default function ControlBar({
  isPlaying,
  onPlayPause,
  melodyVolume,
  onMelodyVolumeChange,
  harmonyVolume,
  onHarmonyVolumeChange,
  onSettingsClick,
  isLoading,
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 bg-gray-900 border-t border-gray-800">
      {/* Play/Pause button */}
      <button
        onClick={onPlayPause}
        disabled={isLoading}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : isPlaying ? (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-6 h-6 ml-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Volume sliders */}
      <div className="flex-1 flex items-center gap-6">
        {/* Melody volume */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 w-16">Melody</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={melodyVolume}
            onChange={(e) => onMelodyVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm text-gray-500 w-8">{Math.round(melodyVolume * 100)}%</span>
        </div>

        {/* Harmony volume */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-purple-400 w-16">Harmony</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={harmonyVolume}
            onChange={(e) => onHarmonyVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm text-gray-500 w-8">{Math.round(harmonyVolume * 100)}%</span>
        </div>
      </div>

      {/* Settings button */}
      <button
        onClick={onSettingsClick}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-800 transition-colors"
        aria-label="Settings"
      >
        <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>
    </div>
  );
}
