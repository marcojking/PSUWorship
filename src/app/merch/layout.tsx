import type { Metadata } from "next";
import MerchShell from "@/components/merch/MerchShell";

export const metadata: Metadata = {
  title: "WM&A Merch",
  description: "Handmade patches, stickers, and custom embroidered gear from WM&A",
};

export default function MerchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MerchShell>{children}</MerchShell>;
}
