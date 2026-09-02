'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import Logo from '@/components/Logo';
import SongCard from '@/components/practice/SongCard';
import { SET_ENTRIES, TRANSITIONS } from '@/lib/music/setlist/order';
import { PLAYERS } from '@/lib/music/setlist/people';

const STORAGE_KEY = 'practice.player';
const DEFAULT_ID = PLAYERS[0].id;

// The saved choice is external state, so it is read through
// useSyncExternalStore rather than copied into an effect: the server and the
// hydrating client both render DEFAULT_ID, and React swaps in the stored value
// immediately after hydration without a mismatch.
const listeners = new Set<() => void>();

// Shadows localStorage when writing to it throws (private-mode Safari), so a
// tap still changes the view even where the choice cannot be persisted.
let inMemoryId: string | null = null;

/**
 * Everything downstream feeds a capo into shapes.ts, which throws on a value it
 * cannot transpose. The stored id is user-writable, so it is resolved against
 * PLAYERS here and falls back to the default rather than being trusted.
 */
function readPlayerId(): string {
  if (inMemoryId !== null) return inMemoryId;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null && PLAYERS.some((p) => p.id === stored)) return stored;
  } catch {
    // Reading can throw too; the default view is a fine answer.
  }
  return DEFAULT_ID;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Someone with the set open in two tabs sees both follow the same choice.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function writePlayerId(id: string): void {
  inMemoryId = id;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Selection still applies for this session.
  }
  for (const notify of listeners) notify();
}

export default function PracticeBoard() {
  const playerId = useSyncExternalStore(subscribe, readPlayerId, () => DEFAULT_ID);
  const player = PLAYERS.find((p) => p.id === playerId) ?? PLAYERS[0];

  return (
    <div className="practice-page min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:px-5 sm:pt-10">
        <header className="mb-5">
          <Link href="/" className="inline-block transition-opacity hover:opacity-80">
            <Logo size="sm" />
          </Link>
          <h1 className="mt-6 font-cormorant text-4xl italic leading-none sm:text-5xl">
            HUB Lawn — Sept 13
          </h1>
          <p className="mt-3 text-base leading-snug text-foreground/60">
            Band practice page — the set in running order. Pick your name and every
            chart re-chords to what you actually play.
          </p>
        </header>

        {/* Sticky so the picker is reachable mid-song without scrolling back up.
            The background is opaque: chart rows scroll under it. */}
        <div className="sticky top-0 z-10 -mx-4 mb-8 border-b border-foreground/10 bg-background px-4 py-3 sm:-mx-5 sm:px-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Who is playing">
            {PLAYERS.map((p) => {
              const selected = p.id === player.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => writePlayerId(p.id)}
                  aria-pressed={selected}
                  className={`rounded-full border px-4 py-2 text-base transition-colors ${
                    selected
                      ? 'border-secondary bg-secondary text-background'
                      : 'border-foreground/20 hover:border-foreground/50'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
          {player.hint && (
            <p className="mt-2 text-[15px] leading-snug text-foreground/60">{player.hint}</p>
          )}
        </div>

        <div className="space-y-6">
          {SET_ENTRIES.map((entry, i) => (
            <div key={i} className="space-y-6">
              <SongCard entry={entry} player={player} />
              {TRANSITIONS.filter((t) => t.afterIndex === i).map((t, j) => (
                <aside
                  key={j}
                  className="rounded-xl border-l-4 border-accent bg-accent/10 px-4 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
                    Transition
                  </p>
                  <p className="mt-1.5 text-base italic leading-snug text-foreground/85">
                    {t.text}
                  </p>
                </aside>
              ))}
            </div>
          ))}
        </div>

        <footer className="mt-10 border-t border-foreground/10 pt-5 text-base text-foreground/60">
          Doxology parts live on the{' '}
          <Link href="/doxology" className="font-medium text-secondary hover:underline">
            Doxology trainer
          </Link>
          {' '}— that one is a cappella, practice it there.
        </footer>
      </div>
    </div>
  );
}
