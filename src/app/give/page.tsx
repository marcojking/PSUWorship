'use client';

import { useState } from 'react';

const PRESETS = [5, 10, 25];

export default function GivePage() {
  const [mode, setMode] = useState<'once' | 'monthly'>('once');
  const [selected, setSelected] = useState<number | null>(10);
  const [custom, setCustom] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amount = custom ? parseFloat(custom) : selected;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount <= 0) { setError('Please enter an amount.'); return; }
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/give/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100), mode, name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
      window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="setlist-page min-h-screen flex flex-col items-center justify-center px-5 py-16"
      style={{ background: '#fff7eb' }}>

      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[0.58rem] font-semibold tracking-[0.25em] uppercase mb-3"
            style={{ color: 'rgba(180,87,65,0.7)' }}>
            WM&A
          </p>
          <h1 className="font-cormorant font-semibold text-5xl mb-3" style={{ color: '#003049' }}>
            Give
          </h1>
          <p className="text-sm font-light leading-relaxed" style={{ color: 'rgba(0,48,73,0.55)' }}>
            Your gift helps us bring live worship experiences, equipment, and programming to Penn State.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Name + Email */}
          <div className="flex flex-col gap-3 mb-6">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,48,73,0.12)',
                color: '#003049',
              }}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,48,73,0.12)',
                color: '#003049',
              }}
            />
          </div>

          {/* One-time / Monthly toggle */}
          <div className="flex rounded-lg overflow-hidden mb-6"
            style={{ border: '1px solid rgba(0,48,73,0.15)' }}>
            {(['once', 'monthly'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="flex-1 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: mode === m ? '#003049' : 'transparent',
                  color: mode === m ? '#fff7eb' : 'rgba(0,48,73,0.45)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {m === 'once' ? 'One-time' : 'Monthly'}
              </button>
            ))}
          </div>

          {/* Amount presets */}
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            {PRESETS.map((p) => {
              const active = selected === p && !custom;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setSelected(p); setCustom(''); }}
                  className="py-3 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: active ? '#003049' : 'rgba(0,48,73,0.04)',
                    color: active ? '#fff7eb' : 'rgba(0,48,73,0.7)',
                    border: `1px solid ${active ? '#003049' : 'rgba(0,48,73,0.12)'}`,
                    cursor: 'pointer',
                  }}
                >
                  ${p}
                </button>
              );
            })}
          </div>

          {/* Custom amount */}
          <div className="relative mb-6">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: custom ? 'rgba(255,247,235,0.6)' : 'rgba(0,48,73,0.4)' }}>$</span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Custom amount"
              value={custom}
              onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
              className="w-full pl-7 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                background: custom ? '#003049' : 'transparent',
                border: `1px solid ${custom ? '#003049' : 'rgba(0,48,73,0.12)'}`,
                color: custom ? '#fff7eb' : '#003049',
              }}
            />
          </div>

          {error && (
            <p className="text-xs mb-4 text-center" style={{ color: '#b45741' }}>{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full py-3.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: '#003049', color: '#fff7eb', cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Redirecting…' : amount
              ? `Give $${Number(amount).toFixed(0)}${mode === 'monthly' ? '/mo' : ''} →`
              : 'Select an amount'}
          </button>

          <p className="text-center text-[0.6rem] mt-4 font-light"
            style={{ color: 'rgba(0,48,73,0.35)' }}>
            Secured by Stripe · WM&A is a registered student organization
          </p>

        </form>
      </div>
    </div>
  );
}
