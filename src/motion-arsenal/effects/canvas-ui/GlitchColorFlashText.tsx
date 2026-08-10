import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';

export interface GlitchColorFlashTextProps {
  text?: string; trigger?: 'once' | 'loop' | 'hover'; slices?: number; intensity?: number; color?: string;
}

export default function GlitchColorFlashText({ text = 'SIGNAL LOST', trigger = 'loop', slices = 14, intensity = .5, color = '#d4a24a' }: GlitchColorFlashTextProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(trigger === 'loop');
  const seed = useMemo(() => seededRandom(text.length * 37 + slices), [text.length, slices]);
  useEffect(() => { if (trigger === 'once' && !reduced) setActive(true); }, [trigger, reduced]);
  useEffect(() => {
    const el = canvas.current; if (!el) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); const box = el.getBoundingClientRect();
    el.width = Math.max(1, box.width * dpr); el.height = Math.max(1, box.height * dpr);
    const ctx = el.getContext('2d'); if (!ctx) return; ctx.scale(dpr, dpr);
    const w = box.width, h = box.height, off = document.createElement('canvas'); off.width = w * dpr; off.height = h * dpr;
    const oc = off.getContext('2d'); if (!oc) return; oc.scale(dpr, dpr); oc.font = `800 ${Math.min(72, w / Math.max(text.length * .56, 1))}px ui-monospace`;
    oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.fillStyle = color; oc.fillText(text, w / 2, h / 2);
    let raf = 0; let started = performance.now(); const draw = (now: number) => {
      const elapsed = (now - started) / 1000; const playing = active && !reduced;
      ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.drawImage(off, 0, 0, w, h);
      if (playing) {
        const burst = trigger === 'loop' ? (Math.sin(elapsed * 5.4) ** 18) : Math.max(0, 1 - elapsed * 1.7);
        for (let i = 0; i < clamp(Math.round(slices), 4, 40); i++) { const y = (seed() * h + elapsed * 31) % h; const sh = 3 + seed() * h * .12; const dx = (seed() - .5) * intensity * 34 * (1 + burst);
          ctx.globalAlpha = .5 + seed() * .45; ctx.globalCompositeOperation = i % 2 ? 'screen' : 'source-over'; ctx.drawImage(off, 0, y, w, sh, dx, y, w, sh);
          ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .18; ctx.fillStyle = i % 2 ? '#26d9ff' : '#ff3d76'; ctx.fillRect(dx + (i % 3) * 3, y, w, sh);
        }
        if (burst > .6) { ctx.globalAlpha = (burst - .6) * .35; ctx.fillStyle = color; ctx.fillRect(0, 0, w, h); }
      }
      if (playing || trigger === 'loop') raf = requestAnimationFrame(draw);
    }; draw(performance.now()); return () => cancelAnimationFrame(raf);
  }, [active, color, intensity, reduced, seed, slices, text, trigger]);
  return <button type="button" className="nox-glitch-text" onMouseEnter={() => trigger === 'hover' && setActive(true)} onFocus={() => trigger === 'hover' && setActive(true)} onClick={() => trigger !== 'loop' && setActive(true)} style={{ '--glitch-color': color } as CSSProperties} aria-label={text}><canvas ref={canvas} aria-hidden="true" /><span>{text}</span><style>{`.nox-glitch-text{position:relative;display:inline-grid;padding:1.2rem;border:1px solid color-mix(in srgb,var(--glitch-color) 35%,transparent);background:#0b0c10;color:var(--glitch-color);cursor:pointer}.nox-glitch-text canvas,.nox-glitch-text span{grid-area:1/1}.nox-glitch-text span{visibility:hidden;font:800 clamp(1.5rem,6vw,4rem)/1 ui-monospace}.nox-glitch-text canvas{width:100%;height:100%;min-width:14rem;min-height:4rem}.nox-glitch-text:focus-visible{outline:2px solid var(--glitch-color);outline-offset:5px}`}</style></button>;
}
