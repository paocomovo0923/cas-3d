/* Verifica sanitizeNodeName + parsing de tracks como o GLTFLoader produz */
import * as THREE from 'three';

console.log('sanitizeNodeName("mixamorig:Hips") =', JSON.stringify(THREE.PropertyBinding.sanitizeNodeName('mixamorig:Hips')));

// Simula o fluxo GLTFLoader: nó sanitizado + track sanitizado
const root = new THREE.Group();
const hips = new THREE.Bone();
hips.name = THREE.PropertyBinding.sanitizeNodeName('mixamorig:Hips');
root.add(hips);

const trackName = `${THREE.PropertyBinding.sanitizeNodeName('mixamorig:Hips')}.quaternion`;
const track = new THREE.QuaternionKeyframeTrack(trackName, [0, 1], [0, 0, 0, 1, 0.3826834, 0, 0, 0.9238795]);
const clip = new THREE.AnimationClip('test', 1, [track]);

const mixer = new THREE.AnimationMixer(root);
mixer.clipAction(clip).play();

const origWarn = console.warn;
let warned = false;
console.warn = (...a) => { warned = true; origWarn('[WARN]', ...a); };
mixer.update(0.5);
console.warn = origWarn;

console.log('node name:', hips.name, '| track:', trackName);
console.log('warned:', warned, '| q.x:', hips.quaternion.x.toFixed(4));
console.log(!warned && hips.quaternion.x > 0.1 ? 'OK: GLTFLoader flow binds correctly' : 'FAILED');
