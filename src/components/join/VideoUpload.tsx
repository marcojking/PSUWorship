'use client';
import { useState, useRef } from 'react';

interface VideoUploadProps {
  initialFile?: File | null;
  onNext: (file: File) => void;
  onBack: () => void;
}

export default function VideoUpload({ initialFile = null, onNext, onBack }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(initialFile);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialFile ? URL.createObjectURL(initialFile) : null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-cormorant font-semibold text-3xl text-primary">Tell us about yourself.</h2>
        <p className="text-sm font-light text-primary/60 leading-relaxed">
          Why do you want to be part of WM&A, what does worship mean to you, and why did you choose the role(s) you selected?
        </p>
      </div>

      <div
        className="rounded-xl px-5 py-4 text-sm font-light text-primary/70 leading-relaxed"
        style={{ background: 'rgba(0,48,73,0.05)', borderLeft: '2px solid rgba(0,48,73,0.15)' }}
      >
        This doesn't need to be scripted or formal — we actually prefer your raw, honest thoughts. 1–3 minutes is plenty.
      </div>

      {!previewUrl ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-3 py-16 text-primary/40 hover:border-primary/40 hover:text-primary/60 transition-colors cursor-pointer"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span className="text-sm font-semibold tracking-wide">Tap to record or upload a video</span>
          <span className="text-xs">Opens camera on mobile</span>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <video
            src={previewUrl}
            controls
            className="w-full rounded-2xl bg-primary/5"
            style={{ maxHeight: '320px' }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="text-sm text-primary/50 underline underline-offset-2 hover:text-primary transition-colors text-center"
          >
            Choose a different video
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture="user"
        onChange={handleFile}
        className="hidden"
      />

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="h-14 px-8 rounded-full border border-primary/20 text-primary text-sm font-semibold tracking-widest uppercase transition-all hover:border-primary/50"
        >
          Back
        </button>
        <button
          disabled={!file}
          onClick={() => file && onNext(file)}
          className="flex-1 h-14 rounded-full bg-primary text-background text-sm font-semibold tracking-widest uppercase transition-all hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
