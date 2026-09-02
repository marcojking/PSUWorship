import type { PracticeSong } from '../types';

/**
 * Public domain: Assam folk melody, text attributed to Sadhu Sundar Singh
 * (19th c.). Unlike the Elevation songs in this set, the full text may be
 * printed freely — so this chart carries the words, not cues.
 *
 * Standard hymnal form rather than any one Ultimate Guitar transcription;
 * UG has 28 versions that disagree on trivia, and this is what a crowd sings.
 */
export const I_HAVE_DECIDED: PracticeSong = {
  id: 'i-have-decided',
  title: 'I Have Decided To Follow Jesus',
  artist: 'Traditional',
  concertKey: 'G',
  lead: 'Marco',
  sourceNote: 'Public domain. Standard hymnal form in G.',
  sections: [
    {
      type: 'verse',
      label: 'Verse 1',
      lines: [
        { lyrics: 'I have decided to follow Jesus', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 11 }, { chord: 'C', position: 21 }, { chord: 'G', position: 27 }] },
        { lyrics: 'I have decided to follow Jesus', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 11 }, { chord: 'Em', position: 21 }, { chord: 'D', position: 27 }] },
        { lyrics: 'I have decided to follow Jesus', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 11 }, { chord: 'C', position: 21 }, { chord: 'G', position: 27 }] },
        { lyrics: 'No turning back, no turning back', chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 8 }, { chord: 'D', position: 16 }, { chord: 'G', position: 26 }] },
      ],
    },
    {
      type: 'verse',
      label: 'Verse 2',
      lines: [
        { lyrics: 'The world behind me, the cross before me', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 11 }, { chord: 'C', position: 21 }, { chord: 'G', position: 32 }] },
        { lyrics: 'The world behind me, the cross before me', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 11 }, { chord: 'Em', position: 21 }, { chord: 'D', position: 32 }] },
        { lyrics: 'The world behind me, the cross before me', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 11 }, { chord: 'C', position: 21 }, { chord: 'G', position: 32 }] },
        { lyrics: 'No turning back, no turning back', chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 8 }, { chord: 'D', position: 16 }, { chord: 'G', position: 26 }] },
      ],
    },
    {
      type: 'verse',
      label: 'Verse 3',
      lines: [
        { lyrics: 'Though none go with me, still I will follow', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 11 }, { chord: 'C', position: 22 }, { chord: 'G', position: 34 }] },
        { lyrics: 'Though none go with me, still I will follow', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 11 }, { chord: 'Em', position: 22 }, { chord: 'D', position: 34 }] },
        { lyrics: 'Though none go with me, still I will follow', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 11 }, { chord: 'C', position: 22 }, { chord: 'G', position: 34 }] },
        { lyrics: 'No turning back, no turning back', chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 8 }, { chord: 'D', position: 16 }, { chord: 'G', position: 26 }] },
      ],
    },
    {
      type: 'verse',
      label: 'Verse 4',
      lines: [
        { lyrics: 'Will you decide now to follow Jesus?', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 13 }, { chord: 'C', position: 22 }, { chord: 'G', position: 30 }] },
        { lyrics: 'Will you decide now to follow Jesus?', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 13 }, { chord: 'Em', position: 22 }, { chord: 'D', position: 30 }] },
        { lyrics: 'Will you decide now to follow Jesus?', chords: [{ chord: 'G', position: 0 }, { chord: 'G7', position: 13 }, { chord: 'C', position: 22 }, { chord: 'G', position: 30 }] },
        { lyrics: 'No turning back, no turning back', chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 8 }, { chord: 'D', position: 16 }, { chord: 'G', position: 26 }] },
      ],
    },
  ],
};
