'use client';

/**
 * CAS — Painel direito estilo The Sims 4 ("Daily Outfit"):
 * cabeçalho com título, linha de abas por categoria, barra azul clara com o
 * tipo de item atual, grade 2×N de miniaturas SVG e paleta de swatches.
 */
import { Check } from 'lucide-react';
import {
  Glasses,
  Gem,
  Layers,
  PersonStanding,
  Scissors,
  Shirt,
  type LucideIcon,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GarmentThumb } from '../GarmentThumb';
import { CATALOG } from '@/lib/cas/catalog';
import type { CatalogCategory, CatalogItem, CharacterLook } from '@/lib/cas/types';

const CATEGORY_ICONS: Record<CatalogCategory, LucideIcon> = {
  cabelos: Scissors,
  tops: Shirt,
  baixos: Layers,
  corpo_inteiro: PersonStanding,
  acessorios: Gem,
  oculos: Glasses,
};

const ITEM_ICON: Record<CatalogCategory, LucideIcon> = CATEGORY_ICONS;

const EMPTY_IDS = new Set(['nenhum', 'careca', 'sem_top', 'sem_oculos', 'sem_acessorio']);

interface OutfitPanelProps {
  look: CharacterLook;
  category: CatalogCategory;
  onCategory: (c: CatalogCategory) => void;
  onChange: (patch: Partial<CharacterLook>) => void;
}

export function OutfitPanel({ look, category, onCategory, onChange }: OutfitPanelProps) {
  const def = CATALOG.find((c) => c.id === category)!;

  const currentItemId = (() => {
    switch (category) {
      case 'cabelos': return look.hair;
      case 'tops': return look.top;
      case 'baixos': return look.bottom;
      case 'corpo_inteiro': return look.fullBody;
      case 'acessorios': return look.accessory;
      case 'oculos': return look.glasses;
    }
  })();

  const currentColor = (() => {
    switch (category) {
      case 'cabelos': return look.hairColor;
      case 'tops': return look.topColor;
      case 'baixos': return look.bottomColor;
      case 'corpo_inteiro': return look.fullBodyColor;
      case 'acessorios': return look.accessoryColor;
      case 'oculos': return look.glassesColor;
    }
  })();

  const selectItem = (itemId: string) => {
    switch (category) {
      case 'cabelos': onChange({ hair: itemId }); break;
      case 'tops': onChange({ top: itemId }); break;
      case 'baixos': onChange({ bottom: itemId }); break;
      case 'corpo_inteiro': onChange({ fullBody: itemId }); break;
      case 'acessorios': onChange({ accessory: itemId }); break;
      case 'oculos': onChange({ glasses: itemId }); break;
    }
  };

  const setColor = (hex: string) => {
    switch (category) {
      case 'cabelos': onChange({ hairColor: hex }); break;
      case 'tops': onChange({ topColor: hex }); break;
      case 'baixos': onChange({ bottomColor: hex }); break;
      case 'corpo_inteiro': onChange({ fullBodyColor: hex }); break;
      case 'acessorios': onChange({ accessoryColor: hex }); break;
      case 'oculos': onChange({ glassesColor: hex }); break;
    }
  };

  const currentItem: CatalogItem | undefined = def.items.find(
    (i) => i.id === currentItemId
  );

  const TitleIcon = CATEGORY_ICONS[category];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_8px_24px_rgba(9,52,90,0.35)] backdrop-blur-md">
      {/* cabeçalho */}
      <header className="flex items-center justify-center gap-1.5 border-b border-[#e4eef6] px-3 py-2.5">
        <TitleIcon size={15} className="text-[#1d5287]" />
        <h2 className="text-[14px] font-extrabold tracking-tight text-[#1d5287]">
          {def.label}
        </h2>
      </header>

      {/* abas de categoria */}
      <div className="flex items-center justify-center gap-1 px-2.5 pt-2">
        {CATALOG.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id];
          const active = cat.id === category;
          return (
            <button
              key={cat.id}
              type="button"
              title={cat.label}
              onClick={() => onCategory(cat.id)}
              className={[
                'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                active
                  ? 'bg-[#3fae52] text-white shadow'
                  : 'bg-[#e2f2ff] text-[#5c84a8] hover:bg-[#cde6f9] hover:text-[#1d5287]',
              ].join(' ')}
            >
              <Icon size={15} strokeWidth={2.2} />
            </button>
          );
        })}
      </div>

      {/* barra azul clara: tipo de item atual */}
      <div className="px-2.5 pt-2">
        <Select value={currentItemId} onValueChange={selectItem}>
          <SelectTrigger
            aria-label={`Tipo de ${def.label}`}
            className="h-8 w-full rounded-lg border-0 bg-[#e2f2ff] px-2.5 text-[12px] font-bold text-[#1d5287] shadow-none ring-0 outline-none hover:bg-[#d3eafc] focus:ring-2 focus:ring-[#3fae52] [&>svg]:text-[#1d5287]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {def.items.map((item) => (
              <SelectItem key={item.id} value={item.id} className="text-[12px] font-semibold">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* grade de itens */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="grid grid-cols-2 gap-2 p-2.5">
          {def.items.map((item) => {
            const active = currentItemId === item.id;
            const thumbColor = item.colors[0]?.hex ?? '#cccccc';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectItem(item.id)}
                title={item.label}
                aria-pressed={active}
                className={[
                  'group relative flex flex-col items-center gap-0.5 rounded-xl border-2 p-1.5 pb-1 transition-all',
                  active
                    ? 'border-[#3fae52] bg-[#f0fbf2] shadow-sm'
                    : 'border-[#e4edf4] bg-white hover:border-[#9fd8b4] hover:shadow-sm active:scale-[0.97]',
                ].join(' ')}
              >
                <span className="flex h-[62px] w-full items-center justify-center rounded-lg bg-gradient-to-b from-[#f6fbff] to-[#e9f3fa]">
                  <GarmentThumb
                    itemId={item.id}
                    color={EMPTY_IDS.has(item.id) ? currentColor : thumbColor}
                    size={44}
                  />
                </span>
                <span className="w-full truncate text-center text-[10px] font-bold text-[#41709c]">
                  {item.label}
                </span>
                {active && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3fae52] text-white shadow ring-2 ring-white">
                    <Check size={12} strokeWidth={3.2} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* swatches */}
      <footer className="border-t border-[#e4eef6] px-3 py-2.5">
        <div className="mb-1.5 flex items-center gap-1">
          <ItemGlyph icon={ITEM_ICON[category]} />
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-[#7ba2c4]">
            Cores · {currentItem?.label ?? def.label}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {currentItem?.colors.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              onClick={() => setColor(c.hex)}
              style={{ backgroundColor: c.hex }}
              aria-label={`Cor ${c.label}`}
              className={[
                'h-[22px] w-[22px] rounded-full border transition-transform hover:scale-110',
                currentColor === c.hex
                  ? 'border-[#3fae52] ring-2 ring-[#9fd8b4]'
                  : 'border-black/10 shadow-sm',
              ].join(' ')}
            />
          ))}
        </div>
      </footer>
    </div>
  );
}

function ItemGlyph({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e2f2ff]">
      <Icon size={10} className="text-[#1d5287]" />
    </span>
  );
}
