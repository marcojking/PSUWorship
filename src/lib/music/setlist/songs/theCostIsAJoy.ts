import type { PracticeSong } from '../types';

/**
 * Transposed up a half step from the Ultimate Guitar chart's key of E so it
 * sits in F with the rest of the set — that way the guitars never change capo
 * except for the G songs.
 *
 * Chords only, with short cues. The words are under copyright and live in the
 * team Drive folder.
 */
export const THE_COST_IS_A_JOY: PracticeSong = {
  id: 'the-cost-is-a-joy',
  title: 'The Cost Is A Joy',
  artist: 'SEU Worship, Chelsea Plank',
  concertKey: 'F',
  lead: 'Janae',
  sourceNote:
    'From the Ultimate Guitar chart in E (album: Found in the Field), transposed to F. ' +
    'That transcriber noted some chords were hard to discern from the recording.',
  sections: [
    {
      type: 'intro',
      label: 'Intro',
      lines: [
        {
          lyrics: '',
          chords: [
            { chord: 'Bbmaj7', position: 0 },
            { chord: 'F/A', position: 8 },
            { chord: 'F', position: 16 },
          ],
        },
      ],
    },
    {
      type: 'verse',
      label: 'Verse 1',
      lines: [
        { lyrics: "There is a treasure that's hidden", chords: [{ chord: 'Bbmaj7', position: 0 }] },
        { lyrics: 'It waits to be found in the field', chords: [{ chord: 'F/A', position: 0 }, { chord: 'F', position: 21 }] },
        { lyrics: 'Seek and you shall find it', chords: [{ chord: 'Bbmaj7', position: 0 }, { chord: 'F/A', position: 13 }] },
        { lyrics: 'Seek it wholeheartedly', chords: [{ chord: 'F', position: 0 }] },
      ],
    },
    {
      type: 'verse',
      label: 'Verse 2',
      lines: [
        { lyrics: 'Oh it is the kingdom of heaven', chords: [{ chord: 'Bbmaj7', position: 0 }] },
        { lyrics: 'The glory of Jesus revealed', chords: [{ chord: 'F/A', position: 0 }, { chord: 'F', position: 14 }] },
        { lyrics: 'Seek and you shall find it', chords: [{ chord: 'Bbmaj7', position: 0 }, { chord: 'F/A', position: 13 }] },
        { lyrics: 'Seek it wholeheartedly', chords: [{ chord: 'F', position: 0 }] },
      ],
    },
    {
      type: 'pre-chorus',
      label: 'Pre-Chorus',
      lines: [
        { lyrics: 'So I ran to the man and I asked him the cost', chords: [{ chord: 'Bbmaj7', position: 0 }, { chord: 'Dm7', position: 20 }, { chord: 'F2', position: 36 }] },
        { lyrics: 'All it takes is all that you got', chords: [{ chord: 'Bbmaj7', position: 0 }, { chord: 'Dm7', position: 12 }, { chord: 'F2', position: 22 }] },
      ],
    },
    {
      type: 'chorus',
      label: 'Chorus',
      lines: [
        { lyrics: 'Take it all, take it all', chords: [{ chord: 'Bbmaj7', position: 0 }, { chord: 'F/A', position: 8 }, { chord: 'F', position: 17 }] },
        { lyrics: 'The cost is a joy to me', chords: [{ chord: 'Bbmaj7', position: 0 }, { chord: 'F2', position: 13 }] },
      ],
    },
    {
      type: 'instrumental',
      label: 'Instrumental ("What a joy")',
      lines: [
        {
          lyrics: '',
          chords: [
            { chord: 'Bbmaj7', position: 0 },
            { chord: 'F/A', position: 8 },
            { chord: 'F', position: 16 },
          ],
        },
        {
          lyrics: '',
          chords: [
            { chord: 'Bbmaj7', position: 0 },
            { chord: 'F/A', position: 8 },
            { chord: 'F', position: 16 },
          ],
        },
      ],
    },
    {
      type: 'instrumental',
      label: 'Instrumental ("Consider it our joy")',
      lines: [
        {
          lyrics: '',
          chords: [
            { chord: 'F', position: 0 },
            { chord: 'Fsus', position: 8 },
            { chord: 'F', position: 16 },
            { chord: 'Fsus', position: 24 },
          ],
        },
      ],
    },
    {
      type: 'bridge',
      label: 'Bridge',
      lines: [
        { lyrics: "Whatever I've gained, I count it all lost", chords: [{ chord: 'F', position: 0 }] },
        { lyrics: 'The cost is a joy to me', chords: [{ chord: 'Fsus', position: 0 }] },
        { lyrics: "It's not just a portion, take all that I've got", chords: [{ chord: 'F', position: 0 }] },
        { lyrics: 'The cost is a joy to me', chords: [{ chord: 'Fsus', position: 0 }] },
        { lyrics: "And if I just have Jesus, I've got it all", chords: [{ chord: 'F', position: 0 }] },
        { lyrics: 'The cost is a joy to me', chords: [{ chord: 'Fsus', position: 0 }] },
        { lyrics: 'For the joy set before Him, He took the cross', chords: [{ chord: 'F', position: 0 }] },
        { lyrics: 'The cost is a joy to me', chords: [{ chord: 'Fsus', position: 0 }] },
      ],
    },
    {
      type: 'bridge',
      label: 'Bridge (last time)',
      lines: [
        { lyrics: "And if I just have Jesus, I've got it all", chords: [{ chord: 'Dm7', position: 0 }, { chord: 'F', position: 19 }] },
        { lyrics: 'The cost is a joy to me', chords: [{ chord: 'F2', position: 0 }] },
        { lyrics: 'For the joy set before Him, He took the cross', chords: [{ chord: 'Dm7', position: 0 }, { chord: 'F', position: 23 }] },
        { lyrics: 'The cost is a joy', chords: [{ chord: 'F2', position: 0 }] },
      ],
    },
    {
      type: 'tag',
      label: 'Tag',
      lines: [
        { lyrics: 'The cost is a joy', chords: [{ chord: 'Bbmaj7', position: 0 }, { chord: 'F/A', position: 8 }, { chord: 'F2', position: 15 }] },
        { lyrics: 'The cost is a joy', chords: [{ chord: 'Bbmaj7', position: 0 }, { chord: 'F/A', position: 8 }, { chord: 'F2', position: 15 }] },
        { lyrics: 'The cost is a joy', chords: [{ chord: 'Bbmaj7', position: 0 }, { chord: 'F/A', position: 8 }, { chord: 'F2', position: 15 }] },
        { lyrics: 'The cost is a joy to me', chords: [{ chord: 'F', position: 0 }] },
      ],
    },
  ],
};
