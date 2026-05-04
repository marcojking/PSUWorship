"use client";

import { useCart } from "@/lib/merch/cart";

export default function CartIcon() {
  const { itemCount, setIsOpen } = useCart();

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="relative rounded-full bg-card p-2.5 transition-colors hover:bg-secondary/20"
      aria-label={`Cart with ${itemCount} items`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>

      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-background">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </button>
  );
}
