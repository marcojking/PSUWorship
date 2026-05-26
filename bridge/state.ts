export type Mode = 'song' | 'slide'

export interface LiveSlide {
  type:              string   // section type (verse/chorus/...)
  label:             string   // section label, e.g. "Verse 1"
  lyrics:            string
  chords:            string
  isSectionStart:    boolean  // first slide of its section
  slideInSection:    number   // 0-based index within the section
  sectionSlideCount: number   // total slides in the section
}

export interface LiveSetlistSong {
  title: string
  key?:  string
  slides: LiveSlide[]
}

export interface LiveSetlist {
  name: string
  pushedAt: number
  songs: LiveSetlistSong[]
}

export interface BridgeState {
  mode:         Mode
  currentSong:  number  // -1 = standby
  currentSlide: number  // -1 = standby
  queuedSong:   number  // -1 = end of setlist / no queue
  queuedSlide:  number  // -1 = no queue
  isBlackout:   boolean
  isLive:       boolean
}

export interface WSPayload {
  type: 'state'
  state: BridgeState
  currentLyrics:    string
  currentChords:    string
  currentLabel:     string
  currentSongTitle: string
  nextLyrics:       string | null
  nextChords:       string | null
  nextLabel:        string | null
  nextSongTitle:    string | null
  buttonLabels:     string[]
  currentButton:    number   // which of the 6 buttons is live (-1 = none)
  queuedButton:     number   // which of the 6 buttons is queued (-1 = none)
  setlistName:      string
  songCount:        number
  slideCount:       number   // slides in the current song
  songNumber:       number   // 1-based, 0 = standby
  slideNumber:      number   // 1-based within current song, 0 = standby
}

export const EMPTY_SETLIST: LiveSetlist = { name: '', pushedAt: 0, songs: [] }

type Pos = { song: number; slide: number }

function nextPos(song: number, slide: number, setlist: LiveSetlist): Pos | null {
  const s = setlist.songs[song]
  if (!s) return null
  if (slide + 1 < s.slides.length) return { song, slide: slide + 1 }
  if (song + 1 < setlist.songs.length) return { song: song + 1, slide: 0 }
  return null
}

function prevPos(song: number, slide: number, setlist: LiveSetlist): Pos | null {
  if (slide - 1 >= 0) return { song, slide: slide - 1 }
  if (song - 1 >= 0) {
    const ps = setlist.songs[song - 1]
    if (ps && ps.slides.length > 0) return { song: song - 1, slide: ps.slides.length - 1 }
  }
  return null
}

// Slide indices that begin each section of a song (selection buttons map to these).
function sectionStarts(song: LiveSetlistSong): number[] {
  const starts = song.slides.map((s, i) => (s.isSectionStart ? i : -1)).filter(i => i >= 0)
  if (song.slides.length > 0 && (starts.length === 0 || starts[0] !== 0)) starts.unshift(0)
  return starts
}

// Which section (0-based) a slide belongs to.
function sectionIndexOf(song: LiveSetlistSong, slideIndex: number): number {
  const starts = sectionStarts(song)
  let idx = -1
  for (let k = 0; k < starts.length; k++) if (starts[k] <= slideIndex) idx = k
  return idx
}

export function initialState(): BridgeState {
  return {
    mode: 'song', currentSong: -1, currentSlide: -1,
    queuedSong: 0, queuedSlide: 0, isBlackout: false, isLive: false,
  }
}

export function applyGo(state: BridgeState, setlist: LiveSetlist): BridgeState {
  if (setlist.songs.length === 0) return state
  if (state.isBlackout) return { ...state, isBlackout: false }
  if (state.queuedSong === -1) return state

  const newSong = state.queuedSong
  const newSlide = state.queuedSlide
  const nx = nextPos(newSong, newSlide, setlist)

  return {
    ...state, isLive: true,
    currentSong: newSong, currentSlide: newSlide,
    queuedSong: nx ? nx.song : -1,
    queuedSlide: nx ? nx.slide : -1,
  }
}

// Step the live projector back one slide, immediately.
export function applyBack(state: BridgeState, setlist: LiveSetlist): BridgeState {
  if (!state.isLive || state.currentSong < 0) return state
  const pv = prevPos(state.currentSong, state.currentSlide, setlist)
  if (!pv) return state
  const nx = nextPos(pv.song, pv.slide, setlist) // == the slide we just left
  return {
    ...state,
    currentSong: pv.song, currentSlide: pv.slide,
    queuedSong: nx ? nx.song : -1,
    queuedSlide: nx ? nx.slide : -1,
  }
}

