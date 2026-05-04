"use client";

import { ReactNode } from "react";
import { CartProvider } from "@/lib/merch/cart";
import CartIcon from "./CartIcon";
import CartDrawer from "./CartDrawer";

export default function MerchShell({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="merch-theme min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <a href="/merch" className="flex items-center gap-1">
              <span className="text-lg tracking-tight">
                <span className="font-extralight">PSU</span>
                <span className="font-bold">Worship</span>
              </span>
              <span className="text-xs font-medium uppercase tracking-widest text-muted">
                Merch
              </span>
            </a>

            <div className="flex items-center gap-3">
              <a
                href="/"
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                ← Back to Tools
              </a>
              <CartIcon />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main>{children}</main>

        {/* Cart drawer */}
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
