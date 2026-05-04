'use client';

import Link from 'next/link';
import Logo from './Logo';

interface SiteNavProps {
  variant?: 'light' | 'dark';
  action?: React.ReactNode;
}

export default function SiteNav({ variant = 'light', action }: SiteNavProps) {
  const border = variant === 'dark'
    ? '1px solid rgba(245,234,214,0.08)'
    : '1px solid rgba(0,48,73,0.08)';

  return (
    <nav style={{
      padding: '1.1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: border,
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <Logo size="sm" variant={variant === 'dark' ? 'on-navy' : 'default'} />
      </Link>
      {action}
    </nav>
  );
}
