"use client";

import { useCart } from "@/lib/merch/cart";
import Link from "next/link";

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, total, isOpen, setIsOpen } =
    useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background border-l border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Cart</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Your cart is empty
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted capitalize">
                        {item.type.replace("_", " ")}
                        {item.size && ` · ${item.size}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-red-400 hover:text-red-300 shrink-0"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Placements */}
                  {item.placements && item.placements.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {item.placements.map((p, i) => (
                        <p key={i} className="text-[11px] text-muted">
                          {p.position} ({p.size})
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm hover:bg-card"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded border border-border text-sm hover:bg-card"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-medium">
                      ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-medium">Subtotal</span>
              <span className="text-lg font-bold">
                ${(total / 100).toFixed(2)}
              </span>
            </div>
            <Link
              href="/merch/checkout"
              onClick={() => setIsOpen(false)}
              className="block w-full rounded-lg bg-secondary py-3 text-center font-medium text-background transition-opacity hover:opacity-90"
            >
              Checkout
            </Link>
            <p className="mt-2 text-center text-xs text-muted">
              Shipping & tax calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}
