import React, { useMemo, useRef } from 'react';
import { seededRandom, usePointer, usePrefersReducedMotion, useRafLoop, damp } from '../../lib/animationUtils';
import { toneVariants, mixRgb, rgbStr, type RGB } from '../../lib/color';
import { proximityEnergy, stepEnergy, pointerPx } from '../../lib/proximityField';
import { resolveGlyphs, type GlyphDef } from '../../lib/glyphRegistry';

// ---------------------------------------------------------------------------
// NoxAdaptedScribbleField — NOX-Produktionsvariante der ORYZO-Klasse.
//
// Referenz-Mechanik (jetzt echt umgesetzt, nicht mehr nur CSS-Keyframes):
//   Pointer → Proximity → lokale Energie → Farbe/Glow/Strichbreite/Transform → Decay
//
// Jedes Scribble ist ein eigenständiges Objekt. Kommt der Pointer nah, steigt
// seine Energie schnell (attack), es färbt sich von gedämpft zu Ember/Gold,
// verdickt den Strich, glüht auf, skaliert leicht und driftet zum Pointer.
// Verlässt der Pointer die Zone, klingt die Energie langsam ab (Nachglühen).
// Die organische Grund-Drift läuft weiter als CSS-Keyframe. Symbole sind über
// `symbols` austauschbar (Glyph-Registry).
// ---------------------------------------------------------------------------

export interface ScribbleFieldProps {
  colorMode?: 'nox' | 'ember' | 'mono';
  intensity?: number; // 0..1 — Grund-Deckkraft/Glow
  speed?: number; // Tempo der Grund-Drift
  density?: number; // 3..14 — Anzahl Scribbles
  blur?: number; // px Blur der Glow-Kopie
  rotation?: number; // max. Grad der langsamen Rotation
  parallax?: number; // 0..1 Pointer-Parallax-Tiefe
  proximityRadius?: number; // px — Einflussradius der Pointer-Energie
  blendMode?: 'screen' | 'lighten' | 'plus-lighter' | 'normal';
  /** Canonical field interaction bridge; legacy direct imports retain pointer-attract behavior. */
  interaction?: 'ambient' | 'pointer-proximity' | 'pointer-attract';
  symbols?: GlyphDef[] | 'procedural-scribbles' | 'nox-runes'; // austauschbares Symbolset
  seed?: number;
}

const PALETTES: Record<string, string[]> = {
  nox: ['#C93030', '#d4a24a', '#ff4d4d', '#8a4a1f'],
  ember: ['#ff5a2e', '#C93030', '#ffb347', '#7a1f1f'],
  mono: ['#f0ece4', '#8a8781', '#5a5852', '#f0ece4'],
};

interface ScribbleObj {
  d: string;
  viewBox: string;
  idle: RGB;
  hot: RGB;
  x: number; // Center-% (0..100)
  y: number;
  depth: number;
  size: number; // % Breite
  dur: number;
  delay: number;
  drawDur: number;
  dir: number;
  width: number;
}

