import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/forms/AnswerLockInV2.tsx', 'utf8');
const bridge = readFileSync('src/motion-arsenal/effects/forms/AnswerLockIn.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/forms/catalog.ts', 'utf8');

for (const token of [
  'role="radiogroup"',
  'role="radio"',
  'aria-checked',
  'aria-live="polite"',
  "event.key === 'ArrowRight'",
  "event.key === 'Home'",
  'useInView',
  'data-motion',
  'safeLockDuration',
  'safeDimOpacity',
  'onCommit',
  'SIGNAL COMMITTED',
  '@media(max-width:390px)',
  ':focus-visible',
]) {
  assert.ok(source.includes(token), `AnswerLockIn v2 missing production token: ${token}`);
}

assert.ok(bridge.includes("from './AnswerLockInV2'"), 'canonical AnswerLockIn bridge must point to v2');
assert.ok(catalog.includes("id: 'forms-answer-lock-in'"), 'existing catalog id must be preserved');
assert.ok(catalog.includes("import('./AnswerLockIn')"), 'catalog must preserve canonical import path');
assert.ok(!source.includes('requestAnimationFrame'), 'AnswerLockIn should not require a JS animation loop');
assert.ok(!source.includes('Math.random'), 'AnswerLockIn should remain deterministic');

console.log('answer lock-in v2 contract: OK');
