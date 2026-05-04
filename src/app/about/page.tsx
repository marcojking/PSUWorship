'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MediaMarquee } from '@/components/about/MediaMarquee';
import SiteNav from '@/components/SiteNav';

// ─── Types ────────────────────────────────────────────────────────────────────
type FaqItem = { q: string; a: string };

// ─── Data ─────────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    label: 'Write & Produce Original Music',
    body: 'Through our student band, we write, arrange, and record original worship music — entirely by Penn State students.',
    img: '/about/band-photo-square.jpg',
  },
  {
    label: 'Produce Events',
    body: 'From intimate living room sessions to large campus worship nights with guest artists, we bring people together through live music.',
    img: '/about/pillar-events.jpg',
  },
  {
    label: 'Learn Together',
    body: 'Internal events with club members and occasional guest speakers — covering worship theology and the craft of leading music well.',
    img: '/about/pillar-learn.jpg',
  },
];

const EVENTS = [
  {
    title: 'Pat Barrett — Worship Night',
    detail: 'Fall 2026 · Penn State Campus',
    badge: 'Tentative',
    badgeTentative: true,
  },
  {
    title: 'Caleb King — Worship Night',
    detail: 'Fall 2026 · Penn State Campus',
    badge: 'Tentative',
    badgeTentative: true,
  },
  {
    title: 'Songwriting Workshops',
    detail: 'Ongoing · Open to all members',
    badge: 'Recurring',
    badgeTentative: false,
  },
  {
    title: 'HUB Lawn Concert',
    detail: 'Outdoor worship for the whole campus community',
    badge: 'Annual',
    badgeTentative: false,
  },
];

const POSITIONS = [
  'Vice President',
  'Music Director',
  'Media Lead',
  'Graphic Design',
  'Secretary',
  'Event Coordinator',
  'Tech Lead',
  'Prayer Lead',
];

const FAQ: FaqItem[] = [
  {
    q: 'Do I have to be a Christian to join?',
    a: 'No. WM&A is open to any student at Penn State. We are a faith-based organization, so our mission and music are rooted in Christian worship — but we welcome anyone who is curious, creative, or just wants to be part of something meaningful.',
  },
  {
    q: "What if I'm not a musician?",
    a: 'There is a place for you here. We have roles in graphic design, photography, video, social media, event coordination, and more. If you create in any form, we want to know you.',
  },
  {
    q: 'How do I get involved?',
    a: "The best first step is to apply through our join page. You can apply for a specific role or just express interest in getting connected — we'll reach out from there.",
  },
  {
    q: 'Is there a membership fee?',
    a: 'No. Joining WM&A is free. We are a registered Penn State student organization. Optional financial support through our Give page helps us fund events, equipment, and recording projects.',
  },
];

