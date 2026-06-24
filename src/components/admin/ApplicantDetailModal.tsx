'use client';
import type { Submission } from './ApplicantCard';

interface ApplicantDetailModalProps {
  submission: Submission;
  onClose: () => void;
}

export function ApplicantDetailModal({ submission, onClose }: ApplicantDetailModalProps) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,48,73,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff7eb', borderRadius: 20, maxWidth: 520, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div>
            <p className="font-cormorant" style={{ fontSize: '1.6rem', fontWeight: 600, color: '#003049' }}>{submission.name}</p>
            <p style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(0,48,73,0.5)' }}>{submission.email}</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,48,73,0.4)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {submission.roles.map((r) => (
            <span key={r} style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: 'rgba(0,48,73,0.07)', color: '#003049' }}>{r}</span>
          ))}
          {submission.worshipTeam && (
            <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999, background: 'rgba(180,87,65,0.1)', color: '#b45741' }}>Worship Team</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 32, marginBottom: 20, flexWrap: 'wrap' }}>
          <Stat label="Grad Year" value={String(submission.gradYear)} />
          <Stat label="Hrs / Week" value={String(submission.weeklyHours)} />
        </div>

        {submission.worshipTeam && submission.instruments && (
          <div style={{ marginBottom: 20 }}>
            <Label>Instruments</Label>
            <p style={{ fontSize: '0.85rem', fontWeight: 300, color: '#003049', marginTop: 4 }}>{submission.instruments}</p>
          </div>
        )}

        {submission.notes && (
          <div style={{ marginBottom: 20 }}>
            <Label>Notes</Label>
            <p style={{ fontSize: '0.85rem', fontWeight: 300, color: '#003049', marginTop: 4, whiteSpace: 'pre-wrap' }}>{submission.notes}</p>
          </div>
        )}

        {submission.videoUrl && (
          <div style={{ marginBottom: 20 }}>
            <Label>Video</Label>
            <video src={submission.videoUrl} controls style={{ marginTop: 10, width: '100%', borderRadius: 12, maxHeight: 300, background: 'rgba(0,48,73,0.04)' }} />
          </div>
        )}

        <a href={`mailto:${submission.email}`} style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', padding: '9px 20px', borderRadius: 999, background: '#003049', color: '#fff7eb', textDecoration: 'none', display: 'inline-block' }}>
          Email {submission.name.split(' ')[0]}
        </a>
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
