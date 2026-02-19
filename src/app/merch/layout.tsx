import type { Metadata } from "next";
import MerchShell from "@/components/merch/MerchShell";

export const metadata: Metadata = {
  title: "PSUWorship Merch",
  description: "Handmade patches, stickers, and custom embroidered gear from PSUWorship",
};

export default function MerchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MerchShell>{children}</MerchShell>;
}
