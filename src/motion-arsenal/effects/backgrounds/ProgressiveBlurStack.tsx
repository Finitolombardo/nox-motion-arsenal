import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ProgressiveBlurStack — Fokus-Stack mit abgestuften Blur- und Opacity-Ebenen.
// Derselbe Text liegt in N Ebenen übereinander; jede Ebene hat einen festen
// Blur-Offset, der Fokus-Punkt wandert (Hover, Scroll oder manuell) und
// verschiebt die Schärfe durch den Stack. @property registriert --pbs-focus,
// damit die Ebenen-Übergänge vom Compositor interpoliert werden; backdrop-filter
// gibt den dahinterliegenden Ebenen Tiefe. Kein rAF, keine unseeded Werte.
// ---------------------------------------------------------------------------

export interface ProgressiveBlurStackProps {
  /** Text des Fokus-Stacks (max. 16 Zeichen). */
  text?: string;
  /** Anzahl Ebenen (2–6). */
  layers?: number;
  /** Maximaler Blur der hintersten Ebene in px (2–40). */
  maxBlur?: number;
  /** Fokus-Position (0 = vorderste, 1 = hinterste Ebene). */
  focus?: number;
  /** Reagiert der Stack auf Pointer-Position (vertikal)? */
  pointerDriven?: boolean;
  /** Akzentfarbe. */
  color?: string;
  /** Seed für die deterministische Ebenen-Streuung. */
  seed?: number;
}

declare global {
  // Minimal-Typ für CSS.registerProperty (nicht in lib.dom).
  interface CSS {
    registerProperty?: (desc: {
      name: string;
      syntax: string;
      inherits: boolean;
      initialValue: string;
    }) => void;
  }
}

export function ProgressiveBlurStack({
  text = 'NOX',
  layers = 4,
  maxBlur = 26,
  focus = 0,
  pointerDriven = true,
  color = NOX_COLORS.gold,
  seed = 20260810,
}: ProgressiveBlurStackProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const safeLayers = clamp(Math.round(layers), 2, 6);
  const safeMaxBlur = clamp(maxBlur, 2, 40);

  const rnd = useMemo(() => seededRandom(seed), [seed]);
  // Deterministische Streuung: jede Ebene bekommt einen festen Blur-Offset,
  // damit die Schärfe-Wanderung unregelmäßig, aber reproduzierbar ist.
  const layerData = useMemo(
    () =>
      Array.from({ length: safeLayers }, (_, i) => ({
        blur: Math.round((i / Math.max(1, safeLayers - 1)) * safeMaxBlur + rnd() * 3),
        x: Math.round((rnd() - 0.5) * 14),
        y: Math.round((rnd() - 0.5) * 10),
      })),
    [safeLayers, safeMaxBlur, rnd]
  );

  // @property einmalig registrieren (nur falls der Browser es kann).
  useEffect(() => {
    const css = CSS as CSS & { registerProperty?: unknown };
    if (typeof css.registerProperty !== 'function') return;
    try {
      css.registerProperty({
        name: '--pbs-focus',
        syntax: '<number>',
        inherits: true,
        initialValue: '0',
      });
    } catch {
      // Bereits registriert oder nicht unterstützt — Fallback: Transition greift.
    }
  }, []);

  const safeFocus = clamp(focus, 0, 1);

  // Pointer-basierter Fokus: Y-Position im Container auf 0..1 mappen.
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDriven || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const f = clamp((e.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    rootRef.current.style.setProperty('--pbs-focus', f.toFixed(3));
  };

  return (
    <div
      ref={rootRef}
      className="pbs-root"
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        rootRef.current?.style.setProperty('--pbs-focus', safeFocus.toFixed(3));
      }}
      style={{ '--pbs-color': color } as CSSProperties}
      role="img"
      aria-label={`${text} — Progressive Blur Stack`}
    >
      {layerData.map((l, i) => (
        <span
          key={i}
          className="pbs-layer"
          style={
            {
              '--pbs-blur': `${l.blur}px`,
              '--pbs-x': `${l.x}px`,
              '--pbs-y': `${l.y}px`,
            } as CSSProperties
          }
        >
          {text.slice(0, 16)}
        </span>
      ))}
      <style>{`
.pbs-root{position:relative;width:100%;height:100%;min-height:200px;display:grid;
  place-items:center;overflow:hidden;background:
  radial-gradient(130% 130% at 50% 40%,#131210 0%,#0a0a0b 68%);
  --pbs-focus:${safeFocus.toFixed(3)};transition:--pbs-focus .6s ease}
.pbs-layer{position:absolute;inset:0;display:grid;place-items:center;
  font-family:var(--nox-font-display,Georgia,serif);font-weight:800;
  font-size:clamp(56px,15vw,170px);letter-spacing:.03em;color:#f0ece4;
  filter:blur(var(--pbs-blur));
  opacity:calc(1 - calc(abs(var(--pbs-focus) - ${0.5.toFixed(2)}) * 1.4));
  transform:translate3d(var(--pbs-x),var(--pbs-y),0);
  transition:opacity .5s ease,filter .5s ease}
.pbs-layer:nth-child(1){color:var(--pbs-color);
  text-shadow:0 0 34px color-mix(in srgb, var(--pbs-color) 55%, transparent)}
.pbs-root::after{content:"";position:absolute;inset:0;pointer-events:none;
  backdrop-filter:blur(calc(var(--pbs-focus) * 6px));-webkit-backdrop-filter:blur(calc(var(--pbs-focus) * 6px))}
@media (prefers-reduced-motion:reduce){
  .pbs-layer,.pbs-root{transition:none}
}
`}</style>
    </div>
  );
}

export default ProgressiveBlurStack;
