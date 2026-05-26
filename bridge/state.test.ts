import { describe, it, expect } from 'vitest'
import {
  initialState, applyGo, applyBack, applySelection, applyModeToggle,
  applyBlackout, applyStandby, buildPayload,
  EMPTY_SETLIST, type LiveSetlist, type LiveSlide,
} from './state.js'

function slide(label: string, lyrics: string, inSec = 0, count = 1): LiveSlide {
  return {
    type: 'verse', label, lyrics, chords: '',
    isSectionStart: inSec === 0, slideInSection: inSec, sectionSlideCount: count,
  }
}

// Song A: 3 slides (Verse 1 split into 2, Chorus 1). Song B: 1 slide.
const SETLIST: LiveSetlist = {
  name: 'Sunday', pushedAt: 1000,
  songs: [
    {
      title: 'Amazing Grace', key: 'G',
      slides: [
        slide('Verse 1', 'Amazing grace', 0, 2),
        slide('Verse 1', 'how sweet the sound', 1, 2),
        slide('Chorus', 'My chains are gone', 0, 1),
      ],
    },
    {
      title: 'How Great', key: 'A',
      slides: [slide('Verse 1', 'O Lord my God', 0, 1)],
    },
  ],
}

describe('initialState', () => {
  it('starts in standby with song 0 / slide 0 queued', () => {
    const s = initialState()
    expect(s.isLive).toBe(false)
    expect(s.currentSong).toBe(-1)
    expect(s.currentSlide).toBe(-1)
    expect(s.queuedSong).toBe(0)
    expect(s.queuedSlide).toBe(0)
    expect(s.mode).toBe('song')
  })
})

describe('applyGo', () => {
  it('no-op on empty setlist', () => {
    expect(applyGo(initialState(), EMPTY_SETLIST)).toEqual(initialState())
  })
  it('goes live on first GO and shows slide 0', () => {
    const s = applyGo(initialState(), SETLIST)
    expect(s.isLive).toBe(true)
    expect(s.currentSong).toBe(0)
    expect(s.currentSlide).toBe(0)
  })
  it('auto-queues the next slide within the song', () => {
    const s = applyGo(initialState(), SETLIST)
    expect(s.queuedSong).toBe(0)
    expect(s.queuedSlide).toBe(1)
  })
  it('advances slide by slide then rolls into the next song', () => {
    let s = applyGo(initialState(), SETLIST) // 0/0, q 0/1
    s = applyGo(s, SETLIST)                  // 0/1, q 0/2
    s = applyGo(s, SETLIST)                  // 0/2 (last slide of song A), q 1/0
    expect(s.currentSong).toBe(0)
    expect(s.currentSlide).toBe(2)
    expect(s.queuedSong).toBe(1)
    expect(s.queuedSlide).toBe(0)
  })
  it('queues -1 at the end of the setlist', () => {
    let s = initialState()
    for (let i = 0; i < 4; i++) s = applyGo(s, SETLIST)
    expect(s.currentSong).toBe(1)
    expect(s.currentSlide).toBe(0)
    expect(s.queuedSong).toBe(-1)
    expect(s.queuedSlide).toBe(-1)
  })
  it('no-op when queued is -1 (already at end)', () => {
    let s = initialState()
    for (let i = 0; i < 4; i++) s = applyGo(s, SETLIST)
    const atEnd = s
    expect(applyGo(atEnd, SETLIST)).toEqual(atEnd)
  })
  it('clears blackout without advancing', () => {
    let s = applyGo(initialState(), SETLIST)
    const slideBefore = s.currentSlide
    s = applyBlackout(s)
    s = applyGo(s, SETLIST)
    expect(s.isBlackout).toBe(false)
    expect(s.currentSlide).toBe(slideBefore)
  })
})

describe('applyBack', () => {
  it('no-op when not live', () => {
    const s = initialState()
    expect(applyBack(s, SETLIST)).toEqual(s)
  })
  it('steps the live slide back within a song and re-queues forward', () => {
    let s = applyGo(initialState(), SETLIST) // 0/0
    s = applyGo(s, SETLIST)                  // 0/1, q 0/2
    s = applyBack(s, SETLIST)                // back to 0/0
    expect(s.currentSong).toBe(0)
    expect(s.currentSlide).toBe(0)
    expect(s.queuedSong).toBe(0)
    expect(s.queuedSlide).toBe(1)
  })
  it('steps back across a song boundary', () => {
    let s = initialState()
    for (let i = 0; i < 4; i++) s = applyGo(s, SETLIST) // now song 1 / slide 0
    s = applyBack(s, SETLIST)                            // back to song 0 / last slide
    expect(s.currentSong).toBe(0)
    expect(s.currentSlide).toBe(2)
    expect(s.queuedSong).toBe(1)
    expect(s.queuedSlide).toBe(0)
  })
  it('no-op at the very first slide', () => {
    const s = applyGo(initialState(), SETLIST) // 0/0
    expect(applyBack(s, SETLIST)).toEqual(s)
  })
})

