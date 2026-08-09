import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * WeightHover — phrase-level interactive variable-font weight wave.
 *
 * The original port attached `whileHover` to every glyph, so hovering one
 * character animated only that character and the configured stagger never
 * behaved like a coherent word animation. This version treats the phrase as
 * one interaction target and drives every glyph from the same hover/focus
 * state.
 *
 * Production notes:
 * - pointer + keyboard focus trigger the same effect
 * - animates both `font-weight` and the variable-font `wght` axis
 * - honors prefers-reduced-motion by removing stagger/scale motion
 * - keeps the readable phrase exposed once to assistive technology
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  lightWeight?: number;       // 100–900
  heavyWeight?: number;       // 100–900
  duration?: number;
  easing?: 'easeOut' | 'easeIn' | 'easeInOut' | 'linear';
  stagger?: number;           // seconds between each char
  scale?: number;             // optional scale boost
  style?: React.CSSProperties;
}

const clampWeight = (value: number) => Math.min(1000, Math.max(1, value));

export default function WeightHover({
  text = 'WEIGHT',
  color = '#ffffff',
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  lightWeight = 300,
  heavyWeight = 900,
  duration = 0.4,
  easing = 'easeOut',
  stagger = 0.03,
  scale = 1.0,
  style,
}: Props) {
  const [active, setActive] = useState(false);
  const reduceMotion = useReducedMotion();
  const chars = Array.from(text);
  const low = clampWeight(lightWeight);
  const high = clampWeight(heavyWeight);
  const safeDuration = Math.max(0.08, duration);
  const safeStagger = Math.max(0, stagger);
  const safeScale = Math.max(0.5, Math.min(2, scale));

  return (
    <span
      aria-label={text}
      tabIndex={0}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        fontSize: Math.max(1, fontSize),
        fontFamily,
        lineHeight: 1.2,
        cursor: 'pointer',
        outlineOffset: 6,
        ...style,
      }}
    >
      {chars.map((char, i) => {
        const targetWeight = active ? high : low;
        const targetScale = reduceMotion || !active ? 1 : safeScale;
        const delay = reduceMotion ? 0 : i * safeStagger;

        return (
          <motion.span
            aria-hidden="true"
            key={`${char}-${i}`}
            initial={false}
            animate={{
              fontWeight: targetWeight,
              fontVariationSettings: `"wght" ${targetWeight}`,
              scale: targetScale,
            }}
            transition={{
              fontWeight: { duration: reduceMotion ? 0 : safeDuration, delay, ease: easing },
              fontVariationSettings: { duration: reduceMotion ? 0 : safeDuration, delay, ease: easing },
              scale: { duration: reduceMotion ? 0 : safeDuration * 1.15, delay, ease: easing },
            }}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              color,
              fontWeight: low,
              fontVariationSettings: `"wght" ${low}`,
              transformOrigin: '50% 70%',
              willChange: reduceMotion ? undefined : 'font-weight, font-variation-settings, transform',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        );
      })}
    </span>
  );
}
