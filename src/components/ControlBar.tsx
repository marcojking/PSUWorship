'use client';

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

// Volume icon component
function VolumeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
    </svg>
  );
}

// Music note icon for melody
function MelodyIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

// Harmony icon (two notes)
function HarmonyIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm2-5.65V7h4v2h-2v5.35c-.63-.22-1.3-.35-2-.35s-1.37.13-2 .35z" />
    </svg>
  );
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
    <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3 bg-[#1b354e] border-t border-[#2a4a6a]">
      {/* Play/Pause button */}
      <button
        onClick={onPlayPause}
        disabled={isLoading}
        className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#fff1dc] text-[#1b354e] hover:bg-[#ffe8c8] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <svg className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : isPlaying ? (
          <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Volume sliders - compact on mobile */}
      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-6 min-w-0">
        {/* Melody volume */}
        <div className="flex items-center gap-1 sm:gap-2">
          <MelodyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#fff1dc] flex-shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={melodyVolume}
            onChange={(e) => onMelodyVolumeChange(parseFloat(e.target.value))}
            className="w-16 sm:w-24 h-2 bg-[#2a4a6a] rounded-lg appearance-none cursor-pointer slider"
            aria-label="Melody volume"
          />
        </div>

        {/* Harmony volume */}
        <div className="flex items-center gap-1 sm:gap-2">
          <HarmonyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#fff1dc] flex-shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={harmonyVolume}
            onChange={(e) => onHarmonyVolumeChange(parseFloat(e.target.value))}
            className="w-16 sm:w-24 h-2 bg-[#2a4a6a] rounded-lg appearance-none cursor-pointer slider"
            aria-label="Harmony volume"
          />
        </div>
      </div>

      {/* Settings button */}
      <button
        onClick={onSettingsClick}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#2a4a6a] transition-colors flex-shrink-0"
        aria-label="Settings"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#fff1dc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>
    </div>
  );
}
