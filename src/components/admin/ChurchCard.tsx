'use client';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Id } from '../../../convex/_generated/dataModel';

export type ChurchStage =
  | 'unprocessed'
  | 'approved'
  | 'reached_out'
  | 'supporting_involved'
  | 'involved_not_supporting'
  | 'non_involved';

export type ChurchOutreach = {
  _id: Id<'churchOutreach'>;
  name: string;
  denomination?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  pastorName?: string;
  notes?: string;
  followUpNotes?: string;
  contactDate?: string;
  stage: ChurchStage;
  createdAt: number;
};

interface ChurchCardProps {
  church: ChurchOutreach;
  onOpenDetail: (id: Id<'churchOutreach'>) => void;
}

export function ChurchCard({ church, onOpenDetail }: ChurchCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: church._id,
    data: { stage: church.stage },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 14,
        border: '1px solid rgba(0,48,73,0.1)',
        background: '#fff',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.4 : 1,
        boxShadow: isDragging ? 'none' : '0 1px 2px rgba(0,48,73,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to move"
          style={{ flexShrink: 0, marginTop: 2, cursor: 'grab', background: 'none', border: 'none', padding: 2, color: 'rgba(0,48,73,0.3)', touchAction: 'none' }}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
            <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
            <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
          </svg>
        </button>
        <button
          onClick={() => onOpenDetail(church._id)}
          style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <p className="font-cormorant" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#003049', lineHeight: 1.2 }}>{church.name}</p>
          {church.denomination && (
            <p style={{ fontSize: '0.68rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 2 }}>{church.denomination}</p>
          )}
          {church.pastorName && (
            <p style={{ fontSize: '0.65rem', fontWeight: 300, color: 'rgba(0,48,73,0.3)', marginTop: 2 }}>{church.pastorName}</p>
          )}
        </button>
      </div>
    </div>
  );
}
