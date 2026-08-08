import { useEffect, useRef } from 'react';
import { clamp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { EASE, NOX_COLORS, PHYSICS } from '../../lib/motionPresets';
import { useHoverCapable } from './cursorShared';

// ---------------------------------------------------------------------------
// MagneticCTA — premium magnetic CTA group.
// Distance-based attraction on hover-capable pointers, frame-rate independent
// damping, inner-label parallax, subtle 3D tilt and an underdamped spring back
// to rest. Touch/reduced-motion remain fully static and clickable.
// ---------------------------------------------------------------------------

export interface MagneticCTAProps {
  attractionRadius?: number;
  pullStrength?: number;
  labelParallax?: number;
  tiltStrength?: number;
  accent?: string;
}

interface MagState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pull: number;
}

const CTAS = [
  { label: 'ENTER FORGE', sub: '01' },
  { label: 'RUN SCAN', sub: '02' },
  { label: 'VIEW SIGNAL', sub: '03' },
];

const expAlpha = (rate: number, dt: number) => 1 - Math.exp(-rate * Math.min(dt, 1 / 20));

export function MagneticCTA({
  attractionRadius = PHYSICS.magneticRadius,
  pullStrength = 0.45,
  labelParallax = 0.4,
  tiltStrength = 5,
  accent = NOX_COLORS.red,
}: MagneticCTAProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const activeMotion = hoverCapable && !reduced;

  const states = useRef<MagState[]>(CTAS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, pull: 0 })));

  useEffect(() => {
    if (activeMotion) return;
    for (let i = 0; i < CTAS.length; i++) {
      const el = btnRefs.current[i];
      const label = labelRefs.current[i];
      const state = states.current[i];
      state.x = 0;
      state.y = 0;
      state.vx = 0;
      state.vy = 0;
      state.pull = 0;
      if (el) {
        el.style.transform = '';
        el.style.setProperty('--mcta-pull', '0');
        el.style.setProperty('--mcta-tilt-x', '0deg');
        el.style.setProperty('--mcta-tilt-y', '0deg');
      }
      if (label) label.style.transform = '';
    }
  }, [activeMotion]);

  useRafLoop((dt) => {
    const root = rootRef.current;
    if (!root) return;

    const p = pointer.current;
    const rootRect = root.getBoundingClientRect();
    const px = p.tx * rootRect.width;
    const py = p.ty * rootRect.height;
    const radius = Math.max(attractionRadius, 1);
    const pullAlpha = expAlpha(11, dt);
    const followAlpha = expAlpha(15, dt);

    // Read phase first, so writes below do not interleave with layout reads.
    const rects = btnRefs.current.map((el) => (el ? el.getBoundingClientRect() : null));

    for (let i = 0; i < CTAS.length; i++) {
      const el = btnRefs.current[i];
      const label = labelRefs.current[i];
      const rect = rects[i];
      const s = states.current[i];
      if (!el || !rect) continue;

      const cx = rect.left - rootRect.left + rect.width / 2 - s.x;
      const cy = rect.top - rootRect.top + rect.height / 2 - s.y;
      const dx = px - cx;
      const dy = py - cy;
      const distance = Math.hypot(dx, dy);
      const targetPull = p.inside ? clamp(1 - distance / radius, 0, 1) : 0;
      s.pull += (targetPull - s.pull) * pullAlpha;

      if (targetPull > 0.0001) {
        const falloff = targetPull * targetPull;
        const targetX = dx * falloff * pullStrength;
        const targetY = dy * falloff * pullStrength;
        const nextX = s.x + (targetX - s.x) * followAlpha;
        const nextY = s.y + (targetY - s.y) * followAlpha;
        s.vx = (nextX - s.x) / Math.max(dt, 1e-4);
        s.vy = (nextY - s.y) / Math.max(dt, 1e-4);
        s.x = nextX;
        s.y = nextY;
      } else {
        // Underdamped spring settle back to the true home position.
        s.vx += -s.x * 110 * dt;
        s.vy += -s.y * 110 * dt;
        const decay = Math.exp(-7.5 * dt);
        s.vx *= decay;
        s.vy *= decay;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        if (Math.abs(s.x) < 0.01 && Math.abs(s.vx) < 0.02) {
          s.x = 0;
          s.vx = 0;
        }
        if (Math.abs(s.y) < 0.01 && Math.abs(s.vy) < 0.02) {
          s.y = 0;
          s.vy = 0;
        }
      }

      const scale = 1 + s.pull * 0.055;
      const tiltX = clamp((-s.y / radius) * tiltStrength, -tiltStrength, tiltStrength);
      const tiltY = clamp((s.x / radius) * tiltStrength, -tiltStrength, tiltStrength);

      el.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      el.style.setProperty('--mcta-pull', s.pull.toFixed(3));
      el.style.setProperty('--mcta-tilt-x', `${tiltX.toFixed(2)}deg`);
      el.style.setProperty('--mcta-tilt-y', `${tiltY.toFixed(2)}deg`);

      if (label) {
        label.style.transform = `translate3d(${(s.x * labelParallax).toFixed(2)}px, ${(s.y * labelParallax).toFixed(2)}px, 12px)`;
      }
    }
  }, activeMotion);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `radial-gradient(120% 100% at 50% 115%, #17090b 0%, ${NOX_COLORS.bg} 60%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(14px, 4cqh, 30px)',
        perspective: '900px',
      }}
    >
      <style>{`
        .mcta-btn {
          --mcta-pull: 0;
          position: relative;
          border: 1px solid rgba(240, 236, 228, 0.16);
          background:
            radial-gradient(circle at 50% 0%, color-mix(in srgb, ${accent} calc(var(--mcta-pull) * 16%), transparent), transparent 58%),
            linear-gradient(180deg, rgba(24, 24, 27, 0.94), rgba(14, 14, 16, 0.92));
          color: ${NOX_COLORS.text};
          padding: 15px 30px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 650;
          letter-spacing: 0.14em;
          transform-style: preserve-3d;
          will-change: transform;
          touch-action: manipulation;
          transition: border-color .18s ease, box-shadow .4s ${EASE.krankOvershoot}, background-color .18s ease;
          border-color: color-mix(in srgb, ${accent} calc(var(--mcta-pull) * 85%), rgba(240,236,228,0.16));
          box-shadow:
            0 12px calc(18px + var(--mcta-pull) * 22px) rgba(0,0,0,.28),
            0 0 calc(var(--mcta-pull) * 36px) color-mix(in srgb, ${accent} 42%, transparent),
            inset 0 1px 0 rgba(255,255,255,.04);
        }
        .mcta-btn::before {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background: linear-gradient(105deg, transparent 28%, rgba(255,255,255,.08) 48%, transparent 68%);
          opacity: calc(.2 + var(--mcta-pull) * .8);
          transform: translateX(calc((var(--mcta-pull) - .5) * 14%));
          pointer-events: none;
        }
        .mcta-btn::after {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 999px;
          border: 1px dashed color-mix(in srgb, ${accent} 60%, transparent);
          opacity: var(--mcta-pull);
          transition: opacity .18s ease;
          pointer-events: none;
        }
        .mcta-btn:hover { border-color: color-mix(in srgb, ${accent} 64%, rgba(240,236,228,.2)); }
        .mcta-btn:focus-visible {
          outline: 2px solid color-mix(in srgb, ${accent} 85%, white 15%);
          outline-offset: 5px;
          box-shadow: 0 0 0 5px color-mix(in srgb, ${accent} 18%, transparent), 0 14px 34px rgba(0,0,0,.34);
        }
        .mcta-label {
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .mcta-sub {
          font-family: var(--mono, monospace);
          font-size: 9px;
          letter-spacing: 0.3em;
          color: color-mix(in srgb, ${accent} calc(40% + var(--mcta-pull) * 60%), ${NOX_COLORS.textDim});
        }
        @media (hover: none), (prefers-reduced-motion: reduce) {
          .mcta-btn, .mcta-label { will-change: auto; }
          .mcta-btn::before { transform: none; opacity: .22; }
        }
      `}</style>
      <div style={{ fontFamily: 'var(--mono, monospace)', fontSize: 10, letterSpacing: '0.4em', color: NOX_COLORS.textDim }}>
        MAGNETIC FIELD // {activeMotion ? 'ACTIVE' : 'STATIC'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(12px, 3cqw, 36px)', justifyContent: 'center', padding: '0 16px' }}>
        {CTAS.map((c, i) => (
          <button
            key={c.label}
            type="button"
            className="mcta-btn"
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            aria-label={`${c.label} ${c.sub}`}
          >
            <span
              className="mcta-label"
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
            >
              {c.label}
              <span className="mcta-sub" aria-hidden="true">{c.sub}</span>
            </span>
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: NOX_COLORS.textDim, letterSpacing: '0.08em' }}>
        {activeMotion ? 'move across the buttons — they reach for you' : 'static mode — interaction stays native'}
      </div>
    </div>
  );
}

export default MagneticCTA;
