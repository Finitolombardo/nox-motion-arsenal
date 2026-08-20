import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';


type TextParticleMode = 'assemble' | 'dissolve';
type TextTrigger = 'hover' | 'auto' | 'scroll';
type TextParticleProfile = 'lite' | 'balanced' | 'cinematic';


type Particle = {
  x: number; y: number;
  homeX: number; homeY: number;
  vx: number; vy: number;
  size: number;
  alpha: number;
  seed: number;
};


export interface ParticleTextTransformationSystemProps {
  text?: string;
  mode?: TextParticleMode;
  trigger?: TextTrigger;
  color?: string;
  particleColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  particleCount?: number;
  particleSize?: number;
  duration?: number;
  hold?: number;
  spread?: number;
  turbulence?: number;
  glow?: boolean;
  profile?: TextParticleProfile;
  seed?: number;
  style?: CSSProperties;
}


const PROFILE: Record<TextParticleProfile, { maxParticles: number; dpr: number; sampleFloor: number }> = {
  lite: { maxParticles: 160, dpr: 1.25, sampleFloor: 4 },
  balanced: { maxParticles: 320, dpr: 1.75, sampleFloor: 3 },
  cinematic: { maxParticles: 520, dpr: 2, sampleFloor: 2 },
};


function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t: number) { return t * t * t; }


