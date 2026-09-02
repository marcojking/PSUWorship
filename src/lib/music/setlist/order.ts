import type { SetEntry, TransitionNote } from './types';
import { AMAZING } from './songs/amazing';
import { WASHED } from './songs/washed';
import { PEACE_LIKE_A_RIVER } from './songs/peaceLikeARiver';
import { THE_COST_IS_A_JOY } from './songs/theCostIsAJoy';
import { I_HAVE_DECIDED } from './songs/iHaveDecided';

export const SET_ENTRIES: SetEntry[] = [
  {
    kind: 'link',
    title: 'Doxology (chorus)',
    keyLabel: 'A · a cappella',
    lead: 'Janae / Marco',
    href: '/doxology',
    note: 'Practice parts on the Doxology trainer — we sing it in A, exactly as trained.',
  },
  {
    kind: 'mashup',
    title: 'Amazing! / Washed',
    songs: [AMAZING, WASHED],
    note: "Out of Amazing's tag the band drops out — Washed's first chorus is a cappella, band back in on chorus 2.",
  },
  { kind: 'song', song: PEACE_LIKE_A_RIVER },
  { kind: 'song', song: THE_COST_IS_A_JOY },
  { kind: 'song', song: I_HAVE_DECIDED },
];

export const TRANSITIONS: TransitionNote[] = [
  {
    afterIndex: 0,
    text:
      'Hold the final "A—men". Janae and Marco are both on A, the 3rd of F — ' +
      'they stay put and the band arrives underneath them. Cassidy and Grant release ' +
      'on the downbeat so the band lands a clean F rather than F/A. Piano ghosts a low F ' +
      'under the held chord; count in at ~145 during the hold; ' +
      'band lands the intro vamp | F | F | Fsus | Fsus |.',
  },
  {
    afterIndex: 1,
    text:
      'Capo move: Peace Like A River is open G. Marco goes capo 5 → open, Grant capo 3 → open. ' +
      'Back to the capos for The Cost Is A Joy, then open again for the last one.',
  },
];
