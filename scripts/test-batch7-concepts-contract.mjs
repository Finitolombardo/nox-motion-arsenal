import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');
const effects = [
  ['Glitch Color Flash Text', 'GlitchColorFlashText', 'src/motion-arsenal/effects/canvas-ui/GlitchColorFlashText.tsx', ['globalCompositeOperation', 'requestAnimationFrame', 'seededRandom']],
  ['GLSL Image Glitch', 'GlslImageGlitch', 'src/motion-arsenal/effects/canvas-ui/GlslImageGlitch.tsx', ['webgl', 'texture2D', 'uniform1f']],
  ['Gold Edge Flip Card', 'GoldEdgeFlipCard', 'src/motion-arsenal/effects/cards/GoldEdgeFlipCard.tsx', ['perspective', 'preserve-3d', 'backface-visibility']],
  ['Gooey Cursor Blob', 'GooeyCursorBlob', 'src/motion-arsenal/effects/cursor/GooeyCursorBlob.tsx', ['feGaussianBlur', 'feColorMatrix', 'requestAnimationFrame']],
  ['Grid Sliced Hover', 'GridSlicedHover', 'src/motion-arsenal/effects/cards/GridSlicedHover.tsx', ['background-image', 'translateY', 'seededRandom']],
  ['Heat Haze Shimmer', 'HeatHazeShimmer', 'src/motion-arsenal/effects/img2threejs/HeatHazeShimmer.tsx', ['feTurbulence', 'feDisplacementMap', 'mask-image']],
];
for (const [concept, component, sourcePath, tokens] of effects) {
  const source = readFileSync(sourcePath, 'utf8');
  const catalog = readFileSync(sourcePath.replace(/\/[^/]+\.tsx$/, '/catalog.ts'), 'utf8');
  for (const token of tokens) assert.ok(source.toLowerCase().includes(token.toLowerCase()), `${component}: missing ${token}`);
  assert.ok(source.includes(`export default function ${component}`), `${component}: default export missing`);
  assert.ok(catalog.includes(`import('./${component}')`), `${component}: lazy import missing`);
  assert.ok(!source.includes('Math.random('), `${component}: Math.random forbidden`);
  assert.ok(source.includes('prefers-reduced-motion') || source.includes('usePrefersReducedMotion'), `${component}: reduced motion missing`);
  assert.ok(!concepts.includes(`['${concept}'`), `${component}: concept remains`);
}
console.log('Batch-7-Konzeptueberfuehrung: 6 Effekte vertragskonform.');
