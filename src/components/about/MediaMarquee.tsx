'use client';

import { useEffect, useRef } from 'react';

const ITEMS: Array<{ type: 'image' | 'video'; src: string }> = [
  { type: 'image', src: '/about/band-photo-wide.jpg' },
  { type: 'video', src: '/about/clip-01.mp4' },
  { type: 'image', src: '/about/ep-art-flowers.jpg' },
  { type: 'video', src: '/about/clip-05.mp4' },
  { type: 'image', src: '/about/band-photo-square.jpg' },
  { type: 'video', src: '/about/clip-02.mp4' },
  { type: 'image', src: '/about/ep-art-water.jpg' },
  { type: 'video', src: '/about/clip-03.mp4' },
  { type: 'video', src: '/about/clip-06.mp4' },
  { type: 'video', src: '/about/clip-04.mp4' },
];

const LOOP_ITEMS = [...ITEMS, ...ITEMS];

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
        @media (prefers-reduced-motion: reduce) {
          .wma-marquee-track {
            animation-play-state: paused;
          }
        }
      `}</style>

      <div ref={parallaxRef} style={{ width: '100%', willChange: 'transform' }}>
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
          <div
            className="wma-marquee-track"
            style={{
              display: 'flex',
              gap: '10px',
              height: H,
              width: 'max-content',
            }}
          >
            {LOOP_ITEMS.map((item, i) => (
              <div
                key={`${item.src}-${i}`}
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
                    preload="none"
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
