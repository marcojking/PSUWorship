'use client';

// WM&A nav lockup — acronym + hairline rule + tagline
// The & is always rust (#b45741), one weight heavier than surrounding letters.
// On navy backgrounds pass variant="on-navy" for brightened rust (#d97757).

type LogoVariant = 'default' | 'on-navy';

interface LogoProps {
  className?: string;
  variant?: LogoVariant;
  size?: 'sm' | 'md';
}

export default function Logo({ className = '', variant = 'default', size = 'md' }: LogoProps) {
  const onNavy = variant === 'on-navy';
  const ampColor = onNavy ? '#d97757' : '#b45741';
  const textColor = onNavy ? '#fff7eb' : '#003049';
  const ruleColor = onNavy ? 'rgba(255,247,235,0.25)' : 'rgba(0,48,73,0.22)';
  const tagColor = onNavy ? 'rgba(255,247,235,0.5)' : 'rgba(0,48,73,0.6)';

  const acronymSize = size === 'sm' ? '1.4rem' : '1.75rem';
  const tagSize = size === 'sm' ? '0.48rem' : '0.54rem';
  const ruleHeight = size === 'sm' ? '22px' : '28px';

  return (
    <div className={`flex items-center gap-[14px] ${className}`} style={{ fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif' }}>
      {/* Acronym */}
      <span style={{ fontWeight: 700, fontSize: acronymSize, letterSpacing: '0.04em', lineHeight: 1, textTransform: 'uppercase', color: textColor }}>
        WM<span style={{ color: ampColor, fontWeight: 800, margin: '0 0.02em' }}>&amp;</span>A
      </span>

      {/* Hairline rule */}
      <div style={{ width: 1, height: ruleHeight, background: ruleColor, flexShrink: 0 }} />

      {/* Tagline */}
      <span style={{ fontWeight: 400, fontSize: tagSize, letterSpacing: '0.3em', textTransform: 'uppercase', color: tagColor, lineHeight: 1.3 }}>
        Worship Music<br />
        <span style={{ color: ampColor, fontWeight: 700 }}>&amp;</span> Arts at Penn State
      </span>
    </div>
  );
}
