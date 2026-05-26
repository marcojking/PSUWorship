import type { ChordLine } from '@/lib/db'

export function chordLineToChordPro(line: ChordLine): string {
  if (!line.chords.length) return line.lyrics
  const sorted = [...line.chords].sort((a, b) => b.position - a.position)
  let result = line.lyrics
  for (const { chord, position } of sorted) {
    const pos = Math.min(position, result.length)
    result = result.slice(0, pos) + `[${chord}]` + result.slice(pos)
  }
  return result
}
