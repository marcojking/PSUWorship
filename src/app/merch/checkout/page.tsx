"use client";

import { useState } from "react";
import { useCart } from "@/lib/merch/cart";
import StickyNote from "@/components/merch/StickyNote";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, total } = useCart();

  const [email, setEmail] = useState("");
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

  const shippingCost =
    deliveryType === "local_pickup"
      ? 0
      : shippingRates.find((r) => r.id === selectedRate)?.amount ?? 0;

  const grandTotal = total + shippingCost;

  const fetchShippingRates = async () => {
    if (!address.line1 || !address.city || !address.state || !address.postalCode) return;
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

  const handleCheckout = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/merch/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items,
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
        window.location.href = url;
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    }
    setSubmitting(false);
  };

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

      {/* Order summary */}
      <section className="mb-8 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wider">
          Order Summary
        </h2>
        {items.map((item) => (
          <div key={item.id} className="mb-2 flex items-center justify-between text-sm">
            <span>
              {item.name}
              {item.quantity > 1 && <span className="text-muted"> ×{item.quantity}</span>}
            </span>
            <span>${((item.unitPrice * item.quantity) / 100).toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-3 border-t border-border pt-3 flex items-center justify-between font-medium">
          <span>Subtotal</span>
          <span>${(total / 100).toFixed(2)}</span>
        </div>
      </section>

      {/* Email */}
      <section className="mb-6">
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className={inputCls}
        />
      </section>

      {/* Delivery type */}
      <section className="mb-6">
        <label className="mb-3 block text-sm font-medium">Delivery</label>
        <div className="flex gap-3">
          <button
            onClick={() => setDeliveryType("shipping")}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
              deliveryType === "shipping"
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-border text-muted hover:border-secondary/40"
            }`}
          >
            Ship to me
          </button>
          <button
            onClick={() => setDeliveryType("local_pickup")}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
              deliveryType === "local_pickup"
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-border text-muted hover:border-secondary/40"
            }`}
          >
            Local Pickup
          </button>
        </div>

        {deliveryType === "local_pickup" && (
          <div className="mt-4 max-w-xs">
            <StickyNote rotation={1}>
              <p className="text-sm">
                Sweet! I&apos;ll reach out to coordinate pickup in State College.
              </p>
            </StickyNote>
          </div>
        )}
      </section>

      {/* Shipping address */}
      {deliveryType === "shipping" && (
        <section className="mb-6">
          <label className="mb-3 block text-sm font-medium">
            Shipping Address
          </label>
          <div className="space-y-3">
            <input value={address.name} onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))} placeholder="Full name" className={inputCls} />
            <input value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} placeholder="Address line 1" className={inputCls} />
            <input value={address.line2} onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))} placeholder="Address line 2 (optional)" className={inputCls} />
            <div className="grid grid-cols-3 gap-3">
              <input value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} placeholder="City" className={inputCls} />
              <input value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} placeholder="State" className={inputCls} />
              <input value={address.postalCode} onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))} placeholder="ZIP" className={inputCls} />
            </div>
            <button
              onClick={fetchShippingRates}
              disabled={loadingRates || !address.line1 || !address.city}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-secondary/40 disabled:opacity-50"
            >
              {loadingRates ? "Calculating..." : "Calculate Shipping"}
            </button>
          </div>

          {/* Shipping rates */}
          {shippingRates.length > 0 && (
            <div className="mt-4 space-y-2">
              {shippingRates.map((rate) => (
                <label
                  key={rate.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                    selectedRate === rate.id
                      ? "border-secondary bg-secondary/10"
                      : "border-border hover:border-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedRate === rate.id}
                      onChange={() => setSelectedRate(rate.id)}
                      className="accent-secondary"
                    />
                    <div>
                      <span className="text-sm font-medium">{rate.carrier} — {rate.service}</span>
                      <span className="block text-xs text-muted">{rate.days}</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    ${(rate.amount / 100).toFixed(2)}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Sticky note about local pickup */}
          <div className="mt-4 max-w-xs">
            <StickyNote rotation={-1.5}>
              <p className="text-xs">
                Live in State College or going to see Marco around? Switch to
                &quot;Local Pickup&quot; above and save on shipping!
              </p>
            </StickyNote>
          </div>
        </section>
      )}

      {/* Total & Pay */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span>${(total / 100).toFixed(2)}</span>
        </div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">Shipping</span>
          <span>
            {deliveryType === "local_pickup"
              ? "Free"
              : shippingCost > 0
                ? `$${(shippingCost / 100).toFixed(2)}`
                : "—"}
          </span>
        </div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">Tax</span>
          <span className="text-xs text-muted">Calculated by Stripe</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-lg font-bold">
          <span>Total</span>
          <span>${(grandTotal / 100).toFixed(2)}+tax</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={
            submitting ||
            !email ||
            (deliveryType === "shipping" && (!selectedRate || !address.line1))
          }
          className="mt-4 w-full rounded-lg bg-secondary py-3 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Redirecting to payment..." : "Pay with Stripe"}
        </button>
      </section>
    </div>
  );
}
