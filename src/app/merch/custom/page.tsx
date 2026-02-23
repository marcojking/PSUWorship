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

      {/* Sticky note for local pickup */}
      <section className="mx-auto max-w-sm py-8">
        <StickyNote rotation={-1.5}>
          <p className="font-medium">Hey!</p>
          <p className="mt-1">
            Live in State College or going to see Marco around? I can deliver in
            person so we don&apos;t have to pay for shipping!
          </p>
          <p className="mt-2 text-xs text-[#968a78]">
            You can choose local pickup at checkout.
          </p>
        </StickyNote>
      </section>
    </div>
  );
}
