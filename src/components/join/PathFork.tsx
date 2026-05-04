'use client';

interface PathForkProps {
  onApply: () => void;
  onTalkFirst: () => void;
}

export default function PathFork({ onApply, onTalkFirst }: PathForkProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-cormorant font-semibold italic text-3xl sm:text-4xl text-primary leading-tight">
          How do you want to proceed?
        </h2>
        <p className="text-sm font-light text-primary/55 leading-relaxed max-w-sm">
          You can submit a full application now, or have a quick conversation with Marco first.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-2">

        {/* Apply now */}
        <button
          onClick={onApply}
          className="group text-left rounded-2xl border p-6 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          style={{ background: '#003049', borderColor: '#003049' }}
        >
          <div style={{
            fontFamily: 'var(--font-source-sans)',
            fontSize: '0.55rem',
            fontWeight: 700,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'rgba(255,247,235,0.45)',
          }}>
            Full application
          </div>
          <div className="font-cormorant font-semibold italic leading-tight"
            style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', color: '#f5ead6' }}>
            Submit an application.
          </div>
          <p className="text-sm font-light leading-relaxed" style={{ color: 'rgba(245,234,214,0.6)' }}>
            Fill out your info, record a short video, and we'll review your submission and reach out.
          </p>
          <span className="mt-auto text-sm font-semibold tracking-wide"
            style={{ color: '#b45741' }}>
            Start application →
          </span>
        </button>

        {/* Talk first */}
        <button
          onClick={onTalkFirst}
          className="group text-left rounded-2xl border p-6 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{
            background: '#fff7eb',
            borderColor: 'rgba(0,48,73,0.15)',
          }}
        >
          <div style={{
            fontFamily: 'var(--font-source-sans)',
            fontSize: '0.55rem',
            fontWeight: 700,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'rgba(180,87,65,0.65)',
          }}>
            Not sure yet
          </div>
          <div className="font-cormorant font-semibold italic text-primary leading-tight"
            style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
            Talk to us first.
          </div>
          <p className="text-sm font-light text-primary/55 leading-relaxed">
            Have a quick conversation with Marco before deciding. Just leave your name and contact — no form, no video.
          </p>
          <span className="mt-auto text-sm font-semibold tracking-wide"
            style={{ color: '#003049' }}>
            Request a call →
          </span>
        </button>

      </div>
    </div>
  );
}
