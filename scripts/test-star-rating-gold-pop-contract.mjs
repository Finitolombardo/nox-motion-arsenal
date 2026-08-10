import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/forms/StarRatingGoldPop.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/forms/catalog.ts', 'utf8');

for (const token of [
  'StarRatingGoldPop',
  'srgp-root',
  'srgp-field',
  'srgp-star',
  'srgpPop',
  'usePrefersReducedMotion',
  'type="radio"',
  'fieldset',
  'aria-label',
  '--i',
  'checked',
]) {
  assert.ok(source.includes(token), `star rating gold pop contract missing: ${token}`);
}

assert.ok(catalog.includes("id: 'forms-star-rating-gold-pop'"), 'catalog registration missing');
assert.ok(catalog.includes("import('./StarRatingGoldPop')"), 'catalog lazy import missing');
assert.ok(!source.includes('Math.random'), 'star rating must be deterministic (no Math.random)');
assert.ok(!source.includes('fetch('), 'star rating must not fetch');

console.log('star rating gold pop contract: OK');
