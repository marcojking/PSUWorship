"use client";

export default function PriceDisplay({
    items,
    total,
}: {
    items: { label: string; amount: number }[];
    total: number;
}) {
    if (items.length === 0) return null;

    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="mb-3 text-xs font-semibold">Price Estimate</h4>
            <div className="space-y-1.5">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted">{item.label}</span>
                        <span className="font-medium">${(item.amount / 100).toFixed(2)}</span>
                    </div>
                ))}
            </div>
            <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Estimated Total</span>
                    <span className="text-sm font-bold text-secondary">${(total / 100).toFixed(2)}</span>
                </div>
                <p className="mt-1 text-[10px] text-muted">Shipping calculated at checkout</p>
            </div>
        </div>
    );
}
