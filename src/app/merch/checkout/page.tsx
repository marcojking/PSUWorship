"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/merch/cart";
import StickyNote from "@/components/merch/StickyNote";
import Link from "next/link";

import { Suspense } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

import { ConvexClientProvider } from "@/components/ConvexClientProvider";

export default function CheckoutPage() {
  return (
    <ConvexClientProvider>
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted">Loading checkout...</div>}>
        <CheckoutContent />
      </Suspense>
    </ConvexClientProvider>
  );
}

function CheckoutContent() {
  const { items, total, removeItem, updateQuantity, clearCart } = useCart();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"shipping" | "local_pickup">("shipping");
  const [address, setAddress] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [shippingRates, setShippingRates] = useState<
    { id: string; carrier: string; service: string; amount: number; days: string }[]
  >([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingCost =
    deliveryType === "local_pickup"
      ? 0
      : shippingRates.find((r) => r.id === selectedRate)?.amount ?? 0;

  const grandTotal = total + shippingCost;

  // --- Detect Stripe cancel redirect and clean up the pending order ---
  const searchParams = useSearchParams();
  useEffect(() => {
    const cancelled = searchParams.get("cancelled");
    const sessionId = searchParams.get("session_id");
    if (cancelled === "1" && sessionId) {
      fetch("/api/merch/abandon-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fetch rates when address changes meaningfully
  useEffect(() => {
    if (deliveryType !== "shipping") return;
    if (!address.postalCode || address.postalCode.length < 5) return;
    if (!address.city || !address.state) return;

    const timer = setTimeout(() => {
      fetchShippingRates();
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.postalCode, address.city, address.state, deliveryType]);

  const fetchShippingRates = async () => {
    setLoadingRates(true);
    try {
      const res = await fetch("/api/merch/shipping-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, items }),
      });
      if (res.ok) {
        const data = await res.json();
        setShippingRates(data.rates ?? []);
        if (data.rates?.length > 0) {
          setSelectedRate(data.rates[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch shipping rates:", err);
    }
    setLoadingRates(false);
  };

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const uploadBase64Image = async (dataUri: string): Promise<string | null> => {
    try {
      // 1. Get a short-lived upload URL from Convex
      const uploadUrl = await generateUploadUrl();
      // 2. Convert base64 data URI to Blob
      const res = await fetch(dataUri);
      const blob = await res.blob();

      // 3. POST the file to the upload URL
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!uploadResult.ok) throw new Error("Upload failed");
      const { storageId } = await uploadResult.json();
      return storageId;
    } catch (err) {
      console.error("Failed to upload image:", err);
      return null;
    }
  };

  const handleCheckout = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // 1. Upload any base64/data URI mockups to Convex Storage, or use pre-uploaded IDs
      const processedItems = await Promise.all(
        items.map(async (item) => {
          // Try uploading base64 if available, otherwise use pre-uploaded storage IDs
          let frontMockupId = item.frontMockupId;
          let backMockupId = item.backMockupId;
          let frontPreviewId, backPreviewId;

          if (item.frontMockupBase64) frontMockupId = (await uploadBase64Image(item.frontMockupBase64)) || frontMockupId;
          if (item.backMockupBase64) backMockupId = (await uploadBase64Image(item.backMockupBase64)) || backMockupId;
          if (item.frontPreviewUrl?.startsWith('data:')) frontPreviewId = await uploadBase64Image(item.frontPreviewUrl);
          if (item.backPreviewUrl?.startsWith('data:')) backPreviewId = await uploadBase64Image(item.backPreviewUrl);

          // Return the clean item without huge base64 strings to send to our API
          const { frontMockupBase64, backMockupBase64, frontPreviewUrl, backPreviewUrl, frontMockupId: _fid, backMockupId: _bid, ...cleanItem } = item;
          return {
            ...cleanItem,
            frontMockupId,
            backMockupId,
            frontPreviewId,
            backPreviewId,
            customNotes: item.customNotes || undefined,
          };
        })
      );

      // 2. Send the clean payload to the checkout API
      const res = await fetch("/api/merch/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          items: processedItems,
          deliveryType,
          shippingAddress: deliveryType === "shipping" ? address : undefined,
          shippingCost,
          shippingMethod:
            deliveryType === "local_pickup"
              ? "Local Pickup"
              : shippingRates.find((r) => r.id === selectedRate)?.service ?? "Standard",
        }),
      });
      if (res.ok) {
        const { url } = await res.json();
        clearCart();
        window.location.href = url;
      } else {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      setError("Network error — please try again");
    }
    setSubmitting(false);
  };

  const canSubmit =
    email &&
    items.length > 0 &&
    (deliveryType === "local_pickup" ||
      (address.name && address.line1 && address.city && address.state && address.postalCode && selectedRate));

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors";

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-muted">Your cart is empty</p>
        <Link href="/merch" className="text-sm text-secondary hover:underline">
          ← Back to Merch
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/merch"
        className="mb-6 inline-block text-sm text-muted hover:text-foreground transition-colors"
      >
        ← Back to Merch
      </Link>

      <h1 className="mb-8 text-2xl font-bold">Checkout</h1>

      {/* ── Order Summary ──────────────────────────────────────────────── */}
      <section className="mb-6 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold text-muted uppercase tracking-wider">
          Order Summary
        </h2>
        {items.map((item) => (
          <div key={item.id} className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate">
              {item.name}
              {item.size && <span className="text-muted"> ({item.size})</span>}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="flex h-6 w-6 items-center justify-center rounded border border-border text-xs text-muted hover:text-foreground"
              >
                −
              </button>
              <span className="w-5 text-center text-xs">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="flex h-6 w-6 items-center justify-center rounded border border-border text-xs text-muted hover:text-foreground"
              >
                +
              </button>
              <span className="w-16 text-right font-medium">
                ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-400/60 hover:text-red-400 text-xs ml-1"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <div className="mt-3 border-t border-border pt-3 flex items-center justify-between font-medium">
          <span>Subtotal</span>
          <span>${(total / 100).toFixed(2)}</span>
        </div>
      </section>

      {/* ── Contact Info ────────────────────────────────────────────────── */}
      <section className="mb-6 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold text-muted uppercase tracking-wider">
          Contact
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ── Delivery ───────────────────────────────────────────────────── */}
      <section className="mb-6 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold text-muted uppercase tracking-wider">
          Delivery
        </h2>
        <div className="flex gap-2 mb-4">
          {(["shipping", "local_pickup"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setDeliveryType(type)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${deliveryType === type
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-border text-muted hover:border-secondary/30"
                }`}
            >
              {type === "shipping" ? "📦 Ship to Me" : "🤝 Local Pickup (Free)"}
            </button>
          ))}
        </div>

        {deliveryType === "local_pickup" && (
          <StickyNote rotation={0.8}>
            <p className="text-xs">
              We&apos;ll reach out to coordinate a pickup time in State College!
            </p>
          </StickyNote>
        )}

        {deliveryType === "shipping" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Full Name</label>
              <input
                type="text"
                value={address.name}
                onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))}
                placeholder="John Doe"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Address Line 1</label>
              <input
                type="text"
                value={address.line1}
                onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                placeholder="123 Main St"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Address Line 2 (optional)</label>
              <input
                type="text"
                value={address.line2}
                onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                placeholder="Apt 4B"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">City</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  placeholder="State College"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">State</label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                  placeholder="PA"
                  maxLength={2}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Zip</label>
                <input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
                  placeholder="16801"
                  maxLength={10}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Shipping rate selection */}
            {loadingRates && (
              <div className="flex items-center gap-2 text-xs text-muted py-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                Fetching shipping rates...
              </div>
            )}

            {!loadingRates && shippingRates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted">Select shipping method</p>
                {shippingRates.map((rate) => (
                  <button
                    key={rate.id}
                    onClick={() => setSelectedRate(rate.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${selectedRate === rate.id
                      ? "border-secondary bg-secondary/10"
                      : "border-border hover:border-secondary/30"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {rate.carrier} — {rate.service}
                        </p>
                        <p className="text-[10px] text-muted">{rate.days}</p>
                      </div>
                      <p className="text-sm font-semibold">${(rate.amount / 100).toFixed(2)}</p>
                    </div>
                  </button>
                ))}

                <div className="pt-2">
                  <StickyNote rotation={-1.5}>
                    <p className="text-xs leading-relaxed font-medium text-black/80">
                      * Shipping time estimates apply <strong>after</strong> we finish processing your order. Custom pieces may take longer to ship!
                    </p>
                  </StickyNote>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Total & Pay ─────────────────────────────────────────────────── */}
      <section className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span>${(total / 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Shipping</span>
            <span>{deliveryType === "local_pickup" ? "Free" : `$${(shippingCost / 100).toFixed(2)}`}</span>
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-secondary">${(grandTotal / 100).toFixed(2)}</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={!canSubmit || submitting}
        className="w-full rounded-lg bg-secondary px-6 py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Processing...
          </span>
        ) : (
          `Pay $${(grandTotal / 100).toFixed(2)}`
        )}
      </button>

      <p className="mt-3 text-center text-[10px] text-muted">
        You&apos;ll be redirected to Stripe for secure payment.
        <br />
        Custom orders are reviewed before production begins.
      </p>
    </div>
  );
}
