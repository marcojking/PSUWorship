'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import VisualChordEditor from '@/components/setlist/VisualChordEditor';
import { getSong, updateSong, deleteSong, type Song, type Section } from '@/lib/db';
import { ALL_KEYS } from '@/lib/chords/transposition';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditSongPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [songKey, setSongKey] = useState('C');
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getSong(parseInt(id));
      if (data) {
        setSong(data);
        setTitle(data.title);
        setArtist(data.artist);
        setSongKey(data.key);
        setSections(JSON.parse(JSON.stringify(data.sections))); // Deep copy
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSave = async () => {
    if (!song) return;
    setSaving(true);

    try {
      await updateSong(song.id!, {
        title,
        artist,
        key: songKey,
        sections,
      });
      router.push(`/setlist/songs/${id}`);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!song) return;

    try {
      await deleteSong(song.id!);
      router.push('/setlist/songs');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete song');
    }
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

  return (
    <div className="setlist-page min-h-screen p-4 sm:p-6 max-w-4xl mx-auto pb-32">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <Link href={`/setlist/songs/${id}`} className="flex items-center gap-2">
          <span className="text-xl">←</span>
          <span className="font-medium">Cancel</span>
        </Link>
        <Logo />
      </header>

      <h1 className="text-2xl font-bold mb-6">Edit Song</h1>

      {/* Metadata */}
      <div className="bg-primary/5 rounded-lg p-4 mb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Key</label>
            <select
              value={songKey}
              onChange={(e) => setSongKey(e.target.value)}
              className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
            >
              {ALL_KEYS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium mb-1">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Visual Chord Editor */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Sections & Chords</h2>
        <VisualChordEditor
          sections={sections}
          songKey={songKey}
          onChange={setSections}
        />
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-600 hover:underline"
          >
            Delete this song
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm">Are you sure?</span>
            <button
              onClick={handleDelete}
              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-sm text-primary hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Fixed Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary/10 p-4">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Link
            href={`/setlist/songs/${id}`}
            className="flex-1 text-center py-3 border border-primary/20 rounded-lg hover:bg-primary/5"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-primary text-secondary py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
