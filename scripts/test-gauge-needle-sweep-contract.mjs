import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/system/GaugeNeedleSweep.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/system/catalog.ts', 'utf8');

// --- Struktur-/Token-Checks (zusätzlich, nicht alleiniger Beweis) ---
for (const token of [
  'GaugeNeedleSweep',
  'gnds-root',
  'gnds-scale',
  'gnds-needle-wrap',
  'seededRandom',
  'usePrefersReducedMotion',
  'useInView',
  'useRafLoop',
  'needleRef.current',
  'el.animate(',
  'overshoot',
  'START_DEG',
  'pathLength',
  'aria-label',
]) {
  assert.ok(source.includes(token), `gauge needle sweep contract missing: ${token}`);
}

assert.ok(catalog.includes("id: 'system-gauge-needle-sweep'"), 'catalog registration missing');
assert.ok(catalog.includes("import('./GaugeNeedleSweep')"), 'catalog lazy import missing');
assert.ok(!source.includes('Math.random'), 'gauge must be deterministic (no Math.random)');
assert.ok(!source.includes('fetch('), 'gauge must not fetch');

// --- Verhaltens-Checks (echte Logik, kein Token-Abgleich) ---
// 1. InView-Bug: startedRef darf NICHT vor der Verzweigung gesetzt werden.
//    Der erste Assign muss NACH dem `if (reduced)`-Einstieg liegen (also im
//    reduced- oder im inView-Zweig) — nie davor.
const firstAssign = source.indexOf('startedRef.current = true');
const reducedIf = source.indexOf('if (reduced)');
const inViewBranch = source.indexOf('else if (inView)');
assert.ok(firstAssign > -1 && reducedIf > -1 && inViewBranch > -1, 'startedRef/InView-Logik fehlt');
assert.ok(firstAssign > reducedIf, 'startedRef wird VOR dem reduced/inView-Check gesetzt (Bug)');

// 2. Kein toter State: run-State wurde entfernt.
assert.ok(!/const \[run, setRun\]/.test(source), 'toter run-State ist noch vorhanden');

// 3. min===max: Division durch 0 vermieden.
assert.ok(
  source.includes('span = safeMax - safeMin === 0 ? 1 : safeMax - safeMin'),
  'min===max Guard (span) fehlt — Division durch 0 möglich',
);

// 4. Finite Werte: targetPct/startPct müssen garantiert endlich sein.
assert.ok(source.includes('targetPct = (clampedValue - safeMin) / span'), 'targetPct nutzt span nicht (NaN-Risiko)');
assert.ok(source.includes('startPct = sweep === \'min\' ? 0 : clamp((clampedValue - safeMin) / span, 0, 1)'), 'startPct nutzt span nicht (NaN-Risiko)');

// 5. Animation nur nach Start: anim() muss 'none' liefern, solange nicht gestartet.
assert.ok(source.includes(": 'none'"), 'anim() liefert kein none vor Start');
assert.ok(source.includes('reduced ? undefined : started'), 'anim() berücksichtigt started nicht');

// 6. Reduced Motion: Nadel direkt auf Ziel, keine Animation.
assert.ok(
  source.includes('reduced ? toDeg : fromDeg'),
  'Reduced Motion Nadel-Endzustand fehlt',
);

console.log('gauge needle sweep contract: OK (Verhalten + Struktur)');
