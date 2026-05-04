'use client';
import { useState, useRef, useEffect } from 'react';

interface RoleCardProps {
  title: string;
  description: string;
  variant: 'leadership' | 'team';
  selectionNumber: number | null;
  isDimmed: boolean;
  onToggle: () => void;
}

export default function RoleCard({
  title,
  description,
  variant,
  selectionNumber,
  isDimmed,
  onToggle,
}: RoleCardProps) {
  const [inCenter, setInCenter] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isSelected = selectionNumber !== null;

  // Only use scroll-based expand on touch devices — desktop relies on CSS hover
  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInCenter(entry.isIntersecting),
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const leadershipBase = isSelected
    ? 'bg-secondary border-secondary shadow-lg'
    : 'bg-primary border-transparent hover:-translate-y-0.5 hover:shadow-xl';

  const teamBase = isSelected
    ? 'bg-secondary/10 border-secondary'
    : 'bg-background border-primary/20 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md';

  // On mobile: open when in center of screen or selected
  // On desktop: open when selected only (CSS group-hover handles the rest)
  const forceOpen = inCenter || isSelected;

  const chipColor = variant === 'leadership' ? '#f5ead6' : '#b45741';
  const hairlineColor = variant === 'leadership' ? 'rgba(255,247,235,0.5)' : 'rgba(180,87,65,0.4)';

  return (
    <div
      ref={ref}
      onClick={onToggle}
      className={`
        group flex overflow-hidden rounded-2xl border cursor-pointer select-none transition-all duration-200 min-h-[100px]
        ${variant === 'leadership' ? leadershipBase : teamBase}
        ${isDimmed ? 'opacity-30 pointer-events-none' : ''}
      `}
    >
      {/* Left index chip — width slides in from 0 on selection */}
      <div
        style={{
          width: isSelected ? '40px' : '0px',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: "'SF Mono', ui-monospace, 'Courier New', monospace",
          fontWeight: 600,
          fontSize: '13px',
          letterSpacing: '0.08em',
          color: chipColor,
          pointerEvents: 'none',
        }}
      >
        {/* Vertical hairline on right edge of chip */}
        <div style={{
          position: 'absolute',
          right: 0, top: '14px', bottom: '14px',
          width: '1px',
          background: hairlineColor,
        }} />
        {isSelected && selectionNumber !== null
          ? String(selectionNumber).padStart(2, '0')
          : null}
      </div>

      <div className="flex-1 p-4 flex flex-col gap-1.5">
        <div
          className={`font-cormorant font-semibold leading-tight text-[1.1rem] ${
            variant === 'leadership'
              ? 'text-background'
              : isSelected ? 'text-secondary' : 'text-primary'
          }`}
        >
          {title}
        </div>

        {/* Grid trick: animates from 0fr → 1fr for smooth height transition */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            forceOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100'
          }`}
        >
          <div className={`overflow-hidden text-[0.72rem] font-light leading-relaxed ${
            variant === 'leadership' ? 'text-background/70' : 'text-primary/60'
          }`}>
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
