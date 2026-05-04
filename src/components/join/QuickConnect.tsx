'use client';

import { useState } from 'react';

interface QuickConnectProps {
  roles: string[];
  isSubmitting: boolean;
  onSubmit: (data: { name: string; contact: string }) => void;
  onBack: () => void;
}

export default function QuickConnect({ roles, isSubmitting, onSubmit, onBack }: QuickConnectProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  const canSubmit = name.trim().length > 0 && contact.trim().length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-cormorant font-semibold italic text-3xl sm:text-4xl text-primary leading-tight">
          Let's connect.
        </h2>
        <p className="text-sm font-light text-primary/55 leading-relaxed max-w-sm">
          Leave your name and the best way to reach you. Marco will be in touch to set up a time to chat.
        </p>
      </div>

      {/* Roles summary */}
      {roles.length > 0 && (
        <div style={{
          background: 'rgba(0,48,73,0.04)',
          border: '1px solid rgba(0,48,73,0.1)',
          borderRadius: 12,
          padding: '0.85rem 1.1rem',
        }}>
          <p style={{
            fontFamily: 'var(--font-source-sans)',
            fontSize: '0.58rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(180,87,65,0.7)',
            marginBottom: '0.35rem',
          }}>
            Interested in
          </p>
          <p className="text-sm font-light text-primary/70">
            {roles.join(', ')}
          </p>
        </div>
      )}

      {/* Name */}
      <div className="flex flex-col gap-2">
        <label className="text-[0.7rem] font-semibold uppercase tracking-widest text-primary/50">
          Your name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First and last name"
          autoComplete="name"
          className="w-full h-14 px-5 rounded-2xl border border-primary/15 bg-background text-lg text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
        />
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-2">
        <label className="text-[0.7rem] font-semibold uppercase tracking-widest text-primary/50">
          Phone or email
        </label>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Whatever works best for you"
          autoComplete="email"
          className="w-full h-14 px-5 rounded-2xl border border-primary/15 bg-background text-lg text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="h-14 px-8 rounded-full border border-primary/20 text-primary text-sm font-semibold tracking-widest uppercase transition-all hover:border-primary/50 disabled:opacity-40"
        >
          Back
        </button>
        <button
          disabled={!canSubmit || isSubmitting}
          onClick={() => onSubmit({ name: name.trim(), contact: contact.trim() })}
          className="flex-1 h-14 rounded-full bg-primary text-background text-sm font-semibold tracking-widest uppercase transition-all hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none"
        >
          {isSubmitting ? 'Sending…' : 'Request a call'}
        </button>
      </div>
    </div>
  );
}
