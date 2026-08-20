import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/backgrounds/ForgeEnergyGlyphs.tsx', 'utf8');
const canonicalSource = readFileSync('src/motion-arsenal/effects/backgrounds/NoxInteractiveGlyphField.tsx', 'utf8');
const scribbleSource = readFileSync('src/motion-arsenal/effects/backgrounds/NoxAdaptedScribbleField.tsx', 'utf8');
const data = readFileSync('src/motion-arsenal/effects/backgrounds/forgeEnergyGlyphData.ts', 'utf8');
const styles = readFileSync('src/motion-arsenal/effects/backgrounds/forgeEnergyGlyphStyles.ts', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/backgrounds/catalog.ts', 'utf8');
const manifest = JSON.parse(readFileSync('public/agent-manifests/forge-energy-glyphs-variants.json', 'utf8'));

const variants = [
  'forge-ember-runes',
  'command-nexus-sigils',
  'revenue-ascension-seals',
  'automation-circuit-glyphs',
  'signal-growth-constellations',
];
const states = ['idle', 'warming', 'charged', 'overdrive', 'ritual', 'stealth'];
const combined = `${source}\n${data}\n${styles}`;

for (const token of [
  'NoxInteractiveGlyphField',
  "'glyphs'",
  "'scribble'",
  "'hybrid'",
  "'ambient'",
  "'pointer-proximity'",
  "'pointer-attract'",
  'ForgeEnergyGlyphs',
  'NoxAdaptedScribbleField',
]) {
  assert.ok(canonicalSource.includes(token), `Canonical glyph field contract missing: ${token}`);
}
assert.ok(catalog.includes("id: 'bg-nox-interactive-glyph-field'"), 'Catalog must register the canonical glyph field');
assert.ok(catalog.includes("legacyIds: ['bg-forge-energy-glyphs', 'bg-nox-scribble-field']"), 'Canonical glyph field must resolve both legacy ids');
assert.ok(source.includes('export function ForgeEnergyGlyphs'), 'ForgeEnergyGlyphs legacy wrapper must remain importable');
assert.ok(scribbleSource.includes('export function NoxAdaptedScribbleField'), 'NoxAdaptedScribbleField legacy wrapper must remain importable');

for (const token of [
  ...variants,
  ...states,
  'feg-connectors',
  'feg-link-pulse',
  'feg-event',
  'feg-heat',
  'COPY REF',
  'interactionMode',
  'rareGlyphChance',
  'showVariantSwitcher',
  'showStateSwitcher',
  'prefers-reduced-motion',
]) {
  assert.ok(combined.includes(token), `Forge glyph contract missing: ${token}`);
}

for (const id of variants) {
  const reference = `motion:bg-forge-energy-glyphs@${id}`;
  assert.ok(data.includes(reference), `Data registry missing reference: ${reference}`);
  assert.ok(manifest.variants.some((variant) => variant.id === id && variant.reference === reference), `Manifest missing variant: ${id}`);
}

for (const state of states) {
  assert.ok(data.includes(`${state}: { label:`), `State registry missing: ${state}`);
}

assert.equal(manifest.effectId, 'bg-forge-energy-glyphs');
assert.deepEqual(manifest.states, states);
assert.equal(manifest.variants.length, variants.length);
assert.ok(catalog.includes('ForgeEnergyGlyphs'), 'Catalog must load ForgeEnergyGlyphs');
assert.ok(!combined.includes('Math.random'), 'Effect must remain deterministic');
assert.ok(!combined.includes('fetch('), 'Effect must not perform runtime network requests');

console.log('ForgeEnergyGlyphs multi-variant contract: OK');
