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

      {/* Coming soon notice */}
      <section className="mb-8">
        <StickyNote rotation={-1}>
          <p className="font-medium">Almost there!</p>
          <p className="mt-1">
            We&apos;re putting a couple of finishing touches on the store before
            accepting orders. This should be ready in the next couple of days!
          </p>
          <p className="mt-2 text-xs text-[#968a78]">
            In the meantime, your cart is saved so you won&apos;t lose anything.
          </p>
        </StickyNote>
      </section>

      <Link
        href="/merch"
        className="block w-full rounded-lg border border-border py-3 text-center text-sm font-medium transition-colors hover:border-secondary/40"
      >
        ← Keep Browsing
      </Link>
    </div>
  );
}
