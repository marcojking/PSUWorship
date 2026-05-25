export type Mode = 'song' | 'section'

export interface LiveSetlistSection {
  type: string; label: string; lyrics: string; chords: string
}

export interface LiveSetlistSong {
  title: string; key?: string; sections: LiveSetlistSection[]
}

export interface LiveSetlist {
  name: string; pushedAt: number; songs: LiveSetlistSong[]
}

export interface BridgeState {
  mode:           Mode
  currentSong:    number  // -1 = standby
  currentSection: number  // -1 = standby
  queuedSong:     number  // -1 = end of setlist / no queue
  queuedSection:  number  // -1 = no queue
  isBlackout:     boolean
  isLive:         boolean
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
  setlistName:      string
  songCount:        number
  sectionCount:     number
  songNumber:       number
  sectionNumber:    number
}

export const EMPTY_SETLIST: LiveSetlist = { name: '', pushedAt: 0, songs: [] }

export function initialState(): BridgeState {
  return {
    mode: 'song', currentSong: -1, currentSection: -1,
    queuedSong: 0, queuedSection: 0, isBlackout: false, isLive: false,
  }
}

export function applyGo(state: BridgeState, setlist: LiveSetlist): BridgeState {
  if (setlist.songs.length === 0) return state
  if (state.isBlackout) return { ...state, isBlackout: false }
  if (state.queuedSong === -1) return state

  const newSong = state.queuedSong
  const newSection = state.queuedSection
  const song = setlist.songs[newSong]

  let nextQueuedSong: number, nextQueuedSection: number
  if (newSection + 1 < song.sections.length) {
    nextQueuedSong = newSong; nextQueuedSection = newSection + 1
  } else if (newSong + 1 < setlist.songs.length) {
    nextQueuedSong = newSong + 1; nextQueuedSection = 0
  } else {
    nextQueuedSong = -1; nextQueuedSection = -1
  }

  return {
    ...state, isLive: true,
    currentSong: newSong, currentSection: newSection,
    queuedSong: nextQueuedSong, queuedSection: nextQueuedSection,
  }
}

export function applySelection(state: BridgeState, buttonIndex: number, setlist: LiveSetlist): BridgeState {
  if (setlist.songs.length === 0) return state
  if (state.mode === 'song') {
    if (buttonIndex >= setlist.songs.length) return state
    return { ...state, queuedSong: buttonIndex, queuedSection: 0 }
  }
  if (state.currentSong === -1) return state
  const currentSong = setlist.songs[state.currentSong]
  if (buttonIndex >= currentSong.sections.length) return state
  return { ...state, queuedSong: state.currentSong, queuedSection: buttonIndex }
}

export function applyModeToggle(state: BridgeState): BridgeState {
  return { ...state, mode: state.mode === 'song' ? 'section' : 'song' }
}

export function applyBlackout(state: BridgeState): BridgeState {
  return { ...state, isBlackout: !state.isBlackout }
}

export function applyStandby(state: BridgeState): BridgeState {
  return { ...state, isLive: false, currentSong: -1, currentSection: -1 }
}

export function buildPayload(state: BridgeState, setlist: LiveSetlist): WSPayload {
  const curSong    = state.currentSong >= 0 ? setlist.songs[state.currentSong] : null
  const curSection = curSong && state.currentSection >= 0 ? curSong.sections[state.currentSection] : null
  const nxtSong    = state.queuedSong >= 0 ? (setlist.songs[state.queuedSong] ?? null) : null
  const nxtSection = nxtSong && state.queuedSection >= 0 ? (nxtSong.sections[state.queuedSection] ?? null) : null

  const buttonLabels = state.mode === 'song'
    ? Array.from({ length: 6 }, (_, i) => setlist.songs[i]?.title.slice(0, 12) ?? '')
    : Array.from({ length: 6 }, (_, i) => curSong?.sections[i]?.label ?? '')

  return {
    type: 'state', state,
    currentLyrics:    curSection?.lyrics ?? '',
    currentChords:    curSection?.chords ?? '',
    currentLabel:     curSection?.label  ?? '',
    currentSongTitle: curSong?.title     ?? '',
    nextLyrics:       nxtSection?.lyrics  ?? null,
    nextChords:       nxtSection?.chords  ?? null,
    nextLabel:        nxtSection?.label   ?? null,
    nextSongTitle:    nxtSong?.title      ?? null,
    buttonLabels,
    setlistName:  setlist.name,
    songCount:    setlist.songs.length,
    sectionCount: curSong?.sections.length ?? 0,
    songNumber:   state.currentSong    >= 0 ? state.currentSong    + 1 : 0,
    sectionNumber: state.currentSection >= 0 ? state.currentSection + 1 : 0,
  }
}
