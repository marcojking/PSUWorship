'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function LivePage() {
  const session = useQuery(api.liveSession.get)
  const setlist = useQuery(api.liveSetlist.get)

  if (session === undefined || setlist === undefined) {
    return <div className="min-h-screen bg-black" />
  }

  if (session === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/20 text-sm uppercase tracking-[0.3em]">Service not active</p>
      </div>
    )
  }

  if (!session.isLive) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-white/15 text-3xl tracking-[0.5em] uppercase" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          WM&amp;A
        </p>
      </div>
    )
  }

  const song  = setlist?.songs[session.currentSong]
  const slide = song?.slides[session.currentSlide]

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] flex items-center justify-center transition-opacity duration-500"
      style={{ opacity: session.isBlackout ? 0 : 1 }}
    >
      <div className="text-center px-8 max-w-5xl w-full">
        <p className="text-white/30 text-sm uppercase tracking-[0.25em] mb-8 font-light">
          {song?.title}
        </p>
        <p
          className="text-white font-light leading-relaxed whitespace-pre-line"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 'clamp(1.5rem, 5vw, 4rem)' }}
        >
          {slide?.lyrics ?? ''}
        </p>
      </div>
    </div>
  )
}
