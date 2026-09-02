import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ChordLine } from '@/lib/db';
import type { PracticeSong } from '@/lib/music/setlist/types';
import ChordChartView, { chordRow } from './ChordChartView';

const line = (lyrics: string, chords: ChordLine['chords']): ChordLine => ({ lyrics, chords });

describe('chordRow', () => {
  it('puts each chord at its lyric character index', () => {
    // "When I go out, with all of my pain" — the C lands on "with".
    const row = chordRow(
      line('When I go out, with all of my pain', [
        { chord: 'G', position: 0 },
        { chord: 'C', position: 15 },
      ]),
      0,
      'G',
    );
    expect(row).toBe('G'.padEnd(15, ' ') + 'C');
    expect(row.indexOf('C')).toBe(15);
  });

  it('leaves one space when a wide chord would swallow the next position', () => {
    const row = chordRow(
      line('crowded', [
        { chord: 'Bbmaj7', position: 0 },
        { chord: 'C', position: 3 },
      ]),
      0,
      'F',
    );
    // Pushed right rather than fused into "BbmaC" or "Bbmaj7C".
    expect(row).toBe('Bbmaj7 C');
  });

  it('keeps positions fixed while transposing chords for a capo', () => {
    const source = line('I was stuck in my shame', [
      { chord: 'F', position: 0 },
      { chord: 'Bb', position: 12 },
    ]);
    const concert = chordRow(source, 0, 'F');
    const capo5 = chordRow(source, 5, 'F');

    expect(concert).toBe('F'.padEnd(12, ' ') + 'Bb');
    // Capo 5 on F reads C shapes: F -> C, Bb -> F.
    expect(capo5).toBe('C'.padEnd(12, ' ') + 'F');
    expect(capo5.indexOf('F', 1)).toBe(12);
  });

  it('sorts out-of-order chords instead of stacking them at the end', () => {
    const row = chordRow(
      line('out of order', [
        { chord: 'D', position: 8 },
        { chord: 'G', position: 0 },
      ]),
      0,
      'G',
    );
    expect(row).toBe('G'.padEnd(8, ' ') + 'D');
  });

  it('returns an empty row for a line with no chords', () => {
    expect(chordRow(line('just words', []), 0, 'G')).toBe('');
  });

  it('handles an instrumental line that has chords but no lyrics', () => {
    const row = chordRow(
      line('', [
        { chord: 'F', position: 0 },
        { chord: 'Fsus', position: 8 },
      ]),
      5,
      'F',
    );
    expect(row).toBe('C'.padEnd(8, ' ') + 'Csus');
  });
});

describe('<ChordChartView />', () => {
  const song: PracticeSong = {
    id: 'test',
    title: 'Test',
    artist: 'Test',
    concertKey: 'F',
    sections: [
      {
        type: 'chorus',
        label: 'Chorus',
        lines: [
          line('I was stuck in my shame', [
            { chord: 'F', position: 0 },
            { chord: 'Bb', position: 12 },
          ]),
          line('', [{ chord: 'Dm', position: 0 }]),
        ],
      },
    ],
  };

  it('renders the chord row and the lyric row with alignment-preserving whitespace', () => {
    const html = renderToStaticMarkup(<ChordChartView song={song} capo={5} />);

    // Both rows must be pre-formatted; whitespace-pre-wrap would rewrap the
    // lyric on a phone and slide every chord off its syllable.
    expect(html).toContain('whitespace-pre font-bold text-secondary');
    expect(html).toContain('whitespace-pre text-foreground/85');
    expect(html).not.toContain('whitespace-pre-wrap');

    // Capo 5 shapes, spacing intact through the render.
    expect(html).toContain('C'.padEnd(12, ' ') + 'F');
    expect(html).toContain('Chorus');
  });

  it('renders no lyric row for an instrumental line', () => {
    const html = renderToStaticMarkup(<ChordChartView song={song} capo={0} />);
    // Two chord rows, one lyric row.
    expect(html.split('whitespace-pre font-bold').length - 1).toBe(2);
    expect(html.split('whitespace-pre text-foreground/85').length - 1).toBe(1);
  });

  it('scrolls chart lines in their own container', () => {
    const html = renderToStaticMarkup(<ChordChartView song={song} capo={0} />);
    expect(html).toContain('overflow-x-auto');
    expect(html).toContain('min-w-max');
  });
});
