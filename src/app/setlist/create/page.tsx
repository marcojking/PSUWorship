'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { getAllSongs, addSetlist, type Song, type SetlistSong } from '@/lib/db';
import { ALL_KEYS } from '@/lib/chords/transposition';

export default function CreateSetlistPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<SetlistSong[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const data = await getAllSongs();
      setSongs(data);
      setLoading(false);
    }
    load();
  }, []);

  const addSongToSetlist = (songId: number) => {
    if (selectedSongs.find(s => s.songId === songId)) return;
    setSelectedSongs([
      ...selectedSongs,
      { songId, order: selectedSongs.length },
    ]);
  };

  const removeSongFromSetlist = (songId: number) => {
    setSelectedSongs(
      selectedSongs
        .filter(s => s.songId !== songId)
        .map((s, i) => ({ ...s, order: i }))
    );
  };

  const updateSongKey = (songId: number, key: string) => {
    setSelectedSongs(
      selectedSongs.map(s =>
        s.songId === songId ? { ...s, transposedKey: key } : s
      )
    );
  };

  const moveSong = (fromIndex: number, toIndex: number) => {
    const newSongs = [...selectedSongs];
    const [removed] = newSongs.splice(fromIndex, 1);
    newSongs.splice(toIndex, 0, removed);
    setSelectedSongs(newSongs.map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a setlist name');
      return;
    }

    const id = await addSetlist({
      name: name.trim(),
      date,
      time,
      location,
      bibleVerse: bibleVerse.trim() || undefined,
      songs: selectedSongs,
    });

    router.push(`/setlist/${id}`);
  };

  const filteredSongs = songs.filter(song =>
    !selectedSongs.find(s => s.songId === song.id) &&
    (song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.artist.toLowerCase().includes(search.toLowerCase()))
  );

  const getSongById = (id: number) => songs.find(s => s.id === id);

  return (
    <div className="setlist-page min-h-screen p-4 sm:p-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <Link href="/setlist" className="flex items-center gap-2">
          <span className="text-xl">←</span>
          <Logo />
        </Link>
      </header>

      <h1 className="text-2xl font-bold mb-6">New Setlist</h1>

      {/* Event Details */}
      <div className="bg-primary/5 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-4">Event Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sunday Morning Worship"
              className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g., 8:00 PM"
              className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., 143 W. Park Ave."
              className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Bible Verse (for pamphlet back)</label>
            <textarea
              value={bibleVerse}
              onChange={(e) => setBibleVerse(e.target.value)}
              placeholder="e.g., John 3:16 - For God so loved the world..."
              rows={3}
              className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Selected Songs */}
      <div className="mb-6">
        <h2 className="font-semibold mb-4">
          Songs ({selectedSongs.length})
        </h2>

        {selectedSongs.length === 0 ? (
          <div className="bg-primary/5 rounded-lg p-6 text-center opacity-60">
            No songs added yet. Search below to add songs.
          </div>
        ) : (
          <div className="bg-primary/5 rounded-lg divide-y divide-primary/10">
            {selectedSongs.map((setlistSong, index) => {
              const song = getSongById(setlistSong.songId);
              if (!song) return null;

              return (
                <div
                  key={setlistSong.songId}
                  className="p-3 flex items-center gap-3"
                >
                  {/* Drag handle / Order */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => index > 0 && moveSong(index, index - 1)}
                      disabled={index === 0}
                      className="text-xs opacity-40 hover:opacity-100 disabled:opacity-20"
                    >
                      ▲
                    </button>
                    <span className="text-sm font-mono w-6 text-center">
                      {index + 1}
                    </span>
                    <button
                      onClick={() => index < selectedSongs.length - 1 && moveSong(index, index + 1)}
                      disabled={index === selectedSongs.length - 1}
                      className="text-xs opacity-40 hover:opacity-100 disabled:opacity-20"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Song Info */}
                  <div className="flex-1">
                    <div className="font-medium">{song.title}</div>
                    <div className="text-sm opacity-60">{song.artist}</div>
                  </div>

                  {/* Key Selector */}
                  <select
                    value={setlistSong.transposedKey || song.key}
                    onChange={(e) => updateSongKey(song.id!, e.target.value)}
                    className="bg-white border border-primary/20 rounded px-2 py-1 text-sm font-mono"
                  >
                    {ALL_KEYS.map(k => (
                      <option key={k} value={k}>
                        {k} {k === song.key && '(orig)'}
                      </option>
                    ))}
                  </select>

                  {/* Remove */}
                  <button
                    onClick={() => removeSongFromSetlist(song.id!)}
                    className="text-red-600 opacity-60 hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Songs */}
      <div className="mb-6">
        <h2 className="font-semibold mb-4">Add Songs</h2>

        <input
          type="text"
          placeholder="Search your library..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-primary/20 rounded-lg px-4 py-2 mb-4"
        />

        {loading ? (
          <div className="text-center py-8 opacity-60">Loading songs...</div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-8 opacity-60">
            {songs.length === 0 ? (
              <Link href="/setlist/songs/import" className="text-primary hover:underline">
                Import songs first
              </Link>
            ) : selectedSongs.length === songs.length ? (
              'All songs added'
            ) : (
              'No matching songs'
            )}
          </div>
        ) : (
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {filteredSongs.slice(0, 10).map((song) => (
              <button
                key={song.id}
                onClick={() => addSongToSetlist(song.id!)}
                className="bg-white border border-primary/20 hover:border-primary/40 rounded-lg p-3 text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-medium">{song.title}</div>
                  <div className="text-sm opacity-60">{song.artist}</div>
                </div>
                <span className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">
                  {song.key}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-primary/10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full bg-primary text-secondary py-3 rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            Create Setlist
          </button>
        </div>
      </div>
    </div>
  );
}
