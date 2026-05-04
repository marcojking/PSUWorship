"use client";

import { useState } from "react";

interface LineItem {
  label: string;
  amount: number; // cents
}

interface PriceSummaryProps {
  clothingBase: LineItem | null;
  designItems: LineItem[];
  total: number; // cents
}

export default function PriceSummary({
  clothingBase,
  designItems,
  total,
}: PriceSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4"
      >
        <span className="text-sm font-medium">Total</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            ${(total / 100).toFixed(2)}
          </span>
          <span className="text-xs text-muted">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Breakdown */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {clothingBase && (
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted">{clothingBase.label}</span>
              <span>${(clothingBase.amount / 100).toFixed(2)}</span>
            </div>
          )}
          {designItems.map((item, i) => (
            <div key={i} className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted">{item.label}</span>
              <span>${(item.amount / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-medium">
            <span>Total</span>
            <span>${(total / 100).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
