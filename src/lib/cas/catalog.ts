/**
 * CAS — Catálogo de conteúdo (cabelos, roupas, acessórios, óculos)
 * + construtores procedurais das malhas de cada item.
 */
import * as THREE from 'three';
import type { CatalogDef, CatalogColor } from './types';
import type { CharacterBind } from './character';
import {
  applySkinWeights,
  BONE_GROUPS,
} from './skinning';
import {
  capsuleBetween,
  sphereAt,
  mergeParts,
  latheTorso,
  skinnedFromGeometry,
} from './geometryKit';

/* ------------------------------------------------------------------ */
/* Paletas                                                            */
/* ------------------------------------------------------------------ */

const sw = (hex: string, label: string): CatalogColor => ({ hex, label });

export const HAIR_COLORS: CatalogColor[] = [
  sw('#191a1d', 'Preto'),
  sw('#2e2119', 'Castanho escuro'),
  sw('#4a2f23', 'Castanho'),
  sw('#d9b26a', 'Loiro'),
  sw('#e8dcc8', 'Platinado'),
  sw('#a4502e', 'Ruivo'),
  sw('#b9bcc4', 'Grisalho'),
  sw('#d97ba6', 'Rosa'),
];

export const SKIN_TONES: CatalogColor[] = [
  sw('#ffdfc4', 'Claro'),
  sw('#f0c8a0', 'Marfim'),
  sw('#dda57e', 'Pêssego'),
  sw('#c68a5f', 'Dourado'),
  sw('#a96b45', 'Caramelo'),
  sw('#8a5236', 'Castanho'),
  sw('#6e4029', 'Bronze'),
  sw('#58341f', 'Ébano'),
];

export const EYE_COLORS: CatalogColor[] = [
  sw('#5b3a1e', 'Castanho'),
  sw('#8a5a2b', 'Mel'),
  sw('#4f7a3d', 'Verde'),
  sw('#46718f', 'Azul'),
  sw('#7d8a94', 'Cinza'),
  sw('#b07a2a', 'Âmbar'),
];

export const CLOTHES_COLORS: CatalogColor[] = [
  sw('#d9534f', 'Vermelho'),
  sw('#e8833a', 'Laranja'),
  sw('#e8c33a', 'Amarelo'),
  sw('#6aa84f', 'Verde'),
  sw('#45a09e', 'Turquesa'),
  sw('#d97ba6', 'Rosa'),
  sw('#8e6aa8', 'Roxo'),
  sw('#8a6a4f', 'Marrom'),
  sw('#9aa0a6', 'Cinza'),
  sw('#2d2f33', 'Preto'),
  sw('#f2f4f6', 'Branco'),
  sw('#efe6d8', 'Creme'),
];

/* ------------------------------------------------------------------ */
/* Definição do catálogo                                              */
/* ------------------------------------------------------------------ */

const clothes = (hexes: string[]) => CLOTHES_COLORS.filter((c) => hexes.includes(c.hex));
const allClothes = CLOTHES_COLORS;

