'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { getAllSongs, getAllSetlists, type Song, type Setlist } from '@/lib/db';

export default function SetlistDashboard() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [songsData, setlistsData] = await Promise.all([
        getAllSongs(),
        getAllSetlists(),
      ]);
      setSongs(songsData);
      setSetlists(setlistsData);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="setlist-page min-h-screen p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo className="text-2xl" />
        </Link>
        <Link
          href="/harmony"
          className="text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          Harmony Trainer
        </Link>
      </header>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-8">Setlist Manager</h1>

      {loading ? (
        <div className="text-center py-12 opacity-60">Loading...</div>
      ) : (
        <div className="grid gap-8">
          {/* Quick Actions */}
          <section className="grid grid-cols-2 gap-4">
            <Link
              href="/setlist/songs/import"
              className="bg-primary text-secondary p-4 rounded-lg text-center font-semibold hover:opacity-90 transition-opacity"
            >
              + Import Song
            </Link>
            <Link
              href="/setlist/create"
              className="bg-primary text-secondary p-4 rounded-lg text-center font-semibold hover:opacity-90 transition-opacity"
            >
              + New Setlist
            </Link>
          </section>

          {/* Recent Setlists */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Setlists</h2>
              {setlists.length > 3 && (
                <Link href="/setlist/all" className="text-sm opacity-60 hover:opacity-100">
                  View all
                </Link>
              )}
            </div>
            {setlists.length === 0 ? (
              <div className="bg-primary/5 rounded-lg p-6 text-center">
                <p className="opacity-60 mb-4">No setlists yet</p>
                <Link
                  href="/setlist/create"
                  className="text-primary font-semibold hover:underline"
                >
                  Create your first setlist
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {setlists.slice(0, 3).map((setlist) => (
                  <Link
                    key={setlist.id}
                    href={`/setlist/${setlist.id}`}
                    className="bg-primary/5 hover:bg-primary/10 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{setlist.name}</h3>
                        <p className="text-sm opacity-60">
                          {setlist.date} {setlist.time && `• ${setlist.time}`}
                        </p>
                      </div>
                      <div className="text-sm opacity-60">
                        {setlist.songs.length} song{setlist.songs.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Song Library */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Song Library</h2>
              <Link href="/setlist/songs" className="text-sm opacity-60 hover:opacity-100">
                View all ({songs.length})
              </Link>
            </div>
            {songs.length === 0 ? (
              <div className="bg-primary/5 rounded-lg p-6 text-center">
                <p className="opacity-60 mb-4">No songs yet</p>
                <Link
                  href="/setlist/songs/import"
                  className="text-primary font-semibold hover:underline"
                >
                  Import your first song
                </Link>
              </div>
            ) : (
              <div className="grid gap-2">
                {songs.slice(0, 5).map((song) => (
                  <Link
                    key={song.id}
                    href={`/setlist/songs/${song.id}`}
                    className="bg-primary/5 hover:bg-primary/10 rounded-lg p-3 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium">{song.title}</span>
                      <span className="text-sm opacity-60 ml-2">{song.artist}</span>
                    </div>
                    <span className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">
                      {song.key}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
