'use client';

/**
 * CAS — Painel superior esquerdo: Perfil & Identidade
 * Nome, idade, estilo de caminhada, tom de voz, aspiração e traços.
 */
import { Baby, Blocks, Dices, GraduationCap, Hourglass, Sparkles, User, Volume1, Volume2, Waves } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Hexagon, HexIcon } from '../hex';
import { AGES, ASPIRATIONS, TRAITS, WALK_STYLES } from '@/lib/cas/data';
import { SKIN_TONES, EYE_COLORS } from '@/lib/cas/catalog';
import type { AgeId, ProfileData } from '@/lib/cas/types';

const AGE_ICONS: Record<AgeId, typeof Baby> = {
  bebe: Baby,
  crianca: Blocks,
  adolescente: GraduationCap,
  jovem_adulto: Sparkles,
  adulto: User,
  idoso: Hourglass,
};

interface ProfilePanelProps {
  profile: ProfileData;
  skinTone: string;
  eyeColor: string;
  onChange: (p: Partial<ProfileData>) => void;
  onSkinTone: (hex: string) => void;
  onEyeColor: (hex: string) => void;
  onWalkStyle: (id: string) => void;
  onTestVoice: () => void;
  onRandomTraits: () => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </h3>
  );
}

export function ProfilePanel({
  profile,
  skinTone,
  eyeColor,
  onChange,
  onSkinTone,
  onEyeColor,
  onWalkStyle,
  onTestVoice,
  onRandomTraits,
}: ProfilePanelProps) {
  const aspiration = ASPIRATIONS.find((a) => a.id === profile.aspiration) ?? ASPIRATIONS[0];

  const cycleAspiration = () => {
    const idx = ASPIRATIONS.findIndex((a) => a.id === profile.aspiration);
    const next = ASPIRATIONS[(idx + 1) % ASPIRATIONS.length];
    onChange({ aspiration: next.id });
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
    // se o próximo já está em outro slot, avança mais um
    if (current.includes(next)) {
      idx = (idx + 1) % TRAITS.length;
      next = TRAITS[idx].id;
    }
    current[slot] = next;
    onChange({ traits: current });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Nome e Sobrenome — "Hello, My Name Is..." */}
      <div>
        <div className="mb-2 rounded-xl rounded-bl-sm border border-emerald-200 bg-emerald-50/80 px-3 py-2">
          <p className="text-[11px] font-semibold italic text-emerald-700">
            Hello, My Name Is...
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nome"
            value={profile.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="h-9 rounded-lg border-slate-200 bg-white/90 text-sm"
            aria-label="Nome"
          />
          <Input
            placeholder="Sobrenome"
            value={profile.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className="h-9 rounded-lg border-slate-200 bg-white/90 text-sm"
            aria-label="Sobrenome"
          />
        </div>
      </div>

      {/* Idade */}
      <div>
        <SectionTitle>Idade</SectionTitle>
        <div className="grid grid-cols-6 gap-1">
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
                  'flex h-10 items-center justify-center rounded-lg border transition-all',
                  active
                    ? 'border-emerald-400 bg-emerald-100 text-emerald-700 shadow-inner'
                    : 'border-slate-200 bg-white/85 text-slate-400 hover:border-emerald-300 hover:text-emerald-600',
                ].join(' ')}
              >
                <Icon size={17} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Estilo de Caminhada */}
      <div>
        <SectionTitle>Estilo de Caminhada</SectionTitle>
        <Select
          value={profile.walkStyle}
          onValueChange={(v) => {
            onChange({ walkStyle: v });
            onWalkStyle(v);
          }}
        >
          <SelectTrigger className="h-9 w-full rounded-lg border-slate-200 bg-white/90 text-sm">
            <Waves size={14} className="mr-1 text-emerald-500" />
            <SelectValue placeholder="Estilo" />
          </SelectTrigger>
          <SelectContent>
            {WALK_STYLES.map((ws) => (
              <SelectItem key={ws.id} value={ws.id}>
                {ws.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tom de Voz */}
      <div>
        <SectionTitle>Tom de Voz</SectionTitle>
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white/85 px-3 py-2.5">
          <Volume1 size={15} className="shrink-0 text-slate-400" />
          <Slider
            value={[profile.voicePitch]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([v]) => onChange({ voicePitch: v })}
            aria-label="Tom de voz entre grave e agudo"
            className="flex-1 [&_[data-slot=slider-range]]:bg-emerald-400 [&_[data-slot=slider-thumb]]:border-emerald-500"
          />
          <Volume2 size={15} className="shrink-0 text-slate-400" />
          <button
            type="button"
            onClick={onTestVoice}
            title="Ouvir voz do Sim"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200"
          >
            <Volume2 size={14} />
          </button>
        </div>
      </div>

      {/* Aspiração e Traços */}
      <div>
        <SectionTitle>Aspiração &amp; Traços</SectionTitle>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/85 p-3">
          <div className="flex flex-col items-center gap-1">
            <Hexagon size={58} primary onClick={cycleAspiration} title={`Aspiração: ${aspiration.label} (clique para trocar)`}>
              <HexIcon icon={aspiration.icon} size={24} />
            </Hexagon>
            <span className="max-w-[70px] truncate text-center text-[10px] font-semibold text-slate-500">
              {aspiration.label}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-start gap-1.5">
              {profile.traits.map((t, slot) => {
                const trait = TRAITS.find((x) => x.id === t) ?? TRAITS[0];
                return (
                  <div key={slot} className="flex flex-col items-center gap-1">
                    <Hexagon
                      size={44}
                      active
                      onClick={() => cycleTrait(slot)}
                      title={`Traço: ${trait.label} (clique para trocar)`}
                    >
                      <HexIcon icon={trait.icon} size={17} />
                    </Hexagon>
                    <span className="max-w-[54px] truncate text-center text-[9px] font-medium text-slate-500">
                      {trait.label}
                    </span>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={onRandomTraits}
                title="Randomize Traits — sortear traços"
                className="ml-auto flex h-9 w-9 items-center justify-center self-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:rotate-12 hover:bg-emerald-100"
              >
                <Dices size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tom de Pele */}
      <div>
        <SectionTitle>Tom de Pele</SectionTitle>
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
                skinTone === c.hex ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-white shadow',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* Cor dos Olhos */}
      <div>
        <SectionTitle>Cor dos Olhos</SectionTitle>
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
                eyeColor === c.hex ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-white shadow',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