export const CATALOG: CatalogDef[] = [
  {
    id: 'cabelos',
    label: 'Cabelos',
    items: [
      { id: 'careca', label: 'Careca', colors: HAIR_COLORS },
      { id: 'curto', label: 'Curto', colors: HAIR_COLORS },
      { id: 'medio', label: 'Médio', colors: HAIR_COLORS },
      { id: 'longo', label: 'Longo', colors: HAIR_COLORS },
      { id: 'coque', label: 'Coque', colors: HAIR_COLORS },
      { id: 'rabo', label: 'Rabo de Cavalo', colors: HAIR_COLORS },
    ],
  },
  {
    id: 'tops',
    label: 'Tops',
    items: [
      { id: 'sem_top', label: 'Nenhum', colors: allClothes },
      { id: 'camiseta', label: 'Camiseta', colors: allClothes },
      { id: 'regata', label: 'Regata', colors: allClothes },
      { id: 'moletom', label: 'Moletom', colors: allClothes },
    ],
  },
  {
    id: 'baixos',
    label: 'Partes de Baixo',
    items: [
      { id: 'nenhum', label: 'Nenhum', colors: allClothes },
      { id: 'calca', label: 'Calça', colors: allClothes },
      { id: 'shorts', label: 'Shorts', colors: allClothes },
      { id: 'saia', label: 'Saia', colors: allClothes },
    ],
  },
  {
    id: 'corpo_inteiro',
    label: 'Corpo Inteiro',
    items: [
      { id: 'nenhum', label: 'Nenhum', colors: allClothes },
      { id: 'vestido', label: 'Vestido', colors: allClothes },
      { id: 'macacao', label: 'Macacão', colors: allClothes },
    ],
  },
  {
    id: 'acessorios',
    label: 'Acessórios',
    items: [
      { id: 'sem_acessorio', label: 'Nenhum', colors: allClothes },
      { id: 'brincos', label: 'Brincos', colors: clothes(['#d9534f', '#e8c33a', '#9aa0a6', '#2d2f33', '#f2f4f6', '#d97ba6']) },
      { id: 'colar', label: 'Colar', colors: clothes(['#e8c33a', '#9aa0a6', '#2d2f33', '#f2f4f6']) },
      { id: 'bone', label: 'Boné', colors: allClothes },
    ],
  },
  {
    id: 'oculos',
    label: 'Óculos',
    items: [
      { id: 'sem_oculos', label: 'Nenhum', colors: allClothes },
      { id: 'redondo', label: 'Redondo', colors: clothes(['#2d2f33', '#8a6a4f', '#d9534f', '#e8c33a', '#9aa0a6']) },
      { id: 'quadrado', label: 'Quadrado', colors: clothes(['#2d2f33', '#8a6a4f', '#45a09e', '#2d2f33']) },
      { id: 'escuro', label: 'Escuros', colors: clothes(['#17181a', '#2d2f33', '#8a6a4f']) },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Cabelos                                                            */
/* ------------------------------------------------------------------ */

export function buildHair(bind: CharacterBind, id: string, colorHex: string): THREE.Object3D {
  const { headR: R } = bind;
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.72,
    metalness: 0.04,
  });
  mat.name = 'hairMat';

  // Crânio real medido por raycast (frame do headGroup/osso Head):
  // elipsoide com raio ~0.87R (frente/topo/queixo), ~0.67R (lados) e
  // occipital ~0.76R. A touca envolve esse elipsoide com folga fina.
  const capScale: [number, number, number] = [0.74, 0.94, 0.92];
  const capPos: [number, number, number] = [0, 0.02, -0.02];
  const capMesh = (thetaLen: number) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(R, 34, 22, 0, Math.PI * 2, 0, thetaLen), mat);
    m.scale.set(...capScale);
    m.position.set(capPos[0] * R, capPos[1] * R, capPos[2] * R);
    m.castShadow = true;
    return m;
  };

  // painel traseiro na mesma esfera escalada (cai pela nuca/costas)
  const backPanel = (thetaStart: number, thetaLen: number) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(
        R, 30, 20,
        Math.PI * 0.82, Math.PI * 1.36, // azimuth: metade traseira
        thetaStart, thetaLen
      ),
      mat
    );
    m.scale.set(...capScale);
    m.position.set(capPos[0] * R, capPos[1] * R, capPos[2] * R);
    m.rotation.x = 0.12;
    m.castShadow = true;
    grp.add(m);
  };

  switch (id) {
    case 'curto':
      grp.add(capMesh(0.4 * Math.PI));
      break;
    case 'medio': {
      grp.add(capMesh(0.42 * Math.PI));
      backPanel(0.42 * Math.PI, 0.45 * Math.PI); // volume até a nuca
      break;
    }
    case 'longo': {
      grp.add(capMesh(0.42 * Math.PI));
      backPanel(0.42 * Math.PI, 0.85 * Math.PI); // cai pelas costas
      break;
    }
    case 'coque': {
      grp.add(capMesh(0.4 * Math.PI));
      const bun = new THREE.Mesh(sphereAt(new THREE.Vector3(0, 0, 0), R * 0.38, [1, 0.9, 1]), mat);
      bun.position.set(0, R * 0.45, -R * 0.8);
      bun.castShadow = true;
      grp.add(bun);
      break;
    }
    case 'rabo': {
      grp.add(capMesh(0.4 * Math.PI));
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, R * 0.35, -R * 0.9),
        new THREE.Vector3(0, R * 0.0, -R * 1.1),
        new THREE.Vector3(0, -R * 0.8, -R * 1.12),
        new THREE.Vector3(0, -R * 1.55, -R * 0.95),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, R * 0.24, 12), mat);
      tube.castShadow = true;
      grp.add(tube);
      break;
    }
    default:
      break;
  }
  return grp;
}

