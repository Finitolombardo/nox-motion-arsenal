import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');

const effects = [
  ['StrobeLightText', 'hero', 'hero-strobe-light'],
  ['SVGMascotPulse', 'hero', 'hero-svg-mascot-pulse'],
  ['SortingVisualizer', 'canvas-ui', 'canvasui-sorting-visualizer'],
  ['CanvasLineTypo', 'canvas-ui', 'canvasui-canvas-line-typo'],
  ['TearingPhotoDrag', 'cards', 'cards-tearing-photo-drag'],
  ['TypewriterCommandPalette', 'overlays', 'overlays-typewriter-command-palette'],
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

for (const name of ['Strobe Light Text', 'SVG Mascot Pulse', 'Sorting Visualizer', 'Typewriter Command Palette', 'Canvas Line Typography', 'Tearing Photo Drag']) {
  assert.ok(!concepts.includes(`'${name}'`), `${name} noch im Deck`);
}
assert.ok(concepts.includes(`'Terminal Typewriter Hover'`), 'Terminal Typewriter Hover wurde fälschlich entfernt');
console.log(`OK — ${effects.length} Batch-13-Effekte erfüllen den Contract.`);
