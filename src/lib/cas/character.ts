/**
 * CAS — Personagem procedural sobre o rig glTF
 *
 * Os GLBs enviados (avakin_anims_female/male.glb) contêm apenas o
 * esqueleto mixamorig + os clips de animação. Esta classe constrói o
 * corpo/rosto proceduralmente sobre os ossos do rig, calcula skinning
 * automático e registra as morph targets nomeadas conforme a spec:
 *
 *  - torso__torso_skin        (morph: ombro)
 *  - torso__torso_skin.001    (pelve)
 *  - legs__legs_skinmeshAction
 *  - head__head_001_oval (F) / head__head_101_oval (M)
 *    (morphs: formato_da_cabeca, cabeca_largura, cabeca_altura, queixo,
 *     queixo_x, queixo_y, bochecha*, mandibula_*)
 *  - nariz__nariz_base (morphs: nariz*, nariz_asa_*, nariz_dorso…)
 *  - ears__ears_001_basic (F) / ears__ears_001_basic.001 (M)
 *    (morphs: orelha_grande, orelha_pontuda, orelha_colada)
 */
import * as THREE from 'three';
import {
  applySkinWeights,
  collectBoneSegments,
  normBone,
  BONE_GROUPS,
  type BoneSegment,
} from './skinning';
import { AnimationController } from './animation';
import {
  headMorphTargets,
  noseMorphTargets,
  earMorphTargets,
  torsoMorphTargets,
  MORPH_ORDER,
  defaultMorphValues,
} from './morphs';
import type { MorphValues } from './types';
import {
  PART_NAMES,
  PROPORTIONS,
  capsuleBetween,
  sphereAt,
  mergeParts,
  mirrorGeometry,
  attachWorldAligned,
  latheTorso,
} from './geometryKit';
import {
  buildHair,
  buildGlasses,
  buildAccessory,
  buildGarments,
  type GarmentSlot,
} from './catalog';
import type { AgeId, CharacterLook, Gender } from './types';

export interface CharacterBind {
  gender: Gender;
  skeleton: THREE.Skeleton;
  segments: BoneSegment[];
  hips: THREE.Vector3;
  spine2: THREE.Vector3;
  neck: THREE.Vector3;
  head: THREE.Vector3;
  headTop: THREE.Vector3;
  armL: THREE.Vector3;
  armR: THREE.Vector3;
  foreL: THREE.Vector3;
  foreR: THREE.Vector3;
  handL: THREE.Vector3;
  handR: THREE.Vector3;
  upLegL: THREE.Vector3;
  upLegR: THREE.Vector3;
  kneeL: THREE.Vector3;
  kneeR: THREE.Vector3;
  footL: THREE.Vector3;
  footR: THREE.Vector3;
  toeL: THREE.Vector3;
  toeR: THREE.Vector3;
  headCenter: THREE.Vector3;
  headR: number;
  torsoTopY: number;
}

const AGE_SCALE: Record<AgeId, number> = {
  bebe: 0.52,
  crianca: 0.68,
  adolescente: 0.85,
  jovem_adulto: 1,
  adulto: 1.04,
  idoso: 0.97,
};

const AGE_HEAD: Record<AgeId, number> = {
  bebe: 1.42,
  crianca: 1.22,
  adolescente: 1.06,
  jovem_adulto: 1,
  adulto: 1,
  idoso: 0.98,
};

/** Matriz identidade para bind — impede recálculo dos boneInverses */
const BIND_IDENTITY = new THREE.Matrix4();

/**
 * Converte a hierarquia do rig (Object3D comuns, pois os GLBs não têm
 * skins → GLTFLoader não cria THREE.Bone) em uma hierarquia de Bones
 * reais preservando nomes e transformações. Necessário para skinning
 * e para que os tracks do AnimationMixer encontrem os ossos.
 */
function convertRigToBones(rigRoot: THREE.Object3D): THREE.Object3D {
  const cloneInto = (src: THREE.Object3D, parent: THREE.Object3D) => {
    const bone = new THREE.Bone();
    bone.name = src.name;
    bone.position.copy(src.position);
    bone.quaternion.copy(src.quaternion);
    bone.scale.copy(src.scale);
    parent.add(bone);
    for (const child of [...src.children]) cloneInto(child, bone);
    return bone;
  };
  const newRoot = new THREE.Object3D();
  newRoot.name = rigRoot.name;
  newRoot.position.copy(rigRoot.position);
  newRoot.quaternion.copy(rigRoot.quaternion);
  newRoot.scale.copy(rigRoot.scale);
  for (const child of [...rigRoot.children]) cloneInto(child, newRoot);
  return newRoot;
}