export default function ParticleTextTransformationSystem({
  text = 'TRANSFORM',
  mode = 'assemble',
  trigger = 'hover',
  color = '#ffffff',
  particleColor,
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  fontWeight = 700,
  particleCount = 220,
  particleSize = 2.4,
  duration = 1200,
  hold = 1600,
  spread = 110,
  turbulence = 0.18,
  glow = true,
  profile = 'balanced',
  seed = 4242,
  style,
}: ParticleTextTransformationSystemProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const lastFrameRef = useRef(0);
  const resumePendingRef = useRef(false);
  const settledRef = useRef(mode === 'dissolve');
  const activeRef = useRef(false);
  const directionRef = useRef<TextParticleMode>(mode);
  const timerRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 1, h: 1, dpr: 1 });
  const visibleRef = useRef(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const budget = PROFILE[profile];
  const drawColor = particleColor || color;


  const textStyle = useMemo<CSSProperties>(() => ({
    color,
    fontSize,
    fontFamily,
    fontWeight,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  }), [color, fontFamily, fontSize, fontWeight]);


  const cancel = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);


  const buildParticles = useCallback(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return [] as Particle[];
    const { w, h } = sizeRef.current;
    const mask = document.createElement('canvas');
    mask.width = Math.max(1, Math.round(w));
    mask.height = Math.max(1, Math.round(h));
    const ctx = mask.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [] as Particle[];
    ctx.clearRect(0, 0, mask.width, mask.height);
    ctx.fillStyle = '#fff';
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
    const pixels = ctx.getImageData(0, 0, mask.width, mask.height).data;
    const desired = Math.min(particleCount, budget.maxParticles);
    const stride = Math.max(budget.sampleFloor, Math.ceil(Math.sqrt((w * h) / Math.max(1, desired * 7))));
    const targets: Array<[number, number]> = [];
    for (let y = 0; y < mask.height; y += stride) {
      for (let x = 0; x < mask.width; x += stride) {
        if (pixels[(y * mask.width + x) * 4 + 3] > 150) targets.push([x, y]);
      }
    }
    if (!targets.length) targets.push([w / 2, h / 2]);


    const random = rng(seed + text.length * 101 + Math.round(w));
    const output: Particle[] = [];
    for (let i = 0; i < desired; i += 1) {
      const [homeX, homeY] = targets[Math.floor(random() * targets.length)] ?? [w / 2, h / 2];
      const angle = random() * Math.PI * 2;
      const distance = spread * (0.35 + random() * 0.95);
      const scatteredX = homeX + Math.cos(angle) * distance;
      const scatteredY = homeY + Math.sin(angle) * distance;
      const dissolve = directionRef.current === 'dissolve';
      output.push({
        x: dissolve ? homeX : scatteredX,
        y: dissolve ? homeY : scatteredY,
        homeX,
        homeY,
        vx: Math.cos(angle) * (55 + random() * 125),
        vy: Math.sin(angle) * (45 + random() * 110) - 45,
        size: particleSize * (0.45 + random() * 0.9),
        alpha: 0.35 + random() * 0.65,
        seed: random() * 100,
      });
    }
    return output;
  }, [budget.maxParticles, budget.sampleFloor, fontFamily, fontSize, fontWeight, particleCount, particleSize, seed, spread, text]);


  const renderStaticText = useCallback((alpha = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
    ctx.restore();
  }, [color, fontFamily, fontSize, fontWeight, text]);


  const animate = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !visibleRef.current || document.hidden) {
      rafRef.current = null;
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const elapsed = now - startRef.current;
    const dt = Math.min(0.05, Math.max(1 / 240, (now - (lastFrameRef.current || now - 16.67)) / 1000));
    lastFrameRef.current = now;
    const raw = Math.min(1, elapsed / Math.max(120, duration));
    const progress = directionRef.current === 'assemble' ? easeOutCubic(raw) : easeInCubic(raw);
    const { dpr } = sizeRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);


    for (const p of particlesRef.current) {
      if (directionRef.current === 'assemble') {
        const wobble = Math.sin(now * 0.006 + p.seed) * turbulence * (1 - progress);
        const blend = 1 - Math.exp(-(4.2 + progress * 10.5) * dt);
        p.x += (p.homeX - p.x) * blend + wobble * dt * 18;
        p.y += (p.homeY - p.y) * blend - wobble * dt * 9;
      } else {
        const energy = 0.35 + progress * 1.35;
        p.vy += 120 * dt;
        p.x += p.vx * dt * energy;
        p.y += p.vy * dt * energy;
      }
      const alpha = directionRef.current === 'assemble'
        ? Math.min(1, p.alpha * (0.25 + progress * 1.15))
        : Math.max(0, p.alpha * (1 - progress));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = drawColor;
      ctx.shadowColor = drawColor;
      ctx.shadowBlur = glow ? 8 * alpha : 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.55, p.size * (0.65 + (1 - progress) * 0.35)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;


    if (raw < 1) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }


    rafRef.current = null;
    activeRef.current = false;
    settledRef.current = directionRef.current === 'assemble';
    if (directionRef.current === 'assemble') renderStaticText(1);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);


    if (directionRef.current === 'dissolve' && hold >= 0) {
      timerRef.current = window.setTimeout(() => {
        directionRef.current = 'assemble';
        particlesRef.current = buildParticles();
        startRef.current = performance.now();
        lastFrameRef.current = startRef.current;
        activeRef.current = true;
        rafRef.current = requestAnimationFrame(animate);
      }, hold);
    }
  }, [buildParticles, drawColor, duration, glow, hold, renderStaticText, turbulence]);


  const start = useCallback((nextMode: TextParticleMode = mode) => {
    if (activeRef.current || reducedMotion) return;
    directionRef.current = nextMode;
    particlesRef.current = buildParticles();
    startRef.current = performance.now();
    lastFrameRef.current = startRef.current;
    settledRef.current = false;
    activeRef.current = true;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
  }, [animate, buildParticles, mode, reducedMotion]);


  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);


  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const resize = () => {
      const rect = root.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, budget.dpr);
      sizeRef.current = { w: Math.max(1, rect.width), h: Math.max(1, rect.height), dpr };
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      if (!activeRef.current) {
        const alpha = mode === 'assemble' ? (settledRef.current ? 1 : trigger === 'hover' ? 0.18 : 0.04) : 1;
        renderStaticText(alpha);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    resize();
    return () => ro.disconnect();
  }, [budget.dpr, mode, renderStaticText, trigger]);


  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => {
      const visible = Boolean(entry?.isIntersecting);
      visibleRef.current = visible;
      if (!visible && rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        resumePendingRef.current = activeRef.current;
        activeRef.current = false;
      }
      if (visible && resumePendingRef.current) {
        resumePendingRef.current = false;
        start(directionRef.current);
      } else if (visible && trigger === 'scroll' && !activeRef.current && !settledRef.current) {
        start(mode);
      }
    }, { threshold: 0.35, rootMargin: '80px' });
    io.observe(root);
    return () => io.disconnect();
  }, [mode, start, trigger]);


  useEffect(() => {
    if (trigger === 'auto') start(mode);
  }, [mode, start, trigger]);


  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          resumePendingRef.current = activeRef.current;
          activeRef.current = false;
        }
      } else if (resumePendingRef.current && visibleRef.current) {
        resumePendingRef.current = false;
        start(directionRef.current);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [start]);


  useEffect(() => cancel, [cancel]);


  const srOnly: CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  };


  return (
    <div
      ref={rootRef}
      onPointerEnter={trigger === 'hover' ? () => start(mode) : undefined}
      style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', minWidth: 180, minHeight: fontSize * 1.7, cursor: trigger === 'hover' ? 'pointer' : undefined, ...style }}
    >
      <span style={srOnly}>{text}</span>
      <span aria-hidden="true" style={{ ...textStyle, visibility: reducedMotion ? 'visible' : 'hidden' }}>{text}</span>
      {!reducedMotion && <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />}
    </div>
  );
}
