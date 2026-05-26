'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import Logo from '@/components/Logo';
import ChordChart from '@/components/setlist/ChordChart';
import SlidePreview from '@/components/setlist/SlidePreview';
import ExportModal from '@/components/setlist/ExportModal';
import { type SongWithKey, type Section, type Id } from '@/lib/db';
import { ALL_KEYS } from '@/lib/chords/transposition';
import { songToSlides, sectionSlideGroups } from '@/lib/live/slides';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SetlistDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const data = useQuery(api.setlists.getWithSongs, { id: id as Id<'setlists'> });
  const updateSetlist = useMutation(api.setlists.update);
  const updateSong = useMutation(api.songs.update);
  const deleteSetlist = useMutation(api.setlists.remove);
  const pushLive = useMutation(api.liveSetlist.push);

  const [showExport, setShowExport] = useState(false);
  const [expandedSong, setExpandedSong] = useState<Id<'songs'> | null>(null);
  const [songView, setSongView] = useState<'slides' | 'chords'>('slides');
  const [pushing, setPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const loading = data === undefined;
  const setlist = data?.setlist ?? null;
  const songs: SongWithKey[] = data?.songs ?? [];

  const handlePushToLive = async () => {
    if (!setlist || songs.length === 0) return;
    setPushing(true);
    setPushStatus('idle');
    try {
      await pushLive({
        name: setlist.name,
        songs: songs.map(song => ({
          title: song.title,
          key:   song.transposedKey ?? song.key,
          slides: songToSlides(song.sections, song.key, song.transposedKey ?? song.key),
        }))
      });
      setPushStatus('success');
      setTimeout(() => setPushStatus('idle'), 3000);
    } catch {
      setPushStatus('error');
      setTimeout(() => setPushStatus('idle'), 4000);
    } finally {
      setPushing(false);
    }
  };

  const handleUpdateKey = async (songId: Id<'songs'>, newKey: string) => {
    if (!setlist) return;
    const updatedSongs = setlist.songs.map(s =>
      s.songId === songId ? { ...s, transposedKey: newKey } : s
    );
    await updateSetlist({ id: setlist._id, songs: updatedSongs });
  };

  const handleToggleBreak = async (
    song: SongWithKey,
    sectionIndex: number,
    lineIndex: number,
  ) => {
    const sections = JSON.parse(JSON.stringify(song.sections)) as Section[];
    const section = sections[sectionIndex];
    const groups = sectionSlideGroups(section);
    const boundaries = new Set<number>();
    groups.forEach((g, gi) => { if (gi > 0) boundaries.add(g[0]); });
    if (boundaries.has(lineIndex)) boundaries.delete(lineIndex);
    else boundaries.add(lineIndex);
    const newBreaks = [...boundaries].sort((a, b) => a - b);
    section.slideBreaks = newBreaks.length ? newBreaks : undefined;
    await updateSong({ id: song._id, sections });
  };

  const handleRemoveSong = async (songId: Id<'songs'>) => {
    if (!setlist) return;
    if (!confirm('Remove this song from the setlist?')) return;
    const updatedSongs = setlist.songs
      .filter(s => s.songId !== songId)
      .map((s, i) => ({ ...s, order: i }));
    await updateSetlist({ id: setlist._id, songs: updatedSongs });
  };

  const handleDelete = async () => {
    if (!setlist) return;
    if (!confirm(`Delete "${setlist.name}"? This cannot be undone.`)) return;
    await deleteSetlist({ id: setlist._id });
    router.push('/setlist');
  };

  const moveSong = async (fromIndex: number, toIndex: number) => {
    if (!setlist) return;
    const newSongs = [...setlist.songs];
    const [removed] = newSongs.splice(fromIndex, 1);
    newSongs.splice(toIndex, 0, removed);
    const updatedSongs = newSongs.map((s, i) => ({ ...s, order: i }));
    await updateSetlist({ id: setlist._id, songs: updatedSongs });
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
        <button
          onClick={handlePushToLive}
          disabled={pushing || songs.length === 0}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-40 ${
            pushStatus === 'success' ? 'bg-green-600 text-white' :
            pushStatus === 'error'   ? 'bg-red-600 text-white' :
            'bg-primary/10 border border-primary/20 hover:bg-primary/20'
          }`}
        >
          {pushing             ? 'Pushing...' :
           pushStatus === 'success' ? '✓ Live!' :
           pushStatus === 'error'   ? 'Failed' :
           '▶ Go Live'}
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
              const isExpanded = expandedSong === song._id;

              return (
                <div
                  key={song._id}
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
                      onClick={() => setExpandedSong(isExpanded ? null : song._id)}
                      className="flex-1 text-left"
                    >
                      <div className="font-semibold">{song.title}</div>
                      <div className="text-sm opacity-60">{song.artist}</div>
                    </button>

                    {/* Key Selector */}
                    <select
                      value={displayKey}
                      onChange={(e) => handleUpdateKey(song._id, e.target.value)}
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
                      onClick={() => handleRemoveSong(song._id)}
                      className="text-red-600 opacity-40 hover:opacity-100 text-lg"
                    >
                      ×
                    </button>
                  </div>

                  {/* Expanded view: slide layout editor or chord chart */}
                  {isExpanded && (
                    <div className="border-t border-primary/10 p-4 bg-white">
                      <div className="flex items-center gap-1 mb-4 text-xs">
                        <button
                          onClick={() => setSongView('slides')}
                          className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                            songView === 'slides' ? 'bg-primary text-secondary' : 'opacity-50 hover:opacity-100'
                          }`}
                        >
                          Slides
                        </button>
                        <button
                          onClick={() => setSongView('chords')}
                          className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                            songView === 'chords' ? 'bg-primary text-secondary' : 'opacity-50 hover:opacity-100'
                          }`}
                        >
                          Chords
                        </button>
                        {songView === 'slides' && (
                          <span className="ml-2 opacity-40">Tap a divider to split or merge projector pages</span>
                        )}
                      </div>

                      {songView === 'slides' ? (
                        <SlidePreview
                          sections={song.sections}
                          onToggleBreak={(secIdx, lineIdx) => handleToggleBreak(song, secIdx, lineIdx)}
                        />
                      ) : (
                        <ChordChart
                          sections={song.sections}
                          songKey={song.key}
                          displayKey={displayKey}
                          displayMode="letters"
                        />
                      )}
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