export class CASCharacter {
  readonly gender: Gender;
  readonly root: THREE.Group;
  readonly anim: AnimationController;
  private rig: THREE.Object3D;
  private bind!: CharacterBind;
  private morphMeshes: {
    head?: THREE.Mesh;
    nose?: THREE.Mesh;
    ears: THREE.Mesh[];
    torso?: THREE.Mesh;
  } = { ears: [] };
  private headGroup!: THREE.Object3D;
  private garmentGroup = new THREE.Group();
  private hairGroup = new THREE.Group();
  private glassesGroup = new THREE.Group();
  private accessoryGroup = new THREE.Group();

  skinMat: THREE.MeshStandardMaterial;
  irisMat: THREE.MeshStandardMaterial;
  browMat: THREE.MeshStandardMaterial;
  mouthMat: THREE.MeshStandardMaterial;

  constructor(
    gender: Gender,
    rigScene: THREE.Object3D,
    clips: THREE.AnimationClip[]
  ) {
    this.gender = gender;
    this.root = new THREE.Group();
    this.root.name = `sim_${gender}`;
    this.rig = convertRigToBones(rigScene);
    this.root.add(this.rig);
    this.root.add(this.garmentGroup);

    this.skinMat = new THREE.MeshStandardMaterial({
      color: '#e8b98f',
      roughness: 0.62,
      metalness: 0.02,
    });
    this.irisMat = new THREE.MeshStandardMaterial({ color: '#4c6b3c', roughness: 0.25 });
    this.browMat = new THREE.MeshStandardMaterial({ color: '#3d2b20', roughness: 0.7 });
    this.mouthMat = new THREE.MeshStandardMaterial({
      color: '#b96b62',
      roughness: 0.5,
    });

    this.build();
    this.anim = new AnimationController(this.root, clips);
  }

  /* ---------------------------------------------------------------- */
  /* Construção                                                       */
  /* ---------------------------------------------------------------- */

  private bone(name: string): THREE.Bone {
    const target = normBone(name);
    let found: THREE.Bone | undefined;
    this.rig.traverse((o) => {
      if (found || !(o as THREE.Bone).isBone) return;
      if (normBone(o.name) === target) found = o as THREE.Bone;
    });
    if (!found) throw new Error(`Osso não encontrado: ${name}`);
    return found;
  }

