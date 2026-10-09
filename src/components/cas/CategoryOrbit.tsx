'use client';

/**
 * CAS — Menu circular de categorias em arco (assinatura visual do CAS do
 * The Sims 4): círculos brancos flutuando à direita do personagem, ativo verde.
 */
import {
  Glasses,
  Gem,
  Layers,
  PersonStanding,
  Scissors,
  Shirt,
  SmilePlus,
  type LucideIcon,
} from 'lucide-react';
import type { CameraMode, CatalogCategory } from '@/lib/cas/types';

interface OrbitItem {
  id: CatalogCategory | 'rosto';
  label: string;
  icon: LucideIcon;
}

const ORBIT_ITEMS: OrbitItem[] = [
  { id: 'rosto', label: 'Rosto & Pele', icon: SmilePlus },
  { id: 'cabelos', label: 'Cabelos', icon: Scissors },
  { id: 'tops', label: 'Partes de Cima', icon: Shirt },
  { id: 'baixos', label: 'Partes de Baixo', icon: Layers },
  { id: 'corpo_inteiro', label: 'Corpo Inteiro', icon: PersonStanding },
  { id: 'acessorios', label: 'Acessórios', icon: Gem },
  { id: 'oculos', label: 'Óculos', icon: Glasses },
];

interface CategoryOrbitProps {
  mode: CameraMode;
  activeCategory: CatalogCategory;
  onSelect: (id: CatalogCategory | 'rosto') => void;
}

/** deslocamento horizontal do arco (meio mais próximo do personagem) */
const arcX = (i: number, total: number) =>
  -Math.sin(((i - (total - 1) / 2) / ((total - 1) / 2)) * (Math.PI / 2)) * 30;

export function CategoryOrbit({ mode, activeCategory, onSelect }: CategoryOrbitProps) {
  return (
    <nav
      aria-label="Categorias de vestuário"
      className="pointer-events-auto absolute right-[318px] top-1/2 z-20 hidden -translate-y-1/2 lg:block"
    >
      <div className="relative h-[430px] w-[64px]">
        {ORBIT_ITEMS.map((item, i) => {
          const active = item.id === 'rosto' ? mode === 'detail' : mode === 'fullbody' && activeCategory === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              aria-pressed={active}
              onClick={() => onSelect(item.id)}
              style={{ top: i * 62, transform: `translateX(${arcX(i, ORBIT_ITEMS.length)}px)` }}
              className="group absolute left-0"
            >
              <span
                className={[
                  'flex items-center justify-center rounded-full shadow-[0_4px_14px_rgba(9,52,90,0.35)] transition-all duration-150',
                  active
                    ? 'h-[54px] w-[54px] bg-[#3fae52] ring-[3px] ring-white/85'
                    : 'h-[48px] w-[48px] bg-white/95 group-hover:scale-110 group-active:scale-95',
                ].join(' ')}
              >
                <Icon
                  size={active ? 24 : 22}
                  strokeWidth={2.1}
                  className={active ? 'text-white' : 'text-[#1d5287]'}
                />
              </span>
              <span className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#1d5287]/95 px-2.5 py-1 text-[10.5px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
