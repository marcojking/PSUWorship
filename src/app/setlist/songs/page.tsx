'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { getAllSongs, deleteSong, type Song } from '@/lib/db';
import { useSync } from '@/hooks/useSync';

export default function SongsLibraryPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { status, sync } = useSync();

  useEffect(() => {
    loadSongs();
  }, []);

  // Sync on mount and reload songs after
  useEffect(() => {
    if (status.isConfigured && !status.isSyncing) {
      sync().then(() => loadSongs());
    }
  }, [status.isConfigured]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadSongs() {
    const data = await getAllSongs();
    setSongs(data);
    setLoading(false);
  }

  async function handleDelete(id: number, title: string) {
    if (confirm(`Delete "${title}"?`)) {
      await deleteSong(id);
      loadSongs();
    }
  }

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(search.toLowerCase()) ||
    song.artist.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="setlist-page min-h-screen p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <Link href="/setlist" className="flex items-center gap-2">
          <span className="text-xl">←</span>
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          {status.isConfigured && (
            <button
              onClick={() => sync().then(() => loadSongs())}
              disabled={status.isSyncing}
              className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
              title={status.lastSyncedAt ? `Last synced: ${status.lastSyncedAt.toLocaleTimeString()}` : 'Sync with Airtable'}
            >
              <span className={status.isSyncing ? 'animate-spin' : ''}>⟳</span>
              {status.isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          )}
          <Link
            href="/setlist/songs/import"
            className="bg-primary text-secondary px-4 py-2 rounded-lg text-sm font-semibold"
          >
            + Import
          </Link>
        </div>
      </header>

      <h1 className="text-2xl font-bold mb-6">Song Library</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-primary/20 rounded-lg px-4 py-3"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 opacity-60">Loading...</div>
      ) : filteredSongs.length === 0 ? (
        <div className="bg-primary/5 rounded-lg p-8 text-center">
          {songs.length === 0 ? (
            <>
              <p className="opacity-60 mb-4">No songs in your library</p>
              <Link
                href="/setlist/songs/import"
                className="text-primary font-semibold hover:underline"
              >
                Import your first song
              </Link>
            </>
          ) : (
            <p className="opacity-60">No songs match "{search}"</p>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className="bg-primary/5 hover:bg-primary/10 rounded-lg p-4 transition-colors flex items-center justify-between group"
            >
              <Link
                href={`/setlist/songs/${song.id}`}
                className="flex-1"
              >
                <div className="font-semibold">{song.title}</div>
                <div className="text-sm opacity-60">{song.artist}</div>
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">
                  {song.key}
                </span>
                <button
                  onClick={() => handleDelete(song.id!, song.title)}
                  className="opacity-0 group-hover:opacity-60 hover:opacity-100 text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
