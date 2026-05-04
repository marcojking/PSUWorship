'use client';

import Link from 'next/link';

export default function GiveSuccessPage() {
  return (
    <div className="setlist-page min-h-screen flex flex-col items-center justify-center px-5 py-16"
      style={{ background: '#fff7eb' }}>
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 text-4xl" style={{ color: '#003049' }}>✓</div>
        <h1 className="font-cormorant font-semibold text-4xl mb-3" style={{ color: '#003049' }}>
          Thank you.
        </h1>
        <p className="text-sm font-light leading-relaxed mb-8" style={{ color: 'rgba(0,48,73,0.55)' }}>
          Your gift means a lot to us. You&apos;ll receive a receipt from Stripe shortly.
        </p>
        <Link href="/"
          className="inline-block px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: '#003049', color: '#fff7eb' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
