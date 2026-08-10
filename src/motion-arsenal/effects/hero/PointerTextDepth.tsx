import { useEffect, useMemo, useRef, useState } from 'react';
import {
  clamp,
  damp,
  seededRandom,
  useInView,
  usePointer,
  usePrefersReducedMotion,
  useRafLoop,
} from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// PointerTextDepth — große Display-Typo mit echter 3D-Tiefe: Jeder Buchstabe
// besitzt deterministische Tiefen-Faktoren (seeded PRNG, keine unseeded
// Zufallswerte) und kippt/schwebt mit gedämpftem Pointer-Follow (RAF nur für
// Pointer-Tracking, Lusion-Lambda skaliert mit `speed`). Gold-Gradient-Füllung
// mit langsamem Sheen-Drift. Referenz-Mechanik: „3D text effect – mousemove"
// (Dennis Garrn, CodePen, via codemyui) — eigene NOX-Variante, kein kopierter Code.
// ---------------------------------------------------------------------------

export interface PointerTextDepthProps {
  text?: string;
  /** Tilt-/Tiefen-Stärke 0..2 (geclampt). 0 = flache Typo. */
  depth?: number;
  /** Dämpfungs-Speed 0.1..3 (geclampt). */
  speed?: number;
  /** Gold-Basis für den Gradienten (hex). */
  color?: string;
  /** Weicher Gold-Schein hinter den Glyphen. */
  glow?: boolean;
  /** Deterministischer Seed für die per-Letter-Faktoren 1..20. */
  seed?: number;
}

interface CharFactor {
  ix: number;
  iy: number;
  iz: number;
}

export function PointerTextDepth({
  text = 'NOX FORGE',
  depth = 1,
  speed = 1,
  color = NOX_COLORS.gold,
  glow = true,
  seed = 7,
}: PointerTextDepthProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef);
  const startedRef = useRef(false);
  const [entered, setEntered] = useState(false);

  // Props mit Clamping — niemals unkontrollierte Werte in CSS/Animationen.
  const d = clamp(depth, 0, 2);
  const sp = clamp(speed, 0.1, 3);
  const gold = color || NOX_COLORS.gold;

  // Deterministische per-Letter-Faktoren (identisch bei jedem Replay).
  const factors = useMemo<CharFactor[]>(() => {
    const rnd = seededRandom((clamp(Math.round(seed), 1, 20) * 7 + 13) >>> 0);
    return Array.from({ length: text.length }, () => ({
      ix: 0.6 + rnd() * 1.6,
      iy: 0.6 + rnd() * 1.6,
      iz: 14 + rnd() * 56,
    }));
  }, [text, seed]);

  // Einmaliger Entrance: startedRef wird ERST nach der Reduced-Motion-Garde und
  // nur im inView-Zweig gesetzt — below-fold gemountet startet der Effekt nie.
  useEffect(() => {
    if (reduced) return;
    if (inView && !startedRef.current) {
      startedRef.current = true;
      setEntered(true);
    }
  }, [inView, reduced]);

  const tilt = useRef({ rx: 0, ry: 0, tz: 0 });

  // RAF ausschließlich für Pointer-Dämpfung; läuft nur inView && !reduced.
  useRafLoop((dt) => {
    const root = rootRef.current;
    if (!root) return;
    const p = pointer.current;
    const px = p.inside ? clamp(p.tx, 0, 1) - 0.5 : 0;
    const py = p.inside ? clamp(p.ty, 0, 1) - 0.5 : 0;
    const lambda = 5 + sp * 5; // speed 0.1..3 → Lambda 5.5..20
    const t = tilt.current;
    t.rx = damp(t.rx, py * -18 * d, lambda, dt);
    t.ry = damp(t.ry, px * 26 * d, lambda, dt);
    t.tz = damp(t.tz, (Math.abs(px) + Math.abs(py)) * 110 * d, lambda, dt);
    root.style.setProperty('--ptd-rx', t.rx.toFixed(3));
    root.style.setProperty('--ptd-ry', t.ry.toFixed(3));
    root.style.setProperty('--ptd-tz', t.tz.toFixed(1));
  }, !reduced && inView);

  const sheen = `linear-gradient(115deg, #7a4f1a 0%, ${gold} 36%, #ffe9b0 50%, ${gold} 64%, #7a4f1a 100%)`;

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={text}
      className="ptd-root"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        background: `radial-gradient(120% 95% at 50% 115%, #17100a 0%, ${NOX_COLORS.bg} 62%)`,
        perspective: '900px',
        cursor: 'crosshair',
      }}
    >
      <style>{`
        @keyframes ptd-stage-in {
          0%   { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: none; }
        }
        @keyframes ptd-char-in {
          0%   { opacity: 0; filter: blur(12px); }
          100% { opacity: 1; filter: blur(0); }
        }
        @keyframes ptd-sheen {
          0%   { background-position: 0% 50%, 0 0; }
          100% { background-position: 200% 50%, 0 0; }
        }
        .ptd-stage { transform-style: preserve-3d; }
        .ptd-stage.ptd-entered { animation: ptd-stage-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .ptd-char {
          display: inline-block;
          will-change: transform;
        }
        .ptd-char.ptd-in { animation: ptd-char-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .ptd-fill { animation: ptd-sheen 9s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ptd-char, .ptd-fill, .ptd-stage.ptd-entered { animation: none !important; }
          .ptd-char { transform: none !important; }
        }
      `}</style>

      <div
        className={`ptd-stage${entered ? ' ptd-entered' : ''}`}
        style={{
          display: 'inline-block',
          fontSize: 'clamp(34px, 11vw, 128px)',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          textAlign: 'center',
          whiteSpace: 'pre-wrap',
          padding: '0 4%',
          userSelect: 'none',
          filter: glow ? `drop-shadow(0 0 26px ${gold}40)` : undefined,
        }}
      >
        {Array.from(text).map((ch, i) => {
          const f = factors[i] ?? { ix: 1, iy: 1, iz: 30 };
          return (
            <span
              key={`${ch}-${i}`}
              aria-hidden
              className={`ptd-char${entered ? ' ptd-in' : ''}`}
              style={{
                ['--ptd-i' as string]: i,
                ['--ptd-ix' as string]: f.ix.toFixed(3),
                ['--ptd-iy' as string]: f.iy.toFixed(3),
                ['--ptd-iz' as string]: f.iz.toFixed(1),
                animationDelay: `${i * 34}ms`,
                transform: reduced
                  ? undefined
                  : `perspective(900px) rotateX(calc(var(--ptd-rx, 0) * var(--ptd-ix) * 1deg)) rotateY(calc(var(--ptd-ry, 0) * var(--ptd-iy) * 1deg)) translateZ(calc(var(--ptd-tz, 0) * var(--ptd-iz) * 1px))`,
              }}
            >
              <span
                className="ptd-fill"
                style={{
                  backgroundImage: sheen,
                  backgroundSize: '220% 100%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {ch}
              </span>
            </span>
          );
        })}
      </div>
      {!reduced && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '6%',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: 'var(--mono, monospace)',
            fontSize: 9,
            letterSpacing: '0.35em',
            color: NOX_COLORS.textDim,
            pointerEvents: 'none',
          }}
        >
          MOVE TO SHAPE
        </div>
      )}
    </div>
  );
}

export default PointerTextDepth;
