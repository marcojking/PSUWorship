'use client';

import Link from 'next/link';
import { useId, useMemo, useState, type ReactNode } from 'react';
import type { PlayerView, PracticeSong, SetEntry } from '@/lib/music/setlist/types';
import { capoLabel, shapeKeyFor } from '@/lib/music/setlist/shapes';
import ChordChartView from './ChordChartView';

// Nobody wants to read a chart in Eb or Db shapes on an acoustic, so the
// override list only offers positions that land on a natural letter. Seven is
// as high as a capo is worth putting.
const MAX_OFFSET_OFFERED = 7;

// Mirrors the guard in shapes.ts. Chart data is ours, but a bad capo value
// would throw out of every chord in the card rather than just that option.
function isUsableCapo(capo: number): boolean {
  return Number.isInteger(capo) && capo >= -12 && capo <= 12;
}

function defaultCapoFor(player: PlayerView, song: PracticeSong): number {
  const capo = player.capoByKey[song.concertKey] ?? 0;
  return isUsableCapo(capo) ? capo : 0;
}

/**
 * Capo positions worth offering for this song and player, always including the
 * player's own default even if it lands on an accidental. A guitar capo reads
 * BELOW concert (positive); a keyboard transpose reads ABOVE it (negative).
 */
function capoOptions(
  concertKey: string,
  instrument: PlayerView['instrument'],
  defaultCapo: number,
): number[] {
  const direction = instrument === 'piano' ? -1 : 1;
  const options = new Set<number>([0, defaultCapo]);
  for (let step = 1; step <= MAX_OFFSET_OFFERED; step += 1) {
    const capo = step * direction;
    if (shapeKeyFor(concertKey, capo).length === 1) options.add(capo);
  }
  return [...options].sort((a, b) => Math.abs(a) - Math.abs(b));
}

function optionLabel(
  concertKey: string,
  capo: number,
  instrument: PlayerView['instrument'],
): string {
  const shapes = shapeKeyFor(concertKey, capo);
  if (instrument === 'piano') {
    return capo === 0 ? `Concert pitch · read ${shapes}` : `${capoLabel(capo)} · read ${shapes}`;
  }
  return capo === 0 ? `No capo · ${shapes} shapes` : `${capoLabel(capo)} · ${shapes} shapes`;
}

function keyLine(
  song: PracticeSong,
  capo: number,
  instrument: PlayerView['instrument'],
): string {
  const base = `Key of ${song.concertKey}`;
  if (capo === 0) return instrument === 'piano' ? `${base} · concert pitch` : base;
  const shapes = shapeKeyFor(song.concertKey, capo);
  return instrument === 'piano'
    ? `${base} · ${capoLabel(capo)} · read ${shapes}`
    : `${base} · ${capoLabel(capo)} · play ${shapes} shapes`;
}

function Card({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <article
      className={`rounded-xl border border-foreground/15 p-4 sm:p-5 ${
        muted ? 'bg-white/30' : 'bg-white/60'
      }`}
    >
      {children}
    </article>
  );
}

function Meta({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-snug text-foreground/55">{children}</p>;
}

/**
 * One song with its own capo state. Keyed on the player by the caller, so
 * switching players drops any override back to that player's default.
 */
function SongBlock({ song, player }: { song: PracticeSong; player: PlayerView }) {
  const initialCapo = defaultCapoFor(player, song);
  const [capo, setCapo] = useState(initialCapo);
  const options = useMemo(
    () => capoOptions(song.concertKey, player.instrument, initialCapo),
    [song.concertKey, player.instrument, initialCapo],
  );
  const selectId = useId();

  return (
    <div>
      <header className="mb-3">
        <h3 className="text-xl font-semibold leading-tight">{song.title}</h3>
        <Meta>
          {song.artist}
          {song.lead ? ` · ${song.lead}` : ''}
          {song.tempo ? ` · ${song.tempo} bpm` : ''}
        </Meta>
        <p className="mt-1 text-base font-medium text-foreground/80">
          {keyLine(song, capo, player.instrument)}
        </p>
        {song.lyricsNote && <Meta>{song.lyricsNote}</Meta>}
        {player.hint && <Meta>{player.hint}</Meta>}

        <div className="mt-3">
          <label htmlFor={selectId} className="sr-only">
            {player.instrument === 'piano'
              ? `Read ${song.title} in a different key`
              : `Capo position for ${song.title}`}
          </label>
          <select
            id={selectId}
            value={capo}
            // shapeKeyFor/displayChord throw on an invalid capo, and they run
            // during render — so nothing outside this list is allowed through,
            // whatever the event carries.
            onChange={(e) => {
              const next = Number(e.target.value);
              if (options.includes(next)) setCapo(next);
            }}
            className="w-full rounded-lg border border-foreground/25 bg-background px-3 py-2 text-base text-foreground sm:w-auto"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {optionLabel(song.concertKey, option, player.instrument)}
              </option>
            ))}
          </select>
        </div>
      </header>

      <ChordChartView song={song} capo={capo} />

      {song.sourceNote && <p className="mt-3 text-xs text-foreground/45">{song.sourceNote}</p>}
    </div>
  );
}

export default function SongCard({ entry, player }: { entry: SetEntry; player: PlayerView }) {
  if (entry.kind === 'link') {
    return (
      <Card>
        <h3 className="text-xl font-semibold leading-tight">{entry.title}</h3>
        <Meta>
          {entry.keyLabel} · {entry.lead}
        </Meta>
        <p className="mt-2 text-base leading-snug text-foreground/85">{entry.note}</p>
        <Link
          href={entry.href}
          className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-3 text-base font-medium text-background transition-opacity hover:opacity-90"
        >
          Open the Doxology trainer
        </Link>
      </Card>
    );
  }

  if (entry.kind === 'placeholder') {
    return (
      <Card muted>
        <h3 className="text-xl font-semibold leading-tight text-foreground/70">{entry.title}</h3>
        {entry.artist && <Meta>{entry.artist}</Meta>}
        <p className="mt-2 text-base leading-snug text-foreground/60">{entry.note}</p>
      </Card>
    );
  }

  if (entry.kind === 'mashup') {
    return (
      <Card>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/45">
          {entry.title}
        </h2>
        {entry.songs.map((song, i) => (
          <div key={song.id}>
            {/* The handoff note belongs between the two songs — it describes
                what happens as one ends and the other starts. */}
            {i > 0 && (
              <div className={`my-5 border-t border-foreground/15 ${entry.note ? 'pt-4' : ''}`}>
                {entry.note && (
                  <p className="text-base leading-snug text-secondary">{entry.note}</p>
                )}
              </div>
            )}
            <SongBlock key={`${player.id}-${song.id}`} song={song} player={player} />
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card>
      <SongBlock key={`${player.id}-${entry.song.id}`} song={entry.song} player={player} />
    </Card>
  );
}
