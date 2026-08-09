import React, { useEffect, useRef } from 'react';
import { clamp, damp, useInView, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ScrollVelocitySkew — velocity-reactive editorial marquee.
// Scroll speed drives skew / spacing / blur while each row keeps its own
// deterministic marquee phase. The loop pauses offscreen and reduced-motion
// collapses to a fully static, readable composition.
// ---------------------------------------------------------------------------

export interface ScrollVelocitySkewProps {
  skewMax?: number;
  damping?: number;
  marqueeBase?: number;
  accent?: string;
}

const LINES = ['FORGE THE SIGNAL', 'VELOCITY IS TRUTH', 'NO AUTOPILOT', 'RANK OVER NOISE'];
const BLOCKS = 4;
const ROW_COUNT = LINES.length * BLOCKS;

const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);
const wrap = (value: number, length: number) => {
  if (!Number.isFinite(length) || length <= 0) return 0;
  return ((value % length) + length) % length;
};

export function ScrollVelocitySkew({
  skewMax = 10,
  damping = 9,
  marqueeBase = 40,
  accent = NOX_COLORS.red,
}: ScrollVelocitySkewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const marqueeRefs = useRef<Array<HTMLDivElement | null>>(Array(ROW_COUNT).fill(null));
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef, '160px');
  const state = useRef({
    lastTop: 0,
    velocity: 0,
    smooth: 0,
    phases: Array(ROW_COUNT).fill(0) as number[],
  });

  const safeSkew = clamp(finite(skewMax, 10), 0, 24);
  const safeDamping = clamp(finite(damping, 9), 2, 24);
  const safeMarquee = clamp(finite(marqueeBase, 40), 0, 180);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    state.current.lastTop = scroller.scrollTop;
  }, [inView]);

  useEffect(() => {
    if (!reduced) return;
    const content = contentRef.current;
    if (content) {
      content.style.transform = 'none';
      content.style.filter = 'none';
      content.style.willChange = 'auto';
    }
    if (glowRef.current) {
      glowRef.current.style.opacity = '0';
      glowRef.current.style.transform = 'none';
    }
    marqueeRefs.current.forEach((el) => {
      if (!el) return;
      el.style.transform = 'translate3d(0,0,0)';
      el.style.letterSpacing = '0.08em';
      el.style.willChange = 'auto';
    });
  }, [reduced]);

  useRafLoop(
    (dt) => {
      const scroller = scrollerRef.current;
      const content = contentRef.current;
      if (!scroller || !content) return;

      const s = state.current;
      const rawVelocity = (scroller.scrollTop - s.lastTop) / Math.max(dt, 0.001);
      s.lastTop = scroller.scrollTop;

      // Fast capture, slower release. Clamp prevents trackpads / restored tabs
      // from producing visually destructive spikes.
      const boundedVelocity = clamp(rawVelocity, -3200, 3200);
      s.velocity = damp(s.velocity, boundedVelocity, 22, dt);
      s.smooth = damp(s.smooth, s.velocity, safeDamping, dt);

      if (Math.abs(s.smooth) < 0.15 && Math.abs(s.velocity) < 0.15) {
        s.smooth = 0;
        s.velocity = 0;
      }

      const norm = clamp(s.smooth / 1500, -1, 1);
      const energy = Math.abs(norm);
      const skew = -norm * safeSkew;
      const tilt = norm * 1.15;
      const blur = energy > 0.1 ? Math.min(1.8, energy * 1.8) : 0;

      content.style.willChange = energy > 0.015 ? 'transform, filter' : 'auto';
      content.style.transform = `perspective(1000px) skewY(${skew.toFixed(2)}deg) rotateX(${tilt.toFixed(2)}deg) translateZ(0)`;
      content.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';

      const glow = glowRef.current;
      if (glow) {
        glow.style.opacity = (energy * 0.28).toFixed(3);
        glow.style.transform = `translate3d(0, ${(norm * 18).toFixed(1)}px, 0) scaleY(${(1 + energy * 0.2).toFixed(3)})`;
      }

      marqueeRefs.current.forEach((el, rowIndex) => {
        if (!el) return;
        const cycle = Math.max(el.scrollWidth / 2, 1);
        const direction = rowIndex % 2 === 0 ? 1 : -1;
        const reactiveSpeed = safeMarquee + Math.abs(s.smooth) * 0.34;
        s.phases[rowIndex] = wrap(s.phases[rowIndex] + direction * reactiveSpeed * dt, cycle);

        el.style.willChange = reactiveSpeed > 0.1 || energy > 0.01 ? 'transform' : 'auto';
        el.style.transform = `translate3d(${-s.phases[rowIndex].toFixed(1)}px,0,0)`;
        el.style.letterSpacing = `${(0.08 + energy * 0.3).toFixed(3)}em`;
      });
    },
    inView && !reduced,
  );

  return (
    <div
      ref={rootRef}
      className="svs-root"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#08080a',
        ['--svs-accent' as string]: accent,
      }}
    >
      <style>{`
        .svs-root { isolation: isolate; }
        .svs-root::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 8%, color-mix(in srgb, var(--svs-accent) 11%, transparent), transparent 38%),
            linear-gradient(180deg, rgba(255,255,255,.018), transparent 32%, rgba(0,0,0,.24));
          z-index: 0;
        }
        .svs-scroll { scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--svs-accent) 42%, #25252b) transparent; }
        .svs-scroll:focus-visible { outline: 1px solid color-mix(in srgb, var(--svs-accent) 75%, white); outline-offset: -3px; }
        .svs-row { overflow: hidden; white-space: nowrap; padding: 7px 0; border-top: 1px solid rgba(255,255,255,.075); }
        .svs-track { display: inline-block; white-space: nowrap; transform: translate3d(0,0,0); }
        .svs-copy { padding-right: clamp(28px, 4vw, 54px); }
        .svs-hint { text-align: center; font: 600 10px/1.3 var(--mono, ui-monospace, monospace); letter-spacing: .28em; color: rgba(240,236,228,.42); margin-bottom: 24px; padding-inline: 18px; }
        @media (max-width: 640px) {
          .svs-hint { font-size: 9px; letter-spacing: .2em; }
          .svs-row { padding-block: 5px; }
          .svs-copy { padding-right: 28px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .svs-track, .svs-content, .svs-velocity-glow { transform: none !important; filter: none !important; transition: none !important; }
        }
      `}</style>

      <div
        ref={glowRef}
        className="svs-velocity-glow"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '24% -12%',
          pointerEvents: 'none',
          opacity: 0,
          background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--svs-accent) 36%, transparent), transparent 68%)',
          filter: 'blur(42px)',
          zIndex: 0,
        }}
      />

      <div
        ref={scrollerRef}
        className="svs-scroll"
        tabIndex={0}
        role="region"
        aria-label="Velocity reactive scrolling marquee"
        style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', zIndex: 1 }}
      >
        <div ref={contentRef} className="svs-content" style={{ padding: '40px 0 64px', transformOrigin: '50% 50%' }}>
          <div className="svs-hint">SCROLL FAST — CONTENT REACTS TO VELOCITY</div>

          {Array.from({ length: BLOCKS }).map((_, block) => (
            <div key={block} style={{ marginBottom: block === BLOCKS - 1 ? 12 : 52 }}>
              {LINES.map((line, lineIndex) => {
                const rowIndex = block * LINES.length + lineIndex;
                const outlined = rowIndex % 2 === 1;
                return (
                  <div key={line} className="svs-row">
                    <div
                      ref={(el) => {
                        marqueeRefs.current[rowIndex] = el;
                      }}
                      className="svs-track"
                      style={{
                        fontSize: 'clamp(25px, 5vw, 54px)',
                        fontWeight: 780,
                        lineHeight: 1.05,
                        color: outlined ? 'transparent' : NOX_COLORS.text,
                        WebkitTextStroke: outlined ? `1px ${accent}` : undefined,
                        letterSpacing: '0.08em',
                        textShadow: outlined ? 'none' : '0 10px 30px rgba(0,0,0,.24)',
                      }}
                    >
                      {Array.from({ length: 8 }).map((_, repeat) => (
                        <span key={repeat} className="svs-copy">
                          {line} <span style={{ color: accent, WebkitTextStroke: '0 transparent' }}>◆</span>{' '}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScrollVelocitySkew;
