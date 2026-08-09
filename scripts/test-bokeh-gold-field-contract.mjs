import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/backgrounds/BokehGoldField.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/backgrounds/catalog.ts', 'utf8');

for (const token of [
  'BokehGoldField',
  'bgf-root',
  'bgf-layer',
  'bgf-orb',
  'bgfDrift',
  'seededRandom',
  '@media (prefers-reduced-motion:reduce)',
  'animation:none',
  '--bgf-blur',
  '--bgf-d',
  'focus',
  'aria-hidden',
  'pointer-events:none',
]) {
  assert.ok(source.includes(token), `bokeh gold field contract missing: ${token}`);
}

assert.ok(catalog.includes("id: 'bg-bokeh-gold-field'"), 'catalog registration missing');
assert.ok(catalog.includes("import('./BokehGoldField')"), 'catalog lazy import missing');
assert.ok(!source.includes('Math.random'), 'bokeh must be deterministic (no Math.random)');
assert.ok(!source.includes('fetch('), 'bokeh must not fetch');
assert.ok(!source.includes('canvas'), 'bokeh must stay CSS-only (no canvas)');

console.log('bokeh gold field contract: OK');
