import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rift = readFileSync('src/motion-arsenal/effects/originkit/NoxHorizonRift.tsx', 'utf8');
const strike = readFileSync('src/motion-arsenal/effects/originkit/ThunderStrike.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/originkit/catalog.ts', 'utf8');

assert.ok(strike.includes("export type ThunderStrikeVariant = 'classic' | 'nox-horizon-rift'"));
assert.ok(strike.includes("props.variant === 'nox-horizon-rift'"));
assert.ok(strike.includes('function ThunderStrikeClassic'));
assert.ok(strike.includes("getContext('webgl')") || strike.includes('gl.getContext'));

const CONTROLS = [
  'progress', 'horizonPosition', 'lineThickness', 'pulseStrength', 'pulseCount', 'glow', 'bloom',
  'jitter', 'sparkAmount', 'dissolveStrength', 'heroFade', 'cosmicReveal', 'reducedMotionMode',
];
for (const key of CONTROLS) {
  assert.ok(rift.includes(`${key}`), `rift component must accept prop: ${key}`);
  assert.ok(catalog.includes(`key: '${key}'`), `catalog control missing: ${key}`);
}
assert.ok(catalog.includes("'nox-horizon-rift'") && catalog.includes('Bottom Pulse Horizon'));

// Scroll is the only production driver; values are deterministic and reversible.
assert.ok(!rift.includes('Math.random('));
assert.ok(rift.includes('smoothstep(0.88, 0.96'));
assert.ok(rift.includes('smoothstep(0.96, 1'));
assert.ok(rift.includes('function hash('));
assert.ok(rift.includes('bottomPulseProgressFromEdge'));
assert.ok(rift.includes('viewportHeight * 0.92'));
assert.ok(rift.includes('viewportHeight * 0.55'));
assert.ok(rift.includes('0.70 + edgeProgress * 0.30'));

// The new contract must not recreate the old conceptual failure modes.
const implementation = rift.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
for (const forbidden of ['clipPath', 'clip-path', '.nhr-cosmic', '.nhr-stars', '<canvas', 'radial-gradient(90% 70%']) {
  assert.ok(!implementation.toLowerCase().includes(forbidden.toLowerCase()), `forbidden full-field path remains: ${forbidden}`);
}
assert.ok(rift.includes('data-rift-root="bottom-pulse-horizon"'));
assert.ok(rift.includes('IntersectionObserver'));
assert.ok((rift.match(/requestAnimationFrame/g) ?? []).length <= 2);
assert.ok(rift.includes('autoDemo'));

for (const mode of ['static-line', 'crossfade-only', 'hidden']) assert.ok(rift.includes(mode));
assert.ok(rift.includes('prefers-reduced-motion'));
assert.ok(catalog.includes("improvementVersion: '2.1.1'"));
assert.ok(catalog.includes('improvementChangelog'));

console.log(`Bottom Pulse Horizon contract: OK (${CONTROLS.length} controls verified)`);
