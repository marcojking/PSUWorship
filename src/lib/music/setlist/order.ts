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
      'Hold the final “A—men” (A chord). Clair ghosts a low E pedal under it. ' +
      'Count in at ~145 during the hold; band lands Amazing’s intro vamp in E — ' +
      'the held A is the IV of E, so the entry resolves like a second Amen.',
  },
];
