import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, useInView, usePrefersReducedMotion } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

export type MaskedTextRevealDirection = 'ltr' | 'rtl';

export interface MaskedTextRevealProps {
  text?: string;
  speed?: number;
  stagger?: number;
  textColor?: string;
  accent?: string;
  loop?: boolean;
  holdDuration?: number;
  direction?: MaskedTextRevealDirection;
  edgeIntensity?: number;
}

export function MaskedTextReveal({
  text = 'SIGNAL OVER NOISE — THE NOX SYSTEM IS ONLINE',
  speed = 1,
  stagger = 0.09,
  textColor = NOX_COLORS.text,
  accent = NOX_COLORS.redBright,
  loop = true,
  holdDuration = 2.4,
  direction = 'ltr',
  edgeIntensity = 0.9,
}: MaskedTextRevealProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, '160px');
  const [cycle, setCycle] = useState(0);

  const safeSpeed = clamp(speed, 0.2, 3);
  const safeStagger = clamp(stagger, 0, 0.5);
  const safeHold = clamp(holdDuration, 0, 12);
  const safeEdgeIntensity = clamp(edgeIntensity, 0, 1.5);
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const wipeDur = 1.2 / safeSpeed;
  const lastDelay = words.length > 0 ? ((words.length - 1) * safeStagger) / safeSpeed : 0;
  const cycleMs = (wipeDur + lastDelay + safeHold) * 1000;

  useEffect(() => {
    if (reduced || !loop || !inView || words.length === 0) return;
    const id = window.setTimeout(() => setCycle((c) => c + 1), cycleMs);
    return () => window.clearTimeout(id);
  }, [reduced, loop, inView, words.length, cycleMs, cycle]);

  const isRtl = direction === 'rtl';
  const maskGradient = isRtl
    ? 'linear-gradient(80deg, #000 0%, #000 68%, transparent 92%)'
    : 'linear-gradient(100deg, transparent 8%, #000 32%, #000 100%)';
  const edgeMask = isRtl
    ? 'linear-gradient(80deg, transparent 42%, #000 50%, transparent 58%)'
    : 'linear-gradient(100deg, transparent 42%, #000 50%, transparent 58%)';
  const maskStart = isRtl ? '-30% 0' : '130% 0';
  const lift = isRtl ? '-0.45em' : '0.45em';
  const playState = inView ? 'running' : 'paused';

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        isolation: 'isolate',
        contain: 'layout paint',
        background: `linear-gradient(180deg, ${NOX_COLORS.bg} 0%, #120b0c 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes msk-wipe-ltr {
          from { -webkit-mask-position: 130% 0; mask-position: 130% 0; transform: translateY(0.45em); opacity: 0.72; }
          55%  { opacity: 1; }
          to   { -webkit-mask-position: 40% 0; mask-position: 40% 0; transform: translateY(0); opacity: 1; }
        }
        @keyframes msk-wipe-rtl {
          from { -webkit-mask-position: -30% 0; mask-position: -30% 0; transform: translateY(-0.45em); opacity: 0.72; }
          55%  { opacity: 1; }
          to   { -webkit-mask-position: 60% 0; mask-position: 60% 0; transform: translateY(0); opacity: 1; }
        }
        @keyframes msk-edge-ltr {
          0%   { -webkit-mask-position: 135% 0; mask-position: 135% 0; opacity: 0; }
          14%  { opacity: 1; }
          80%  { -webkit-mask-position: -35% 0; mask-position: -35% 0; opacity: 1; }
          100% { -webkit-mask-position: -35% 0; mask-position: -35% 0; opacity: 0; }
        }
        @keyframes msk-edge-rtl {
          0%   { -webkit-mask-position: -35% 0; mask-position: -35% 0; opacity: 0; }
          14%  { opacity: 1; }
          80%  { -webkit-mask-position: 135% 0; mask-position: 135% 0; opacity: 1; }
          100% { -webkit-mask-position: 135% 0; mask-position: 135% 0; opacity: 0; }
        }
        .msk-word {
          display: inline-block;
          position: relative;
          white-space: pre;
          transform: translateZ(0);
        }
        .msk-word + .msk-word {
          margin-inline-start: 0.28em;
        }
        @media (prefers-reduced-motion: reduce) {
          .msk-word, .msk-word > span {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div
        key={cycle}
        aria-label={text}
        style={{
          padding: 'clamp(20px, 5vw, 64px) clamp(18px, 8vw, 96px)',
          fontSize: 'clamp(22px, 4.6vw, 52px)',
          fontWeight: 760,
          lineHeight: 1.18,
          letterSpacing: '-0.015em',
          color: textColor,
          textAlign: 'center',
          maxWidth: 960,
          overflowWrap: 'anywhere',
        }}
      >
        {words.map((word, i) => {
          const delay = (i * safeStagger) / safeSpeed;
          const animationName = isRtl ? 'msk-wipe-rtl' : 'msk-wipe-ltr';
          const edgeAnimationName = isRtl ? 'msk-edge-rtl' : 'msk-edge-ltr';

          return (
            <span
              key={`${word}-${i}`}
              className="msk-word"
              aria-hidden="true"
              style={{
                ...(reduced
                  ? {}
                  : {
                      WebkitMaskImage: maskGradient,
                      maskImage: maskGradient,
                      WebkitMaskSize: '300% 100%',
                      maskSize: '300% 100%',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: maskStart,
                      maskPosition: maskStart,
                    }),
                transform: reduced ? undefined : `translateY(${lift}) translateZ(0)`,
                opacity: reduced ? 1 : 0.72,
                animation: reduced ? undefined : `${animationName} ${wipeDur}s ${EASE.outBack} ${delay}s both`,
                animationPlayState: reduced ? undefined : playState,
              }}
            >
              {word}
              {!reduced && safeEdgeIntensity > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    color: accent,
                    opacity: safeEdgeIntensity,
                    WebkitMaskImage: edgeMask,
                    maskImage: edgeMask,
                    WebkitMaskSize: '300% 100%',
                    maskSize: '300% 100%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    animation: `${edgeAnimationName} ${wipeDur * 1.05}s ${EASE.outQuint} ${delay}s both`,
                    animationPlayState: playState,
                    textShadow: `0 0 18px ${accent}55`,
                    pointerEvents: 'none',
                  }}
                >
                  {word}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default MaskedTextReveal;
