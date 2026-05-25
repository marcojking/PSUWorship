import { describe, it, expect } from 'vitest'
import {
  initialState, applyGo, applySelection, applyModeToggle,
  applyBlackout, applyStandby, buildPayload,
  EMPTY_SETLIST, type LiveSetlist,
} from './state.js'

const SETLIST: LiveSetlist = {
  name: 'Sunday',
  pushedAt: 1000,
  songs: [
    {
      title: 'Amazing Grace', key: 'G',
      sections: [
        { type: 'verse',  label: 'Verse 1', lyrics: 'Amazing grace',    chords: '[G]Amazing grace' },
        { type: 'chorus', label: 'Chorus',  lyrics: 'My chains are gone', chords: '[G]My chains' },
      ]
    },
    {
      title: 'How Great', key: 'A',
      sections: [
        { type: 'verse', label: 'Verse 1', lyrics: 'O Lord my God', chords: '[A]O Lord' },
      ]
    }
  ]
}

describe('initialState', () => {
  it('starts in standby, song 0 queued', () => {
    const s = initialState()
    expect(s.isLive).toBe(false)
    expect(s.currentSong).toBe(-1)
    expect(s.queuedSong).toBe(0)
    expect(s.queuedSection).toBe(0)
    expect(s.mode).toBe('song')
  })
})

describe('applyGo', () => {
  it('no-op on empty setlist', () => {
    expect(applyGo(initialState(), EMPTY_SETLIST)).toEqual(initialState())
  })
  it('sets isLive on first GO', () => {
    const s = applyGo(initialState(), SETLIST)
    expect(s.isLive).toBe(true)
    expect(s.currentSong).toBe(0)
    expect(s.currentSection).toBe(0)
  })
  it('auto-queues next section', () => {
    const s = applyGo(initialState(), SETLIST)
    expect(s.queuedSong).toBe(0)
    expect(s.queuedSection).toBe(1)
  })
  it('auto-queues next song at last section', () => {
    let s = applyGo(initialState(), SETLIST)   // song0/sec0 → queued 0/1
    s = applyGo(s, SETLIST)                    // song0/sec1 → queued 1/0
    expect(s.currentSong).toBe(0)
    expect(s.currentSection).toBe(1)
    expect(s.queuedSong).toBe(1)
    expect(s.queuedSection).toBe(0)
  })
  it('sets queued to -1 at end of setlist', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyGo(s, SETLIST)
    s = applyGo(s, SETLIST)
    expect(s.queuedSong).toBe(-1)
    expect(s.queuedSection).toBe(-1)
  })
  it('no-op when queuedSong is -1', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyGo(s, SETLIST)
    s = applyGo(s, SETLIST)
    const atEnd = s
    expect(applyGo(atEnd, SETLIST)).toEqual(atEnd)
  })
  it('clears blackout without advancing', () => {
    let s = applyGo(initialState(), SETLIST)
    const songBefore = s.currentSong
    s = applyBlackout(s)
    s = applyGo(s, SETLIST)
    expect(s.isBlackout).toBe(false)
    expect(s.currentSong).toBe(songBefore)
  })
})

describe('applySelection — song mode', () => {
  it('queues a specific song', () => {
    const s = applySelection(initialState(), 1, SETLIST)
    expect(s.queuedSong).toBe(1)
    expect(s.queuedSection).toBe(0)
  })
  it('no-op when index out of bounds', () => {
    const s = initialState()
    expect(applySelection(s, 5, SETLIST)).toEqual(s)
  })
  it('no-op on empty setlist', () => {
    const s = initialState()
    expect(applySelection(s, 0, EMPTY_SETLIST)).toEqual(s)
  })
})

describe('applySelection — section mode', () => {
  it('no-op when nothing is live', () => {
    const s = applyModeToggle(initialState())
    expect(applySelection(s, 0, SETLIST)).toEqual(s)
  })
  it('queues a specific section', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyModeToggle(s)
    s = applySelection(s, 1, SETLIST)
    expect(s.queuedSong).toBe(0)
    expect(s.queuedSection).toBe(1)
  })
  it('no-op when section index out of bounds', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyModeToggle(s)
    const before = s
    expect(applySelection(s, 5, SETLIST)).toEqual(before)
  })
})

describe('applyModeToggle', () => {
  it('toggles song ↔ section', () => {
    let s = initialState()
    s = applyModeToggle(s)
    expect(s.mode).toBe('section')
    s = applyModeToggle(s)
    expect(s.mode).toBe('song')
  })
})

describe('applyStandby', () => {
  it('resets to standby', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyStandby(s)
    expect(s.isLive).toBe(false)
    expect(s.currentSong).toBe(-1)
    expect(s.currentSection).toBe(-1)
  })
})

describe('buildPayload', () => {
  it('empty lyrics before going live', () => {
    const p = buildPayload(initialState(), SETLIST)
    expect(p.currentLyrics).toBe('')
    expect(p.songNumber).toBe(0)
  })
  it('correct lyrics after GO', () => {
    const s = applyGo(initialState(), SETLIST)
    const p = buildPayload(s, SETLIST)
    expect(p.currentLyrics).toBe('Amazing grace')
    expect(p.nextLyrics).toBe('My chains are gone')
    expect(p.songNumber).toBe(1)
    expect(p.sectionNumber).toBe(1)
  })
  it('6 buttonLabels always returned', () => {
    const p = buildPayload(initialState(), SETLIST)
    expect(p.buttonLabels).toHaveLength(6)
    expect(p.buttonLabels[2]).toBe('')
  })
  it('null next at end of setlist', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyGo(s, SETLIST)
    s = applyGo(s, SETLIST)
    const p = buildPayload(s, SETLIST)
    expect(p.nextLyrics).toBeNull()
    expect(p.nextSongTitle).toBeNull()
  })
})
