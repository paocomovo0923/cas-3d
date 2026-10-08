'use client';

/**
 * CAS — Create-A-Sim (Create-A-Sim) 3D
 * Aplicação principal: canvas Three.js + interface estilo The Sims 4.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, Shirt, UserRound } from 'lucide-react';
import { TopBar } from './panels/TopBar';
import { ProfilePanel } from './panels/ProfilePanel';
import { FacePanel } from './panels/FacePanel';
import { CatalogPanel } from './panels/CatalogPanel';
import { BottomBar } from './panels/BottomBar';
import { CASEngine } from '@/lib/cas/engine';
import { defaultMorphValues, MORPH_DEFS } from '@/lib/cas/morphs';
import { ASPIRATIONS, randomPick, TRAITS, WALK_STYLES } from '@/lib/cas/data';
import { CATALOG } from '@/lib/cas/catalog';
import { playSimlishVoice } from '@/lib/cas/voice';
import type {
  CameraMode,
  CharacterLook,
  Gender,
  MorphValues,
  ProfileData,
} from '@/lib/cas/types';

const randomHex = (colors: { hex: string }[]) =>
  colors[Math.floor(Math.random() * colors.length)].hex;

const DEFAULT_LOOK: CharacterLook = {
  hair: 'curto',
  hairColor: '#4a2f23',
  top: 'camiseta',
  topColor: '#45a09e',
  bottom: 'calca',
  bottomColor: '#2d2f33',
  fullBody: 'nenhum',
  fullBodyColor: '#d97ba6',
  accessory: 'sem_acessorio',
  accessoryColor: '#e8c33a',
  glasses: 'sem_oculos',
  glassesColor: '#2d2f33',
  skinTone: '#f0c8a0',
  eyeColor: '#5b3a1e',
};

const DEFAULT_PROFILE: ProfileData = {
  firstName: 'Bella',
  lastName: 'Goth',
  age: 'jovem_adulto',
  walkStyle: 'padrao',
  voicePitch: 0.62,
  aspiration: 'fama',
  traits: ['ativo', 'genial', 'romantico'],
};

export default function CASApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CASEngine | null>(null);

  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, label: 'Iniciando…' });
  const [gender, setGender] = useState<Gender>('F');
  const [mode, setMode] = useState<CameraMode>('fullbody');
  const [morphs, setMorphs] = useState<MorphValues>(() => defaultMorphValues());
  const [look, setLook] = useState<CharacterLook>(DEFAULT_LOOK);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [anim, setAnim] = useState('idle');
  const [extras, setExtras] = useState<string[]>([]);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'none' | 'perfil' | 'catalogo'>('none');

  /* ----------------------- inicialização do motor ----------------------- */
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new CASEngine(canvasRef.current, {
      onProgress: (pct, label) => setProgress({ pct, label }),
      onReady: () => {
        setReady(true);
        setExtras(engine.availableExtras());
      },
      onMorphChange: (key, value) =>
        setMorphs((prev) => ({ ...prev, [key]: value })),
      onHoverHotspot: (label) => setHoverLabel(label),
    });
    engineRef.current = engine;
    engine.init().catch((err) => {
      console.error('Falha ao iniciar o motor 3D:', err);
      setProgress({ pct: 100, label: 'Erro ao carregar modelos 3D' });
    });
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  /* ----------------------- sincronização de estado ----------------------- */
  useEffect(() => {
    if (ready) engineRef.current?.setMorphs(morphs);
  }, [ready, morphs]);

  useEffect(() => {
    if (ready) engineRef.current?.applyLook(look);
  }, [ready, look]);

  useEffect(() => {
    if (ready) engineRef.current?.setAge(profile.age);
  }, [ready, profile.age]);

  useEffect(() => {
    if (ready) engineRef.current?.setCameraMode(mode);
  }, [ready, mode]);

  const handleGender = useCallback(
    (g: Gender) => {
      setGender(g);
      setAnim('idle');
      if (ready) {
        engineRef.current?.setGender(g);
        engineRef.current?.playAnim('idle');
      }
    },
    [ready]
  );

  const handlePlay = useCallback((id: string) => {
    setAnim(id);
    engineRef.current?.playAnim(id);
  }, []);

  const handleWalkStyle = useCallback((id: string) => {
    const style = WALK_STYLES.find((w) => w.id === id);
    if (!style) return;
    setAnim(style.clip[gender]);
    engineRef.current?.playAnim(style.clip[gender]);
  }, [gender]);

  const handleMorphChange = useCallback((key: string, value: number) => {
    setMorphs((prev) => ({ ...prev, [key]: value }));
    engineRef.current?.setMorph(key, value);
  }, []);

  const handleRandomTraits = useCallback(() => {
    setProfile((p) => ({
      ...p,
      traits: randomPick(TRAITS, 3).map((t) => t.id),
      aspiration: ASPIRATIONS[Math.floor(Math.random() * ASPIRATIONS.length)].id,
    }));
  }, []);

  const handleRandomize = useCallback(() => {
    // aparência
    const hairItem = randomPick(CATALOG[0].items.slice(1), 1)[0];
    const topItem = randomPick(CATALOG[1].items.slice(1), 1)[0];
    const bottomItem = randomPick(CATALOG[2].items.slice(1), 1)[0];
    const fullBodyItem = randomPick(CATALOG[3].items, 1)[0];
    const accItem = randomPick(CATALOG[4].items, 1)[0];
    const glassesItem = randomPick(CATALOG[5].items, 1)[0];
    const nextLook: CharacterLook = {
      hair: fullBodyItem.id === 'nenhum' ? hairItem.id : hairItem.id,
      hairColor: randomHex(CATALOG[0].items[1].colors),
      top: topItem.id,
      topColor: randomHex(CATALOG[1].items[1].colors),
      bottom: bottomItem.id,
      bottomColor: randomHex(CATALOG[2].items[1].colors),
      fullBody: fullBodyItem.id,
      fullBodyColor: randomHex(CATALOG[3].items[1]?.colors ?? CATALOG[1].items[1].colors),
      accessory: accItem.id,
      accessoryColor: randomHex(CATALOG[4].items[1].colors),
      glasses: glassesItem.id,
      glassesColor: randomHex(CATALOG[5].items[1].colors),
      skinTone: randomHex(CATALOG[0].items[1].colors.slice(0, 8)),
      eyeColor: randomHex(CATALOG[5].items[1].colors),
    };
    setLook(nextLook);
    // morphs aleatórios
    const nextMorphs: MorphValues = { ...defaultMorphValues() };
    for (const def of MORPH_DEFS) {
      nextMorphs[def.key] =
        def.range === 'bipolar'
          ? Math.round((Math.random() * 1.2 - 0.6) * 100) / 100
          : Math.round((0.2 + Math.random() * 0.6) * 100) / 100;
    }
    setMorphs(nextMorphs);
    // personalidade
    handleRandomTraits();
  }, [handleRandomTraits]);

  /* --------------------------------- UI --------------------------------- */
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-gradient-to-br from-sky-100 via-emerald-50 to-teal-100 text-slate-800">
      {/* blobs decorativos pastel */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-72 w-72 rounded-full bg-teal-100/40 blur-3xl" />
      </div>

      {/* Canvas 3D */}
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      <TopBar
        gender={gender}
        mode={mode}
        onGender={handleGender}
        onMode={setMode}
        onRandomize={handleRandomize}
      />

      {/* Painel esquerdo (desktop) */}
      <aside className="pointer-events-auto absolute bottom-24 left-3 top-[70px] z-20 hidden w-[340px] lg:block">
        <div className="flex h-full flex-col rounded-2xl border border-white/60 bg-white/72 p-4 shadow-xl backdrop-blur-md">
          {mode === 'fullbody' ? (
            <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
              <ProfilePanel
                profile={profile}
                skinTone={look.skinTone}
                eyeColor={look.eyeColor}
                onChange={(patch) => setProfile((p) => ({ ...p, ...patch }))}
                onSkinTone={(hex) => setLook((l) => ({ ...l, skinTone: hex }))}
                onEyeColor={(hex) => setLook((l) => ({ ...l, eyeColor: hex }))}
                onWalkStyle={handleWalkStyle}
                onTestVoice={() => playSimlishVoice(profile.voicePitch)}
                onRandomTraits={handleRandomTraits}
              />
            </div>
          ) : (
            <FacePanel morphs={morphs} onChange={handleMorphChange} />
          )}
        </div>
      </aside>

      {/* Painel direito (desktop) */}
      <aside className="pointer-events-auto absolute bottom-24 right-3 top-[70px] z-20 hidden w-[320px] lg:block">
        <div className="h-full rounded-2xl border border-white/60 bg-white/72 p-4 shadow-xl backdrop-blur-md">
          <CatalogPanel look={look} onChange={(patch) => setLook((l) => ({ ...l, ...patch }))} />
        </div>
      </aside>

      {/* Botões dos painéis (mobile) */}
      <div className="absolute bottom-20 left-3 z-30 flex flex-col gap-2 lg:hidden">
        <Sheet open={mobilePanel === 'perfil'} onOpenChange={(o) => setMobilePanel(o ? 'perfil' : 'none')}>
          <SheetTrigger asChild>
            <Button size="sm" className="rounded-full bg-white/85 text-slate-700 shadow-lg hover:bg-white">
              <UserRound size={15} className="mr-1" /> Perfil
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[330px] overflow-y-auto bg-white/95">
            <SheetTitle className="text-sm font-bold text-slate-700">Perfil &amp; Identidade</SheetTitle>
            {mode === 'fullbody' ? (
              <ProfilePanel
                profile={profile}
                skinTone={look.skinTone}
                eyeColor={look.eyeColor}
                onChange={(patch) => setProfile((p) => ({ ...p, ...patch }))}
                onSkinTone={(hex) => setLook((l) => ({ ...l, skinTone: hex }))}
                onEyeColor={(hex) => setLook((l) => ({ ...l, eyeColor: hex }))}
                onWalkStyle={handleWalkStyle}
                onTestVoice={() => playSimlishVoice(profile.voicePitch)}
                onRandomTraits={handleRandomTraits}
              />
            ) : (
              <FacePanel morphs={morphs} onChange={handleMorphChange} />
            )}
          </SheetContent>
        </Sheet>

        <Sheet open={mobilePanel === 'catalogo'} onOpenChange={(o) => setMobilePanel(o ? 'catalogo' : 'none')}>
          <SheetTrigger asChild>
            <Button size="sm" className="rounded-full bg-white/85 text-slate-700 shadow-lg hover:bg-white">
              <Shirt size={15} className="mr-1" /> Catálogo
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[340px] bg-white/95">
            <SheetTitle className="text-sm font-bold text-slate-700">Catálogo</SheetTitle>
            <div className="h-[calc(100%-2rem)]">
              <CatalogPanel look={look} onChange={(patch) => setLook((l) => ({ ...l, ...patch }))} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <BottomBar current={anim} availableExtras={extras} onPlay={handlePlay} />

      {/* Dica de hotspot (detail mode) */}
      {mode === 'detail' && hoverLabel && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-30 -translate-x-1/2 rounded-full bg-emerald-500/90 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
          Edição direta: {hoverLabel}
        </div>
      )}

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-sky-50 via-emerald-50 to-teal-50">
          <svg width="46" height="62" viewBox="0 0 22 30" className="animate-bounce">
            <polygon points="11,0 22,11 11,30 0,11" fill="#41c257" stroke="#2c9c3f" strokeWidth="1" />
            <polygon points="11,0 22,11 11,30" fill="#2c9c3f" opacity="0.55" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700">Carregando o Criar um Sim…</p>
            <p className="mt-1 text-xs text-slate-500">{progress.label}</p>
          </div>
          <div className="h-2 w-56 overflow-hidden rounded-full bg-white shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-400 transition-all duration-300"
              style={{ width: `${Math.max(8, progress.pct)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