  private build(): void {
    const g = this.gender;
    // 1) orienta o rig para +Z (exports do Blender vêm virados ~90°)
    this.rig.rotation.y = Math.PI / 2;
    // 2) centraliza e apoia o rig no chão
    this.rig.updateMatrixWorld(true);
    const box = new THREE.Box3();
    this.rig.traverse((o) => {
      if ((o as THREE.Bone).isBone) box.expandByPoint(o.getWorldPosition(new THREE.Vector3()));
    });
    const c = box.getCenter(new THREE.Vector3());
    this.rig.position.x -= c.x;
    this.rig.position.z -= c.z;
    this.rig.position.y -= box.min.y;
    this.rig.updateMatrixWorld(true);

    // 2) pontos-chave do esqueleto
    const wp = (n: string) => this.bone(n).getWorldPosition(new THREE.Vector3());
    const hips = wp('mixamorig:Hips');
    const spine2 = wp('mixamorig:Spine2');
    const neck = wp('mixamorig:Neck');
    const head = wp('mixamorig:Head');
    const headTop = wp('mixamorig:HeadTop_End');
    const armL = wp('mixamorig:LeftArm');
    const armR = wp('mixamorig:RightArm');
    const foreL = wp('mixamorig:LeftForeArm');
    const foreR = wp('mixamorig:RightForeArm');
    const handL = wp('mixamorig:LeftHand');
    const handR = wp('mixamorig:RightHand');
    const upLegL = wp('mixamorig:LeftUpLeg');
    const upLegR = wp('mixamorig:RightUpLeg');
    const kneeL = wp('mixamorig:LeftLeg');
    const kneeR = wp('mixamorig:RightLeg');
    const footL = wp('mixamorig:LeftFoot');
    const footR = wp('mixamorig:RightFoot');
    const toeL = wp('mixamorig:LeftToeBase');
    const toeR = wp('mixamorig:RightToeBase');

    const headR =
      head.distanceTo(headTop) * PROPORTIONS.headScaleBoneToTop * PROPORTIONS.headCartoon;
    const headCenter = head.clone().add(new THREE.Vector3(0, headR * 0.82, 0.012));

    const torsoTopY = neck.y - (neck.y - hips.y) * 0.04;

    // 3) esqueleto + segmentos para skinning
    const bones: THREE.Bone[] = [];
    this.rig.traverse((o) => {
      if ((o as THREE.Bone).isBone) bones.push(o as THREE.Bone);
    });
    const skeleton = new THREE.Skeleton(bones);
    const segments = collectBoneSegments(this.rig);

    this.bind = {
      gender: g,
      skeleton,
      segments,
      hips,
      spine2,
      neck,
      head,
      headTop,
      armL,
      armR,
      foreL,
      foreR,
      handL,
      handR,
      upLegL,
      upLegR,
      kneeL,
      kneeR,
      footL,
      footR,
      toeL,
      toeR,
      headCenter,
      headR,
      torsoTopY,
    };

    const mb = g === 'M' ? PROPORTIONS.maleTorsoBoost : 1;
    const ml = g === 'M' ? PROPORTIONS.maleLimbBoost : 1;

    /* ---------- TRONCO (torso__torso_skin, morph ombro) ---------- */
    const hipsToNeck = neck.y - hips.y;
    const profile = PROPORTIONS.torsoProfile.map(([r, f]) => [
      r * mb,
      hips.y + f * hipsToNeck,
    ]) as [number, number][];
    const torsoGeo = latheTorso(profile);
    torsoMorphTargets(torsoGeo);
    applySkinWeights(torsoGeo, segments, [...BONE_GROUPS.torso], skeleton);
    const torso = new THREE.SkinnedMesh(torsoGeo, this.skinMat);
    torso.name = PART_NAMES.torso;
    torso.castShadow = true;
    torso.morphTargetInfluences = new Array(MORPH_ORDER.torso.length).fill(0);
    torso.bind(skeleton, BIND_IDENTITY);
    this.root.add(torso);
    this.morphMeshes.torso = torso;

    /* ---------- PELVE (torso__torso_skin.001) ---------- */
    const pelvisGeo = sphereAt(hips.clone().add(new THREE.Vector3(0, -0.02, 0)), 0.128 * mb, [1, 0.84, 0.74]);
    applySkinWeights(pelvisGeo, segments, [...BONE_GROUPS.pelvis], skeleton);
    const pelvis = new THREE.SkinnedMesh(pelvisGeo, this.skinMat);
    pelvis.name = PART_NAMES.pelvis;
    pelvis.castShadow = true;
    pelvis.bind(skeleton, BIND_IDENTITY);
    this.root.add(pelvis);

    /* ---------- OMBROS ---------- */
    const shoulderParts: THREE.BufferGeometry[] = [];
    for (const [arm, side] of [
      [armL, 'L'],
      [armR, 'R'],
    ] as const) {
      const sGeo = sphereAt(arm, PROPORTIONS.shoulder * mb, [1.18, 0.88, 0.98]);
      const allow =
        side === 'L'
          ? ['mixamorig:Spine2', 'mixamorig:LeftShoulder', 'mixamorig:LeftArm']
          : ['mixamorig:Spine2', 'mixamorig:RightShoulder', 'mixamorig:RightArm'];
      applySkinWeights(sGeo, segments, allow, skeleton);
      shoulderParts.push(sGeo);
    }
    const shoulders = new THREE.SkinnedMesh(mergeParts(shoulderParts), this.skinMat);
    shoulders.name = PART_NAMES.shoulders;
    shoulders.castShadow = true;
    shoulders.bind(skeleton, BIND_IDENTITY);
    this.root.add(shoulders);

    /* ---------- PERNAS (legs__legs_skinmeshAction) ---------- */
    const legParts: THREE.BufferGeometry[] = [];
    for (const [up, knee, foot, toe, grp] of [
      [upLegL, kneeL, footL, toeL, 'legL'],
      [upLegR, kneeR, footR, toeR, 'legR'],
    ] as const) {
      const thigh = capsuleBetween(up, knee, PROPORTIONS.thigh[0] * ml, PROPORTIONS.thigh[1] * ml);
      const calf = capsuleBetween(knee, foot, PROPORTIONS.calf[0] * ml, PROPORTIONS.calf[1] * ml);
      const footUp = foot.clone().add(new THREE.Vector3(0, 0.035, 0));
      const toePt = toe.clone().add(new THREE.Vector3(0, 0.02, 0));
      const shoe = capsuleBetween(footUp, toePt, PROPORTIONS.foot * ml, PROPORTIONS.foot * 0.82 * ml, 14);
      shoe.scale(1.12, 0.9, 1.18);
      const leg = mergeParts([thigh, calf, shoe]);
      applySkinWeights(leg, segments, [...BONE_GROUPS[grp]], skeleton);
      legParts.push(leg);
    }
    const legsGeo = mergeParts(legParts);
    const legs = new THREE.SkinnedMesh(legsGeo, this.skinMat);
    legs.name = PART_NAMES.legs;
    legs.castShadow = true;
    legs.bind(skeleton, BIND_IDENTITY);
    this.root.add(legs);

    /* ---------- BRAÇOS (arms__arms_skin) ---------- */
    const armParts: THREE.BufferGeometry[] = [];
    for (const [arm, fore, hand, grp] of [
      [armL, foreL, handL, 'armL'],
      [armR, foreR, handR, 'armR'],
    ] as const) {
      const upper = capsuleBetween(arm, fore, PROPORTIONS.upperArm[0] * ml, PROPORTIONS.upperArm[1] * ml);
      const lower = capsuleBetween(fore, hand, PROPORTIONS.foreArm[0] * ml, PROPORTIONS.foreArm[1] * ml);
      const handDir = hand.clone().sub(fore).normalize().multiplyScalar(0.025);
      const palm = sphereAt(hand.clone().add(handDir), PROPORTIONS.hand * ml, [0.82, 1.2, 0.62]);
      const a = mergeParts([upper, lower, palm]);
      applySkinWeights(a, segments, [...BONE_GROUPS[grp]], skeleton);
      armParts.push(a);
    }
    const arms = new THREE.SkinnedMesh(mergeParts(armParts), this.skinMat);
    arms.name = PART_NAMES.arms;
    arms.castShadow = true;
    arms.bind(skeleton, BIND_IDENTITY);
    this.root.add(arms);

    /* ---------- PESCOÇO ---------- */
    const neckTop = head.clone().add(new THREE.Vector3(0, -headR * 0.25, 0));
    const neckGeo = capsuleBetween(
      spine2.clone().add(new THREE.Vector3(0, (neck.y - spine2.y) * 0.35, 0)),
      neckTop,
      PROPORTIONS.neck[0],
      PROPORTIONS.neck[1]
    );
    applySkinWeights(neckGeo, segments, [...BONE_GROUPS.neck], skeleton);
    const neckMesh = new THREE.SkinnedMesh(neckGeo, this.skinMat);
    neckMesh.name = PART_NAMES.neck;
    neckMesh.castShadow = true;
    neckMesh.bind(skeleton, BIND_IDENTITY);
    this.root.add(neckMesh);

    /* ---------- CABEÇA + ROSTO (rígidos no osso Head) ---------- */
    const headBone = this.bone('mixamorig:Head');
    this.headGroup = attachWorldAligned(headBone, headCenter);

    const headGeo = new THREE.SphereGeometry(1, 48, 36);
    headMorphTargets(headGeo);
    const headMesh = new THREE.Mesh(headGeo, this.skinMat);
    headMesh.name = g === 'F' ? PART_NAMES.headF : PART_NAMES.headM;
    headMesh.scale.set(this.bind.headR, this.bind.headR * 1.07, this.bind.headR * 1.04);
    headMesh.castShadow = true;
    headMesh.morphTargetInfluences = new Array(MORPH_ORDER.head.length).fill(0);
    this.headGroup.add(headMesh);
    this.morphMeshes.head = headMesh;

    this.buildFace();
    this.headGroup.add(this.hairGroup);
    this.headGroup.add(this.glassesGroup);
    this.headGroup.add(this.accessoryGroup);

    // aplica defaults dos morphs
    this.setAllMorphs(defaultMorphValues());
  }

