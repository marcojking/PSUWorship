'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { getSong, updateSong, deleteSong, type Song, type Section, type ChordLine } from '@/lib/db';
import { ALL_KEYS } from '@/lib/chords/transposition';

interface PageProps {
  params: Promise<{ id: string }>;
}

const SECTION_TYPES: Section['type'][] = [
  'intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'instrumental', 'outro', 'tag'
];

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

  // Section management
  const addSection = () => {
    const newSection: Section = {
      type: 'verse',
      label: `Verse ${sections.filter(s => s.type === 'verse').length + 1}`,
      lines: [{ lyrics: '', chords: [] }],
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (index: number, updates: Partial<Section>) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], ...updates };
    setSections(newSections);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
  };

  // Line management
  const addLine = (sectionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].lines.push({ lyrics: '', chords: [] });
    setSections(newSections);
  };

  const updateLine = (sectionIndex: number, lineIndex: number, updates: Partial<ChordLine>) => {
    const newSections = [...sections];
    newSections[sectionIndex].lines[lineIndex] = {
      ...newSections[sectionIndex].lines[lineIndex],
      ...updates,
    };
    setSections(newSections);
  };

  const removeLine = (sectionIndex: number, lineIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].lines = newSections[sectionIndex].lines.filter((_, i) => i !== lineIndex);
    setSections(newSections);
  };

  // Parse chord input string into chord positions
  const parseChordsInput = (input: string, lyrics: string): { chord: string; position: number }[] => {
    if (!input.trim()) return [];

    const chords: { chord: string; position: number }[] = [];
    const tokens = input.trim().split(/\s+/);
    let position = 0;

    for (const token of tokens) {
      chords.push({ chord: token, position });
      // Space out chords based on lyrics length
      position += Math.max(token.length + 2, Math.floor(lyrics.length / tokens.length));
    }

    return chords;
  };

  // Format chords for display in input
  const formatChordsForInput = (chords: { chord: string; position: number }[]): string => {
    return chords.map(c => c.chord).join(' ');
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

      {/* Sections */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sections</h2>
          <button
            onClick={addSection}
            className="text-sm bg-primary text-secondary px-3 py-1 rounded-lg hover:opacity-90"
          >
            + Add Section
          </button>
        </div>

        {sections.map((section, sIdx) => (
          <div key={sIdx} className="bg-white border border-primary/10 rounded-lg mb-4 overflow-hidden">
            {/* Section Header */}
            <div className="bg-primary/5 p-3 flex items-center gap-3">
              <select
                value={section.type}
                onChange={(e) => updateSection(sIdx, { type: e.target.value as Section['type'] })}
                className="bg-white border border-primary/20 rounded px-2 py-1 text-sm"
              >
                {SECTION_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={section.label}
                onChange={(e) => updateSection(sIdx, { label: e.target.value })}
                className="flex-1 bg-white border border-primary/20 rounded px-2 py-1 text-sm font-medium"
                placeholder="Section label"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => moveSection(sIdx, 'up')}
                  disabled={sIdx === 0}
                  className="p-1 text-primary/60 hover:text-primary disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveSection(sIdx, 'down')}
                  disabled={sIdx === sections.length - 1}
                  className="p-1 text-primary/60 hover:text-primary disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeSection(sIdx)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Delete section"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Lines */}
            <div className="p-3 space-y-3">
              {section.lines.map((line, lIdx) => (
                <div key={lIdx} className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={formatChordsForInput(line.chords)}
                      onChange={(e) => updateLine(sIdx, lIdx, {
                        chords: parseChordsInput(e.target.value, line.lyrics)
                      })}
                      placeholder="Chords (e.g., G C Em D)"
                      className="w-full bg-primary/5 border-0 rounded px-2 py-1 text-sm font-mono text-primary font-bold"
                    />
                    <input
                      type="text"
                      value={line.lyrics}
                      onChange={(e) => updateLine(sIdx, lIdx, { lyrics: e.target.value })}
                      placeholder="Lyrics"
                      className="w-full bg-white border border-primary/10 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeLine(sIdx, lIdx)}
                    className="text-red-400 hover:text-red-600 px-2"
                    title="Delete line"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => addLine(sIdx)}
                className="text-sm text-primary/60 hover:text-primary"
              >
                + Add line
              </button>
            </div>
          </div>
        ))}
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
