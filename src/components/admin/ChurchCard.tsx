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

export type ChurchType = 'church' | 'campus_ministry';

export type ChurchOutreach = {
  _id: Id<'churchOutreach'>;
  name: string;
  type?: ChurchType;
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

  const isCampusMinistry = church.type === 'campus_ministry';

  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 14,
        border: `1px solid ${isCampusMinistry ? 'rgba(180,87,65,0.18)' : 'rgba(0,48,73,0.1)'}`,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <p className="font-cormorant" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#003049', lineHeight: 1.2 }}>{church.name}</p>
            {isCampusMinistry && (
              <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b45741', background: 'rgba(180,87,65,0.1)', borderRadius: 999, padding: '2px 7px', flexShrink: 0 }}>
                Campus Ministry
              </span>
            )}
          </div>
          {church.denomination && (
            <p style={{ fontSize: '0.68rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 2 }}>{church.denomination}</p>
          )}
          {church.pastorName && (
            <p style={{ fontSize: '0.65rem', fontWeight: 300, color: 'rgba(0,48,73,0.3)', marginTop: 2 }}>{church.pastorName}</p>
          )}
        </button>
        {church.website && (
          <a
            href={church.website.startsWith('http') ? church.website : `https://${church.website}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Visit website"
            style={{ flexShrink: 0, marginTop: 2, color: 'rgba(0,48,73,0.25)', display: 'flex', alignItems: 'center' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
