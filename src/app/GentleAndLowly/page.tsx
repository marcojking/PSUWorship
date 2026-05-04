'use client';

import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

const SONGS = [
  {
    title: 'Peace Like A River',
    credit: 'Marco King',
    note: 'Written and recorded at Penn State',
    video: '/gl/plar-studio.mp4',
  },
  {
    title: 'Look To The Flowers',
    credit: 'Gentle & Lowly',
    note: 'Recorded live — nature session',
    video: '/about/clip-05.mp4',
  },
  {
    title: 'With Me',
    credit: 'Gentle & Lowly',
    note: 'From the debut EP',
    video: null,
  },
];

const EP_PHOTOS = [
  { src: '/gl/ep-wide.jpg', alt: '' },
  { src: '/gl/ep-flowers.jpg', alt: '' },
  { src: '/gl/ep-water.jpg', alt: '' },
];

const ss = (s: React.CSSProperties) => s;

export default function GentleAndLowlyPage() {
  return (
    <div className="setlist-page" style={{ background: '#1a1714', color: '#f5ead6', minHeight: '100vh' }}>

      {/* ── Nav ── */}
      <SiteNav variant="dark" />

      {/* ── Hero ── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 28px 48px' }}>
        <p style={{
          fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif',
          fontSize: '0.58rem', fontWeight: 500, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'rgba(196,121,58,0.75)',
          marginBottom: 40,
        }}>
          Worship Music <span style={{ color: '#c4793a', fontWeight: 700 }}>&amp;</span> Arts Club at Penn State
        </p>

        <h1 style={{
          fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif',
          fontWeight: 200, fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
          letterSpacing: '0.32em', lineHeight: 1,
          textTransform: 'uppercase', color: '#f5ead6',
          marginBottom: 32,
        }}>
          GENTLE <span style={{ color: '#c4793a', fontWeight: 700, margin: '0 0.15em', letterSpacing: 0 }}>&amp;</span> LOWLY
        </h1>

        <div style={{ width: 48, height: 1, background: 'rgba(245,234,214,0.2)', marginBottom: 32 }} />

        <p style={{
          fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif',
          fontWeight: 300, fontSize: '1rem', lineHeight: 1.75,
          color: 'rgba(245,234,214,0.6)', maxWidth: 480,
          letterSpacing: '0.02em',
        }}>
          The recorded music side of WM&amp;A. Student-written songs, produced live.
          Quiet arrangements, honest words, unhurried pace.
        </p>
      </div>

      {/* ── Guitarist photo ── */}
      <div style={{ width: '100%', maxHeight: 480, overflow: 'hidden', position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gl/guitar.jpg"
          alt=""
          style={{
            width: '100%',
            height: '480px',
            objectFit: 'cover',
            objectPosition: 'center 20%',
            display: 'block',
            filter: 'brightness(0.75)',
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: 28,
          fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif',
          fontSize: '0.52rem',
          fontWeight: 500,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'rgba(245,234,214,0.5)',
        }}>
          Side A · recorded live
        </div>
      </div>

      {/* ── Music ── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 28px 0' }}>
        <p style={{
          fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif',
          fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: '#c4793a',
          marginBottom: 28,
        }}>
          Music
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SONGS.map((song, i) => (
            <div
              key={song.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1rem 0',
                borderBottom: '1px solid rgba(245,234,214,0.07)',
              }}
            >
              {/* Track number */}
              <div style={{
                fontFamily: "'SF Mono', ui-monospace, 'Courier New', monospace",
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: 'rgba(245,234,214,0.25)',
                width: 24,
                flexShrink: 0,
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>

              {/* Video preview */}
              {song.video ? (
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 8,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: '#242019',
                }}>
                  <video
                    src={song.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: 'rgba(245,234,214,0.04)',
                  border: '1px solid rgba(245,234,214,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: '1px solid rgba(245,234,214,0.2)',
                  }} />
                </div>
              )}

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontWeight: 600,
                  fontSize: '1.15rem',
                  color: '#f5ead6',
                  marginBottom: 2,
                }}>
                  {song.title}
                </p>
                <p style={{
                  fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif',
                  fontSize: '0.72rem',
                  fontWeight: 300,
                  color: 'rgba(245,234,214,0.35)',
                  letterSpacing: '0.04em',
                }}>
                  {song.credit} · {song.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── EP art photos ── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '56px 28px 0' }}>
        <p style={{
          fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif',
          fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: '#c4793a',
          marginBottom: 20,
        }}>
          Photos
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {EP_PHOTOS.map((photo) => (
            <div key={photo.src} style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1 / 1' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer credit ── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 28px 80px' }}>
        <div style={{ borderTop: '1px solid rgba(245,234,214,0.08)', paddingTop: 24 }}>
          <p style={{
            fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif',
            fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.25em',
            textTransform: 'uppercase', color: 'rgba(245,234,214,0.25)',
          }}>
            <span style={{ display: 'block', fontSize: '0.5rem', color: 'rgba(245,234,214,0.2)', marginBottom: 4 }}>
              Music by
            </span>
            GENTLE <span style={{ color: '#c4793a', fontWeight: 600 }}>&amp;</span> LOWLY
          </p>
        </div>
      </div>

    </div>
  );
}
