import { motion, useReducedMotion } from 'framer-motion';

/**
 * DynamicWeight — autonomous variable-font weight wave.
 *
 * Production notes:
 * - animates both `font-weight` and the variable-font `wght` axis
 * - honors prefers-reduced-motion with a stable midpoint weight
 * - clamps unsafe input values and avoids zero/negative durations
 * - keeps the full phrase available to assistive technology while individual
 *   animated glyphs stay aria-hidden
 *
 * Ported from Originkit (originkit.dev/components/dynamic-weight),
 * Framer runtime stripped → framer-motion.
 */

interface Props {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  minWeight?: number;
  maxWeight?: number;
  duration?: number;      // seconds for a full cycle
  delayPerChar?: number;  // phase offset per character
  easing?: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear';
  style?: React.CSSProperties;
}

const clampWeight = (value: number) => Math.min(1000, Math.max(1, value));

export default function DynamicWeight({
  text = 'DYNAMIC',
  color = '#ffffff',
  fontSize = 64,
  fontFamily = 'Inter, sans-serif',
  minWeight = 200,
  maxWeight = 900,
  duration = 2,
  delayPerChar = 0.15,
  easing = 'easeInOut' as const,
  style,
}: Props) {
  const reduceMotion = useReducedMotion();
  const chars = Array.from(text);
  const low = clampWeight(Math.min(minWeight, maxWeight));
  const high = clampWeight(Math.max(minWeight, maxWeight));
  const midpoint = Math.round((low + high) / 2);
  const safeDuration = Math.max(0.15, duration);
  const safeDelay = Math.max(0, delayPerChar);

  return (
    <span
      aria-label={text}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        fontSize: Math.max(1, fontSize),
        fontFamily,
        lineHeight: 1.2,
        ...style,
      }}
    >
      {chars.map((char, i) => {
        const restingWeight = reduceMotion ? midpoint : low;
        const variationSequence = [
          `"wght" ${low}`,
          `"wght" ${high}`,
          `"wght" ${low}`,
        ];

        return (
          <motion.span
            aria-hidden="true"
            key={`${char}-${i}`}
            initial={false}
            animate={
              reduceMotion
                ? {
                    fontWeight: restingWeight,
                    fontVariationSettings: `"wght" ${restingWeight}`,
                  }
                : {
                    fontWeight: [low, high, low],
                    fontVariationSettings: variationSequence,
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: safeDuration,
                    delay: i * safeDelay,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: easing,
                  }
            }
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              color,
              fontWeight: restingWeight,
              fontVariationSettings: `"wght" ${restingWeight}`,
              willChange: reduceMotion ? undefined : 'font-weight, font-variation-settings',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        );
      })}
    </span>
  );
}
