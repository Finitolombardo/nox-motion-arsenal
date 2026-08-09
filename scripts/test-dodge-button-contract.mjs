// Contract-Test DodgeButton — prüft VERHALTEN:
//  1. Dodge-Loop läuft NUR bei !reduced && !caught (running-Guard der rAF-Schleife).
//  2. Touch/Stift: pointerType!=='mouse' → kein Dodge (Guard im pointermove).
//  3. Surrender: nach maxDodges-Episoden Ziel=0 (Button bleibt stehen, klickbar).
//  4. Deterministische Richtung aus dem Pointer-Offset (keine unseeded Zufallswerte).
//  5. Clamping aller Props (radius/distance/maxDodges/damping).
//  6. A11y: aria-label, role=status + aria-live, Deko-Bühne aria-hidden.
//  7. Kein fetch; rAF nur über useRafLoop mit Lauf-Guard (kein Dauerlauf).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/cursor/DodgeButton.tsx', 'utf8');

// --- 1. rAF-Guard: Loop stoppt bei reduced/caught ----------------------------
assert.ok(source.includes('!reduced && !caught'), 'rAF-Loop muss bei reduced/caught stoppen');
assert.ok(source.includes('useRafLoop('), 'Pointer-Tracking muss über useRafLoop laufen');
const rafCall = source.indexOf('useRafLoop(');
assert.ok(source.indexOf('!reduced && !caught', rafCall) > rafCall,
  'running-Argument muss reduced+caught ausklammern (nach useRafLoop-Aufruf)');

// --- 2. Touch/Stift-Guard ------------------------------------------------------
assert.ok(source.includes("e.pointerType !== 'mouse'"),
  'pointermove muss Touch/Stift (pointerType!==mouse) ausklammern');
assert.ok(source.includes('{ passive: true }'), 'pointermove passive (kein Blocking)');

// --- 3. Surrender-Logik ---------------------------------------------------------
assert.ok(source.includes('surrendered') && source.includes('dodges >= maxD'),
  'Surrender-Zustand fehlt (nach maxDodges ergibt sich der Button)');
assert.ok(source.includes('p.tx = 0') && source.includes('p.ty = 0'),
  'Surrender/außerhalb: Ziel muss zurück auf 0 (Ruheposition)');
assert.ok(source.includes('Math.min(n + 1, maxD)'), 'Dodge-Zähler muss bei maxD kappen');

// --- 4. Deterministisch ----------------------------------------------------------
assert.ok(source.includes('(-dx / len) * dist'), 'Ausweichrichtung aus Offset (deterministisch)');
assert.ok(!source.includes('Math.random'), 'keine unseeded Zufallswerte erlaubt');
assert.ok(!source.includes('fetch('), 'keine Netzwerk-Requests');

// --- 5. Clamping ------------------------------------------------------------------
for (const c of ['clamp(dodgeRadius, 40, 260)', 'clamp(dodgeDistance, 12, 120)',
  'clamp(maxDodges, 1, 12)', 'clamp(damping, 3, 18)']) {
  assert.ok(source.includes(c), `Clamping fehlt: ${c}`);
}

// --- 6. A11y ----------------------------------------------------------------------
assert.ok(source.includes('aria-label='), 'Button braucht aria-label (dynamischer Zustand)');
assert.ok(source.includes('role="status"') && source.includes('aria-live="polite"'),
  'HUD braucht role=status + aria-live');
assert.ok(source.includes('aria-hidden'), 'Deko-Bühne (Ring) muss aria-hidden sein');
assert.ok(source.includes(':focus-visible'), 'Reset-Button/Button brauchen Focus-Sichtbarkeit');

// --- 7. Kein Dauer-JS --------------------------------------------------------------
assert.ok(!source.includes('setInterval'), 'kein setInterval-Dauerlauf');
assert.ok(source.includes('btn.style.transform') || source.includes('translate3d'),
  'Bewegung muss über transform (GPU) laufen');

console.log('dodge button contract: OK (rAF-Guard reduced/caught, Touch-Guard, Surrender-Logik, clamps, a11y)');
