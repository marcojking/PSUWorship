'use client';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useState } from 'react';

type Submission = {
  _id: string;
  name: string;
  email: string;
  gradYear: number;
  weeklyHours: number;
  roles: string[];
  worshipTeam: boolean;
  instruments?: string;
  videoUrl: string | null;
  submittedAt: number;
};

type CallRequest = {
  _id: string;
  name: string;
  contact: string;
  roles: string[];
  submittedAt: number;
};

export default function ApplicationsPage() {
  const submissions = useQuery(api.leadershipInterest.list, {}) as Submission[] | undefined;
  const callRequests = useQuery(api.leadershipInterest.listCallRequests, {}) as CallRequest[] | undefined;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="admin-page min-h-screen" style={{ background: '#fff7eb' }}>

      {/* ── Top bar ── */}
      <div style={{ borderBottom: '1px solid rgba(0,48,73,0.08)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/admin" style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(180,87,65,0.75)', textDecoration: 'none' }}>
          ← Admin
        </a>
        <span style={{ fontSize: '0.7rem', fontWeight: 300, color: 'rgba(0,48,73,0.35)' }}>Internal use only</span>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 32px' }}>

        {/* ── Heading ── */}
        <div style={{ marginBottom: 56 }}>
          <h1 className="font-cormorant" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 600, lineHeight: 1, color: '#003049', letterSpacing: '-0.01em' }}>
            Applications
          </h1>
          <p style={{ fontSize: '0.85rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 10 }}>
            Fall 2026 · Leadership Interest Submissions
          </p>
        </div>

        {/* ── Call Requests ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <h2 className="font-cormorant" style={{ fontSize: '1.8rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>
              Call Requests
            </h2>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,48,73,0.1)' }} />
            {callRequests && (
              <span style={{ fontSize: '0.72rem', fontWeight: 300, color: 'rgba(0,48,73,0.4)' }}>
                {callRequests.length} total
              </span>
            )}
          </div>

          {callRequests === undefined ? (
            <p className="font-cormorant" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.3)', padding: '32px 0' }}>Loading…</p>
          ) : callRequests.length === 0 ? (
            <p className="font-cormorant" style={{ fontSize: '1.1rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.2)', padding: '32px 0' }}>No call requests yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {callRequests.map((r) => {
                const dateStr = new Date(r.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const isEmail = r.contact.includes('@');
                return (
                  <div key={r._id} style={{
                    borderRadius: 16,
                    border: '1px solid rgba(180,87,65,0.18)',
                    background: 'rgba(180,87,65,0.03)',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                        <span className="font-cormorant" style={{ fontSize: '1.3rem', fontWeight: 600, color: '#003049', lineHeight: 1.2 }}>{r.name}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 300, color: 'rgba(0,48,73,0.5)' }}>{r.contact}</span>
                      </div>
                      {r.roles.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {r.roles.map((role) => (
                            <span key={role} style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: 'rgba(0,48,73,0.07)', color: '#003049' }}>{role}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 300, color: 'rgba(0,48,73,0.35)' }}>{dateStr}</span>
                      <a
                        href={isEmail ? `mailto:${r.contact}` : `tel:${r.contact}`}
                        style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', padding: '6px 14px', borderRadius: 999, background: '#b45741', color: '#fff7eb', textDecoration: 'none' }}
                      >
                        {isEmail ? 'Email' : 'Call'} {r.name.split(' ')[0]}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Full Applications ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <h2 className="font-cormorant" style={{ fontSize: '1.8rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>
              Full Applications
            </h2>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,48,73,0.1)' }} />
            {submissions && (
              <span style={{ fontSize: '0.72rem', fontWeight: 300, color: 'rgba(0,48,73,0.4)' }}>
                {submissions.length} total
              </span>
            )}
          </div>

          {submissions === undefined ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <p className="font-cormorant" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.3)' }}>Loading…</p>
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center' }}>
              <p className="font-cormorant" style={{ fontSize: '1.4rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.25)' }}>No submissions yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {submissions.map((s) => {
                const isOpen = expanded === s._id;
                const dateStr = new Date(s.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={s._id} style={{
                    borderRadius: 16,
                    border: `1px solid ${isOpen ? 'rgba(0,48,73,0.18)' : 'rgba(0,48,73,0.08)'}`,
                    background: isOpen ? 'rgba(0,48,73,0.03)' : 'transparent',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : s._id)}
                      style={{ width: '100%', textAlign: 'left', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                          <span className="font-cormorant" style={{ fontSize: '1.3rem', fontWeight: 600, color: '#003049', lineHeight: 1.2 }}>{s.name}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)' }}>{s.email}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {s.roles.map((r) => (
                            <span key={r} style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: 'rgba(0,48,73,0.07)', color: '#003049' }}>{r}</span>
                          ))}
                          {s.worshipTeam && (
                            <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: 'rgba(180,87,65,0.1)', color: '#b45741' }}>Worship Team</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 300, color: 'rgba(0,48,73,0.35)' }}>{dateStr}</span>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'rgba(0,48,73,0.3)', marginTop: 2 }}>
                          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(0,48,73,0.07)', paddingTop: 20 }}>
                        <div style={{ display: 'flex', gap: 32, marginBottom: 20, flexWrap: 'wrap' }}>
                          <Stat label="Grad Year" value={String(s.gradYear)} />
                          <Stat label="Hrs / Week" value={String(s.weeklyHours)} />
                        </div>
                        {s.worshipTeam && s.instruments && (
                          <div style={{ marginBottom: 20 }}>
                            <Label>Instruments</Label>
                            <p style={{ fontSize: '0.85rem', fontWeight: 300, color: '#003049', marginTop: 4 }}>{s.instruments}</p>
                          </div>
                        )}
                        {s.videoUrl && (
                          <div style={{ marginBottom: 20 }}>
                            <Label>Video</Label>
                            <video src={s.videoUrl} controls style={{ marginTop: 10, width: '100%', borderRadius: 12, maxHeight: 300, background: 'rgba(0,48,73,0.04)' }} />
                          </div>
                        )}
                        <a href={`mailto:${s.email}`} style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', padding: '9px 20px', borderRadius: 999, background: '#003049', color: '#fff7eb', textDecoration: 'none' }}>
                          Email {s.name.split(' ')[0]}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,48,73,0.35)', marginBottom: 3 }}>{label}</p>
      <p className="font-cormorant" style={{ fontSize: '1.6rem', fontWeight: 600, color: '#003049' }}>{value}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,48,73,0.35)' }}>{children}</p>;
}
