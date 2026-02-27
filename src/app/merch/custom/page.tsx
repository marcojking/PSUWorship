"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import MerchBuilder from "@/components/merch/builder/MerchBuilder";
import StickyNote from "@/components/merch/StickyNote";

export default function CustomizePage() {
  return (
    <ConvexClientProvider>
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted">Loading builder...</div>}>
        <CustomizePageInner />
      </Suspense>
    </ConvexClientProvider>
  );
}

function CustomizePageInner() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft") ?? undefined;

  return (
    <div>
      <MerchBuilder draftId={draftId} />
    </div>
  );
}
