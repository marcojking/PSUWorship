'use client';
import { useDroppable } from '@dnd-kit/core';
import { ChurchCard, type ChurchOutreach } from './ChurchCard';
import { Id } from '../../../convex/_generated/dataModel';

interface ChurchColumnProps {
  id: string;
  title: string;
  churches: ChurchOutreach[];
  onOpenDetail: (id: Id<'churchOutreach'>) => void;
}

export function ChurchColumn({ id, title, churches, onOpenDetail }: ChurchColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div style={{ flex: '0 0 220px', minWidth: 220 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <h3 className="font-cormorant" style={{ fontSize: '1rem', fontWeight: 600, fontStyle: 'italic', color: '#003049' }}>{title}</h3>
        <span style={{ fontSize: '0.68rem', fontWeight: 300, color: 'rgba(0,48,73,0.4)' }}>{churches.length}</span>
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
        {churches.length === 0 ? (
          <p style={{ fontSize: '0.75rem', fontWeight: 300, color: 'rgba(0,48,73,0.25)', textAlign: 'center', padding: '20px 0' }}>No churches</p>
        ) : (
          churches.map((c) => (
            <ChurchCard key={c._id} church={c} onOpenDetail={onOpenDetail} />
          ))
        )}
      </div>
    </div>
  );
}
