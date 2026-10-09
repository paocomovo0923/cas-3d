/**
 * CAS — Biblioteca de Morph Targets (Shape Keys)
 *
 * Mapeia os parâmetros da especificação para os morphTargetInfluences
 * das meshes correspondentes:
 *  - Cabeça:  formato_da_cabeca, cabeca_largura, cabeca_altura
 *  - Rosto:   queixo, queixo_x, queixo_y, bochecha, bochecha_x,
 *             bochecha_y, mandibula_x, mandibula_y
 *  - Nariz:   nariz, nariz_x, nariz_y, nariz_curva, nariz_raiz,
 *             nariz_asa_x, nariz_asa_y, nariz_dorso
 *  - Orelhas: orelha_grande, orelha_pontuda, orelha_colada
 *  - Corpo:   ombro
 */
import * as THREE from 'three';
import type { MorphDef, MorphValues } from './types';

export const MORPH_DEFS: MorphDef[] = [
  // ---- Estrutura da Cabeça (mesh: head__head_XXX_oval) ----
  { key: 'formato_da_cabeca', label: 'Formato da Cabeça', group: 'cabeca', range: 'unipolar', default: 0.5, hint: 'Redonda ⇄ Oval' },
  { key: 'cabeca_largura', label: 'Largura da Cabeça', group: 'cabeca', range: 'bipolar', default: 0, hint: 'Arraste horizontal' },
  { key: 'cabeca_altura', label: 'Altura da Cabeça', group: 'cabeca', range: 'bipolar', default: 0, hint: 'Arraste vertical' },
  // ---- Face e Queixo (mesh: head__head_XXX_oval) ----
  { key: 'queixo', label: 'Queixo', group: 'rosto', range: 'unipolar', default: 0.5 },
  { key: 'queixo_x', label: 'Queixo Largura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste horizontal' },
  { key: 'queixo_y', label: 'Queixo Altura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste vertical' },
  { key: 'bochecha', label: 'Bochechas', group: 'rosto', range: 'unipolar', default: 0.5 },
  { key: 'bochecha_x', label: 'Bochecha Largura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste horizontal' },
  { key: 'bochecha_y', label: 'Bochecha Altura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste vertical' },
  { key: 'mandibula_x', label: 'Mandíbula Largura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste horizontal' },
  { key: 'mandibula_y', label: 'Mandíbula Altura', group: 'rosto', range: 'bipolar', default: 0, hint: 'Arraste vertical' },
  // ---- Nariz (mesh: nariz__nariz_base) ----
  { key: 'nariz', label: 'Tamanho do Nariz', group: 'nariz', range: 'unipolar', default: 0.5 },
  { key: 'nariz_x', label: 'Nariz Largura', group: 'nariz', range: 'bipolar', default: 0, hint: 'Arraste horizontal' },
  { key: 'nariz_y', label: 'Nariz Altura', group: 'nariz', range: 'bipolar', default: 0, hint: 'Arraste vertical' },
  { key: 'nariz_curva', label: 'Curva do Nariz', group: 'nariz', range: 'unipolar', default: 0.5 },
  { key: 'nariz_raiz', label: 'Raiz do Nariz', group: 'nariz', range: 'unipolar', default: 0.5 },
  { key: 'nariz_asa_x', label: 'Asas Largura', group: 'nariz', range: 'bipolar', default: 0 },
  { key: 'nariz_asa_y', label: 'Asas Altura', group: 'nariz', range: 'bipolar', default: 0 },
  { key: 'nariz_dorso', label: 'Dorso do Nariz', group: 'nariz', range: 'bipolar', default: 0 },
  // ---- Orelhas (meshes: ears__ears_001_basic e .001) ----
  { key: 'orelha_grande', label: 'Tamanho das Orelhas', group: 'orelhas', range: 'unipolar', default: 0.5 },
  { key: 'orelha_pontuda', label: 'Orelhas Pontudas', group: 'orelhas', range: 'unipolar', default: 0 },
  { key: 'orelha_colada', label: 'Orelhas Coladas', group: 'orelhas', range: 'unipolar', default: 0 },
  // ---- Corpo (mesh: torso__torso_skin) ----
  { key: 'ombro', label: 'Ombros', group: 'corpo', range: 'bipolar', default: 0 },
];

