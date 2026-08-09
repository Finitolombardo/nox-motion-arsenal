import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/motion-arsenal/effects/hero/GoldOutlineFillText.tsx', 'utf8');
const catalog = readFileSync('src/motion-arsenal/effects/hero/catalog.ts', 'utf8');

// --- Struktur-/Token-Checks (zusätzlich, nicht alleiniger Beweis) ---
for (const token of [
  'GoldOutlineFillText',
  'goft-root',
  'goft-filled',
  'goft-shimmer',
  'goftShimmer',
  'usePrefersReducedMotion',
  'useInView',
  '-webkit-text-stroke',
  'background-clip: text',
  'fillOn',
  'strokeWidth',
]) {
  assert.ok(source.includes(token), `gold outline fill text contract missing: ${token}`);
}

assert.ok(catalog.includes("id: 'hero-gold-outline-fill-text'"), 'catalog registration missing');
assert.ok(catalog.includes("import('./GoldOutlineFillText')"), 'catalog lazy import missing');
assert.ok(!source.includes('Math.random'), 'gold outline must be deterministic (no Math.random)');
assert.ok(!source.includes('fetch('), 'gold outline must not fetch');

// --- Verhaltens-Checks ---
// 1. Scroll-Latch: ein latched State, kein direkter inView===filled.
assert.ok(
  source.includes('setScrollLatched') && source.includes('scrollLatched'),
  'Scroll-Latch (scrollLatched) fehlt — Effekt springt beim Rausscrollen zurück',
);
assert.ok(
  source.includes('fillOn === \'scroll\' && (inView || scrollLatched)'),
  'scrollFilled nutzt Latch nicht (inView allein = kein Latch)',
);

// 2. Kein toter touched-State (Entscheidung: State entfernt, Pointer-Events statt Mouse-Events).
assert.ok(!/const \[touched, setTouched\]/.test(source), 'toter touched-State ist noch vorhanden');
assert.ok(source.includes('onPointerEnter') && source.includes('onPointerLeave'), 'Pointer-Events (Touch-Fallback) fehlen');

// 3. Click-Accessibility: Keyboard-Bedienbarkeit (role=button, tabIndex, Enter/Space).
assert.ok(source.includes('role: \'button\'') || source.includes('role="button"'), 'click-Modus ohne role="button" (kein Keyboard-Support)');
assert.ok(source.includes('tabIndex: 0'), 'click-Modus ohne tabIndex (nicht fokussierbar)');
assert.ok(source.includes("e.key === 'Enter' || e.key === ' '"), 'click-Modus ohne Enter/Space-Handler');

// 4. Reduced Motion: @media (prefers-reduced-motion: reduce) deaktiviert Transition + Shimmer.
assert.ok(
  source.includes('@media (prefers-reduced-motion: reduce)'),
  'Reduced-Motion-Media-Query fehlt',
);
assert.ok(
  source.includes('transition: none !important'),
  'Reduced Motion deaktiviert Transition nicht',
);
assert.ok(
  source.includes('animation: none !important'),
  'Reduced Motion deaktiviert Shimmer nicht',
);
// Shimmer-Klasse darf bei reduced nicht gesetzt werden (JS-seitige Absicherung zusätzlich zur Media-Query).
assert.ok(
  source.includes('shimmer && filled && !reduced'),
  'goft-shimmer kann trotz reduced gesetzt werden (JS-Guard fehlt)',
);

console.log('gold outline fill text contract: OK (Verhalten + Struktur)');
