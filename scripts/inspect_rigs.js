// Deep inspection: node hierarchies, animation channel targets, accessors
const fs = require('fs');
const path = require('path');

function parseGLB(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) return null;
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.slice(20, 20 + jsonLen).toString('utf8');
  return JSON.parse(jsonStr);
}

function hierarchy(json) {
  const nodes = json.nodes || [];
  const hasChildren = new Set();
  nodes.forEach(n => (n.children || []).forEach(c => hasChildren.add(c)));
  const roots = json.scenes[0].nodes;

  function walk(idx, depth, out) {
    const n = nodes[idx];
    const flags = [];
    if (n.mesh !== undefined) flags.push('MESH');
    if (n.translation) flags.push(`T=[${n.translation.map(v=>+v.toFixed(2)).join(',')}]`);
    if (n.scale) flags.push(`S=[${n.scale.map(v=>+v.toFixed(3)).join(',')}]`);
    if (n.rotation) flags.push(`R`);
    out.push(`${'  '.repeat(depth)}${n.name || 'node'+idx} ${flags.join(' ')}`);
    (n.children || []).forEach(c => walk(c, depth + 1, out));
  }
  const out = [];
  roots.forEach(r => walk(r, 0, out));
  return out.join('\n');
}

function animTargets(json) {
  const nodes = json.nodes || [];
  const anim = json.animations[0];
  const targets = new Set();
  anim.channels.forEach(ch => {
    targets.add(nodes[ch.target.node].name + ':' + ch.target.path);
  });
  const nodeTargets = new Set([...targets].map(t => t.split(':')[0]));
  return { paths: [...targets], nodeCount: nodeTargets.size, sample: [...targets].slice(0, 10) };
}

function durations(json) {
  // Approximate duration from accessors referenced by animations (input accessors)
  // For GLB we need accessors data; let's just list animations names again.
  return (json.animations || []).map(a => a.name);
}

['/home/z/my-project/upload/avakin_anims_female.glb',
 '/home/z/my-project/upload/avakin_anims_male.glb'].forEach(f => {
  const json = parseGLB(f);
  console.log('='.repeat(70));
  console.log(path.basename(f));
  console.log('--- NODE HIERARCHY ---');
  console.log(hierarchy(json));
  const at = animTargets(json);
  console.log('\n--- ANIM[0] TARGETS --- nodeCount:', at.nodeCount);
  console.log(at.paths.join('\n'));
});

['/home/z/my-project/upload/Neutral Idle.gltf',
 '/home/z/my-project/upload/Talking.gltf'].forEach(f => {
  const json = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log('='.repeat(70));
  console.log(path.basename(f));
  console.log('--- NODE HIERARCHY (first 80 lines) ---');
  console.log(hierarchy(json).split('\n').slice(0, 80).join('\n'));
  const at = animTargets(json);
  console.log('\n--- ANIM[0] TARGETS --- nodeCount:', at.nodeCount);
  console.log(at.paths.slice(0, 30).join('\n'));
});
