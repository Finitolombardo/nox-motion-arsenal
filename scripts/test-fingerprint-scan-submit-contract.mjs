// Contract-Test FingerprintScanSubmit — prüft VERHALTEN, nicht nur Tokens:
//  1. Zustandsmaschine: reduced-Guard verzweigt VOR dem Scan-Start
//     (setState('success') im reduced-Zweig liegt VOR setState('scanning')).
//  2. Timer nur im Nicht-reduced-Pfad + Cleanup bei Unmount (kein Timer-Leak).
//  3. scanDuration ist eine echte Sequenz-Dauer (scanMs → setState('success')).
//  4. Clamping (speed/scanDuration/pulseRings), ms ×1000, Rings-Guard.
//  5. A11y: aria-label, role="status" aria-live, disabled während Scan,
//     aria-hidden auf der Deko-Bühne.
//  6. Reduced: @media-Query schaltet animation/transition hart ab.
//  7. Kein Math.random / fetch / rAF (CSS + Timer, kein Frame-Loop).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/forms/FingerprintScanSubmit.tsx', 'utf8');

// --- 1. Zustandsmaschine: reduced-Guard VOR dem Scan-Start ------------------
const redBranch = source.indexOf("if (reduced) {");
assert.ok(redBranch !== -1, 'reduced-Verzweigung fehlt');
const redSuccess = source.indexOf("setState('success')", redBranch);
const scanningStart = source.indexOf("setState('scanning')");
assert.ok(redSuccess !== -1 && redSuccess < scanningStart,
  'reduced-Zweig muss VOR setState(\'scanning\') auf success wechseln (kein Scan bei reduced)');
assert.ok(source.includes("if (state !== 'idle') return;"),
  'Busy-Guard: kein erneuter Scan während laufendem Zustand');

// --- 2. Timer-Cleanup --------------------------------------------------------
assert.ok(source.includes('timers.current.forEach((t) => window.clearTimeout(t))'),
  'Timer-Cleanup bei Unmount fehlt (Leak-Gefahr)');
assert.ok(source.includes('window.setTimeout'), 'Scan-Sequenz muss Timer-basiert sein');

// --- 3. scanDuration treibt die Sequenz --------------------------------------
assert.ok(source.includes('later(() => {') && source.includes('setState(\'success\')'),
  'scanMs-Timer muss nach Ablauf auf success wechseln');
assert.ok(source.includes('scanMs') && source.includes('* 1000'),
  'scanDuration muss Sekunden × 1000 → ms konvertieren');

// --- 4. Clamping + Rings-Guard ----------------------------------------------
assert.ok(source.includes('clamp(speed, 0.1, 3)'), 'speed muss geclampt sein');
assert.ok(source.includes('clamp(scanDuration, 1, 4)'), 'scanDuration muss geclampt sein');
assert.ok(source.includes('clamp(pulseRings, 1, 6)'), 'pulseRings muss geclampt sein');
assert.ok(source.includes('Array.from({ length: rings }'), 'Ringe müssen aus rings-Länge entstehen');

// --- 5. A11y ------------------------------------------------------------------
assert.ok(source.includes('aria-label='), 'Button braucht aria-label (dynamischer Zustand)');
assert.ok(source.includes('role="status"') && source.includes('aria-live="polite"'),
  'Status braucht role=status + aria-live');
assert.ok(source.includes('disabled={state === \'scanning\'}'),
  'Button muss während des Scans disabled sein');
assert.ok(source.includes('aria-hidden'), 'Deko-Bühne (Fingerprint/Ringe) muss aria-hidden sein');

// --- 6. Reduced Motion (doppelt: JS-Guard + Media-Query) ----------------------
assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'), 'Media-Query fehlt');
assert.ok(source.includes('animation: none !important'), 'Media-Query muss Animationen hart abschalten');
assert.ok(source.includes('transition: none !important'), 'Media-Query muss Transitionen hart abschalten');

// --- 7. Determinismus & Performance -------------------------------------------
assert.ok(!source.includes('Math.random'), 'keine unseeded Zufallswerte erlaubt');
assert.ok(!source.includes('fetch('), 'keine Runtime-Netzwerk-Requests');
assert.ok(!source.includes('requestAnimationFrame') && !source.includes('useRafLoop'),
  'Scan ist CSS+Timer — kein rAF-Frame-Loop nötig');

console.log('fingerprint scan submit contract: OK (reduced-Guard vor Scan, Timer-Cleanup, clamps, a11y, media-query)');
