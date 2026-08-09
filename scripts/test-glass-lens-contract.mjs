import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/canvas-ui/GlassLens.tsx', 'utf8');

// Public API stays compatible and clamps to the control ranges documented by the catalog.
for (const token of ['lensRadius?: number', 'zoom?: number', 'chroma?: number']) {
  assert.ok(source.includes(token), `glass lens public API missing: ${token}`);
}
assert.match(source, /clamp\(lensRadius,\s*0\.08,\s*0\.4\)/, 'lens radius must be clamped to catalog limits');
assert.match(source, /clamp\(zoom,\s*1,\s*4\)/, 'zoom must be clamped to catalog limits');
assert.match(source, /clamp\(chroma,\s*0,\s*0\.02\)/, 'chroma must be clamped to catalog limits');

// Optical material invariants: spherical normal, edge-biased dispersion, Fresnel and bounded specular response.
for (const token of [
  'sqrt(max(0.0, 1.0 - t * t))',
  'float dispersion = u_chroma * smoothstep(0.18, 0.82, t)',
  'float fresnel = pow(1.0 - normalZ, 3.0)',
  'float specular = pow(max(dot(normal, keyLight), 0.0), 34.0)',
]) {
  assert.ok(source.includes(token), `glass lens optical contract missing: ${token}`);
}

// Runtime invariants: idle/offscreen pause, live prop refresh, bounded DPR and touch scrolling.
assert.ok(source.includes("useInView(rootRef, '80px')"), 'glass lens must pause offscreen');
assert.ok(source.includes('const pointerRunning = !reduced && inView && (!hoverCapable || active)'), 'pointer physics must run only during meaningful interaction');
assert.ok(source.includes('const [configRefresh, setConfigRefresh] = useState(false)'), 'paused lens must support a bounded config refresh');
assert.ok(source.includes('window.setTimeout(() => setConfigRefresh(false), 96)'), 'config refresh must return promptly to idle');
assert.ok(source.includes('const shaderRunning = inView && (pointerRunning || configRefresh)'), 'shader runtime gate must include bounded prop refresh');
assert.ok(source.includes('running: shaderRunning'), 'shader runtime gate missing');
assert.ok(source.includes('dprCap: 1.25'), 'glass lens DPR budget missing');
assert.ok(source.includes("touchAction: 'pan-y'"), 'glass lens must preserve vertical touch scrolling');
assert.ok(!source.includes('uniform float u_time;'), 'glass lens must not depend on permanent time animation');
assert.ok(!source.includes('Math.random'), 'glass lens must remain deterministic');
assert.ok(!source.includes('fetch('), 'glass lens must remain self-contained');

console.log('canvas UI glass lens contract: OK');
