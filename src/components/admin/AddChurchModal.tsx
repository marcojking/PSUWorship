'use client';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface AddChurchModalProps {
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

export function AddChurchModal({ onClose }: AddChurchModalProps) {
  const createChurch = useMutation(api.churchOutreach.create);
  const [entryType, setEntryType] = useState<'church' | 'campus_ministry'>('church');
  const [name, setName] = useState('');
  const [denomination, setDenomination] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [pastorName, setPastorName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCampusMinistry = entryType === 'campus_ministry';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createChurch({
        name: name.trim(),
        type: entryType,
        denomination: denomination.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        pastorName: pastorName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch {
      setError("Couldn't add entry, try again");
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
        style={{ background: '#fff7eb', borderRadius: 20, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <p className="font-cormorant" style={{ fontSize: '1.4rem', fontWeight: 600, color: '#003049' }}>
            Add {isCampusMinistry ? 'Campus Ministry' : 'Church'}
          </p>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,48,73,0.4)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <TypeButton active={!isCampusMinistry} onClick={() => setEntryType('church')}>Church</TypeButton>
          <TypeButton active={isCampusMinistry} onClick={() => setEntryType('campus_ministry')}>Campus Ministry</TypeButton>
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={isCampusMinistry ? 'Ministry name *' : 'Church name *'} required style={inputStyle} />
        <input value={denomination} onChange={(e) => setDenomination(e.target.value)} placeholder={isCampusMinistry ? 'Affiliation / tradition' : 'Denomination'} style={inputStyle} />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" style={inputStyle} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" style={inputStyle} />
        <input value={pastorName} onChange={(e) => setPastorName(e.target.value)} placeholder={isCampusMinistry ? 'Staff leader / contact' : 'Pastor / Leader'} style={inputStyle} />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes / Why good fit" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />

        {error && (
          <p style={{ fontSize: '0.75rem', color: '#b45741' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', padding: '10px 20px', borderRadius: 999, background: '#003049', color: '#fff7eb', border: 'none', cursor: 'pointer', opacity: saving || !name.trim() ? 0.5 : 1, marginTop: 8 }}
        >
          {saving ? 'Adding…' : `Add ${isCampusMinistry ? 'Campus Ministry' : 'Church'}`}
        </button>
      </form>
    </div>
  );
}

function TypeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
        padding: '6px 14px',
        borderRadius: 999,
        border: active ? 'none' : '1px solid rgba(0,48,73,0.15)',
        background: active ? '#003049' : 'transparent',
        color: active ? '#fff7eb' : 'rgba(0,48,73,0.45)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
