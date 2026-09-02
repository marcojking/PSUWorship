// Renders a chart as a monospace grid: one chord row sitting directly above
// its lyric row. Alignment is the whole point — a chord must land on the
// syllable it is played on — so both rows use `whitespace-pre` and the same
// mono font, and long lines scroll sideways inside the section rather than
// wrapping. Wrapping would move chords off their syllables silently.
import type { ChordLine } from '@/lib/db';
import type { PracticeSong } from '@/lib/music/setlist/types';
import { displayChord } from '@/lib/music/setlist/shapes';

/**
 * Builds the spacer-padded chord row for one lyric line.
 *
 * A chord starts at `position` (a character index into the lyrics) unless the
 * previous chord's text already reaches that far, in which case it is pushed
 * right far enough to leave one space. Two chords therefore never fuse into an
 * unreadable "GC" — the row drifts instead, which a player can see and correct
 * for. Exported for tests.
 */
export function chordRow(line: ChordLine, capo: number, concertKey: string): string {
  // Chart data is authored in order, but sorting keeps a stray out-of-order
  // entry from silently landing at the end of the row.
  const chords = [...line.chords].sort((a, b) => a.position - b.position);
  let row = '';
  for (const { chord, position } of chords) {
    const at = Math.max(position, row.length === 0 ? 0 : row.length + 1);
    row = row.padEnd(at, ' ') + displayChord(chord, capo, concertKey);
  }
  return row;
}

export default function ChordChartView({
  song,
  capo,
}: {
  song: PracticeSong;
  capo: number;
}) {
  return (
    <div className="space-y-5">
      {song.sections.map((section, i) => (
        <section key={`${section.label}-${i}`}>
          <h4 className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground/55">
            {section.label}
          </h4>

          {/* One scroll box per section so all its lines share a horizontal
              offset; `min-w-max` makes the box measure the longest line. */}
          <div className="overflow-x-auto overscroll-x-contain">
            <div className="min-w-max font-mono text-[17px] leading-tight">
              {section.lines.map((line, j) => {
                const row = chordRow(line, capo, song.concertKey);
                return (
                  <div key={j} className="mb-2.5">
                    {row && (
                      <div className="whitespace-pre font-bold text-secondary">{row}</div>
                    )}
                    {line.lyrics && (
                      <div className="whitespace-pre text-foreground/85">{line.lyrics}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
