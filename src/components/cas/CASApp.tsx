'use client';

/**
 * CAS — Create-A-Sim 3D
 * Layout inspirado no Create-A-Sim do The Sims 4: fundo azul→verde de estúdio,
 * cartão de identidade + painel azul de traços (topo-esquerdo), widget de
 * sliders (esquerda), menu circular de categorias, painel "Roupa do Dia"
 * (direita), setas de rotação (base) e botões ✕/✓ (canto inferior direito).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dices, Search, Shirt, UserRound } from 'lucide-react';
import { IdentityStack } from './IdentityStack';
import { ProportionWidget } from './ProportionWidget';
import { CategoryOrbit } from './CategoryOrbit';
import { RotationDock } from './RotationDock';
import { OutfitPanel } from './panels/OutfitPanel';
import { ProfilePanel } from './panels/ProfilePanel';
import { FacePanel } from './panels/FacePanel';
import { CASEngine } from '@/lib/cas/engine';
import { defaultMorphValues, MORPH_DEFS, MORPH_NO_RANDOM } from '@/lib/cas/morphs';
import { AGES, ASPIRATIONS, randomPick, TRAITS, WALK_STYLES } from '@/lib/cas/data';
import { CATALOG } from '@/lib/cas/catalog';
import { playSimlishVoice } from '@/lib/cas/voice';
import type {
  CameraMode,
  CatalogCategory,
  CharacterLook,
  Gender,
  MorphValues,
  ProfileData,
} from '@/lib/cas/types';

const randomHex = (colors: { hex: string }[]) =>
  colors[Math.floor(Math.random() * colors.length)].hex;

const DEFAULT_LOOK: CharacterLook = {
  hair: 'curto',
  hairColor: '#d9b26a',
  top: 'regata',
  topColor: '#1d5287',
  bottom: 'shorts',
  bottomColor: '#f2f4f6',
  fullBody: 'nenhum',
  fullBodyColor: '#d97ba6',
  accessory: 'sem_acessorio',
  accessoryColor: '#e8c33a',
  glasses: 'sem_oculos',
  glassesColor: '#2d2f33',
  skinTone: '#f0c8a0',
  eyeColor: '#46718f',
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
  const [category, setCategory] = useState<CatalogCategory>('tops');
  const [morphs, setMorphs] = useState<MorphValues>(() => defaultMorphValues());
  const [look, setLook] = useState<CharacterLook>(DEFAULT_LOOK);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [anim, setAnim] = useState('idle');
  const [walkSpeed, setWalkSpeed] = useState(0.45); // 0..1 → timeScale 0.5..1.6
  const [extras, setExtras] = useState<string[]>([]);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'none' | 'perfil' | 'catalogo'>('none');

  const showToast = useCallback((msg: string) => {
    const id = Date.now();
    setToast({ id, msg });
    window.setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, 2400);
  }, []);

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

  useEffect(() => {
    if (ready) engineRef.current?.setWalkSpeedStyle(0.5 + walkSpeed * 1.1);
  }, [ready, walkSpeed]);

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

  const handleWalkStyle = useCallback(
    (id: string) => {
      const style = WALK_STYLES.find((w) => w.id === id);
      if (!style) return;
      setAnim(style.clip[gender]);
      engineRef.current?.playAnim(style.clip[gender]);
    },
    [gender]
  );

  const handleMorphChange = useCallback((key: string, value: number) => {
    setMorphs((prev) => ({ ...prev, [key]: value }));
    engineRef.current?.applyMorphInternal(key, value, false);
  }, []);

  const handleRandomTraits = useCallback(() => {
    setProfile((p) => ({
      ...p,
      traits: randomPick(TRAITS, 3).map((t) => t.id),
      aspiration: ASPIRATIONS[Math.floor(Math.random() * ASPIRATIONS.length)].id,
    }));
  }, []);

  const handleRandomize = useCallback(() => {
    const hairItem = randomPick(CATALOG[0].items.slice(1), 1)[0];
    const topItem = randomPick(CATALOG[1].items.slice(1), 1)[0];
    const bottomItem = randomPick(CATALOG[2].items.slice(1), 1)[0];
    const fullBodyItem = randomPick(CATALOG[3].items, 1)[0];
    const accItem = randomPick(CATALOG[4].items, 1)[0];
    const glassesItem = randomPick(CATALOG[5].items, 1)[0];
    setLook({
      hair: hairItem.id,
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
    });
    const nextMorphs: MorphValues = { ...defaultMorphValues() };
    for (const def of MORPH_DEFS) {
      if (MORPH_NO_RANDOM.has(def.key)) continue; // gravidez não é aleatória
      nextMorphs[def.key] =
        def.range === 'bipolar'
          ? Math.round((Math.random() * 1.2 - 0.6) * 100) / 100
          : Math.round((0.2 + Math.random() * 0.6) * 100) / 100;
    }
    setMorphs(nextMorphs);
    handleRandomTraits();
    showToast('Sim aleatorizado! 🎲');
  }, [handleRandomTraits, showToast]);

  const handleOrbitSelect = useCallback((id: CatalogCategory | 'rosto') => {
    if (id === 'rosto') {
      setMode('detail');
    } else {
      setMode('fullbody');
      setCategory(id);
    }
  }, []);

  const handleRotate = useCallback((delta: number) => {
    engineRef.current?.rotateCharacter(delta);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    engineRef.current?.zoomCamera(delta);
  }, []);

  const handleConfirm = useCallback(() => {
    const url = engineRef.current?.snapshot();
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `sim-${(profile.firstName || 'meu-sim').toLowerCase()}.png`;
      a.click();
    }
    showToast('Sim salvo! Retrato baixado. ✓');
  }, [profile.firstName, showToast]);

  const handleCancel = useCallback(() => {
    setLook(DEFAULT_LOOK);
    setProfile(DEFAULT_PROFILE);
    setMorphs(defaultMorphValues());
    setAnim('idle');
    setWalkSpeed(0.45);
    if (ready) {
      engineRef.current?.setMorphs(defaultMorphValues());
      engineRef.current?.applyLook(DEFAULT_LOOK);
      engineRef.current?.playAnim('idle');
    }
    showToast('Alterações descartadas.');
  }, [ready, showToast]);

  const ageLabel = AGES.find((a) => a.id === profile.age)?.label ?? '';

  /* --------------------------------- UI --------------------------------- */
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[linear-gradient(to_top_right,#2b73b5_0%,#3a989e_52%,#4cb185_100%)] text-[#123c63]">
      {/* Canvas 3D */}
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {/* vinheta suave de estúdio */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_42%,transparent_55%,rgba(10,40,70,0.22)_100%)]" />

      {/* ---------- topo-esquerdo: identidade (desktop) ---------- */}
      <IdentityStack
        profile={profile}
        gender={gender}
        onChange={(patch) => setProfile((p) => ({ ...p, ...patch }))}
        onGender={handleGender}
        onWalkStyle={handleWalkStyle}
        onRandomTraits={handleRandomTraits}
      />

      {/* ---------- mobile: chip do nome (abre Perfil) ---------- */}
      <div className="absolute left-3 top-3 z-30 lg:hidden">
        <Sheet open={mobilePanel === 'perfil'} onOpenChange={(o) => setMobilePanel(o ? 'perfil' : 'none')}>
          <SheetTrigger asChild>
            <button className="flex max-w-[70vw] items-center gap-2 rounded-2xl border border-white/70 bg-white/95 px-3 py-2 text-left shadow-lg">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e2f2ff] text-[15px] font-black text-[#1d5287]">
                {gender === 'F' ? '♀' : '♂'}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-[9px] font-bold italic text-[#5c84a8]">
                  Hello, My Name Is…
                </span>
                <span className="block truncate text-[13px] font-extrabold text-[#1d5287]">
                  {profile.firstName} {profile.lastName}
                </span>
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[330px] overflow-y-auto bg-white/95">
            <SheetTitle className="text-sm font-bold text-[#1d5287]">Perfil &amp; Identidade</SheetTitle>
            <div className="mt-3">
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
                <FacePanel
                  morphs={morphs}
                  onChange={handleMorphChange}
                  skinTone={look.skinTone}
                  eyeColor={look.eyeColor}
                  onSkinTone={(hex) => setLook((l) => ({ ...l, skinTone: hex }))}
                  onEyeColor={(hex) => setLook((l) => ({ ...l, eyeColor: hex }))}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ---------- topo-direito: câmera + aleatório ---------- */}
      <div className="absolute right-3 top-3 z-30 flex items-center gap-1.5">
        <div className="flex items-center gap-0.5 rounded-full border border-white/60 bg-white/90 p-1 shadow-lg backdrop-blur-md">
          <button
            type="button"
            title="Full Body Mode — visão geral"
            aria-pressed={mode === 'fullbody'}
            onClick={() => setMode('fullbody')}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-full transition-all',
              mode === 'fullbody'
                ? 'bg-[#3fae52] text-white shadow'
                : 'text-[#5c84a8] hover:bg-[#e2f2ff] hover:text-[#1d5287]',
            ].join(' ')}
          >
            <UserRound size={15} strokeWidth={2.3} />
          </button>
          <button
            type="button"
            title="Detail Edit Mode — edição facial"
            aria-pressed={mode === 'detail'}
            onClick={() => setMode('detail')}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-full transition-all',
              mode === 'detail'
                ? 'bg-[#3fae52] text-white shadow'
                : 'text-[#5c84a8] hover:bg-[#e2f2ff] hover:text-[#1d5287]',
            ].join(' ')}
          >
            <Search size={15} strokeWidth={2.3} />
          </button>
        </div>
        <button
          type="button"
          title="Aleatorizar Sim"
          onClick={handleRandomize}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/90 text-[#1d5287] shadow-lg backdrop-blur-md transition hover:rotate-12 hover:bg-white active:scale-95"
        >
          <Dices size={18} strokeWidth={2.2} />
        </button>
      </div>

      {/* ---------- menu circular de categorias ---------- */}
      <CategoryOrbit mode={mode} activeCategory={category} onSelect={handleOrbitSelect} />

      {/* ---------- widget de sliders (esquerda, fullbody) ---------- */}
      {mode === 'fullbody' && (
        <ProportionWidget
          voicePitch={profile.voicePitch}
          onVoicePitch={(v) => setProfile((p) => ({ ...p, voicePitch: v }))}
          walkSpeed={walkSpeed}
          onWalkSpeed={setWalkSpeed}
          onZoom={handleZoom}
          onTestVoice={() => playSimlishVoice(profile.voicePitch)}
        />
      )}

      {/* ---------- painel facial (esquerda, detail) ---------- */}
      {mode === 'detail' && (
        <aside className="pointer-events-auto absolute bottom-[92px] left-3 top-3 z-20 hidden w-[300px] lg:block">
          <div className="h-full rounded-2xl border border-white/70 bg-white/95 p-3 shadow-[0_8px_24px_rgba(9,52,90,0.35)] backdrop-blur-md">
            <FacePanel
              morphs={morphs}
              onChange={handleMorphChange}
              skinTone={look.skinTone}
              eyeColor={look.eyeColor}
              onSkinTone={(hex) => setLook((l) => ({ ...l, skinTone: hex }))}
              onEyeColor={(hex) => setLook((l) => ({ ...l, eyeColor: hex }))}
            />
          </div>
        </aside>
      )}

      {/* ---------- painel direito: "Roupa do Dia" (desktop) ---------- */}
      <aside className="pointer-events-auto absolute bottom-[92px] right-3 top-[60px] z-20 hidden w-[288px] lg:block">
        <OutfitPanel
          look={look}
          category={category}
          onCategory={setCategory}
          onChange={(patch) => setLook((l) => ({ ...l, ...patch }))}
          morphs={morphs}
          onMorph={handleMorphChange}
        />
      </aside>

      {/* ---------- botões dos painéis (mobile) ---------- */}
      <div className="absolute bottom-[104px] left-3 z-30 flex flex-col gap-2 lg:hidden">
        <Sheet open={mobilePanel === 'catalogo'} onOpenChange={(o) => setMobilePanel(o ? 'catalogo' : 'none')}>
          <SheetTrigger asChild>
            <Button size="sm" className="rounded-full bg-white/90 text-[#1d5287] shadow-lg hover:bg-white">
              <Shirt size={15} className="mr-1" /> Catálogo
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[330px] bg-white/95 p-0">
            <SheetTitle className="sr-only">Catálogo</SheetTitle>
            <div className="h-full pt-6">
              <OutfitPanel
                look={look}
                category={category}
                onCategory={setCategory}
                onChange={(patch) => setLook((l) => ({ ...l, ...patch }))}
                morphs={morphs}
                onMorph={handleMorphChange}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ---------- retrato do Sim (base-esquerda, desktop) ---------- */}
      <div className="absolute bottom-3 left-3 z-20 hidden items-center gap-2.5 rounded-2xl border border-white/70 bg-white/92 py-2 pl-2.5 pr-4 shadow-[0_6px_18px_rgba(9,52,90,0.30)] backdrop-blur-md lg:flex">
        <svg width="20" height="27" viewBox="0 0 22 30" aria-hidden>
          <polygon points="11,0 22,11 11,30 0,11" fill="#41c257" stroke="#2c9c3f" strokeWidth="1" />
          <polygon points="11,0 22,11 11,30" fill="#2c9c3f" opacity="0.55" />
        </svg>
        <div className="leading-tight">
          <p className="max-w-[140px] truncate text-[13px] font-extrabold text-[#1d5287]">
            {profile.firstName} {profile.lastName}
          </p>
          <p className="text-[10px] font-semibold text-[#5c84a8]">
            {gender === 'F' ? '♀' : '♂'} {ageLabel}
          </p>
        </div>
      </div>

      {/* ---------- dock inferior: rotação + animações ---------- */}
      <RotationDock
        current={anim}
        availableExtras={extras}
        onPlay={handlePlay}
        onRotate={handleRotate}
      />

      {/* ---------- ✕ / ✓ (canto inferior direito) ---------- */}
      <div className="absolute bottom-4 right-3 z-30 flex items-center gap-2.5 lg:right-4">
        <button
          type="button"
          title="Descartar alterações"
          onClick={handleCancel}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#d64545] shadow-lg backdrop-blur-md transition hover:scale-110 hover:bg-white active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          title="Confirmar e salvar Sim"
          onClick={handleConfirm}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#2f9e44] shadow-lg backdrop-blur-md transition hover:scale-110 hover:bg-white active:scale-95"
        >
          <svg width="19" height="19" viewBox="0 0 16 16" aria-hidden>
            <path d="M2.5 8.5 L6.5 12.5 L13.5 4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ---------- dica de hotspot (detail mode) ---------- */}
      {mode === 'detail' && hoverLabel && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full bg-[#1d5287]/95 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
          Edição direta: {hoverLabel}
        </div>
      )}

      {/* ---------- toast ---------- */}
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-none absolute bottom-[150px] left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#1d5287]/95 px-4 py-2 text-xs font-bold text-white shadow-xl"
        >
          {toast.msg}
        </div>
      )}

      {/* ---------- loading overlay ---------- */}
      {!ready && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[linear-gradient(to_top_right,#2b73b5_0%,#3a989e_52%,#4cb185_100%)]">
          <svg width="52" height="70" viewBox="0 0 22 30" className="animate-bounce drop-shadow-lg">
            <polygon points="11,0 22,11 11,30 0,11" fill="#41c257" stroke="#2c9c3f" strokeWidth="1" />
            <polygon points="11,0 22,11 11,30" fill="#2c9c3f" opacity="0.55" />
          </svg>
          <div className="text-center">
            <p className="text-base font-extrabold tracking-tight text-white drop-shadow">
              Criar um Sim
            </p>
            <p className="mt-1 text-xs font-semibold text-white/85">{progress.label}</p>
          </div>
          <div className="h-2 w-60 overflow-hidden rounded-full bg-white/30 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-white to-[#d6f5dc] transition-all duration-300"
              style={{ width: `${Math.max(8, progress.pct)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
