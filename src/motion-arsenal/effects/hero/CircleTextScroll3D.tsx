import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';

export interface CircleTextScroll3DProps { words?: string[]; speed?: number; radius?: number; distortion?: number; color?: string; }
const det = (i: number, salt: number) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); };

export default function CircleTextScroll3D({ words = ['NOX', 'MOTION', 'ARSENAL', 'SIGNAL'], speed = 1, radius = 4, distortion = .5, color = '#d4a24a' }: CircleTextScroll3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const safeWords = useMemo(() => words.filter(Boolean).slice(0, 12), [words]);
  const slots = useMemo(() => safeWords.map((word, i) => ({ word, jitter: (det(i, 7) - .5) * 12 })), [safeWords]);
  useEffect(() => { if (reduced) return; let frame = 0; const update = () => { const el = host.current; if (!el) return; const r = el.getBoundingClientRect(); setScroll(Math.max(-1, Math.min(1, (innerHeight * .5 - (r.top + r.height * .5)) / (r.height * .9)))); frame = requestAnimationFrame(update); }; frame = requestAnimationFrame(update); return () => cancelAnimationFrame(frame); }, [reduced]);
  const rotation = reduced ? 0 : scroll * speed * 34;
  const style = { '--cts-color': color, '--cts-radius': `${Math.max(2, Math.min(8, radius))}rem`, '--cts-distortion': distortion } as React.CSSProperties;
  return <section ref={host} className="nox-cts" style={style} aria-label="3D circle text scroll"><style>{CSS}</style><div className="nox-cts__halo" /><div className="nox-cts__ring" style={{ transform: `rotateX(62deg) rotateZ(${rotation}deg)` }}>{slots.map((slot, i) => { const angle = (i / Math.max(1, slots.length)) * 360 + slot.jitter + rotation; return <span key={`${slot.word}-${i}`} className="nox-cts__word" style={{ transform: `rotate(${angle}deg) translateY(calc(var(--cts-radius) * -1)) rotate(${-angle}deg)`, opacity: .42 + Math.abs(Math.cos(angle * Math.PI / 180)) * .58 }}>{slot.word}</span>; })}</div><strong className="nox-cts__center">SCROLL / SPACE</strong></section>;
}
const CSS = String.raw`.nox-cts{position:relative;display:grid;place-items:center;min-height:300px;overflow:hidden;background:#090a0e;color:var(--cts-color);perspective:900px;font-family:var(--sans,system-ui,sans-serif)}.nox-cts__ring{position:relative;width:0;height:0;transform-style:preserve-3d;transition:transform .1s linear}.nox-cts__word{position:absolute;left:-4rem;top:-.7rem;width:8rem;text-align:center;font-size:clamp(13px,2vw,21px);font-weight:800;letter-spacing:.16em;text-shadow:0 0 18px color-mix(in srgb,var(--cts-color),transparent 45%);white-space:nowrap;will-change:transform,opacity}.nox-cts__halo{position:absolute;width:70%;aspect-ratio:1;border:1px solid color-mix(in srgb,var(--cts-color),transparent 55%);border-radius:50%;box-shadow:0 0 90px color-mix(in srgb,var(--cts-color),transparent 75%),inset 0 0 60px color-mix(in srgb,var(--cts-color),transparent 86%)}.nox-cts__center{position:absolute;bottom:20px;font:10px var(--mono,monospace);letter-spacing:.24em;opacity:.45}@media(prefers-reduced-motion:reduce){.nox-cts__word{transition:none!important}}`;
