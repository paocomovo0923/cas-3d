/**
 * CAS — Skinning automático
 *
 * Os rigs dos GLBs (mixamorig:*) vêm sem meshes. Este módulo calcula
 * skinIndex/skinWeight por vértice a partir da distância aos segmentos
 * ósseos (osso → ponta), permitindo que geometrias procedurais
 * (corpo, roupas) deformem suavemente com as animações do AnimationMixer.
 */
import * as THREE from 'three';

export interface BoneSegment {
  bone: THREE.Bone;
  name: string;
  /** origem do osso no espaço do bind (world no momento do bind) */
  a: THREE.Vector3;
  /** ponta do osso (média dos filhos ou prolongamento) */
  b: THREE.Vector3;
}

/** Distância ponto → segmento AB */
function distToSegment(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const ab = b.clone().sub(a);
  const t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / Math.max(ab.lengthSq(), 1e-8)));
  return p.distanceTo(a.clone().add(ab.multiplyScalar(t)));
}

/**
 * Normaliza nomes de ossos para comparação.
 * O GLTFLoader remove caracteres como ':' dos nomes de nós
 * (ex.: "mixamorig:Hips" → "mixamorigHips").
 */
export function normBone(name: string): string {
  return name.replace(/[:\s.]/g, '');
}

/**
 * Coleta os segmentos ósseos de uma hierarquia (no bind pose atual).
 * Deve ser chamado DEPOIS de root.updateMatrixWorld(true).
 */
export function collectBoneSegments(root: THREE.Object3D): BoneSegment[] {
  const segments: BoneSegment[] = [];
  root.traverse((o) => {
    if (!(o as THREE.Bone).isBone) return;
    const bone = o as THREE.Bone;
    const a = bone.getWorldPosition(new THREE.Vector3());
    const children = bone.children.filter((c) => (c as THREE.Bone).isBone);
    let b: THREE.Vector3;
    if (children.length > 0) {
      b = new THREE.Vector3();
      children.forEach((c) => b.add(c.getWorldPosition(new THREE.Vector3())));
      b.multiplyScalar(1 / children.length);
    } else {
      // folha (ex.: HeadTop_End): prolonga na direção do pai→osso
      const parent = bone.parent as THREE.Bone;
      if (parent && (parent as THREE.Bone).isBone) {
        const pp = parent.getWorldPosition(new THREE.Vector3());
        b = a.clone().add(a.clone().sub(pp).multiplyScalar(0.5));
      } else {
        b = a.clone().add(new THREE.Vector3(0, 0.05, 0));
      }
    }
    segments.push({ bone, name: bone.name, a, b });
  });
  return segments;
}

/**
 * Computa e anexa skinIndex/skinWeight numa geometria cujos vértices
 * estão no MESMO espaço das posições dos segmentos (bind-pose world).
 *
 * IMPORTANTE: o skinIndex gravado é o índice GLOBAL do osso dentro de
 * `skeleton.bones` (three.js usa esse índice para buscar a matriz do osso).
 * Os `segments` devem vir de collectBoneSegments na mesma ordem do traverse
 * usado para construir o skeleton.
 *
 * @param allowed nomes de ossos permitidos (filtra influências cruzadas)
 * @param skeleton esqueleto alvo (mapeia bone → índice global)
 * @param radius  alcance máximo de influência (0 = ilimitado)
 */
export function applySkinWeights(
  geometry: THREE.BufferGeometry,
  segments: BoneSegment[],
  allowed: string[],
  skeleton?: THREE.Skeleton,
  radius = 0
): void {
  const allow = new Set(allowed.map(normBone));
  const segs = segments.filter((s) => allow.has(normBone(s.name)));
  // mapa bone.uuid → índice global no skeleton
  const globalIndex = new Map<string, number>();
  if (skeleton) {
    skeleton.bones.forEach((b, i) => globalIndex.set(b.uuid, i));
  } else {
    segments.forEach((s, i) => globalIndex.set(s.bone.uuid, i));
  }
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const count = pos.count;
  const skinIndices = new Uint16Array(count * 4);
  const skinWeights = new Float32Array(count * 4);

  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    p.fromBufferAttribute(pos, i);
    // top-4 por distância inversa ao quadrado
    const cand: { idx: number; w: number }[] = [];
    for (let s = 0; s < segs.length; s++) {
      const d = distToSegment(p, segs[s].a, segs[s].b);
      if (radius > 0 && d > radius) continue;
      cand.push({ idx: s, w: 1 / (d * d + 1e-5) });
    }
    cand.sort((a, b) => b.w - a.w);
    const top = cand.slice(0, 4);
    let sum = 0;
    top.forEach((c) => (sum += c.w));
    for (let k = 0; k < 4; k++) {
      if (k < top.length && sum > 0) {
        skinIndices[i * 4 + k] = globalIndex.get(segs[top[k].idx].bone.uuid) ?? 0;
        skinWeights[i * 4 + k] = top[k].w / sum;
      } else {
        skinIndices[i * 4 + k] = 0;
        skinWeights[i * 4 + k] = 0;
      }
    }
    // garante pelo menos um peso (evita vértice "solto")
    if (sum === 0 && segs.length > 0) {
      skinIndices[i * 4] = globalIndex.get(segs[0].bone.uuid) ?? 0;
      skinWeights[i * 4] = 1;
    }
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
}

/** Grupos de ossos permitidos por parte do corpo (nomes mixamorig:*) */
export const BONE_GROUPS = {
  torso: [
    'mixamorig:Hips',
    'mixamorig:Spine',
    'mixamorig:Spine1',
    'mixamorig:Spine2',
  ],
  neck: ['mixamorig:Spine2', 'mixamorig:Neck', 'mixamorig:Head'],
  armL: ['mixamorig:LeftArm', 'mixamorig:LeftForeArm', 'mixamorig:LeftHand'],
  armR: ['mixamorig:RightArm', 'mixamorig:RightForeArm', 'mixamorig:RightHand'],
  sleeveL: ['mixamorig:LeftShoulder', 'mixamorig:LeftArm'],
  sleeveR: ['mixamorig:RightShoulder', 'mixamorig:RightArm'],
  legL: ['mixamorig:LeftUpLeg', 'mixamorig:LeftLeg', 'mixamorig:LeftFoot'],
  legR: ['mixamorig:RightUpLeg', 'mixamorig:RightLeg', 'mixamorig:RightFoot'],
  pelvis: ['mixamorig:Hips', 'mixamorig:Spine'],
  skirt: [
    'mixamorig:Hips',
    'mixamorig:Spine',
    'mixamorig:LeftUpLeg',
    'mixamorig:RightUpLeg',
    'mixamorig:LeftLeg',
    'mixamorig:RightLeg',
  ],
  fullL: ['mixamorig:LeftUpLeg', 'mixamorig:LeftLeg'],
  fullR: ['mixamorig:RightUpLeg', 'mixamorig:RightLeg'],
} as const;
