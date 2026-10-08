// Inspect GLB/GLTF files: meshes, morph targets, animations, nodes
const fs = require('fs');
const path = require('path');

function parseGLB(filePath) {
  const buf = fs.readFileSync(filePath);
  // GLB header: magic(4) version(4) length(4)
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) return null; // 'glTF'
  const jsonLen = buf.readUInt32LE(12);
  const jsonType = buf.readUInt32LE(16);
  if (jsonType !== 0x4e4f534a) return null; // 'JSON'
  const jsonStr = buf.slice(20, 20 + jsonLen).toString('utf8');
  return JSON.parse(jsonStr);
}

function describe(name, json) {
  console.log('='.repeat(70));
  console.log('FILE:', name);
  console.log('Asset:', JSON.stringify(json.asset));
  console.log('\n--- MESHES ---');
  (json.meshes || []).forEach((m, i) => {
    const primitives = (m.primitives || []).map(p => ({
      material: p.material,
      targets: p.targets ? p.targets.length : 0
    }));
    console.log(`[${i}] "${m.name}" primitives=${primitives.length} morphTargets=${primitives[0]?.targets || 0}`);
    if (m.extras) console.log('    extras:', JSON.stringify(m.extras));
  });
  console.log('\n--- NODES (with mesh) ---');
  (json.nodes || []).forEach((n) => {
    if (n.mesh !== undefined) console.log(`node "${n.name}" -> mesh[${n.mesh}] skin=${n.skin ?? 'none'}`);
  });
  console.log('\n--- SKINS ---');
  (json.skins || []).forEach((s, i) => {
    console.log(`[${i}] "${s.name}" joints=${s.joints.length}`);
  });
  console.log('\n--- ANIMATIONS ---');
  (json.animations || []).forEach((a, i) => {
    const channels = a.channels.length;
    console.log(`[${i}] "${a.name}" channels=${channels}`);
  });
  console.log('\n--- MATERIALS ---');
  (json.materials || []).forEach((m, i) => {
    console.log(`[${i}] "${m.name}"`);
  });
  console.log('\n--- IMAGES/TEXTURES ---');
  (json.images || []).forEach((im, i) => {
    console.log(`[${i}] name=${im.name || '(unnamed)'} mimeType=${im.mimeType} bufferView=${im.bufferView ?? 'n/a'}`);
  });
  console.log('\n--- SCENES ---');
  (json.scenes || []).forEach((s, i) => {
    console.log(`[${i}] nodes: ${(s.nodes || []).map(n => json.nodes[n].name).join(', ')}`);
  });
}

const files = [
  '/home/z/my-project/upload/avakin_anims_female.glb',
  '/home/z/my-project/upload/avakin_anims_male.glb',
];

files.forEach(f => {
  const json = parseGLB(f);
  if (json) {
    describe(path.basename(f), json);
  } else {
    console.log('Not a GLB or parse failed:', f);
  }
});

// .gltf files are plain JSON
['/home/z/my-project/upload/Neutral Idle.gltf', '/home/z/my-project/upload/Talking.gltf'].forEach(f => {
  try {
    const json = JSON.parse(fs.readFileSync(f, 'utf8'));
    describe(path.basename(f), json);
  } catch (e) {
    console.log('Failed to parse', f, e.message);
  }
});
