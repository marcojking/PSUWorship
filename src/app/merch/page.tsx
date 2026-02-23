"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import HeroCollage from "@/components/merch/HeroCollage";
import StandaloneCard from "@/components/merch/StandaloneCard";
import TiltCard from "@/components/merch/TiltCard";
import Link from "next/link";

export default function MerchPage() {
  return (
    <ConvexClientProvider>
      <MerchCatalog />
    </ConvexClientProvider>
  );
}

function MerchCatalog() {
  const products = useQuery(api.products.list, { activeOnly: true });

  return (
    <div>
      {/* Parallax hero */}
      <HeroCollage />

      <div className="relative bg-background" style={{ zIndex: 1 }}>
        <div className="mx-auto max-w-6xl px-4">
          <section className="relative z-10 -mt-12 pb-72 sm:-mt-16 md:-mt-24 lg:-mt-32">
            {!products ? (
              <SkeletonGrid />
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {products.map((product) => (
                  <StandaloneCardWrapper key={product._id} product={product} />
                ))}
                <EmbroideryCard />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/** Custom Embroidery card — polaroid style, settable image, links to /merch/custom */
function EmbroideryCard() {
  const cardImageId = useQuery(api.settings.get, { key: "embroidery_card_image" });
  const imageUrl = useQuery(
    api.storage.getUrl,
    cardImageId ? { storageId: cardImageId as Id<"_storage"> } : "skip",
  );

  return (
    <Link href="/merch/custom" className="group block">
      <TiltCard className="mb-3">
        <div className="relative">
          {/* Polaroid-style card */}
          <div
            className="relative overflow-hidden rounded-2xl border border-border bg-card"
            style={{ transform: "translateZ(0)" }}
          >
            {/* Torn edge top */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-card via-border/50 to-card" />

            {/* "Custom" badge */}
            <div className="absolute right-2 top-2 z-20 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
              Custom
            </div>

            {/* Image or placeholder */}
            <div className="relative aspect-square overflow-hidden bg-background/50">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Custom Embroidery"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted/40">
                  {/* Thread spool icon */}
                  <svg
                    className="h-12 w-12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.2}
                  >
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 3 Q15 7 12 12 Q9 7 12 3" />
                    <path d="M12 21 Q15 17 12 12 Q9 17 12 21" />
                    <path d="M3 12 Q7 9 12 12 Q7 15 3 12" />
                    <path d="M21 12 Q17 9 12 12 Q17 15 21 12" />
                  </svg>
                  <span className="text-[10px] font-medium uppercase tracking-widest">
                    Embroidery
                  </span>
                </div>
              )}

              {/* Paper texture overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                  backgroundSize: "200px",
                }}
              />
            </div>

            {/* Bottom label area - Glassmorphic overlay */}
            <div className="absolute inset-x-0 -bottom-1 z-20 border-t border-border/50 bg-background/70 px-3 pt-2 pb-3 backdrop-blur-md transition-colors group-hover:bg-background/80">
              <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-secondary">
                Custom Embroidery
              </h3>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-secondary">Customize →</p>
              </div>
            </div>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}

/** Wrapper to resolve standalone product image URL from Convex storage */
function StandaloneCardWrapper({
  product,
}: {
  product: {
    _id: string;
    name: string;
    imageStorageIds: Id<"_storage">[];
    price: number;
    type: "premade" | "bundle" | "limited";
    quantity: number;
    sizeInventory?: { size: string; quantity: number }[];
  };
}) {
  const imageUrls = useQuery(
    api.storage.getUrls,
    product.imageStorageIds.length > 0
      ? { storageIds: product.imageStorageIds }
      : "skip",
  );

  if (!imageUrls || imageUrls.length === 0) return <div className="aspect-square animate-pulse rounded-2xl bg-card" />;

  return (
    <StandaloneCard
      id={product._id}
      name={product.name}
      imageUrls={imageUrls}
      price={product.price}
      type={product.type}
      quantity={product.quantity}
      imageCount={product.imageStorageIds.length}
      sizeInventory={product.sizeInventory}
    />
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-2xl bg-card" />
      ))}
    </div>
  );
}