// ─── Components ───────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-source-sans)',
      fontSize: '0.58rem',
      fontWeight: 700,
      letterSpacing: '0.26em',
      textTransform: 'uppercase',
      color: 'rgba(180,87,65,0.8)',
      marginBottom: '1rem',
    }}>
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div style={{
      width: '100%',
      height: 1,
      background: 'rgba(0,48,73,0.1)',
    }} />
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(0,48,73,0.09)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-source-sans)',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#003049',
          lineHeight: 1.35,
        }}>
          {item.q}
        </span>
        <span style={{
          fontFamily: 'var(--font-source-sans)',
          fontSize: '1.1rem',
          fontWeight: 300,
          color: 'rgba(0,48,73,0.4)',
          flexShrink: 0,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(45deg)' : 'none',
        }}>
          +
        </span>
      </button>
      {open && (
        <p style={{
          fontFamily: 'var(--font-source-sans)',
          fontSize: '0.95rem',
          fontWeight: 300,
          lineHeight: 1.7,
          color: 'rgba(0,48,73,0.65)',
          paddingBottom: '1.25rem',
          marginTop: '-0.25rem',
        }}>
          {item.a}
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <div
      style={{
        background: '#fff7eb',
        minHeight: '100vh',
        fontFamily: 'var(--font-source-sans)',
        color: '#003049',
      }}
      className="about-page"
    >

      {/* ── Nav ── */}
      <SiteNav action={
        <Link href="/join" style={{
          fontFamily: 'var(--font-source-sans)',
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: '#b45741',
          textDecoration: 'none',
        }}>
          Apply →
        </Link>
      } />

      {/* ── Hero ── */}
      <section style={{ maxWidth: '680px', margin: '0 auto', padding: '4rem 1.5rem 3rem' }}>
        <SectionLabel>Worship Music &amp; Arts Club at Penn State</SectionLabel>
        <h1 style={{
          fontFamily: 'var(--font-cormorant)',
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 'clamp(3rem, 10vw, 4.5rem)',
          lineHeight: 1.05,
          color: '#003049',
          marginBottom: '1.5rem',
        }}>
          About WM<span style={{ color: '#b45741' }}>&amp;</span>A
        </h1>
        <p style={{
          fontSize: '1.1rem',
          fontWeight: 300,
          lineHeight: 1.75,
          color: 'rgba(0,48,73,0.7)',
          maxWidth: '540px',
        }}>
          Worship Music and Arts Club exists to give Penn State students a space to use their gifts to worship God, and invite others in to the beauty and joy of who He is.
        </p>
      </section>

      {/* ── Media Marquee ── */}
      <section style={{ width: '100%' }}>
        <MediaMarquee />
      </section>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '0 1.5rem 6rem' }}>

        {/* ── What We Do ── */}
        <section style={{ padding: '3rem 0' }}>
          <SectionLabel>What We Do</SectionLabel>
          <div style={{
            display: 'grid',
            gap: '1px',
            background: 'rgba(0,48,73,0.09)',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid rgba(0,48,73,0.09)',
          }}>
            {PILLARS.map((p) => (
              <div key={p.label} style={{ background: '#fff7eb', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem', color: '#003049' }}>
                    {p.label}
                  </p>
                  <p style={{ fontWeight: 300, fontSize: '0.9rem', lineHeight: 1.65, color: 'rgba(0,48,73,0.6)', margin: 0 }}>
                    {p.body}
                  </p>
                </div>
                <div style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              </div>
            ))}
          </div>
        </section>


        <Divider />

        {/* ── Leadership / Open Positions ── */}
        <section style={{ padding: '3rem 0' }}>
          <SectionLabel>Join the Team</SectionLabel>
          <p style={{ fontSize: '1rem', fontWeight: 300, lineHeight: 1.75, color: 'rgba(0,48,73,0.7)', marginBottom: '1.75rem' }}>
            WM&amp;A is student-led. Our leadership team handles everything from event production and artist logistics to creative direction and community. All positions below are open for applications.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '2rem' }}>
            {POSITIONS.map((pos) => (
              <Link
                key={pos}
                href="/join"
                style={{
                  fontFamily: 'var(--font-source-sans)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#003049',
                  border: '1px solid rgba(0,48,73,0.18)',
                  borderRadius: '9999px',
                  padding: '0.45rem 1.1rem',
                  background: 'transparent',
                  letterSpacing: '0.01em',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                {pos}
              </Link>
            ))}
          </div>
          <Link href="/join" style={{
            display: 'inline-block',
            fontFamily: 'var(--font-source-sans)',
            fontSize: '0.9rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: '#b45741',
            textDecoration: 'none',
          }}>
            See open positions and apply →
          </Link>
        </section>

        <Divider />

        {/* ── FAQ ── */}
        <section style={{ padding: '3rem 0' }}>
          <SectionLabel>Common Questions</SectionLabel>
          {FAQ.map((item) => (
            <FaqRow key={item.q} item={item} />
          ))}
        </section>

        <Divider />

        {/* ── CTA ── */}
        <section style={{ padding: '3rem 0', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 'clamp(2rem, 7vw, 2.8rem)',
            color: '#003049',
            marginBottom: '0.75rem',
          }}>
            Get Involved
          </h2>
          <p style={{ fontSize: '0.95rem', fontWeight: 300, color: 'rgba(0,48,73,0.6)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Whether you want to join the team or support what we&apos;re building, there&apos;s a place for you.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/join" style={{
              display: 'inline-block',
              background: '#003049',
              color: '#fff7eb',
              fontFamily: 'var(--font-source-sans)',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              padding: '0.85rem 2rem',
              borderRadius: '8px',
              textDecoration: 'none',
            }}>
              Apply to Join
            </Link>
            <Link href="/give" style={{
              display: 'inline-block',
              background: 'transparent',
              color: '#003049',
              fontFamily: 'var(--font-source-sans)',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              padding: '0.85rem 2rem',
              borderRadius: '8px',
              border: '1px solid rgba(0,48,73,0.2)',
              textDecoration: 'none',
            }}>
              Give
            </Link>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(0,48,73,0.08)',
        padding: '1.5rem',
        textAlign: 'center',
        fontFamily: 'var(--font-source-sans)',
        fontSize: '0.72rem',
        fontWeight: 300,
        color: 'rgba(0,48,73,0.3)',
      }}>
        Worship Music &amp; Arts Club at Penn State ·{' '}
        <a href="mailto:wmaac@psu.edu" style={{ color: 'inherit', textDecoration: 'none' }}>
          wmaac@psu.edu
        </a>
      </footer>

    </div>
  );
}
