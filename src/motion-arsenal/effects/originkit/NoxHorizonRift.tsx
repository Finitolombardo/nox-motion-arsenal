import { useEffect, useMemo, useState, type CSSProperties } from 'react';

// Bottom Pulse Horizon keeps the original `nox-horizon-rift` identity and
// share-link surface, but deliberately reduces it to a transparent edge cue:
// no clip-path, no reveal background, no second canvas, no screen flash.

export type RiftReducedMotionMode = 'static-line' | 'crossfade-only' | 'hidden';

export interface NoxHorizonRiftProps {
  progress?: number;
  horizonPosition?: number;
  lineThickness?: number;
  pulseStrength?: number;
  pulseCount?: number;
  glow?: number;
  bloom?: number;
  jitter?: number;
  sparkAmount?: number;
  dissolveStrength?: number;
  heroFade?: number;
  cosmicReveal?: number;
  reducedMotionMode?: RiftReducedMotionMode;
  colorStart?: string;
  colorEnd?: string;
  seed?: number;
  autoDemo?: boolean;
  className?: string;
  style?: CSSProperties;
}

type HorizonStyle = CSSProperties & Record<`--${string}`, string | number>;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const bottomPulseProgressFromEdge = (rectBottom: number, viewportHeight: number) => {
  const start = viewportHeight * 0.92;
  const end = viewportHeight * 0.55;
  const edgeProgress = clamp01((start - rectBottom) / Math.max(1, start - end));

  // Keep the original 70/88/96/100 timeline while giving its visible phase
  // roughly 80–140 px of real scroll on common desktop/mobile viewports.
  return edgeProgress <= 0 ? 0 : 0.70 + edgeProgress * 0.30;
};
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
};
const pulseAt = (progress: number, centre: number, width: number) => {
  const distance = Math.abs(progress - centre) / width;
  return distance >= 1 ? 0 : (1 - distance) * (1 - distance);
};
function hash(value: number) {
  const n = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export default function NoxHorizonRift({
  progress = 0,
  horizonPosition = 0.965,
  lineThickness = 2.5,
  pulseStrength = 0.32,
  pulseCount = 2,
  glow = 0.7,
  bloom = 0.24,
  jitter = 0.12,
  sparkAmount = 8,
  dissolveStrength = 0.7,
  heroFade = 0.3,
  cosmicReveal = 0.5,
  reducedMotionMode = 'static-line',
  colorStart = '#ff4f72',
  colorEnd = '#ef5b53',
  seed = 7,
  autoDemo = false,
  className,
  style,
}: NoxHorizonRiftProps) {
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-rift-root="bottom-pulse-horizon"]');
    if (!root || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '20% 0px' });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // Opt-in gallery driver only. The production website passes scroll progress;
  // there is no permanent animation loop in either path.
  useEffect(() => {
    if (!autoDemo || reduced || !visible) return;
    let frame = 0;
    let started = 0;
    const tick = (now: number) => {
      if (!started) started = now;
      const next = clamp01((now - started) / 2600);
      setDemoProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoDemo, reduced, visible]);

  const value = clamp01(autoDemo ? demoProgress : progress);
  const lineReveal = smoothstep(0.88, 0.96, value);
  const dissolve = smoothstep(0.96, 1, value);
  const pulse = pulseCount > 0
    ? pulseStrength * (pulseAt(value, 0.90, 0.055) + (pulseCount > 1 ? pulseAt(value, 0.945, 0.035) : 0))
    : 0;
  const motionFactor = reduced
    ? reducedMotionMode === 'static-line' ? 0.35 : 0
    : 1;
  const lineOpacity = lineReveal * (1 - dissolve) * motionFactor;
  const sparks = useMemo(
    () => Array.from({ length: Math.max(0, Math.min(16, Math.round(sparkAmount))) }, (_, index) => ({
      left: 4 + hash(index + seed) * 92,
      rise: 5 + hash(index * 3.1 + seed) * 18,
      drift: (hash(index * 5.7 + seed) - 0.5) * 14,
      size: 1 + hash(index * 7.4 + seed) * 1.4,
    })),
    [sparkAmount, seed],
  );
  const vars: HorizonStyle = {
    '--nhr-progress': value,
    '--nhr-horizon': `${clamp01(horizonPosition) * 100}%`,
    '--nhr-line': `${Math.max(1, Math.min(4, lineThickness))}px`,
    '--nhr-line-opacity': lineOpacity,
    '--nhr-pulse': pulse * motionFactor,
    '--nhr-glow': Math.max(0, Math.min(1, glow)),
    '--nhr-bloom': Math.max(0, Math.min(0.6, bloom)),
    '--nhr-jitter': `${Math.max(0, Math.min(1, jitter)) * 5}px`,
    '--nhr-dissolve': dissolve * dissolveStrength * motionFactor,
    '--nhr-hero-fade': smoothstep(0.70, 0.88, value) * heroFade,
    '--nhr-cosmic-reveal': dissolve * cosmicReveal,
    '--nhr-start': colorStart,
    '--nhr-end': colorEnd,
  };

  if (reduced && reducedMotionMode === 'hidden') return null;

  return (
    <div
      className={`nhr-root${className ? ` ${className}` : ''}`}
      data-rift-root="bottom-pulse-horizon"
      data-rift-variant="nox-horizon-rift"
      data-rift-progress={value.toFixed(3)}
      data-reduced={reduced ? reducedMotionMode : undefined}
      style={{ ...vars, ...style }}
    >
      <span className="nhr-line" aria-hidden="true" />
      <span className="nhr-pulse nhr-pulse-one" aria-hidden="true" />
      {pulseCount > 1 && <span className="nhr-pulse nhr-pulse-two" aria-hidden="true" />}
      {sparks.map((spark, index) => (
        <i
          className="nhr-spark"
          key={`spark-${index}`}
          aria-hidden="true"
          style={{ '--spark-left': `${spark.left}%`, '--spark-rise': `${spark.rise}px`, '--spark-drift': `${spark.drift}px`, '--spark-size': `${spark.size}px` } as HorizonStyle}
        />
      ))}
      <style>{CSS}</style>
    </div>
  );
}