/* ------------------------------------------------------------------ */
/* Óculos                                                             */
/* ------------------------------------------------------------------ */

export function buildGlasses(bind: CharacterBind, id: string, colorHex: string): THREE.Object3D {
  const { headR: R, headCenter: C } = bind;
  const grp = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4, metalness: 0.5 });
  const lensMat = new THREE.MeshStandardMaterial({
    color: '#20242a',
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: id === 'escuro' ? 0.85 : 0.28,
  });

  const eyeY = R * 0.16;
  const z = R * 0.82;

  const lensR = R * (id === 'quadrado' ? 0.26 : 0.24);

  for (const sx of [-1, 1]) {
    const cx = sx * R * 0.37;
    if (id === 'quadrado') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(lensR * 1.15, R * 0.022, 4, 4), frameMat);
      ring.position.set(cx, eyeY, z);
      ring.rotation.z = Math.PI / 4;
      ring.rotation.y = sx * 0.12;
      grp.add(ring);
    } else {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(lensR, R * 0.022, 8, 26), frameMat);
      ring.position.set(cx, eyeY, z);
      ring.rotation.y = sx * 0.12;
      grp.add(ring);
    }
    const lens = new THREE.Mesh(new THREE.CircleGeometry(lensR * (id === 'quadrado' ? 1.1 : 1), 24), lensMat);
    lens.position.set(cx, eyeY, z + R * 0.012);
    lens.rotation.y = sx * 0.12;
    grp.add(lens);

    // hastes até as orelhas
    const temple = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.014, R * 0.014, R * 1.0, 6), frameMat);
    temple.position.set(sx * R * 0.66, eyeY + R * 0.02, z - R * 0.52);
    temple.rotation.x = Math.PI / 2 - 0.1;
    temple.rotation.z = sx * -0.06;
    grp.add(temple);
  }
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.016, R * 0.016, R * 0.3, 6), frameMat);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, eyeY + R * 0.04, z + R * 0.02);
  grp.add(bridge);

  // filhos já usam offsets relativos ao centro da cabeça (headGroup)
  void C;
  return grp;
}

/* ------------------------------------------------------------------ */
/* Acessórios                                                         */
/* ------------------------------------------------------------------ */

