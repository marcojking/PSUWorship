"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import AdminPasswordGate from "@/components/merch/admin/AdminPasswordGate";

const navItems = [
  { href: "/merch/admin", label: "Dashboard" },
  { href: "/merch/admin/designs", label: "Designs" },
  { href: "/merch/admin/clothing", label: "Clothing" },
  { href: "/merch/admin/standalone", label: "Standalone" },
  { href: "/merch/admin/prompts", label: "Prompts" },
  { href: "/merch/admin/orders", label: "Orders" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ConvexClientProvider>
      <AdminPasswordGate>
        <div className="mx-auto max-w-6xl px-4 py-6">
          {/* Admin nav */}
          <nav className="mb-8 flex flex-wrap gap-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/merch/admin"
                  ? pathname === "/merch/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary/20 text-secondary"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {children}
        </div>
      </AdminPasswordGate>
    </ConvexClientProvider>
  );
}
