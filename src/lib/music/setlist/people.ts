import type { PlayerView } from './types';

export const PLAYERS: PlayerView[] = [
  { id: 'everyone', name: 'Everyone', instrument: 'concert', capoByKey: {} },
  {
    id: 'marco',
    name: 'Marco',
    instrument: 'acoustic',
    // E via capo 4 C-shapes (his familiar Amazing fingering, one fret down); G open.
    capoByKey: { E: 4, G: 0 },
  },
  {
    id: 'grant',
    name: 'Grant',
    instrument: 'acoustic',
    // E via capo 2 D-shapes so the two acoustics don't stack identical voicings.
    capoByKey: { E: 2, G: 0 },
  },
  {
    id: 'clair',
    name: 'Clair',
    instrument: 'piano',
    capoByKey: {},
    hint: 'Concert key. If E (4 sharps) feels awkward, set the keyboard transpose to −3 and pick the "read in G" view.',
  },
];
