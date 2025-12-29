'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import ChordChart from '@/components/setlist/ChordChart';
import ExportModal from '@/components/setlist/ExportModal';
import { getSetlistWithSongs, updateSetlist, deleteSetlist, type Song, type Setlist } from '@/lib/db';
import { ALL_KEYS } from '@/lib/chords/transposition';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SetlistDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [songs, setSongs] = useState<(Song & { transposedKey?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [expandedSong, setExpandedSong] = useState<number | null>(null);

  useEffect(() => {
    loadSetlist();
  }, [id]);

  async function loadSetlist() {
    const data = await getSetlistWithSongs(parseInt(id));
    if (data) {
      setSetlist(data.setlist);
      setSongs(data.songs);
    }
    setLoading(false);
  }

  const handleUpdateKey = async (songId: number, newKey: string) => {
    if (!setlist) return;

    const updatedSongs = setlist.songs.map(s =>
      s.songId === songId ? { ...s, transposedKey: newKey } : s
    );

    await updateSetlist(setlist.id!, { songs: updatedSongs });
    loadSetlist();
  };

  const handleRemoveSong = async (songId: number) => {
    if (!setlist) return;
    if (!confirm('Remove this song from the setlist?')) return;

    const updatedSongs = setlist.songs
      .filter(s => s.songId !== songId)
      .map((s, i) => ({ ...s, order: i }));

    await updateSetlist(setlist.id!, { songs: updatedSongs });
    loadSetlist();
  };

  const handleDelete = async () => {
    if (!setlist) return;
    if (!confirm(`Delete "${setlist.name}"? This cannot be undone.`)) return;

    await deleteSetlist(setlist.id!);
    router.push('/setlist');
  };

  const moveSong = async (fromIndex: number, toIndex: number) => {
    if (!setlist) return;

    const newSongs = [...setlist.songs];
    const [removed] = newSongs.splice(fromIndex, 1);
    newSongs.splice(toIndex, 0, removed);

    const updatedSongs = newSongs.map((s, i) => ({ ...s, order: i }));
    await updateSetlist(setlist.id!, { songs: updatedSongs });
    loadSetlist();
  };

  if (loading) {
    return (
      <div className="setlist-page min-h-screen p-4 flex items-center justify-center">
        <div className="opacity-60">Loading...</div>
      </div>
    );
  }

  if (!setlist) {
    return (
      <div className="setlist-page min-h-screen p-4 flex flex-col items-center justify-center">
        <p className="opacity-60 mb-4">Setlist not found</p>
        <Link href="/setlist" className="text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="setlist-page min-h-screen p-4 sm:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <Link href="/setlist" className="flex items-center gap-2">
          <span className="text-xl">←</span>
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={`/setlist/${id}/perform`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Perform
          </Link>
          <button
            onClick={handleDelete}
            className="text-sm text-red-600 opacity-60 hover:opacity-100"
          >
            Delete
          </button>
        </div>
      </header>

      {/* Setlist Info */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{setlist.name}</h1>
        <p className="opacity-60">
          {formatDate(setlist.date)}
          {setlist.time && ` • ${setlist.time}`}
        </p>
        {setlist.location && (
          <p className="opacity-60">{setlist.location}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowExport(true)}
          className="flex-1 bg-primary text-secondary py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Export
        </button>
        <Link
          href={`/setlist/${id}/edit`}
          className="px-6 py-3 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
        >
          Edit
        </Link>
      </div>

      {/* Songs */}
      <div className="mb-6">
        <h2 className="font-semibold mb-4">Songs ({songs.length})</h2>

        {songs.length === 0 ? (
          <div className="bg-primary/5 rounded-lg p-6 text-center">
            <p className="opacity-60 mb-4">No songs in this setlist</p>
            <Link
              href={`/setlist/${id}/edit`}
              className="text-primary font-semibold hover:underline"
            >
              Add songs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {songs.map((song, index) => {
              const displayKey = song.transposedKey || song.key;
              const isExpanded = expandedSong === song.id;

              return (
                <div
                  key={song.id}
                  className="bg-primary/5 rounded-lg overflow-hidden"
                >
                  {/* Song Header */}
                  <div className="p-4 flex items-center gap-3">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => index > 0 && moveSong(index, index - 1)}
                        disabled={index === 0}
                        className="text-xs opacity-40 hover:opacity-100 disabled:opacity-20"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => index < songs.length - 1 && moveSong(index, index + 1)}
                        disabled={index === songs.length - 1}
                        className="text-xs opacity-40 hover:opacity-100 disabled:opacity-20"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Number */}
                    <span className="text-lg font-mono w-8">{index + 1}.</span>

                    {/* Song Info */}
                    <button
                      onClick={() => setExpandedSong(isExpanded ? null : song.id!)}
                      className="flex-1 text-left"
                    >
                      <div className="font-semibold">{song.title}</div>
                      <div className="text-sm opacity-60">{song.artist}</div>
                    </button>

                    {/* Key Selector */}
                    <select
                      value={displayKey}
                      onChange={(e) => handleUpdateKey(song.id!, e.target.value)}
                      className="bg-white border border-primary/20 rounded px-2 py-1 text-sm font-mono"
                    >
                      {ALL_KEYS.map(k => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemoveSong(song.id!)}
                      className="text-red-600 opacity-40 hover:opacity-100 text-lg"
                    >
                      ×
                    </button>
                  </div>

                  {/* Expanded Chord Chart */}
                  {isExpanded && (
                    <div className="border-t border-primary/10 p-4 bg-white">
                      <ChordChart
                        sections={song.sections}
                        songKey={song.key}
                        displayKey={displayKey}
                        displayMode="letters"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          setlist={setlist}
          songs={songs}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
