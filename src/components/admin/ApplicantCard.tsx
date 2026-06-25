'use client';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { ALL_ROLES } from '@/lib/roles';

export type Stage = 'reviewing' | 'reached_out' | 'approved';

export type Submission = {
  _id: Id<'leadershipInterest'>;
  name: string;
  email: string;
  gradYear: number;
  weeklyHours: number;
  roles: string[];
  worshipTeam: boolean;
  instruments?: string;
  notes?: string;
  videoDriveUrl?: string;
  videoUrl: string | null;
  submittedAt: number;
  stage?: Stage;
  assignedRole?: string;
};

interface ApplicantCardProps {
  submission: Submission;
  onOpenDetail: (id: Id<'leadershipInterest'>) => void;
}

export function ApplicantCard({ submission, onOpenDetail }: ApplicantCardProps) {
  const setAssignedRole = useMutation(api.leadershipInterest.setAssignedRole);
  const stage = submission.stage ?? 'reviewing';
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: submission._id,
    data: { stage },
  });

  const dateStr = new Date(submission.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
        gap: 10,
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
          onClick={() => onOpenDetail(submission._id)}
          style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <p className="font-cormorant" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#003049', lineHeight: 1.2 }}>{submission.name}</p>
          <p style={{ fontSize: '0.68rem', fontWeight: 300, color: 'rgba(0,48,73,0.45)', marginTop: 2 }}>{submission.email}</p>
          <p style={{ fontSize: '0.65rem', fontWeight: 300, color: 'rgba(0,48,73,0.3)', marginTop: 2 }}>{dateStr} · {submission.weeklyHours} hrs/wk</p>
        </button>
      </div>

      <select
        value={submission.assignedRole ?? ''}
        onChange={(e) => setAssignedRole({ id: submission._id, assignedRole: e.target.value || undefined })}
        style={{ fontSize: '0.72rem', padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(0,48,73,0.15)', color: '#003049', background: '#fff7eb' }}
      >
        <option value="">Assign role…</option>
        {ALL_ROLES.map((role) => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
    </div>
  );
}
