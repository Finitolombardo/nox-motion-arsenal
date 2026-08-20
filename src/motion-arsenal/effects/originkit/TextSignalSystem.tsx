import { useCallback, useEffect, useMemo, useRef, useState } from 'react';


type TextSignalMode = 'boot' | 'glitch';
type TextSignalTrigger = 'enter' | 'hover' | 'interval' | 'auto';
type RestState = 'filled' | 'outline' | 'invisible';
type GlitchStyle = 'rgb-split' | 'slices' | 'full';
type LetterFlickerMode = 'stroke' | 'opacity';


export interface TextSignalSystemProps {
  text?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div' | 'span';
  mode?: TextSignalMode;
  trigger?: TextSignalTrigger;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  durationMs?: number;
  intervalMs?: number;
  delayMs?: number;
  intensity?: number;
  showStroke?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  restState?: RestState;
  flickerCount?: number;
  letterFlicker?: boolean;
  letterFlickerMode?: LetterFlickerMode;
  letterFlickerAmount?: number;
  shake?: boolean;
  shakePx?: number;
  glitchStyle?: GlitchStyle;
  replayOnHover?: boolean;
  seed?: number;
  className?: string;
  style?: React.CSSProperties;
}


type BurstPhase = 'idle' | 'outline' | 'fill' | 'split' | 'slice' | 'flash';


function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}


function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);
  return reduced;
}


export default function TextSignalSystem({
  text = 'SIGNAL', tag = 'div', mode = 'glitch', trigger = 'auto',
  color = '#ffffff', fontSize = 72, fontFamily = 'Inter, sans-serif',
  fontWeight = 700, letterSpacing = 2,
  durationMs = mode === 'boot' ? 1200 : 220,
  intervalMs = 3000, delayMs = 0, intensity = 6,
  showStroke = true, strokeColor = '#ffffff', strokeWidth = 1.5,
  restState = 'filled', flickerCount = 6, letterFlicker = true,
  letterFlickerMode = 'opacity', letterFlickerAmount = 0.28,
  shake = false, shakePx = 8, glitchStyle = 'full', replayOnHover = false,
  seed = 1337, className, style,
}: TextSignalSystemProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);
  const visibleRef = useRef(true);
  const playedRef = useRef(false);
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<BurstPhase>('idle');
  const [burstSeed, setBurstSeed] = useState(seed);
  const Tag = tag as any;


  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    activeRef.current = false;
    setPhase('idle');
  }, []);


  const run = useCallback(() => {
    if (reduced || activeRef.current || !visibleRef.current) return;
    activeRef.current = true;
    setBurstSeed((v) => v + 1);
    const started = performance.now();
    const duration = Math.max(80, durationMs);
    const count = Math.max(2, flickerCount);


    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / duration);
      if (mode === 'boot') {
        const step = Math.min(count - 1, Math.floor(p * count));
        if (showStroke && step === 0) setPhase('outline');
        else setPhase(step % 2 === 0 ? 'fill' : 'outline');
      } else if (p < 0.34) {
        setPhase(glitchStyle === 'slices' ? 'slice' : 'split');
      } else if (p < 0.72) {
        setPhase(glitchStyle === 'rgb-split' ? 'split' : 'slice');
      } else {
        setPhase('flash');
      }


      if (p >= 1) {
        activeRef.current = false;
        setPhase('idle');
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };


    timeoutRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, Math.max(0, delayMs));
  }, [delayMs, durationMs, flickerCount, glitchStyle, mode, reduced, showStroke]);


  useEffect(() => {
    const onVisibility = () => {
      visibleRef.current = document.visibilityState !== 'hidden';
      if (!visibleRef.current) stop();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [stop]);


  useEffect(() => {
    const node = rootRef.current;
    if (!node || reduced) return;


    let io: IntersectionObserver | null = null;
    if (trigger === 'enter' || trigger === 'auto') {
      io = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!playedRef.current) {
          playedRef.current = true;
          run();
        }
      }, { threshold: 0.25 });
      io.observe(node);
    }


    if (trigger === 'auto') run();
    if (trigger === 'interval') {
      run();
      intervalRef.current = setInterval(run, Math.max(durationMs + 120, intervalMs));
    }


    return () => {
      io?.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      stop();
    };
  }, [durationMs, intervalMs, reduced, run, stop, trigger]);


  const visual = useMemo(() => {
    const rnd = seeded(burstSeed * 97 + text.length * 13);
    const sign = rnd() > 0.5 ? 1 : -1;
    const px = Math.max(1, intensity) * (1.8 + rnd() * 1.6);
    const letterMask = Array.from(text).map(() => rnd() < letterFlickerAmount);
    return {
      sign,
      px,
      sliceTop: Math.round(10 + rnd() * 45),
      sliceBottom: Math.round(10 + rnd() * 45),
      letterMask,
    };
  }, [burstSeed, intensity, letterFlickerAmount, text]);


  const isActive = phase !== 'idle';
  const outline = phase === 'outline' || (phase === 'idle' && restState === 'outline');
  const invisible = phase === 'idle' && restState === 'invisible';
  const split = phase === 'split';
  const slice = phase === 'slice';
  const flash = phase === 'flash';
  const translate = shake && isActive ? visual.sign * Math.min(shakePx, visual.px * 0.7) : 0;


  return (
    <Tag
      ref={rootRef}
      className={className}
      onPointerEnter={() => {
        if (trigger === 'hover' || replayOnHover) run();
      }}
      style={{
        position: 'relative', display: 'inline-block',
        color: invisible ? 'transparent' : outline ? 'transparent' : color,
        WebkitTextStroke: outline ? `${strokeWidth}px ${strokeColor}` : undefined,
        fontFamily, fontSize, fontWeight, letterSpacing, lineHeight: 1.05,
        transform: translate ? `translate3d(${translate}px,0,0)` : undefined,
        opacity: flash ? 0.12 : 1,
        willChange: isActive ? 'transform, opacity' : undefined,
        userSelect: 'none', ...style,
      }}
      aria-label={text}
      data-text-signal-mode={mode}
      data-text-signal-phase={phase}
    >
      <span style={{ position: 'relative', zIndex: 2 }} aria-hidden="true">
        {Array.from(text).map((ch, i) => {
          const flick = letterFlicker && isActive && visual.letterMask[i];
          return (
            <span key={`${i}-${ch}`} style={{
              opacity: flick && letterFlickerMode === 'opacity' ? 0.25 : 1,
              WebkitTextStroke: flick && letterFlickerMode === 'stroke' ? `${strokeWidth}px ${strokeColor}` : undefined,
              color: flick && letterFlickerMode === 'stroke' ? 'transparent' : undefined,
            }}>{ch}</span>
          );
        })}
      </span>


      {split && (glitchStyle === 'rgb-split' || glitchStyle === 'full') && <>
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, color: '#ff315f', transform: `translateX(${visual.px}px)`, opacity: 0.72, mixBlendMode: 'screen' }}>{text}</span>
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, color: '#21d4ff', transform: `translateX(${-visual.px * 0.8}px)`, opacity: 0.72, mixBlendMode: 'screen' }}>{text}</span>
      </>}


      {slice && (glitchStyle === 'slices' || glitchStyle === 'full') && (
        <span aria-hidden="true" style={{
          position: 'absolute', inset: 0, color,
          transform: `translateX(${visual.sign * visual.px * 0.9}px)`,
          clipPath: `inset(${visual.sliceTop}% 0 ${visual.sliceBottom}% 0)`,
          filter: `blur(${Math.min(1.2, intensity * 0.08)}px)`,
        }}>{text}</span>
      )}
    </Tag>
  );
}
