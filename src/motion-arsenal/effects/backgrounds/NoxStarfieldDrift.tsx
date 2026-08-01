import { useEffect, useRef, useState } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { clamp, seededRandom, useInView, usePrefersReducedMotion, useScrollProgress } from '../../lib/animationUtils';

export type NoxStarfieldVariant = 'deep-drift' | 'section-warp' | 'brand-gateway';
export type NoxStarfieldDirection = 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down';

export interface NoxStarfieldDriftProps {
  starCount?: number;
  driftSpeed?: number;
  intensity?: number;
  depth?: number;
  twinkle?: number;
  textSafety?: number;
  variant?: NoxStarfieldVariant;
  direction?: NoxStarfieldDirection;
  accentColor?: string;
  streakStrength?: number;
  /** Legacy compatibility control. The rebuilt effect intentionally renders no nebula. */
  nebulaStrength?: number;
  /** Legacy compatibility control. The rebuilt effect intentionally renders no portal/gateway band. */
  transitionStrength?: number;
  scrollReactive?: boolean;
  progress?: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  warmth: number;
  phase: number;
}

function makeStars(count: number) {
  const random = seededRandom(20260731);
  return Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    z: 0.05 + random() * 0.95,
    size: 0.32 + random() * random() * 1.8,
    warmth: random(),
    phase: random() * Math.PI * 2,
  }));
}

function wrap01(value: number) {
  if (value > 1) return value - Math.floor(value);
  if (value < 0) return value - Math.floor(value);
  return value;
}

function rgba(color: string, alpha: number) {
  const full = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (full) {
    return `rgba(${parseInt(full[1], 16)},${parseInt(full[2], 16)},${parseInt(full[3], 16)},${alpha})`;
  }
  return `rgba(139,92,246,${alpha})`;
}