  private buildFace(): void {
    const { headR: R, headCenter: C } = this.bind;

    /* olhos */
    const eyeWhite = new THREE.MeshStandardMaterial({ color: '#fbfbfb', roughness: 0.3 });
    for (const sx of [-1, 1]) {
      const eyePos = C.clone().add(new THREE.Vector3(sx * R * 0.34, R * 0.06, R * 0.97));
      const eye = new THREE.Mesh(sphereAt(new THREE.Vector3(0, 0, 0), R * 0.17, [1, 1.06, 0.62], 18), eyeWhite);
      attachWorldAligned(this.headGroup, eyePos).add(eye);
      const irisPos = eyePos.clone().add(new THREE.Vector3(sx * R * 0.02, 0, R * 0.12));
      const iris = new THREE.Mesh(sphereAt(new THREE.Vector3(0, 0, 0), R * 0.085, [1, 1, 0.5], 14), this.irisMat);
      attachWorldAligned(this.headGroup, irisPos).add(iris);
      const pupilPos = eyePos.clone().add(new THREE.Vector3(sx * R * 0.02, 0, R * 0.14));
      const pupil = new THREE.Mesh(sphereAt(new THREE.Vector3(0, 0, 0), R * 0.042, [1, 1, 0.45], 10), new THREE.MeshStandardMaterial({ color: '#17181a', roughness: 0.2 }));
      attachWorldAligned(this.headGroup, pupilPos).add(pupil);

      /* sobrancelhas */
      const browGeo = new THREE.BoxGeometry(R * 0.3, R * 0.055, R * 0.07);
      const brow = new THREE.Mesh(browGeo, this.browMat);
      const browObj = attachWorldAligned(
        this.headGroup,
        C.clone().add(new THREE.Vector3(sx * R * 0.36, R * 0.28, R * 0.95)),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -sx * 0.25, sx * 0.1))
      );
      browObj.add(brow);
    }

    /* boca — arco sorridente */
    const mouthGeo = new THREE.TorusGeometry(R * 0.16, R * 0.033, 8, 20, Math.PI);
    const mouth = new THREE.Mesh(mouthGeo, this.mouthMat);
    mouth.rotation.z = Math.PI; // vira o arco para baixo (sorriso)
    const mouthObj = attachWorldAligned(
      this.headGroup,
      C.clone().add(new THREE.Vector3(0, -R * 0.45, R * 0.93)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.36, 0, 0))
    );
    mouthObj.add(mouth);

    /* nariz (nariz__nariz_base) com morphs */
    const noseGeo = new THREE.SphereGeometry(1, 24, 18);
    noseGeo.scale(0.34, 0.52, 0.4);
    noseMorphTargets(noseGeo);
    const nose = new THREE.Mesh(noseGeo, this.skinMat);
    nose.name = PART_NAMES.nose;
    nose.scale.setScalar(R * 0.56);
    nose.morphTargetInfluences = new Array(MORPH_ORDER.nose.length).fill(0);
    const noseObj = attachWorldAligned(
      this.headGroup,
      C.clone().add(new THREE.Vector3(0, -R * 0.24, R * 0.9))
    );
    noseObj.add(nose);
    noseObj.rotation.x = -0.16;
    this.morphMeshes.nose = nose;

    /* orelhas com morphs — canonical = direita (+X para fora) */
    const earBase = new THREE.SphereGeometry(1, 20, 14);
    earBase.scale(0.24, 0.52, 0.36);
    earMorphTargets(earBase);
    const earRGeo = earBase;
    const earLGeo = mirrorGeometry(earBase);

    const earNames =
      this.gender === 'F'
        ? [PART_NAMES.earF, PART_NAMES.earFL]
        : [PART_NAMES.earM, PART_NAMES.earML];

    for (const [sx, geo, name] of [
      [1, earRGeo, earNames[0]],
      [-1, earLGeo, earNames[1]],
    ] as const) {
      const ear = new THREE.Mesh(geo, this.skinMat);
      ear.name = name;
      ear.scale.setScalar(R * 0.78);
      ear.morphTargetInfluences = new Array(MORPH_ORDER.ears.length).fill(0);
      const obj = attachWorldAligned(
        this.headGroup,
        C.clone().add(new THREE.Vector3(sx * R * 0.9, -R * 0.04, -R * 0.02)),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sx * -0.38, 0))
      );
      obj.add(ear);
      this.morphMeshes.ears.push(ear);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Morph targets                                                    */
  /* ---------------------------------------------------------------- */

  setMorph(key: string, value: number): void {
    const hi = MORPH_ORDER.head.indexOf(key);
    if (hi >= 0 && this.morphMeshes.head) {
      this.morphMeshes.head.morphTargetInfluences[hi] = value;
      return;
    }
    const ni = MORPH_ORDER.nose.indexOf(key);
    if (ni >= 0 && this.morphMeshes.nose) {
      this.morphMeshes.nose.morphTargetInfluences[ni] = value;
      return;
    }
    const ei = MORPH_ORDER.ears.indexOf(key);
    if (ei >= 0) {
      for (const ear of this.morphMeshes.ears) ear.morphTargetInfluences[ei] = value;
      return;
    }
    const ti = MORPH_ORDER.torso.indexOf(key);
    if (ti >= 0 && this.morphMeshes.torso) {
      this.morphMeshes.torso.morphTargetInfluences[ti] = value;
    }
  }

  setAllMorphs(values: MorphValues): void {
    for (const [k, v] of Object.entries(values)) this.setMorph(k, v);
  }

  /* ---------------------------------------------------------------- */
  /* Aparência (look)                                                 */
  /* ---------------------------------------------------------------- */

  setSkinTone(hex: string): void {
    this.skinMat.color.set(hex);
  }

  setEyeColor(hex: string): void {
    this.irisMat.color.set(hex);
  }

  setHairColorOnBrows(hex: string): void {
    this.browMat.color.set(hex);
  }

  applyLook(look: CharacterLook): void {
    this.setSkinTone(look.skinTone);
    this.setEyeColor(look.eyeColor);
    this.setHairColorOnBrows(look.hairColor);

    this.clearGroup(this.hairGroup);
    if (look.hair !== 'careca') {
      const hair = buildHair(this.bind, look.hair, look.hairColor);
      this.hairGroup.add(hair);
    }

    this.clearGroup(this.glassesGroup);
    if (look.glasses !== 'sem_oculos') {
      const gl = buildGlasses(this.bind, look.glasses, look.glassesColor);
      this.glassesGroup.add(gl);
    }

    this.clearGroup(this.accessoryGroup);
    if (look.accessory !== 'sem_acessorio') {
      const acc = buildAccessory(this.bind, look.accessory, look.accessoryColor);
      this.accessoryGroup.add(acc);
    }

    this.clearGroup(this.garmentGroup);
    // corpo inteiro substitui top/baixo
    if (look.fullBody !== 'nenhum') {
      const meshes = buildGarments(this.bind, 'fullbody', look.fullBody, look.fullBodyColor);
      for (const m of meshes) this.garmentGroup.add(m);
    } else {
      if (look.top !== 'sem_top') {
        const meshes = buildGarments(this.bind, 'top', look.top, look.topColor);
        for (const m of meshes) this.garmentGroup.add(m);
      }
      if (look.bottom !== 'nenhum') {
        const meshes = buildGarments(this.bind, 'bottom', look.bottom, look.bottomColor);
        for (const m of meshes) this.garmentGroup.add(m);
      }
    }
  }

  private clearGroup(gr: THREE.Group): void {
    for (const child of [...gr.children]) {
      child.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      gr.remove(child);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Idade / escala                                                   */
  /* ---------------------------------------------------------------- */

  setAge(age: AgeId): void {
    const s = AGE_SCALE[age];
    this.root.scale.setScalar(s);
    this.headGroup.scale.setScalar(AGE_HEAD[age]);
  }

  /** posição do centro da cabeça no mundo (para câmera detalhe/hotspots) */
  headWorldPos(out = new THREE.Vector3()): THREE.Vector3 {
    return this.headGroup.getWorldPosition(out);
  }

  /** raio do crânio (escala de idade aplicada por root.scale) */
  get headRadius(): number {
    return this.bind.headR;
  }

  /** aproximação da altura total (para câmera corpo inteiro) */
  height(): number {
    return this.bind.headTop.y - 0 + this.bind.headR * 1.15;
  }

  setActive(active: boolean): void {
    this.root.visible = active;
    this.anim.setTimeScale(active ? 1 : 0);
  }

  dispose(): void {
    this.anim.dispose();
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) mat.dispose();
    });
  }
}
