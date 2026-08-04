import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/forge-skilltree/GlassMetalSkilltreePanel.tsx', 'utf8');
const manifest = JSON.parse(readFileSync('public/agent-manifests/glass-metal-skilltree-panel-variants.json', 'utf8'));

for (const contract of [
  'obsidian-command-deck',
  'frosted-nexus',
  'gold-ascension-console',
  'holo-forge-matrix',
  'void-citadel-panel',
  'nox-revenue-glass-panel',
  'gmp2-link-flow',
  'gmp2-caustic',
  'gmp2-node-core',
  'showVariantSwitcher',
  'showEnergySwitcher',
  'interactiveLighting',
  'pointerSpotlight',
  'hoverGlow',
  'specularFollow',
  'MOVE TO TILT // TAP TO IMPULSE',
  'COPY CONFIG',
]) {
  assert.ok(source.includes(contract), `Glass metal panel contract missing: ${contract}`);
}

assert.equal(manifest.effectId, 'skilltree-glass-metal-panel');
assert.equal(manifest.variants.length, 6);
assert.equal(new Set(manifest.variants.map((variant) => variant.reference)).size, 6);
assert.deepEqual(manifest.productionLightingProps, ['interactiveLighting', 'pointerSpotlight', 'hoverGlow', 'specularFollow']);
assert.ok(!source.includes('fetch('), 'Effect must not make network requests');
assert.ok(!source.includes('Math.random'), 'Effect must stay deterministic');

console.log('glass metal skilltree panel contract: OK');