export function buildAccessory(bind: CharacterBind, id: string, colorHex: string): THREE.Object3D {
  const { headR: R, headCenter: C } = bind;
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.55 });

  if (id === 'brincos') {
    for (const sx of [-1, 1]) {
      const g = sphereAt(new THREE.Vector3(0, 0, 0), R * 0.09, [1, 1.4, 1], 12);
      const m = new THREE.Mesh(g, mat);
      m.position.set(sx * R * 0.02, -R * 0.08, 0);
      const obj = new THREE.Object3D();
      obj.position.set(sx * R * 0.88, -R * 0.4, -R * 0.06);
      obj.add(m);
      grp.add(obj);
    }
  } else if (id === 'colar') {
    const neckY = bind.neck.y - (bind.neck.y - bind.spine2.y) * 0.35;
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 10, 30), mat);
    torus.rotation.x = Math.PI / 2 - 0.35;
    torus.position.set(0, neckY + 0.03, 0.01);
    grp.add(torus);
  } else if (id === 'bone') {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(R, 30, 18, 0, Math.PI * 2, 0, Math.PI * 0.42),
      mat
    );
    dome.scale.set(0.78, 0.96, 0.94);
    dome.position.set(0, R * 0.04, -R * 0.02);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.58, R * 0.64, R * 0.045, 24, 1, false, 0, Math.PI * 1.15), mat);
    brim.position.set(0, R * 0.32, R * 0.42);
    brim.rotation.y = Math.PI * 0.42;
    grp.add(dome, brim);
  }
  // filhos já usam offsets relativos ao centro da cabeça (headGroup)
  void C;
  return grp;
}

/* ------------------------------------------------------------------ */
/* Roupas (malhas skinned por cima do corpo)                          */
/* ------------------------------------------------------------------ */

function torsoOverlay(
  bind: CharacterBind,
  yFrom: number,
  yTo: number,
  radiusOffset: number,
  mat: THREE.Material
): THREE.SkinnedMesh {
  const { hips, neck } = bind;
  const hipsToNeck = neck.y - hips.y;
  const profile: [number, number][] = PROFILES.flatMap(([r, f]) => {
    const y = hips.y + f * hipsToNeck;
    if (y < yFrom - 0.01 || y > yTo + 0.01) return [];
    return [[r + radiusOffset, y] as [number, number]];
  });
  if (profile.length < 2) {
    profile.push([0.12 + radiusOffset, yFrom], [0.12 + radiusOffset, yTo]);
  }
  const geo = latheTorso(profile, 0.68);
  applySkinWeights(geo, bind.segments, [...BONE_GROUPS.torso], bind.skeleton);
  return skinnedFromGeometry(geo, bind.skeleton, mat, 'roupa_torso');
}

const PROFILES: [number, number][] = [
  [0.125, 0.0],
  [0.113, 0.16],
  [0.108, 0.34],
  [0.128, 0.62],
  [0.124, 0.82],
  [0.095, 0.95],
  [0.056, 1.0],
];

export type GarmentSlot = 'top' | 'bottom' | 'fullbody';

