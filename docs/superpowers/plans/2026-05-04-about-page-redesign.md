# About Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/about` with the official mission statement, a full-width infinite-scroll media marquee placed high on the page, strategic photo placement in G&L and leadership sections, and open-position pills replacing the named leadership avatars.

**Architecture:** One new extracted component (`MediaMarquee`) handles the infinite scroll + parallax. The page file (`about/page.tsx`) is fully rewritten with updated copy, section order, and media. All media is copied into `public/about/` first. No new npm dependencies — marquee uses CSS `@keyframes`, parallax uses a native scroll listener.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, inline styles, CSS keyframe animation, `requestAnimationFrame` scroll listener.

> **Note:** No test framework is configured in this project. Verification steps use the running dev server at `http://localhost:3000/about`. Start it with `npm run dev` from the project root if not already running.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `public/about/` | Create + populate | All images and video clips for the page |
| `src/components/about/MediaMarquee.tsx` | Create | Infinite-scroll marquee strip with parallax |
| `src/app/about/page.tsx` | Full rewrite | All sections: hero, marquee, mission, pillars, events, G&L, leadership, FAQ, CTA |
| `src/app/globals.css` | Already done | `.about-page` scroll override |

---

## Task 1: Copy media files into `public/about/`

**Files:**
- Create: `public/about/` directory with 8 media files

- [ ] **Step 1: Run the copy script**

Open PowerShell and run:

```powershell
$wma = "C:\Users\marco\Desktop\ProjectOS\PROJECTS\WMA"
$dest = "C:\Users\marco\Desktop\ProjectOS\PROJECTS\WMA\WMA_Website\30_CODE\WMA\public\about"
New-Item -ItemType Directory -Path $dest -Force

Copy-Item "$wma\GeneralMedia\BandPhoto\BandPhoto_OG.jpg"           "$dest\band-photo-wide.jpg"
Copy-Item "$wma\GeneralMedia\BandPhoto\BandPhoto_1X1.jpg"           "$dest\band-photo-square.jpg"
Copy-Item "$wma\260122_WMA_EP\40_OUTPUT\40_PHOTO\DSC09113.jpg"      "$dest\ep-art-flowers.jpg"
Copy-Item "$wma\260122_WMA_EP\40_OUTPUT\40_PHOTO\DSC09144.jpg"      "$dest\ep-art-water.jpg"
Copy-Item "$wma\260429_WMA_LeadershipInterestVideo\02_MEDIA\251011-PSUWorship-ColinCas-LivingroomWorship-ShortForm.mp4"   "$dest\clip-01.mp4"
Copy-Item "$wma\260429_WMA_LeadershipInterestVideo\02_MEDIA\251026-PSUWorship-Group-DelWorship_Gratitude_SF.mp4"          "$dest\clip-02.mp4"
Copy-Item "$wma\260429_WMA_LeadershipInterestVideo\02_MEDIA\GodImJustGreatful.mp4"                                        "$dest\clip-03.mp4"
Copy-Item "$wma\260429_WMA_LeadershipInterestVideo\02_MEDIA\Colin.mp4"                                                    "$dest\clip-04.mp4"
```

- [ ] **Step 2: Verify all 8 files exist**

```powershell
Get-ChildItem "C:\Users\marco\Desktop\ProjectOS\PROJECTS\WMA\WMA_Website\30_CODE\WMA\public\about"
```

Expected: 4 `.jpg` files + 4 `.mp4` files, all non-zero size.

- [ ] **Step 3: Commit**

```bash
git add public/about/
git commit -m "feat: add about page media assets (photos + video clips)"
```

---

## Task 2: Create `MediaMarquee` component

