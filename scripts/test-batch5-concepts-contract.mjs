import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');
const effects = [
  ['bg-aurora-beam-drift', 'AuroraBeamDrift', 'Aurora Beam Drift', 'src/motion-arsenal/effects/backgrounds/AuroraBeamDrift.tsx', ['seededRandom', 'mix-blend-mode', 'prefers-reduced-motion']],
  ['cursor-ball-pit-sinkhole-reveal', 'BallPitSinkholeReveal', 'Ball Pit Sinkhole Reveal', 'src/motion-arsenal/effects/cursor/BallPitSinkholeReveal.tsx', ['canvas', 'requestAnimationFrame', 'seededRandom', 'prefers-reduced-motion']],
  ['hero-black-mirror-cracked-text', 'BlackMirrorCrackedText', 'Black Mirror Cracked Text', 'src/motion-arsenal/effects/hero/BlackMirrorCrackedText.tsx', ['clip-path', 'translate', 'prefers-reduced-motion']],
  ['bg-blurry-vhs-image-filter', 'BlurryVhsImageFilter', 'Blurry VHS Image Filter', 'src/motion-arsenal/effects/backgrounds/BlurryVhsImageFilter.tsx', ['filter:', 'mix-blend-mode', 'prefers-reduced-motion']],
  ['originkit-button-border-glitch', 'ButtonBorderGlitch', 'Button Border Glitch', 'src/motion-arsenal/effects/originkit/ButtonBorderGlitch.tsx', ['repeating-linear-gradient', 'steps(', 'focus-visible', 'prefers-reduced-motion']],
  ['cards-card-fan-deck', 'CardFanDeck', 'Card Fan Deck', 'src/motion-arsenal/effects/cards/CardFanDeck.tsx', ['perspective', 'translateZ', 'seededRandom', 'prefers-reduced-motion']],
];
for (const [id, component, concept, sourcePath, tokens] of effects) {
  const source = readFileSync(sourcePath, 'utf8');
  const catalog = readFileSync(sourcePath.replace(/\/[^/]+\.tsx$/, '/catalog.ts'), 'utf8');
  assert.ok(catalog.includes(`id: '${id}'`), `${component}: catalog entry missing`);
  for (const token of tokens) assert.ok(source.includes(token), `${component}: missing ${token}`);
  assert.ok(catalog.includes(`import('./${component}')`), `${component}: lazy import missing`);
  assert.ok(source.includes(`export default ${component}`) || source.includes(`export default function ${component}`), `${component}: default export missing`);
  assert.ok(!source.includes('Math.random('), `${component}: Math.random is forbidden`);
  assert.ok(!source.includes('fetch('), `${component}: fetch is forbidden`);
  assert.ok(!concepts.includes(`['${concept}'`), `${component}: concept remains`);
  const entry = catalog.slice(catalog.indexOf(`id: '${id}'`), catalog.indexOf(`id: '${id}'`) + 2400);
  assert.ok((entry.match(/key: '/g) ?? []).length >= 2, `${component}: props missing`);
}
console.log(`Batch-5-Konzeptueberfuehrung: ${effects.length} Effekte vertragskonform.`);
