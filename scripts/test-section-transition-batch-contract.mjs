import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const parse = (relativePath) => JSON.parse(read(relativePath));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function includes(source, token, label) {
  assert(source.includes(token), `${label} missing ${token}`);
}

const answer = read('src/motion-arsenal/effects/forms/AnswerLockIn.tsx');
const validation = read('src/motion-arsenal/effects/forms/ValidationPulse.tsx');
const questionTransition = read('src/motion-arsenal/effects/forms/QuestionTransition.tsx');
const starfield = read('src/motion-arsenal/effects/backgrounds/NoxStarfieldDrift.tsx');
const formsCatalog = read('src/motion-arsenal/effects/forms/catalog.ts');
const batch = parse('batches/motion-batch-section-transitions.json');

for (const token of [
  "'assessment' | 'command-deck' | 'brand-lock'",
  "'horizontal' | 'vertical'",
  'showProgressRail',
  'logoUrl',
  'onChange',
]) includes(answer, token, 'AnswerLockIn');

for (const token of [
  "'field' | 'command' | 'checkout'",
  'successColor',
  'signalStrength',
  'autoValidate',
  'showTelemetry',
]) includes(validation, token, 'ValidationPulse');

for (const token of [
  'useInView',
  'if (inView) return',
  'clearTimers()',
  "phaseRef.current !== 'idle'",
  'Number.isFinite(duration)',
  'Number.isFinite(blurAmount)',
  "!autoCycle || !inView || reduced || phase !== 'idle'",
  'aria-busy={busy}',
  'aria-live="polite"',
  'disabled={busy}',
  '@media (max-width: 440px)',
  '@media (prefers-reduced-motion: reduce)',
]) includes(questionTransition, token, 'QuestionTransition');

assert(!questionTransition.includes('requestAnimationFrame'), 'QuestionTransition should remain CSS/timer driven');
assert(!questionTransition.includes('Math.random'), 'QuestionTransition must remain deterministic');

for (const token of [
  "'deep-drift' | 'section-warp' | 'brand-gateway'",
  "'forward' | 'backward' | 'left' | 'right' | 'up' | 'down'",
  'useScrollProgress',
  'scrollReactive',
  'progress?: number',
  'direction = \'right\'',
]) includes(starfield, token, 'NoxStarfieldDrift');

for (const token of [
  "default: 'command-deck'",
  "default: 'horizontal'",
  "default: 'command'",
  "key: 'signalStrength'",
  "id: 'forms-question-transition'",
  "import('./QuestionTransition')",
]) includes(formsCatalog, token, 'forms catalog');

assert(batch.schemaVersion === '1.0', 'Batch schema version mismatch');
assert(batch.effects.length === 3, 'Batch must contain exactly three effects');
assert(batch.publish?.mode === 'production', 'Batch must target production');
assert(batch.publish?.skipPreview === true, 'Batch must skip preview');

for (const manifestPath of [
  'public/agent-manifests/answer-lock-in-variants.json',
  'public/agent-manifests/validation-pulse-variants.json',
  'public/agent-manifests/nox-starfield-drift-variants.json',
]) {
  const manifest = parse(manifestPath);
  assert(manifest.schemaVersion, `${manifestPath} missing schemaVersion`);
  assert(Array.isArray(manifest.variants) && manifest.variants.length === 3, `${manifestPath} must define three variants`);
  for (const variant of manifest.variants) {
    assert(typeof variant.reference === 'string' && variant.reference.startsWith('motion:'), `${manifestPath} has invalid reference`);
    assert(typeof variant.jsx === 'string' && variant.jsx.startsWith('<'), `${manifestPath} has invalid JSX`);
  }
}

console.log('Section transition batch contract passed.');