export const MORPH_MAP: Record<string, MorphDef> = Object.fromEntries(
  MORPH_DEFS.map((d) => [d.key, d])
);

export function defaultMorphValues(): MorphValues {
  const out: MorphValues = {};
  for (const d of MORPH_DEFS) out[d.key] = d.default;
  return out;
}

/* ------------------------------------------------------------------ */
/* Utilitários de geração de morph targets                             */
/* ------------------------------------------------------------------ */

/** Cria um Float32Array de morph a partir de uma função de deslocamento. */
export function buildMorph(
  base: Float32Array,
  fn: (x: number, y: number, z: number, v: THREE.Vector3) => void
): Float32Array {
  const out = new Float32Array(base.length);
  const p = new THREE.Vector3();
  for (let i = 0; i < base.length; i += 3) {
    p.set(0, 0, 0);
    fn(base[i], base[i + 1], base[i + 2], p);
    out[i] = p.x;
    out[i + 1] = p.y;
    out[i + 2] = p.z;
  }
  return out;
}

/**
 * Fator suave de região: 1 dentro do núcleo, caindo suavemente até 0.
 * Usado para restringir deformações (queixo, bochechas…) a regiões do rosto.
 */
function region(
  v: { x: number; y: number; z: number },
  center: [number, number, number],
  radius: number,
  falloff = 0.55
): number {
  const dx = v.x - center[0];
  const dy = v.y - center[1];
  const dz = v.z - center[2];
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
  if (d >= 1) return 0;
  // smoothstep invertido
  const t = 1 - d;
  const s = t * t * (3 - 2 * t);
  return Math.min(1, s / falloff > 1 ? 1 : s / falloff);
}

/* ------------------------------------------------------------------ */
/* Morphs da CABEÇA (esfera escultural, espaço local do osso Head)     */
/* R ≈ raio do crânio; face no +Z                                     */
/* ------------------------------------------------------------------ */

