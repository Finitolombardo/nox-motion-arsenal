// Contract-Test fuer den Abschluss der Konzept-Ueberfuehrung.
//
// Neben den drei zuletzt gebauten Effekten prueft dieser Test die Eigenschaft,
// die den Abschluss ausmacht: das Konzeptdeck ist leer und kein Effekt steht
// noch doppelt als Platzhalter neben seiner echten Komponente.

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const EFFECTS = [
  {
    id: 'system-terminal-typewriter-hover',
    component: 'TerminalTypewriterHover',
    source: 'src/motion-arsenal/effects/system/TerminalTypewriterHover.tsx',
    catalog: 'src/motion-arsenal/effects/system/catalog.ts',
    tokens: ['steps(var(--ttw-chars),end)', '1ch', 'focus-visible'],
    a11y: true,
  },
  {
    id: 'cards-magnetic-field',
    component: 'MagneticFieldCards',
    source: 'src/motion-arsenal/effects/cards/MagneticFieldCards.tsx',
    catalog: 'src/motion-arsenal/effects/cards/catalog.ts',
    tokens: ['useHoverCapable', 'getBoundingClientRect', 'Math.hypot', 'cubic-bezier(.22,1.4,.4,1)'],
    a11y: false,
  },
  {
    id: 'bg-warp-tunnel-depth',
    component: 'WarpTunnelDepth',
    source: 'src/motion-arsenal/effects/backgrounds/WarpTunnelDepth.tsx',
    catalog: 'src/motion-arsenal/effects/backgrounds/catalog.ts',
    tokens: ['det(', 'transform-origin', 'aria-hidden="true"', 'is-layer-'],
    a11y: false,
  },
];

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
}

// --- Abschluss-Eigenschaften ---

// Das Konzeptdeck darf keine Platzhalter mehr enthalten.
const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');
const placeholders = (concepts.match(/^ {2}\['/gm) ?? []).length;
assert.equal(placeholders, 0, `Konzeptdeck enthaelt noch ${placeholders} Platzhalter`);

// Kein Effekt darf zweimal unter derselben ID im Katalog stehen — das war die
// Ursache der doppelten Prototype-Karten.
const effectsRoot = 'src/motion-arsenal/effects';
const seen = new Map();
const duplicates = [];
for (const family of readdirSync(effectsRoot)) {
  const file = join(effectsRoot, family, 'catalog.ts');
  if (!existsSync(file)) continue;
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\bid:\s*'([a-z0-9-]+)'/g)) {
    const id = match[1];
    if (seen.has(id)) duplicates.push(`${id} (${seen.get(id)} + ${family})`);
    else seen.set(id, family);
  }
}
assert.equal(duplicates.length, 0, `Doppelte Effekt-IDs: ${duplicates.join(', ')}`);

// Die Komponente jedes registrierten Effekts muss auch existieren.
const missing = [];
for (const family of readdirSync(effectsRoot)) {
  const file = join(effectsRoot, family, 'catalog.ts');
  if (!existsSync(file)) continue;
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/import\('\.\/([A-Za-z0-9_]+)'\)/g)) {
    const name = match[1];
    const candidates = [`${name}.tsx`, `${name}.ts`].map((f) => join(effectsRoot, family, f));
    if (!candidates.some((c) => existsSync(c))) missing.push(`${family}/${name}`);
  }
}
assert.equal(missing.length, 0, `Registriert, aber keine Datei: ${missing.join(', ')}`);

console.log(
  `Batch-4-Abschluss: ${EFFECTS.length} Effekte vertragskonform, Konzeptdeck leer, ${seen.size} IDs eindeutig, keine toten Registrierungen.`,
);
