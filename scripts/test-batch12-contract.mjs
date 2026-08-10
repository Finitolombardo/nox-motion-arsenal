import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');

const effects = [
  ['PathFollowHeroScroll', 'hero', 'hero-path-follow'],
  ['HolographicTypeEffect', 'hero', 'hero-holographic-type'],
  ['SquigglyDistortionText', 'hero', 'hero-squiggly-distortion'],
  ['DottedWorldMapConnect', 'hero', 'hero-dotted-world-map'],
  ['SlotReelTextRoll', 'hero', 'hero-slot-reel'],
  ['SplitSlicedTextDecomposition', 'hero', 'hero-split-sliced'],
];

for (const [component, category, id] of effects) {
  const path = `src/motion-arsenal/effects/${category}/${component}.tsx`;
  assert.ok(existsSync(path), `${path} fehlt`);

  const source = readFileSync(path, 'utf8');
  assert.ok(
    source.includes(`export default function ${component}`) ||
      source.includes(`export default ${component}`),
    `${component}: default export missing`
  );

  const catalog = readFileSync(`src/motion-arsenal/effects/${category}/catalog.ts`, 'utf8');
  assert.ok(catalog.includes(`id: '${id}'`), `${id}: Katalog-Eintrag fehlt`);
  assert.ok(catalog.includes(`name: '${component}'`), `${component}: Katalog-Name fehlt`);
  assert.ok(catalog.includes(`./${component}`), `${component}: lazy import fehlt`);
}

assert.ok(!concepts.includes(`'Split & Sliced Text Decomposition'`), 'Split & Sliced noch im Deck');
console.log(`OK — ${effects.length} Batch-12-Effekte erfüllen den Contract.`);
