"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import DesignConfigCard, { type DesignConfig } from "@/components/merch/DesignConfigCard";
import PriceSummary from "@/components/merch/PriceSummary";
import ImageUpload from "@/components/merch/ImageUpload";
import MockupViewer from "@/components/merch/MockupViewer";
import StickyNote from "@/components/merch/StickyNote";
import Link from "next/link";
import { useCart } from "@/lib/merch/cart";

export default function CustomizePage() {
  return (
    <ConvexClientProvider>
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted">Loading...</div>}>
        <CustomizeEditor />
      </Suspense>
    </ConvexClientProvider>
  );
}

function CustomizeEditor() {
  const searchParams = useSearchParams();
  const preselectedDesignId = searchParams.get("design") as Id<"designs"> | null;

  const clothingItems = useQuery(api.clothing.list, { activeOnly: true });
  const designs = useQuery(api.designs.list, { activeOnly: true });

  // State
  const [selectedClothingId, setSelectedClothingId] = useState<Id<"clothingItems"> | null>(null);
  const [uploadedClothing, setUploadedClothing] = useState<{ file: File; previewUrl: string } | null>(null);
  const [designConfigs, setDesignConfigs] = useState<DesignConfig[]>(
    preselectedDesignId
      ? [{ designId: preselectedDesignId, size: "large" as const, position: "" }]
      : [],
  );
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [mockupCloseups, setMockupCloseups] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showDesignPicker, setShowDesignPicker] = useState(false);

  const selectedClothing = useQuery(
    api.clothing.get,
    selectedClothingId ? { id: selectedClothingId } : "skip",
  );

  const customBasePrice = useQuery(api.settings.get, { key: "customClothingBasePrice" });
  const defaultBasePrice = customBasePrice ? parseInt(customBasePrice) : 2000; // $20 default

  // Price calculation
  const clothingBasePrice = selectedClothing
    ? selectedClothing.basePrice
    : uploadedClothing
      ? defaultBasePrice
      : 0;

  const designPriceItems = designConfigs.map((config) => {
    const design = designs?.find((d) => d._id === config.designId);
    if (!design) return { label: "Design", amount: 0 };
    const price = config.size === "large" ? design.embroideryPriceLarge : design.embroideryPriceSmall;
    return {
      label: `${design.name} (${config.size})`,
      amount: price,
    };
  });

  const total = clothingBasePrice + designPriceItems.reduce((sum, item) => sum + item.amount, 0);

  const addDesign = useCallback(
    (designId: Id<"designs">) => {
      setDesignConfigs((prev) => [
        ...prev,
        { designId, size: "large" as const, position: "" },
      ]);
      setShowDesignPicker(false);
    },
    [],
  );

  const updateDesign = useCallback((index: number, updated: DesignConfig) => {
    setDesignConfigs((prev) => prev.map((c, i) => (i === index ? updated : c)));
  }, []);

  const removeDesign = useCallback((index: number) => {
    setDesignConfigs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/merch/generate-mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clothingItemId: selectedClothingId,
          designConfigs: designConfigs.map((c) => ({
            designId: c.designId,
            size: c.size,
            position: c.position,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMockupUrl(data.mainImage ?? null);
        setMockupCloseups(data.closeups ?? []);
      }
    } catch (err) {
      console.error("Mockup generation failed:", err);
    }
    setGenerating(false);
  };

  const { addItem } = useCart();

  const hasClothing = selectedClothingId || uploadedClothing;
  const hasDesigns = designConfigs.length > 0;
  const canGenerate = hasClothing && hasDesigns && !generating;

  const handleAddToCart = () => {
    const clothingLabel = selectedClothing?.name ?? "Custom Item";
    addItem({
      type: "embroidery",
      name: `Embroidered ${clothingLabel}`,
      clothingItemId: selectedClothingId ?? undefined,
      placements: designConfigs.map((c) => ({
        designId: c.designId as string,
        size: c.size,
        position: c.position,
      })),
      mockupBlobUrl: mockupUrl ?? undefined,
      quantity: 1,
      unitPrice: total,
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

      <h1 className="mb-2 text-3xl font-bold">Customize</h1>
      <p className="mb-8 text-sm text-muted">
        Choose a clothing item, add designs, and preview your custom embroidered piece.
      </p>

      {/* Step 1: Choose clothing */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">1. Choose Base Clothing</h2>

        {!clothingItems ? (
          <div className="text-muted">Loading...</div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {clothingItems.map((item) => (
                <ClothingOption
                  key={item._id}
                  item={item}
                  selected={selectedClothingId === item._id}
                  onSelect={() => {
                    setSelectedClothingId(item._id);
                    setUploadedClothing(null);
                  }}
                />
              ))}
            </div>

            {/* Upload your own — coming soon */}
            <div className="relative max-w-sm select-none">
              <div className="pointer-events-none opacity-40">
                <ImageUpload
                  label="Upload your own clothing"
                  onUpload={() => {}}
                />
              </div>
              {/* Hand-stamped "Coming Soon" badge */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ transform: "rotate(-6deg)" }}
              >
                <span
                  className="rounded-sm border-2 border-dashed border-secondary px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-secondary"
                  style={{
                    textShadow: "0 0 8px rgba(196, 121, 58, 0.3)",
                  }}
                >
                  Coming Soon
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Step 2: Add designs */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">2. Add Designs</h2>

        {designConfigs.length > 0 && (
          <div className="mb-4 space-y-3">
            {designConfigs.map((config, i) => (
              <DesignConfigCard
                key={`${config.designId}-${i}`}
                config={config}
                onChange={(updated) => updateDesign(i, updated)}
                onRemove={() => removeDesign(i)}
              />
            ))}
          </div>
        )}

        {!showDesignPicker ? (
          <button
            onClick={() => setShowDesignPicker(true)}
            className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted transition-colors hover:border-secondary/40 hover:text-secondary"
          >
            + Add a design
          </button>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Select a design</h3>
              <button
                onClick={() => setShowDesignPicker(false)}
                className="text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            {!designs ? (
              <div className="text-muted">Loading...</div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {designs.map((design) => (
                  <DesignPickerItem
                    key={design._id}
                    design={design}
                    onSelect={() => addDesign(design._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Step 3: Price summary */}
      {hasClothing && hasDesigns && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">3. Review Price</h2>
          <PriceSummary
            clothingBase={
              hasClothing
                ? {
                    label: selectedClothing?.name ?? "Your clothing (embroidery fee)",
                    amount: clothingBasePrice,
                  }
                : null
            }
            designItems={designPriceItems}
            total={total}
          />
        </section>
      )}

      {/* Step 4: Generate preview */}
      {canGenerate && (
        <section className="mb-8">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full rounded-lg bg-secondary px-6 py-3 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {generating ? "Generating Preview..." : "Generate Preview"}
          </button>
        </section>
      )}

      {/* Mockup viewer */}
      {(mockupUrl || generating) && (
        <section className="mb-8">
          <MockupViewer
            mainImage={mockupUrl}
            closeupImages={mockupCloseups}
            loading={generating}
          />
        </section>
      )}

      {/* Actions */}
      {mockupUrl && (
        <section className="mb-8 flex gap-3">
          <button className="flex-1 rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-secondary/40">
            Save to Drafts
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 rounded-lg bg-secondary px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Add to Cart
          </button>
        </section>
      )}

      {/* Sticky note for local pickup */}
      <section className="mx-auto max-w-sm py-8">
        <StickyNote rotation={-1.5}>
          <p className="font-medium">Hey!</p>
          <p className="mt-1">
            Live in State College or going to see Marco around? I can deliver in
            person so we don&apos;t have to pay for shipping!
          </p>
          <p className="mt-2 text-xs text-[#968a78]">
            You can choose local pickup at checkout.
          </p>
        </StickyNote>
      </section>
    </div>
  );
}

function ClothingOption({
  item,
  selected,
  onSelect,
}: {
  item: {
    _id: Id<"clothingItems">;
    name: string;
    basePrice: number;
    imageStorageId: Id<"_storage">;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  const imageUrl = useQuery(api.storage.getUrl, { storageId: item.imageStorageId });

  return (
    <button
      onClick={onSelect}
      className={`rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-secondary bg-secondary/10"
          : "border-border bg-card hover:border-secondary/40"
      }`}
    >
      {imageUrl && (
        <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-background">
          <img src={imageUrl} alt={item.name} className="h-full w-full object-contain p-2" />
        </div>
      )}
      <h4 className="text-sm font-medium truncate">{item.name}</h4>
      <p className="text-xs text-muted">${(item.basePrice / 100).toFixed(2)}</p>
    </button>
  );
}

function DesignPickerItem({
  design,
  onSelect,
}: {
  design: {
    _id: Id<"designs">;
    name: string;
    imageStorageId: Id<"_storage">;
  };
  onSelect: () => void;
}) {
  const imageUrl = useQuery(api.storage.getUrl, { storageId: design.imageStorageId });

  return (
    <button
      onClick={onSelect}
      className="rounded-lg border border-border bg-background p-2 transition-colors hover:border-secondary/40"
    >
      {imageUrl && (
        <div className="mb-1 aspect-square overflow-hidden rounded">
          <img src={imageUrl} alt={design.name} className="h-full w-full object-contain" />
        </div>
      )}
      <p className="truncate text-xs">{design.name}</p>
    </button>
  );
}
