import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');
const effects = [
  ['Cinema Letterbox Modal', 'CinemaLetterboxModal', 'src/motion-arsenal/effects/overlays/CinemaLetterboxModal.tsx', ['letterbox', 'prefers-reduced-motion', 'role="dialog"']],
  ['Clipped Section Stack', 'ClippedSectionStack', 'src/motion-arsenal/effects/scroll/ClippedSectionStack.tsx', ['clip-path', 'sticky', 'prefers-reduced-motion']],
  ['Connected Grid Pulse', 'ConnectedGridPulse', 'src/motion-arsenal/effects/system/ConnectedGridPulse.tsx', ['svg', 'stroke-dashoffset', 'prefers-reduced-motion']],
  ['Container Scroll SplitText', 'ContainerScrollSplitText', 'src/motion-arsenal/effects/scroll/ContainerScrollSplitText.tsx', ['scrollTop', 'rotateX', 'prefers-reduced-motion']],
  ['Context Aware Fixed Emblem', 'ContextAwareFixedEmblem', 'src/motion-arsenal/effects/scroll/ContextAwareFixedEmblem.tsx', ['Intersection', 'position:fixed', 'prefers-reduced-motion']],
  ['Counter Preloader', 'CounterPreloader', 'src/motion-arsenal/effects/system/CounterPreloader.tsx', ['requestAnimationFrame', 'clip-path', 'prefers-reduced-motion']],
];
for (const [concept, component, sourcePath, tokens] of effects) {
  const source = readFileSync(sourcePath, 'utf8');
  assert.ok(!concepts.includes(`['${concept}'`), `${component}: concept remains`);
  assert.ok(source.includes(`export default function ${component}`), `${component}: default export missing`);
  for (const token of tokens) assert.ok(source.toLowerCase().includes(token.toLowerCase()), `${component}: missing ${token}`);
  assert.ok(!source.includes('Math.random('), `${component}: Math.random forbidden`);
  assert.ok(!source.includes('fetch('), `${component}: fetch forbidden`);
}
console.log('Batch-6-Konzeptueberfuehrung: 6 Effekte vertragskonform.');
