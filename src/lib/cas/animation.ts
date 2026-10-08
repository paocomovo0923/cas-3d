/**
 * CAS — Controlador de animações (THREE.AnimationMixer)
 *
 * Gerencia a biblioteca de clips F_* / M_* e os clips Mixamo
 * (Armature|mixamo.com|Layer0) com transições suaves por crossfade.
 */
import * as THREE from 'three';

export interface PlayOptions {
  fade?: number;
  loop?: THREE.AnimationActionLoopStyles;
  speed?: number;
  timeScaleRelative?: boolean;
}

export class AnimationController {
  readonly mixer: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  private current: THREE.AnimationAction | null = null;
  private currentKey: string | null = null;
  private baseTimeScale = 1;

  constructor(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(root);
    for (const clip of clips) {
      this.actions.set(clip.name, this.mixer.clipAction(clip));
    }
  }

  has(name: string): boolean {
    return this.actions.has(name);
  }

  /** Registra um clip extra (ex.: Neutral Idle / Talking do mixamo) */
  registerClip(name: string, clip: THREE.AnimationClip): void {
    if (!this.actions.has(name)) {
      this.actions.set(name, this.mixer.clipAction(clip));
    }
  }

  names(): string[] {
    return [...this.actions.keys()];
  }

  get currentName(): string | null {
    return this.currentKey;
  }

  /**
   * Troca de animação com crossfade suave (padrão 0.35s).
   * Resets: ação anterior faz fadeOut; nova faz reset + fadeIn.
   */
  play(name: string, opts: PlayOptions = {}): void {
    const action = this.actions.get(name);
    if (!action) return;
    const fade = opts.fade ?? 0.35;

    if (this.current === action) {
      action.timeScale = this.baseTimeScale * (opts.speed ?? 1);
      return;
    }

    action.reset();
    action.timeScale = this.baseTimeScale * (opts.speed ?? 1);
    if (opts.loop !== undefined) action.setLoop(opts.loop, Infinity);
    action.enabled = true;
    action.setEffectiveWeight(1);
    action.play();

    if (this.current) {
      this.current.crossFadeTo(action, fade, false);
    }
    this.current = action;
    this.currentKey = name;
  }

  /** Escala de tempo global (ex.: para pause de gênero inativo). */
  setTimeScale(s: number): void {
    this.baseTimeScale = s;
    this.mixer.timeScale = s;
  }

  update(dt: number): void {
    this.mixer.update(dt);
  }

  stopAll(fade = 0.25): void {
    for (const a of this.actions.values()) {
      a.fadeOut(fade);
    }
    this.current = null;
    this.currentKey = null;
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}

/**
 * Nomes dos clips por gênero conforme a biblioteca:
 * F_idle, F_walking, F_running, F_jump, F_left_strafe, F_left_strafe_walk,
 * F_right_strafe, F_right_strafe_walk, F_left_turn, F_left_turn_2,
 * F_right_turn, F_right_turn_2  (e equivalentes M_*)
 */
export function clipName(gender: 'F' | 'M', base: string): string {
  return `${gender}_${base}`;
}

export const ANIM_LIBRARY = [
  'idle',
  'walking',
  'running',
  'jump',
  'left_strafe',
  'left_strafe_walk',
  'right_strafe',
  'right_strafe_walk',
  'left_turn',
  'left_turn_2',
  'right_turn',
  'right_turn_2',
] as const;
