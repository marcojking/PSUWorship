// Canonical, tested slide-chunking logic.
// The Next.js push path mirrors this in src/lib/live/slides.ts — keep them in sync.

export const DEFAULT_TARGET_WORDS = 10

function wordCount(line: string): number {
  const t = line.trim()
  return t ? t.split(/\s+/).length : 0
}

// Group whole-line indices into slides.
// - If `breaks` is given, a new slide starts at each listed line index.
// - Otherwise lines are packed until adding the next would exceed targetWords.
// Lines are never split mid-line; a single over-long line gets its own slide.
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
