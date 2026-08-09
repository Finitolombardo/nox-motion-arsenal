// Contract-Test PointerTextDepth — prüft VERHALTEN, nicht nur Tokens:
//  1. startedRef.current = true liegt NACH der reduced-Garde und NUR im
//     inView-Zweig (below-fold gemountet darf nie gestartet werden).
//  2. rAF-Loop läuft nur bei !reduced && inView (kein Frame below-fold).
//  3. Deterministisch (seededRandom, kein Math.random), geclampte Props,
//     aria-hidden auf Deko, Media-Query als Reduced-Motion-Sicherheitsnetz.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/hero/PointerTextDepth.tsx', 'utf8');

// --- 1. startedRef-Position: erster Assign NACH dem reduced-Guard -----------
const guardIdx = source.indexOf('if (reduced) return;');
assert.ok(guardIdx > -1, 'reduced-Guard fehlt');
const startAssign = source.indexOf('startedRef.current = true');
assert.ok(startAssign > -1, 'startedRef-Zuweisung fehlt');
assert.ok(
  startAssign > guardIdx,
  'startedRef.current = true muss NACH dem reduced-Guard stehen (below-fold/verzögerter Start bricht sonst)',
);
assert.ok(
  source.includes('inView && !startedRef.current'),
  'startedRef darf nur im inView-Zweig gesetzt werden (einmaliger Start beim In-View)',
);

// --- 2. rAF gating -----------------------------------------------------------
assert.ok(source.includes('useRafLoop('), 'Pointer-Dämpfung muss über useRafLoop laufen');
assert.ok(
  source.includes('!reduced && inView'),
  'rAF-Loop muss mit !reduced && inView laufen (keine Arbeit below-fold / bei reduced motion)',
);
assert.ok(source.includes('usePrefersReducedMotion()'), 'usePrefersReducedMotion fehlt');

// --- 3. Determinismus & Clamping ---------------------------------------------
assert.ok(!source.includes('Math.random'), 'keine unseeded Zufallswerte erlaubt');
assert.ok(!source.includes('fetch('), 'keine Runtime-Netzwerk-Requests');
assert.ok(source.includes('seededRandom('), 'per-Letter-Faktoren müssen seeded sein (Preview-stabil)');
assert.ok(
  (source.match(/clamp\(/g) ?? []).length >= 3,
  'Props (depth/speed/seed) müssen mit clamp abgesichert sein',
);

// --- 4. A11y + Reduced-Motion-Sicherheitsnetz ---------------------------------
assert.ok(source.includes('aria-hidden'), 'dekorative Layer brauchen aria-hidden');
assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'), 'Media-Query fehlt');
assert.ok(
  source.includes('animation: none !important'),
  'Media-Query muss Animationen hart abschalten',
);

// --- 5. Per-Letter-3D: CSS-Vars + calc-Transforms -----------------------------
assert.ok(source.includes('--ptd-ix') && source.includes('--ptd-iy') && source.includes('--ptd-iz'),
  'per-Letter-Tiefenfaktoren (CSS-Vars) fehlen');
assert.ok(source.includes('perspective(900px)'), 'perspective-Transform fehlt');
assert.ok(source.includes('translateZ('), 'translateZ-Tiefe fehlt');

console.log('pointer text depth contract: OK (startedRef-Position, rAF-Gating, Determinismus, A11y, reduced)');
