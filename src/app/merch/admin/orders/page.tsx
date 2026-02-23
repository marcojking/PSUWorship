"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

type OrderStatus = "pending" | "abandoned" | "pending_approval" | "approved" | "rejected" | "paid" | "fulfilled" | "cancelled";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  abandoned: "bg-gray-500/20 text-gray-400",
  pending_approval: "bg-orange-500/20 text-orange-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  paid: "bg-green-500/20 text-green-400",
  fulfilled: "bg-blue-500/20 text-blue-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  abandoned: "Abandoned",
  pending_approval: "Needs Review",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

type FilterTab = "all" | "pending" | "abandoned" | "pending_approval" | "approved" | "paid" | "fulfilled";

export default function OrdersAdminPage() {
  const orders = useQuery(api.orders.list, {});
  const updateStatus = useMutation(api.orders.updateStatus);
  const removeOrder = useMutation(api.orders.remove);
  const [expandedId, setExpandedId] = useState<Id<"orders"> | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // "All" = active orders only (excludes raw pending + abandoned noise)
  const ACTIVE_STATUSES = ["pending_approval", "approved", "paid", "fulfilled", "cancelled", "rejected"];

  const filteredOrders = orders?.filter((o) => {
    if (activeTab === "all") return ACTIVE_STATUSES.includes(o.status);
    return o.status === activeTab;
  });


  const pendingCount   = orders?.filter((o) => o.status === "pending_approval").length ?? 0;
  const approvedCount  = orders?.filter((o) => o.status === "approved").length ?? 0;
  const paidCount      = orders?.filter((o) => o.status === "paid").length ?? 0;
  const fulfilledCount = orders?.filter((o) => o.status === "fulfilled").length ?? 0;
  const orphanCount    = orders?.filter((o) => o.status === "pending").length ?? 0;
  const abandonCount   = orders?.filter((o) => o.status === "abandoned").length ?? 0;

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all",              label: "All",          count: orders?.filter((o) => ACTIVE_STATUSES.includes(o.status)).length },
    { key: "pending_approval", label: "Needs Review", count: pendingCount   },
    { key: "approved",         label: "Approved",     count: approvedCount  },
    { key: "paid",             label: "Paid",         count: paidCount      },
    { key: "fulfilled",        label: "Fulfilled",    count: fulfilledCount },
    { key: "abandoned",        label: "Abandoned",    count: abandonCount   },
    { key: "pending",          label: "Orphaned",     count: orphanCount    },
  ];

  const handleApprove = async (order: NonNullable<typeof orders>[0]) => {
    if (!order.stripePaymentIntentId) {
      alert("Error: This order is missing a Stripe Payment Intent ID. Was it paid with Cash/Local Pickup?");
      return;
    }

    try {
      const res = await fetch("/api/merch/capture-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          paymentIntentId: order.stripePaymentIntentId,
          adminNote: adminNote || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Failed to approve: ${data.error || "Unknown error"}`);
        return;
      }

      setAdminNote("");
    } catch (err) {
      console.error(err);
      alert("Network error capturing payment.");
    }
  };

  const handleReject = async (orderId: Id<"orders">) => {
    if (!adminNote) {
      alert("Please add a note explaining why this order was rejected.");
      return;
    }
    await updateStatus({
      id: orderId,
      status: "rejected",
      adminNote,
    });
    setAdminNote("");
  };

  const handleDelete = async (orderId: Id<"orders">) => {
    if (confirm("Are you sure you want to permanently delete this order? This cannot be undone.")) {
      await removeOrder({ id: orderId });
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Orders</h1>

      {/* Pending banner */}
      {pendingCount > 0 && (
        <div className="mb-4 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-400">
          ⚠ <strong>{pendingCount}</strong> order{pendingCount > 1 ? "s" : ""} awaiting review
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-background p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === tab.key
              ? "bg-secondary/20 text-secondary"
              : "text-muted hover:text-foreground"
              }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-border/50 px-1.5 py-0.5 text-[10px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {!filteredOrders ? (
        <div className="text-muted">Loading...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-muted">
          No orders {activeTab !== "all" ? `with status "${STATUS_LABELS[activeTab as OrderStatus]}"` : "yet"}.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const expanded = expandedId === order._id;
            const isPending = order.status === "pending_approval";
            return (
              <div
                key={order._id}
                className={`rounded-xl border bg-card transition-colors ${isPending ? "border-orange-500/40" : "border-border"
                  }`}
              >
                {/* Header row */}
                <button
                  onClick={() => {
                    setExpandedId(expanded ? null : order._id);
                    setAdminNote("");
                  }}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[order.status as OrderStatus] ?? "bg-border text-muted"}`}>
                    {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm">
                    {order.email}
                  </span>
                  <span className="text-sm font-medium">
                    ${(order.total / 100).toFixed(2)}
                  </span>
                  <span className="hidden sm:block text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-muted text-xs">{expanded ? "▲" : "▼"}</span>
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
                            ? "📍 Local Pickup"
                            : `📦 ${order.shippingMethod} — $${(order.shippingCost / 100).toFixed(2)}`}
                        </p>
                        {order.shippingAddress && (
                          <p className="mt-1 text-xs text-muted">
                            {order.shippingAddress.name}<br />
                            {order.shippingAddress.line1}
                            {order.shippingAddress.line2 && <><br />{order.shippingAddress.line2}</>}
                            <br />
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                          </p>
                        )}
                      </div>
                      <div>
                        <h4 className="mb-1 text-xs font-semibold text-muted uppercase">
                          Contact
                        </h4>
                        <p className="text-sm">{order.email}</p>
                        {order.contactPhone && (
                          <p className="text-xs text-muted">{order.contactPhone}</p>
                        )}
                        {order.stripeSessionId && (
                          <>
                            <h4 className="mt-2 mb-0.5 text-xs font-semibold text-muted uppercase">
                              Stripe
                            </h4>
                            <p className="break-all font-mono text-[10px] text-muted">
                              {order.stripeSessionId}
                            </p>
                            {order.stripeReceiptUrl && (
                              <a
                                href={order.stripeReceiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-block text-xs font-medium text-secondary hover:underline"
                              >
                                ↗ View Official Receipt
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Admin note if exists */}
                    {order.adminNote && (
                      <div className="mb-3 rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2 text-xs">
                        <span className="font-medium text-secondary">Admin Note: </span>
                        <span className="text-muted">{order.adminNote}</span>
                      </div>
                    )}

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

                    {/* ── Approve / Reject (for pending_approval orders) ── */}
                    {isPending && (
                      <div className="mb-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                        <h4 className="mb-2 text-xs font-semibold text-orange-400 uppercase">
                          Review Decision
                        </h4>
                        <textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Add a note (required for rejection, optional for approval)..."
                          rows={2}
                          className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(order)}
                            className="rounded-lg bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-400 transition-opacity hover:opacity-80"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReject(order._id)}
                            className="rounded-lg bg-red-500/20 px-4 py-1.5 text-xs font-semibold text-red-400 transition-opacity hover:opacity-80"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* General status controls & Delete */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border mt-4 pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted">Set status:</span>
                        {(["pending_approval", "approved", "paid", "fulfilled", "cancelled"] as OrderStatus[]).map(
                          (status) => (
                            <button
                              key={status}
                              disabled={order.status === status}
                              onClick={() => updateStatus({ id: order._id, status })}
                              className={`rounded px-2 py-1 text-[10px] font-medium transition-opacity disabled:opacity-30 ${STATUS_COLORS[status]}`}
                            >
                              {STATUS_LABELS[status]}
                            </button>
                          ),
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(order._id)}
                        className="rounded px-3 py-1 text-xs font-semibold text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      >
                        Delete Order
                      </button>
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
