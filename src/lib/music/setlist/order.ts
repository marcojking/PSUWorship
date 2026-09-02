import type { SetEntry, TransitionNote } from './types';
import { AMAZING } from './songs/amazing';
import { WASHED } from './songs/washed';
import { PEACE_LIKE_A_RIVER } from './songs/peaceLikeARiver';

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
  {
    kind: 'placeholder',
    title: 'The Cost Is A Joy',
    artist: 'SEU Worship',
    note: 'Chart coming — key being picked.',
  },
  {
    kind: 'placeholder',
    title: 'I Have Decided To Follow Jesus',
    note: 'Chart coming — key being picked.',
  },
];

export const TRANSITIONS: TransitionNote[] = [
  {
    afterIndex: 0,
    text:
      'Hold the final "A—men" (A major). The melody note A is the 3rd of F, so it stays put ' +
      'while the harmony moves underneath — singers do not change note. Piano ghosts a low F ' +
      'under the held chord; count in at ~145; band lands Amazing’s intro vamp in F.',
  },
];
