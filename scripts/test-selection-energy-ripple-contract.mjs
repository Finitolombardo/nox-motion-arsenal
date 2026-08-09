import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/forms/SelectionEnergyRippleV2.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/forms/catalog.ts', 'utf8');
const manifest = JSON.parse(readFileSync('public/agent-manifests/selection-energy-ripple-variants.json', 'utf8'));

for (const token of [
  'SelectionEnergyRippleV2',
  'SELECTION_RIPPLE_VARIANTS',
  'SELECTION_RIPPLE_ENERGIES',
  'gravity',
  'sparkCount',
  'rippleScale',
  'safeGravity',
  'safeSparkCount',
  'safeRippleScale',
  'ser2-ripple-scale',
  'showVariantSwitcher',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'rafRef.current !== null',
  'alive.length > 0',
  '++rippleId.current',
  'event.detail === 0',
  'if (!reduced) addRipple',
  'aria-pressed',
  'aria-live="polite"',
  'timerIds.current.clear()',
  'COPY CONFIG',
]) {
  assert.ok(source.includes(token), `selection ripple v2 contract missing: ${token}`);
}

assert.ok(catalog.includes("id: 'forms-selection-energy-ripple'"), 'canonical effect id missing');
assert.ok(catalog.includes("import('./SelectionEnergyRippleV2')"), 'catalog must route canonical id to V2');
assert.ok(catalog.includes("importPath: '@/motion-arsenal/effects/forms/SelectionEnergyRippleV2'"), 'implementation path must point to V2');
assert.equal(manifest.effectId, 'forms-selection-energy-ripple');
assert.equal(manifest.variants.length, 5);
assert.equal(new Set(manifest.variants.map((entry) => entry.reference)).size, 5);
assert.ok(!source.includes('Math.random'), 'runtime must stay deterministic');
assert.ok(!source.includes('fetch('), 'effect must not perform network requests');
assert.ok(!source.includes("['--ser2-scale' as string]"), 'rippleScale must affect runtime geometry, not an unused CSS custom property');
assert.ok(!catalog.includes("Component: lazy(() => import('./SelectionEnergyRipple'))"), 'legacy implementation must not remain canonical');

console.log('selection energy ripple v2 contract: OK');