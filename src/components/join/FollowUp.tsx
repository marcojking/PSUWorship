'use client';
import { useState } from 'react';

interface FollowUpProps {
  isSubmitting: boolean;
  onSubmit: (data: { requestsCall: boolean; phone: string }) => void;
  onBack: () => void;
}

export default function FollowUp({ isSubmitting, onSubmit, onBack }: FollowUpProps) {
  const [requestsCall, setRequestsCall] = useState(false);
  const [phone, setPhone] = useState('');

  const canSubmit = !requestsCall || phone.trim().length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-cormorant font-semibold text-3xl text-primary">One last thing.</h2>
        <p className="text-sm font-light text-primary/60 leading-relaxed">
          Would you like Marco to reach out for a call or in-person meeting?
        </p>
      </div>

      <label className="flex items-start gap-4 cursor-pointer">
        <div
          className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
            requestsCall ? 'bg-secondary border-secondary' : 'bg-background border-primary/25'
          }`}
          onClick={() => setRequestsCall((v) => !v)}
        >
          {requestsCall && (
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
              <path d="M1 5.5l4 4L13 1" stroke="#fff7eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="text-base font-semibold text-primary leading-snug">
          Yes, I'd love to connect with Marco before deciding
        </span>
      </label>

      {requestsCall && (
        <div className="flex flex-col gap-2">
          <label className="text-[0.7rem] font-semibold uppercase tracking-widest text-primary/50">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 555-867-5309"
            autoComplete="tel"
            className="w-full h-14 px-5 rounded-2xl border border-primary/15 bg-background text-lg text-primary placeholder:text-primary/25 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        </div>
      )}

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
          onClick={() => onSubmit({ requestsCall, phone: phone.trim() })}
          className="flex-1 h-14 rounded-full bg-primary text-background text-sm font-semibold tracking-widest uppercase transition-all hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}
