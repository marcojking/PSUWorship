"use client";

export const dynamic = "force-dynamic";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import DesignUploader from "@/components/merch/admin/DesignUploader";
import Link from "next/link";

export default function EditDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ConvexClientProvider>
      <EditDesignForm id={id as Id<"designs">} />
    </ConvexClientProvider>
  );
}

function EditDesignForm({ id }: { id: Id<"designs"> }) {
  const design = useQuery(api.designs.get, { id });

  if (design === undefined) {
    return <div className="text-muted">Loading...</div>;
  }
  if (design === null) {
    return (
      <div>
        <p className="mb-4 text-muted">Design not found.</p>
        <Link href="/merch/admin/designs" className="text-sm text-secondary hover:underline">
          ← Back to Designs
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/merch/admin/designs"
        className="mb-6 inline-block text-sm text-muted hover:text-foreground transition-colors"
      >
        ← Back to Designs
      </Link>
      <DesignUploader editDesign={design} />
    </div>
  );
}
