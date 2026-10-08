/**
 * CAS (Create-A-Sim) — Tipos compartilhados
 * Sistema de criação de personagens inspirado em The Sims 4
 */

export type Gender = 'F' | 'M';

export type CameraMode = 'fullbody' | 'detail';

export type AgeId =
  | 'bebe'
  | 'crianca'
  | 'adolescente'
  | 'jovem_adulto'
  | 'adulto'
  | 'idoso';

export type MorphRange = 'unipolar' | 'bipolar';

/** Definição de um morph target (shape key) */
export interface MorphDef {
  /** chave exata usada no morphTargetInfluences (ex.: nariz_x) */
  key: string;
  label: string;
  group: 'cabeca' | 'rosto' | 'nariz' | 'orelhas' | 'corpo';
  range: MorphRange;
  default: number;
  /** descrição curta para tooltip dos hotspots */
  hint?: string;
}

export interface MorphValues {
  [key: string]: number;
}

export interface TraitDef {
  id: string;
  label: string;
  emoji: string;
}

export interface AspirationDef {
  id: string;
  label: string;
  emoji: string;
}

export interface CatalogColor {
  hex: string;
  label: string;
}

export interface CatalogItem {
  id: string;
  label: string;
  /** paleta de cores oferecida para o item */
  colors: CatalogColor[];
}

export type CatalogCategory =
  | 'cabelos'
  | 'tops'
  | 'baixos'
  | 'corpo_inteiro'
  | 'acessorios'
  | 'oculos';

export interface CatalogDef {
  id: CatalogCategory;
  label: string;
  items: CatalogItem[];
}

export interface WalkStyleDef {
  id: string;
  label: string;
  /** clip por gênero */
  clip: Record<Gender, string>;
  speed: number;
}

export interface CharacterLook {
  hair: string;
  hairColor: string;
  top: string;
  topColor: string;
  bottom: string;
  bottomColor: string;
  fullBody: string;
  fullBodyColor: string;
  accessory: string;
  accessoryColor: string;
  glasses: string;
  glassesColor: string;
  skinTone: string;
  eyeColor: string;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  age: AgeId;
  walkStyle: string;
  voicePitch: number;
  aspiration: string;
  traits: string[];
}

/** Eventos emitidos pelo motor 3D para a UI */
export interface EngineEvents {
  onProgress?: (pct: number, label: string) => void;
  onReady?: () => void;
  onError?: (msg: string) => void;
  onMorphChange?: (key: string, value: number) => void;
  onHoverHotspot?: (label: string | null) => void;
}
