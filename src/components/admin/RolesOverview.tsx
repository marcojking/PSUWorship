'use client';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { LEADERSHIP_ROLES, TEAM_ROLES } from '@/lib/roles';
import type { Submission } from './ApplicantCard';

type RoleStatus = 'open' | 'tentative' | 'filled';

function statusForRole(role: string, submissions: Submission[]): RoleStatus {
  const matches = submissions.filter((s) => s.assignedRole === role);
  if (matches.length === 0) return 'open';
  if (matches.some((s) => s.stage === 'approved')) return 'filled';
  return 'tentative';
}

const STATUS_STYLES: Record<RoleStatus, React.CSSProperties> = {
  open: {
    background: 'rgba(0,48,73,0.04)',
    border: '1px solid rgba(0,48,73,0.12)',
    color: 'rgba(0,48,73,0.45)',
  },
  tentative: {
    background: 'rgba(79,138,100,0.08)',
    border: '1px dashed #4f8a64',
    color: '#3c6b4d',
  },
  filled: {
    background: '#4f8a64',
    border: '1px solid #4f8a64',
    color: '#fff7eb',
  },
};

function RoleChip({ role, status }: { role: string; status: RoleStatus }) {
  return (
    <span
      style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        padding: '6px 12px',
        borderRadius: 999,
        ...STATUS_STYLES[status],
      }}
    >
      {role}
    </span>
  );
}

function RoleGroup({ title, roles, submissions }: { title: string; roles: string[]; submissions: Submission[] }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3
        style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(0,48,73,0.4)',
          marginBottom: 10,
        }}
      >
        {title}
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {roles.map((role) => (
          <RoleChip key={role} role={role} status={statusForRole(role, submissions)} />
        ))}
      </div>
    </div>
  );
}

export function RolesOverview() {
  const submissions = useQuery(api.leadershipInterest.list, {}) as Submission[] | undefined;
  if (submissions === undefined) return null;

  return (
    <div style={{ marginBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
        <h2 className="font-cormorant" style={{ fontSize: '1.8rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>
          Roles Overview
        </h2>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,48,73,0.1)' }} />
      </div>
      <RoleGroup title="Leadership" roles={LEADERSHIP_ROLES} submissions={submissions} />
      <RoleGroup title="Teams" roles={TEAM_ROLES} submissions={submissions} />
    </div>
  );
}