describe('applySelection — song mode', () => {
  it('queues a specific song at slide 0', () => {
    const s = applySelection(initialState(), 1, SETLIST)
    expect(s.queuedSong).toBe(1)
    expect(s.queuedSlide).toBe(0)
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

describe('applySelection — slide mode', () => {
  it('no-op when nothing is live', () => {
    const s = applyModeToggle(initialState())
    expect(applySelection(s, 0, SETLIST)).toEqual(s)
  })
  it('queues the first slide of the selected section', () => {
    // Song A sections: 0="Verse 1" (slides 0-1), 1="Chorus" (slide 2)
    let s = applyGo(initialState(), SETLIST)
    s = applyModeToggle(s)
    s = applySelection(s, 1, SETLIST) // select "Chorus"
    expect(s.queuedSong).toBe(0)
    expect(s.queuedSlide).toBe(2)
  })
  it('no-op when section index out of bounds', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyModeToggle(s)
    const before = s
    expect(applySelection(s, 5, SETLIST)).toEqual(before) // only 2 sections
  })
})

describe('applyModeToggle', () => {
  it('toggles song ↔ slide', () => {
    let s = initialState()
    s = applyModeToggle(s)
    expect(s.mode).toBe('slide')
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
    expect(s.currentSlide).toBe(-1)
  })
})

describe('buildPayload', () => {
  it('empty lyrics before going live', () => {
    const p = buildPayload(initialState(), SETLIST)
    expect(p.currentLyrics).toBe('')
    expect(p.songNumber).toBe(0)
  })
  it('correct slide content after GO', () => {
    const s = applyGo(initialState(), SETLIST)
    const p = buildPayload(s, SETLIST)
    expect(p.currentLyrics).toBe('Amazing grace')
    expect(p.nextLyrics).toBe('how sweet the sound')
    expect(p.songNumber).toBe(1)
    expect(p.slideNumber).toBe(1)
    expect(p.slideCount).toBe(3)
  })
  it('labels multi-slide sections with a counter', () => {
    const s = applyGo(initialState(), SETLIST)
    const p = buildPayload(s, SETLIST)
    expect(p.currentLabel).toBe('Verse 1 · 1/2')
  })
  it('labels single-slide sections without a counter', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyGo(s, SETLIST)
    s = applyGo(s, SETLIST) // Chorus (single slide)
    const p = buildPayload(s, SETLIST)
    expect(p.currentLabel).toBe('Chorus')
  })
  it('always returns 6 button labels (song titles in song mode)', () => {
    const p = buildPayload(initialState(), SETLIST)
    expect(p.buttonLabels).toHaveLength(6)
    expect(p.buttonLabels[0]).toBe('Amazing Grace')
    expect(p.buttonLabels[1]).toBe('How Great')
    expect(p.buttonLabels[2]).toBe('')
  })
  it('slide-mode button labels show one button per section', () => {
    let s = applyGo(initialState(), SETLIST)
    s = applyModeToggle(s)
    const p = buildPayload(s, SETLIST)
    expect(p.buttonLabels[0]).toBe('Verse 1')
    expect(p.buttonLabels[1]).toBe('Chorus')
    expect(p.buttonLabels[2]).toBe('')
  })
  it('currentButton/queuedButton track sections in slide mode', () => {
    let s = applyGo(initialState(), SETLIST) // live on Verse 1 slide 0, queued Verse 1 slide 1
    s = applyModeToggle(s)
    const p = buildPayload(s, SETLIST)
    expect(p.currentButton).toBe(0) // Verse 1
    expect(p.queuedButton).toBe(0)  // still Verse 1 (slide 1 of same section)
  })
  it('currentButton tracks the song in song mode', () => {
    const s = applyGo(initialState(), SETLIST)
    const p = buildPayload(s, SETLIST)
    expect(p.currentButton).toBe(0)
    expect(p.queuedButton).toBe(0)
  })
  it('null next at the end of the setlist', () => {
    let s = initialState()
    for (let i = 0; i < 4; i++) s = applyGo(s, SETLIST)
    const p = buildPayload(s, SETLIST)
    expect(p.nextLyrics).toBeNull()
    expect(p.nextSongTitle).toBeNull()
  })
})
