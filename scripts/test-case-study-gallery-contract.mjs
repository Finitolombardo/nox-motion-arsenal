import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/motion-arsenal/effects/premium/NoxCaseStudyGallery.tsx', import.meta.url), 'utf8');

assert.match(source, /layout === 'carousel'/, 'carousel layout branch is missing');
assert.match(source, /overflow-x:auto/, 'carousel must use a real horizontally scrollable track');
assert.match(source, /scroll-snap-type:x (?:proximity|mandatory)/, 'carousel must expose scroll snapping');
assert.match(source, /--ncsg-card-size:clamp\(/, 'carousel must keep editorial multi-card sizing');
assert.match(source, /setPointerCapture\(event\.pointerId\)/, 'desktop pointer drag capture is missing');
assert.match(source, /startInertia\(/, 'desktop kinetic release/inertia is missing');
assert.match(source, /requestAnimationFrame\(/, 'carousel visual sync must be animation-frame driven');
assert.match(source, /--ncsg-parallax/, 'scroll-linked image parallax is missing');
assert.match(source, /--ncsg-depth/, 'neighbor depth treatment is missing');
assert.match(source, /draggable=\{false\}/, 'native image dragging must be disabled inside the carousel');
assert.match(source, /prefers-reduced-motion: reduce/, 'reduced-motion runtime detection is missing');
assert.match(source, /@media\(prefers-reduced-motion:reduce\)/, 'reduced-motion CSS fallback is missing');
assert.match(source, /width:44px;height:44px/, 'gallery controls must keep 44px touch targets');
assert.doesNotMatch(source, /\.ncsg-carousel \.ncsg-card\{inset:4% 14%\}/, 'legacy fake-carousel positioning must not return');

console.log('case-study-gallery contract: OK (native scroll, pointer drag, inertia, snap, depth, a11y, reduced motion)');