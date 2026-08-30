import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  isWhite?: boolean;
}

export function Logo({ className = '', isWhite = false }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-baseline transition-opacity hover:opacity-80 ${className}`}>
      <span className={`text-xl font-display font-bold tracking-wide ${isWhite ? 'text-white' : 'text-foreground'}`}>
        KAIZEN
      </span>
      <sup className="text-blue-500 text-[10px] font-mono tracking-wider ml-1 font-semibold">
        BETA
      </sup>
    </Link>
  );
}
