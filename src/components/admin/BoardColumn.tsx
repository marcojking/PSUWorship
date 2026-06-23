'use client';
import { useDroppable } from '@dnd-kit/core';
import { ApplicantCard, type Submission } from './ApplicantCard';
import { Id } from '../../../convex/_generated/dataModel';

interface BoardColumnProps {
  id: string;
  title: string;
  submissions: Submission[];
  onOpenDetail: (id: Id<'leadershipInterest'>) => void;
}

export function BoardColumn({ id, title, submissions, onOpenDetail }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <h3 className="font-cormorant" style={{ fontSize: '1.1rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>{title}</h3>
        <span style={{ fontSize: '0.68rem', fontWeight: 300, color: 'rgba(0,48,73,0.4)' }}>{submissions.length}</span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 120,
          padding: 8,
          borderRadius: 14,
          background: isOver ? 'rgba(180,87,65,0.06)' : 'rgba(0,48,73,0.02)',
          border: `1px dashed ${isOver ? 'rgba(180,87,65,0.3)' : 'rgba(0,48,73,0.08)'}`,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {submissions.length === 0 ? (
          <p style={{ fontSize: '0.75rem', fontWeight: 300, color: 'rgba(0,48,73,0.25)', textAlign: 'center', padding: '20px 0' }}>No applicants</p>
        ) : (
          submissions.map((s) => (
            <ApplicantCard key={s._id} submission={s} onOpenDetail={onOpenDetail} />
          ))
        )}
      </div>
    </div>
  );
}
