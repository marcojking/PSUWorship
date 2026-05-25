import { describe, it, expect } from 'vitest'
import { chordLineToChordPro, sectionToChordPro, sectionToLyrics } from './chords.js'

describe('chordLineToChordPro', () => {
  it('inserts chord at position 0', () => {
    expect(chordLineToChordPro({ lyrics: 'Amazing grace', chords: [{ chord: 'G', position: 0 }] }))
      .toBe('[G]Amazing grace')
  })
  it('inserts multiple chords in correct order', () => {
    expect(chordLineToChordPro({
      lyrics: 'Amazing grace how sweet',
      chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 8 }]
    })).toBe('[G]Amazing [D]grace how sweet')
  })
  it('returns plain lyrics when no chords', () => {
    expect(chordLineToChordPro({ lyrics: 'Amazing grace', chords: [] }))
      .toBe('Amazing grace')
  })
  it('clamps position beyond lyrics length', () => {
    expect(chordLineToChordPro({ lyrics: 'Hi', chords: [{ chord: 'G', position: 999 }] }))
      .toBe('Hi[G]')
  })
})

describe('sectionToChordPro', () => {
  it('joins lines with newline', () => {
    expect(sectionToChordPro([
      { lyrics: 'Line one', chords: [{ chord: 'G', position: 0 }] },
      { lyrics: 'Line two', chords: [] },
    ])).toBe('[G]Line one\nLine two')
  })
})

describe('sectionToLyrics', () => {
  it('strips chords', () => {
    expect(sectionToLyrics([
      { lyrics: 'Amazing grace', chords: [{ chord: 'G', position: 0 }] },
      { lyrics: 'How sweet', chords: [] },
    ])).toBe('Amazing grace\nHow sweet')
  })
})
