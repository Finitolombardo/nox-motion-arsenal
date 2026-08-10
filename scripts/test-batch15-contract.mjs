import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');

const effects = [
  ['LenticularTiltCard', 'cards', 'cards-lenticular-tilt'],
  ['GSAPFlipGalleryMorph', 'cards', 'cards-gsap-flip-gallery'],
  ['ViewTransitionCrossFade', 'transitions', 'transitions-view-transition-crossfade'],
  ['BackdropBlurGrainOverlay', 'overlays', 'overlays-backdrop-blur-grain'],
  ['ParticleTextReveal', 'hero', 'hero-particle-text-reveal'],
  ['WebGLWaterSlider', 'transitions', 'transitions-webgl-water-slider'],
  ['WebGPUDustDissolve', 'hero', 'hero-webgpu-dust-dissolve'],
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

for (const name of ['Lenticular Tilt', 'GSAP Flip Gallery Morph', 'View Transition API Cross-Fade', 'Backdrop Blur Grain Overlay', 'Three.js Particle Text Reveal', 'WebGL Water Distortion Slider', 'WebGPU Dust Dissolve Text']) {
  assert.ok(!concepts.includes(`'${name}'`), `${name} noch im Deck`);
}

console.log(`OK — ${effects.length} Batch-15-Effekte erfüllen den Contract.`);
