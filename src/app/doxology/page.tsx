'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PartPlayer, unlockAudio } from '@/lib/audio/partPlayer';
import { OLD_100TH } from '@/lib/music/arrangements/old100th';
import {
  PART_IDS,
  type PartId,
} from '@/lib/music/arrangements/types';

const ARR = OLD_100TH;

type Selection = 'all' | string;

/**
 * The voicing we actually sing, which is not plain SATB: the melody is doubled
 * an octave apart, and the written tenor line is not sung at all.
 *
 * Each mixer row is a person, so the tenor row carries the *soprano* line
 * transposed down an octave rather than the part it is named after. The
 * arrangement data stays a faithful transcription of the source — the
 * substitution belongs to who is singing, not to the music.
 *
 * Going back to real SATB means setting every `source` to its own id and
 * clearing the octave.
 */
const VOICING: Record<
  PartId,
  { label: string; part: string; source: PartId; octave: number }
> = {
  soprano: { label: 'Janae', part: 'melody', source: 'soprano', octave: 0 },
  alto: { label: 'Cassidy', part: 'alto', source: 'alto', octave: 0 },
  tenor: { label: 'Marco', part: 'melody 8vb', source: 'soprano', octave: -1 },
  bass: { label: 'Grant', part: 'bass', source: 'bass', octave: 0 },
};

const DEFAULT_MUTED: Record<PartId, boolean> = {
  soprano: false,
  alto: false,
  tenor: false,
  bass: false,
};

function rangeFor(selection: Selection): { from: number; to: number } {
  if (selection === 'all') return { from: 0, to: ARR.totalBeats };
  const p = ARR.phrases.find((x) => x.id === selection);
  return p ? { from: p.startBeat, to: p.endBeat } : { from: 0, to: ARR.totalBeats };
}

