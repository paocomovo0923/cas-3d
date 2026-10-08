'use client';

/**
 * CAS — Barra superior: título, gênero, modos de câmera e aleatorizar
 */
import { Dices, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CameraMode, Gender } from '@/lib/cas/types';

interface TopBarProps {
  gender: Gender;
  mode: CameraMode;
  onGender: (g: Gender) => void;
  onMode: (m: CameraMode) => void;
  onRandomize: () => void;
}

export function TopBar({ gender, mode, onGender, onMode, onRandomize }: TopBarProps) {
  return (
    <div className="pointer-events-auto absolute inset-x-0 top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-white/50 bg-white/65 px-3 shadow-sm backdrop-blur-md sm:px-5">
      {/* Título com plumbob */}
      <div className="flex min-w-0 items-center gap-2.5">
        <svg width="22" height="30" viewBox="0 0 22 30" aria-hidden>
          <polygon
            points="11,0 22,11 11,30 0,11"
            fill="#41c257"
            stroke="#2c9c3f"
            strokeWidth="1"
          />
          <polygon points="11,0 22,11 11,30" fill="#2c9c3f" opacity="0.55" />
        </svg>
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-[15px] font-bold tracking-tight text-slate-800">
            Criar um Sim
          </h1>
          <p className="hidden text-[11px] text-slate-500 sm:block">
            CAS · Create-A-Sim 3D
          </p>
        </div>
      </div>

      {/* Gênero */}
      <div className="flex items-center rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
        {(['F', 'M'] as Gender[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onGender(g)}
            className={[
              'rounded-full px-3 py-1 text-xs font-semibold transition-all sm:px-4',
              gender === g
                ? 'bg-emerald-400 text-white shadow'
                : 'text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            {g === 'F' ? 'Feminino' : 'Masculino'}
          </button>
        ))}
      </div>

      {/* Modos de câmera + aleatorizar */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm">
          <button
            type="button"
            title="Full Body Mode — visão geral"
            onClick={() => onMode('fullbody')}
            className={[
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all sm:px-3',
              mode === 'fullbody'
                ? 'bg-emerald-400 text-white shadow'
                : 'text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            <User size={14} />
            <span className="hidden md:inline">Corpo Inteiro</span>
          </button>
          <button
            type="button"
            title="Detail Edit Mode — edição facial"
            onClick={() => onMode('detail')}
            className={[
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all sm:px-3',
              mode === 'detail'
                ? 'bg-emerald-400 text-white shadow'
                : 'text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            <Search size={14} />
            <span className="hidden md:inline">Detalhes</span>
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          title="Aleatorizar aparência e personalidade"
          onClick={onRandomize}
          className="rounded-full border-slate-200 bg-white/80 px-2.5 text-slate-700 hover:bg-emerald-50"
        >
          <Dices size={15} />
          <span className="hidden lg:inline">Aleatório</span>
        </Button>
      </div>
    </div>
  );
}
