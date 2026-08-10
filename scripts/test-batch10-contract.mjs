import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');

const effects = [
  ['AuroraBorealisBackground', 'backgrounds', 'bg-aurora-borealis'],
  ['ScrollSyncedTypoBackground', 'backgrounds', 'bg-scroll-synced-typo'],
  ['DitheredDataHeatmap', 'backgrounds', 'bg-dithered-heatmap'],
  ['GridBlindMaskReveal', 'backgrounds', 'bg-grid-blind-mask'],
  ['PolaroidStackScroll', 'cards', 'cards-polaroid-stack-scroll'],
  ['LayeredZoomDolly', 'cards', 'cards-layered-zoom-dolly'],
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

  assert.ok(
    !concepts.includes(`'${component.replace(/Background$|Scroll$|Reveal$|Dolly$|Heatmap$/, '')}`),
    `${component}: Konzept-Eintrag noch im Deck`
  );
}

console.log(`OK — ${effects.length} Batch-10-Effekte erfüllen den Contract.`);
