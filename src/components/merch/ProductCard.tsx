"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import TiltCard from "./TiltCard";

interface ProductCardProps {
  id: string;
  name: string;
  imageUrl: string;
  shapePath?: string;
  startingPrice: number; // cents
  hoverImages?: string[]; // clothing mockup URLs for slideshow
}

export default function ProductCard({
  id,
  name,
  imageUrl,
  shapePath,
  startingPrice,
  hoverImages = [],
}: ProductCardProps) {
  const [phase, setPhase] = useState<"idle" | "hovering" | "slideshow">("idle");
  const [slideIndex, setSlideIndex] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const delayRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hoverImagesRef = useRef(hoverImages);
  hoverImagesRef.current = hoverImages;

  const hasSlideshow = hoverImages.length > 0;
  const hovering = phase !== "idle";
  const showSlideshow = phase === "slideshow" && hasSlideshow;

  const handleEnter = () => {
    setPhase("hovering");
    setSlideIndex(0);
    clearTimeout(delayRef.current);
    // Check latest hoverImages via ref to avoid stale closure
    delayRef.current = setTimeout(() => {
      if (hoverImagesRef.current.length > 0) setPhase("slideshow");
    }, 1000);
  };

  const handleLeave = () => {
    setPhase("idle");
    clearTimeout(delayRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlarePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // Advance slideshow frames
  useEffect(() => {
    if (!showSlideshow) return;
    const interval = setInterval(() => {
      setSlideIndex((i) => (i + 1) % hoverImages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [showSlideshow, hoverImages.length]);

  return (
    <Link href={`/merch/${id}`} className="group block">
      {/* drop-shadow follows rendered alpha — morphs from sticker to rect automatically */}
      <TiltCard className="mb-3" shaped>
        <div
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onMouseMove={handleMouseMove}
          className="relative aspect-square"
        >
          {/* Design sticker — PNG alpha defines the shape */}
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-contain"
            style={{
              opacity: showSlideshow ? 0 : 1,
              transition: showSlideshow ? "opacity 0.4s ease" : "opacity 0.25s ease",
            }}
          />

          {/* Shaped glare — masked to sticker alpha */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.18) 0%, transparent 55%)`,
              opacity: hovering && !showSlideshow ? 1 : 0,
              transition: "opacity 0.2s ease",
              maskImage: `url(${imageUrl})`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: `url(${imageUrl})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />

          {/*
            Slideshow reveal — uses the sticker PNG as a CSS mask, then scales the
            masked layer up so the sticker-shaped hole grows outward and eventually
            covers the entire card. Content is counter-scaled to stay at normal size.
          */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div
              className="absolute inset-0"
              style={{
                maskImage: `url(${imageUrl})`,
                maskSize: "contain",
                maskPosition: "center",
                maskRepeat: "no-repeat",
                WebkitMaskImage: `url(${imageUrl})`,
                WebkitMaskSize: "contain",
                WebkitMaskPosition: "center",
                WebkitMaskRepeat: "no-repeat",
                transform: showSlideshow ? "scale(5)" : "scale(1)",
                opacity: showSlideshow ? 1 : 0,
                transition: showSlideshow
                  ? "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.12s ease"
                  : "transform 0.35s ease-in, opacity 0.2s 0.15s ease",
                transformOrigin: "center",
                willChange: "transform",
              }}
            >
              {/* Counter-scale keeps content at normal visual size while mask grows */}
              <div
                className="absolute inset-0"
                style={{
                  transform: showSlideshow ? "scale(0.2)" : "scale(1)",
                  transition: showSlideshow
                    ? "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
                    : "transform 0.35s ease-in",
                  transformOrigin: "center",
                }}
              >
                <div className="absolute inset-0 bg-card" />
                {hoverImages.map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt={`${name} mockup ${i + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      opacity: slideIndex === i ? 1 : 0,
                      transition: "opacity 0.5s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </TiltCard>

      <div className="px-1">
        <h3 className="text-sm font-semibold group-hover:text-secondary transition-colors">
          {name}
        </h3>
        <p className="text-xs text-muted">
          From ${(startingPrice / 100).toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
