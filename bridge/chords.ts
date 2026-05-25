export interface ChordPosition { chord: string; position: number }
export interface ChordLine { lyrics: string; chords: ChordPosition[] }

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

export function sectionToChordPro(lines: ChordLine[]): string {
  return lines.map(chordLineToChordPro).join('\n')
}

export function sectionToLyrics(lines: ChordLine[]): string {
  return lines.map(l => l.lyrics).join('\n')
}
