'use client';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

type Donation = {
  _id: string;
  name: string;
  email: string;
  amountCents: number;
  mode: 'once' | 'monthly';
  stripeSessionId: string;
  createdAt: number;
};

export default function DonationsPage() {
  const donations = useQuery(api.donations.list, {}) as Donation[] | undefined;

  const totalCents = donations?.reduce((sum, d) => sum + d.amountCents, 0) ?? 0;

  return (
    <div className="admin-page min-h-screen" style={{ background: '#fff7eb' }}>

      {/* Top bar */}
      <div style={{ borderBottom: '1px solid rgba(0,48,73,0.08)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/admin" style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(180,87,65,0.75)', textDecoration: 'none' }}>
          ← Admin
        </a>
        <span style={{ fontSize: '0.7rem', fontWeight: 300, color: 'rgba(0,48,73,0.35)' }}>Internal use only</span>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 32px' }}>

        {/* Heading */}
        <div style={{ marginBottom: 48 }}>
          <h1 className="font-cormorant" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 600, lineHeight: 1, color: '#003049', letterSpacing: '-0.01em' }}>
            Donations
          </h1>
          <p style={{ fontSize: '0.85rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 10 }}>
            All gifts submitted through the Give page
          </p>
        </div>

        {/* Summary */}
        {donations && donations.length > 0 && (
          <div style={{ display: 'flex', gap: 32, marginBottom: 48, flexWrap: 'wrap' }}>
            <Stat label="Total Gifts" value={String(donations.length)} />
            <Stat label="Total Initiated" value={`$${(totalCents / 100).toFixed(0)}`} />
            <Stat label="Monthly" value={String(donations.filter(d => d.mode === 'monthly').length)} />
          </div>
        )}

        {/* List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <h2 className="font-cormorant" style={{ fontSize: '1.8rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>
              All Donors
            </h2>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,48,73,0.1)' }} />
            {donations && (
              <span style={{ fontSize: '0.72rem', fontWeight: 300, color: 'rgba(0,48,73,0.4)' }}>
                {donations.length} total
              </span>
            )}
          </div>

          {donations === undefined ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <p className="font-cormorant" style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.3)' }}>Loading…</p>
            </div>
          ) : donations.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center' }}>
              <p className="font-cormorant" style={{ fontSize: '1.4rem', fontStyle: 'italic', color: 'rgba(0,48,73,0.25)' }}>No donations yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {donations.map((d) => {
                const date = new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div key={d._id} style={{
                    borderRadius: 16,
                    border: '1px solid rgba(0,48,73,0.08)',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                        <span className="font-cormorant" style={{ fontSize: '1.3rem', fontWeight: 600, color: '#003049' }}>{d.name}</span>
                        <a href={`mailto:${d.email}`} style={{ fontSize: '0.75rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', textDecoration: 'none' }}>{d.email}</a>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 300, color: 'rgba(0,48,73,0.35)' }}>{date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span className="font-cormorant" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#003049' }}>
                        ${(d.amountCents / 100).toFixed(0)}
                      </span>
                      <span style={{
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: d.mode === 'monthly' ? 'rgba(180,87,65,0.1)' : 'rgba(0,48,73,0.07)',
                        color: d.mode === 'monthly' ? '#b45741' : '#003049',
                      }}>
                        {d.mode === 'monthly' ? 'Monthly' : 'One-time'}
                      </span>
                    </div>
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
      <p className="font-cormorant" style={{ fontSize: '2rem', fontWeight: 600, color: '#003049' }}>{value}</p>
    </div>
  );
}