**Files:**
- Create: `src/components/about/MediaMarquee.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/about/MediaMarquee.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';

const ITEMS: Array<{ type: 'image' | 'video'; src: string }> = [
  { type: 'image', src: '/about/band-photo-wide.jpg' },
  { type: 'video', src: '/about/clip-01.mp4' },
  { type: 'image', src: '/about/ep-art-flowers.jpg' },
  { type: 'video', src: '/about/clip-02.mp4' },
  { type: 'image', src: '/about/band-photo-square.jpg' },
  { type: 'video', src: '/about/clip-03.mp4' },
  { type: 'image', src: '/about/ep-art-water.jpg' },
  { type: 'video', src: '/about/clip-04.mp4' },
];

const H = 340;

export function MediaMarquee() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!parallaxRef.current) return;
        const rect = parallaxRef.current.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const elementCenter = rect.top + rect.height / 2;
        const offset = (elementCenter - viewportCenter) * 0.06;
        parallaxRef.current.style.transform = `translateY(${offset}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Duplicate items for seamless loop
  const loopItems = [...ITEMS, ...ITEMS];

  return (
    <>
      <style>{`
        @keyframes wma-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .wma-marquee-track {
          animation: wma-marquee 44s linear infinite;
          will-change: transform;
        }
        .wma-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Parallax outer wrapper — receives the translateY */}
      <div ref={parallaxRef} style={{ width: '100%', willChange: 'transform' }}>
        {/* Clip container with fade masks */}
        <div
          style={{
            overflow: 'hidden',
            height: H,
            maskImage:
              'linear-gradient(to right, transparent, black 7%, black 93%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 7%, black 93%, transparent)',
          }}
        >
          {/* Scrolling track */}
          <div
            className="wma-marquee-track"
            style={{
              display: 'flex',
              gap: '10px',
              height: H,
              width: 'max-content',
            }}
          >
            {loopItems.map((item, i) => (
              <div
                key={i}
                style={{
                  height: H,
                  flexShrink: 0,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,48,73,0.06)',
                }}
              >
                {item.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt=""
                    draggable={false}
                    style={{
                      height: H,
                      width: 'auto',
                      maxWidth: '560px',
                      minWidth: '220px',
                      objectFit: 'cover',
                      display: 'block',
                      userSelect: 'none',
                    }}
                  />
                ) : (
                  <video
                    src={item.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                      height: H,
                      width: 'auto',
                      maxWidth: '260px',
                      minWidth: '160px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors on the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/about/MediaMarquee.tsx
git commit -m "feat: add MediaMarquee component — infinite scroll + parallax"
```

---

## Task 3: Rewrite `about/page.tsx` — Hero + Marquee + Mission

**Files:**
- Modify: `src/app/about/page.tsx`

This task rewrites the full file. Do it in one replace. The complete file follows — tasks 3, 4, 5, 6 each build on the previous version. **Task 3 writes the full file with hero + marquee + mission sections complete; remaining sections are stubs that get filled in Tasks 4–6.**

- [ ] **Step 1: Replace the full file**

Overwrite `src/app/about/page.tsx` with:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MediaMarquee } from '@/components/about/MediaMarquee';

// ─── Types ────────────────────────────────────────────────────────────────────
type FaqItem = { q: string; a: string };

// ─── Data ─────────────────────────────────────────────────────────────────────
const VALUES = [
  'We use our gifts for something bigger than ourselves.',
  'We believe a college campus is one of the most fertile places in the world for music to matter.',
  'We welcome anyone who is creative, curious, or just wants to belong.',
];

const PILLARS = [
  {
    label: 'Write & Produce Original Music',
    body: 'Through Gentle & Lowly, we write, arrange, and record original worship music — entirely by Penn State students.',
  },
  {
    label: 'Produce Events',
    body: 'From intimate living room sessions to large campus worship nights with guest artists, we bring people together through live music.',
  },
  {
    label: 'Learn Together',
    body: 'Weekly time with each other and occasional guest speakers — covering worship theology and the craft of leading music well.',
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
  {
    q: 'What leadership roles are open?',
    a: "Each semester we recruit for positions including Vice President, Music Director, Media Lead, Graphic Design, Secretary, Event Coordinator, Tech Lead, and Prayer Lead. Check the join page for what's currently open.",
  },
  {
    q: 'What is Gentle & Lowly?',
    a: "Gentle & Lowly is WM&A's primary student band. We write and record original worship music, with our first EP written and recorded entirely by Penn State students. The band operates under the WM&A umbrella and is our main musical project.",
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
      <nav style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,48,73,0.08)',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-source-sans)',
          fontSize: '1.15rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'rgba(0,48,73,0.55)',
          textDecoration: 'none',
        }}>
          WM<span style={{ color: '#b45741', fontWeight: 800, margin: '0 0.02em' }}>&amp;</span>A
        </Link>
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
      </nav>

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
      <section style={{ width: '100%', marginBottom: '0' }}>
        <MediaMarquee />
      </section>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '0 1.5rem 6rem' }}>

        {/* ── Who We Are / Values ── */}
        <section style={{ padding: '3.5rem 0' }}>
          <SectionLabel>Who We Are</SectionLabel>
          <p style={{ fontSize: '1rem', fontWeight: 300, lineHeight: 1.75, color: 'rgba(0,48,73,0.7)', marginBottom: '1rem' }}>
            WM<span style={{ color: '#b45741', fontWeight: 400 }}>&amp;</span>A exists to give Penn State students a place to use their creative gifts for something bigger than themselves. We believe music and art are powerful — and that a college campus is one of the most fertile places in the world to see them used well.
          </p>
          <p style={{ fontSize: '1rem', fontWeight: 300, lineHeight: 1.75, color: 'rgba(0,48,73,0.7)', marginBottom: '2rem' }}>
            We are a registered Penn State student organization. Our members span every major, every background, and every skill level. Some play instruments, some design graphics, some run sound. What we share is a desire to create, connect, and contribute to something that lasts beyond a semester.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {VALUES.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
                <span style={{
                  color: '#b45741',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  marginTop: '0.2rem',
                  flexShrink: 0,
                }}>
                  —
                </span>
                <p style={{ fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.65, color: 'rgba(0,48,73,0.75)', margin: 0 }}>
                  {v}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Divider />

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
              <div key={p.label} style={{ background: '#fff7eb', padding: '1.5rem 1.75rem' }}>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', color: '#003049' }}>
                  {p.label}
                </p>
                <p style={{ fontWeight: 300, fontSize: '0.9rem', lineHeight: 1.65, color: 'rgba(0,48,73,0.6)', margin: 0 }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* ── Events ── */}
        <section style={{ padding: '3rem 0' }}>
          <SectionLabel>Events &amp; Community</SectionLabel>
          <p style={{ fontSize: '1rem', fontWeight: 300, lineHeight: 1.75, color: 'rgba(0,48,73,0.7)', marginBottom: '2rem' }}>
            We bring students together through live worship events throughout the year — from small in-house gatherings to large open campus concerts. This fall we are working to bring professional worship artists to campus and continuing our ongoing workshop programming.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {EVENTS.map((e) => (
              <div key={e.title} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '1rem 1.25rem',
                background: 'rgba(0,48,73,0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(0,48,73,0.08)',
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem', margin: '0 0 0.2rem' }}>
                    {e.title}
                  </p>
                  <p style={{ fontWeight: 300, fontSize: '0.8rem', color: 'rgba(0,48,73,0.5)', margin: 0 }}>
                    {e.detail}
                  </p>
                </div>
                <span style={{
                  fontFamily: 'var(--font-source-sans)',
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: e.badgeTentative ? 'rgba(0,48,73,0.4)' : '#b45741',
                  background: e.badgeTentative ? 'rgba(0,48,73,0.06)' : 'rgba(180,87,65,0.1)',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  flexShrink: 0,
                }}>
                  {e.badge}
                </span>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* ── Gentle & Lowly ── */}
        <section style={{ padding: '3rem 0' }}>
          <SectionLabel>Featured Project</SectionLabel>
          <div style={{
            background: '#1a1714',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            {/* Band photo header */}
            <div style={{ width: '100%', height: '220px', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about/band-photo-wide.jpg"
                alt="Gentle & Lowly band"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 30%',
                  display: 'block',
                }}
              />
            </div>
            {/* Card body */}
            <div style={{ padding: '1.75rem 2rem 2rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'var(--font-source-sans)',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: 'rgba(196,121,58,0.7)',
                    marginBottom: '0.6rem',
                  }}>
                    WM&amp;A Student Band
                  </p>
                  <h2 style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontStyle: 'italic',
                    fontWeight: 600,
                    fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
                    color: '#f5ead6',
                    lineHeight: 1.1,
                    marginBottom: '0.9rem',
                  }}>
                    Gentle <span style={{ color: '#c4793a' }}>&amp;</span> Lowly
                  </h2>
                  <p style={{
                    fontSize: '0.9rem',
                    fontWeight: 300,
                    lineHeight: 1.7,
                    color: 'rgba(245,234,214,0.6)',
                    marginBottom: '1.25rem',
                  }}>
                    Our primary student band, writing and recording original worship music at Penn State. The debut EP was written, arranged, and recorded entirely by students — and we plan to keep making records.
                  </p>
                  <Link href="/GentleAndLowly" style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-source-sans)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: '#c4793a',
                    textDecoration: 'none',
                  }}>
                    Visit Gentle &amp; Lowly →
                  </Link>
                </div>
                {/* EP art accent */}
                <div style={{
                  flexShrink: 0,
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid rgba(196,121,58,0.3)',
                  marginTop: '0.25rem',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/about/ep-art-flowers.jpg"
                    alt="EP artwork"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </div>
            </div>
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
              <span
                key={pos}
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
                }}
              >
                {pos}
              </span>
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
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Check in browser**

