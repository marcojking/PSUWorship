import type { PracticeSong } from '../types';

export const PEACE_LIKE_A_RIVER: PracticeSong = {
  id: 'peace-like-a-river',
  title: 'Peace Like A River',
  artist: 'Marco King',
  concertKey: 'G',
  lead: 'Marco',
  sourceNote: "From Janae's chart PDF (2026-09-01).",
  sections: [
    {
      type: 'verse',
      label: 'Verse',
      lines: [
        { lyrics: 'When I go out, with all of my pain', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 14 }] },
        { lyrics: 'When I get older and see everything', chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 18 }] },
        { lyrics: "When life's unfair, when it's unkind", chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 16 }] },
        { lyrics: 'When I have no control over my life', chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 19 }] },
      ],
    },
    {
      type: 'chorus',
      label: 'Chorus',
      lines: [
        { lyrics: "Take me back to the part where you're slowing me down", chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 26 }] },
        { lyrics: "Keep my head from a hurry, cause yours has a crown", chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 26 }] },
        { lyrics: 'The list I should do gets longer and longer', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 22 }] },
        { lyrics: "Help me know you're stronger, you're stronger!", chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 23 }] },
      ],
    },
    {
      type: 'bridge',
      label: 'Bridge',
      lines: [
        { lyrics: 'Peace like a river', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 11 }] },
        { lyrics: 'I keep turning, return me', chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 15 }] },
        { lyrics: 'Peace like a river', chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 11 }] },
        { lyrics: 'Sweep me off my feet', chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 9 }] },
      ],
    },
  ],
};
