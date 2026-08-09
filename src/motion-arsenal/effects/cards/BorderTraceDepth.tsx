import { useRef, type CSSProperties } from 'react';
import { clamp, damp, useInView, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { useTouchMode } from './cardDemoUtils';

export interface BorderTraceDepthProps {
  speed?: number;
  color?: string;
  thickness?: number;
  depthOffset?: number;
  glowStrength?: number;
  interactiveBoost?: number;
}

export function BorderTraceDepth({
  speed = 1,
  color = NOX_COLORS.red,
  thickness = 2,
  depthOffset = 1,
  glowStrength = 1,
  interactiveBoost = 1,
}: BorderTraceDepthProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const touch = useTouchMode();
  const inView = useInView(rootRef);

  const safeSpeed = clamp(Number.isFinite(speed) ? speed : 1, 0, 4);
  const safeThickness = clamp(Number.isFinite(thickness) ? thickness : 2, 0.5, 8);
  const safeDepth = clamp(Number.isFinite(depthOffset) ? depthOffset : 1, 0, 2.5);
  const safeGlow = clamp(Number.isFinite(glowStrength) ? glowStrength : 1, 0, 2);
  const safeBoost = clamp(Number.isFinite(interactiveBoost) ? interactiveBoost : 1, 0, 2);

  const anim = useRef({ a: 40, boost: 0 });

  useRafLoop(
    (dt, t) => {
      const el = cardRef.current;
      if (!el) return;

      const p = pointer.current;
      const s = anim.current;
      const touchPulse = 0.22 + ((Math.sin(t * 0.72) + 1) / 2) * 0.18;
      const targetBoost = touch ? touchPulse : p.inside ? safeBoost : 0;
      s.boost = damp(s.boost, targetBoost, 5.5, dt);
      s.a = (s.a + dt * (48 + s.boost * 170) * safeSpeed) % 360;

      const headRad = ((s.a + 318) * Math.PI) / 180;
      const lx = 50 + Math.sin(headRad) * 47;
      const ly = 50 - Math.cos(headRad) * 44;
      el.style.setProperty('--btd-a', `${s.a.toFixed(2)}deg`);
      el.style.setProperty('--btd-lx', `${lx.toFixed(2)}%`);
      el.style.setProperty('--btd-ly', `${ly.toFixed(2)}%`);
      el.style.setProperty('--btd-boost', s.boost.toFixed(3));
    },
    inView && !reduced && safeSpeed > 0,
  );

  const cardVars = {
    '--btd-a': '40deg',
    '--btd-lx': '82%',
    '--btd-ly': '12%',
    '--btd-boost': reduced ? '0.55' : '0',
  } as CSSProperties;

  const ringMask: CSSProperties = {
    padding: safeThickness,
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
  };

  const traceGradient = `conic-gradient(from var(--btd-a),
    transparent 0deg, transparent 250deg,
    ${color} 296deg, #fff6ec 318deg, ${color} 336deg,
    transparent 352deg)`;

  return (
    <div
      ref={rootRef}
      aria-label="Border trace depth preview"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: 'radial-gradient(110% 100% at 50% 115%, #120e0f 0%, #0a0a0b 58%)',
        display: 'grid',
        placeItems: 'center',
        touchAction: 'pan-y',
        contain: 'layout paint style',
      }}
    >
      <div
        ref={cardRef}
        style={{
          ...cardVars,
          position: 'relative',
          width: 'min(360px, 82%)',
          aspectRatio: '1.62',
          maxHeight: '82%',
          transform: 'translateZ(0)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 18,
            transform: `translate(${(9 * safeDepth).toFixed(1)}px, ${(15 * safeDepth).toFixed(1)}px) translateZ(0)`,
            background: traceGradient,
            ...ringMask,
            padding: safeThickness + 3,
            filter: `blur(${(10 + safeGlow * 5).toFixed(1)}px)`,
            opacity: `calc(${(0.2 + safeGlow * 0.18).toFixed(2)} + var(--btd-boost) * ${(0.28 + safeGlow * 0.22).toFixed(2)})`,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: `linear-gradient(168deg, #17171b 0%, ${NOX_COLORS.bgPanel} 55%, #0d0d10 100%)`,
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 18px 44px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.04)',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(190px circle at var(--btd-lx) var(--btd-ly), ${color}66 0%, ${color}1c 34%, transparent 62%)`,
              mixBlendMode: 'screen',
              opacity: `calc(0.28 + var(--btd-boost) * ${(0.42 + safeGlow * 0.2).toFixed(2)})`,
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '7% 8%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'var(--mono, ui-monospace, monospace)',
              color: NOX_COLORS.text,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 9, letterSpacing: '0.28em', color: NOX_COLORS.textDim }}>
                SKILL // SCAN PROTOCOL
              </span>
              <span style={{ fontSize: 9, letterSpacing: '0.18em', color, whiteSpace: 'nowrap' }}>TRACE.9</span>
            </div>
            <div style={{ fontSize: 'clamp(18px, 3.6vw, 26px)', fontWeight: 740, letterSpacing: '0.03em' }}>
              EDGE RUNNER
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                ['SIGNAL', 0.82],
                ['FORGE', 0.56],
              ].map(([label, v]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 8, letterSpacing: '0.3em', color: NOX_COLORS.textDim, marginBottom: 3 }}>
                    {label}
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      style={{
                        width: `${(v as number) * 100}%`,
                        height: '100%',
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${color}, ${NOX_COLORS.gold})`,
                        boxShadow: `0 0 8px ${color}88`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: traceGradient,
            ...ringMask,
            opacity: `calc(0.5 + var(--btd-boost) * 0.5)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default BorderTraceDepth;