export function headMorphTargets(geometry: THREE.BufferGeometry): void {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const base = pos.array as Float32Array;

  const add = (key: string, arr: Float32Array) => {
    geometry.morphAttributes.position = geometry.morphAttributes.position || [];
    geometry.morphAttributes.position.push(new THREE.BufferAttribute(arr, 3));
    geometry.morphTargetsRelative = true;
    void key; // nome resolvido via MORPH_ORDER no mesh
  };

  const R = 1; // geometria normalizada

  // formato_da_cabeca: 0 = redonda → 1 = oval alongada
  add(
    'formato_da_cabeca',
    buildMorph(base, (x, y, z, v) => {
      v.x = x * -0.07;
      v.y = y * 0.17 + Math.abs(y) * y * 0.05;
      v.z = z * 0.1;
    })
  );

  // cabeca_largura / cabeca_altura: bipolar (±)
  add(
    'cabeca_largura',
    buildMorph(base, (x, y, z, v) => {
      v.x = x * 0.22;
      v.y = y * -0.03;
    })
  );
  add(
    'cabeca_altura',
    buildMorph(base, (x, y, z, v) => {
      v.y = y * 0.2;
      v.x = x * -0.04;
    })
  );

  // queixo: projeção do queixo (região inferior frontal)
  add(
    'queixo',
    buildMorph(base, (x, y, z, v) => {
      const w = region({ x, y, z }, [0, -0.62 * R, 0.55 * R], 0.55 * R);
      v.z = w * 0.35 * R;
      v.y = w * -0.12 * R;
    })
  );
  // queixo_x / queixo_y
  add(
    'queixo_x',
    buildMorph(base, (x, y, z, v) => {
      const w = region({ x, y, z }, [0, -0.62 * R, 0.55 * R], 0.5 * R);
      v.x = w * Math.sign(x) * 0.16 * R;
    })
  );
  add(
    'queixo_y',
    buildMorph(base, (x, y, z, v) => {
      const w = region({ x, y, z }, [0, -0.62 * R, 0.55 * R], 0.5 * R);
      v.y = w * 0.18 * R;
    })
  );

  // bochecha: volume das bochechas
  add(
    'bochecha',
    buildMorph(base, (x, y, z, v) => {
      const wl = region({ x, y, z }, [-0.42 * R, -0.05 * R, 0.78 * R], 0.4 * R);
      const wr = region({ x, y, z }, [0.42 * R, -0.05 * R, 0.78 * R], 0.4 * R);
      const w = Math.max(wl, wr);
      v.z = w * 0.14 * R;
      v.x = w * Math.sign(x) * 0.08 * R;
    })
  );
  add(
    'bochecha_x',
    buildMorph(base, (x, y, z, v) => {
      const wl = region({ x, y, z }, [-0.42 * R, -0.05 * R, 0.75 * R], 0.45 * R);
      const wr = region({ x, y, z }, [0.42 * R, -0.05 * R, 0.75 * R], 0.45 * R);
      const w = Math.max(wl, wr);
      v.x = w * Math.sign(x) * 0.15 * R;
    })
  );
  add(
    'bochecha_y',
    buildMorph(base, (x, y, z, v) => {
      const wl = region({ x, y, z }, [-0.42 * R, -0.05 * R, 0.75 * R], 0.45 * R);
      const wr = region({ x, y, z }, [0.42 * R, -0.05 * R, 0.75 * R], 0.45 * R);
      const w = Math.max(wl, wr);
      v.y = w * 0.14 * R;
    })
  );

  // mandibula_x / mandibula_y: contorno inferior
  add(
    'mandibula_x',
    buildMorph(base, (x, y, z, v) => {
      const w = region({ x, y, z }, [0, -0.55 * R, 0.2 * R], 0.85 * R);
      v.x = w * Math.sign(x || 0.001) * 0.14 * R;
    })
  );
  add(
    'mandibula_y',
    buildMorph(base, (x, y, z, v) => {
      const w = region({ x, y, z }, [0, -0.55 * R, 0.2 * R], 0.85 * R);
      v.y = w * 0.13 * R;
      v.z = w * 0.05 * R;
    })
  );
}

/* ------------------------------------------------------------------ */
/* Morphs do NARIZ (geometria local: origem na raiz, face +Z)          */
/* altura ~1 unidade descendo para -Y                                 */
/* ------------------------------------------------------------------ */

export function noseMorphTargets(geometry: THREE.BufferGeometry): void {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const base = pos.array as Float32Array;
  const add = (arr: Float32Array) => {
    geometry.morphAttributes.position = geometry.morphAttributes.position || [];
    geometry.morphAttributes.position.push(new THREE.BufferAttribute(arr, 3));
    geometry.morphTargetsRelative = true;
  };

  const isWing = (x: number) => Math.abs(x) > 0.32;

  // nariz: tamanho geral
  add(
    buildMorph(base, (x, y, z, v) => {
      v.x = x * 0.3;
      v.y = y * 0.3;
      v.z = z * 0.3;
    })
  );
  // nariz_x
  add(
    buildMorph(base, (x, y, z, v) => {
      v.x = x * 0.35;
    })
  );
  // nariz_y
  add(
    buildMorph(base, (x, y, z, v) => {
      v.y = y * 0.35;
      v.z = z * 0.05;
    })
  );
  // nariz_curva: ponta sobe/desce
  add(
    buildMorph(base, (x, y, z, v) => {
      const w = Math.min(1, Math.max(0, -y)); // mais forte na ponta
      v.y = w * w * 0.3;
      v.z = w * 0.1;
    })
  );
  // nariz_raiz: profundidade na raiz (topo)
  add(
    buildMorph(base, (x, y, z, v) => {
      const w = Math.min(1, Math.max(0, y + 0.15));
      v.z = -w * 0.22;
    })
  );
  // nariz_asa_x
  add(
    buildMorph(base, (x, y, z, v) => {
      if (!isWing(x)) return;
      v.x = Math.sign(x) * 0.3;
    })
  );
  // nariz_asa_y
  add(
    buildMorph(base, (x, y, z, v) => {
      if (!isWing(x)) return;
      v.y = 0.18 * (y < 0 ? 1 : -0.4);
    })
  );
  // nariz_dorso: bump/aquiline no dorso central
  add(
    buildMorph(base, (x, y, z, v) => {
      if (isWing(x)) return;
      v.z = 0.16 * Math.max(0, y + 0.4);
    })
  );
}