Open `http://localhost:3000/about`. Verify:
- Page scrolls
- Hero text shows official mission statement
- Marquee appears right below hero, scrolling left with photos and videos visible
- Parallax: scroll the page and watch the marquee strip move slightly slower than the content above/below it
- Fade masks are visible on the left and right edges of the marquee
- Hovering the marquee pauses the animation
- All three pillar cards render
- Events show — "Tentative" badges appear in muted navy tone, "Recurring"/"Annual" in rust
- G&L card: band photo fills the top, EP art square appears bottom-right of text
- Leadership: position pills render in a wrapping row, "See open positions and apply →" link below
- FAQ accordion works
- CTA buttons render

- [ ] **Step 4: Commit**

```bash
git add src/app/about/page.tsx src/components/about/MediaMarquee.tsx
git commit -m "feat: rewrite about page — marquee, mission, G&L media, leadership pills"
```

---

## Task 4: Verify video autoplay on iOS Safari (if testable)

**Files:** No code changes — this is a verification step.

- [ ] **Step 1: Check video attributes**

All `<video>` elements in `MediaMarquee.tsx` must have all four attributes: `autoPlay muted loop playsInline`. Open `src/components/about/MediaMarquee.tsx` and confirm line:

```tsx
<video src={item.src} autoPlay muted loop playsInline style={{ ... }} />
```

