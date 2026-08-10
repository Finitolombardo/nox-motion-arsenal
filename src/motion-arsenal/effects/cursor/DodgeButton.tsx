import { useCallback, useEffect, useRef, useState } from 'react';
import { clamp, damp, useRafLoop, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// DodgeButton — NOX-Variante des „Catch Mouse Pointer When Going to Click a
// Button" (codemyui, Konzept übernommen, eigener Code): Der Gold-Button
// weicht dem Mauszeiger aus (gedämpftes Follow, deterministische Richtung aus
// dem Pointer-Offset — keine unseeded Zufallswerte). Nach maxDodges
// Annäherungs-Episoden „ergibt er sich" und lässt sich fangen → Gold-Flash.
// Touch/Keyboard: kein Dodge (Buttons bleiben normal bedienbar). Reduced
// Motion: statisch klickbar. RAF nur fürs Pointer-Tracking.
// ---------------------------------------------------------------------------

export interface DodgeButtonProps {
  /** Gold-Akzentfarbe (hex). */
  color?: string;
  /** Radius in px, ab dem der Button auszuweichen beginnt (geclampt). */
  dodgeRadius?: number;
  /** Maximale Ausweich-Verschiebung in px (geclampt). */
  dodgeDistance?: number;
  /** Nach wie vielen Annäherungen ergibt sich der Button? (geclampt) */
  maxDodges?: number;
  /** Dämpfung des Follow (3–18, geclampt). */
  damping?: number;
  /** Label im Idle-Zustand. */
  label?: string;
  /** Label nach dem Fang. */
  successLabel?: string;
}

export function DodgeButton({
  color = NOX_COLORS.gold,
  dodgeRadius = 120,
  dodgeDistance = 46,
  maxDodges = 5,
  damping = 9,
  label = 'Fang mich',
  successLabel = 'Gefangen ✓',
}: DodgeButtonProps) {
  const reduced = usePrefersReducedMotion();
  const [caught, setCaught] = useState(false);
  const [dodges, setDodges] = useState(0);
  const [flash, setFlash] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Pointer-Physik in Ref (kein React-State pro Frame):
  // x/y = Cursor relativ zum Root-Zentrum · px/py = aktueller Button-Offset
  // tx/ty = Ziel-Offset · active = Pointer über dem Root.
  const pointer = useRef({ x: 0, y: 0, px: 0, py: 0, tx: 0, ty: 0, active: false });
  const episode = useRef(false); // Latch: aktuelle Annäherungs-Episode schon gezählt

  const radius = clamp(dodgeRadius, 40, 260);
  const dist = clamp(dodgeDistance, 12, 120);
  const maxD = Math.round(clamp(maxDodges, 1, 12));
  const dampL = clamp(damping, 3, 18);

  // Touch/Stift und Reduced Motion: kein Dodge — normal klickbar.
  const surrendered = dodges >= maxD;

  useRafLoop(
    (dt) => {
      const p = pointer.current;
      const btn = btnRef.current;
      if (!btn) return;
      const within = Math.hypot(p.x - p.px, p.y - p.py) < radius;

      if (p.active && within && !surrendered && !caught) {
        // Ziel: weg vom Cursor (Richtung aus dem Offset — deterministisch).
        const dx = p.x - p.px;
        const dy = p.y - p.py;
        const len = Math.max(Math.hypot(dx, dy), 1);
        p.tx = (-dx / len) * dist;
        p.ty = (-dy / len) * dist;
        if (!episode.current) {
          episode.current = true;
          setDodges((n) => Math.min(n + 1, maxD));
        }
      } else {
        p.tx = 0;
        p.ty = 0;
        episode.current = false;
      }

      p.px = damp(p.px, p.tx, dampL, dt);
      p.py = damp(p.py, p.ty, dampL, dt);
      btn.style.transform = `translate3d(${p.px.toFixed(2)}px, ${p.py.toFixed(2)}px, 0)`;
    },
    !reduced && !caught,
  );

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return; // Touch/Stift: kein Dodge
    const root = rootRef.current;
    if (!root) return;
    const r = root.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const p = pointer.current;
    p.x = e.clientX - cx;
    p.y = e.clientY - cy;
    p.active = true;
  }, []);

  const onPointerLeave = useCallback(() => {
    pointer.current.active = false;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerleave', onPointerLeave);
    return () => {
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [onPointerMove, onPointerLeave]);

  const handleClick = useCallback(() => {
    if (caught) return;
    setCaught(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 650);
  }, [caught]);

  const reset = useCallback(() => {
    setCaught(false);
    setDodges(0);
    const p = pointer.current;
    p.px = 0;
    p.py = 0;
    p.tx = 0;
    p.ty = 0;
    episode.current = false;
    if (btnRef.current) btnRef.current.style.transform = 'translate3d(0, 0, 0)';
  }, []);

  return (
    <div
      ref={rootRef}
      className="dodge-root"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        background: `radial-gradient(120% 95% at 50% 115%, #14100a 0%, ${NOX_COLORS.bg} 62%)`,
        overflow: 'hidden',
        ['--dodge-color' as string]: color,
      }}
    >
      <style>{`
        .dodge-stage {
          position: relative;
          width: 100%;
          height: 190px;
          display: grid;
          place-items: center;
        }
        .dodge-btn {
          position: relative;
          z-index: 2;
          appearance: none;
          cursor: pointer;
          will-change: transform;
          padding: 16px 30px;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--dodge-color) 60%, #232329);
          background: linear-gradient(180deg, color-mix(in srgb, var(--dodge-color) 18%, #131317) 0%, #0d0d10 100%);
          color: var(--dodge-color);
          font-family: var(--display, inherit);
          font-size: 16px;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
          box-shadow: 0 14px 34px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05);
          transition: box-shadow .18s ease, border-color .18s ease;
        }
        .dodge-btn:hover {
          box-shadow: 0 18px 40px rgba(0,0,0,.55), 0 0 22px color-mix(in srgb, var(--dodge-color) 30%, transparent);
        }
        .dodge-btn:focus-visible { outline: 2px solid var(--dodge-color); outline-offset: 3px; }
        .dodge-btn.dodge-flash {
          animation: dodge-pop 0.5s ease-out;
          border-color: var(--dodge-color);
          box-shadow: 0 0 0 6px color-mix(in srgb, var(--dodge-color) 22%, transparent), 0 0 34px var(--dodge-color);
        }
        @keyframes dodge-pop {
          0%   { transform: scale(1); }
          45%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        .dodge-ring {
          position: absolute;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 1px dashed color-mix(in srgb, var(--dodge-color) 42%, transparent);
          pointer-events: none;
          opacity: .5;
        }
        .dodge-hud {
          font-family: var(--display, inherit);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--dodge-color);
          opacity: .85;
          min-height: 1.4em;
          text-align: center;
        }
        .dodge-hint {
          font-size: 12px;
          color: ${NOX_COLORS.textDim};
          letter-spacing: .06em;
          max-width: 320px;
          text-align: center;
          line-height: 1.5;
        }
        .dodge-reset {
          appearance: none;
          background: none;
          border: none;
          font-size: 12px;
          color: var(--dodge-color);
          text-decoration: underline;
          cursor: pointer;
          padding: 2px 8px;
        }
        .dodge-reset:focus-visible { outline: 2px solid var(--dodge-color); outline-offset: 2px; }
        @media (max-width: 520px) {
          .dodge-stage { height: 160px; }
          .dodge-hint { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dodge-btn { transition: none !important; }
          .dodge-btn.dodge-flash { animation: none !important; }
        }
      `}</style>

      <div className="dodge-stage" aria-hidden>
        <span className="dodge-ring" />
        <button
          ref={btnRef}
          type="button"
          className={`dodge-btn${flash ? ' dodge-flash' : ''}`}
          onClick={handleClick}
          aria-label={caught ? successLabel : label}
        >
          {caught ? successLabel : label}
        </button>
      </div>

      <div className="dodge-hud" role="status" aria-live="polite">
        {caught
          ? 'Fang gelungen'
          : surrendered
            ? 'Ergeben — jetzt klickbar!'
            : `${dodges} / ${maxD} Ausweich-Manöver`}
      </div>
      <p className="dodge-hint">
        {reduced
          ? 'Reduced Motion: der Button ist statisch klickbar.'
          : `Der Button weicht dem Mauszeiger aus — nach ${maxD} Annäherungen ergibt er sich.`}
      </p>
      {caught && (
        <button type="button" className="dodge-reset" onClick={reset}>
          Nochmal versuchen
        </button>
      )}
    </div>
  );
}

export default DodgeButton;
