"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import TiltCard from "@/components/merch/TiltCard";
import { useCart } from "@/lib/merch/cart";
import Link from "next/link";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ConvexClientProvider>
      <ProductDetail productId={id as Id<"standaloneProducts">} />
    </ConvexClientProvider>
  );
}

function ProductDetail({ productId }: { productId: Id<"standaloneProducts"> }) {
  const product = useQuery(api.products.get, { id: productId });
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { addItem } = useCart();

  // Resolve all image URLs in batch
  const imageUrls =
    useQuery(
      api.storage.getUrls,
      product && product.imageStorageIds.length > 0
        ? { storageIds: product.imageStorageIds }
        : "skip",
    ) ?? [];

  if (product === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        Loading...
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted">Product not found</p>
        <Link href="/merch" className="text-sm text-secondary hover:underline">
          ← Back to Merch
        </Link>
      </div>
    );
  }

  const hasSizes = (product.sizeInventory?.length ?? 0) > 0;
  const selectedSizeItem = hasSizes
    ? product.sizeInventory!.find((s) => s.size === selectedSize)
    : null;

  // Max quantity: size-constrained or overall stock
  const maxQty = hasSizes
    ? (selectedSizeItem?.quantity ?? 0)
    : product.quantity;

  const overallSoldOut = hasSizes
    ? product.sizeInventory!.every((s) => s.quantity <= 0)
    : product.quantity <= 0;

  const heroUrl = imageUrls[selectedImage] ?? imageUrls[0];

  const handleAddToCart = () => {
    addItem({
      type: "standalone",
      standaloneProductId: productId,
      name: product.name,
      size: selectedSize ?? undefined,
      quantity,
      unitPrice: product.price,
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/merch"
        className="mb-6 inline-block text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Back to Merch
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Images */}
        <div>
          <TiltCard maxTilt={12}>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card">
              {heroUrl ? (
                <img
                  src={heroUrl}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  Loading image...
                </div>
              )}
            </div>
          </TiltCard>

          {/* Thumbnails */}
          {imageUrls.length > 1 && (
            <div className="mt-4 flex gap-2">
              {imageUrls.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${selectedImage === i
                      ? "border-secondary"
                      : "border-border hover:border-secondary/40"
                    }`}
                >
                  <img
                    src={url}
                    alt={`${product.name} ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div>
          <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
          <p className="mb-4 text-sm text-muted">{product.description}</p>

          <p className="mb-6 text-2xl font-semibold">
            ${(product.price / 100).toFixed(2)}
          </p>

          {/* Bundle contents */}
          {product.bundleContents && product.bundleContents.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold">Includes:</h3>
              <ul className="space-y-1">
                {product.bundleContents.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-secondary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Size selector */}
          {hasSizes && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold">
                Size
                {selectedSize && (
                  <span className="ml-2 font-normal text-muted">— {selectedSize}</span>
                )}
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizeInventory!.map((s) => {
                  const outOfStock = s.quantity <= 0;
                  const lowStock = s.quantity > 0 && s.quantity <= 3;
                  return (
                    <button
                      key={s.size}
                      onClick={() => {
                        if (!outOfStock) {
                          setSelectedSize(s.size);
                          setQuantity(1);
                        }
                      }}
                      disabled={outOfStock}
                      className={`relative min-w-[2.5rem] rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${selectedSize === s.size
                          ? "border-secondary bg-secondary/10 text-foreground"
                          : outOfStock
                            ? "border-border/30 text-muted/40 line-through"
                            : "border-border hover:border-secondary/50 text-foreground"
                        }`}
                    >
                      {s.size}
                      {lowStock && !outOfStock && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-background">
                          {s.quantity}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedSizeItem && selectedSizeItem.quantity <= 5 && (
                <p className="mt-2 text-xs text-secondary">
                  Only {selectedSizeItem.quantity} left in {selectedSize}
                </p>
              )}
            </div>
          )}

          {/* Non-sized low stock indicator */}
          {!hasSizes && !overallSoldOut && product.quantity <= 5 && (
            <p className="mb-4 text-sm text-secondary">Only {product.quantity} left</p>
          )}

          {/* Quantity + Add to Cart */}
          {overallSoldOut ? (
            <div className="rounded-lg border border-border bg-card px-6 py-3 text-center text-sm text-muted">
              Sold Out
            </div>
          ) : (
            <div className="space-y-3">
              {/* Quantity picker */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">Qty</span>
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={maxQty === 0}
                    className="px-3 py-2 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={hasSizes && !selectedSize}
                className="w-full rounded-lg bg-secondary px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {hasSizes && !selectedSize
                  ? "Select a size"
                  : `Add to Cart — $${((product.price * quantity) / 100).toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