export function NoxAdaptedScribbleField({
  colorMode = 'nox',
  intensity = 0.8,
  speed = 1,
  density = 7,
  blur = 14,
  rotation = 16,
  parallax = 0.5,
  proximityRadius = 200,
  blendMode = 'screen',
  interaction = 'pointer-attract',
  symbols,
  seed = 7,
}: ScribbleFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const uid = useMemo(() => `nsf-${Math.floor(seed * 997)}`, [seed]);

  const count = Math.max(3, Math.min(14, Math.round(density)));

  const objects = useMemo<ScribbleObj[]>(() => {
    const rnd = seededRandom(seed);
    const palette = PALETTES[colorMode] ?? PALETTES.nox;
    const glyphs = resolveGlyphs(symbols ?? 'procedural-scribbles', seed, count);
    return Array.from({ length: count }, (_, i) => {
      const g = glyphs[i % glyphs.length];
      const tone = toneVariants(g.energyColor ?? palette[i % palette.length]);
      return {
        d: g.path,
        viewBox: g.viewBox ?? '0 0 220 200',
        idle: g.idleColor ? toneVariants(g.idleColor).idle : tone.idle,
        hot: tone.hot,
        x: 8 + rnd() * 80,
        y: 10 + rnd() * 76,
        depth: 0.25 + rnd() * 0.75,
        size: 9 + rnd() * 15,
        dur: (14 + rnd() * 18) / Math.max(speed, 0.05),
        delay: rnd() * -20,
        drawDur: (2.4 + rnd() * 2.2) / Math.max(speed, 0.05),
        dir: rnd() > 0.5 ? 1 : -1,
        width: (1.4 + rnd() * 1.8) * (g.weight ?? 1),
      };
    });
  }, [seed, colorMode, count, speed, symbols]);

  // Per-object live refs + energy state (mutated outside React for perf).
  const energyEls = useRef<Array<HTMLDivElement | null>>([]);
  const parallaxEls = useRef<Array<HTMLDivElement | null>>([]);
  const energies = useRef<number[]>(objects.map(() => 0.12));
  const par = useRef({ x: 0, y: 0 });

  useRafLoop(
    (dt) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();

      // Global damped parallax (Lusion: one physics source drives all layers).
      const pointerActive = interaction !== 'ambient';
      const targetX = pointerActive ? (pointer.current.tx - 0.5) * 2 : 0;
      const targetY = pointerActive ? (pointer.current.ty - 0.5) * 2 : 0;
      par.current.x = damp(par.current.x, targetX, 8, dt);
      par.current.y = damp(par.current.y, targetY, 8, dt);

      const ptr = pointerActive ? pointerPx(rect, pointer.current) : null;
      for (let i = 0; i < objects.length; i++) {
        const o = objects[i];
        // Parallax on the depth wrapper.
        const pel = parallaxEls.current[i];
        if (pel) {
          const depth = o.depth * parallax * 26;
          pel.style.transform = `translate3d(${(-par.current.x * depth).toFixed(2)}px, ${(-par.current.y * depth).toFixed(2)}px, 0)`;
        }
        // Proximity energy on the energy wrapper.
        const eel = energyEls.current[i];
        if (!eel) continue;
        const cx = (o.x / 100) * rect.width;
        const cy = (o.y / 100) * rect.height;
        let target = 0.1; // faint idle life
        let nudgeX = 0;
        let nudgeY = 0;
        if (ptr) {
          const dx = ptr.x - cx;
          const dy = ptr.y - cy;
          const dist = Math.hypot(dx, dy);
          const e = proximityEnergy(dist, proximityRadius);
          target = Math.max(0.1, e);
          if (interaction === 'pointer-attract' && dist > 0.001 && e > 0) {
            nudgeX = (dx / dist) * e * 9; // drift toward pointer
            nudgeY = (dy / dist) * e * 9;
          }
        }
        const en = stepEnergy(energies.current[i], target, dt, 13, 2.4);
        energies.current[i] = en;

        const col = rgbStr(mixRgb(o.idle, o.hot, en));
        eel.style.setProperty('--nsf-stroke', col);
        eel.style.setProperty('--nsf-crisp-op', String(Math.min(1, (0.42 + en * 0.68) * (0.6 + intensity * 0.4))));
        eel.style.setProperty('--nsf-glow-op', String(Math.min(1, (0.28 + en) * 0.85 * intensity)));
        eel.style.setProperty('--nsf-sw-crisp', `${(o.width * (1 + en * 1.15)).toFixed(2)}px`);
        eel.style.setProperty('--nsf-sw-glow', `${(o.width * 3.2 * (1 + en * 0.55)).toFixed(2)}px`);
        eel.style.transform = `translate3d(${nudgeX.toFixed(2)}px, ${nudgeY.toFixed(2)}px, 0) scale(${(1 + en * 0.14).toFixed(3)}) rotate(${(en * o.dir * 6).toFixed(2)}deg)`;
      }
    },
    !reduced,
  );

  return (
    <div
      ref={rootRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 110%, #16090a 0%, #0a0a0b 55%)' }}
    >
      <style>{`
        @keyframes ${uid}-drift {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
          33%  { transform: translate(1.6%, -2.2%) rotate(${rotation * 0.6}deg) scale(1.04); }
          66%  { transform: translate(-1.8%, 1.4%) rotate(-${rotation}deg) scale(0.97); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        @keyframes ${uid}-draw {
          0% { stroke-dashoffset: 1; }
          100% { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .${uid}-anim { animation: none !important; } }
      `}</style>
      {objects.map((o, i) => {
        const idleCol = rgbStr(mixRgb(o.idle, o.hot, 0.12));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${o.x}%`,
              top: `${o.y}%`,
              width: `${o.size}%`,
              aspectRatio: '1.1',
              transform: 'translate(-50%, -50%)',
              mixBlendMode: blendMode === 'normal' ? undefined : blendMode,
              willChange: 'transform',
            }}
          >
            <div
              ref={(el) => { parallaxEls.current[i] = el; }}
              style={{ width: '100%', height: '100%', willChange: 'transform' }}
            >
              <div
                className={`${uid}-anim`}
                style={{
                  width: '100%',
                  height: '100%',
                  animation: reduced ? undefined : `${uid}-drift ${o.dur}s ease-in-out ${o.delay}s infinite`,
                  transformOrigin: '50% 50%',
                }}
              >
                <div
                  ref={(el) => { energyEls.current[i] = el; }}
                  style={{
                    width: '100%',
                    height: '100%',
                    transformOrigin: '50% 50%',
                    willChange: 'transform',
                    // Static defaults (used as-is in reduced-motion; overwritten by the loop otherwise).
                    ['--nsf-stroke' as string]: idleCol,
                    ['--nsf-crisp-op' as string]: String(0.9 * intensity),
                    ['--nsf-glow-op' as string]: String(0.4 * intensity),
                    ['--nsf-sw-crisp' as string]: `${o.width}px`,
                    ['--nsf-sw-glow' as string]: `${o.width * 3.2}px`,
                  }}
                >
                  <svg viewBox={o.viewBox} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Glow copy (blurred, thick) */}
                    <path
                      d={o.d}
                      fill="none"
                      stroke="var(--nsf-stroke)"
                      strokeLinecap="round"
                      pathLength={1}
                      style={{ strokeWidth: 'var(--nsf-sw-glow)', filter: `blur(${blur * (0.5 + o.depth * 0.8)}px)`, opacity: 'var(--nsf-glow-op)' }}
                    />
                    {/* Crisp stroke, drawn in once on mount (KRANK stroke-dash mechanic) */}
                    <path
                      className={`${uid}-anim`}
                      d={o.d}
                      fill="none"
                      stroke="var(--nsf-stroke)"
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={reduced ? 0 : 1}
                      style={{
                        strokeWidth: 'var(--nsf-sw-crisp)',
                        opacity: 'var(--nsf-crisp-op)',
                        animation: reduced ? undefined : `${uid}-draw ${o.drawDur}s cubic-bezier(0.22, 1, 0.36, 1) ${Math.abs(o.delay) * 0.15}s forwards`,
                      }}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {/* Vignette so scribbles sit BEHIND content */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 55% at 50% 46%, rgba(10,10,11,0.55) 0%, transparent 68%)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.35em', color: '#8a8781' }}>NOX SIGNATURE LAYER</div>
          <div style={{ fontSize: 'clamp(28px, 5vw, 54px)', fontWeight: 750, letterSpacing: '-0.02em', color: '#f0ece4' }}>SCRIBBLE FIELD</div>
        </div>
      </div>
    </div>
  );
}

export default NoxAdaptedScribbleField;
