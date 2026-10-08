/**
 * CAS — Motor 3D (cena estúdio, câmeras, personagens, animações)
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CASCharacter } from './character';
import { HotspotManager } from './hotspots';
import type { CameraMode, EngineEvents, Gender, MorphValues, CharacterLook, AgeId } from './types';

const MODELS = {
  F: '/models/avakin_anims_female.glb',
  M: '/models/avakin_anims_male.glb',
  neutralIdle: '/models/neutral_idle.gltf',
  talking: '/models/talking.gltf',
};

export class CASEngine {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private characters = new Map<Gender, CASCharacter>();
  private gender: Gender = 'F';
  private mode: CameraMode = 'fullbody';
  private hotspots!: HotspotManager;
  private plumbob!: THREE.Mesh;
  private platform!: THREE.Mesh;
  private ready = false;
  private disposed = false;

  // transição de câmera
  private camPosGoal = new THREE.Vector3();
  private camTargetGoal = new THREE.Vector3();
  private tweening = false;
  private lastTime = 0;

  // animação
  private currentAnim = 'idle';
  private extraClips: THREE.AnimationClip[] = [];
  private morphs: MorphValues = {};
  private look: CharacterLook | null = null;
  private age: AgeId = 'jovem_adulto';
  private events: EngineEvents;
  private ro: ResizeObserver | null = null;
  private raf = 0;

  constructor(private canvas: HTMLCanvasElement, events: EngineEvents = {}) {
    this.events = events;
  }

  /* ---------------------------------------------------------------- */
  /* Cena                                                             */
  /* ---------------------------------------------------------------- */

  async init(): Promise<void> {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
    this.camera.position.set(0.55, 1.25, 2.9);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.35;
    this.controls.maxDistance = 5.5;
    this.controls.maxPolarAngle = Math.PI * 0.56;
    this.controls.target.set(0, 0.95, 0);
    this.controls.addEventListener('start', () => {
      this.tweening = false;
    });

    // luzes estilo estúdio
    const key = new THREE.DirectionalLight('#fff6ea', 2.6);
    key.position.set(2.4, 4.2, 2.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 12;
    key.shadow.camera.left = -2.5;
    key.shadow.camera.right = 2.5;
    key.shadow.camera.top = 3.5;
    key.shadow.camera.bottom = -1;
    key.shadow.bias = -0.0004;
    key.shadow.blurSamples = 12;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight('#dcefff', 1.0);
    fill.position.set(-3, 2.2, 1.4);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight('#ffe9f2', 0.9);
    rim.position.set(-0.6, 2.8, -3.2);
    this.scene.add(rim);

    const hemi = new THREE.HemisphereLight('#e8f6ff', '#d8ecd8', 0.85);
    this.scene.add(hemi);

    // plataforma circular + sombra
    this.platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.12, 0.07, 64),
      new THREE.MeshStandardMaterial({ color: '#f7fbff', roughness: 0.85 })
    );
    this.platform.position.y = -0.035;
    this.platform.receiveShadow = true;
    this.scene.add(this.platform);

    const shadowCatcher = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 48),
      new THREE.ShadowMaterial({ opacity: 0.14 })
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = 0.002;
    shadowCatcher.receiveShadow = true;
    this.scene.add(shadowCatcher);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.32, 0.012, 10, 80),
      new THREE.MeshBasicMaterial({ color: '#9fd8b4' })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.004;
    this.scene.add(ring);

    // plumbob
    const plumbGeo = new THREE.OctahedronGeometry(0.075);
    plumbGeo.scale(1, 1.7, 1);
    const plumbMat = new THREE.MeshStandardMaterial({
      color: '#41c257',
      emissive: '#2c9c3f',
      emissiveIntensity: 0.55,
      roughness: 0.25,
      transparent: true,
      opacity: 0.95,
    });
    this.plumbob = new THREE.Mesh(plumbGeo, plumbMat);
    this.scene.add(this.plumbob);

    // hotspots
    this.hotspots = new HotspotManager(
      this.camera,
      this.canvas,
      (out) => this.activeChar().headWorldPos(out),
      () => this.activeChar().headRadius * this.activeChar().root.scale.x,
      () => this.morphs,
      (k, v) => this.applyMorphInternal(k, v, true),
      (label) => this.events.onHoverHotspot?.(label)
    );
    this.scene.add(this.hotspots.object());

    this.resize();
    if (typeof window !== 'undefined') {
      (window as unknown as { __cas: CASEngine }).__cas = this;
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      const parent = this.canvas.parentElement;
      if (parent) this.ro.observe(parent);
    }
    window.addEventListener('resize', this.resize);

    await this.loadCharacters();
    this.loop();
  }

  private resize = () => {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth || 1;
    const h = parent.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private async loadCharacters(): Promise<void> {
    const loader = new GLTFLoader();
    const total = 4;
    let done = 0;
    const step = (label: string) => {
      done++;
      this.events.onProgress?.(Math.round((done / total) * 100), label);
    };

    for (const gender of ['F', 'M'] as Gender[]) {
      this.events.onProgress?.(Math.round((done / total) * 100), gender === 'F' ? 'Carregando Sim feminina…' : 'Carregando Sim masculino…');
      const gltf = await loader.loadAsync(MODELS[gender]);
      const clips = [...gltf.animations];
      const character = new CASCharacter(gender, gltf.scene, clips);
      this.scene.add(character.root);
      this.characters.set(gender, character);
      step(`Rig ${gender} pronto`);
    }

    // clips opcionais (Neutral Idle / Talking — exigem .bin que pode não ter sido enviado)
    try {
      const extra = await loader.loadAsync(MODELS.neutralIdle);
      this.extraClips.push(...extra.animations);
      step('Neutro carregado');
    } catch {
      step('Neutro indisponível');
    }
    try {
      const extra = await loader.loadAsync(MODELS.talking);
      this.extraClips.push(...extra.animations);
      step('Falando carregado');
    } catch {
      step('Falando indisponível');
    }

    this.setGender(this.gender, true);
    if (this.look) this.applyLook(this.look);
    this.setAge(this.age);
    this.ready = true;
    this.events.onReady?.();
  }

  /* ---------------------------------------------------------------- */
  /* API pública                                                      */
  /* ---------------------------------------------------------------- */

  private activeChar(): CASCharacter {
    const c = this.characters.get(this.gender);
    if (!c) throw new Error('Personagem não carregado');
    return c;
  }

  setGender(g: Gender, silent = false): void {
    this.gender = g;
    for (const [key, ch] of this.characters) {
      ch.setActive(key === g);
    }
    if (this.look) this.applyLook(this.look);
    if (Object.keys(this.morphs).length > 0) {
      this.activeChar().setAllMorphs(this.morphs);
    }
    if (silent) {
      this.playAnim(this.currentAnim, 0);
    } else {
      this.playAnim(this.currentAnim);
    }
    this.applyCameraMode(true);
  }

  /** clips extras (Neutro/Falando) convertidos para o gênero atual */
  private extraNames(): { name: string; clip: THREE.AnimationClip }[] {
    const out: { name: string; clip: THREE.AnimationClip }[] = [];
    if (this.extraClips.length > 0) {
      const base = this.extraClips[0].clone();
      base.name = 'extra_neutral';
      out.push({ name: base.name, clip: base });
    }
    if (this.extraClips.length > 1) {
      const base = this.extraClips[1].clone();
      base.name = 'extra_talking';
      out.push({ name: base.name, clip: base });
    }
    return out;
  }

  playAnim(base: string, fade = 0.35): void {
    this.currentAnim = base;
    const ch = this.activeChar();
    // registra clips extras (Neutral Idle / Talking) no mixer do personagem
    for (const { name, clip } of this.extraNames()) {
      ch.anim.registerClip(name, clip);
    }
    const mapExtra: Record<string, string> = {
      neutral_idle: 'extra_neutral',
      talking: 'extra_talking',
    };
    let target = mapExtra[base] ?? base;
    // resolve base sem prefixo para o clip do gênero ativo (F_/M_)
    if (!target.startsWith('extra_') && !ch.anim.has(target)) {
      const gendered = `${this.gender}_${target}`;
      if (ch.anim.has(gendered)) target = gendered;
    }
    ch.anim.play(target, { fade });
  }

  hasExtraAnim(id: string): boolean {
    return this.extraClips.length > (id === 'neutral_idle' ? 0 : 1);
  }

  /** ids de clips extras realmente disponíveis (dependem do .bin enviado) */
  availableExtras(): string[] {
    const out: string[] = [];
    if (this.extraClips.length > 0) out.push('neutral_idle');
    if (this.extraClips.length > 1) out.push('talking');
    return out;
  }

  setWalkSpeedStyle(speed: number): void {
    this.activeChar().anim.mixer.timeScale = speed;
  }

  setCameraMode(mode: CameraMode): void {
    this.mode = mode;
    this.applyCameraMode();
  }

  private applyCameraMode(instant = false): void {
    const ch = this.activeChar();
    const head = ch.headWorldPos(new THREE.Vector3());
    const h = ch.height() * ch.root.scale.x;
    if (this.mode === 'fullbody') {
      this.camPosGoal.set(0.55, h * 0.76, Math.max(2.75, h * 2.0));
      this.camTargetGoal.set(0, h * 0.54, 0);
    } else {
      const R = ch.headRadius * ch.root.scale.x;
      this.camPosGoal.set(0, head.y + R * 0.12, R * 5.6);
      this.camTargetGoal.copy(head);
    }
    if (instant) {
      this.camera.position.copy(this.camPosGoal);
      this.controls.target.copy(this.camTargetGoal);
      this.controls.update();
    }
    this.tweening = true;
    this.hotspots.setEnabled(this.mode === 'detail');
  }

  applyMorphInternal(key: string, value: number, fromHotspot: boolean): void {
    this.morphs[key] = value;
    this.activeChar().setMorph(key, value);
    this.events.onMorphChange?.(key, value);
    void fromHotspot;
  }

  setMorphs(values: MorphValues): void {
    this.morphs = { ...values };
    this.activeChar().setAllMorphs(this.morphs);
  }

  applyLook(look: CharacterLook): void {
    this.look = { ...look };
    this.activeChar().applyLook(look);
  }

  setAge(age: AgeId): void {
    this.age = age;
    this.activeChar().setAge(age);
    this.applyCameraMode();
  }

  /** alterna traços de extraclips indisponíveis na UI */
  isReady(): boolean {
    return this.ready;
  }

  snapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  /* ---------------------------------------------------------------- */
  /* Loop                                                             */
  /* ---------------------------------------------------------------- */

  private loop = (): void => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now() / 1000;
    const dt = Math.min(now - (this.lastTime || now - 0.016), 0.05);
    this.lastTime = now;

    for (const [, ch] of this.characters) {
      ch.anim.update(dt);
    }

    // plumbob flutua e gira
    if (this.ready) {
      const ch = this.activeChar();
      const head = ch.headWorldPos(new THREE.Vector3());
      const R = ch.headRadius * ch.root.scale.x;
      const t = performance.now() / 1000;
      this.plumbob.position.set(head.x, head.y + R * 1.65 + Math.sin(t * 2) * 0.015, head.z);
      this.plumbob.rotation.y = t * 1.4;
    }

    // transição suave de câmera
    if (this.tweening) {
      const k = 1 - Math.exp(-4.2 * dt);
      this.camera.position.lerp(this.camPosGoal, k);
      this.controls.target.lerp(this.camTargetGoal, k);
      if (this.camera.position.distanceTo(this.camPosGoal) < 0.004) {
        this.tweening = false;
      }
    }
    this.controls.update();
    this.hotspots.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    window.removeEventListener('resize', this.resize);
    this.hotspots.dispose();
    for (const [, ch] of this.characters) ch.dispose();
    this.controls.dispose();
    this.renderer.dispose();
  }
}
