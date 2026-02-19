"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  paid: "bg-green-500/20 text-green-400",
  fulfilled: "bg-blue-500/20 text-blue-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function OrdersAdminPage() {
  const orders = useQuery(api.orders.list, {});
  const updateStatus = useMutation(api.orders.updateStatus);
  const [expandedId, setExpandedId] = useState<Id<"orders"> | null>(null);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Orders</h1>

      {!orders ? (
        <div className="text-muted">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-muted">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const expanded = expandedId === order._id;
            return (
              <div
                key={order._id}
                className="rounded-xl border border-border bg-card"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : order._id)}
                  className="flex w-full items-center gap-4 p-4 text-left"
                >
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm">
                    {order.email}
                  </span>
                  <span className="text-sm font-medium">
                    ${(order.total / 100).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-muted">{expanded ? "▲" : "▼"}</span>
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-border p-4">
                    <div className="mb-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="mb-1 text-xs font-semibold text-muted uppercase">
                          Delivery
                        </h4>
                        <p className="text-sm">
                          {order.deliveryType === "local_pickup"
                            ? "Local Pickup"
                            : `${order.shippingMethod} — $${(order.shippingCost / 100).toFixed(2)}`}
                        </p>
                        {order.shippingAddress && (
                          <p className="mt-1 text-xs text-muted">
                            {order.shippingAddress.name}
                            <br />
                            {order.shippingAddress.line1}
                            {order.shippingAddress.line2 && <><br />{order.shippingAddress.line2}</>}
                            <br />
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                          </p>
                        )}
                      </div>
                      <div>
                        <h4 className="mb-1 text-xs font-semibold text-muted uppercase">
                          Stripe Session
                        </h4>
                        <p className="break-all font-mono text-xs text-muted">
                          {order.stripeSessionId}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <h4 className="mb-2 text-xs font-semibold text-muted uppercase">
                      Items ({order.items.length})
                    </h4>
                    <div className="mb-4 space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between rounded bg-background px-3 py-2 text-sm">
                          <span>
                            {item.name}
                            {item.size && <span className="text-muted"> ({item.size})</span>}
                            {item.quantity > 1 && <span className="text-muted"> ×{item.quantity}</span>}
                          </span>
                          <span className="font-medium">
                            ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Status update */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">Update status:</span>
                      {(["pending", "paid", "fulfilled", "cancelled"] as OrderStatus[]).map(
                        (status) => (
                          <button
                            key={status}
                            disabled={order.status === status}
                            onClick={() => updateStatus({ id: order._id, status })}
                            className={`rounded px-2 py-1 text-xs font-medium transition-opacity disabled:opacity-30 ${STATUS_COLORS[status]}`}
                          >
                            {status}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
