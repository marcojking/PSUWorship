"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroCollage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScroll(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center overflow-visible"
      style={{ zIndex: 1 }}
    >
      {/* Fabric texture — object-position bottom so the fray edge is always
          fully visible. The image extends 120px below the section. */}
      <img
        src="/merch/fabric-texture.png"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute left-0 top-0 w-full select-none"
        style={{
          height: "calc(100% + 120px)",
          objectFit: "cover",
          objectPosition: "center bottom",
        }}
      />

      {/* Soft fade at the very bottom of the fray into --background */}
      <div
        className="pointer-events-none absolute left-0 w-full"
        style={{
          bottom: -120,
          height: 80,
          background: "linear-gradient(to bottom, transparent, hsl(var(--background)))",
        }}
      />

      {/* Center branding — logo only */}
      <div
        className="relative z-10 text-center"
        style={{
          transform: `translateY(${scroll * -0.1}px)`,
          willChange: "transform",
        }}
      >
        <img
          src="/logos/psuworship-patchwork.png"
          alt="PSUWorship"
          className="mx-auto w-[min(82vw,720px)] drop-shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
          draggable={false}
        />
      </div>
    </section>
  );
}
