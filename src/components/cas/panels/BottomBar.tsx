'use client';

/**
 * CAS — Barra inferior: pré-visualização da biblioteca de animações
 * (F_/M_ + clips extras Armature|mixamo.com|Layer0 quando disponíveis)
 */
import { PREVIEW_ANIMS } from '@/lib/cas/data';

interface BottomBarProps {
  current: string;
  availableExtras: string[];
  onPlay: (id: string) => void;
}

export function BottomBar({ current, availableExtras, onPlay }: BottomBarProps) {
  const anims = PREVIEW_ANIMS.filter(
    (a) => !a.extra || availableExtras.includes(a.id)
  );
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 flex max-w-[92vw] -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/60 bg-white/70 p-1.5 shadow-lg backdrop-blur-md">
      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Animações
      </span>
      {anims.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onPlay(a.id)}
          className={[
            'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
            current === a.id
              ? 'bg-emerald-400 text-white shadow'
              : 'bg-white/85 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700',
          ].join(' ')}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
