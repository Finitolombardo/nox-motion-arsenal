// Contract-Test fuer Batch 2 der Konzept-Ueberfuehrung.
// Gleiche Pruefungen wie Batch 1: Determinismus, Reduced-Motion-Endzustand,
// Registrierung, verdrahtete Props, Barrierefreiheit und ein geraeumtes
// Konzeptdeck. Dazu ein paar Eigenheiten, die diese sechs Effekte ausmachen.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const EFFECTS = [
  {
    id: 'system-count-up-metric-roller',
    component: 'CountUpMetricRoller',
    concept: 'Count-Up Metric Roller',
    source: 'src/motion-arsenal/effects/system/CountUpMetricRoller.tsx',
    catalog: 'src/motion-arsenal/effects/system/catalog.ts',
    tokens: ['@property --cmr-n', 'counter(cmr)', 'IntersectionObserver', 'nox-cmr__sr'],
    a11y: false,
  },
  {
    id: 'overlays-toast-stack-slide',
    component: 'ToastStackSlide',
    concept: 'Toast Stack Slide',
    source: 'src/motion-arsenal/effects/overlays/ToastStackSlide.tsx',
    catalog: 'src/motion-arsenal/effects/overlays/catalog.ts',
    tokens: ['aria-live="polite"', 'clearTimeout', 'scaleX', 'perspective'],
    a11y: true,
  },
  {
    id: 'forms-password-strength-meter',
    component: 'PasswordStrengthMeter',
    concept: 'Password Strength Meter',
    source: 'src/motion-arsenal/effects/forms/PasswordStrengthMeter.tsx',
    catalog: 'src/motion-arsenal/effects/forms/catalog.ts',
    tokens: ['aria-live="polite"', 'scorePassword', 'scaleX', 'aria-describedby'],
    a11y: true,
  },
  {
    id: 'hero-neon-tube-flicker-text',
    component: 'NeonTubeFlickerText',
    concept: 'Neon Tube Flicker Text',
    source: 'src/motion-arsenal/effects/hero/NeonTubeFlickerText.tsx',
    catalog: 'src/motion-arsenal/effects/hero/catalog.ts',
    tokens: ['text-shadow', 'aria-label={text}', 'aria-hidden="true"', 'det('],
    a11y: false,
  },
  {
    id: 'cursor-label-badge',
    component: 'CursorLabelBadge',
    concept: 'Cursor Label Badge',
    source: 'src/motion-arsenal/effects/cursor/CursorLabelBadge.tsx',
    catalog: 'src/motion-arsenal/effects/cursor/catalog.ts',
    tokens: ['useHoverCapable', 'useRafLoop', 'lerp(', 'translate3d', 'pointer-events:none'],
    a11y: false,
  },
  {
    id: 'bg-grain-film-overlay',
    component: 'GrainFilmOverlay',
    concept: 'Grain Film Overlay',
    source: 'src/motion-arsenal/effects/backgrounds/GrainFilmOverlay.tsx',
    catalog: 'src/motion-arsenal/effects/backgrounds/catalog.ts',
    tokens: ['feTurbulence', 'steps(1,end)', 'pointer-events:none', 'aria-hidden="true"'],
    a11y: false,
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

  // Jedes deklarierte Prop muss auch gelesen werden.
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

// --- Verhaltens-Checks, die ueber Token-Abgleich hinausgehen ---

// Toasts: jeder gesetzte Timer muss beim Abbau wieder geloescht werden, sonst
// feuert er in eine nicht mehr vorhandene Komponente.
const toast = readFileSync('src/motion-arsenal/effects/overlays/ToastStackSlide.tsx', 'utf8');
assert.ok(toast.includes('timers.current.push'), 'ToastStackSlide: Timer werden nicht gesammelt');
assert.ok(
  toast.includes('for (const timer of timers.current) window.clearTimeout(timer)'),
  'ToastStackSlide: Timer werden beim Unmount nicht aufgeraeumt',
);

// Cursor-Badge: die rAF-Schleife darf nicht dauerhaft laufen.
const badge = readFileSync('src/motion-arsenal/effects/cursor/CursorLabelBadge.tsx', 'utf8');
assert.ok(
  badge.includes('const running = hoverCapable && !reduced && label !== null'),
  'CursorLabelBadge: rAF-Schleife ist nicht an Hover-Faehigkeit und Zustand gekoppelt',
);

// Passwortbewertung: bekannte Schwaechen muessen Abzug geben, sonst ist die
// Anzeige irrefuehrend.
const meter = readFileSync('src/motion-arsenal/effects/forms/PasswordStrengthMeter.tsx', 'utf8');
for (const rule of ['(.)\\1{2,}', 'passwort|password|admin', '012|123']) {
  assert.ok(meter.includes(rule), `PasswordStrengthMeter: Abzugsregel fehlt (${rule})`);
}

console.log(`Batch-2-Konzeptueberfuehrung: ${EFFECTS.length} Effekte vertragskonform.`);
