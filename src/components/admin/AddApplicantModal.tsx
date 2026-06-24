'use client';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ALL_ROLES } from '@/lib/roles';

interface AddApplicantModalProps {
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid rgba(0,48,73,0.15)',
  color: '#003049',
  background: '#fff',
  width: '100%',
};

export function AddApplicantModal({ onClose }: AddApplicantModalProps) {
  const adminCreate = useMutation(api.leadershipInterest.adminCreate);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [worshipTeam, setWorshipTeam] = useState(false);
  const [instruments, setInstruments] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      await adminCreate({
        name: name.trim(),
        email: email.trim(),
        gradYear: parseInt(gradYear) || new Date().getFullYear() + 2,
        weeklyHours: parseFloat(weeklyHours) || 0,
        roles: selectedRoles,
        worshipTeam,
        instruments: instruments.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch {
      setError("Couldn't add applicant, try again");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,48,73,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{ background: '#fff7eb', borderRadius: 20, maxWidth: 480, width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <p className="font-cormorant" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#003049' }}>Add Applicant</p>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,48,73,0.4)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" required style={inputStyle} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email" required style={inputStyle} />

        <div style={{ display: 'flex', gap: 10 }}>
          <input value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="Grad year" style={{ ...inputStyle, flex: 1 }} />
          <input value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} placeholder="Hrs/week" style={{ ...inputStyle, flex: 1 }} />
        </div>

        <div>
          <p style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,48,73,0.35)', marginBottom: 8 }}>Roles</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: selectedRoles.includes(role) ? 'none' : '1px solid rgba(0,48,73,0.15)',
                  background: selectedRoles.includes(role) ? '#003049' : 'transparent',
                  color: selectedRoles.includes(role) ? '#fff7eb' : 'rgba(0,48,73,0.5)',
                  cursor: 'pointer',
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            id="worshipTeam"
            type="checkbox"
            checked={worshipTeam}
            onChange={(e) => setWorshipTeam(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#003049' }}
          />
          <label htmlFor="worshipTeam" style={{ fontSize: '0.82rem', color: '#003049', cursor: 'pointer' }}>Worship Team interest</label>
        </div>

        {worshipTeam && (
          <input value={instruments} onChange={(e) => setInstruments(e.target.value)} placeholder="Instruments / voice part" style={inputStyle} />
        )}

        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (e.g. video link, how they heard about us, referral)" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />

        {error && <p style={{ fontSize: '0.75rem', color: '#b45741' }}>{error}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim() || !email.trim()}
          style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', padding: '10px 20px', borderRadius: 999, background: '#003049', color: '#fff7eb', border: 'none', cursor: 'pointer', opacity: saving || !name.trim() || !email.trim() ? 0.5 : 1, marginTop: 8 }}
        >
          {saving ? 'Adding…' : 'Add Applicant'}
        </button>
      </form>
    </div>
  );
}
