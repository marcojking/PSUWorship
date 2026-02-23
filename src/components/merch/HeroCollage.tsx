"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function HeroCollage() {
  const [scroll, setScroll] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setScroll(window.scrollY));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Hero scrolls up at 1.4x normal speed — lifts off like fabric being pulled up
  const pullUp = scroll * 1.4;

  return (
    <div className="relative pointer-events-none" style={{ zIndex: 2 }}>
      {/* Spacer — reserves viewport height in document flow */}
      <div className="h-screen" />

      {/* Hero layer — fixed to viewport, translates up faster on scroll */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 flex h-screen items-center justify-center"
        style={{
          transform: `translateY(${-pullUp}px)`,
          willChange: "transform",
        }}
      >
        {/* Fabric texture — Wrapped in oversized container to handle the parallax lift */}
        <div className="absolute left-0 top-0 w-full" style={{ height: "calc(100% + 120px)" }}>
          <Image
            src="/merch/fabric-texture.png"
            alt=""
            priority
            sizes="(max-width: 768px) 300vw, 100vw"
            fill
            className="pointer-events-none select-none object-cover object-[center_bottom]"
          />
        </div>

        {/* Soft fade at the bottom of the fray */}
        <div
          className="pointer-events-none absolute left-0 w-full"
          style={{
            bottom: -120,
            height: 80,
            background: "linear-gradient(to bottom, transparent, hsl(var(--background)))",
          }}
        />

        {/* Logo — moves with the fabric */}
        <div className="relative z-10 text-center">
          <img
            src="/logos/psuworship-patchwork.png"
            alt="PSUWorship"
            // @ts-ignore - React 18 supports fetchPriority but TS might complain
            fetchpriority="high"
            className="mx-auto h-auto w-[min(90vw,720px)] drop-shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
