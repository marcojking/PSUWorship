'use client';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-lg sm:text-2xl tracking-tight">
        <span className="font-extralight">PSU</span>
        <span className="font-bold">Worship</span>
      </span>
    </div>
  );
}
