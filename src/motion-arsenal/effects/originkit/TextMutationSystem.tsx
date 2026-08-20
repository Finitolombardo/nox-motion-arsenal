import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';


const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`';


export type TextMutationMode = 'typewriter' | 'scramble';
export type TextMutationTrigger = 'auto' | 'hover' | 'once';
export type TypingMode = 'forward' | 'forward-back' | 'random';
export type TextMutationPresetId =
  | 'restaurant' | 'beauty' | 'fitness' | 'local-service' | 'real-estate' | 'automotive'
  | 'healthcare' | 'finance' | 'saas' | 'ecommerce' | 'luxury' | 'creator';


export interface TextMutationPreset {
  label: string;
  mode: TextMutationMode;
  trigger: TextMutationTrigger;
  speed: number;
  iterations: number;
  typingMode: TypingMode;
  loop: boolean;
  delay: number;
  pauseAfter: number;
  cursor: boolean;
  fontWeight: number;
  letterSpacing: number;
  color: string;
}


export const TEXT_MUTATION_PRESETS: Record<TextMutationPresetId, TextMutationPreset> = {
  restaurant: { label: 'Restaurant / Hospitality', mode: 'typewriter', trigger: 'once', speed: 72, iterations: 5, typingMode: 'forward', loop: false, delay: 260, pauseAfter: 2400, cursor: false, fontWeight: 650, letterSpacing: .02, color: '#D89B5B' },
  beauty: { label: 'Beauty / Wellness', mode: 'typewriter', trigger: 'once', speed: 92, iterations: 4, typingMode: 'forward', loop: false, delay: 320, pauseAfter: 2800, cursor: false, fontWeight: 540, letterSpacing: .045, color: '#D9A8B8' },
  fitness: { label: 'Fitness / Sport', mode: 'scramble', trigger: 'auto', speed: 34, iterations: 5, typingMode: 'random', loop: true, delay: 80, pauseAfter: 1700, cursor: false, fontWeight: 850, letterSpacing: .015, color: '#FF5B2E' },
  'local-service': { label: 'Handwerk / Local Service', mode: 'typewriter', trigger: 'once', speed: 58, iterations: 4, typingMode: 'forward', loop: false, delay: 180, pauseAfter: 2200, cursor: true, fontWeight: 760, letterSpacing: .015, color: '#F2B544' },
  'real-estate': { label: 'Immobilien', mode: 'typewriter', trigger: 'once', speed: 88, iterations: 4, typingMode: 'forward', loop: false, delay: 300, pauseAfter: 3000, cursor: false, fontWeight: 560, letterSpacing: .035, color: '#C8B38A' },
  automotive: { label: 'Automotive', mode: 'scramble', trigger: 'auto', speed: 38, iterations: 6, typingMode: 'random', loop: true, delay: 80, pauseAfter: 1900, cursor: false, fontWeight: 820, letterSpacing: .025, color: '#C5D0D9' },
  healthcare: { label: 'Healthcare / Praxis', mode: 'typewriter', trigger: 'once', speed: 82, iterations: 3, typingMode: 'forward', loop: false, delay: 240, pauseAfter: 3200, cursor: false, fontWeight: 560, letterSpacing: .02, color: '#69B8B4' },
  finance: { label: 'Kanzlei / Finance', mode: 'typewriter', trigger: 'once', speed: 86, iterations: 3, typingMode: 'forward', loop: false, delay: 260, pauseAfter: 3200, cursor: true, fontWeight: 620, letterSpacing: .03, color: '#B8A46B' },
  saas: { label: 'SaaS / Tech', mode: 'scramble', trigger: 'auto', speed: 46, iterations: 5, typingMode: 'forward', loop: true, delay: 100, pauseAfter: 2200, cursor: false, fontWeight: 760, letterSpacing: .025, color: '#62A7FF' },
  ecommerce: { label: 'E-Commerce', mode: 'scramble', trigger: 'hover', speed: 42, iterations: 5, typingMode: 'random', loop: false, delay: 0, pauseAfter: 2000, cursor: false, fontWeight: 780, letterSpacing: .02, color: '#F078B8' },
  luxury: { label: 'Luxury / Premium', mode: 'typewriter', trigger: 'once', speed: 112, iterations: 3, typingMode: 'forward', loop: false, delay: 420, pauseAfter: 3600, cursor: false, fontWeight: 520, letterSpacing: .065, color: '#C5A56B' },
  creator: { label: 'Creator / Personal Brand', mode: 'scramble', trigger: 'hover', speed: 36, iterations: 6, typingMode: 'random', loop: false, delay: 0, pauseAfter: 1800, cursor: false, fontWeight: 820, letterSpacing: .02, color: '#B86CFF' },
};


export interface TextMutationSystemProps {
  preset?: TextMutationPresetId;
  mode?: TextMutationMode;
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  speed?: number;
  iterations?: number;
  trigger?: TextMutationTrigger;
  typingMode?: TypingMode;
  loop?: boolean;
  delay?: number;
  pauseAfter?: number;
  cursor?: boolean;
  cursorChar?: string;
  cursorColor?: string;
  seed?: number;
  style?: CSSProperties;
}


function scrambledFrame(target: string, resolved: number, seed: number) {
  const rnd = seededRandom(seed);
  return Array.from(target).map((char, index) => {
    if (char === ' ' || index < resolved) return char;
    return SCRAMBLE_CHARS[Math.floor(rnd() * SCRAMBLE_CHARS.length)] ?? char;
  }).join('');
}


export function TextMutationSystem(props: TextMutationSystemProps) {
  const preset = TEXT_MUTATION_PRESETS[props.preset ?? 'saas'];
  const mode = props.mode ?? preset.mode;
  const text = props.text ?? (mode === 'scramble' ? 'SIGNAL DECODED' : 'SYSTEM ONLINE');
  const color = props.color ?? preset.color;
  const fontSize = props.fontSize ?? 48;
  const fontFamily = props.fontFamily ?? 'monospace';
  const fontWeight = props.fontWeight ?? preset.fontWeight;
  const letterSpacing = props.letterSpacing ?? preset.letterSpacing;
  const speed = Math.max(12, props.speed ?? preset.speed);
  const iterations = Math.max(2, Math.round(props.iterations ?? preset.iterations));
  const trigger = props.trigger ?? preset.trigger;
  const typingMode = props.typingMode ?? preset.typingMode;
  const loop = props.loop ?? preset.loop;
  const delay = Math.max(0, props.delay ?? preset.delay);
  const pauseAfter = Math.max(250, props.pauseAfter ?? preset.pauseAfter);
  const cursor = props.cursor ?? preset.cursor;
  const cursorChar = props.cursorChar ?? '|';
  const cursorColor = props.cursorColor ?? color;
  const seed = props.seed ?? 17;
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? text : mode === 'typewriter' ? '' : text);
  const [running, setRunning] = useState(false);
  const runRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const directionRef = useRef<1 | -1>(1);


  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);


  const schedule = useCallback((fn: () => void, ms: number) => {
    clearTimer();
    timerRef.current = window.setTimeout(fn, ms);
  }, [clearTimer]);


  const start = useCallback(() => {
    if (reduced) { setDisplay(text); setRunning(false); return; }
    runRef.current += 1;
    directionRef.current = 1;
    setRunning(true);
    setDisplay(mode === 'typewriter' ? '' : scrambledFrame(text, 0, seed + runRef.current));
  }, [mode, reduced, seed, text]);


  useEffect(() => {
    clearTimer();
    setDisplay(reduced ? text : mode === 'typewriter' ? '' : text);
    setRunning(false);
    if (reduced) return;
    if (trigger === 'once' || trigger === 'auto') schedule(start, delay);
    return clearTimer;
  }, [clearTimer, delay, mode, reduced, schedule, start, text, trigger]);


  useEffect(() => {
    if (!running || reduced) return;
    const run = runRef.current;


    if (mode === 'typewriter') {
      const currentLength = display.length;
      if (typingMode === 'forward' || typingMode === 'random') {
        if (currentLength < text.length) {
          const jump = typingMode === 'random' ? Math.max(1, Math.floor(seededRandom(seed + run * 101 + currentLength)() * 4)) : 1;
          schedule(() => setDisplay(text.slice(0, Math.min(text.length, currentLength + jump))), speed * (typingMode === 'random' ? .72 : 1));
          return;
        }
        setRunning(false);
        if (loop || trigger === 'auto') schedule(start, pauseAfter);
        return;
      }


      const deleting = directionRef.current === -1;
      if (!deleting && currentLength < text.length) {
        schedule(() => setDisplay(text.slice(0, currentLength + 1)), speed);
      } else if (!deleting) {
        directionRef.current = -1;
        schedule(() => setDisplay(text.slice(0, Math.max(0, text.length - 1))), pauseAfter);
      } else if (currentLength > 0) {
        schedule(() => setDisplay(text.slice(0, currentLength - 1)), speed * .55);
      } else {
        directionRef.current = 1;
        setRunning(false);
        if (loop || trigger === 'auto') schedule(start, pauseAfter);
      }
      return;
    }


    const resolved = Array.from(text).reduce((count, char, index) => count + (display[index] === char ? 1 : 0), 0);
    const step = Math.max(1, Math.ceil(text.length / Math.max(1, iterations * 1.4)));
    if (resolved < text.length) {
      const nextResolved = Math.min(text.length, resolved + step);
      schedule(() => setDisplay(scrambledFrame(text, nextResolved, seed + run * 131 + nextResolved)), speed);
      return;
    }
    setDisplay(text);
    setRunning(false);
    if (loop || trigger === 'auto') schedule(start, pauseAfter);
  }, [display, iterations, loop, mode, pauseAfter, reduced, schedule, seed, speed, start, text, trigger, typingMode, running]);


  useEffect(() => clearTimer, [clearTimer]);


  const cursorVisible = cursor && mode === 'typewriter' && (running || display.length < text.length);
  const ariaLabel = useMemo(() => text, [text]);


  return (
    <span
      aria-label={ariaLabel}
      onMouseEnter={trigger === 'hover' ? start : undefined}
      style={{ color, fontSize, fontFamily, fontWeight, letterSpacing: `${letterSpacing}em`, display: 'inline-block', lineHeight: 1.2, cursor: trigger === 'hover' ? 'pointer' : undefined, ...props.style }}
    >
      <span aria-hidden>{display}</span>
      {cursorVisible && <span aria-hidden style={{ color: cursorColor, marginLeft: 1, animation: reduced ? undefined : 'nox-tm-blink .82s step-end infinite' }}>{cursorChar}</span>}
      <style>{`@keyframes nox-tm-blink { 0%,100%{opacity:1} 50%{opacity:0} } @media (prefers-reduced-motion: reduce){.nox-tm-cursor{animation:none!important}}`}</style>
    </span>
  );
}


export default TextMutationSystem;