/* ------------------------------------------------------------------ */
/* Morphs das ORELHAS (esfera achatada; +X = para fora)                */
/* ------------------------------------------------------------------ */

export function earMorphTargets(geometry: THREE.BufferGeometry): void {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const base = pos.array as Float32Array;
  const add = (arr: Float32Array) => {
    geometry.morphAttributes.position = geometry.morphAttributes.position || [];
    geometry.morphAttributes.position.push(new THREE.BufferAttribute(arr, 3));
    geometry.morphTargetsRelative = true;
  };

  // orelha_grande
  add(
    buildMorph(base, (x, y, z, v) => {
      v.x = x * 0.35;
      v.y = y * 0.35;
      v.z = z * 0.35;
    })
  );
  // orelha_pontuda (élfica): puxa o topo para cima/fora
  add(
    buildMorph(base, (x, y, z, v) => {
      const w = Math.min(1, Math.max(0, y - 0.1));
      v.y = w * w * 0.55;
      v.x = w * 0.22;
      v.z = w * -0.1;
    })
  );
  // orelha_colada: achata contra a cabeça
  add(
    buildMorph(base, (x, y, z, v) => {
      v.x = -x * 0.45 * Math.max(0, x);
      v.y = y * -0.05;
    })
  );
}

/* ------------------------------------------------------------------ */
/* Morph do TORSO: ombro (largura dos ombros, região superior)         */
/* ------------------------------------------------------------------ */

export function torsoMorphTargets(geometry: THREE.BufferGeometry): void {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const base = pos.array as Float32Array;
  const add = (arr: Float32Array) => {
    geometry.morphAttributes.position = geometry.morphAttributes.position || [];
    geometry.morphAttributes.position.push(new THREE.BufferAttribute(arr, 3));
    geometry.morphTargetsRelative = true;
  };

  add(
    buildMorph(base, (x, y, z, v) => {
      // região dos ombros: y no topo do tronco, |x| grande
      const top = Math.min(1, Math.max(0, (y - 0.15) / 0.2));
      const side = Math.min(1, Math.abs(x) / 0.22);
      const w = top * side;
      v.x = w * Math.sign(x || 0.001) * 0.055;
      v.y = w * 0.008;
    })
  );
}

/**
 * Aplica valores de morph em todas as meshes com morphTargets do personagem.
 * Ordem dos morph attributes por tipo de mesh:
 *  head:  [formato_da_cabeca, cabeca_largura, cabeca_altura, queixo, queixo_x,
 *          queixo_y, bochecha, bochecha_x, bochecha_y, mandibula_x, mandibula_y]
 *  nose:  [nariz, nariz_x, nariz_y, nariz_curva, nariz_raiz, nariz_asa_x,
 *          nariz_asa_y, nariz_dorso]
 *  ears:  [orelha_grande, orelha_pontuda, orelha_colada]
 *  torso: [ombro]
 */
export const MORPH_ORDER: Record<string, string[]> = {
  head: [
    'formato_da_cabeca',
    'cabeca_largura',
    'cabeca_altura',
    'queixo',
    'queixo_x',
    'queixo_y',
    'bochecha',
    'bochecha_x',
    'bochecha_y',
    'mandibula_x',
    'mandibula_y',
  ],
  nose: [
    'nariz',
    'nariz_x',
    'nariz_y',
    'nariz_curva',
    'nariz_raiz',
    'nariz_asa_x',
    'nariz_asa_y',
    'nariz_dorso',
  ],
  ears: ['orelha_grande', 'orelha_pontuda', 'orelha_colada'],
  torso: ['ombro'],
};
