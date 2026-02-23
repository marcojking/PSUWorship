"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TiltCard from "./TiltCard";

interface SizeInventoryItem {
  size: string;
  quantity: number;
}

interface StandaloneCardProps {
  id: string;
  name: string;
  imageUrls: string[];
  price: number; // cents
  type: "premade" | "bundle" | "limited" | string;
  quantity?: number;
  imageCount?: number; // for bundle stacked preview
  sizeInventory?: SizeInventoryItem[];
}

export default function StandaloneCard({
  id,
  name,
  imageUrls,
  price,
  type,
  quantity,
  imageCount,
  sizeInventory,
}: StandaloneCardProps) {
  const isBundle = type === "bundle" && (imageCount ?? 0) > 1;

  // Slideshow state
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasCycled, setHasCycled] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isHovered && imageUrls.length > 1) {
      // First initial transition is very fast (500ms), all subsequent are 1700ms
      const delay = !hasCycled && currentIndex === 0 ? 500 : 1700;
      timeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % imageUrls.length);
        setHasCycled(true);
      }, delay);
    } else if (!isHovered) {
      setCurrentIndex(0); // Reset to first image
      setHasCycled(false); // Reset fast-start flag
    }
    return () => clearTimeout(timeout);
  }, [isHovered, imageUrls.length, currentIndex, hasCycled]);

  // Available sizes (qty > 0)
  const availableSizes = sizeInventory?.filter((s) => s.quantity > 0) ?? [];
  const hasSizes = availableSizes.length > 0;
  const soldOut = hasSizes ? false : (quantity !== undefined && quantity <= 0);

  return (
    <Link
      href={`/merch/product/${id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
            style={{ transform: "translateZ(0)" }}
          >
            {/* Images */}
            <div className="relative aspect-square overflow-hidden bg-background/50">
              {imageUrls.map((url, index) => (
                <img
                  key={url}
                  src={url}
                  alt={`${name} ${index + 1}`}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                />
              ))}

              {/* Paper texture overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                  backgroundSize: "200px",
                }}
              />

              {/* Bundle count badge */}
              {isBundle && (
                <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-background">
                  {imageCount}
                </div>
              )}
            </div>

            {/* Bottom label area - Glassmorphic overlay */}
            <div className="absolute inset-x-0 -bottom-1 z-20 border-t border-border/50 bg-background/70 px-3 pt-2 pb-3 backdrop-blur-md transition-colors group-hover:bg-background/80">
              <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-secondary">
                {name}
              </h3>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground">${(price / 100).toFixed(2)}</p>

                {/* Size chips or low-stock indicator */}
                {hasSizes ? (
                  <div className="flex flex-wrap gap-0.5">
                    {availableSizes.map((s) => (
                      <span
                        key={s.size}
                        className={`rounded px-1 py-0.5 font-mono text-[9px] font-medium ${s.quantity <= 3
                          ? "bg-secondary/40 text-secondary"
                          : "bg-foreground/10 text-muted"
                          }`}
                      >
                        {s.size}
                      </span>
                    ))}
                  </div>
                ) : soldOut ? (
                  <span className="text-[10px] text-muted">Sold Out</span>
                ) : quantity !== undefined && quantity <= 5 && quantity > 0 ? (
                  <p className="text-[10px] text-secondary">Only {quantity} left</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}
