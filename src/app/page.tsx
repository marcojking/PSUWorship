'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';

// SVG icon for Harmony Trainer - sound wave bars
const HarmonyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 sm:w-10 sm:h-10">
    <rect x="3" y="10" width="3" height="4" rx="1" fill="#fff7eb" />
    <rect x="8" y="6" width="3" height="12" rx="1" fill="#fff7eb" />
    <rect x="13" y="8" width="3" height="8" rx="1" fill="#fff7eb" />
    <rect x="18" y="5" width="3" height="14" rx="1" fill="#fff7eb" />
  </svg>
);

// SVG icon for About — info circle
const AboutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 sm:w-10 sm:h-10">
    <circle cx="12" cy="12" r="9" stroke="#fff7eb" strokeWidth="2" fill="none" />
    <line x1="12" y1="11" x2="12" y2="17" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="8" r="1" fill="#fff7eb" />
  </svg>
);

// SVG icon for Give — heart with hand
const GiveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 sm:w-10 sm:h-10">
    <path d="M12 21C12 21 3 15 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12z" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// SVG icon for Join — person with plus
const JoinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 sm:w-10 sm:h-10">
    <circle cx="9" cy="7" r="4" stroke="#fff7eb" strokeWidth="2" fill="none" />
    <path d="M2 21v-1a7 7 0 0 1 11.95-4.95" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" fill="none" />
    <line x1="19" y1="13" x2="19" y2="21" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" />
    <line x1="15" y1="17" x2="23" y2="17" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// SVG icon for Setlist Manager - document with lines
const SetlistIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 sm:w-10 sm:h-10">
    <rect x="4" y="3" width="16" height="18" rx="2" stroke="#fff7eb" strokeWidth="2" fill="none" />
    <line x1="8" y1="8" x2="16" y2="8" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="16" x2="13" y2="16" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const tools = [
  {
    id: 'join',
    title: 'Join the Team',
    description: 'Apply for a leadership role or team position in WM&A',
    icon: <JoinIcon />,
    href: '/join',
    color: 'bg-secondary',
  },
  {
    id: 'about',
    title: 'About WM&A',
    description: 'Our mission, what we do, and how to get involved',
    icon: <AboutIcon />,
    href: '/about',
    color: 'bg-secondary',
  },
  {
    id: 'give',
    title: 'Give',
    description: 'Support WM&A — help fund events, equipment, and recording projects',
    icon: <GiveIcon />,
    href: '/give',
    color: 'bg-secondary',
  },
  {
    id: 'harmony',
    title: 'Harmony Trainer',
    description: 'Practice singing vocal harmonies with real-time pitch feedback',
    icon: <HarmonyIcon />,
    href: '/harmony',
    color: 'bg-primary',
  },
  {
    id: 'setlist',
    title: 'Setlist Manager',
    description: 'Import chord charts, build setlists, and export for worship nights',
    icon: <SetlistIcon />,
    href: '/setlist',
    color: 'bg-primary',
  },
  // merch: hidden until rebranded
];

export default function HomePage() {
  return (
    <div className="setlist-page min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 sm:p-8 text-center">
        <Logo className="justify-center text-4xl sm:text-5xl mb-2" />
      </header>

      {/* Tool Cards */}
      <main className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <div className="grid gap-4 sm:gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group block bg-white rounded-2xl border border-primary/10 overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div className="p-6 sm:p-8 flex items-start gap-4 sm:gap-6">
                {/* Icon */}
                <div className={`${tool.color} text-secondary w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl shrink-0`}>
                  {tool.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold mb-1 group-hover:text-primary transition-colors">
                    {tool.title}
                  </h2>
                  <p className="text-sm sm:text-base opacity-60">
                    {tool.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="text-2xl opacity-30 group-hover:opacity-60 group-hover:translate-x-1 transition-all">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon placeholder */}
        <div className="mt-6 p-4 border-2 border-dashed border-primary/20 rounded-2xl text-center">
          <p className="text-sm opacity-40">More tools coming soon...</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs">
        <span style={{
          fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(0,48,73,0.35)',
        }}>
          WM<span style={{ color: '#b45741', fontWeight: 800 }}>&amp;</span>A
        </span>
        <span style={{
          fontFamily: 'var(--font-source-sans), "Source Sans 3", sans-serif',
          fontSize: '0.6rem',
          fontWeight: 300,
          letterSpacing: '0.08em',
          color: 'rgba(0,48,73,0.25)',
          marginLeft: '0.6em',
        }}>
          Worship Music &amp; Arts Club at Penn State
        </span>
      </footer>
    </div>
  );
}
