"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  onUpload: (file: File, previewUrl: string) => void;
  label?: string;
}

export default function ImageUpload({
  onUpload,
  label = "Upload your own clothing",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onUpload(file, url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging
          ? "border-secondary bg-secondary/5"
          : "border-border hover:border-secondary/40"
      }`}
    >
      <div className="mb-2 text-2xl text-muted">↑</div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted">Drag & drop or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
    </div>
  );
}
