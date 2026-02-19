"use client";

export const dynamic = "force-dynamic";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import TiltCard from "@/components/merch/TiltCard";
import ProductTypeSelector, { type ProductType } from "@/components/merch/ProductTypeSelector";
import { useCart } from "@/lib/merch/cart";
import Link from "next/link";

export default function DesignDetailPage({
  params,
}: {
  params: Promise<{ designId: string }>;
}) {
  const { designId } = use(params);
  return (
    <ConvexClientProvider>
      <DesignDetail designId={designId as Id<"designs">} />
    </ConvexClientProvider>
  );
}

function DesignDetail({ designId }: { designId: Id<"designs"> }) {
  const design = useQuery(api.designs.get, { id: designId });

  const mainImageUrl = useQuery(
    api.storage.getUrl,
    design ? { storageId: design.imageStorageId } : "skip",
  );
  const patchImageUrl = useQuery(
    api.storage.getUrl,
    design?.patchImageStorageId ? { storageId: design.patchImageStorageId } : "skip",
  );
  const embroideryImageUrl = useQuery(
    api.storage.getUrl,
    design?.embroideryImageStorageId ? { storageId: design.embroideryImageStorageId } : "skip",
  );

  // Must be before early returns — hooks can't be conditional
  const [activeType, setActiveType] = useState<ProductType>("sticker");
  const { addItem } = useCart();

  if (!design) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">Loading...</div>
    );
  }

  if (design === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted">Design not found</p>
        <Link href="/merch" className="text-sm text-secondary hover:underline">
          ← Back to Merch
        </Link>
      </div>
    );
  }

  // Build availableTypes — only include types that are enabled for this design.
  // Default: if flags are undefined (legacy doc), treat sticker + patch as enabled.
  const stickerEnabled = design.stickerEnabled ?? true;
  const patchEnabled = design.patchEnabled ?? true;
  const embroideryEnabled = design.embroideryEnabled ?? false;

  const availableTypes: Parameters<typeof ProductTypeSelector>[0]["availableTypes"] = {
    ...(stickerEnabled
      ? { sticker: { price: design.stickerPrice, imageUrl: mainImageUrl ?? undefined } }
      : {}),
    ...(patchEnabled
      ? { patch: { price: design.patchPrice, imageUrl: patchImageUrl ?? undefined } }
      : {}),
    ...(embroideryEnabled
      ? {
          embroidery: {
            priceLarge: design.embroideryPriceLarge,
            priceSmall: design.embroideryPriceSmall,
            fixedSizeOnly: design.fixedSizeOnly,
            imageUrl: embroideryImageUrl ?? undefined,
          },
        }
      : {}),
  };

  // Pick the hero image based on active tab
  const heroImageUrl =
    activeType === "embroidery" && embroideryImageUrl
      ? embroideryImageUrl
      : activeType === "patch" && patchImageUrl
        ? patchImageUrl
        : mainImageUrl;

  const handleAddToCart = (type: ProductType, price: number) => {
    addItem({
      type,
      designId,
      name: `${design.name} — ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      quantity: 1,
      unitPrice: price,
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/merch"
        className="mb-6 inline-block text-sm text-muted hover:text-foreground transition-colors"
      >
        ← Back to Merch
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Hero tilt card — image swaps with selected tab */}
        <div>
          <TiltCard maxTilt={12}>
            <div className="aspect-square overflow-hidden rounded-2xl bg-card">
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt={design.name}
                  className="h-full w-full object-contain p-6 transition-opacity duration-300"
                  style={
                    design.shapePath && activeType !== "embroidery"
                      ? { clipPath: `path("${design.shapePath}")` }
                      : undefined
                  }
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  Loading image...
                </div>
              )}
            </div>
          </TiltCard>
        </div>

        {/* Right: Info + product type selector */}
        <div>
          <h1 className="mb-2 text-3xl font-bold">{design.name}</h1>
          <p className="mb-6 text-sm text-muted">{design.description}</p>

          <ProductTypeSelector
            designId={designId}
            availableTypes={availableTypes}
            defaultImageUrl={mainImageUrl ?? ""}
            onAddToCart={handleAddToCart}
            onActiveChange={setActiveType}
          />
        </div>
      </div>
    </div>
  );
}
