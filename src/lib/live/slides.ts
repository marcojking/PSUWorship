import type { Section, ChordLine } from '@/lib/db'
import { transposeChordToKey } from '@/lib/chords/transposition'
import { chordLineToChordPro } from './convert'

export const DEFAULT_TARGET_WORDS = 10

export interface BuiltSlide {
  type:              string
  label:             string
  lyrics:            string
  chords:            string
  isSectionStart:    boolean
  slideInSection:    number
  sectionSlideCount: number
}

function wordCount(line: string): number {
  const t = line.trim()
  return t ? t.split(/\s+/).length : 0
}

// Mirror of bridge/slides.ts chunkLineIndices — keep in sync.
export function chunkLineIndices(
  lines: string[],
  breaks?: number[],
  targetWords: number = DEFAULT_TARGET_WORDS,
): number[][] {
  if (lines.length === 0) return []

  if (breaks && breaks.length) {
    const breakSet = new Set(breaks.filter(b => b > 0 && b < lines.length))
    const groups: number[][] = []
    let cur: number[] = []
    for (let i = 0; i < lines.length; i++) {
      if (breakSet.has(i) && cur.length) { groups.push(cur); cur = [] }
      cur.push(i)
    }
    if (cur.length) groups.push(cur)
    return groups
  }

  const groups: number[][] = []
  let cur: number[] = []
  let curWords = 0
  for (let i = 0; i < lines.length; i++) {
    const w = wordCount(lines[i])
    if (cur.length && curWords + w > targetWords) {
      groups.push(cur); cur = []; curWords = 0
    }
    cur.push(i); curWords += w
  }
  if (cur.length) groups.push(cur)
  return groups
}

function transposeLine(line: ChordLine, songKey: string, displayKey: string): ChordLine {
  if (displayKey === songKey || !line.chords.length) return line
  return {
    lyrics: line.lyrics,
    chords: line.chords.map(c => ({ ...c, chord: transposeChordToKey(c.chord, songKey, displayKey) })),
  }
}

// Compute the slide preview groups for one section (line-index groups).
export function sectionSlideGroups(section: Section, targetWords = DEFAULT_TARGET_WORDS): number[][] {
  return chunkLineIndices(section.lines.map(l => l.lyrics), section.slideBreaks, targetWords)
}

// Flatten a song's sections into projector-ready slides, transposing chords to displayKey.
export function songToSlides(
  sections: Section[],
  songKey: string,
  displayKey: string,
  targetWords = DEFAULT_TARGET_WORDS,
): BuiltSlide[] {
  const out: BuiltSlide[] = []
  for (const section of sections) {
    const groups = sectionSlideGroups(section, targetWords)
    groups.forEach((group, gi) => {
      const groupLines = group.map(i => section.lines[i])
      out.push({
        type:  section.type,
        label: section.label,
        lyrics: groupLines.map(l => l.lyrics).join('\n'),
        chords: groupLines.map(l => chordLineToChordPro(transposeLine(l, songKey, displayKey))).join('\n'),
        isSectionStart:    gi === 0,
        slideInSection:    gi,
        sectionSlideCount: groups.length,
      })
    })
  }
  return out
}
