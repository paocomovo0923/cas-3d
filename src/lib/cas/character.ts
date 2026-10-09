/**
 * CAS — Personagem sobre os modelos glTF reais (avakin_female/male)
 *
 * Os glTFs trazem as meshes skinned completas com morph targets nomeados:
 *
 *  - torso__torso_skinmesh        (tronco + braços; morphs: Ombro, Cintura…)
 *  - legs__legs_skinmesh          (morphs: Coxa, Panturrilha, Quadril…)
 *  - hands__hands_skinmesh
 *  - feet__feet_skinmesh
 *  - head__head_001_oval (F) / head__head_101_oval (M)
 *    (20 morphs: Formato da cabeça, Queixo X, nariz asa y…)
 *  - ears__ears_001_basicmesh (F) / .001 (M)
 *
 * Os clipes de animação vêm dos glTFs avakin_anims_* (F_idle, M_walking…)
 * e ligam aos ossos pelo nome (o GLTFLoader sanitiza "mixamorig:Hips" →
 * "mixamorigHips" tanto nos nós quanto nos tracks — bind direto).
 *
 * Features faciais procedurais (olhos, sobrancelhas, boca), cabelo,
 * óculos, acessórios e roupas são presos aos ossos como antes.
 */
import * as THREE from 'three';
import {
  collectBoneSegments,
  normBone,
  BONE_GROUPS,
  type BoneSegment,
} from './skinning';
import { AnimationController } from './animation';
import { defaultMorphValues, resolveMorphKey } from './morphs';
import type { MorphValues } from './types';
import { PART_NAMES, sphereAt, attachWorldAligned } from './geometryKit';
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

/** Fator de cabeça aplicado como escala do osso Head (afeta skinning do crânio) */
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
 * Remove os tracks de escala dos clipes (Mixamo exporta scale constante 1
 * para todos os ossos; sem isso a escala de idade do osso Head seria
 * sobrescrita a cada frame).
 */
function sanitizeClips(clips: THREE.AnimationClip[]): THREE.AnimationClip[] {
  return clips.map((c) => {
    const tracks = c.tracks.filter((t) => !t.name.endsWith('.scale'));
    return tracks.length === c.tracks.length
      ? c
      : new THREE.AnimationClip(c.name, c.duration, tracks);
  });
}

