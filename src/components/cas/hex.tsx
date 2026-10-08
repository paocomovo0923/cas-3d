'use client';

/**
 * CAS — Componentes hexagonais (aspiração e traços, estilo The Sims 4)
 */
import type { LucideIcon } from 'lucide-react';

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
      style={{
        width: size,
        height: size,
        clipPath:
          'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
      }}
      className={[
        'flex items-center justify-center transition-all duration-150 select-none',
        primary
          ? 'bg-gradient-to-b from-emerald-300 to-teal-400 text-emerald-900'
          : active
            ? 'bg-gradient-to-b from-emerald-200 to-emerald-400 text-emerald-900'
            : 'bg-white/85 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700',
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default',
      ].join(' ')}
    >
      <span
        style={{
          clipPath:
            'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)',
        }}
        className={[
          'flex h-full w-full items-center justify-center',
          primary ? 'bg-emerald-500/15' : active ? 'bg-emerald-500/10' : '',
        ].join(' ')}
      >
        {children}
      </span>
    </button>
  );
}

export function HexIcon({ icon: Icon, size = 20 }: { icon: LucideIcon; size?: number }) {
  return <Icon size={size} strokeWidth={2.2} />;
}