/** Hand-drawn line icons, 2px stroke — no icon library, no emoji. */
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4.5v15l13-7.5-13-7.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function PitchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18V6l10-2v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="6.5" cy="18" rx="2.5" ry="2" stroke="currentColor" strokeWidth="1.8" />
      <ellipse cx="16.5" cy="16" rx="2.5" ry="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function DoxologyPage() {
  const playerRef = useRef<PartPlayer | null>(null);
  const rafRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [volumes, setVolumes] = useState<Record<PartId, number>>({
    soprano: 1, alto: 1, tenor: 1, bass: 1,
  });
  const [muted, setMuted] = useState<Record<PartId, boolean>>(DEFAULT_MUTED);
  // Seeded from the voicing; the 8vb control can still move any row.
  const [octaves, setOctaves] = useState<Record<PartId, number>>(() =>
    Object.fromEntries(
      PART_IDS.map((id) => [id, VOICING[id].octave]),
    ) as Record<PartId, number>,
  );

  const [bpm, setBpm] = useState(ARR.defaultBpm);
  const [countIn, setCountIn] = useState(false);
  const [loop, setLoop] = useState(true);
  const [selection, setSelection] = useState<Selection>('all');
  const [beat, setBeat] = useState<number | null>(null);

  // Player is created lazily so no AudioContext exists until the page is used.
  const getPlayer = useCallback(() => {
    if (!playerRef.current) {
      const p = new PartPlayer(ARR);
      // Apply the voicing at construction, not on play: the starting-pitch
      // button can fire first, and it would otherwise sound the written tenor
      // line for a row that sings the melody.
      for (const id of PART_IDS) {
        p.setPartSource(id, VOICING[id].source);
        p.setPartOctave(id, VOICING[id].octave);
      }
      playerRef.current = p;
    }
    return playerRef.current;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      playerRef.current?.dispose();
    };
  }, []);

  // Playhead, read from the audio clock rather than a timer.
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setBeat(null);
      return;
    }
    const tick = () => {
      const p = playerRef.current;
      if (!p) return;
      setBeat(p.getCurrentBeat());
      if (!p.isPlaying) setPlaying(false);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  const handlePlay = async () => {
    setError(null);
    try {
      const p = getPlayer();
      if (playing) {
        p.stop();
        setPlaying(false);
        return;
      }

      // iOS Safari only honours resume() while the tap is still in progress.
      // Kick it off before awaiting anything — notably before the samples
      // download, which otherwise ends the gesture and leaves the context
      // suspended for the rest of the session.
      const resumed = unlockAudio();

      if (!p.isLoaded) {
        setLoading(true);
        await p.load();
        setLoading(false);
        setReady(true);
      }
      await resumed;

      // Re-apply mixer state; a fresh player starts at unity.
      for (const id of PART_IDS) {
        p.setPartVolume(id, volumes[id]);
        p.setPartMuted(id, muted[id]);
        p.setPartOctave(id, octaves[id]);
        p.setPartSource(id, VOICING[id].source);
      }
      const { from, to } = rangeFor(selection);
      await p.play({ fromBeat: from, toBeat: to, bpm, loop, countInBeats: countIn ? 4 : 0 });
      setPlaying(true);
    } catch (e) {
      // Something failing silently on a phone is worse than an ugly message.
      setLoading(false);
      setPlaying(false);
      setError(e instanceof Error ? e.message : 'Could not start audio.');
    }
  };

  const changeVolume = (id: PartId, v: number) => {
    setVolumes((s) => ({ ...s, [id]: v }));
    playerRef.current?.setPartVolume(id, v);
  };

  const toggleOctave = (id: PartId) => {
    const next = octaves[id] === 0 ? -1 : 0;
    setOctaves((s) => ({ ...s, [id]: next }));
    playerRef.current?.setPartOctave(id, next);
  };

  const toggleMute = (id: PartId) => {
    const next = !muted[id];
    setMuted((s) => ({ ...s, [id]: next }));
    playerRef.current?.setPartMuted(id, next);
  };

  /** Solo: this part on, the rest off. Clicking an existing solo restores all. */
  const solo = (id: PartId) => {
    const isSoloed = !muted[id] && PART_IDS.every((o) => o === id || muted[o]);
    const next = isSoloed
      ? { ...DEFAULT_MUTED }
      : (Object.fromEntries(
          PART_IDS.map((o) => [o, o !== id]),
        ) as Record<PartId, boolean>);
    setMuted(next);
    for (const o of PART_IDS) playerRef.current?.setPartMuted(o, next[o]);
  };

  const hearFirstNote = async (id: PartId) => {
    setError(null);
    try {
      const p = getPlayer();
      const resumed = unlockAudio(); // before any await — see handlePlay
      if (!p.isLoaded) {
        setLoading(true);
        await p.load();
        setLoading(false);
        setReady(true);
      }
      await resumed;
      await p.playStartingPitch(id, rangeFor(selection).from);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'Could not start audio.');
    }
  };

  const sopranoNotes = ARR.parts.soprano;

  return (
    <div className="doxology-page min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-10">

        <header className="mb-9">
          <Link
            href="/"
            className="text-[11px] uppercase tracking-[0.18em] text-foreground/40 hover:text-foreground/70 transition-colors"
          >
            Worship Music <span className="text-secondary font-semibold">&amp;</span> Arts
          </Link>
          <h1 className="font-cormorant italic text-5xl leading-none mt-4">Doxology</h1>
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-foreground/45">
            Old 100th · {ARR.key} · Four parts
          </p>
        </header>

        {/* Lyrics with the playhead syllable marked */}
        <section className="mb-9 space-y-2" aria-label="Lyrics">
          {ARR.phrases.map((ph) => {
            const notes = sopranoNotes.filter(
              (n) => n.startBeat >= ph.startBeat && n.startBeat < ph.endBeat,
            );
            const active = selection === 'all' || selection === ph.id;
            return (
              <p
                key={ph.id}
                className={`font-cormorant text-xl leading-relaxed transition-opacity ${
                  active ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {notes.map((n, i) => {
                  const on =
                    beat !== null && beat >= n.startBeat && beat < n.startBeat + n.beats;
                  return (
                    <span
                      key={i}
                      className={
                        on
                          ? 'text-secondary font-medium'
                          : undefined
                      }
                    >
                      {n.lyric}
                      {n.lyric?.endsWith('-') ? '' : ' '}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </section>

        {/* Mixer */}
        <section className="mb-9" aria-label="Parts">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/45 mb-3">
            Parts
          </h2>
          <div className="space-y-px overflow-hidden rounded-lg border border-foreground/10">
            {PART_IDS.map((id) => {
              const isMuted = muted[id];
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 bg-white/60 px-4 py-3 transition-opacity ${
                    isMuted ? 'opacity-40' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleMute(id)}
                    aria-pressed={!isMuted}
                    aria-label={`${VOICING[id].label} ${isMuted ? 'off' : 'on'}`}
                    className={`h-5 w-5 shrink-0 rounded border transition-colors ${
                      isMuted
                        ? 'border-foreground/25'
                        : 'border-secondary bg-secondary'
                    }`}
                  />
                  <button
                    onClick={() => solo(id)}
                    className="w-[86px] shrink-0 text-left leading-tight hover:text-secondary transition-colors"
                    title="Solo this part"
                    aria-label={`Solo ${VOICING[id].label}, ${VOICING[id].part}`}
                  >
                    <span className="block text-sm">{VOICING[id].label}</span>
                    <span className="block text-[10px] uppercase tracking-[0.08em] text-foreground/35">
                      {VOICING[id].part}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleOctave(id)}
                    aria-pressed={octaves[id] === -1}
                    title="Play this part an octave lower"
                    aria-label={`${VOICING[id].label} octave down`}
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] transition-colors ${
                      octaves[id] === -1
                        ? 'bg-secondary/15 text-secondary'
                        : 'text-foreground/25 hover:text-foreground/50'
                    }`}
                  >
                    8vb
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(volumes[id] * 100)}
                    onChange={(e) => changeVolume(id, Number(e.target.value) / 100)}
                    aria-label={`${VOICING[id].label} volume`}
                    className="h-1 flex-1 cursor-pointer accent-accent"
                  />
                  <button
                    onClick={() => hearFirstNote(id)}
                    title="Play this part's first note"
                    aria-label={`Hear ${VOICING[id].label} starting note`}
                    className="shrink-0 text-foreground/40 hover:text-secondary transition-colors"
                  >
                    <PitchIcon />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-foreground/40">
            Tap a name to solo that part. The note icon plays its first pitch.
            Marco and Janae carry the same melody an octave apart — that is the
            voicing, not a duplicate.
          </p>
        </section>

        {/* Phrase selection */}
        <section className="mb-9" aria-label="Section">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-foreground/45 mb-3">
            Practice
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelection('all')}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                selection === 'all'
                  ? 'border-secondary bg-secondary text-background'
                  : 'border-foreground/15 hover:border-foreground/40'
              }`}
            >
              Whole hymn
            </button>
            {ARR.phrases.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelection(p.id)}
                title={p.label}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  selection === p.id
                    ? 'border-secondary bg-secondary text-background'
                    : 'border-foreground/15 hover:border-foreground/40'
                }`}
              >
                {p.short}
              </button>
            ))}
          </div>
        </section>

        {/* Transport */}
        <section aria-label="Transport" className="space-y-5">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlay}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {playing ? <StopIcon /> : <PlayIcon />}
              <span className="text-sm uppercase tracking-[0.12em]">
                {loading ? 'Loading piano' : playing ? 'Stop' : 'Play'}
              </span>
            </button>
            {!ready && !loading && !error && (
              <span className="text-xs text-foreground/40">
                Piano samples load on first play
              </span>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-md border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs leading-relaxed text-secondary"
            >
              {error} Try tapping Play again — on iPhone the sound has to start
              from a tap, and turn the silent switch off.
            </p>
          )}

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor="tempo" className="text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                Tempo
              </label>
              <span className="text-xs tabular-nums text-foreground/50">{bpm} bpm</span>
            </div>
            <input
              id="tempo"
              type="range"
              min={40}
              max={120}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="h-1 w-full cursor-pointer accent-accent"
            />
          </div>

          <div className="flex gap-5 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
                className="accent-secondary"
              />
              Loop
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={countIn}
                onChange={(e) => setCountIn(e.target.checked)}
                className="accent-secondary"
              />
              Count in
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
