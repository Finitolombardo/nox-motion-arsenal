import { useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';

export interface ContainerScrollSplitTextProps { text?: string; accent?: string; intensity?: number; }

export default function ContainerScrollSplitText({ text = 'SCROLL INTO THE SIGNAL', accent = '#d4a24a', intensity = .7 }: ContainerScrollSplitTextProps) {
  const host = useRef<HTMLDivElement>(null);
  const words = useMemo(() => text.trim().split(/\s+/).map((word, index) => ({ word, index })), [text]);
  const update = (event: React.UIEvent<HTMLDivElement>) => { const el = event.currentTarget; const progress = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight); el.style.setProperty('--split-progress', String(progress)); };
  const style = { '--split-accent': accent, '--split-intensity': intensity } as CSSProperties;
  return <div ref={host} className="nox-container-split" style={style} onScroll={update} tabIndex={0} aria-label="Container scroll split text">
    <div className="nox-container-split__track"><span className="nox-container-split__label">CONTAINER // SCRUB</span><h2>{words.map(({ word, index }) => <span key={`${word}-${index}`} style={{ '--word-index': index } as CSSProperties}>{word}</span>)}</h2><div className="nox-container-split__meter"><i /></div><p>Scroll inside this panel. Each word rises from its own depth plane and resolves into a single gold sentence.</p></div><style>{CSS}</style>
  </div>;
}

const CSS = `
.nox-container-split{height:360px;overflow:auto;scroll-snap-type:y proximity;background:#0b0c10;border:1px solid #49371e;color:#c4b994;font:500 13px/1.7 ui-monospace,monospace;scrollbar-color:#d4a24a #111217}.nox-container-split:focus-visible{outline:2px solid var(--split-accent);outline-offset:4px}.nox-container-split__track{min-height:780px;padding:12% 9%;display:flex;flex-direction:column;justify-content:center}.nox-container-split__label{color:var(--split-accent);letter-spacing:.15em;font-size:10px}.nox-container-split h2{display:flex;flex-wrap:wrap;gap:.18em;margin:30px 0;font:900 clamp(36px,8vw,88px)/.9 Arial,sans-serif;letter-spacing:-.08em;color:#f7e8a4;perspective:600px}.nox-container-split h2 span{display:inline-block;opacity:calc(.18 + var(--split-progress,0) * 1.1);transform:translate3d(0,calc((1 - var(--split-progress,0)) * (70px + var(--word-index) * 8px)),calc((1 - var(--split-progress,0)) * -120px)) rotateX(calc((1 - var(--split-progress,0)) * 34deg));transition:transform .12s linear,opacity .12s linear}.nox-container-split__meter{height:2px;background:#ffffff18}.nox-container-split__meter i{display:block;width:100%;height:100%;background:var(--split-accent);transform-origin:left;transform:scaleX(var(--split-progress,0));box-shadow:0 0 12px var(--split-accent)}.nox-container-split p{max-width:42ch;color:#aaa18a}.nox-container-split__track:after{content:'01 — 04';margin-top:auto;color:#d4a24a88;font-size:10px}@media(prefers-reduced-motion:reduce){.nox-container-split{height:auto;overflow:visible}.nox-container-split__track{min-height:0}.nox-container-split h2 span{opacity:1;transform:none}}`;
