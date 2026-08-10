// Contract-Test fuer Batch 3 der Konzept-Ueberfuehrung.
// Gleiche Grundpruefungen wie Batch 1 und 2, dazu Verhaltenschecks fuer die
// Eigenheiten dieser sechs Effekte.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const EFFECTS = [
  {
    id: 'system-barcode-scan-line',
    component: 'BarcodeScanLine',
    concept: 'Barcode Scan Line',
    source: 'src/motion-arsenal/effects/system/BarcodeScanLine.tsx',
    catalog: 'src/motion-arsenal/effects/system/catalog.ts',
    tokens: ['linear-gradient(90deg', 'translateY', 'det(', 'aria-label'],
    a11y: false,
  },
  {
    id: 'system-progress-ring-scanner',
    component: 'ProgressRingScanner',
    concept: 'Progress Ring Scanner',
    source: 'src/motion-arsenal/effects/system/ProgressRingScanner.tsx',
    catalog: 'src/motion-arsenal/effects/system/catalog.ts',
    tokens: ['role="progressbar"', 'aria-valuenow', 'pathLength={1}', 'conic-gradient'],
    a11y: false,
  },
  {
    id: 'hero-rotating-word-wheel',
    component: 'RotatingWordWheel',
    concept: 'Rotating Word Wheel',
    source: 'src/motion-arsenal/effects/hero/RotatingWordWheel.tsx',
    catalog: 'src/motion-arsenal/effects/hero/catalog.ts',
    tokens: ['useInView', 'aria-current', 'clearInterval', 'translateY(calc('],
    a11y: false,
  },
  {
    id: 'forms-success-stamp-submit',
    component: 'SuccessStampSubmit',
    concept: 'Success Stamp Submit',
    source: 'src/motion-arsenal/effects/forms/SuccessStampSubmit.tsx',
    catalog: 'src/motion-arsenal/effects/forms/catalog.ts',
    tokens: ['aria-live="polite"', 'clearTimeout', 'det(', 'cubic-bezier(.3,1.7,.5,1)'],
    a11y: true,
  },
  {
    id: 'originkit-icon-stroke-draw',
    component: 'IconStrokeDrawHover',
    concept: 'Icon Stroke Draw Hover',
    source: 'src/motion-arsenal/effects/originkit/IconStrokeDrawHover.tsx',
    catalog: 'src/motion-arsenal/effects/originkit/catalog.ts',
    tokens: ['pathLength={1}', 'stroke-dashoffset', 'aria-label={icon.label}'],
    a11y: true,
  },
  {
    id: 'originkit-text-shake-jitter',
    component: 'TextShakeJitter',
    concept: 'Text Shake Jitter',
    source: 'src/motion-arsenal/effects/originkit/TextShakeJitter.tsx',
    catalog: 'src/motion-arsenal/effects/originkit/catalog.ts',
    tokens: ['background-clip:text', 'requestAnimationFrame', 'clearTimeout'],
    a11y: true,
  },
];

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');

for (const effect of EFFECTS) {
  const source = readFileSync(effect.source, 'utf8');
  const catalog = readFileSync(effect.catalog, 'utf8');
  const label = effect.component;

  for (const token of effect.tokens) {
    assert.ok(source.includes(token), `${label}: fehlender Baustein ${token}`);
  }

  assert.ok(catalog.includes(`id: '${effect.id}'`), `${label}: Katalog-Eintrag fehlt`);
  assert.ok(catalog.includes(`import('./${effect.component}')`), `${label}: lazy import fehlt`);
  assert.ok(source.includes(`export default ${effect.component}`), `${label}: default export fehlt`);

  assert.ok(!source.includes('Math.random('), `${label}: Math.random ist nicht erlaubt`);
  assert.ok(!source.includes('fetch('), `${label}: darf nicht nachladen`);

  assert.ok(
    source.includes('prefers-reduced-motion') || source.includes('usePrefersReducedMotion'),
    `${label}: Reduced-Motion-Behandlung fehlt`,
  );

  const entry = catalog.slice(catalog.indexOf(`id: '${effect.id}'`));
  const propsBlock = entry.slice(entry.indexOf('props: ['), entry.indexOf('productionSafe'));
  const keys = [...propsBlock.matchAll(/\{\s*key:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.ok(keys.length > 0, `${label}: keine Props deklariert`);
  for (const key of keys) {
    const uses = source.match(new RegExp(`\\b${key}\\b`, 'g')) ?? [];
    assert.ok(uses.length >= 2, `${label}: Prop "${key}" ist deklariert, wird aber nicht verwendet`);
  }

  if (effect.a11y) {
    assert.ok(source.includes('focus-visible'), `${label}: focus-visible fehlt`);
  }

  assert.ok(
    !concepts.includes(`['${effect.concept}'`),
    `${label}: Konzept-Platzhalter "${effect.concept}" wurde nicht entfernt`,
  );
}

// --- Verhaltens-Checks ---

// Wortrad: der Timer darf nicht laufen, wenn niemand hinsieht.
const wheel = readFileSync('src/motion-arsenal/effects/hero/RotatingWordWheel.tsx', 'utf8');
assert.ok(
  wheel.includes('if (reduced || !inView || list.length < 2) return'),
  'RotatingWordWheel: Timer ist nicht an Sichtbarkeit gekoppelt',
);
assert.ok(
  wheel.includes('return () => window.clearInterval(timer)'),
  'RotatingWordWheel: Intervall wird nicht aufgeraeumt',
);

// Stempel: Timeout muss beim Abbau geloescht werden.
const stamp = readFileSync('src/motion-arsenal/effects/forms/SuccessStampSubmit.tsx', 'utf8');
assert.ok(
  stamp.includes('useEffect(() => () => window.clearTimeout(timer.current), [])'),
  'SuccessStampSubmit: Timeout wird beim Unmount nicht geloescht',
);

// Fortschrittsring: der Anteil muss direkt in stroke-dasharray landen.
const ring = readFileSync('src/motion-arsenal/effects/system/ProgressRingScanner.tsx', 'utf8');
assert.ok(
  ring.includes('strokeDasharray={`${value} 1`}'),
  'ProgressRingScanner: Fortschritt wird nicht als Anteil gesetzt',
);

console.log(`Batch-3-Konzeptueberfuehrung: ${EFFECTS.length} Effekte vertragskonform.`);
