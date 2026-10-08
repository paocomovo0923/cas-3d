'use client';

/**
 * CAS — Canto superior esquerdo estilo The Sims 4:
 * cartão "Hello, My Name Is..." + painel azul com hexágonos de aspiração/
 * traços, dado aleatório, idades e estilo de caminhada.
 */
import {
  Baby,
  Blocks,
  Dices,
  GraduationCap,
  Hourglass,
  Sparkles,
  User,
  Waves,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Hexagon, HexIcon } from './hex';
import { AGES, ASPIRATIONS, TRAITS, WALK_STYLES } from '@/lib/cas/data';
import type { AgeId, Gender, ProfileData } from '@/lib/cas/types';

const AGE_ICONS: Record<AgeId, typeof Baby> = {
  bebe: Baby,
  crianca: Blocks,
  adolescente: GraduationCap,
  jovem_adulto: Sparkles,
  adulto: User,
  idoso: Hourglass,
};

interface IdentityStackProps {
  profile: ProfileData;
  gender: Gender;
  onChange: (patch: Partial<ProfileData>) => void;
  onGender: (g: Gender) => void;
  onWalkStyle: (id: string) => void;
  onRandomTraits: () => void;
}

export function IdentityStack({
  profile,
  gender,
  onChange,
  onGender,
  onWalkStyle,
  onRandomTraits,
}: IdentityStackProps) {
  const aspiration =
    ASPIRATIONS.find((a) => a.id === profile.aspiration) ?? ASPIRATIONS[0];

  const cycleAspiration = () => {
    const idx = ASPIRATIONS.findIndex((a) => a.id === profile.aspiration);
    onChange({ aspiration: ASPIRATIONS[(idx + 1) % ASPIRATIONS.length].id });
  };

  const cycleTrait = (slot: number) => {
    const current = [...profile.traits];
    const currentTrait = TRAITS.find((t) => t.id === current[slot]);
    let idx = currentTrait ? TRAITS.findIndex((t) => t.id === currentTrait.id) : -1;
    let next: string;
    let guard = 0;
    do {
      idx = (idx + 1) % TRAITS.length;
      next = TRAITS[idx].id;
      guard++;
    } while (guard < 30 && current.includes(next) && next !== currentTrait?.id);
    if (current.includes(next)) {
      idx = (idx + 1) % TRAITS.length;
      next = TRAITS[idx].id;
    }
    current[slot] = next;
    onChange({ traits: current });
  };

  return (
    <div className="pointer-events-auto absolute left-3 top-3 z-20 hidden w-[286px] flex-col gap-2 lg:flex">
      {/* -------- Cartão do nome -------- */}
      <div className="rounded-2xl border border-white/70 bg-white/95 p-2.5 shadow-[0_6px_18px_rgba(9,52,90,0.30)]">
        <p className="mb-1 text-[10.5px] font-bold italic tracking-wide text-[#1d5287]">
          Hello, My Name Is…
        </p>
        <div className="flex items-center gap-1.5">
          <input
            value={profile.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Nome"
            aria-label="Nome do Sim"
            className="h-8 min-w-0 flex-1 rounded-lg border-0 bg-[#e2f2ff] px-2.5 text-[13px] font-bold text-[#1d5287] outline-none ring-1 ring-[#bcdcf5] transition placeholder:font-medium placeholder:text-[#6d94b5] focus:ring-2 focus:ring-[#3fae52]"
          />
          <input
            value={profile.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Sobrenome"
            aria-label="Sobrenome do Sim"
            className="h-8 min-w-0 flex-1 rounded-lg border-0 bg-[#e2f2ff] px-2.5 text-[13px] font-bold text-[#1d5287] outline-none ring-1 ring-[#bcdcf5] transition placeholder:font-medium placeholder:text-[#6d94b5] focus:ring-2 focus:ring-[#3fae52]"
          />
          {/* gênero */}
          <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#e2f2ff] p-0.5 ring-1 ring-[#bcdcf5]">
            {(['F', 'M'] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                title={g === 'F' ? 'Feminino' : 'Masculino'}
                onClick={() => onGender(g)}
                className={[
                  'flex h-6.5 w-6.5 items-center justify-center rounded-full text-[13px] font-black leading-none transition-all',
                  gender === g
                    ? 'bg-[#3fae52] text-white shadow'
                    : 'text-[#6d94b5] hover:text-[#1d5287]',
                ].join(' ')}
              >
                {g === 'F' ? '♀' : '♂'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* -------- Painel azul: aspiração, traços, idades, caminhada -------- */}
      <div className="rounded-2xl border border-white/25 bg-[#1d5287]/92 p-2.5 shadow-[0_6px_18px_rgba(9,52,90,0.35)] backdrop-blur-md">
        {/* hexágonos */}
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <Hexagon
              size={54}
              primary
              onClick={cycleAspiration}
              title={`Aspiração: ${aspiration.label} — clique para trocar`}
            >
              <HexIcon icon={aspiration.icon} size={23} />
            </Hexagon>
            <span className="max-w-[66px] truncate text-center text-[8.5px] font-bold uppercase tracking-wide text-[#a8cdf0]">
              {aspiration.label}
            </span>
          </div>

          <div className="flex flex-1 flex-wrap items-start justify-center gap-x-1.5 gap-y-0.5 pt-1">
            {profile.traits.map((t, slot) => {
              const trait = TRAITS.find((x) => x.id === t) ?? TRAITS[0];
              return (
                <div key={slot} className="flex w-[42px] flex-col items-center gap-0.5">
                  <Hexagon
                    size={38}
                    active
                    onClick={() => cycleTrait(slot)}
                    title={`Traço: ${trait.label} — clique para trocar`}
                  >
                    <HexIcon icon={trait.icon} size={15} />
                  </Hexagon>
                  <span className="w-full truncate text-center text-[8px] font-semibold text-[#cfe4f7]">
                    {trait.label}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onRandomTraits}
            title="Randomize Traits — sortear aspiração e traços"
            className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full bg-white/15 text-white transition hover:rotate-12 hover:bg-white/30"
          >
            <Dices size={17} />
          </button>
        </div>

        {/* idades */}
        <div className="mt-2.5 grid grid-cols-6 gap-1">
          {AGES.map((age) => {
            const Icon = AGE_ICONS[age.id];
            const active = profile.age === age.id;
            return (
              <button
                key={age.id}
                type="button"
                title={age.label}
                onClick={() => onChange({ age: age.id })}
                className={[
                  'flex h-7.5 items-center justify-center rounded-md transition-all',
                  active
                    ? 'bg-white text-[#1d5287] shadow'
                    : 'bg-white/12 text-[#bcdcf5] hover:bg-white/25 hover:text-white',
                ].join(' ')}
              >
                <Icon size={14} strokeWidth={2.2} />
              </button>
            );
          })}
        </div>

        {/* estilo de caminhada */}
        <Select
          value={profile.walkStyle}
          onValueChange={(v) => {
            onChange({ walkStyle: v });
            onWalkStyle(v);
          }}
        >
          <SelectTrigger className="mt-2 h-7.5 w-full rounded-md border-0 bg-white/12 px-2 text-[11px] font-semibold text-[#eaf4fd] shadow-none ring-0 outline-none hover:bg-white/20 focus:ring-1 focus:ring-white/40 data-[placeholder]:text-[#bcdcf5] [&>svg]:text-[#bcdcf5] [&_[data-slot=select-value]]:truncate">
            <Waves size={12} className="mr-1 shrink-0 text-[#8fd6a4]" />
            <SelectValue placeholder="Estilo de caminhada" />
          </SelectTrigger>
          <SelectContent>
            {WALK_STYLES.map((ws) => (
              <SelectItem key={ws.id} value={ws.id} className="text-[12px]">
                {ws.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