const CSS = String.raw`
.nhr-root{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:transparent;isolation:isolate}
.nhr-line{position:absolute;left:6%;right:6%;top:var(--nhr-horizon);height:var(--nhr-line);transform:translateY(-50%);opacity:var(--nhr-line-opacity);background:linear-gradient(90deg,transparent,var(--nhr-start) 18%,var(--nhr-end) 52%,var(--nhr-start) 82%,transparent);box-shadow:0 0 calc(7px + 12px * var(--nhr-glow)) color-mix(in srgb,var(--nhr-start) 65%,transparent),0 0 calc(22px * var(--nhr-bloom)) color-mix(in srgb,var(--nhr-end) 38%,transparent);filter:drop-shadow(0 0 2px color-mix(in srgb,var(--nhr-start) 70%,transparent));}
.nhr-line::after{content:"";position:absolute;inset:calc(var(--nhr-jitter) * -1) 12%;border-radius:50%;opacity:var(--nhr-pulse);background:linear-gradient(90deg,transparent,var(--nhr-start),var(--nhr-end),transparent);filter:blur(5px);}
.nhr-pulse{position:absolute;top:var(--nhr-horizon);width:17%;height:calc(var(--nhr-line) * 1.8);transform:translate(-50%,-50%) scaleX(calc(1 + var(--nhr-pulse) * .22));opacity:var(--nhr-pulse);border-radius:50%;background:radial-gradient(ellipse,var(--nhr-start),transparent 70%);filter:blur(4px);}
.nhr-pulse-one{left:43%}.nhr-pulse-two{left:67%}
.nhr-spark{position:absolute;left:var(--spark-left);top:calc(var(--nhr-horizon) + var(--spark-rise));width:var(--spark-size);height:var(--spark-size);border-radius:50%;opacity:var(--nhr-dissolve);background:var(--nhr-end);box-shadow:0 0 6px color-mix(in srgb,var(--nhr-end) 72%,transparent);transform:translateX(var(--spark-drift));}
.nhr-root[data-reduced="crossfade-only"] .nhr-line,.nhr-root[data-reduced="hidden"] .nhr-line{opacity:0}
@media(max-width:700px){.nhr-line{left:9%;right:9%;box-shadow:0 0 8px color-mix(in srgb,var(--nhr-start) 45%,transparent)}.nhr-pulse{width:22%;filter:blur(5px)}.nhr-spark{box-shadow:0 0 4px color-mix(in srgb,var(--nhr-end) 55%,transparent)}}
@media(prefers-reduced-motion:reduce){.nhr-line::after,.nhr-pulse{display:none}.nhr-spark{transform:none}}
`;
