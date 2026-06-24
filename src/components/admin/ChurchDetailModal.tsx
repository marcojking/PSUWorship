'use client';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { ChurchOutreach } from './ChurchCard';

interface ChurchDetailModalProps {
  church: ChurchOutreach;
  onClose: () => void;
}

export function ChurchDetailModal({ church, onClose }: ChurchDetailModalProps) {
  const updateFollowUp = useMutation(api.churchOutreach.updateFollowUp);
  const [followUpNotes, setFollowUpNotes] = useState(church.followUpNotes ?? '');
  const [contactDate, setContactDate] = useState(church.contactDate ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateFollowUp({
        id: church._id,
        followUpNotes: followUpNotes.trim() || undefined,
        contactDate: contactDate.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

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
            <p className="font-cormorant" style={{ fontSize: '1.6rem', fontWeight: 600, color: '#003049' }}>{church.name}</p>
            {church.denomination && (
              <p style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(0,48,73,0.5)' }}>{church.denomination}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,48,73,0.4)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
        </div>

        {church.address && <Field label="Address" value={church.address} />}
        {church.phone && <Field label="Phone" value={church.phone} />}
        {church.email && <Field label="Email" value={church.email} />}
        {church.website && <Field label="Website" value={church.website} />}
        {church.pastorName && <Field label="Pastor / Leader" value={church.pastorName} />}
        {church.notes && <Field label="Notes / Why Good Fit" value={church.notes} />}

        <div style={{ marginBottom: 20 }}>
          <Label>Contact Date</Label>
          <input
            value={contactDate}
            onChange={(e) => setContactDate(e.target.value)}
            placeholder="e.g. June 12"
            style={{ marginTop: 6, width: '100%', fontSize: '0.85rem', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,48,73,0.15)', color: '#003049', background: '#fff' }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <Label>Follow-up Notes</Label>
          <textarea
            value={followUpNotes}
            onChange={(e) => setFollowUpNotes(e.target.value)}
            rows={4}
            style={{ marginTop: 6, width: '100%', fontSize: '0.85rem', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,48,73,0.15)', color: '#003049', background: '#fff', resize: 'vertical' }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', padding: '9px 20px', borderRadius: 999, background: '#003049', color: '#fff7eb', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      <p style={{ fontSize: '0.85rem', fontWeight: 300, color: '#003049', marginTop: 4 }}>{value}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,48,73,0.35)' }}>{children}</p>;
}
