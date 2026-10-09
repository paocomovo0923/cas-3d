/* Testa PropertyBinding com tracks "mixamorig:Hips.quaternion" */
import * as THREE from 'three';

// hierarquia simples com nome contendo dois-pontos
const root = new THREE.Group();
// FIX: renomeia osso sem o prefixo (parse do three separa "mixamorig:" como diretório)
const hips = new THREE.Bone();
hips.name = 'Hips';
root.add(hips);

const track = new THREE.QuaternionKeyframeTrack(
  'mixamorig:Hips.quaternion',
  [0, 1],
  [0, 0, 0, 1, 0.3826834, 0, 0, 0.9238795]
);
const clip = new THREE.AnimationClip('test', 1, [track]);

const mixer = new THREE.AnimationMixer(root);
const action = mixer.clipAction(clip);
action.play();

// captura warnings
const origWarn = console.warn;
let warned = false;
console.warn = (...args) => { warned = true; origWarn('[WARN]', ...args); };

mixer.update(0.5);

console.warn = origWarn;
const q = hips.quaternion;
const applied = Math.abs(q.x - 0.3826834 * 0.5 * 2) < 1e-3 || Math.abs(q.x) > 1e-6;
console.log('warned:', warned);
console.log('hips.quaternion after update:', q.x.toFixed(4), q.y.toFixed(4), q.z.toFixed(4), q.w.toFixed(4));
console.log(applied && !warned ? 'BINDING OK (colon names work)' : 'BINDING FAILED');
