/**
 * CAS — Biblioteca de Morph Targets (Shape Keys)
 *
 * As chaves abaixo correspondem 1:1 aos targetNames reais dos glTFs
 * (avakin_female/male), normalizados: minúsculas, sem acentos, sem
 * espaços/pontuação (ver normMorphKey). Exemplos:
 *   'Cabeça largura'   → cabeca_largura
 *   'nariz asa y'      → nariz_asa_y
 *   'Morph_Peso'       → morphpeso (alias → peso)
 *   'glúteos tamanho'  → gluteos_tamanho
 *
 * Todos os defaults são 0 — o modelo carrega na sua forma natural.
 */
import type { MorphDef, MorphValues } from './types';

export const MORPH_DEFS: MorphDef[] = [
  // ---- Estrutura da Cabeça (mesh: head__head_XXX_oval) ----
  { key: 'formato_da_cabeca', label: 'Formato da Cabeça', group: 'cabeca', range: 'unipolar', default: 0, hint: 'Redonda ⇄ Oval' },
  { key: 'cabeca_largura', label: 'Largura da Cabeça', group: 'cabeca', range: 'bipolar', default: 0, hint: 'Arraste horizontal' },
  { key: 'cabeca_altura', label: 'Altura da Cabeça', group: 'cabeca', range: 'bipolar', default: 0, hint: 'Arraste vertical' },
  // ---- Face e Queixo (mesh: head__head_XXX_oval) ----
  { key: 'queixo', label: 'Queixo', group: 'rosto', range: 'unipolar', default: 0 },
  { key: 'queixo_x', label: 'Queixo Largura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste horizontal' },
  { key: 'queixo_y', label: 'Queixo Altura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste vertical' },
  { key: 'bochecha', label: 'Bochechas', group: 'rosto', range: 'unipolar', default: 0 },
  { key: 'bochecha_x', label: 'Bochecha Largura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste horizontal' },
  { key: 'bochecha_y', label: 'Bochecha Altura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste vertical' },
  { key: 'mandibula_x', label: 'Mandíbula Largura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste horizontal' },
  { key: 'mandibula_y', label: 'Mandíbula Altura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste vertical' },
  // ---- Nariz (targets da própria mesh head) ----
  { key: 'nariz_ponta', label: 'Ponta do Nariz', group: 'nariz', range: 'unipolar', default: 0 },
  { key: 'nariz_x', label: 'Nariz Largura', group: 'nariz', range: 'bipolar', default: 0, hint: 'Arraste horizontal' },
  { key: 'nariz_y', label: 'Nariz Altura', group: 'nariz', range: 'bipolar', default: 0, hint: 'Arraste vertical' },
  { key: 'nariz_curva', label: 'Curva do Nariz', group: 'nariz', range: 'unipolar', default: 0 },
  { key: 'nariz_raiz', label: 'Raiz do Nariz', group: 'nariz', range: 'unipolar', default: 0 },
  { key: 'nariz_asa_x', label: 'Asas Largura', group: 'nariz', range: 'bipolar', default: 0 },
  { key: 'nariz_asa_y', label: 'Asas Altura', group: 'nariz', range: 'bipolar', default: 0 },
  { key: 'nariz_dorso', label: 'Dorso do Nariz', group: 'nariz', range: 'bipolar', default: 0 },
  // ---- Orelhas (mesh: ears__ears_001_basic) ----
  { key: 'orelha_grande', label: 'Tamanho das Orelhas', group: 'orelhas', range: 'unipolar', default: 0 },
  { key: 'orelha_pontuda', label: 'Orelhas Pontudas', group: 'orelhas', range: 'unipolar', default: 0 },
  { key: 'orelha_colada', label: 'Orelhas Coladas', group: 'orelhas', range: 'unipolar', default: 0 },
  // ---- Corpo (peso/músculo afetam todas as meshes; demais, torso/pernas) ----
  { key: 'peso', label: 'Peso', group: 'corpo', range: 'unipolar', default: 0 },
  { key: 'musculo', label: 'Músculos', group: 'corpo', range: 'unipolar', default: 0 },
  { key: 'ombro', label: 'Ombros', group: 'corpo', range: 'bipolar', default: 0 },
  { key: 'cintura', label: 'Cintura', group: 'corpo', range: 'bipolar', default: 0 },
  { key: 'quadril', label: 'Quadril', group: 'corpo', range: 'bipolar', default: 0 },
  { key: 'busto_tamanho', label: 'Busto', group: 'corpo', range: 'unipolar', default: 0 },
  { key: 'busto_espacamento', label: 'Busto Espaçamento', group: 'corpo', range: 'bipolar', default: 0 },
  { key: 'busto_altura', label: 'Busto Altura', group: 'corpo', range: 'bipolar', default: 0 },
  { key: 'antebraco', label: 'Antebraços', group: 'corpo', range: 'bipolar', default: 0 },
  { key: 'braco_superior', label: 'Braços Superiores', group: 'corpo', range: 'bipolar', default: 0 },
  { key: 'barriga', label: 'Barriga', group: 'corpo', range: 'unipolar', default: 0 },
  { key: 'barriga_gravida', label: 'Barriga de Gravidez', group: 'corpo', range: 'unipolar', default: 0 },
  { key: 'coxa', label: 'Coxas', group: 'corpo', range: 'bipolar', default: 0 },
  { key: 'panturrilha', label: 'Panturrilhas', group: 'corpo', range: 'bipolar', default: 0 },
  { key: 'gluteos_tamanho', label: 'Glúteos', group: 'corpo', range: 'unipolar', default: 0 },
  { key: 'gravida_barriga', label: 'Gravidez', group: 'corpo', range: 'unipolar', default: 0 },
];

export const MORPH_MAP: Record<string, MorphDef> = Object.fromEntries(
  MORPH_DEFS.map((d) => [d.key, d])
);

/** Chaves excluídas da aleatorização (gravidez só é definida pelo usuário) */
export const MORPH_NO_RANDOM = new Set(['gravida_barriga', 'barriga_gravida']);

export function defaultMorphValues(): MorphValues {
  const out: MorphValues = {};
  for (const d of MORPH_DEFS) out[d.key] = d.default;
  return out;
}

/**
 * Normaliza um nome de morph target ou chave interna para casamento:
 * minúsculo, sem acentos (NFD), sem espaços/pontuação.
 * 'Cabeça largura' → 'cabecalargura' = norm('cabeca_largura')
 */
export function normMorphKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Aliases: nome normalizado no glTF → chave interna usada pela UI */
const MORPH_ALIASES: Record<string, string> = {
  morphpeso: 'peso',
  morphmusculo: 'musculo',
};

/** Resolve o nome normalizado de um target do glTF para a chave interna. */
export function resolveMorphKey(rawTargetName: string): string | null {
  const k = normMorphKey(rawTargetName);
  return MORPH_ALIASES[k] ?? (MORPH_MAP[k] ? k : null);
}
