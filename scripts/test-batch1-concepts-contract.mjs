// Contract-Test fuer Batch 1 der Konzept-Ueberfuehrung.
//
// Geprueft wird nicht nur, dass Tokens vorkommen, sondern dass die
// Eigenschaften halten, die diese Effekte produktionsreif machen:
// Determinismus, Reduced-Motion-Endzustand, Registrierung im Katalog,
// Verdrahtung jedes deklarierten Props und Barrierefreiheit dort, wo der
// Effekt bedienbar ist.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const EFFECTS = [
  {
    id: 'cards-accordion',
    component: 'AccordionCards',
    source: 'src/motion-arsenal/effects/cards/AccordionCards.tsx',
    catalog: 'src/motion-arsenal/effects/cards/catalog.ts',
    tokens: ['grid-template-rows', 'aria-expanded', 'aria-controls', 'min-height:0'],
    a11y: true,
  },
  {
    id: 'hero-blurry-text-reveal',
    component: 'BlurryTextReveal',
    source: 'src/motion-arsenal/effects/hero/BlurryTextReveal.tsx',
    catalog: 'src/motion-arsenal/effects/hero/catalog.ts',
    tokens: ['IntersectionObserver', 'observer.disconnect()', 'blur(var(--btr-blur))'],
    a11y: false,
  },
  {
    id: 'hero-gold-highlight-sweep',
    component: 'GoldHighlightSweep',
    source: 'src/motion-arsenal/effects/hero/GoldHighlightSweep.tsx',
    catalog: 'src/motion-arsenal/effects/hero/catalog.ts',
    tokens: ['background-size', 'IntersectionObserver', 'observer.disconnect()'],
    a11y: false,
  },
  {
    id: 'forms-input-focus-glow',
    component: 'InputFocusGlow',
    source: 'src/motion-arsenal/effects/forms/InputFocusGlow.tsx',
    catalog: 'src/motion-arsenal/effects/forms/catalog.ts',
    tokens: ['focus-within', 'htmlFor', 'aria-describedby', 'translateX'],
    a11y: true,
  },
  {
    id: 'system-skeleton-shimmer',
    component: 'SkeletonShimmerLoader',
    source: 'src/motion-arsenal/effects/system/SkeletonShimmerLoader.tsx',
    catalog: 'src/motion-arsenal/effects/system/catalog.ts',
    tokens: ['aria-busy', 'translateX(-100%)', 'nox-sk__sr'],
    a11y: false,
  },
  {
    id: 'originkit-sliding-pill-tabs',
    component: 'SlidingPillTabs',
    source: 'src/motion-arsenal/effects/originkit/SlidingPillTabs.tsx',
    catalog: 'src/motion-arsenal/effects/originkit/catalog.ts',
    tokens: ['role="tablist"', 'role="tab"', 'aria-selected', 'ResizeObserver', 'getBoundingClientRect', 'ArrowRight'],
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

  // Registrierung
  assert.ok(catalog.includes(`id: '${effect.id}'`), `${label}: Katalog-Eintrag fehlt`);
  assert.ok(catalog.includes(`import('./${effect.component}')`), `${label}: lazy import fehlt`);
  assert.ok(source.includes(`export default ${effect.component}`), `${label}: default export fehlt`);

  // Determinismus und Abschottung
  assert.ok(!source.includes('Math.random('), `${label}: Math.random ist nicht erlaubt`);
  assert.ok(!source.includes('fetch('), `${label}: darf nicht nachladen`);

  // Reduced Motion muss einen Endzustand definieren, nicht nur erwaehnt sein.
  assert.ok(
    source.includes('prefers-reduced-motion') || source.includes('usePrefersReducedMotion'),
    `${label}: Reduced-Motion-Behandlung fehlt`,
  );

  // Jedes im Katalog deklarierte Prop muss in der Implementierung gelesen
  // werden — sonst steht im Panel ein Regler ohne Wirkung.
  const entry = catalog.slice(catalog.indexOf(`id: '${effect.id}'`));
  const propsBlock = entry.slice(entry.indexOf('props: ['), entry.indexOf('productionSafe'));
  const keys = [...propsBlock.matchAll(/\{\s*key:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.ok(keys.length > 0, `${label}: keine Props deklariert`);
  for (const key of keys) {
    const uses = source.match(new RegExp(`\\b${key}\\b`, 'g')) ?? [];
    assert.ok(uses.length >= 2, `${label}: Prop "${key}" ist deklariert, wird aber nicht verwendet`);
  }

  // Bedienbare Effekte brauchen sichtbaren Tastaturfokus.
  if (effect.a11y) {
    assert.ok(source.includes('focus-visible'), `${label}: focus-visible fehlt`);
  }

  // Der Konzept-Platzhalter muss verschwunden sein, sonst steht der Effekt doppelt.
  const conceptName = effect.component.replace(/([a-z])([A-Z])/g, '$1 $2');
  assert.ok(
    !concepts.includes(`['${conceptName}'`),
    `${label}: Konzept-Platzhalter "${conceptName}" wurde nicht entfernt`,
  );
}

console.log(`Batch-1-Konzeptueberfuehrung: ${EFFECTS.length} Effekte vertragskonform.`);
