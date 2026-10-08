'use client';

/**
 * CAS — Painel Direito: Catálogo de roupas e aparência
 * Categorias + grade de amostras (grid) + paleta de cores (swatches).
 */
import { useState } from 'react';
import { Gem, Glasses, Layers, PersonStanding, Scissors, Shirt, type LucideIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATALOG } from '@/lib/cas/catalog';
import type { CatalogCategory, CharacterLook } from '@/lib/cas/types';

const CATEGORY_ICONS: Record<CatalogCategory, LucideIcon> = {
  cabelos: Scissors,
  tops: Shirt,
  baixos: Layers,
  corpo_inteiro: PersonStanding,
  acessorios: Gem,
  oculos: Glasses,
};

interface CatalogPanelProps {
  look: CharacterLook;
  onChange: (patch: Partial<CharacterLook>) => void;
}

export function CatalogPanel({ look, onChange }: CatalogPanelProps) {
  const [category, setCategory] = useState<CatalogCategory>('cabelos');
  const def = CATALOG.find((c) => c.id === category)!;

  const currentItemId = (() => {
    switch (category) {
      case 'cabelos':
        return look.hair;
      case 'tops':
        return look.top;
      case 'baixos':
        return look.bottom;
      case 'corpo_inteiro':
        return look.fullBody;
      case 'acessorios':
        return look.accessory;
      case 'oculos':
        return look.glasses;
    }
  })();

  const selectItem = (itemId: string) => {
    switch (category) {
      case 'cabelos':
        onChange({ hair: itemId });
        break;
      case 'tops':
        onChange({ top: itemId });
        break;
      case 'baixos':
        onChange({ bottom: itemId });
        break;
      case 'corpo_inteiro':
        onChange({ fullBody: itemId });
        break;
      case 'acessorios':
        onChange({ accessory: itemId });
        break;
      case 'oculos':
        onChange({ glasses: itemId });
        break;
    }
  };

  const currentColor = (() => {
    switch (category) {
      case 'cabelos':
        return look.hairColor;
      case 'tops':
        return look.topColor;
      case 'baixos':
        return look.bottomColor;
      case 'corpo_inteiro':
        return look.fullBodyColor;
      case 'acessorios':
        return look.accessoryColor;
      case 'oculos':
        return look.glassesColor;
    }
  })();

  const setColor = (hex: string) => {
    switch (category) {
      case 'cabelos':
        onChange({ hairColor: hex });
        break;
      case 'tops':
        onChange({ topColor: hex });
        break;
      case 'baixos':
        onChange({ bottomColor: hex });
        break;
      case 'corpo_inteiro':
        onChange({ fullBodyColor: hex });
        break;
      case 'acessorios':
        onChange({ accessoryColor: hex });
        break;
      case 'oculos':
        onChange({ glassesColor: hex });
        break;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Categorias */}
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {CATALOG.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id];
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={[
                'flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-semibold leading-tight transition-all',
                active
                  ? 'border-emerald-400 bg-emerald-100 text-emerald-800 shadow-sm'
                  : 'border-slate-200 bg-white/85 text-slate-500 hover:border-emerald-300 hover:text-emerald-700',
              ].join(' ')}
            >
              <Icon size={16} />
              <span className="text-center">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grade de amostras */}
      <ScrollArea className="min-h-0 flex-1 pr-1">
        <div className="grid grid-cols-2 gap-2 pr-1">
          {def.items.map((item) => {
            const active = currentItemId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectItem(item.id)}
                className={[
                  'group relative flex h-[74px] flex-col items-center justify-center gap-1 rounded-xl border-2 p-1.5 transition-all',
                  active
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-white/85 hover:border-emerald-300',
                ].join(' ')}
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
                  {item.id !== 'nenhum' &&
                  item.id !== 'sem_top' &&
                  item.id !== 'sem_oculos' &&
                  item.id !== 'sem_acessorio' &&
                  item.id !== 'careca' ? (
                    <span
                      className="h-6 w-6 rounded-md border border-black/10"
                      style={{ backgroundColor: currentColor }}
                    />
                  ) : (
                    <span className="text-lg font-bold leading-none text-slate-300">
                      ∅
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center text-[10.5px] font-semibold text-slate-600">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Paleta de cores (swatches) */}
      <div className="mt-3 border-t border-slate-200 pt-3">
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Cores · {def.label}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {def.items.find((i) => i.id === currentItemId)?.colors.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              onClick={() => setColor(c.hex)}
              style={{ backgroundColor: c.hex }}
              className={[
                'h-[26px] w-[26px] rounded-full border-2 transition-transform hover:scale-110',
                currentColor === c.hex
                  ? 'border-emerald-500 ring-2 ring-emerald-200'
                  : 'border-white shadow',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