export function applySelection(state: BridgeState, buttonIndex: number, setlist: LiveSetlist): BridgeState {
  if (setlist.songs.length === 0) return state
  if (state.mode === 'song') {
    if (buttonIndex >= setlist.songs.length) return state
    return { ...state, queuedSong: buttonIndex, queuedSlide: 0 }
  }
  // slide mode — jump to a section of the current song (one button per section)
  if (state.currentSong === -1) return state
  const currentSong = setlist.songs[state.currentSong]
  if (!currentSong) return state
  const starts = sectionStarts(currentSong)
  if (buttonIndex >= starts.length) return state
  return { ...state, queuedSong: state.currentSong, queuedSlide: starts[buttonIndex] }
}

export function applyModeToggle(state: BridgeState): BridgeState {
  return { ...state, mode: state.mode === 'song' ? 'slide' : 'song' }
}

export function applyBlackout(state: BridgeState): BridgeState {
  return { ...state, isBlackout: !state.isBlackout }
}

export function applyStandby(state: BridgeState): BridgeState {
  return { ...state, isLive: false, currentSong: -1, currentSlide: -1 }
}

export function buildPayload(state: BridgeState, setlist: LiveSetlist): WSPayload {
  const curSong  = state.currentSong >= 0 ? setlist.songs[state.currentSong] : null
  const curSlide = curSong && state.currentSlide >= 0 ? curSong.slides[state.currentSlide] : null
  const nxtSong  = state.queuedSong >= 0 ? (setlist.songs[state.queuedSong] ?? null) : null
  const nxtSlide = nxtSong && state.queuedSlide >= 0 ? (nxtSong.slides[state.queuedSlide] ?? null) : null

  const curStarts = curSong ? sectionStarts(curSong) : []
  const buttonLabels = state.mode === 'song'
    ? Array.from({ length: 6 }, (_, i) => setlist.songs[i]?.title.slice(0, 14) ?? '')
    : Array.from({ length: 6 }, (_, i) => {
        const start = curStarts[i]
        if (start === undefined || !curSong) return ''
        return curSong.slides[start].label.slice(0, 14).trimEnd()
      })

  let currentButton = -1
  let queuedButton = -1
  if (state.mode === 'song') {
    currentButton = state.currentSong >= 0 && state.currentSong < 6 ? state.currentSong : -1
    queuedButton  = state.queuedSong  >= 0 && state.queuedSong  < 6 ? state.queuedSong  : -1
  } else if (curSong) {
    if (state.currentSlide >= 0) {
      const b = sectionIndexOf(curSong, state.currentSlide)
      currentButton = b >= 0 && b < 6 ? b : -1
    }
    if (state.queuedSong === state.currentSong && state.queuedSlide >= 0) {
      const b = sectionIndexOf(curSong, state.queuedSlide)
      queuedButton = b >= 0 && b < 6 ? b : -1
    }
  }

  return {
    type: 'state', state,
    currentLyrics:    curSlide?.lyrics ?? '',
    currentChords:    curSlide?.chords ?? '',
    currentLabel:     curSlide ? slideLabel(curSlide) : '',
    currentSongTitle: curSong?.title ?? '',
    nextLyrics:       nxtSlide?.lyrics ?? null,
    nextChords:       nxtSlide?.chords ?? null,
    nextLabel:        nxtSlide ? slideLabel(nxtSlide) : null,
    nextSongTitle:    nxtSong?.title ?? null,
    buttonLabels,
    currentButton,
    queuedButton,
    setlistName:  setlist.name,
    songCount:    setlist.songs.length,
    slideCount:   curSong?.slides.length ?? 0,
    songNumber:   state.currentSong  >= 0 ? state.currentSong  + 1 : 0,
    slideNumber:  state.currentSlide >= 0 ? state.currentSlide + 1 : 0,
  }
}

// "Verse 1" for single-slide sections, "Verse 1 · 2/3" for multi-slide ones.
function slideLabel(slide: LiveSlide): string {
  if (slide.sectionSlideCount <= 1) return slide.label
  return `${slide.label} · ${slide.slideInSection + 1}/${slide.sectionSlideCount}`
}
