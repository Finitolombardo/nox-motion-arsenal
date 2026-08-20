import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';


type CharacterHoverMode = 'directional-exit' | 'glyph-flip';
type Direction = 'top' | 'right' | 'bottom' | 'left';
type StaggerDirection = 'forward' | 'reverse' | 'center' | 'edges';


export interface CharacterHoverSystemProps {
  text?: string;
  altText?: string;
  mode?: CharacterHoverMode;
  color?: string;
  altColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  distance?: number;
  duration?: number;
  stagger?: number;
  staggerDirection?: StaggerDirection;
  blur?: number;
  rotate?: number;
  depth?: number;
  seed?: number;
  className?: string;
  style?: React.CSSProperties;
}


const VECTORS: Record<Direction, { x: number; y: number }> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};


function directionFromPointer(el: HTMLElement, clientX: number, clientY: number): Direction {
  const rect = el.getBoundingClientRect();
  const x = clientX - (rect.left + rect.width / 2);
  const y = clientY - (rect.top + rect.height / 2);
  if (Math.abs(x) > Math.abs(y)) return x >= 0 ? 'right' : 'left';
  return y >= 0 ? 'bottom' : 'top';
}


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


function staggerRank(index: number, count: number, mode: StaggerDirection) {
  if (mode === 'reverse') return count - 1 - index;
  if (mode === 'center') return Math.abs(index - (count - 1) / 2);
  if (mode === 'edges') return Math.min(index, count - 1 - index);
  return index;
}


export default function CharacterHoverSystem({
  text = 'CHARACTER', altText, mode = 'directional-exit',
  color = '#ffffff', altColor = '#8b8b8b', fontSize = 64,
  fontFamily = 'Inter, sans-serif', fontWeight = 700, letterSpacing = 0,
  distance = 30, duration = 0.34, stagger = 0.025, staggerDirection = 'forward',
  blur = 5, rotate = 90, depth = 42, seed = 1701, className, style,
}: CharacterHoverSystemProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const [direction, setDirection] = useState<Direction>('top');
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();
  const chars = useMemo(() => Array.from(text), [text]);


  const altChars = useMemo(() => {
    if (altText) {
      const supplied = Array.from(altText);
      return chars.map((char, i) => supplied[i] ?? char);
    }
    const pool = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    const rnd = seeded(seed + text.length * 31);
    return chars.map((char) => char === ' ' ? ' ' : pool[Math.floor(rnd() * pool.length)]);
  }, [altText, chars, seed, text.length]);


  const vector = VECTORS[direction];
  const active = hovered && !reduced;


  return (
    <span
      ref={rootRef}
      className={className}
      onPointerEnter={(event) => {
        if (rootRef.current) setDirection(directionFromPointer(rootRef.current, event.clientX, event.clientY));
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', flexWrap: 'wrap', perspective: 900,
        fontFamily, fontSize, fontWeight, letterSpacing, lineHeight: 1.08,
        userSelect: 'none', ...style,
      }}
      aria-label={text}
      data-character-hover-mode={mode}
      data-character-hover-direction={direction}
    >
      {chars.map((char, i) => {
        const rank = staggerRank(i, chars.length, staggerDirection);
        const delay = rank * stagger;
        const display = char === ' ' ? '\u00A0' : char;
        const alt = altChars[i] === ' ' ? '\u00A0' : altChars[i];


        if (mode === 'glyph-flip') {
          return (
            <span key={`${i}-${char}`} aria-hidden="true" style={{
              display: 'inline-block', position: 'relative', minWidth: char === ' ' ? '0.32em' : '0.58em',
              height: '1.08em', transformStyle: 'preserve-3d',
            }}>
              <motion.span
                animate={active ? { rotateX: rotate, y: -depth * 0.12, opacity: 0 } : { rotateX: 0, y: 0, opacity: 1 }}
                transition={{ duration, delay, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color, backfaceVisibility: 'hidden', transformOrigin: 'center center' }}
              >{display}</motion.span>
              <motion.span
                animate={active ? { rotateX: 0, y: 0, opacity: 1 } : { rotateX: -rotate, y: depth * 0.12, opacity: 0 }}
                transition={{ duration, delay, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: altColor, backfaceVisibility: 'hidden', transformOrigin: 'center center' }}
              >{alt}</motion.span>
            </span>
          );
        }


        return (
          <span key={`${i}-${char}`} aria-hidden="true" style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
            <motion.span
              animate={active ? {
                x: vector.x * distance,
                y: vector.y * distance,
                opacity: 0,
                filter: `blur(${blur}px)`,
                rotateZ: vector.x * Math.min(10, distance * 0.18),
              } : { x: 0, y: 0, opacity: 1, filter: 'blur(0px)', rotateZ: 0 }}
              transition={{ duration, delay, ease: [0.22, 0.8, 0.22, 1] }}
              style={{ display: 'inline-block', color, whiteSpace: 'pre' }}
            >{display}</motion.span>
            <motion.span
              animate={active ? { x: 0, y: 0, opacity: 1, filter: 'blur(0px)' } : {
                x: -vector.x * distance * 0.65,
                y: -vector.y * distance * 0.65,
                opacity: 0,
                filter: `blur(${Math.max(1, blur * 0.75)}px)`,
              }}
              transition={{ duration, delay: delay + duration * 0.12, ease: [0.22, 0.8, 0.22, 1] }}
              style={{ position: 'absolute', inset: 0, display: 'inline-block', color: altColor, whiteSpace: 'pre' }}
            >{altText ? alt : display}</motion.span>
          </span>
        );
      })}
    </span>
  );
}
