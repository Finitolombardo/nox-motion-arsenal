import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';


export type VariableWeightTrigger = 'auto' | 'hover';
export type VariableWeightRhythm = 'breathe' | 'wave' | 'pulse';
export type VariableWeightDirection = 'forward' | 'reverse' | 'center';
export type VariableWeightHoverScope = 'group' | 'character';
export type VariableWeightPresetId = 'beauty' | 'fitness' | 'saas' | 'ecommerce' | 'luxury' | 'creator';


export interface VariableWeightTextProps {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  minWeight?: number;
  maxWeight?: number;
  duration?: number;
  stagger?: number;
  easing?: 'easeOut' | 'easeIn' | 'easeInOut' | 'linear';
  trigger?: VariableWeightTrigger;
  rhythm?: VariableWeightRhythm;
  direction?: VariableWeightDirection;
  hoverScope?: VariableWeightHoverScope;
  scale?: number;
  lift?: number;
  tracking?: number;
  preset?: VariableWeightPresetId;
  style?: React.CSSProperties;
}


export const VARIABLE_WEIGHT_PRESETS: Record<VariableWeightPresetId, Partial<VariableWeightTextProps>> = {
  beauty: { trigger: 'auto', rhythm: 'breathe', minWeight: 250, maxWeight: 620, duration: 3.2, stagger: .07, scale: 1.015, lift: 1, tracking: .01 },
  fitness: { trigger: 'hover', hoverScope: 'group', rhythm: 'pulse', minWeight: 350, maxWeight: 900, duration: .28, stagger: .018, scale: 1.045, lift: 2 },
  saas: { trigger: 'hover', hoverScope: 'group', rhythm: 'wave', minWeight: 350, maxWeight: 720, duration: .34, stagger: .022, scale: 1.015, lift: 1 },
  ecommerce: { trigger: 'hover', hoverScope: 'group', rhythm: 'pulse', minWeight: 400, maxWeight: 800, duration: .3, stagger: .018, scale: 1.025 },
  luxury: { trigger: 'auto', rhythm: 'breathe', minWeight: 260, maxWeight: 560, duration: 4.2, stagger: .11, scale: 1.008, lift: .5, tracking: .025 },
  creator: { trigger: 'auto', rhythm: 'wave', minWeight: 220, maxWeight: 850, duration: 2.2, stagger: .09, scale: 1.03, lift: 2, direction: 'center' },
};


const DEFAULTS: Required<Omit<VariableWeightTextProps, 'preset' | 'style'>> = {
  text: 'VARIABLE', color: '#ffffff', fontSize: 64, fontFamily: 'Inter, sans-serif',
  minWeight: 250, maxWeight: 850, duration: 1.8, stagger: .06, easing: 'easeInOut',
  trigger: 'auto', rhythm: 'wave', direction: 'forward', hoverScope: 'group',
  scale: 1.02, lift: 1, tracking: 0,
};


function charOrder(index: number, count: number, direction: VariableWeightDirection) {
  if (direction === 'reverse') return count - 1 - index;
  if (direction === 'center') return Math.abs(index - (count - 1) / 2);
  return index;
}


export function VariableWeightText(input: VariableWeightTextProps = {}) {
  const reduced = useReducedMotion();
  const preset = input.preset ? VARIABLE_WEIGHT_PRESETS[input.preset] ?? {} : {};
  const p = { ...DEFAULTS, ...preset, ...input };
  const chars = useMemo(() => Array.from(p.text), [p.text]);
  const [groupHovered, setGroupHovered] = useState(false);
  const minWeight = Math.max(100, Math.min(900, p.minWeight));
  const maxWeight = Math.max(minWeight, Math.min(900, p.maxWeight));
  const staticWeight = p.trigger === 'hover' ? minWeight : Math.round((minWeight + maxWeight) / 2);


  return (
    <span
      data-variable-weight-trigger={p.trigger}
      data-variable-weight-rhythm={p.rhythm}
      onPointerEnter={p.trigger === 'hover' && p.hoverScope === 'group' ? () => setGroupHovered(true) : undefined}
      onPointerLeave={p.trigger === 'hover' && p.hoverScope === 'group' ? () => setGroupHovered(false) : undefined}
      style={{
        display: 'inline-flex', flexWrap: 'wrap', fontSize: p.fontSize, fontFamily: p.fontFamily,
        lineHeight: 1.12, letterSpacing: `${p.tracking}em`, cursor: p.trigger === 'hover' ? 'pointer' : undefined,
        ...input.style,
      }}
    >
      {chars.map((char, i) => {
        const order = charOrder(i, chars.length, p.direction);
        const delay = order * p.stagger;
        const target = { fontWeight: maxWeight, scale: p.scale, y: -p.lift, color: p.color };
        const base = { fontWeight: minWeight, scale: 1, y: 0, color: p.color };


        if (reduced) {
          return <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', color: p.color, fontWeight: staticWeight }}>{char === ' ' ? '\u00A0' : char}</span>;
        }


        if (p.trigger === 'auto') {
          const weightFrames = p.rhythm === 'pulse'
            ? [minWeight, maxWeight, maxWeight, minWeight]
            : [minWeight, maxWeight, minWeight];
          const scaleFrames = [1, p.scale, 1];
          const yFrames = p.rhythm === 'wave' ? [0, -p.lift, 0] : [0, 0, 0];
          return (
            <motion.span key={i}
              animate={{ fontWeight: weightFrames, scale: scaleFrames, y: yFrames, color: p.color }}
              transition={{ duration: p.duration, delay, repeat: Infinity, ease: p.easing }}
              style={{ display: 'inline-block', whiteSpace: 'pre', willChange: 'transform' }}
            >{char === ' ' ? '\u00A0' : char}</motion.span>
          );
        }


        const transition = {
          fontWeight: { duration: p.duration, delay, ease: p.easing as any },
          scale: { duration: p.duration * 1.15, delay },
          y: { duration: p.duration, delay },
        };
        if (p.hoverScope === 'character') {
          return (
            <motion.span key={i} initial={base} animate={base} whileHover={target} transition={transition}
              style={{ display: 'inline-block', whiteSpace: 'pre' }}
            >{char === ' ' ? '\u00A0' : char}</motion.span>
          );
        }
        return (
          <motion.span key={i} initial={false} animate={groupHovered ? target : base} transition={transition}
            style={{ display: 'inline-block', whiteSpace: 'pre' }}
          >{char === ' ' ? '\u00A0' : char}</motion.span>
        );
      })}
    </span>
  );
}


export default VariableWeightText;
