// Contract-Test AngledGoldStrike — prüft VERHALTEN, nicht nur Tokens:
//  1. Pure CSS: kein rAF/JS-Animation (Compositor-only).
//  2. Reduced Motion: Media-Query deaktiviert transition UND animation
//     (CSS-only-Effekt braucht die Query statt des Hooks) + JS-Guard
//     `struck || !reduced` entscheidet, ob die Linie gerendert wird.
//  3. Geclampte Props (angle/thickness/speed), ms-Konvertierung ×1000,
//     :hover/:focus-visible-Trigger, aria-hidden auf der Deko-Linie.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/hero/AngledGoldStrike.tsx', 'utf8');

// --- 1. Pure CSS --------------------------------------------------------------
assert.ok(!/requestAnimationFrame|useRafLoop|setInterval/.test(source),
  'Strike muss CSS-only sein (kein rAF/JS-Timer)');
assert.ok(source.includes('@keyframes ags-sweep'), 'Auto-Sweep-Keyframes fehlen');
assert.ok(source.includes('scaleX(0)') && source.includes('scaleX(1)'),
  'scaleX-Draw-Mechanik fehlt');

// --- 2. Trigger: Hover + Keyboard ---------------------------------------------
assert.ok(source.includes(':hover'), 'Hover-Trigger fehlt');
assert.ok(source.includes(':focus-visible'), 'Keyboard-Fokus-Trigger fehlt (a11y)');

// --- 3. Reduced Motion (CSS-only → Media-Query ist Pflicht) --------------------
assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'), 'Media-Query fehlt');
assert.ok(source.includes('transition: none !important'), 'Media-Query muss Transitionen hart abschalten');
assert.ok(source.includes('animation: none !important'), 'Media-Query muss Animationen hart abschalten');
assert.ok(source.includes('showLine = struck || !reduced'),
  'JS-Guard: bei reduced motion nur statisch gestrichen wenn struck');

// --- 4. Determinismus & Clamping -----------------------------------------------
assert.ok(!source.includes('Math.random'), 'keine unseeded Zufallswerte erlaubt');
assert.ok(!source.includes('fetch('), 'keine Runtime-Netzwerk-Requests');
assert.ok(source.includes('clamp(angle, -20, 20)'), 'angle muss geclampt sein');
assert.ok(source.includes('clamp(thickness, 1, 8)'), 'thickness muss geclampt sein');
assert.ok(source.includes('clamp(speed, 0.1, 3)'), 'speed muss geclampt sein');

// --- 5. ms-Konvertierung (Sekunden × 1000) -------------------------------------
assert.ok(source.includes('* 1000'), 'Dauer muss Sekunden × 1000 → ms konvertieren');
assert.ok(source.includes('transitionMs'), 'ms-Wert muss in transition einfließen');
assert.ok(source.includes('2400ms'), 'Auto-Sweep-Animation braucht explizite ms-Basis');

// --- 6. Controlled struck-Zustand ----------------------------------------------
assert.ok(source.includes('ags-struck'), 'struck-Prop muss Root-Klasse ags-struck setzen');
assert.ok(source.includes('aria-hidden'), 'Strike-Linie ist dekorativ → aria-hidden');

console.log('angled gold strike contract: OK (CSS-only, reduced via Query+Guard, clamps, ms, a11y)');
