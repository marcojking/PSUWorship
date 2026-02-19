"use client";

import Link from "next/link";
import TiltCard from "./TiltCard";

interface StandaloneCardProps {
  id: string;
  name: string;
  imageUrl: string;
  price: number; // cents
  type: "premade" | "bundle" | "limited" | string;
  quantity?: number;
  imageCount?: number; // for bundle stacked preview
}

const TYPE_LABELS: Record<string, { text: string; color: string }> = {
  premade: { text: "Ready to Ship", color: "text-green-400" },
  bundle: { text: "Bundle", color: "text-blue-400" },
  limited: { text: "1 of 1", color: "text-secondary" },
};

export default function StandaloneCard({
  id,
  name,
  imageUrl,
  price,
  type,
  quantity,
  imageCount,
}: StandaloneCardProps) {
  const label = TYPE_LABELS[type] ?? { text: type, color: "text-muted" };
  const isBundle = type === "bundle" && (imageCount ?? 0) > 1;

  return (
    <Link href={`/merch/product/${id}`} className="group block">
      <TiltCard className="mb-3">
        <div className="relative">
          {/* Stacked effect for bundles */}
          {isBundle && (
            <>
              <div className="absolute -right-1 -top-1 h-full w-full rounded-2xl border border-border bg-card/60 rotate-2" />
              <div className="absolute -right-0.5 -top-0.5 h-full w-full rounded-2xl border border-border bg-card/80 rotate-1" />
            </>
          )}

          {/* Polaroid-style card */}
          <div
            className="relative overflow-hidden rounded-2xl border border-border bg-card"
            style={{
              // Slight random rotation for handmade feel
              transform: `rotate(${(id.charCodeAt(0) % 5) - 2}deg)`,
            }}
          >
            {/* Torn edge top — CSS texture */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-card via-border/50 to-card" />

            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-background/50">
              <img
                src={imageUrl}
                alt={name}
                className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
              />

              {/* Paper texture overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                  backgroundSize: "200px",
                }}
              />

              {/* Hand-stamped tag */}
              <div className="absolute right-2 top-2 z-10">
                <span
                  className={`inline-block rounded-sm border border-current/30 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${label.color}`}
                  style={{
                    transform: `rotate(${(id.charCodeAt(1) % 7) - 3}deg)`,
                  }}
                >
                  {label.text}
                </span>
              </div>

              {/* Bundle count badge */}
              {isBundle && (
                <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-background">
                  {imageCount}
                </div>
              )}
            </div>

            {/* Bottom label area (polaroid bottom strip) */}
            <div className="border-t border-border/50 px-3 py-2">
              <h3 className="text-sm font-semibold group-hover:text-secondary transition-colors truncate">
                {name}
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">
                  ${(price / 100).toFixed(2)}
                </p>
                {quantity !== undefined && quantity <= 5 && quantity > 0 && (
                  <p className="text-[10px] text-secondary">
                    Only {quantity} left
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}
