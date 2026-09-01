# Doxology part trainer — design

**Date:** 2026-09-01
**Route:** `/doxology`
**Status:** built, builds clean, verified in browser

## Problem

Four singers — two men, two women — need to learn their individual parts of a
four-part Doxology. They learn by ear, usually alone, usually on a phone.

## Scope

A **listening tool**, not a feedback tool. Parts play on a sampled piano; each
singer mutes or solos parts and adjusts their relative volume.

Explicitly out of scope: pitch detection. `/harmony` already implements it and it
can be layered on later, but it needs mic permissions and behaves poorly in a
room where other people are singing.

Requested and built: tempo control, phrase looping, count-in, starting pitch.

`Phrase.short` carries the loop-selector button label rather than deriving it
from position, because not every phrase is a numbered line of text — the Amen is
not "Line 5".

## Approach

Considered three:

1. **Pre-rendered stems** — four MP3s in HTML5 audio. Rejected: tempo change needs
   time-stretching and phrase looping needs sample-accurate seeking across four
   files that drift. Worst approach for the two features actually requested.
2. **Extend `/harmony`'s engine** — generalize `piano.ts` from melody/harmony to N
   parts. Rejected: `/harmony` is working software; refactoring its audio engine
   for an unrelated feature risks regression with no benefit to the thing changed.
3. **New route, new player, shared audio context.** ← chosen

`partPlayer.ts` imports only `getAudioContext()` and `resumeAudioContext()` from
`piano.ts`. `piano.ts` is otherwise untouched, so `/harmony` cannot regress.

## Data

`src/lib/music/arrangements/types.ts` — `Arrangement`, `ArrangedNote`, `Phrase`.

Notes carry absolute MIDI plus `startBeat` / `beats` rather than being a
sequential list. That is what makes looping cheap: a loop is a filter over a beat
range, not a special code path. Phrase boundaries live in the data, so the loop
selector needs no phrase-detection logic.

`source`, `verifiedAgainst`, and `license` are **required** fields. An arrangement
cannot exist in this codebase without citing where its notes came from.

## The arrangement

`src/lib/music/arrangements/old100th.ts` — OLD 100TH, A major, 42 beats,
default 60bpm.

**Source:** CPDL #02714, ed. John Henry Fowler, from the Genevan Psalter (1551).
Extracted from the edition's MusicXML, which carries four discrete SATB parts.

**Verified against:** CPDL #21518, ed. Jennifer Lee, from *55 Songs and Choruses
for Community Singing* (1917). All 32 soprano pitches identical across editions.

### The source swap, and why