export function buildGarments(
  bind: CharacterBind,
  slot: GarmentSlot,
  id: string,
  colorHex: string
): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.78,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  mat.name = `${slot}Mat`;

  const hipsToNeck = bind.neck.y - bind.hips.y;
  const yAt = (frac: number) => bind.hips.y + frac * hipsToNeck;

  if (slot === 'top') {
    if (id === 'camiseta') {
      out.push(torsoOverlay(bind, yAt(0.24), yAt(1.0), 0.014, mat));
      for (const [arm, fore, grp] of [
        [bind.armL, bind.foreL, 'sleeveL'],
        [bind.armR, bind.foreR, 'sleeveR'],
      ] as const) {
        // começa um pouco abaixo da articulação para não vazar sobre o ombro
        const start = arm.clone().lerp(fore, 0.14);
        const mid = arm.clone().lerp(fore, 0.62);
        const geo = capsuleBetween(start, mid, 0.053, 0.047);
        applySkinWeights(geo, bind.segments, [...BONE_GROUPS[grp]], bind.skeleton);
        out.push(skinnedFromGeometry(geo, bind.skeleton, mat, 'roupa_manga'));
      }
    } else if (id === 'regata') {
      out.push(torsoOverlay(bind, yAt(0.42), yAt(1.0), 0.012, mat));
    } else if (id === 'moletom') {
      out.push(torsoOverlay(bind, yAt(0.16), yAt(1.0), 0.026, mat));
      for (const [arm, hand, grp] of [
        [bind.armL, bind.handL, 'armL'],
        [bind.armR, bind.handR, 'armR'],
      ] as const) {
        const geo = capsuleBetween(arm, hand, 0.062, 0.048);
        applySkinWeights(geo, bind.segments, [...BONE_GROUPS[grp]], bind.skeleton);
        out.push(skinnedFromGeometry(geo, bind.skeleton, mat, 'roupa_manga'));
      }
    }
  } else if (slot === 'bottom') {
    if (id === 'calca') {
      for (const [up, knee, foot, grp] of [
        [bind.upLegL, bind.kneeL, bind.footL, 'legL'],
        [bind.upLegR, bind.kneeR, bind.footR, 'legR'],
      ] as const) {
        const thigh = capsuleBetween(up, knee, 0.082, 0.068);
        const calf = capsuleBetween(knee, foot, 0.066, 0.052);
        const leg = mergeParts([thigh, calf]);
        applySkinWeights(leg, bind.segments, [...BONE_GROUPS[grp]], bind.skeleton);
        out.push(skinnedFromGeometry(leg, bind.skeleton, mat, 'roupa_calca'));
      }
    } else if (id === 'shorts') {
      for (const [up, knee, grp] of [
        [bind.upLegL, bind.kneeL, 'fullL'],
        [bind.upLegR, bind.kneeR, 'fullR'],
      ] as const) {
        const mid = up.clone().lerp(knee, 0.6);
        const geo = capsuleBetween(up, mid, 0.086, 0.075);
        applySkinWeights(geo, bind.segments, [...BONE_GROUPS[grp]], bind.skeleton);
        out.push(skinnedFromGeometry(geo, bind.skeleton, mat, 'roupa_shorts'));
      }
    } else if (id === 'saia') {
      const kneeY = bind.kneeL.y + 0.06;
      const profile: [number, number][] = [
        [0.1, yAt(0.52)],
        [0.142, yAt(0.1)],
        [0.152, bind.hips.y - 0.06],
        [0.2, kneeY],
      ];
      const geo = latheTorso(profile, 0.85, 30);
      applySkinWeights(geo, bind.segments, [...BONE_GROUPS.skirt], bind.skeleton);
      out.push(skinnedFromGeometry(geo, bind.skeleton, mat, 'roupa_saia'));
    }
  } else if (slot === 'fullbody') {
    if (id === 'vestido') {
      const kneeY = bind.kneeL.y + 0.1;
      const profile: [number, number][] = [
        [0.075, yAt(0.99)],
        [0.14, yAt(0.6)],
        [0.132, yAt(0.3)],
        [0.17, bind.hips.y - 0.04],
        [0.23, kneeY],
      ];
      const geo = latheTorso(profile, 0.8, 30);
      applySkinWeights(geo, bind.segments, [
        ...BONE_GROUPS.torso,
        ...BONE_GROUPS.skirt,
      ], bind.skeleton);
      out.push(skinnedFromGeometry(geo, bind.skeleton, mat, 'roupa_vestido'));
    } else if (id === 'macacao') {
      out.push(torsoOverlay(bind, yAt(0.2), yAt(1.0), 0.018, mat));
      for (const [up, knee, foot, grp] of [
        [bind.upLegL, bind.kneeL, bind.footL, 'legL'],
        [bind.upLegR, bind.kneeR, bind.footR, 'legR'],
      ] as const) {
        const thigh = capsuleBetween(up, knee, 0.08, 0.066);
        const calf = capsuleBetween(knee, foot, 0.064, 0.05);
        const leg = mergeParts([thigh, calf]);
        applySkinWeights(leg, bind.segments, [...BONE_GROUPS[grp]], bind.skeleton);
        out.push(skinnedFromGeometry(leg, bind.skeleton, mat, 'roupa_macacao'));
      }
    }
  }
  return out;
}
