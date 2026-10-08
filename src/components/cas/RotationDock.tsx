'use client';

/**
 * CAS — Dock inferior central estilo The Sims 4:
 * setas curvas de rotação 360° do personagem + chips de animação.
 */
import { PREVIEW_ANIMS } from '@/lib/cas/data';

interface RotationDockProps {
  current: string;
  availableExtras: string[];
  onPlay: (id: string) => void;
  onRotate: (delta: number) => void;
}

/** seta curva estilo Sims 4 */
function CurvedArrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      className="drop-shadow-[0_2px_3px_rgba(9,40,70,0.45)]"
      aria-hidden
    >
      <path
        d={dir === 'left' ? 'M26.5 6.5 A12.5 12.5 0 1 0 30 19' : 'M7.5 6.5 A12.5 12.5 0 1 1 4 19'}
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d={dir === 'left' ? 'M21.5 2.5 L31 5.5 L25.5 13.5 Z' : 'M12.5 2.5 L3 5.5 L8.5 13.5 Z'}
        fill="#ffffff"
      />
    </svg>
  );
}

export function RotationDock({ current, availableExtras, onPlay, onRotate }: RotationDockProps) {
  const anims = PREVIEW_ANIMS.filter((a) => !a.extra || availableExtras.includes(a.id));

  return (
    <div className="pointer-events-none absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5">
      {/* chips de animação */}
      <div className="pointer-events-auto flex max-w-[calc(100vw-150px)] items-center gap-1 overflow-x-auto rounded-2xl border border-white/50 bg-white/80 p-1 shadow-[0_5px_16px_rgba(9,52,90,0.28)] backdrop-blur-md [scrollbar-width:none] lg:max-w-[86vw] [&::-webkit-scrollbar]:hidden">
        {anims.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onPlay(a.id)}
            className={[
              'whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold transition-all',
              current === a.id
                ? 'bg-[#3fae52] text-white shadow'
                : 'text-[#3d6a94] hover:bg-[#e2f2ff] hover:text-[#1d5287]',
            ].join(' ')}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* setas de rotação 360° */}
      <div className="pointer-events-auto flex items-center gap-6">
        <button
          type="button"
          title="Girar para a esquerda"
          onClick={() => onRotate(-Math.PI / 6)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <CurvedArrow dir="left" />
        </button>
        <button
          type="button"
          title="Girar para a direita"
          onClick={() => onRotate(Math.PI / 6)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <CurvedArrow dir="right" />
        </button>
      </div>
    </div>
  );
}
