"use client";

import { ReactNode } from "react";

interface StickyNoteProps {
  children: ReactNode;
  className?: string;
  rotation?: number;
}

export default function StickyNote({
  children,
  className = "",
  rotation = -2,
}: StickyNoteProps) {
  return (
    <div
      className={`relative rounded-sm bg-[#f5ead6] px-5 py-4 text-[#1a1714] shadow-md ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Tape strip at top */}
      <div className="absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2 rounded-sm bg-[#c4793a]/20" />

      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
