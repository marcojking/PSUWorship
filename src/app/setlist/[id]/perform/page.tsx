'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getSetlistWithSongs, type Song, type Setlist } from '@/lib/db';
import ChordChart from '@/components/setlist/ChordChart';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PerformPage({ params }: PageProps) {
  const { id } = use(params);
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [songs, setSongs] = useState<(Song & { transposedKey?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState<'letters' | 'numerals'>('letters');
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getSetlistWithSongs(parseInt(id));
      if (data) {
        setSetlist(data.setlist);
        setSongs(data.songs);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentIndex(i => Math.min(i + 1, songs.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Escape') {
        setShowControls(c => !c);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [songs.length]);

  // Hide controls after inactivity
  useEffect(() => {
    if (!showControls) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [showControls]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="opacity-60">Loading...</div>
      </div>
    );
  }

  if (!setlist || songs.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <p className="opacity-60 mb-4">No songs to perform</p>
        <Link href={`/setlist/${id}`} className="text-primary hover:underline">
          Back to setlist
        </Link>
      </div>
    );
  }

  const currentSong = songs[currentIndex];
  const displayKey = currentSong.transposedKey || currentSong.key;

  return (
    <div
      className="min-h-screen bg-white text-gray-900 overflow-auto"
      onClick={() => setShowControls(true)}
      onTouchStart={() => setShowControls(true)}
    >
      {/* Top Bar (shows on hover/tap) */}
      <div
        className={`fixed top-0 left-0 right-0 bg-white/95 backdrop-blur border-b z-50 transition-transform ${
          showControls ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Link
            href={`/setlist/${id}`}
            className="text-primary font-medium"
          >
            ← Exit
          </Link>

          <div className="text-center">
            <div className="font-bold">{currentSong.title}</div>
            <div className="text-sm opacity-60">
              Key: {displayKey} • Song {currentIndex + 1} of {songs.length}
            </div>
          </div>

          <select
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as 'letters' | 'numerals')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="letters">Letters</option>
            <option value="numerals">Numerals</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-8 pt-20 pb-24 max-w-4xl mx-auto">
        <ChordChart
          sections={currentSong.sections}
          songKey={currentSong.key}
          displayKey={displayKey}
          displayMode={displayMode}
        />
      </div>

      {/* Bottom Navigation (shows on hover/tap) */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t z-50 transition-transform ${
          showControls ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <button
            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
            className="px-6 py-3 bg-primary/10 rounded-lg font-medium disabled:opacity-30"
          >
            ← Previous
          </button>

          {/* Song dots */}
          <div className="flex gap-2">
            {songs.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-primary' : 'bg-primary/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIndex(i => Math.min(i + 1, songs.length - 1))}
            disabled={currentIndex === songs.length - 1}
            className="px-6 py-3 bg-primary/10 rounded-lg font-medium disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Swipe areas for mobile */}
      <div
        className="fixed left-0 top-0 bottom-0 w-16 z-40"
        onClick={() => currentIndex > 0 && setCurrentIndex(i => i - 1)}
      />
      <div
        className="fixed right-0 top-0 bottom-0 w-16 z-40"
        onClick={() => currentIndex < songs.length - 1 && setCurrentIndex(i => i + 1)}
      />
    </div>
  );
}