export class CASCharacter {
  readonly gender: Gender;
  readonly root: THREE.Group;
  readonly anim: AnimationController;
  private model: THREE.Group;
  private bind!: CharacterBind;
  /** chave interna → lista de (mesh, índice do target) no glTF */
  private morphBindings = new Map<string, { mesh: THREE.Mesh; idx: number }[]>();
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
    modelScene: THREE.Group,
    clips: THREE.AnimationClip[]
  ) {
    this.gender = gender;
    this.root = new THREE.Group();
    this.root.name = `sim_${gender}`;
    this.model = modelScene;

    // 1) orienta: no glTF a face já aponta para +Z (nariz em z positivo);
    //    nada a fazer — câmera fica em +Z
    this.model.rotation.y = 0;
    this.root.add(this.model);
    this.root.add(this.garmentGroup);

    // 2) apoia no chão e centraliza (bbox real das meshes em bind pose)
    this.model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.model);
    const c = box.getCenter(new THREE.Vector3());
    this.model.position.x -= c.x;
    this.model.position.z -= c.z;
    this.model.position.y -= box.min.y;
    this.model.updateMatrixWorld(true);

    // 3) material de pele unificado (tom de pele do CAS em todo o corpo)
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
      // decalque facial: renderiza sempre sobre a pele (o skinning do lábio
      // esculpido diverge levemente do osso Head durante as animações)
      depthTest: false,
      depthWrite: false,
    });
    this.model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = this.skinMat;
      m.castShadow = true;
      m.receiveShadow = false;
      m.frustumCulled = false;
    });

    // 4) pontos-chave do esqueleto (bind pose, mundo)
    const wp = (n: string) => this.bone(n).getWorldPosition(new THREE.Vector3());
    const hips = wp('Hips');
    const spine2 = wp('Spine2');
    const neck = wp('Neck');
    const head = wp('Head');
    const headTop = wp('HeadTop_End');
    const armL = wp('LeftArm');
    const armR = wp('RightArm');
    const foreL = wp('LeftForeArm');
    const foreR = wp('RightForeArm');
    const handL = wp('LeftHand');
    const handR = wp('RightHand');
    const upLegL = wp('LeftUpLeg');
    const upLegR = wp('RightUpLeg');
    const kneeL = wp('LeftLeg');
    const kneeR = wp('RightLeg');
    const footL = wp('LeftFoot');
    const footR = wp('RightFoot');
    const toeL = wp('LeftToeBase');
    const toeR = wp('RightToeBase');

    // 5) crânio real: raio pela extensão Y da mesh da cabeça; centro facial
    //    derivado do osso Head (o bbox em Z é enviesado pela parte de trás
    //    do crânio, o que afundaria as features faciais dentro do skull)
    const headMesh = this.findMesh('head');
    const headBox = new THREE.Box3().setFromObject(headMesh);
    const headR = Math.max((headBox.max.y - headBox.min.y) / 2, 0.06);
    const headCenter = new THREE.Vector3(
      head.x,
      head.y + (headTop.y - head.y) * 0.55,
      head.z
    );

    const torsoTopY = neck.y - (neck.y - hips.y) * 0.04;

    // 6) esqueleto compartilhado para as roupas procedurais
    const bones: THREE.Bone[] = [];
    this.model.traverse((o) => {
      if ((o as THREE.Bone).isBone) bones.push(o as THREE.Bone);
    });
    const skeleton = new THREE.Skeleton(bones);
    const segments = collectBoneSegments(this.model);

    this.bind = {
      gender,
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

    // 7) features faciais + grupos presos ao osso Head
    const headBone = this.bone('Head');
    this.headGroup = attachWorldAligned(headBone, headCenter);
    this.buildFace();
    this.headGroup.add(this.hairGroup);
    this.headGroup.add(this.glassesGroup);
    this.headGroup.add(this.accessoryGroup);

    // 8) bindings dos morph targets reais (por nome normalizado)
    this.collectMorphBindings();

    // 9) defaults (todos 0 — forma natural do modelo)
    this.setAllMorphs(defaultMorphValues());

    // 10) animações (tracks de escala removidos p/ preservar escala de idade)
    this.anim = new AnimationController(this.root, sanitizeClips(clips));
  }

  /* ---------------------------------------------------------------- */
  /* Busca de ossos / meshes                                          */
  /* ---------------------------------------------------------------- */

  private bone(name: string): THREE.Bone {
    const target = normBone(name);
    let found: THREE.Bone | undefined;
    this.model.traverse((o) => {
      if (found || !(o as THREE.Bone).isBone) return;
      const n = normBone(o.name);
      if (n === target || n.endsWith(target)) found = o as THREE.Bone;
    });
    if (!found) throw new Error(`Osso não encontrado: ${name}`);
    return found;
  }

  private findMesh(namePart: string): THREE.Mesh {
    let found: THREE.Mesh | undefined;
    this.model.traverse((o) => {
      if (found) return;
      const m = o as THREE.Mesh;
      if (m.isMesh && normBone(m.name).toLowerCase().includes(namePart.toLowerCase())) {
        found = m;
      }
    });
    if (!found) throw new Error(`Mesh não encontrada: ${namePart}`);
    return found;
  }

  /* ---------------------------------------------------------------- */
  /* Morph targets                                                    */
  /* ---------------------------------------------------------------- */

  private collectMorphBindings(): void {
    this.model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.morphTargetInfluences || !m.morphTargetDictionary) return;
      for (const [rawName, idx] of Object.entries(m.morphTargetDictionary)) {
        const key = resolveMorphKey(rawName);
        if (!key) continue;
        const list = this.morphBindings.get(key) ?? [];
        list.push({ mesh: m, idx });
        this.morphBindings.set(key, list);
      }
    });
  }

  setMorph(key: string, value: number): void {
    const list = this.morphBindings.get(key);
    if (!list) return;
    for (const { mesh, idx } of list) {
      if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[idx] = value;
    }
  }

  setAllMorphs(values: MorphValues): void {
    for (const [k, v] of Object.entries(values)) this.setMorph(k, v);
  }

  /* ---------------------------------------------------------------- */
  /* Face procedural (olhos, sobrancelhas, boca)                      */
  /* ---------------------------------------------------------------- */

  private buildFace(): void {
    const { headR: R, headCenter: C } = this.bind;

    const eyeWhite = new THREE.MeshStandardMaterial({ color: '#fbfbfb', roughness: 0.3 });
    for (const sx of [-1, 1]) {
      const eyePos = C.clone().add(new THREE.Vector3(sx * R * 0.34, R * 0.15, R * 0.75));
      const eye = new THREE.Mesh(sphereAt(new THREE.Vector3(0, 0, 0), R * 0.17, [1, 1.06, 0.62], 18), eyeWhite);
      attachWorldAligned(this.headGroup, eyePos).add(eye);
      const irisPos = eyePos.clone().add(new THREE.Vector3(sx * R * 0.02, 0, R * 0.09));
      const iris = new THREE.Mesh(sphereAt(new THREE.Vector3(0, 0, 0), R * 0.085, [1, 1, 0.5], 14), this.irisMat);
      attachWorldAligned(this.headGroup, irisPos).add(iris);
      const pupilPos = eyePos.clone().add(new THREE.Vector3(sx * R * 0.02, 0, R * 0.11));
      const pupil = new THREE.Mesh(sphereAt(new THREE.Vector3(0, 0, 0), R * 0.042, [1, 1, 0.45], 10), new THREE.MeshStandardMaterial({ color: '#17181a', roughness: 0.2 }));
      attachWorldAligned(this.headGroup, pupilPos).add(pupil);

      /* sobrancelhas */
      const browGeo = new THREE.BoxGeometry(R * 0.3, R * 0.055, R * 0.07);
      const brow = new THREE.Mesh(browGeo, this.browMat);
      const browObj = attachWorldAligned(
        this.headGroup,
        C.clone().add(new THREE.Vector3(sx * R * 0.36, R * 0.35, R * 0.83)),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -sx * 0.25, sx * 0.1))
      );
      browObj.add(brow);
    }

    /* boca — tubo ao longo de curva que segue os lábios esculpidos
       (perfil medido por raycast: cantos ~0.86R, centro ~0.91R) */
    const mouthCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-R * 0.17, -R * 0.40, R * 0.85),
      new THREE.Vector3(-R * 0.09, -R * 0.47, R * 0.89),
      new THREE.Vector3(0, -R * 0.50, R * 0.91),
      new THREE.Vector3(R * 0.09, -R * 0.47, R * 0.89),
      new THREE.Vector3(R * 0.17, -R * 0.40, R * 0.85),
    ]);
    const mouth = new THREE.Mesh(
      new THREE.TubeGeometry(mouthCurve, 16, R * 0.035, 8, false),
      this.mouthMat
    );
    mouth.renderOrder = 10; // sempre sobre a pele
    const mouthObj = attachWorldAligned(
      this.headGroup,
      C.clone()
    );
    mouthObj.add(mouth);

    void PART_NAMES; // nomes canônicos mantidos na spec; meshes reais vêm do glTF
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
    this.root.scale.setScalar(AGE_SCALE[age]);
    // escala de cabeça grande (bebê/criança) direto no osso Head:
    // os tracks de escala foram removidos dos clipes, então persiste
    this.bone('Head').scale.setScalar(AGE_HEAD[age]);
  }

  /** posição do centro da cabeça no mundo (para câmera detalhe/hotspots) */
  headWorldPos(out = new THREE.Vector3()): THREE.Vector3 {
    return this.headGroup.getWorldPosition(out);
  }

  /** raio do crânio real (escala de idade aplicada por root.scale) */
  get headRadius(): number {
    return this.bind.headR;
  }

  /** aproximação da altura total (para câmera corpo inteiro) */
  height(): number {
    return this.bind.headTop.y + this.bind.headR * 0.15;
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
    });
    this.skinMat.dispose();
    this.irisMat.dispose();
    this.browMat.dispose();
    this.mouthMat.dispose();
  }
}
