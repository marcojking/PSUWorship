'use client';

export default function AdminPage() {
  return (
    <div className="admin-page min-h-screen" style={{ background: '#fff7eb' }}>

      {/* ── Top bar ── */}
      <div style={{ borderBottom: '1px solid rgba(0,48,73,0.08)', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(180,87,65,0.75)' }}>
          WM&A — Admin
        </span>
        <span style={{ fontSize: '0.7rem', fontWeight: 300, color: 'rgba(0,48,73,0.35)' }}>Internal use only</span>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '56px 32px' }}>

        {/* ── Heading ── */}
        <div style={{ marginBottom: 56 }}>
          <h1 className="font-cormorant" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 600, lineHeight: 1, color: '#003049', letterSpacing: '-0.01em' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 10 }}>
            Fall 2026 · Penn State University Park
          </p>
        </div>

        {/* ── Nav cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <NavCard
            href="/admin/applications"
            label="Applications"
            sub="leadership interest submissions"
          />
          <NavCard
            href="/admin/events"
            label="Fall 2026 Events"
            sub="events planned · checklists"
          />
          <NavCard
            href="/admin/donations"
            label="Donations"
            sub="gifts submitted through give page"
          />
          <NavCard
            href="/admin/outreach"
            label="Church Outreach"
            sub="church partnership tracking"
          />
        </div>
      </div>
    </div>
  );
}

function NavCard({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <a href={href} style={{
      display: 'block',
      padding: '28px 28px',
      borderRadius: 20,
      border: '1px solid rgba(0,48,73,0.1)',
      background: 'rgba(0,48,73,0.03)',
      textDecoration: 'none',
      transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,48,73,0.06)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,48,73,0.2)';
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,48,73,0.03)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,48,73,0.1)';
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
      }}
    >
      <p style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,48,73,0.4)', marginBottom: 12 }}>{label}</p>
      <p className="font-cormorant" style={{ fontSize: '2.6rem', fontWeight: 600, lineHeight: 1, color: '#003049' }}>→</p>
      <p style={{ fontSize: '0.72rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 10 }}>{sub}</p>
    </a>
  );
}
