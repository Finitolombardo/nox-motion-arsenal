import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/premium/NoxSignalParticles.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/premium/catalog.ts', 'utf8');
const manifest = JSON.parse(readFileSync('public/agent-manifests/signal-particles-variants.json', 'utf8'));

const VARIANTS = ['energy-smoke-flow', 'agent-constellation', 'revenue-funnel', 'forge-murmuration', 'signal-vortex', 'command-formation'];
for (const id of VARIANTS) assert.ok(source.includes(id), `signal particle contract missing variant: ${id}`);

// V2 physics: forces and velocity integration instead of sin/cos target damping.
for (const token of [
  'createNoise2D', 'curl(', 'flowOffsetX', 'cursorAttraction', 'convergenceRadius',
  'smokePersistence', 'viscosity', 'turbulence', 'quadraticCurveTo', 'createSprite',
  'nsp-copy', 'COPY CONFIG',
]) assert.ok(source.includes(token), `signal particle contract missing: ${token}`);

// Der Impuls klingt jetzt über dt ab statt über performance.now-Zeitstempel —
// dadurch ist er frame-rate-unabhängig.
assert.ok(!source.includes('performance.now'), 'impulse decay must be dt-driven');

// Explicitly removed in V2 — no link network, no cross-hair sparks, no modes.
for (const token of ['linkDistance', 'SIGNAL_PARTICLE_MODES', 'showModeSwitcher', 'sparkSize']) {
  assert.ok(!source.includes(token), `signal particle V2 must not reference: ${token}`);
}
// Nur die Props-Liste prüfen — der Changelog darf die entfernten Regler nennen.
const entry = catalog.slice(catalog.indexOf("id: 'premium-signal-particles'"), catalog.indexOf("id: 'premium-terminal-scan-reveal'"));
const controls = entry.slice(entry.indexOf('props: ['), entry.indexOf('productionSafe'));
for (const token of ['linkDistance', 'showModeSwitcher', 'sparkSize', "key: 'mode'", "key: 'intensity'"]) {
  assert.ok(!controls.includes(token), `catalog must not expose removed control: ${token}`);
}
for (const token of ['cursorAttraction', 'convergenceRadius', 'smokePersistence', 'viscosity', 'flowSpeed', 'glow', 'particleSize', 'turbulence']) {
  assert.ok(controls.includes(token), `catalog is missing the V2 control: ${token}`);
}
assert.ok(entry.includes("improvementVersion: '2.0.0'"), 'catalog must record the V2 improvement version');
const overrides = readFileSync('src/motion-arsenal/data/effectsCatalog.ts', 'utf8');
const override = overrides.slice(overrides.indexOf("'premium-signal-particles': {"), overrides.indexOf("'premium-terminal-scan-reveal': {"));
assert.ok(override.includes("improvementVersion: '3.0.0'"), 'improvement override must announce the rebuild');
assert.ok(override.includes('curl-noise'), 'improvement changelog must describe the new physics');
assert.ok(entry.includes('energy-smoke-flow'), 'catalog must offer the energy-smoke-flow narrative');

// Velocity integration must exist; target-position damping must not.
assert.ok(/s\.vx = \(s\.vx \+ s\.ax \* dt\)/.test(source), 'missing acceleration -> velocity integration');
assert.ok(/s\.x \+= s\.vx \* dt/.test(source), 'missing velocity -> position integration');
assert.ok(!/damp\(s\.[xy],/.test(source), 'particles must not be damped onto target positions');

assert.equal(manifest.effectId, 'premium-signal-particles');
assert.equal(manifest.variants.length, VARIANTS.length);
assert.deepEqual(manifest.variants.map((v) => v.id), VARIANTS);
assert.equal(manifest.variants[0].id, 'energy-smoke-flow', 'energy-smoke-flow must be the primary variant');
assert.ok(manifest.physics?.forces.includes('tangentialCurl'), 'manifest must document the forces');
assert.ok(!JSON.stringify(manifest).includes('linkDistance'));
assert.ok(!JSON.stringify(manifest).includes('showModeSwitcher'));

assert.ok(!source.includes('Math.random'));
assert.ok(!source.includes('fetch('));
console.log('premium signal particles contract: OK');
