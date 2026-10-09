'use client';

/**
 * CAS — Widget flutuante à esquerda (estilo Sims 4):
 * sliders verticais de tom de voz e velocidade + zoom da câmera + teste de voz.
 */
import { useCallback, useRef } from 'react';
import { Minus, Plus, Volume2 } from 'lucide-react';

interface VSliderProps {
  value: number; // 0..1
  onChange: (v: number) => void;
  label: string;
  icon: React.ReactNode;
}

/** slider vertical customizado (arraste de ponteiro) */
function VSlider({ value, onChange, label, icon }: VSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const apply = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const v = 1 - (clientY - r.top) / r.height;
      onChange(Math.min(1, Math.max(0, v)));
    },
    [onChange]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    apply(e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 1) apply(e.clientY);
  };

  return (
    <div className="flex flex-col items-center gap-1" title={label}>
      <span className="text-[#1d5287]">{icon}</span>
      <div
        ref={trackRef}
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') onChange(Math.min(1, value + 0.05));
          if (e.key === 'ArrowDown') onChange(Math.max(0, value - 0.05));
        }}
        className="relative h-[86px] w-[10px] cursor-pointer rounded-full bg-[#cfe3f2] shadow-inner ring-1 ring-[#b3d2e8] outline-none focus-visible:ring-2 focus-visible:ring-[#3fae52]"
      >
        <div
          className="absolute inset-x-[2px] bottom-[2px] rounded-full bg-gradient-to-t from-[#3fae52] to-[#5ec971]"
          style={{ height: `calc(${(value * 100).toFixed(1)}% - 2px)` }}
        />
        <div
          className="absolute left-1/2 h-[14px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8fb8d8] bg-white shadow-md"
          style={{ top: `${((1 - value) * 100).toFixed(1)}%` }}
        />
      </div>
    </div>
  );
}

interface ProportionWidgetProps {
  voicePitch: number;
  onVoicePitch: (v: number) => void;
  walkSpeed: number;
  onWalkSpeed: (v: number) => void;
  onZoom: (delta: number) => void;
  onTestVoice: () => void;
}

export function ProportionWidget({
  voicePitch,
  onVoicePitch,
  walkSpeed,
  onWalkSpeed,
  onZoom,
  onTestVoice,
}: ProportionWidgetProps) {
  return (
    <div className="pointer-events-auto absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-2.5 rounded-2xl border border-white/70 bg-white/92 px-2 py-3 shadow-[0_6px_18px_rgba(9,52,90,0.30)] backdrop-blur-md lg:flex">
      <VSlider
        value={voicePitch}
        onChange={onVoicePitch}
        label="Tom de voz (grave ↔ agudo)"
        icon={<Volume2 size={14} strokeWidth={2.3} />}
      />
      <VSlider
        value={walkSpeed}
        onChange={onWalkSpeed}
        label="Velocidade da animação"
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M13 4 L7 13 H11 L9 20 L17 10 H12.5 L13 4 Z" fill="currentColor" stroke="none" />
          </svg>
        }
      />
      <div className="h-px w-7 bg-[#d5e6f3]" />
      <div className="flex flex-col gap-1">
        <button
          type="button"
          title="Aproximar câmera"
          onClick={() => onZoom(-0.35)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e2f2ff] text-[#1d5287] transition hover:bg-[#cde6f9] active:scale-90"
        >
          <Plus size={15} strokeWidth={2.6} />
        </button>
        <button
          type="button"
          title="Afastar câmera"
          onClick={() => onZoom(0.35)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e2f2ff] text-[#1d5287] transition hover:bg-[#cde6f9] active:scale-90"
        >
          <Minus size={15} strokeWidth={2.6} />
        </button>
      </div>
      <div className="h-px w-7 bg-[#d5e6f3]" />
      <button
        type="button"
        title="Ouvir a voz do Sim (Simlish)"
        onClick={onTestVoice}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#5ec971] to-[#3fae52] text-white shadow transition hover:brightness-110 active:scale-90"
      >
        <Volume2 size={15} strokeWidth={2.4} />
      </button>
    </div>
  );
}
