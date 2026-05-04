'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import VisualChordEditor from '@/components/setlist/VisualChordEditor';
import ChordChart from '@/components/setlist/ChordChart';
import { addSong, type Section } from '@/lib/db';
import { ALL_KEYS } from '@/lib/chords/transposition';
import { parseLyricsToSections } from '@/lib/lyrics/parser';

type Step = 'metadata' | 'lyrics' | 'sections' | 'chords' | 'preview';

const SECTION_TYPES: Section['type'][] = [
  'intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'instrumental', 'outro', 'tag'
];

export default function CreateSongPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('metadata');
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [songKey, setSongKey] = useState('G');
  const [rawLyrics, setRawLyrics] = useState('');
  const [sections, setSections] = useState<Section[]>([]);

  // Step validation
  const canProceedFromMetadata = title.trim().length > 0;
  const canProceedFromLyrics = rawLyrics.trim().length > 0;
  const canProceedFromSections = sections.length > 0 && sections.some(s => s.lines.length > 0);

  // Handle lyrics parsing
  const handleParseLyrics = () => {
    const parsed = parseLyricsToSections(rawLyrics);
    setSections(parsed);
    setStep('sections');
  };

  // Handle section updates in review step
  const updateSection = (index: number, updates: Partial<Section>) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], ...updates };
    setSections(newSections);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const addSection = () => {
    const newSection: Section = {
      type: 'verse',
      label: `Verse ${sections.filter(s => s.type === 'verse').length + 1}`,
      lines: [{ lyrics: '', chords: [] }],
    };
    setSections([...sections, newSection]);
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      const id = await addSong({
        title: title.trim(),
        artist: artist.trim(),
        key: songKey,
        sections,
      });
      router.push(`/setlist/songs/${id}`);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save song');
      setSaving(false);
    }
  };

  // Navigation helpers
  const goBack = () => {
    switch (step) {
      case 'lyrics': setStep('metadata'); break;
      case 'sections': setStep('lyrics'); break;
      case 'chords': setStep('sections'); break;
      case 'preview': setStep('chords'); break;
    }
  };

  return (
    <div className="setlist-page min-h-screen p-4 sm:p-6 max-w-4xl mx-auto pb-32">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <Link href="/setlist/songs" className="flex items-center gap-2">
          <span className="text-xl">←</span>
          <span className="font-medium">Cancel</span>
        </Link>
        <Logo />
      </header>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['metadata', 'lyrics', 'sections', 'chords', 'preview'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === s
                  ? 'bg-primary text-secondary'
                  : i < ['metadata', 'lyrics', 'sections', 'chords', 'preview'].indexOf(step)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary/10 text-primary/40'
                }`}
            >
              {i + 1}
            </div>
            {i < 4 && (
              <div className={`w-8 h-0.5 ${
                i < ['metadata', 'lyrics', 'sections', 'chords', 'preview'].indexOf(step)
                  ? 'bg-primary/20'
                  : 'bg-primary/10'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Metadata */}
      {step === 'metadata' && (
        <div>
          <h1 className="text-2xl font-bold mb-2">Create New Song</h1>
          <p className="text-primary/60 mb-6">Start by entering the song details.</p>

          <div className="bg-primary/5 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Song Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Amazing Grace"
                className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Artist / Author</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g., John Newton"
                className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Key</label>
              <select
                value={songKey}
                onChange={(e) => setSongKey(e.target.value)}
                className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
              >
                {ALL_KEYS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary/10 p-4">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setStep('lyrics')}
                disabled={!canProceedFromMetadata}
                className="w-full bg-primary text-secondary py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Continue to Lyrics →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Paste Lyrics */}
      {step === 'lyrics' && (
        <div>
          <h1 className="text-2xl font-bold mb-2">Paste Lyrics</h1>
          <p className="text-primary/60 mb-6">
            Paste your song lyrics below. Include section markers like [Verse 1], [Chorus], etc. for automatic detection.
          </p>

          <div className="bg-primary/5 rounded-lg p-4">
            <textarea
              value={rawLyrics}
              onChange={(e) => setRawLyrics(e.target.value)}
              placeholder={`[Verse 1]
Amazing grace how sweet the sound
That saved a wretch like me
I once was lost but now am found
Was blind but now I see

[Chorus]
My chains are gone I've been set free
My God my Savior has ransomed me`}
              className="w-full h-64 bg-white border border-primary/20 rounded-lg px-3 py-2 font-mono text-sm resize-none"
              autoFocus
            />
            <p className="text-xs text-primary/50 mt-2">
              Tip: Section markers like [Verse], [Chorus], [Bridge] will be auto-detected.
              Blank lines separate sections without markers.
            </p>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary/10 p-4">
            <div className="max-w-4xl mx-auto flex gap-4">
              <button
                onClick={goBack}
                className="flex-1 text-center py-3 border border-primary/20 rounded-lg hover:bg-primary/5"
              >
                ← Back
              </button>
              <button
                onClick={handleParseLyrics}
                disabled={!canProceedFromLyrics}
                className="flex-1 bg-primary text-secondary py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Detect Sections →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review Sections */}
      {step === 'sections' && (
        <div>
          <h1 className="text-2xl font-bold mb-2">Review Sections</h1>
          <p className="text-primary/60 mb-6">
            We detected {sections.length} section{sections.length !== 1 ? 's' : ''}. Adjust labels and types as needed.
          </p>

          <div className="space-y-4 mb-6">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="bg-white border border-primary/10 rounded-lg overflow-hidden">
                <div className="bg-primary/5 p-3 flex items-center gap-3">
                  <select
                    value={section.type}
                    onChange={(e) => updateSection(sIdx, { type: e.target.value as Section['type'] })}
                    className="bg-white border border-primary/20 rounded px-2 py-1 text-sm"
                  >
                    {SECTION_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={section.label}
                    onChange={(e) => updateSection(sIdx, { label: e.target.value })}
                    className="flex-1 bg-white border border-primary/20 rounded px-2 py-1 text-sm font-medium"
                  />
                  <button
                    onClick={() => removeSection(sIdx)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
                <div className="p-3 text-sm text-primary/70 font-mono whitespace-pre-wrap">
                  {section.lines.map(l => l.lyrics).join('\n')}
                </div>
              </div>
            ))}

            <button
              onClick={addSection}
              className="w-full py-3 border-2 border-dashed border-primary/20 rounded-lg text-primary/60 hover:border-primary/40"
            >
              + Add Section
            </button>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary/10 p-4">
            <div className="max-w-4xl mx-auto flex gap-4">
              <button
                onClick={goBack}
                className="flex-1 text-center py-3 border border-primary/20 rounded-lg hover:bg-primary/5"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('chords')}
                disabled={!canProceedFromSections}
                className="flex-1 bg-primary text-secondary py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Add Chords →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Visual Chord Editor */}
      {step === 'chords' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <span className="px-3 py-1 bg-primary/10 rounded-full text-sm font-medium">
              Key: {songKey}
            </span>
          </div>
          <p className="text-primary/60 mb-6">
            Click on any word to place a chord above it.
          </p>

          <VisualChordEditor
            sections={sections}
            songKey={songKey}
            onChange={setSections}
          />

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary/10 p-4">
            <div className="max-w-4xl mx-auto flex gap-4">
              <button
                onClick={goBack}
                className="flex-1 text-center py-3 border border-primary/20 rounded-lg hover:bg-primary/5"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('preview')}
                className="flex-1 bg-primary text-secondary py-3 rounded-lg font-semibold hover:opacity-90"
              >
                Preview →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Preview & Save */}
      {step === 'preview' && (
        <div>
          <h1 className="text-2xl font-bold mb-2">Preview</h1>
          <p className="text-primary/60 mb-6">
            Review your song before saving.
          </p>

          <div className="bg-white border border-primary/10 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-primary/10">
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                {artist && <p className="text-primary/60">{artist}</p>}
              </div>
              <span className="px-3 py-1 bg-primary/10 rounded-full text-sm font-medium">
                {songKey}
              </span>
            </div>

            <ChordChart
              sections={sections}
              songKey={songKey}
              displayKey={songKey}
              displayMode="letters"
            />
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary/10 p-4">
            <div className="max-w-4xl mx-auto flex gap-4">
              <button
                onClick={goBack}
                className="flex-1 text-center py-3 border border-primary/20 rounded-lg hover:bg-primary/5"
              >
                ← Edit Chords
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary text-secondary py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Song'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
