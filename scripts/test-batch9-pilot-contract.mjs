import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');
const effects = [
  ['Bayer Dither Dissolve', 'BayerDitherDissolve', 'src/motion-arsenal/effects/transitions/BayerDitherDissolve.tsx', ['bayer', 'imageData', 'pixelated']],
  ['Inverse Glow Cursor', 'InverseGlowCursor', 'src/motion-arsenal/effects/cursor/InverseGlowCursor.tsx', ['difference', 'damp', 'translate3d']],
  ['Elastic Lag Grid', 'ElasticLagGrid', 'src/motion-arsenal/effects/scroll/ElasticLagGrid.tsx', ['damp', 'translate3d', 'gridTemplateColumns']],
  ['Glyph Matrix Rain', 'GlyphMatrixRain', 'src/motion-arsenal/effects/canvas-ui/GlyphMatrixRain.tsx', ['canvas', 'seededRandom', 'glyphs']],
  ['Kinetic Twist Typo', 'KineticTwistTypo', 'src/motion-arsenal/effects/hero/KineticTwistTypo.tsx', ['preserve-3d', 'rotateY', 'backface-visibility']],
  ['Progressive Blur Stack', 'ProgressiveBlurStack', 'src/motion-arsenal/effects/backgrounds/ProgressiveBlurStack.tsx', ['backdrop-filter', 'registerProperty', 'blur']],
];
for (const [concept, component, sourcePath, tokens] of effects) {
  const source = readFileSync(sourcePath, 'utf8');
  const catalog = readFileSync(sourcePath.replace(/\/[^/]+\.tsx$/, '/catalog.ts'), 'utf8');
  for (const token of tokens) assert.ok(source.toLowerCase().includes(token.toLowerCase()), `${component}: missing ${token}`);
  assert.ok(
    source.includes(`export default function ${component}`) ||
      source.includes(`export default ${component}`),
    `${component}: default export missing`
  );
  assert.ok(catalog.includes(`import('./${component}')`), `${component}: lazy import missing`);
  assert.ok(!source.includes('Math.random('), `${component}: Math.random forbidden`);
  assert.ok(source.includes('prefers-reduced-motion') || source.includes('usePrefersReducedMotion'), `${component}: reduced motion missing`);
  assert.ok(!concepts.includes(`['${concept}'`), `${component}: concept remains`);
}
console.log('Batch-9-Pilot: 6 Effekte vertragskonform.');
