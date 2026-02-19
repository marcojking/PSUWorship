"use client";

import { useRef, useState, useEffect, ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number; // degrees, default 15
  perspective?: number; // px, default 800
  glare?: boolean;
  scale?: number; // hover scale, default 1.02
  shaped?: boolean; // use drop-shadow (follows alpha) instead of box-shadow
}

export default function TiltCard({
  children,
  className = "",
  maxTilt = 15,
  perspective = 800,
  glare = true,
  scale = 1.02,
  shaped = false,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [gyroAvailable, setGyroAvailable] = useState(false);
  const rafRef = useRef<number>(0);

  // Gyroscope for mobile
  useEffect(() => {
    let handler: ((e: DeviceOrientationEvent) => void) | null = null;

    const setupGyro = () => {
      handler = (e: DeviceOrientationEvent) => {
        if (e.gamma === null || e.beta === null) return;
        // gamma: left/right tilt (-90 to 90)
        // beta: front/back tilt (-180 to 180)
        const x = Math.max(-maxTilt, Math.min(maxTilt, (e.gamma / 90) * maxTilt));
        const y = Math.max(-maxTilt, Math.min(maxTilt, ((e.beta - 45) / 90) * maxTilt));
        setTilt({ x, y: -y });
        setGyroAvailable(true);
      };
      window.addEventListener("deviceorientation", handler, { passive: true });
    };

    // iOS requires permission
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      "requestPermission" in DeviceOrientationEvent
    ) {
      // We'll request on first touch in the card
    } else if (typeof DeviceOrientationEvent !== "undefined") {
      setupGyro();
    }

    return () => {
      if (handler) window.removeEventListener("deviceorientation", handler);
    };
  }, [maxTilt]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gyroAvailable) return;
    const card = cardRef.current;
    if (!card) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * maxTilt;
      const rotateX = ((centerY - e.clientY) / (rect.height / 2)) * maxTilt;
      setTilt({ x: rotateY, y: rotateX });
    });
  };

  const handleMouseEnter = () => setHovering(true);

  const handleMouseLeave = () => {
    setHovering(false);
    setTilt({ x: 0, y: 0 });
  };

  const handleTouchStart = async () => {
    // Request gyroscope permission on iOS
    if (
      !gyroAvailable &&
      typeof DeviceOrientationEvent !== "undefined" &&
      "requestPermission" in DeviceOrientationEvent
    ) {
      try {
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (permission === "granted") {
          window.addEventListener(
            "deviceorientation",
            (e) => {
              if (e.gamma === null || e.beta === null) return;
              const x = Math.max(-maxTilt, Math.min(maxTilt, (e.gamma / 90) * maxTilt));
              const y = Math.max(-maxTilt, Math.min(maxTilt, ((e.beta - 45) / 90) * maxTilt));
              setTilt({ x, y: -y });
              setGyroAvailable(true);
            },
            { passive: true },
          );
        }
      } catch {
        // Permission denied or not available
      }
    }
  };

  // Shadow offset based on tilt
  const shadowX = tilt.x * 0.5;
  const shadowY = -tilt.y * 0.5;

  // Glare position
  const glareX = ((tilt.x + maxTilt) / (maxTilt * 2)) * 100;
  const glareY = ((tilt.y + maxTilt) / (maxTilt * 2)) * 100;

  // shaped=true: use filter drop-shadow (follows alpha) instead of box-shadow (bounding rect)
  const shadowStyle = shaped
    ? { filter: `drop-shadow(${shadowX}px ${shadowY + 8}px 16px rgba(0,0,0,0.5))` }
    : { boxShadow: `${shadowX}px ${shadowY + 8}px 24px rgba(0,0,0,0.3)` };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      className={`relative ${className}`}
      style={{
        perspective: `${perspective}px`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="relative transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(${hovering ? scale : 1})`,
          ...shadowStyle,
        }}
      >
        {children}

        {/* Glare overlay — disabled when shaped (ProductCard renders its own masked glare) */}
        {glare && !shaped && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
              opacity: hovering || gyroAvailable ? 1 : 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
