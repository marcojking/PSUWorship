'use client';
import { useState } from 'react';
import Slider from './Slider';

interface PersonalInfoProps {
  onNext: (data: { name: string; email: string; gradYear: number; weeklyHours: number }) => void;
  onBack: () => void;
}

export default function PersonalInfo({ onNext, onBack }: PersonalInfoProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gradYear, setGradYear] = useState(2028);
  const [weeklyHours, setWeeklyHours] = useState(3);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canAdvance = name.trim().length > 0 && emailValid;

  const inputClass =
    'w-full h-14 px-5 rounded-2xl border border-primary/15 bg-background text-lg text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors';

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label className="text-[0.7rem] font-semibold uppercase tracking-widest text-primary/50">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className={inputClass}
          autoComplete="name"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[0.7rem] font-semibold uppercase tracking-widest text-primary/50">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className={inputClass}
          autoComplete="email"
        />
      </div>

      <Slider
        label="Graduation Year"
        min={2026}
        max={2032}
        value={gradYear}
        onChange={setGradYear}
      />

      <Slider
        label="Weekly Hours Available"
        min={1}
        max={10}
        value={weeklyHours}
        onChange={setWeeklyHours}
        formatValue={(v) => `${v} hr${v === 1 ? '' : 's'}/week`}
        note="Non-binding — we just want to get a sense of your availability."
      />

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="h-14 px-8 rounded-full border border-primary/20 text-primary text-sm font-semibold tracking-widest uppercase transition-all hover:border-primary/50"
        >
          Back
        </button>
        <button
          disabled={!canAdvance}
          onClick={() => onNext({ name: name.trim(), email: email.trim(), gradYear, weeklyHours })}
          className="flex-1 h-14 rounded-full bg-primary text-background text-sm font-semibold tracking-widest uppercase transition-all hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