export function NoxStarfieldDrift({
  starCount = 680,
  driftSpeed = 0.075,
  intensity = 0.78,
  depth = 0.82,
  twinkle = 0.16,
  textSafety = 0.24,
  variant = 'section-warp',
  direction = 'up',
  accentColor = '#8b5cf6',
  streakStrength = 0.08,
  nebulaStrength = 0,
  transitionStrength = 0,
  scrollReactive = true,
  progress,
}: NoxStarfieldDriftProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef);
  const elementProgress = useScrollProgress(rootRef);
  const lastProgressRef = useRef(0);
  const lastWindowScrollRef = useRef<number | null>(null);
  const scrollImpulseRef = useRef(0);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  );

  // These props remain accepted so existing saved configurations do not break.
  // The visual rebuild deliberately removes the old center nebula, luminous strip and oval gateway.
  void nebulaStrength;
  void transitionStrength;

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const requestedCount = clamp(Math.round(starCount), 120, 1200);
      const responsiveCap = size.w < 560 ? 360 : size.w < 900 ? 540 : 1200;
      const count = Math.min(requestedCount, responsiveCap);
      if (starsRef.current.length !== count) starsRef.current = makeStars(count);

      const safeIntensity = clamp(intensity, 0.2, 1.4);
      const safeDepth = clamp(depth, 0.3, 1.2);
      const safeTwinkle = clamp(twinkle, 0, 0.45);
      const safeDrift = clamp(driftSpeed, 0, 0.24);
      const safeStreak = clamp(streakStrength, 0, 0.5);
      const rawProgress = clamp(progress ?? elementProgress.current, 0, 1);

      const currentWindowScroll = typeof window === 'undefined' ? 0 : window.scrollY;
      const previousWindowScroll = lastWindowScrollRef.current ?? currentWindowScroll;
      const windowDelta = currentWindowScroll - previousWindowScroll;
      lastWindowScrollRef.current = currentWindowScroll;

      const progressDelta = (rawProgress - lastProgressRef.current) * Math.max(720, size.h * 1.25);
      lastProgressRef.current = rawProgress;
      const measuredDelta = Math.abs(windowDelta) > 0.01 ? windowDelta : progressDelta;
      const targetImpulse = scrollReactive ? clamp(measuredDelta, -180, 180) : 0;
      const smoothing = 1 - Math.exp(-14 * Math.max(dt, 1 / 120));
      scrollImpulseRef.current += (targetImpulse - scrollImpulseRef.current) * smoothing;

      // A clean deep-space background: no center object, no ovals, no gate and no luminous band.
      const background = ctx.createLinearGradient(0, 0, 0, size.h);
      background.addColorStop(0, '#02040b');
      background.addColorStop(0.5, '#010208');
      background.addColorStop(1, '#000105');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size.w, size.h);

      const variantBoost = variant === 'section-warp' ? 1.16 : variant === 'brand-gateway' ? 0.94 : 0.82;
      const signedScrollShift = (scrollImpulseRef.current / Math.max(size.h, 1)) * (0.76 + safeDepth * 0.42) * variantBoost;
      const ambient = scrollReactive || reduced ? 0 : safeDrift * dt * 0.42;
      const directionX = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
      const directionY = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
      const depthDirection = direction === 'forward' ? -1 : direction === 'backward' ? 1 : 0;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (let index = 0; index < starsRef.current.length; index += 1) {
        const star = starsRef.current[index];
        const near = 1 - star.z;
        const parallax = 0.28 + near * (0.82 + safeDepth * 0.5);
        let previousY = star.y;

        if (!reduced) {
          if (scrollReactive) {
            // Scrolling down produces a matching upward star movement; scrolling up reverses it.
            star.y = wrap01(star.y - signedScrollShift * parallax);
            star.x = wrap01(star.x + Math.sin(star.phase + elapsed * 0.08) * Math.abs(signedScrollShift) * 0.018 * parallax);
          } else if (depthDirection !== 0) {
            star.z += depthDirection * safeDrift * dt * 0.22;
            if (star.z < 0.04) star.z = 1;
            if (star.z > 1) star.z = 0.04;
          } else {
            star.x = wrap01(star.x + directionX * ambient * parallax);
            star.y = wrap01(star.y + directionY * ambient * parallax);
          }
        }

        const currentNear = 1 - star.z;
        let x = star.x * size.w;
        let y = star.y * size.h;
        if (depthDirection !== 0) {
          const perspective = 0.58 + currentNear * 1.12;
          x = size.w * 0.5 + (star.x - 0.5) * size.w * perspective;
          y = size.h * 0.5 + (star.y - 0.5) * size.h * perspective;
        }

        const pulse = reduced ? 1 : 1 + Math.sin(elapsed * (0.45 + star.warmth * 0.55) + star.phase) * safeTwinkle;
        const alpha = clamp((0.12 + currentNear * 0.74) * safeIntensity * pulse, 0.04, 1);
        const radius = clamp(star.size * (0.52 + currentNear * 1.48), 0.28, 2.8);
        const red = 214 + Math.round(star.warmth * 34);
        const green = 226 + Math.round((1 - Math.abs(star.warmth - 0.5) * 2) * 18);
        const blue = 255 - Math.round(star.warmth * 20);
        const color = `rgb(${red},${green},${blue})`;

        const wrappedDistance = Math.abs(star.y - previousY);
        const didWrap = wrappedDistance > 0.5;
        const visualScrollSpeed = Math.abs(scrollImpulseRef.current);
        if (!reduced && !didWrap && safeStreak > 0 && visualScrollSpeed > 36) {
          const streakLength = clamp((visualScrollSpeed - 36) * 0.08 * safeStreak * parallax, 0, 18);
          if (streakLength > 0.6) {
            const streak = ctx.createLinearGradient(x, y + Math.sign(scrollImpulseRef.current) * streakLength, x, y);
            streak.addColorStop(0, 'rgba(220,235,255,0)');
            streak.addColorStop(1, `rgba(228,239,255,${alpha * 0.42})`);
            ctx.strokeStyle = streak;
            ctx.lineWidth = Math.max(0.35, radius * 0.55);
            ctx.beginPath();
            ctx.moveTo(x, y + Math.sign(scrollImpulseRef.current) * streakLength);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        }

        if (radius > 1.15) {
          ctx.shadowColor = index % 19 === 0 ? rgba(accentColor, alpha * 0.8) : `rgba(210,230,255,${alpha * 0.7})`;
          ctx.shadowBlur = radius * 3.5;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = index % 19 === 0 && variant === 'brand-gateway' ? rgba(accentColor, 1) : color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Edge vignette only. It preserves text contrast without creating a visible object in the center.
      const vignette = ctx.createRadialGradient(
        size.w * 0.5,
        size.h * 0.5,
        Math.min(size.w, size.h) * 0.2,
        size.w * 0.5,
        size.h * 0.5,
        Math.max(size.w, size.h) * 0.72,
      );
      vignette.addColorStop(0, `rgba(0,0,0,${clamp(textSafety, 0, 1) * 0.04})`);
      vignette.addColorStop(0.72, 'rgba(0,0,0,0.04)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.48)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, size.w, size.h);
    },
    !reduced && pageVisible && inView,
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-variant={variant}
      data-direction={direction}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#000105',
        pointerEvents: 'none',
        isolation: 'isolate',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

export default NoxStarfieldDrift;
