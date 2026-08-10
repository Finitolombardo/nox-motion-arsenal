import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

export interface ContextAwareFixedEmblemProps { label?: string; accent?: string; collisionSelector?: string; }

export default function ContextAwareFixedEmblem({ label = 'N', accent = '#d4a24a', collisionSelector = 'section' }: ContextAwareFixedEmblemProps) {
  const emblem = useRef<HTMLButtonElement>(null);
  const [mode, setMode] = useState<'idle' | 'shrink' | 'away'>('idle');
  useEffect(() => {
    const check = () => { const node = emblem.current; if (!node) return; const box = node.getBoundingClientRect(); const targets = Array.from(document.querySelectorAll<HTMLElement>(collisionSelector)); const collision = targets.some((target) => { if (target === node || !target.getBoundingClientRect) return false; const r = target.getBoundingClientRect(); return r.bottom > box.top + 10 && r.top < box.bottom - 10 && r.right > box.left && r.left < box.right; }); setMode(collision ? 'shrink' : window.scrollY > 600 ? 'away' : 'idle'); };
    const intersection = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) setMode('shrink'); else check(); }, { threshold: .2 });
    targetsForObserver().forEach((target) => intersection.observe(target));
    check(); window.addEventListener('scroll', check, { passive: true }); window.addEventListener('resize', check); return () => { intersection.disconnect(); window.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
    function targetsForObserver() { return Array.from(document.querySelectorAll<HTMLElement>(collisionSelector)); }
  }, [collisionSelector]);
  const style = { '--emblem-accent': accent } as CSSProperties;
  return <button ref={emblem} type="button" className={`nox-fixed-emblem nox-fixed-emblem--${mode}`} style={style} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><span>{label}</span><i aria-hidden="true" /><small>NOX</small><style>{CSS}</style></button>;
}

const CSS = `
.nox-fixed-emblem{position:fixed;z-index:30;right:clamp(16px,4vw,54px);bottom:clamp(18px,5vw,60px);width:58px;height:58px;border:1px solid var(--emblem-accent);border-radius:50%;background:#0a0b0fd9;color:#f7e8a4;cursor:pointer;display:grid;place-items:center;box-shadow:0 0 0 7px #d4a24a12,0 0 25px #d4a24a22;transition:transform .55s cubic-bezier(.2,.8,.2,1),filter .55s,opacity .55s}.nox-fixed-emblem:focus-visible{outline:2px solid #f7e8a4;outline-offset:5px}.nox-fixed-emblem span{font:900 24px Arial;position:relative;z-index:1}.nox-fixed-emblem i{position:absolute;inset:8px;border:1px dashed var(--emblem-accent);border-radius:50%;animation:noxEmblemSpin 8s linear infinite}.nox-fixed-emblem small{position:absolute;bottom:-18px;font:8px ui-monospace,monospace;letter-spacing:.2em;color:var(--emblem-accent)}.nox-fixed-emblem--shrink{transform:scale(.58) rotate(-18deg);filter:blur(.3px)}.nox-fixed-emblem--away{transform:translateY(80px) rotate(12deg);opacity:.18}.nox-fixed-emblem:hover{transform:scale(1.08) rotate(0);opacity:1}@keyframes noxEmblemSpin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.nox-fixed-emblem{transition:none}.nox-fixed-emblem i{animation:none}}`;
