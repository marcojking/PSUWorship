'use client';
import { useState } from 'react';

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
  const [descOpen, setDescOpen] = useState(false);
  const isSelected = selectionNumber !== null;

  function handleClick() {
    const isMobile = window.matchMedia('(hover: none)').matches;
    if (isMobile && !isSelected && !descOpen) {
      setDescOpen(true);
      setTimeout(() => setDescOpen(false), 2000);
      return;
    }
    setDescOpen(false);
    onToggle();
  }

  const leadershipBase = isSelected
    ? 'bg-secondary border-secondary shadow-lg'
    : 'bg-primary border-transparent hover:-translate-y-0.5 hover:shadow-xl';

  const teamBase = isSelected
    ? 'bg-secondary/10 border-secondary'
    : 'bg-background border-primary/20 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md';

  return (
    <div
      onClick={handleClick}
      className={`
        group relative rounded-2xl border cursor-pointer select-none transition-all duration-200 min-h-[100px] overflow-hidden
        ${variant === 'leadership' ? leadershipBase : teamBase}
        ${isDimmed ? 'opacity-30 pointer-events-none' : ''}
      `}
    >
      {/* Selection number badge */}
      {isSelected && (
        <div
          className="join-badge-visible absolute top-2 right-3 font-cormorant font-bold leading-none pointer-events-none"
          style={{
            fontSize: '3rem',
            color: variant === 'leadership' ? 'rgba(196,145,58,0.9)' : 'rgba(180,87,65,0.7)',
          }}
        >
          {selectionNumber}
        </div>
      )}

      <div className="p-5 flex flex-col gap-1.5">
        {/* Title */}
        <div
          className={`font-cormorant font-semibold leading-tight text-[1.1rem] ${
            variant === 'leadership'
              ? 'text-background'
              : isSelected ? 'text-secondary' : 'text-primary'
          }`}
        >
          {title}
        </div>

        {/* Description — visible on desktop hover or mobile tap-open */}
        <div
          className={`text-[0.72rem] font-light leading-relaxed overflow-hidden transition-all duration-200 ${
            descOpen
              ? 'max-h-20 opacity-100'
              : 'max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100'
          } ${variant === 'leadership' ? 'text-background/70' : 'text-primary/60'}`}
        >
          {description}
        </div>
      </div>
    </div>
  );
}