The first build took its notes from the **Lee** edition, whose MusicXML is a
two-staff piano reduction: inner voices share staves and are separated by
`<backup>` and `<chord/>` elements. Assigning those stacked notes to voices is
guesswork, and the guess was wrong twice — bass F#2 instead of G2 under the
cadence on "flow" (a raw tritone against the soprano's B, and audible), and
tenor E3 in unison with the bass at beat 5.

Fowler's edition has four separate `<part>` elements. No voice inference is
needed, so the class of bug is gone rather than patched. Every one of the 36
verticals is now a recognizable G-major-scale sonority; the only three that
aren't triads are stepwise eighth-note passing tones in the lower voices.

**Lesson worth keeping:** prefer a source whose structure already encodes what
you need over a source you have to infer it from, even when the second is
easier to find.

### One deliberate departure from the source

Both editions are strictly isorhythmic — every note the same length. That is
authentic Genevan psalm-tune style, and it is not how anyone sings it. The last
note of each of the four lines is lengthened here to two beats, matching how
modern hymnals print the tune and giving singers a breath. Total length goes
32 → 36 beats. This is an editorial choice, marked as one in the file header.

Fowler's two-chord Amen is included, but lengthened from the printed two half
notes to half-plus-whole — the traditional hymnal shape, where the plagal chord
moves through and the tonic is left to ring. At the default 60bpm the final
chord holds four seconds.

It is worth singing for this group specifically: two sustained chords, no rhythm
to get wrong, and the biggest four-part payoff in the piece — a guaranteed win to
end on for three people who have not done this in front of a crowd. Skip it only
if the Doxology runs straight into the next song, where an Amen is a full stop.

**Consequence of the voicing:** the final Amen chord loses its third, because the
written tenor carried the C# and there is no tenor. It ends on a bare A–E fifth.
That is not a defect for a 1551 Genevan tune — an open-fifth final chord is
period-correct and reads as deliberate — but it is a result of who is singing,
not a choice made in the arrangement.

**Structural checks that pass:** 32 soprano notes = 8 syllables × 4 lines for
Long Metre; every part is contiguous with no gap or overlap from beat 0 to the
end; ranges land textbook SATB.

## Who sings what, and the key

Settled with Marco 2026-09-01, and it drives both the key and the tool's
defaults.

Marco leads on the melody. The other three have not sung to a crowd before, and
the Sept 13 HUB Lawn set is not where you want someone alone on an exposed line
for the first time. So the melody is **doubled at the octave**:

| Singer | Line | New to learn |
|---|---|---|
| Janae | melody, at pitch (E4-E5) | no |
| Cassidy | alto (C#4-A4) | yes |
| Marco | melody, 8vb (E3-E4) | no |
| Grant | bass (A2-A3) | yes |

Marco assigned these: Grant on bass, the low melody to himself, Janae on the
melody and Cassidy on alto. Alto is the harder seat - the only independent line,
and the only part with eighth notes in it.

Rows are ordered by pitch rather than by the order the names were given, so the
mixer reads top to bottom like a score.

Only two people learn a genuinely new part, and the tune survives one person
going quiet. The failure mode is also the safe one: a nervous singer who loses
their part drifts onto the melody, which here just sounds like more unison.

Dropping the written tenor line leaves 20 of 36 chords with one fewer voice, but
every one of those reduces to an open fifth or a bare third - never anything
dissonant. Bare fifths on a hymn are a texture, not a defect.

### How the tool models this

First attempt muted the tenor row and added a per-row 8vb button, so Marco could
flip the soprano row into his octave. That was wrong: the tool no longer played
what the group sounds like, and it made each singer configure their way to their
own part.

Now a mixer row is a **person**, not a stave. `VOICING` in `page.tsx` maps each
row to the arranged line it sings plus an octave, and `PartPlayer` grew a
`sources` map alongside `octaves`. The tenor bus carries the *soprano* line at
-1. All four rows are unmuted, so pressing Play sounds the real four-voice
texture with the melody doubled an octave apart.

The arrangement data is untouched by this - it stays a faithful transcription of
Fowler, written tenor line and all. Which line a person sings is a property of
this group, not of the music, so it lives in the page. Reverting to true SATB is
setting each `source` to its own id and clearing the octaves.

The voicing is applied in `getPlayer()` at construction rather than in
`handlePlay()`, because the starting-pitch button can fire before Play ever runs
and would otherwise sound the written tenor line to someone who sings the
melody.

### Why A, not G

The sources are in G, which puts Marco's melody at D3-D4. That is too low to
lead from outdoors on a PA - it fights the kick and bass guitar for the same
frequency space and will not carry.

Transposing *down* far enough to move the melody into a comfortable male range
is the obvious move and it does not work: it puts the bass at C2-D2, below the
bottom of a human male voice. The melody sets the ceiling and the bass falls out
the floor first. This is precisely why SATB puts the melody on top.

So: up a whole step. The cost is the soprano ceiling, and that cost turned out
to be small - her only three notes above B4 are **all single beats**, never
sustained, so a higher ceiling costs nothing held.

```
        Marco lead   soprano   alto      bass     peak
G       D3-D4        D4-D5     B3-G4     G2-G3    D5
A  <-   E3-E4        E4-E5     C#4-A4    A2-A3    E5
Bb      F3-F4        F4-F5     D4-Bb4    Bb2-Bb3  F5
```

Bb sits Marco's voice best but needs a capo and pushes her to F5. A is
open-chord friendly on guitar and the band will not fight it.

**Revert to G if the crowd is meant to sing along.** Congregational ceiling is
about D5, which is where G sits - not a coincidence. The Doxology is the single
most likely thing in the set for a lawn full of people to join uninvited, and A
puts it just past them. Transposition is one pass over the data, so this is a
cheap decision to reverse.

## Audio engine

`src/lib/audio/partPlayer.ts`. Four `GainNode`s, one per voice, into destination.
Mute and volume are gain changes on live nodes — never a rescheduling operation.

One `SplendidGrandPiano` per part, because smplr routes an instrument to a single
destination. Browser HTTP cache means only the first instance pays full download.
This matches the existing pattern in `piano.ts`.

Notes are scheduled at absolute `AudioContext` times. JavaScript timers only queue
the *next* loop iteration, never a note. The playhead reads `currentTime` via
`requestAnimationFrame`, so highlighting cannot drift from what is sounding.

**Deliberate simplification:** changing tempo restarts the current pass rather
than re-scheduling in place.

**Dropped:** no fallback synth. `piano.ts` needs one because it generates melodies
on demand; here the user presses Play once and a brief load state is acceptable.

## UI

`src/app/doxology/page.tsx`, styled per the WM&A design system — cream `#fff7eb`,
navy `#003049`, rust `#b45741`, Cormorant Garamond italic display, uppercase
Source Sans labels with wide tracking, hand-drawn 1.8px line icons, no emoji.

Four mixer rows (checkbox, name-as-solo, volume, starting-pitch button), a phrase
selector, transport with tempo/loop/count-in, and the full text with the current
syllable marked in rust at the playhead.

`globals.css` sets `overflow:hidden` on `html/body` for the trainer; added
`.doxology-page` to the existing `:has()` escape hatch so this page can scroll.

## Verification

- `tsc --noEmit` clean
- `next build` clean; `/doxology` prerenders static
- Loaded in browser, pressed Play: piano loaded, button state changed, and the
  playhead highlighted "bless-" — beat 5, which is the correct syllable for the
  elapsed time at 84bpm after a 4-beat count-in

## Not done

- Not committed to git.
- Audio was verified as *scheduled and tracking*; nobody has confirmed by ear that
  it sounds right. Sing along with it before trusting it.
- No last-verse descant yet. When wanted, it is a new arrangement file, not a code
  change — which was the point of making arrangements data.
- No key selector in the UI. The transposition is baked into the data. If G is
  wanted back, it is a one-line pass over the pitches, not a feature.
- `page.tsx` has a pre-existing lint error at the playhead effect
  (`setState` called synchronously inside `useEffect`). It predates this work and
  was left alone rather than refactored untested on a page about to be used at
  rehearsal.
