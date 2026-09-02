import type { PlayerView } from './types';

export const PLAYERS: PlayerView[] = [
  { id: 'everyone', name: 'Everyone', instrument: 'concert', capoByKey: {} },
  {
    id: 'marco',
    name: 'Marco',
    instrument: 'acoustic',
    // F via capo 5 C-shapes (his familiar Amazing fingering); G open.
    capoByKey: { F: 5, G: 0 },
  },
  {
    id: 'grant',
    name: 'Grant',
    instrument: 'acoustic',
    // F via capo 3 D-shapes so the two acoustics don't stack identical voicings.
    capoByKey: { F: 3, G: 0 },
  },
  {
    id: 'clair',
    name: 'Clair',
    instrument: 'piano',
    capoByKey: {},
    hint: 'Concert pitch — F is one flat, G is one sharp. No transposing needed.',
  },
];
