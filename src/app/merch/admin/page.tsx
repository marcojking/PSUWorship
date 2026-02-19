"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const sections = [
  {
    title: "Designs",
    href: "/merch/admin/designs",
    description: "Upload designs, set prices, manage clip paths",
  },
  {
    title: "Clothing",
    href: "/merch/admin/clothing",
    description: "Manage clothing items and placement zones",
  },
  {
    title: "Standalone Products",
    href: "/merch/admin/standalone",
    description: "Pre-made items, bundles, and limited drops",
  },
  {
    title: "Prompt Templates",
    href: "/merch/admin/prompts",
    description: "Edit AI mockup generation prompts",
  },
  {
    title: "Orders",
    href: "/merch/admin/orders",
    description: "View and manage customer orders",
  },
];

export default function AdminDashboard() {
  const designs = useQuery(api.designs.list, {});
  const orders = useQuery(api.orders.list, {});
  const clothing = useQuery(api.clothing.list, {});
  const products = useQuery(api.products.list, {});

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Merch Admin</h1>

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Designs" value={designs?.length} />
        <StatCard label="Clothing" value={clothing?.length} />
        <StatCard label="Products" value={products?.length} />
        <StatCard label="Orders" value={orders?.length} />
      </div>

      {/* Section links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-secondary/40"
          >
            <h3 className="font-semibold group-hover:text-secondary transition-colors">
              {section.title}
            </h3>
            <p className="mt-1 text-sm text-muted">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-2xl font-bold">{value ?? "—"}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}
