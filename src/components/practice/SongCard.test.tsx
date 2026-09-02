import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PLAYERS } from '@/lib/music/setlist/people';
import { SET_ENTRIES } from '@/lib/music/setlist/order';
import SongCard from './SongCard';

// Every capo in the chart data flows into shapeKeyFor/displayChord, which now
// throw RangeError on a bad value. Rendering the real set for every player is
// the cheapest guard against a future chart shipping a capo that blows up the
// whole page at rehearsal.
describe('<SongCard /> over the real set', () => {
  for (const player of PLAYERS) {
    for (const [i, entry] of SET_ENTRIES.entries()) {
      it(`renders entry ${i} (${entry.kind}) for ${player.name}`, () => {
        const html = renderToStaticMarkup(<SongCard entry={entry} player={player} />);
        expect(html).not.toContain('undefined');
        expect(html.length).toBeGreaterThan(0);
      });
    }
  }
});

describe('capo override options', () => {
  const optionText = (html: string) =>
    [...html.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map((m) => m[1]);

  it('offers only natural-letter shapes for a guitarist, plus their default', () => {
    const marco = PLAYERS.find((p) => p.id === 'marco')!;
    const peace = SET_ENTRIES.find((e) => e.kind === 'song')!;
    const html = renderToStaticMarkup(<SongCard entry={peace} player={marco} />);

    // Peace Like A River is in G: capo 0/2/3/5/7 land on G/F/E/D/C.
    expect(optionText(html)).toEqual([
      'No capo · G shapes',
      'Capo 2 · F shapes',
      'Capo 3 · E shapes',
      'Capo 5 · D shapes',
      'Capo 7 · C shapes',
    ]);
  });

  it('defaults the piano to concert pitch and offers reads above it', () => {
    const clair = PLAYERS.find((p) => p.id === 'clair')!;
    const peace = SET_ENTRIES.find((e) => e.kind === 'song')!;
    const html = renderToStaticMarkup(<SongCard entry={peace} player={clair} />);
    const options = optionText(html);

    expect(options[0]).toBe('Concert pitch · read G');
    // Negative capo reads ABOVE concert: transpose −2 in G reads A.
    expect(options).toContain('Transpose −2 · read A');
    expect(options.every((o) => !/[#b]/.test(o.split('read ')[1] ?? ''))).toBe(true);
  });

  it('never offers an accidental shape key to a guitarist', () => {
    for (const player of PLAYERS.filter((p) => p.instrument !== 'piano')) {
      for (const entry of SET_ENTRIES) {
        const html = renderToStaticMarkup(<SongCard entry={entry} player={player} />);
        for (const option of optionText(html)) {
          const shapes = option.split(' · ')[1]?.replace(' shapes', '') ?? '';
          expect(shapes.length).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
