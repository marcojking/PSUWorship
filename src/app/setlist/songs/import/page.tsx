'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { parsePdf, parsedResultToSong } from '@/lib/pdf/parser';
import { parseUGContent } from '@/lib/ultimateGuitar/parser';
import { addSong, type Song, type Section } from '@/lib/db';
import ChordChart from '@/components/setlist/ChordChart';

type ParsedSong = Omit<Song, 'id' | 'createdAt' | 'updatedAt'>;
type ImportMode = 'url' | 'pdf';

export default function ImportSongPage() {
  const router = useRouter();
  const [importMode, setImportMode] = useState<ImportMode>('url');
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedSong, setParsedSong] = useState<ParsedSong | null>(null);

  // URL input
  const [urlInput, setUrlInput] = useState('');

  // Editable fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [songKey, setSongKey] = useState('C');

  // Handle URL import
  const handleUrlImport = useCallback(async () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL');
      return;
    }

    setParsing(true);
    setError(null);

    try {
      const response = await fetch('/api/fetch-tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch tab');
      }

      const tabData = await response.json();
      console.log('Tab data received:', tabData);

      // Parse the Ultimate Guitar content
      const result = parseUGContent(
        tabData.content,
        tabData.title,
        tabData.artist,
        tabData.key
      );

      console.log('Parsed result:', {
        title: result.title,
        artist: result.artist,
        key: result.key,
        sectionsCount: result.sections.length,
      });

      setParsedSong({
        title: result.title,
        artist: result.artist,
        key: result.key,
        sections: result.sections,
      });
      setTitle(result.title);
      setArtist(result.artist);
      setSongKey(result.key);
    } catch (err) {
      console.error('URL import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import from URL');
    } finally {
      setParsing(false);
    }
  }, [urlInput]);

  // Handle PDF file import
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    setParsing(true);
    setError(null);

    try {
      const result = await parsePdf(file);
      console.log('PDF Parse Result:', {
        title: result.title,
        artist: result.artist,
        key: result.key,
        sectionsCount: result.sections.length,
        sections: result.sections.map(s => ({
          type: s.type,
          label: s.label,
          linesCount: s.lines.length,
          firstLine: s.lines[0] || null,
        })),
      });
      const song = parsedResultToSong(result);
      setParsedSong(song);
      setTitle(song.title);
      setArtist(song.artist);
      setSongKey(song.key);
    } catch (err) {
      console.error('Parse error:', err);
      setError('Failed to parse PDF. Please try a different file.');
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleSave = async () => {
    if (!parsedSong) return;

    const songToSave: ParsedSong = {
      ...parsedSong,
      title,
      artist,
      key: songKey,
    };

    const id = await addSong(songToSave);
    router.push(`/setlist/songs/${id}`);
  };

  return (
    <div className="setlist-page min-h-screen p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <Link href="/setlist" className="flex items-center gap-2">
          <span className="text-xl">←</span>
          <Logo />
        </Link>
      </header>

      <h1 className="text-2xl font-bold mb-6">Import Song</h1>

      {!parsedSong ? (
        <>
          {/* Import Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setImportMode('url'); setError(null); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                importMode === 'url'
                  ? 'bg-primary text-secondary'
                  : 'bg-primary/10 hover:bg-primary/20'
              }`}
            >
              From URL
            </button>
            <button
              onClick={() => { setImportMode('pdf'); setError(null); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                importMode === 'pdf'
                  ? 'bg-primary text-secondary'
                  : 'bg-primary/10 hover:bg-primary/20'
              }`}
            >
              From PDF
            </button>
          </div>

          {importMode === 'url' ? (
            /* URL Import */
            <div className="bg-primary/5 rounded-xl p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Ultimate Guitar URL
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://tabs.ultimate-guitar.com/tab/..."
                  className="w-full bg-white border border-primary/20 rounded-lg px-4 py-3 text-base"
                  disabled={parsing}
                />
              </div>
              <p className="text-sm opacity-60 mb-4">
                Paste a link from Ultimate Guitar to import the chord chart
              </p>
              <button
                onClick={handleUrlImport}
                disabled={parsing || !urlInput.trim()}
                className="w-full bg-primary text-secondary px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {parsing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin w-5 h-5 border-2 border-secondary border-t-transparent rounded-full" />
                    Importing...
                  </span>
                ) : (
                  'Import from URL'
                )}
              </button>
            </div>
          ) : (
            /* PDF Upload Area */
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragging ? 'border-primary bg-primary/5' : 'border-primary/30'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {parsing ? (
                <div className="opacity-60">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  Parsing PDF...
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-4">📄</div>
                  <p className="mb-4 font-medium">Drop PDF here or click to browse</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="pdf-input"
                  />
                  <label
                    htmlFor="pdf-input"
                    className="inline-block bg-primary text-secondary px-6 py-2 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    Choose File
                  </label>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
              {error}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Metadata Editor */}
          <div className="bg-primary/5 rounded-lg p-4 mb-6">
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Artist</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-white border border-primary/20 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Key</label>
                <select
                  value={songKey}
                  onChange={(e) => setSongKey(e.target.value)}
                  className="bg-white border border-primary/20 rounded-lg px-3 py-2"
                >
                  {['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Preview
              <span className="ml-2 text-sm font-normal opacity-60">
                ({parsedSong.sections.length} section{parsedSong.sections.length !== 1 ? 's' : ''})
              </span>
            </h2>
            {parsedSong.sections.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                <p className="font-medium mb-2">No sections were detected in this PDF.</p>
                <p className="text-sm">The PDF parser expects section labels like [Verse 1], [Chorus], etc. Check the browser console (F12) for debug information.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-primary/10 overflow-x-auto">
                <ChordChart sections={parsedSong.sections} songKey={songKey} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setParsedSong(null)}
              className="px-6 py-3 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
            >
              Try Different File
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-primary text-secondary px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Save Song
            </button>
          </div>
        </>
      )}
    </div>
  );
}
