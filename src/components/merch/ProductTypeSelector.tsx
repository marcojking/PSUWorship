"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export type ProductType = "sticker" | "patch" | "embroidery";

interface TypeEntry {
  key: ProductType;
  label: string;
  description: string;
}

const TYPE_INFO: TypeEntry[] = [
  {
    key: "sticker",
    label: "Sticker",
    description: "Die-cut vinyl sticker with white outline border.",
  },
  {
    key: "patch",
    label: "Patch",
    description: "Iron-on embroidered patch with background fill and satin stitch border.",
  },
  {
    key: "embroidery",
    label: "Embroidery",
    description: "Design stitched directly onto your clothing — no backing, just thread on fabric.",
  },
];

interface ProductTypeSelectorProps {
  designId: string;
  availableTypes: {
    sticker?: { price: number; imageUrl?: string };
    patch?: { price: number; imageUrl?: string };
    embroidery?: {
      priceLarge: number;
      priceSmall: number;
      fixedSizeOnly: boolean;
      imageUrl?: string;
    };
  };
  defaultImageUrl: string;
  onAddToCart: (type: ProductType, price: number, size?: "large" | "small") => void;
  onActiveChange?: (type: ProductType) => void;
}

export default function ProductTypeSelector({
  designId,
  availableTypes,
  defaultImageUrl,
  onAddToCart,
  onActiveChange,
}: ProductTypeSelectorProps) {
  const enabledTabs = TYPE_INFO.filter((t) => availableTypes[t.key] !== undefined);
  const [active, setActive] = useState<ProductType>(enabledTabs[0]?.key ?? "sticker");
  const [embroiderySize, setEmbroiderySize] = useState<"large" | "small">("large");

  const switchTab = (type: ProductType) => {
    setActive(type);
    onActiveChange?.(type);
  };

  // Notify parent of the initial active tab once mounted
  useEffect(() => {
    onActiveChange?.(enabledTabs[0]?.key ?? "sticker");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (enabledTabs.length === 0) {
    return <p className="text-sm text-muted">No product types configured for this design.</p>;
  }

  const activeInfo = TYPE_INFO.find((t) => t.key === active)!;

  return (
    <div>
      {/* Tab pills */}
      <div className="mb-4 flex gap-1 rounded-lg bg-card p-1">
        {enabledTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active === tab.key
                ? "bg-secondary/20 text-secondary"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-4 text-sm text-muted">{activeInfo.description}</p>

        {/* Sticker */}
        {active === "sticker" && availableTypes.sticker && (
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              ${(availableTypes.sticker.price / 100).toFixed(2)}
            </span>
            <button
              onClick={() => onAddToCart("sticker", availableTypes.sticker!.price)}
              className="rounded-lg bg-secondary px-6 py-2.5 font-medium text-background transition-opacity hover:opacity-90"
            >
              Add to Cart
            </button>
          </div>
        )}

        {/* Patch */}
        {active === "patch" && availableTypes.patch && (
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              ${(availableTypes.patch.price / 100).toFixed(2)}
            </span>
            <button
              onClick={() => onAddToCart("patch", availableTypes.patch!.price)}
              className="rounded-lg bg-secondary px-6 py-2.5 font-medium text-background transition-opacity hover:opacity-90"
            >
              Add to Cart
            </button>
          </div>
        )}

        {/* Embroidery — links to custom flow */}
        {active === "embroidery" && availableTypes.embroidery && (
          <div>
            {!availableTypes.embroidery.fixedSizeOnly && (
              <div className="mb-4 flex gap-2">
                {(["large", "small"] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setEmbroiderySize(sz)}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors capitalize ${
                      embroiderySize === sz
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {sz} · $
                    {(
                      (sz === "large"
                        ? availableTypes.embroidery!.priceLarge
                        : availableTypes.embroidery!.priceSmall) / 100
                    ).toFixed(2)}
                  </button>
                ))}
              </div>
            )}
            {availableTypes.embroidery.fixedSizeOnly && (
              <p className="mb-4 text-2xl font-bold">
                ${(availableTypes.embroidery.priceLarge / 100).toFixed(2)}
              </p>
            )}
            <Link
              href={`/merch/custom?design=${designId}&size=${embroiderySize}`}
              className="block w-full rounded-lg bg-secondary py-2.5 text-center font-medium text-background transition-opacity hover:opacity-90"
            >
              Customize on Clothing →
            </Link>
            <p className="mt-2 text-center text-xs text-muted">
              Added to your clothing order in the customizer
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
