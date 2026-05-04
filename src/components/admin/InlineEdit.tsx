'use client';
import { useState, useRef, useEffect } from 'react';

type Props = {
  value: string;
  onSave: (value: string) => Promise<unknown> | void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  displayClassName?: string;
};

export function InlineEdit({ value, onSave, multiline, className, placeholder, displayClassName }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  async function handleSave() {
    const trimmed = draft.trim();
    if (trimmed === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(trimmed); } finally { setSaving(false); setEditing(false); }
  }

  const sharedInputClass = `bg-transparent border-b border-[#003049]/40 focus:border-[#003049] outline-none w-full resize-none ${className ?? ''}`;

  if (editing) {
    return multiline ? (
      <textarea
        ref={ref}
        value={draft}
        rows={3}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={sharedInputClass}
      />
    ) : (
      <input
        ref={ref}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className={sharedInputClass}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={e => { if (e.key === 'Enter') setEditing(true); }}
      className={`cursor-text ${saving ? 'opacity-40' : 'hover:opacity-70'} ${displayClassName ?? ''}`}
    >
      {value || <span className="opacity-30 italic">{placeholder ?? 'Click to edit'}</span>}
    </span>
  );
}
