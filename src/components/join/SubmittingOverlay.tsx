'use client';
import { useEffect, useState } from 'react';

type Stage = 'uploading' | 'saving' | 'complete';

interface SubmittingOverlayProps {
  stage: Stage;
  onDone: () => void;
}

const STAGE_LABELS: Record<Stage, string> = {
  uploading: 'Uploading your video…',
  saving: 'Saving your application…',
  complete: 'You\'re in.',
};

const STAGE_HEADINGS: Record<Stage, string[]> = {
  uploading: ['Sending your', 'application.'],
  saving: ['Almost', 'there.'],
  complete: ['Done.', ''],
};

export default function SubmittingOverlay({ stage, onDone }: SubmittingOverlayProps) {
  const [fillPct, setFillPct] = useState(2);
  const [labelVisible, setLabelVisible] = useState(true);
  const [currentLabel, setCurrentLabel] = useState(STAGE_LABELS[stage]);
  const [headingVisible, setHeadingVisible] = useState(true);
  const [currentHeading, setCurrentHeading] = useState(STAGE_HEADINGS[stage]);

  // Drive fill pct based on stage
  useEffect(() => {
    if (stage === 'uploading') {
      const interval = setInterval(() => {
        setFillPct((prev) => {
          const target = 70;
          if (prev >= target) return prev;
          return prev + (target - prev) * 0.06;
        });
      }, 120);
      return () => clearInterval(interval);
    }

    if (stage === 'saving') {
      setFillPct(88);
    }

    if (stage === 'complete') {
      setFillPct(100);
      const t = setTimeout(onDone, 1100);
      return () => clearTimeout(t);
    }
  }, [stage, onDone]);

  // Crossfade label when stage changes
  useEffect(() => {
    setLabelVisible(false);
    const t1 = setTimeout(() => {
      setCurrentLabel(STAGE_LABELS[stage]);
      setLabelVisible(true);
    }, 260);

    setHeadingVisible(false);
    const t2 = setTimeout(() => {
      setCurrentHeading(STAGE_HEADINGS[stage]);
      setHeadingVisible(true);
    }, 200);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [stage]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
      style={{ background: '#fff7eb' }}
    >
      {/* Eyebrow */}
      <p
        className="text-[0.6rem] font-semibold tracking-[0.25em] uppercase mb-10"
        style={{ color: '#b45741', opacity: 0.7 }}
      >
        WM&A
      </p>

      {/* Heading */}
      <div
        className="text-center mb-16 transition-all duration-300"
        style={{ opacity: headingVisible ? 1 : 0, transform: headingVisible ? 'translateY(0)' : 'translateY(6px)' }}
      >
        <h1
          className="font-cormorant font-semibold leading-[1.05]"
          style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            color: '#003049',
            letterSpacing: '-0.01em',
          }}
        >
          {currentHeading[0]}
          {currentHeading[1] && (
            <>
              <br />
              <span style={{ fontStyle: 'italic' }}>{currentHeading[1]}</span>
            </>
          )}
        </h1>
      </div>

      {/* Loading bar */}
      <div className="w-full" style={{ maxWidth: '480px' }}>
        {/* Track */}
        <div
          className="relative w-full rounded-full overflow-hidden"
          style={{ height: '3px', background: 'rgba(0,48,73,0.1)' }}
        >
          {/* Fill */}
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full"
            style={{
              width: `${fillPct}%`,
              background: '#003049',
              transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '2px 0 16px rgba(127,160,175,0.7), 4px 0 32px rgba(127,160,175,0.3)',
            }}
          />

          {/* Ambient glow trail */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none join-progress-glow"
            style={{
              left: `${fillPct}%`,
              width: '30%',
              background: 'linear-gradient(90deg, rgba(127,160,175,0.25) 0%, transparent 100%)',
            }}
          />
        </div>

        {/* Stage label */}
        <div className="mt-6 text-center">
          <p
            className="font-cormorant italic transition-all duration-300"
            style={{
              fontSize: '1.05rem',
              color: 'rgba(0,48,73,0.45)',
              opacity: labelVisible ? 1 : 0,
              transform: labelVisible ? 'translateY(0)' : 'translateY(4px)',
              letterSpacing: '0.01em',
            }}
          >
            {currentLabel}
          </p>
        </div>

        {/* Pulsing dots */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: '4px',
                height: '4px',
                background: '#003049',
                opacity: stage === 'complete' ? 0 : 0.25,
                animation: stage !== 'complete' ? `submitting-dot 1.4s ease-in-out ${i * 0.2}s infinite` : 'none',
                transition: 'opacity 0.4s',
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes submitting-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(1); }
          40%            { opacity: 0.7; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
