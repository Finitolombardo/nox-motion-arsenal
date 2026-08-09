import { useRef, type CSSProperties, type ReactNode } from 'react';
import { clamp, useInView, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { easeOutExpo, NOX_COLORS } from '../../lib/motionPresets';

export interface BlurToSharpHeroBootProps {
  speed?: number;
  maxBlur?: number;
  overexposure?: number;
  accent?: string;
  loop?: boolean;
  holdDuration?: number;
  children?: ReactNode;
}

export function BlurToSharpHeroBoot({
  speed = 1,
  maxBlur = 22,
  overexposure = 1,
  accent = NOX_COLORS.redBright,
  loop = true,
  holdDuration = 2.8,
  children,
}: BlurToSharpHeroBootProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef, '160px');
  const timeline = useRef({ t: 0 });

  const safeSpeed = clamp(speed, 0.2, 3);
  const safeBlur = clamp(maxBlur, 0, 32);
  const safeExposure = clamp(overexposure, 0, 2);
  const safeHold = clamp(holdDuration, 0, 12);
  const bootDur = 2.2 / safeSpeed;
  const resetDur = 0.5 / safeSpeed;

  useRafLoop(
    (dt) => {
      const root = rootRef.current;
      if (!root) return;

      timeline.current.t += dt;
      const total = bootDur + safeHold + resetDur;
      const local = loop ? timeline.current.t % total : Math.min(timeline.current.t, bootDur + safeHold);

      let linear = 1;
      let flash = 0;
      let scan = 115;

      if (local < bootDur) {
        const p = clamp(local / bootDur, 0, 1);
        linear = easeOutExpo(p);
        flash = Math.sin(Math.PI * clamp(p * 1.15, 0, 1));
        scan = linear * 130 - 15;
      } else if (loop && local > bootDur + safeHold) {
        const resetP = clamp((local - bootDur - safeHold) / resetDur, 0, 1);
        const easedReset = resetP * resetP * (3 - 2 * resetP);
        linear = 1 - easedReset;
        scan = -15;
      }

      root.style.setProperty('--bsb-p', linear.toFixed(4));
      root.style.setProperty('--bsb-scan', scan.toFixed(2));
      root.style.setProperty('--bsb-flash', flash.toFixed(4));
    },
    !reduced && inView,
  );

  const boot = 'var(--bsb-p, 1)';
  const defaultContent = (
    <>
      <div
        style={{
          fontFamily: 'var(--mono, monospace)',
          fontSize: 10,
          letterSpacing: '0.45em',
          color: accent,
        }}
      >
        SYSTEM BOOT // 04:16
      </div>
      <div
        style={{
          fontSize: 'clamp(34px, 8.5vw, 96px)',
          fontWeight: 830,
          letterSpacing: '-0.02em',
          color: NOX_COLORS.text,
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        NOX ONLINE
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 'clamp(8px, 3vw, 30px)',
          paddingInline: 16,
          fontFamily: 'var(--mono, monospace)',
          fontSize: 10,
          letterSpacing: '0.18em',
          color: NOX_COLORS.textDim,
        }}
      >
        <span>FORGE ▸ READY</span>
        <span>RANK ▸ SYNC</span>
        <span>SCAN ▸ LIVE</span>
      </div>
    </>
  );

  return (
    <div
      ref={rootRef}
      style={
        {
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          isolation: 'isolate',
          contain: 'layout paint',
          background: NOX_COLORS.bg,
          '--bsb-p': reduced ? 1 : 0,
          '--bsb-flash': 0,
          '--bsb-scan': -15,
        } as CSSProperties
      }
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vh, 18px)',
          padding: 'clamp(20px, 4vw, 48px)',
          background: `radial-gradient(110% 85% at 50% 108%, #1a0c0d 0%, ${NOX_COLORS.bg} 62%)`,
          filter: reduced
            ? 'none'
            : `blur(calc((1 - ${boot}) * ${safeBlur}px)) brightness(calc(1 + (1 - ${boot}) * ${(1.6 * safeExposure).toFixed(2)})) saturate(calc(0.35 + ${boot} * 0.65)) contrast(calc(0.85 + ${boot} * 0.15))`,
          transform: reduced ? 'none' : `translateZ(0) scale(calc(1.045 - ${boot} * 0.045))`,
          transformOrigin: '50% 50%',
          willChange: reduced ? 'auto' : 'filter, transform',
        }}
      >
        {children ?? defaultContent}
      </div>

      {!reduced && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(var(--bsb-scan, -15) * 1%)',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 18px 4px ${accent}44`,
            opacity: 'calc(var(--bsb-flash, 0) * 0.9)',
            transform: 'translateZ(0)',
            pointerEvents: 'none',
          }}
        />
      )}

      {!reduced && safeExposure > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(80% 60% at 50% 42%, rgba(255, 240, 224, ${Math.min(0.5 * safeExposure, 0.85)}) 0%, transparent 70%)`,
            opacity: `calc((1 - ${boot}) * 1)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

export default BlurToSharpHeroBoot;
