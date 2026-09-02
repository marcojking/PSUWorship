import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ChordLine } from '@/lib/db';
import type { PracticeSong } from '@/lib/music/setlist/types';
import ChordChartView, { barCells, chordRow } from './ChordChartView';

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

describe('instrumental lines', () => {
  // `lyrics: ''` with evenly spaced positions means "one chord per bar". The
  // positions run past the end of the empty lyric on purpose — they are a
  // rhythm, not character indexes.
  const intro = line('', [
    { chord: 'F', position: 0 },
    { chord: 'F', position: 8 },
    { chord: 'Fsus', position: 16 },
    { chord: 'Fsus', position: 24 },
  ]);

  it('lays out four evenly spaced bars, none lost or overlapping', () => {
    const cells = barCells(intro, 0, 'F');
    expect(cells).toEqual(['F', 'F', 'Fsus', 'Fsus']);
    expect(cells).toHaveLength(intro.chords.length);
  });

  it('transposes the bars with the capo', () => {
    expect(barCells(intro, 5, 'F')).toEqual(['C', 'C', 'Csus', 'Csus']);
  });

  it('falls back to a character-offset row when the gaps are uneven', () => {
    // 0/8/24 is a two-bar hold, not four even bars — forcing it into cells
    // would quietly misstate the rhythm.
    const uneven = line('', [
      { chord: 'F', position: 0 },
      { chord: 'Bb', position: 8 },
      { chord: 'C', position: 24 },
    ]);
    expect(barCells(uneven, 0, 'F')).toBeNull();
    expect(chordRow(uneven, 0, 'F')).toBe('F       Bb'.padEnd(24, ' ') + 'C');
  });

  it('leaves lines that have lyrics alone', () => {
    const sung = line('one two three', [
      { chord: 'G', position: 0 },
      { chord: 'C', position: 4 },
      { chord: 'D', position: 8 },
    ]);
    expect(barCells(sung, 0, 'G')).toBeNull();
  });

  it('does not draw a single chord as a bar', () => {
    expect(barCells(line('', [{ chord: 'F', position: 0 }]), 0, 'F')).toBeNull();
  });

  const asText = (html: string) => html.replace(/<[^>]+>/g, '');

  it('renders every bar chord for the real four-bar intro', () => {
    const song: PracticeSong = {
      id: 'intro-only',
      title: 'Intro only',
      artist: 'Test',
      concertKey: 'F',
      sections: [{ type: 'intro', label: 'Intro', lines: [intro] }],
    };
    const html = renderToStaticMarkup(<ChordChartView song={song} capo={5} />);

    // All four bars survive the render, padded to a common width.
    expect(asText(html)).toContain('| C    | C    | Csus | Csus |');
    expect(html.split('|').length - 1).toBe(5);
    // No lyric row for an instrumental line.
    expect(html).not.toContain('text-foreground/85');
  });

  it('gives consecutive bar lines in a section one column width', () => {
    // Amazing's turnaround: "| C  | Am |" over "| G  | F  |", not adrift.
    const song: PracticeSong = {
      id: 'turnaround',
      title: 'Turnaround',
      artist: 'Test',
      concertKey: 'F',
      sections: [
        {
          type: 'instrumental',
          label: 'Turnaround',
          lines: [
            line('', [
              { chord: 'F', position: 0 },
              { chord: 'Dm', position: 8 },
            ]),
            line('', [
              { chord: 'C', position: 0 },
              { chord: 'Bb', position: 8 },
            ]),
          ],
        },
      ],
    };
    const text = asText(renderToStaticMarkup(<ChordChartView song={song} capo={0} />));
    expect(text).toContain('| F  | Dm |');
    expect(text).toContain('| C  | Bb |');
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
