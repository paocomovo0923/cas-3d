'use client';

/**
 * CAS — Painel de Edição Facial (Detail Edit Mode)
 * Sliders reativos para os morphTargetInfluences nomeados na spec.
 */
import { MousePointer2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { MORPH_DEFS } from '@/lib/cas/morphs';
import { EYE_COLORS, SKIN_TONES } from '@/lib/cas/catalog';
import type { MorphValues } from '@/lib/cas/types';

const GROUP_LABELS: Record<string, string> = {
  cabeca: 'Estrutura da Cabeça',
  rosto: 'Face e Queixo',
  nariz: 'Nariz',
  orelhas: 'Orelhas',
};

const GROUP_ORDER = ['cabeca', 'rosto', 'nariz', 'orelhas'] as const;

interface FacePanelProps {
  morphs: MorphValues;
  onChange: (key: string, value: number) => void;
  skinTone?: string;
  eyeColor?: string;
  onSkinTone?: (hex: string) => void;
  onEyeColor?: (hex: string) => void;
}

export function FacePanel({
  morphs,
  onChange,
  skinTone,
  eyeColor,
  onSkinTone,
  onEyeColor,
}: FacePanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#bcdcf5] bg-[#e2f2ff] px-3 py-2">
        <MousePointer2 size={14} className="shrink-0 text-[#1d5287]" />
        <p className="text-[11px] font-semibold leading-snug text-[#1d5287]">
          Modo Detalhes: arraste os pontos verdes no rosto ou use os sliders
          abaixo.
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1 pr-2">
        <div className="flex flex-col gap-4 pb-2">
          {GROUP_ORDER.map((group) => (
            <div key={group}>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {GROUP_LABELS[group]}
              </h3>
              <div className="flex flex-col gap-2.5">
                {MORPH_DEFS.filter((d) => d.group === group).map((def) => {
                  const value = morphs[def.key] ?? def.default;
                  const min = def.range === 'bipolar' ? -1 : 0;
                  return (
                    <div key={def.key}>
                      <div className="mb-0.5 flex items-center justify-between">
                        <label
                          htmlFor={`slider-${def.key}`}
                          className="text-xs font-medium text-slate-600"
                        >
                          {def.label}
                        </label>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                          {value >= 0 ? '+' : ''}
                          {value.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        id={`slider-${def.key}`}
                        value={[value]}
                        min={min}
                        max={1}
                        step={0.01}
                        onValueChange={([v]) => onChange(def.key, v)}
                        aria-label={def.label}
                        className="cursor-pointer [&_[data-slot=slider-range]]:bg-emerald-400 [&_[data-slot=slider-thumb]]:border-emerald-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Tom de Pele */}
          {skinTone && onSkinTone && (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tom de Pele
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {SKIN_TONES.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => onSkinTone(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={[
                      'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                      skinTone === c.hex
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-white shadow',
                    ].join(' ')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cor dos Olhos */}
          {eyeColor && onEyeColor && (
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cor dos Olhos
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {EYE_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => onEyeColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={[
                      'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                      eyeColor === c.hex
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-white shadow',
                    ].join(' ')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
