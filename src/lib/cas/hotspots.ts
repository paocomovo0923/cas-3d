/**
 * CAS — Hotspots de edição direta (Detail Edit Mode)
 *
 * Raycasting sobre marcadores invisíveis no rosto; ao arrastar,
 * altera os morphTargetInfluences correspondentes (ex.: arrastar o
 * nariz muda nariz_x e nariz_y).
 */
import * as THREE from 'three';
import { MORPH_MAP } from './morphs';
import type { MorphValues } from './types';

interface HotspotDef {
  id: string;
  label: string;
  /** posição relativa ao centro da cabeça, em múltiplos de headR */
  offset: [number, number, number];
  /** morphs alterados: [horizontal, vertical] */
  morphH: string;
  morphV: string;
  /** sensibilidade */
  kH: number;
  kV: number;
}

export const HOTSPOT_DEFS: HotspotDef[] = [
  { id: 'nariz', label: 'Nariz', offset: [0, -0.16, 1.18], morphH: 'nariz_x', morphV: 'nariz_y', kH: 2.4, kV: 2.4 },
  { id: 'queixo', label: 'Queixo', offset: [0, -0.72, 0.72], morphH: 'queixo_x', morphV: 'queixo_y', kH: 2.4, kV: 2.4 },
  { id: 'bochecha', label: 'Bochecha', offset: [0.56, -0.06, 0.8], morphH: 'bochecha_x', morphV: 'bochecha_y', kH: 2.2, kV: 2.2 },
  { id: 'mandibula', label: 'Mandíbula', offset: [0.5, -0.5, 0.42], morphH: 'mandibula_x', morphV: 'mandibula_y', kH: 2.2, kV: 2.2 },
  { id: 'orelha', label: 'Orelha', offset: [1.02, -0.05, -0.05], morphH: 'orelha_grande', morphV: 'orelha_colada', kH: 1.6, kV: 1.6 },
  { id: 'cabeca', label: 'Cabeça', offset: [0, 0.98, 0.12], morphH: 'cabeca_largura', morphV: 'cabeca_altura', kH: 2.2, kV: 2.2 },
];

export class HotspotManager {
  private group = new THREE.Group();
  private handles: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private active: HotspotDef | null = null;
  private startPx = new THREE.Vector2();
  private startValues: MorphValues = {};
  private enabled = false;

  constructor(
    private camera: THREE.Camera,
    private dom: HTMLElement,
    private getHeadCenter: (out: THREE.Vector3) => THREE.Vector3,
    private getHeadR: () => number,
    private getMorphs: () => MorphValues,
    private onMorph: (key: string, value: number) => void,
    private onHover: (label: string | null) => void
  ) {
    const geo = new THREE.SphereGeometry(1, 12, 10);
    for (const def of HOTSPOT_DEFS) {
      const mat = new THREE.MeshBasicMaterial({
        color: '#3fae6a',
        transparent: true,
        opacity: 0,
        depthTest: false,
      });
      const m = new THREE.Mesh(geo, mat);
      m.userData.def = def;
      m.renderOrder = 999;
      this.handles.push(m);
      this.group.add(m);
    }
    this.group.visible = false;

    dom.addEventListener('pointerdown', this.onDown);
    dom.addEventListener('pointermove', this.onMove);
    dom.addEventListener('pointerup', this.onUp);
    dom.addEventListener('pointerleave', this.onUp);
  }

  object(): THREE.Object3D {
    return this.group;
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    this.group.visible = v;
    if (!v) this.setHover(null);
  }

  /** atualiza posições (chamar por frame no modo detalhe) */
  update(): void {
    if (!this.enabled) return;
    const c = this.getHeadCenter(new THREE.Vector3());
    const R = this.getHeadR();
    this.group.position.copy(c);
    for (const h of this.handles) {
      const def = h.userData.def as HotspotDef;
      h.position.set(def.offset[0] * R, def.offset[1] * R, def.offset[2] * R);
      h.scale.setScalar(R * 0.085);
      const mat = h.material as THREE.MeshBasicMaterial;
      const target = this.active?.id === def.id ? 0.5 : (h.userData.hover ? 0.32 : 0.12);
      mat.opacity += (target - mat.opacity) * 0.2;
    }
  }

  private setHover(def: HotspotDef | null) {
    for (const h of this.handles) h.userData.hover = false;
    if (def) {
      const h = this.handles.find((x) => (x.userData.def as HotspotDef).id === def.id);
      if (h) h.userData.hover = true;
    }
    this.onHover(def ? def.label : null);
    this.dom.style.cursor = def ? 'grab' : '';
  }

  private pick(ev: PointerEvent): HotspotDef | null {
    const rect = this.dom.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.handles, false);
    if (hits.length > 0) return hits[0].object.userData.def as HotspotDef;
    return null;
  }

  private clampMorph(key: string, v: number): number {
    // bipolar: [-1,1]; unipolar: [0,1] — conforme MORPH_MAP
    if (MORPH_MAP[key]?.range !== 'bipolar') return Math.min(1, Math.max(0, v));
    return Math.min(1, Math.max(-1, v));
  }

  private onDown = (ev: PointerEvent) => {
    if (!this.enabled || ev.button !== 0) return;
    const def = this.pick(ev);
    if (!def) return;
    this.active = def;
    this.startPx.set(ev.clientX, ev.clientY);
    const morphs = this.getMorphs();
    this.startValues = { [def.morphH]: morphs[def.morphH] ?? 0, [def.morphV]: morphs[def.morphV] ?? 0 };
    this.dom.style.cursor = 'grabbing';
    ev.stopPropagation();
  };

  private onMove = (ev: PointerEvent) => {
    if (this.active) {
      const rect = this.dom.getBoundingClientRect();
      const dx = ((ev.clientX - this.startPx.x) / rect.width) * this.active.kH;
      const dy = ((ev.clientY - this.startPx.y) / rect.height) * this.active.kV;
      this.onMorph(this.active.morphH, this.clampMorph(this.active.morphH, this.startValues[this.active.morphH] + dx));
      this.onMorph(this.active.morphV, this.clampMorph(this.active.morphV, this.startValues[this.active.morphV] - dy));
      return;
    }
    if (!this.enabled) return;
    const def = this.pick(ev);
    this.setHover(def);
  };

  private onUp = () => {
    if (this.active) {
      this.active = null;
      this.dom.style.cursor = '';
    }
  };

  dispose(): void {
    this.dom.removeEventListener('pointerdown', this.onDown);
    this.dom.removeEventListener('pointermove', this.onMove);
    this.dom.removeEventListener('pointerup', this.onUp);
    this.dom.removeEventListener('pointerleave', this.onUp);
  }
}
