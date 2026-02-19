"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export interface DesignConfig {
  designId: Id<"designs">;
  size: "large" | "small";
  position: string;
}

interface DesignConfigCardProps {
  config: DesignConfig;
  onChange: (updated: DesignConfig) => void;
  onRemove: () => void;
}

export default function DesignConfigCard({
  config,
  onChange,
  onRemove,
}: DesignConfigCardProps) {
  const design = useQuery(api.designs.get, { id: config.designId });
  const imageUrl = useQuery(
    api.storage.getUrl,
    design ? { storageId: design.imageStorageId } : "skip",
  );

  if (!design) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-4 h-24" />
    );
  }

  const price =
    config.size === "large"
      ? design.embroideryPriceLarge
      : design.embroideryPriceSmall;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex gap-3">
        {/* Thumbnail */}
        {imageUrl && (
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-background">
            <img src={imageUrl} alt={design.name} className="h-full w-full object-contain p-1" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold truncate">{design.name}</h4>
            <button
              onClick={onRemove}
              className="shrink-0 text-xs text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          </div>

          {/* Size toggle */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-muted">Size:</span>
            {design.fixedSizeOnly ? (
              <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">
                Fixed
              </span>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => onChange({ ...config, size: "large" })}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    config.size === "large"
                      ? "bg-secondary/20 text-secondary"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Large (${(design.embroideryPriceLarge / 100).toFixed(2)})
                </button>
                <button
                  onClick={() => onChange({ ...config, size: "small" })}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    config.size === "small"
                      ? "bg-secondary/20 text-secondary"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Small (${(design.embroideryPriceSmall / 100).toFixed(2)})
                </button>
              </div>
            )}
          </div>

          {/* Position text input */}
          <input
            type="text"
            value={config.position}
            onChange={(e) => onChange({ ...config, position: e.target.value })}
            placeholder="e.g. left chest, right sleeve..."
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors"
          />
        </div>
      </div>

      {/* Price line */}
      <div className="mt-2 text-right text-sm font-medium text-secondary">
        ${(price / 100).toFixed(2)}
      </div>
    </div>
  );
}
