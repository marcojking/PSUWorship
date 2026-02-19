"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import HeroCollage from "@/components/merch/HeroCollage";
import ProductCard from "@/components/merch/ProductCard";
import StandaloneCard from "@/components/merch/StandaloneCard";
import Ring3DCard from "@/components/merch/Ring3DCard";

export default function MerchPage() {
  return (
    <ConvexClientProvider>
      <MerchCatalog />
    </ConvexClientProvider>
  );
}

function MerchCatalog() {
  const designs = useQuery(api.designs.list, { activeOnly: true });
  const products = useQuery(api.products.list, { activeOnly: true });

  return (
    <div>
      {/* Parallax hero */}
      <HeroCollage />

      <div className="mx-auto max-w-6xl px-4">
        {/* Designs section */}
        <section className="py-12">
          <h2 className="mb-8 text-2xl font-semibold">Designs</h2>
          {!designs ? (
            <SkeletonGrid />
          ) : designs.length === 0 ? (
            <EmptyPlaceholder text="Designs coming soon" />
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {designs.map((design) => (
                <DesignCardWrapper key={design._id} design={design} />
              ))}
            </div>
          )}
        </section>

        {/* The Workshop section */}
        <section className="py-12">
          <h2 className="mb-8 text-2xl font-semibold">The Workshop</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {/* Featured one-off: Cross Ring — coming soon */}
            <div className="relative select-none">
              <div className="pointer-events-none">
                <Ring3DCard
                  name="Double Cross Ring"
                  price={1499}
                  href="/merch/product/cross-ring"
                />
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{ transform: "rotate(-8deg)" }}
              >
                <span
                  className="rounded-sm border-2 border-dashed border-secondary px-5 py-2 text-sm font-bold uppercase tracking-widest text-secondary backdrop-blur-sm"
                  style={{
                    textShadow: "0 0 8px rgba(196, 121, 58, 0.3)",
                  }}
                >
                  Coming Soon
                </span>
              </div>
            </div>
            {products?.map((product) => (
              <StandaloneCardWrapper key={product._id} product={product} />
            ))}
          </div>
          {!products && <SkeletonGrid />}
        </section>

        {/* Customize CTA */}
        <section className="py-12 text-center">
          <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8">
            <h3 className="mb-2 text-xl font-semibold">Custom Embroidery</h3>
            <p className="mb-6 text-sm text-muted">
              Pick a clothing item, choose your designs, and we&apos;ll embroider
              them for you.
            </p>
            <a
              href="/merch/custom"
              className="inline-block rounded-lg bg-secondary px-6 py-3 font-medium text-background transition-opacity hover:opacity-90"
            >
              Start Customizing →
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Resolves a single storage ID to a URL — used to build hoverImages array */
function MockupUrlResolver({
  storageId,
  onResolved,
}: {
  storageId: Id<"_storage">;
  onResolved: (url: string) => void;
}) {
  const url = useQuery(api.storage.getUrl, { storageId });
  const cbRef = useRef(onResolved);
  cbRef.current = onResolved;
  useEffect(() => {
    if (url) cbRef.current(url);
  }, [url]);
  return null;
}

/** Wrapper to resolve design image URL from Convex storage */
function DesignCardWrapper({
  design,
}: {
  design: {
    _id: string;
    name: string;
    imageStorageId: Id<"_storage">;
    shapePath?: string;
    mockupStorageIds?: Id<"_storage">[];
    stickerEnabled?: boolean;
    patchEnabled?: boolean;
    embroideryEnabled?: boolean;
    stickerPrice: number;
    patchPrice: number;
    embroideryPriceLarge: number;
  };
}) {
  const imageUrl = useQuery(api.storage.getUrl, {
    storageId: design.imageStorageId,
  });
  const [hoverImages, setHoverImages] = useState<string[]>([]);

  if (!imageUrl) return <div className="aspect-square animate-pulse rounded-2xl bg-card" />;

  const enabledPrices = [
    (design.stickerEnabled ?? true) ? design.stickerPrice : null,
    (design.patchEnabled ?? true) ? design.patchPrice : null,
    (design.embroideryEnabled ?? false) ? design.embroideryPriceLarge : null,
  ].filter((p): p is number => p !== null);
  const startingPrice = enabledPrices.length > 0 ? Math.min(...enabledPrices) : design.stickerPrice;

  return (
    <>
      {/* Resolve each mockup storage ID to a URL in the background */}
      {(design.mockupStorageIds ?? []).map((sid, i) => (
        <MockupUrlResolver
          key={sid}
          storageId={sid}
          onResolved={(url) =>
            setHoverImages((prev) => {
              const next = [...prev];
              next[i] = url;
              return next.filter(Boolean);
            })
          }
        />
      ))}
      <ProductCard
        id={design._id}
        name={design.name}
        imageUrl={imageUrl}
        shapePath={design.shapePath}
        startingPrice={startingPrice}
        hoverImages={hoverImages}
      />
    </>
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
  };
}) {
  const imageUrl = useQuery(
    api.storage.getUrl,
    product.imageStorageIds.length > 0
      ? { storageId: product.imageStorageIds[0] }
      : "skip",
  );

  if (!imageUrl) return <div className="aspect-square animate-pulse rounded-2xl bg-card" />;

  return (
    <StandaloneCard
      id={product._id}
      name={product.name}
      imageUrl={imageUrl}
      price={product.price}
      type={product.type}
      quantity={product.quantity}
      imageCount={product.imageStorageIds.length}
    />
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-2xl bg-card" />
      ))}
    </div>
  );
}

function EmptyPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-border text-sm text-muted">
      {text}
    </div>
  );
}
