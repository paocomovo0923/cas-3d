'use client';

/**
 * CAS — Hexágonos estilo The Sims 4 (aspiração dourada + traços brancos
 * sobre o painel azul #1d5287).
 */
import type { LucideIcon } from 'lucide-react';

const HEX_CLIP = 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)';

interface HexagonProps {
  size: number;
  active?: boolean;
  primary?: boolean;
  onClick?: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function Hexagon({
  size,
  active = false,
  primary = false,
  onClick,
  title,
  children,
}: HexagonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{ width: size, height: size, clipPath: HEX_CLIP }}
      className={[
        'flex items-center justify-center select-none transition-all duration-150',
        primary
          ? 'bg-gradient-to-b from-[#ffe28a] to-[#e9b13c]' // aspiração dourada
          : active
            ? 'bg-gradient-to-b from-white to-[#cfe6f7]' // traço branco gelo
            : 'bg-white/25',
        onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default',
      ].join(' ')}
      aria-label={title}
    >
      <span
        style={{ clipPath: HEX_CLIP }}
        className={[
          'flex h-full w-full items-center justify-center',
          primary
            ? 'bg-gradient-to-b from-[#ffd966] to-[#f0b23e] text-[#6b4a00]'
            : active
              ? 'bg-gradient-to-b from-white to-[#e4f1fb] text-[#1d5287]'
              : 'text-white/80',
        ].join(' ')}
      >
        {children}
      </span>
    </button>
  );
}

export function HexIcon({ icon: Icon, size = 20 }: { icon: LucideIcon; size?: number }) {
  return <Icon size={size} strokeWidth={2.3} />;
}
