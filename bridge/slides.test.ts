import { describe, it, expect } from 'vitest'
import { chunkLineIndices } from './slides.js'

describe('chunkLineIndices — auto by words', () => {
  it('returns empty for no lines', () => {
    expect(chunkLineIndices([])).toEqual([])
  })

  it('keeps lines together under the word target', () => {
    // 6 + 5 = 11 words > 10 → split after first line
    expect(chunkLineIndices([
      'Amazing grace how sweet the sound',   // 6
      'That saved a wretch like me',         // 5
    ], undefined, 10)).toEqual([[0], [1]])
  })

  it('packs short lines together up to the target', () => {
    // 2 + 2 + 2 = 6 ≤ 10 → one slide
    expect(chunkLineIndices(['a b', 'c d', 'e f'], undefined, 10)).toEqual([[0, 1, 2]])
  })

  it('starts a new slide when the next line would exceed the target', () => {
    // 6 + 6 = 12 > 10
    expect(chunkLineIndices([
      'one two three four five six',
      'seven eight nine ten eleven twelve',
    ], undefined, 10)).toEqual([[0], [1]])
  })

  it('gives an over-long single line its own slide without splitting it', () => {
    expect(chunkLineIndices([
      'word word word word word word word word word word word word', // 12 words
      'short line',
    ], undefined, 10)).toEqual([[0], [1]])
  })

  it('keeps blank lines attached to the current slide', () => {
    expect(chunkLineIndices(['a b c', '', 'd e f'], undefined, 10)).toEqual([[0, 1, 2]])
  })
})

describe('chunkLineIndices — manual breaks', () => {
  it('splits exactly at the given break indices', () => {
    expect(chunkLineIndices(['l0', 'l1', 'l2', 'l3'], [2])).toEqual([[0, 1], [2, 3]])
  })

  it('supports multiple breaks', () => {
    expect(chunkLineIndices(['l0', 'l1', 'l2', 'l3'], [1, 3])).toEqual([[0], [1, 2], [3]])
  })

  it('ignores out-of-range and zero breaks', () => {
    expect(chunkLineIndices(['l0', 'l1', 'l2'], [0, 2, 99])).toEqual([[0, 1], [2]])
  })

  it('manual breaks override the word target entirely', () => {
    // would auto-pack into one slide, but a manual break forces two
    expect(chunkLineIndices(['a', 'b'], [1], 10)).toEqual([[0], [1]])
  })
})
