"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/merch/cart";
import Link from "next/link";
import { Suspense } from "react";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart after successful payment
    clearCart();
  }, [clearCart]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mb-6 text-5xl">✓</div>
      <h1 className="mb-2 text-2xl font-bold">Order Confirmed!</h1>
      <p className="mb-6 text-sm text-muted">
        Thanks for your order. You&apos;ll receive an email receipt from Stripe
        shortly.
      </p>

      {sessionId && (
        <p className="mb-6 break-all rounded-lg bg-card px-4 py-2 font-mono text-xs text-muted">
          Session: {sessionId}
        </p>
      )}

      <Link
        href="/merch"
        className="inline-block rounded-lg bg-secondary px-6 py-3 font-medium text-background transition-opacity hover:opacity-90"
      >
        Back to Merch
      </Link>
    </div>
  );
}
