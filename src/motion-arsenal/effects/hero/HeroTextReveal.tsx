import { useEffect, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '../../lib/animationUtils';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// MaskedTextReveal — Text-Reveal über ein wanderndes linear-gradient mask-image
// (Shopify Editions: 46 mask-Refs in shopify.css, Kern-Pattern
// `mask-image: linear-gradient(to right, transparent, black 20%, black 80%,
// transparent)` + slideIn 1.2s cubic-bezier(0.34,1.56,0.64,1)). Hier pro Wort
// gestaffelt: weiche Licht-Kante wischt über jedes Wort, dazu der originale
// outBack-Slide. NOX-adaptiert mit Ember-Leading-Edge.
// ---------------------------------------------------------------------------

export interface HeroTextRevealProps {
  text?: string;
  speed?: number; // playback multiplier
  stagger?: number; // seconds per word
  textColor?: string;
  accent?: string; // leading-edge shimmer color
  loop?: boolean;
}

/** Canonical hero text-reveal core; legacy variants delegate here. */
export function HeroTextReveal({
  text = 'SIGNAL OVER NOISE — THE NOX SYSTEM IS ONLINE',
  speed = 1,
  stagger = 0.09,
  textColor = NOX_COLORS.text,
  accent = NOX_COLORS.redBright,
  loop = true,
}: HeroTextRevealProps) {
  const reduced = usePrefersReducedMotion();
  const [cycle, setCycle] = useState(0);
  const s = Math.max(speed, 0.2);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  const wipeDur = 1.2 / s; // Shopify slideIn duration
  const cycleMs = (wipeDur + words.length * (stagger / s)) * 1000 + 2400;

  useEffect(() => {
    if (reduced || !loop) return;
    const id = setInterval(() => setCycle((c) => c + 1), cycleMs);
    return () => clearInterval(id);
  }, [reduced, loop, cycleMs]);

  const maskGradient = 'linear-gradient(100deg, transparent 8%, #000 32%, #000 100%)';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${NOX_COLORS.bg} 0%, #120b0c 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes msk-wipe {
          from {
            -webkit-mask-position: 130% 0;
            mask-position: 130% 0;
            transform: translateY(0.5em);
          }
          to {
            -webkit-mask-position: 40% 0;
            mask-position: 40% 0;
            transform: translateY(0);
          }
        }
        @keyframes msk-edge {
          0%   { -webkit-mask-position: 135% 0; mask-position: 135% 0; opacity: 1; }
          80%  { -webkit-mask-position: -35% 0; mask-position: -35% 0; opacity: 1; }
          100% { -webkit-mask-position: -35% 0; mask-position: -35% 0; opacity: 0; }
        }
        .msk-word {
          display: inline-block;
          position: relative;
          white-space: pre;
          will-change: transform, mask-position;
        }
        @media (prefers-reduced-motion: reduce) {
          .msk-word, .msk-word > span { animation: none !important; transform: none !important; }
        }
      `}</style>
      <div
        key={cycle}
        style={{
          padding: '0 8%',
          fontSize: 'clamp(22px, 4.6vw, 52px)',
          fontWeight: 760,
          lineHeight: 1.18,
          letterSpacing: '-0.015em',
          color: textColor,
          textAlign: 'center',
          maxWidth: 900,
        }}
      >
        {words.map((word, i) => {
          const delay = (i * stagger) / s;
          const maskBase = reduced
            ? {}
            : {
                WebkitMaskImage: maskGradient,
                maskImage: maskGradient,
                WebkitMaskSize: '300% 100%',
                maskSize: '300% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: '130% 0',
                maskPosition: '130% 0',
              };
          const edgeMask = 'linear-gradient(100deg, transparent 42%, #000 50%, transparent 58%)';
          return (
            <span
              key={i}
              className="msk-word"
              style={{
                ...maskBase,
                transform: reduced ? undefined : 'translateY(0.5em)',
                animation: reduced ? undefined : `msk-wipe ${wipeDur}s ${EASE.outBack} ${delay}s both`,
              }}
            >
              {word}
              {!reduced && (
                // Ember leading edge: a narrow accent band sweeping just ahead
                // of the reveal wipe (second mask layer over a colored copy).
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    color: accent,
                    WebkitMaskImage: edgeMask,
                    maskImage: edgeMask,
                    WebkitMaskSize: '300% 100%',
                    maskSize: '300% 100%',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    animation: `msk-edge ${wipeDur * 1.05}s ${EASE.outQuint} ${delay}s both`,
                    pointerEvents: 'none',
                  }}
                >
                  {word}
                </span>
              )}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default HeroTextReveal;
