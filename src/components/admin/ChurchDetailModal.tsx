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
  const setType = useMutation(api.churchOutreach.setType);
  const remove = useMutation(api.churchOutreach.remove);
  const [followUpNotes, setFollowUpNotes] = useState(church.followUpNotes ?? '');
  const [contactDate, setContactDate] = useState(church.contactDate ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  async function handleDelete() {
    await remove({ id: church._id });
    onClose();
  }

  async function handleSetType(type: 'church' | 'campus_ministry') {
    await setType({ id: church._id, type });
  }

  const isCampusMinistry = church.type === 'campus_ministry';

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

        {/* Type toggle */}
        <div style={{ marginBottom: 20 }}>
          <Label>Type</Label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <TypeButton active={!isCampusMinistry} onClick={() => handleSetType('church')}>Church</TypeButton>
            <TypeButton active={isCampusMinistry} onClick={() => handleSetType('campus_ministry')}>Campus Ministry</TypeButton>
          </div>
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', padding: '9px 20px', borderRadius: 999, background: '#003049', color: '#fff7eb', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#b45741' }}>Remove this entry?</span>
              <button
                onClick={handleDelete}
                style={{ fontSize: '0.72rem', fontWeight: 600, padding: '6px 14px', borderRadius: 999, background: '#b45741', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Yes, remove
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ fontSize: '0.72rem', padding: '6px 14px', borderRadius: 999, background: 'none', color: 'rgba(0,48,73,0.5)', border: '1px solid rgba(0,48,73,0.15)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ fontSize: '0.72rem', fontWeight: 400, color: 'rgba(180,87,65,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
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
