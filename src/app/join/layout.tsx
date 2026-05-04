import { ConvexClientProvider } from "@/components/ConvexClientProvider";

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
