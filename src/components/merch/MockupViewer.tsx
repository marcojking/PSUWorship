"use client";

import AIDisclaimer from "./AIDisclaimer";

interface MockupViewerProps {
  mainImage: string | null;
  closeupImages?: string[];
  loading?: boolean;
}

export default function MockupViewer({
  mainImage,
  closeupImages = [],
  loading = false,
}: MockupViewerProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
        <p className="text-sm text-muted">Generating preview...</p>
        <p className="mt-1 text-xs text-muted/60">This may take a moment</p>
      </div>
    );
  }

  if (!mainImage) return null;

  return (
    <div className="space-y-4">
      <AIDisclaimer />

      {/* Main mockup */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <img
          src={mainImage}
          alt="AI-generated mockup preview"
          className="w-full object-contain"
        />
      </div>

      {/* Close-up images */}
      {closeupImages.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {closeupImages.map((url, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <img
                src={url}
                alt={`Close-up detail ${i + 1}`}
                className="w-full object-contain"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
