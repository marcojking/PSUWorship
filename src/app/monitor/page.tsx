'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

type Slide = {
  label: string
  lyrics: string
  chords: string
  slideInSection: number
  sectionSlideCount: number
}

function slideLabel(s: Slide | null | undefined): string {
  if (!s) return ''
  if (s.sectionSlideCount <= 1) return s.label
  return `${s.label} · ${s.slideInSection + 1}/${s.sectionSlideCount}`
}

export default function OnlineMonitorPage() {
  const session = useQuery(api.liveSession.get)
  const setlist = useQuery(api.liveSetlist.get)

  if (session === undefined || setlist === undefined) {
    return <div className="min-h-screen bg-[#111]" />
  }

  if (session === null) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <p className="text-white/20 text-sm uppercase tracking-widest">Bridge offline</p>
      </div>
    )
  }

  const curSong  = session.currentSong >= 0 ? setlist?.songs[session.currentSong] : null
  const curSlide = curSong && session.currentSlide >= 0 ? curSong.slides[session.currentSlide] ?? null : null
  const nxtSong  = session.queuedSong >= 0 ? setlist?.songs[session.queuedSong] ?? null : null
  const nxtSlide = nxtSong && session.queuedSlide >= 0 ? nxtSong.slides[session.queuedSlide] ?? null : null

  return (
    <div className="min-h-screen bg-[#111] text-[#f0ede8] flex flex-col">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-2 flex items-center gap-3 text-xs">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${session.mode === 'song' ? 'bg-[#1e3a5f] text-[#7eb8f7]' : 'bg-[#3a1e5f] text-[#b07ef7]'}`}>
          {session.mode}
        </span>
        {session.isLive && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#1e4a1e] text-[#7af07a]">LIVE</span>}
        {session.isBlackout && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#5f1e1e] text-[#f07a7a]">BLACKOUT</span>}
        <span className="font-semibold">{curSong?.title ?? '—'}</span>
        <span className="ml-auto opacity-50">
          {session.isLive && curSong
            ? `Song ${session.currentSong + 1}/${setlist?.songs.length} · Slide ${session.currentSlide + 1}/${curSong.slides.length}`
            : 'Standby'}
        </span>
      </header>

      <main className="flex-1 p-3 flex flex-col gap-3 overflow-hidden">
        {!session.isLive ? (
          <div className="flex-1 flex items-center justify-center opacity-20 text-sm tracking-widest uppercase">
            Press GO to start service
          </div>
        ) : (
          <>
            {/* Current slide */}
            <div className="flex-[3] bg-[#1a1a1a] border border-[#252525] rounded-lg p-4 overflow-auto">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#7eb8f7] mb-2">{slideLabel(curSlide)}</div>
              <pre className="font-mono text-sm text-[#f0c060] whitespace-pre-wrap mb-2">{curSlide?.chords ?? ''}</pre>
              <pre className="text-xl whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>{curSlide?.lyrics ?? ''}</pre>
            </div>

            {/* Next slide */}
            <div className="flex-[1] bg-[#161616] border border-[#202020] rounded-lg p-3 overflow-hidden opacity-60">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-1">
                NEXT — {nxtSlide ? slideLabel(nxtSlide) : 'End of setlist'}
              </div>
              <pre className="font-mono text-xs text-[#f0c060] whitespace-pre-wrap">{nxtSlide?.chords ?? ''}</pre>
              <pre className="text-sm whitespace-pre-wrap mt-1" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>{nxtSlide?.lyrics ?? '(end)'}</pre>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
