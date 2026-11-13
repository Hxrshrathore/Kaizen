import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  isWhite?: boolean;
  showIcon?: boolean;
  iconOnly?: boolean;
  size?: number;
}

export function Logo({
  className = '',
  isWhite = false,
  showIcon = true,
  iconOnly = false,
  size = 30,
}: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 transition-opacity hover:opacity-85 ${className}`}>
      {showIcon && (
        <div
          className="relative overflow-hidden rounded-xl shadow-md border border-black/10 dark:border-white/15 shrink-0 bg-black"
          style={{ width: size, height: size }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/kaizen-logo.png"
            alt="Kaizen Logo"
            width={size}
            height={size}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {!iconOnly && (
        <div className="inline-flex items-baseline">
          <span className={`text-xl font-display font-bold tracking-wide ${isWhite ? 'text-white' : 'text-foreground'}`}>
            KAIZEN
          </span>
          <sup className="text-[#bbf246] text-[10px] font-mono tracking-wider ml-1 font-semibold">
            BETA
          </sup>
        </div>
      )}
    </Link>
  );
}
