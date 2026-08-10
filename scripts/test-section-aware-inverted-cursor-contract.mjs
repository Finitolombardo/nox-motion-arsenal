// Contract-Test SectionAwareInvertedCursor — prüft VERHALTEN:
//  1. rAF-Loop läuft NUR bei !reduced && inView (running-Guard).
//  2. usePointer wird als Ref verwendet: pointer.current.x/y, NICHT destructured.
//  3. IntersectionObserver für [data-cursor-theme] mit io.disconnect()-Cleanup.
//  4. Latch: Position wird nur zugewiesen, wenn latch.current.inside true ist.
//  5. Keine unseeded Zufallswerte, kein fetch.
//  6. Clamping aller numerischen Props (size/followSize/followLag/transitionDuration).
//  7. A11y: Cursor-Layer aria-hidden.
//  8. Reduced Motion: Transition 0s, rAF stoppt, Follower-Ring bedingt gerendert.
//  9. CSS-Variablen auf dem Root-Element mit Prefix sac-.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/cursor/SectionAwareInvertedCursor.tsx', 'utf8');

// --- 1. rAF-Guard: running = !reduced && inView --------------------------------
assert.ok(source.includes('useRafLoop('), 'muss useRafLoop verwenden');
const rafCall = source.indexOf('useRafLoop(');
assert.ok(source.indexOf('!reduced && inView', rafCall) > rafCall,
  'running-Argument muss !reduced && inView enthalten (nach useRafLoop-Aufruf)');

// --- 2. usePointer als Ref ------------------------------------------------------
assert.ok(source.includes('usePointer(rootRef)'), 'muss usePointer(rootRef) verwenden');
assert.ok(source.includes('pointer.current.tx') && source.includes('pointer.current.ty'),
  'muss pointer.current.tx / pointer.current.ty verwenden (echte Mausposition; x/y bleibt 0.5)');
assert.ok(!source.match(/pointer\.current\.[xy]\s*\*/),
  'usePointer x/y darf NICHT für Positionen verwendet werden (bleibt Container-Mitte)');

// --- 3. IntersectionObserver + Cleanup ------------------------------------------
assert.ok(source.includes('new IntersectionObserver'), 'muss IntersectionObserver verwenden');
assert.ok(source.includes("querySelectorAll('[data-cursor-theme]')"),
  'muss [data-cursor-theme]-Sektionen beobachten');
assert.ok(source.includes('io.disconnect()'), 'muss io.disconnect() im Cleanup haben');

// --- 4. Latch -------------------------------------------------------------------
assert.ok(source.includes('latch.current.inside'), 'muss Latch für Pointer-Inside verwenden');
assert.ok(source.includes('if (!latch.current.inside) return;'),
  'Position-Zuweisung muss hinter dem Latch-Guard stehen');

// --- 3b. Maus-basierte Theme-Bestimmung (primär, immersive-g-Verhalten) ----------
// Der Cursor muss die Farbe an der Mausposition wechseln — nicht nur per
// IntersectionObserver (der bei gleichzeitig sichtbaren Sektionen klemmt).
assert.ok(source.includes('document.elementFromPoint('),
  'muss Sektion unter der Maus per elementFromPoint bestimmen');
assert.ok(source.includes("closest?.('[data-cursor-theme]')"),
  'muss per closest die Theme-Sektion finden');
assert.ok(source.includes('themeRef.current'),
  'muss themeRef gegen Re-Render-Spam verwenden');
const epPos = source.indexOf('document.elementFromPoint(');
assert.ok(source.indexOf('applyTheme(', epPos) > epPos,
  'Theme-Zuweisung muss nach der elementFromPoint-Bestimmung kommen');

// --- 5. Deterministisch + kein Netzwerk -----------------------------------------
assert.ok(!source.includes('Math.random('), 'keine unseeded Zufallswerte erlaubt (Math.random() als Aufruf)');
assert.ok(!source.includes('fetch('), 'keine Netzwerk-Requests');
assert.ok(!source.includes('getContext('), 'kein Canvas/WebGL-Fake');

// --- 6. Clamping ----------------------------------------------------------------
for (const c of [
  'clamp(size, 4, 40)',
  'clamp(followSize, 10, 80)',
  'clamp(followLag, 0.05, 0.5)',
  'clamp(transitionDuration, 0.1, 1.0)',
]) {
  assert.ok(source.includes(c), `Clamping fehlt: ${c}`);
}

// --- 7. A11y --------------------------------------------------------------------
assert.ok(source.includes('aria-hidden="true"'), 'Cursor-Layer muss aria-hidden sein');

// --- 8. Reduced Motion ----------------------------------------------------------
assert.ok(source.includes('prefers-reduced-motion: reduce'),
  'muss @media (prefers-reduced-motion: reduce) enthalten');
assert.ok(source.includes('transition-duration: 0s'),
  'Reduced Motion muss Transition auf 0s setzen');
assert.ok(source.includes('mode === \'ring\'') || source.includes('mode === "ring"'),
  'Follower-Ring muss bedingt gerendert werden');

// --- 9. CSS-Variablen auf Root --------------------------------------------------
assert.ok(source.includes('--sac-size'), 'muss CSS-Var --sac-size auf Root setzen');
assert.ok(source.includes('--sac-cursor-color'), 'muss CSS-Var --sac-cursor-color auf Root setzen');
assert.ok(source.includes('--sac-transition'), 'muss CSS-Var --sac-transition auf Root setzen');

console.log('section-aware-inverted-cursor contract: OK (rAF-Guard, usePointer-Ref, IntersectionObserver, Latch, clamps, a11y, reduced-motion)');
