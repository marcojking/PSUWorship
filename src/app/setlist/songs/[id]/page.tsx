'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import ChordChart from '@/components/setlist/ChordChart';
import { getSong, updateSong, type Song } from '@/lib/db';
import { ALL_KEYS, getTranspositionInterval } from '@/lib/chords/transposition';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SongDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayKey, setDisplayKey] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<'letters' | 'numerals' | 'none'>('letters');

  useEffect(() => {
    async function load() {
      const data = await getSong(parseInt(id));
      if (data) {
        setSong(data);
        setDisplayKey(data.key);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleTranspose = (newKey: string) => {
    setDisplayKey(newKey);
  };

  const handleSaveTransposition = async () => {
    if (!song || displayKey === song.key) return;

    // We need to actually transpose all chords in the song
    // For now, just update the song key
    await updateSong(song.id!, { key: displayKey });
    setSong({ ...song, key: displayKey });
  };

  if (loading) {
    return (
      <div className="setlist-page min-h-screen p-4 flex items-center justify-center">
        <div className="opacity-60">Loading...</div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="setlist-page min-h-screen p-4 flex flex-col items-center justify-center">
        <p className="opacity-60 mb-4">Song not found</p>
        <Link href="/setlist/songs" className="text-primary hover:underline">
          Back to library
        </Link>
      </div>
    );
  }

  const isTransposed = displayKey !== song.key;
  const semitones = getTranspositionInterval(song.key, displayKey);

  return (
    <div className="setlist-page min-h-screen p-4 sm:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <Link href="/setlist/songs" className="flex items-center gap-2">
          <span className="text-xl">←</span>
          <Logo />
        </Link>
        <Link
          href={`/setlist/songs/${id}/edit`}
          className="text-sm text-primary font-semibold hover:underline"
        >
          Edit
        </Link>
      </header>

      {/* Song Info */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{song.title}</h1>
        <p className="opacity-60">{song.artist}</p>
      </div>

      {/* Controls */}
      <div className="bg-primary/5 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
        {/* Key / Transpose */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Key:</label>
          <select
            value={displayKey}
            onChange={(e) => handleTranspose(e.target.value)}
            className="bg-white border border-primary/20 rounded px-2 py-1 font-mono"
          >
            {ALL_KEYS.map(k => (
              <option key={k} value={k}>
                {k} {k === song.key ? '(original)' : `(${getTranspositionInterval(song.key, k) > 6 ? getTranspositionInterval(song.key, k) - 12 : getTranspositionInterval(song.key, k) > 0 ? '+' + getTranspositionInterval(song.key, k) : getTranspositionInterval(song.key, k)})`}
              </option>
            ))}
          </select>
          {isTransposed && (
            <button
              onClick={handleSaveTransposition}
              className="text-xs text-primary hover:underline"
            >
              Save as default
            </button>
          )}
        </div>

        {/* Display Mode */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Show:</label>
          <select
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value as 'letters' | 'numerals' | 'none')}
            className="bg-white border border-primary/20 rounded px-2 py-1"
          >
            <option value="letters">Letter Chords</option>
            <option value="numerals">Roman Numerals</option>
            <option value="none">Lyrics Only</option>
          </select>
        </div>
      </div>

      {/* Chord Chart */}
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-primary/10 overflow-x-auto">
        <ChordChart
          sections={song.sections}
          songKey={song.key}
          displayKey={displayKey}
          displayMode={displayMode}
        />
      </div>
    </div>
  );
}
