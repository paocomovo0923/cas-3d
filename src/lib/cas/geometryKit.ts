/**
 * CAS — Kit de geometria procedural
 *
 * Utilitários para construir o corpo do Sim a partir das posições
 * dos ossos do rig (bind pose), incluindo cápsulas entre ossos,
 * espelhos de geometria (orelha esquerda/direita) e fixação rígida
 * de objetos a ossos com orientação alinhada ao mundo no bind.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Nomes das meshes exigidos pela especificação glTF */
export const PART_NAMES = {
  torso: 'torso__torso_skin',
  pelvis: 'torso__torso_skin.001',
  legs: 'legs__legs_skinmeshAction',
  arms: 'arms__arms_skin',
  shoulders: 'shoulders__shoulders_skin',
  neck: 'neck__neck_skin',
  headF: 'head__head_001_oval',
  headM: 'head__head_101_oval',
  nose: 'nariz__nariz_base',
  earF: 'ears__ears_001_basic',
  earFL: 'ears__ears_001_basic_L',
  earM: 'ears__ears_001_basic.001',
  earML: 'ears__ears_001_basic.001_L',
} as const;

/** Cápsula (cilindro + calotas esféricas) entre dois pontos, no espaço do bind. */
export function capsuleBetween(
  a: THREE.Vector3,
  b: THREE.Vector3,
  rA: number,
  rB: number,
  radial = 18
): THREE.BufferGeometry {
  const dir = b.clone().sub(a);
  const len = Math.max(dir.length(), 1e-4);
  const shaft = new THREE.CylinderGeometry(rB, rA, len, radial, 1, false);
  const capA = new THREE.SphereGeometry(rA, radial, 10);
  const capB = new THREE.SphereGeometry(rB, radial, 10);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize()
  );
  const m = new THREE.Matrix4().compose(mid, quat, new THREE.Vector3(1, 1, 1));
  shaft.applyMatrix4(m);
  capA.translate(a.x, a.y, a.z);
  capB.translate(b.x, b.y, b.z);
  return mergeGeometries([shaft, capA, capB], false) as THREE.BufferGeometry;
}

/** Esfera posicionada (e opcionalmente escalada não-uniformemente). */
export function sphereAt(
  pos: THREE.Vector3,
  r: number,
  scale: [number, number, number] = [1, 1, 1],
  seg = 22
): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75));
  g.scale(scale[0], scale[1], scale[2]);
  g.translate(pos.x, pos.y, pos.z);
  return g;
}

/** Junta várias geometrias (todas com os mesmos atributos). */
export function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  return mergeGeometries(parts, false) as THREE.BufferGeometry;
}

/**
 * Espelha a geometria no plano YZ (X → -X) corrigindo winding,
 * normais e morph targets. Usada para a orelha esquerda.
 */
export function mirrorGeometry(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = src.clone();
  g.scale(-1, 1, 1);
  const idx = g.getIndex();
  if (idx) {
    const arr = idx.array;
    for (let i = 0; i < arr.length; i += 3) {
      const t = arr[i];
      arr[i] = arr[i + 1];
      arr[i + 1] = t;
    }
  }
  // espelha morph attributes de posição
  const morphs = g.morphAttributes.position;
  if (morphs) {
    for (const attr of morphs) {
      const a = attr.array as Float32Array;
      for (let i = 0; i < a.length; i += 3) a[i] = -a[i];
    }
  }
  g.computeVertexNormals();
  return g;
}

/**
 * Anexa um Object3D a um osso de modo que, no bind pose, ele fique
 * exatamente em `worldPos` com orientação `worldQuat` (alinhada ao mundo).
 * Depois disso o objeto acompanha rigidamente a rotação do osso.
 */
export function attachWorldAligned(
  parent: THREE.Object3D,
  worldPos: THREE.Vector3,
  worldQuat: THREE.Quaternion = new THREE.Quaternion()
): THREE.Object3D {
  // garante que parent.matrixWorld está atualizado (pais + próprio)
  parent.updateWorldMatrix(true, false);
  const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
  const local = inv.multiply(
    new THREE.Matrix4().compose(worldPos, worldQuat, new THREE.Vector3(1, 1, 1))
  );
  const obj = new THREE.Object3D();
  obj.quaternion.setFromRotationMatrix(local);
  obj.position.setFromMatrixPosition(local);
  parent.add(obj);
  return obj;
}

/** Matriz identidade compartilhada para bind (evita recálculo de boneInverses) */
const IDENTITY_BIND = new THREE.Matrix4();

/** Cria um SkinnedMesh já ligado ao esqueleto (bind na origem do mundo). */
export function skinnedFromGeometry(
  geo: THREE.BufferGeometry,
  skeleton: THREE.Skeleton,
  material: THREE.Material,
  name: string
): THREE.SkinnedMesh {
  const mesh = new THREE.SkinnedMesh(geo, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  // bindMatrix explícito: sem isso, bind() recalcula skeleton.calculateInverses()
  // com a pose ATUAL dos ossos (corrompendo o bind compartilhado do personagem)
  mesh.bind(skeleton, IDENTITY_BIND);
  return mesh;
}

/** Perfil de revolução (LatheGeometry) com achatamento em Z (tronco elíptico). */
export function latheTorso(
  profile: [number, number][],
  zSquash = 0.66,
  segments = 26
): THREE.BufferGeometry {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001), y));
  const g = new THREE.LatheGeometry(pts, segments);
  g.scale(1, 1, zSquash);
  g.computeVertexNormals();
  return g;
}

/** Proporções estilizadas do corpo (metros, personagem ~1,65 m). */
export const PROPORTIONS = {
  headScaleBoneToTop: 0.95, // raio do crânio a partir de Head→HeadTop_End
  headCartoon: 1.14, // exagero cartunesco de cabeça
  upperArm: [0.05, 0.042] as const,
  foreArm: [0.041, 0.035] as const,
  thigh: [0.07, 0.058] as const,
  calf: [0.054, 0.042] as const,
  foot: 0.046,
  hand: 0.042,
  shoulder: 0.058,
  neck: [0.048, 0.054] as const,
  torsoProfile: [
    [0.125, 0.0], // quadril
    [0.113, 0.16],
    [0.108, 0.34], // cintura
    [0.128, 0.62], // tórax
    [0.124, 0.82], // peito alto
    [0.095, 0.95],
    [0.056, 1.0], // base do pescoço
  ] as const,
  maleTorsoBoost: 1.09,
  maleLimbBoost: 1.06,
};
