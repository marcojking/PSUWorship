'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import Logo from '@/components/Logo';
import { getLegacySongs, getLegacySetlists } from '@/lib/legacy-dexie';

type Phase = 'idle' | 'running' | 'done' | 'error';

export default function MigratePage() {
  const existingSongs = useQuery(api.songs.list);
  const createSong = useMutation(api.songs.create);
  const createSetlist = useMutation(api.setlists.create);

  const [phase, setPhase] = useState<Phase>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [counts, setCounts] = useState({ songs: 0, setlists: 0, skipped: 0 });

  const alreadyHasData = (existingSongs?.length ?? 0) > 0;

  const append = (line: string) => setLog(prev => [...prev, line]);

  const runMigration = async () => {
    setPhase('running');
    setLog([]);
    try {
      const songs = await getLegacySongs();
      append(`Found ${songs.length} songs in local storage.`);
      const idMap = new Map<number, Id<'songs'>>();
      let songCount = 0;
      for (const song of songs) {
        const newId = await createSong({
          title: song.title,
          artist: song.artist,
          key: song.key,
          sections: song.sections,
        });
        if (song.id !== undefined) idMap.set(song.id, newId);
        songCount++;
        append(`  ✓ ${song.title}`);
      }

      const setlists = await getLegacySetlists();
      append(`Found ${setlists.length} setlists.`);
      let setlistCount = 0;
      let skipped = 0;
      for (const setlist of setlists) {
        const mapped: { songId: Id<'songs'>; transposedKey?: string; order: number }[] = [];
        for (const s of setlist.songs) {
          const newId = idMap.get(s.songId);
          if (!newId) { skipped++; continue; }
          mapped.push({ songId: newId, transposedKey: s.transposedKey, order: s.order });
        }

        await createSetlist({
          name: setlist.name,
          date: setlist.date,
          time: setlist.time,
          location: setlist.location,
          bibleVerse: setlist.bibleVerse,
          songs: mapped,
        });
        setlistCount++;
        append(`  ✓ ${setlist.name} (${mapped.length} songs)`);
      }

      setCounts({ songs: songCount, setlists: setlistCount, skipped });
      localStorage.setItem('wma-migrated', new Date().toISOString());
      setPhase('done');
    } catch (err) {
      append(`ERROR: ${(err as Error).message}`);
      setPhase('error');
    }
  };

  return (
    <div className="setlist-page min-h-screen p-4 sm:p-6 max-w-2xl mx-auto pb-24">
      <header className="flex items-center justify-between mb-6">
        <Link href="/setlist" className="flex items-center gap-2">
          <span className="text-xl">←</span>
          <Logo />
        </Link>
      </header>

      <h1 className="text-2xl font-bold mb-2">Migrate to Convex</h1>
      <p className="opacity-60 mb-6 text-sm">
        Copies your songs and setlists from this browser&apos;s local storage into the
        Convex cloud database. Run this once, while online.
      </p>

      {alreadyHasData && phase === 'idle' && (
        <div className="bg-amber-400/15 text-amber-700 rounded-lg p-4 mb-6 text-sm">
          Convex already has {existingSongs?.length} songs. Running again will create
          duplicates — only proceed if you know this database is empty/stale.
        </div>
      )}

      <button
        onClick={runMigration}
        disabled={phase === 'running'}
        className="bg-primary text-secondary px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 mb-6"
      >
        {phase === 'running' ? 'Migrating…' :
         phase === 'done'    ? 'Run again' :
         'Start migration'}
      </button>

      {phase === 'done' && (
        <div className="bg-green-600/10 text-green-700 rounded-lg p-4 mb-6 text-sm">
          Done — migrated {counts.songs} songs and {counts.setlists} setlists
          {counts.skipped > 0 && ` (${counts.skipped} song references skipped: song not found)`}.
          Verify your data on the <Link href="/setlist" className="underline">setlist dashboard</Link>.
        </div>
      )}

      {log.length > 0 && (
        <pre className="bg-primary/5 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap max-h-96 overflow-auto">
          {log.join('\n')}
        </pre>
      )}
    </div>
  );
}