All four are present. No change needed.

- [ ] **Step 2: Check .mp4 files play in Chrome**

In the running dev server, right-click one of the video items in the marquee and select "Show controls" (or use browser dev tools). Confirm the video is playing.

If any video shows a blank/black box: the file may be corrupted or encoded in an unsupported codec. Replace that `clip-0N.mp4` source with one of the other `.mp4` files from `260429_WMA_LeadershipInterestVideo/02_MEDIA/`.

- [ ] **Step 3: Commit if any source swaps were needed**

```bash
git add public/about/
git commit -m "fix: swap marquee video source for browser compatibility"
```

---

## Task 5: Final polish pass

**Files:**
- Modify: `src/components/about/MediaMarquee.tsx` (speed / height tuning if needed)
- Modify: `src/app/about/page.tsx` (copy tweaks if needed)

- [ ] **Step 1: Check marquee speed**

Watch the marquee for 10 seconds. The full loop should take ~44 seconds. If it feels too fast (items zip by) increase the animation duration in `MediaMarquee.tsx`:

```css
animation: wma-marquee 56s linear infinite;
```

If too slow, bring it down to `36s`.

- [ ] **Step 2: Check marquee height on mobile**

Resize browser to 375px wide. Confirm the marquee strip is visible and not overflowing. If items look too tall at mobile, add a media query override in the `<style>` block:

```css
@media (max-width: 640px) {
  .wma-marquee-track > div {
    height: 220px !important;
  }
}
```

And update `H` references in the component or set the track height dynamically. The simpler fix: add a wrapper that uses a CSS custom property for height.

- [ ] **Step 3: Check parallax intensity**

Scroll the page slowly past the marquee. The strip should visibly shift at a different rate than the page. If the effect is too subtle, increase the factor in `MediaMarquee.tsx` from `0.06` to `0.10`. If it causes the strip to clip into surrounding sections, reduce to `0.04`.

- [ ] **Step 4: Final commit**

```bash
git add src/components/about/MediaMarquee.tsx src/app/about/page.tsx
git commit -m "polish: about page marquee speed + parallax tuning"
```
