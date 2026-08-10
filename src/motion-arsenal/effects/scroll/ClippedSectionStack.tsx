import { useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';

export interface ClippedSectionStackProps {
  sections?: string[];
  /** Panels als ein String mit | als Trenner — die Form, die das Control-Panel
   *  liefert. Ohne diesen Weg blieb der Regler "Panels" wirkungslos, weil er
   *  einen Text schickt, die Komponente aber nur ein Array kannte. */
  panels?: string;
  accent?: string;
  depth?: number;
}

export default function ClippedSectionStack({ sections, panels, accent = '#d4a24a', depth = .6 }: ClippedSectionStackProps) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useMemo(() => {
    if (sections?.length) return sections;
    const fromPanels = panels?.split('|').map((entry) => entry.trim()).filter(Boolean);
    return fromPanels?.length ? fromPanels : ['ORIGIN', 'SIGNAL', 'MOTION', 'FORGE'];
  }, [sections, panels]);
  const items = useMemo(() => labels.slice(0, 8).map((label, index) => ({ label, index, rotate: (index % 2 ? -1 : 1) * (2 + index * .45) })), [labels]);
  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const box = host.current?.getBoundingClientRect(); if (!box) return;
    host.current!.style.setProperty('--stack-x', `${((event.clientX - box.left) / box.width - .5) * depth * 16}px`);
  };
  const style = { '--stack-accent': accent, '--stack-depth': depth } as CSSProperties;
  return <section ref={host} className="nox-clipped-stack" style={style} onMouseMove={onMove} aria-label="Clipped section stack">
    <div className="nox-clipped-stack__sticky"><span className="nox-clipped-stack__eyebrow">SCROLL / STACKED SECTIONS</span>
      <div className="nox-clipped-stack__panels">{items.map((item) => <article key={`${item.label}-${item.index}`} style={{ '--stack-i': item.index, '--stack-rotate': `${item.rotate}deg` } as CSSProperties}><small>0{item.index + 1}</small><h2>{item.label}</h2><em>CLIP PATH // ACTIVE</em></article>)}</div>
    </div><style>{CSS}</style>
  </section>;
}

const CSS = `
.nox-clipped-stack{min-height:240vh;background:#08090d;color:#f7e8a4;font:600 11px ui-monospace,monospace;letter-spacing:.1em}.nox-clipped-stack__sticky{position:sticky;top:8vh;min-height:84vh;padding:5vh 7vw;overflow:hidden}.nox-clipped-stack__eyebrow{color:var(--stack-accent);opacity:.7}.nox-clipped-stack__panels{position:relative;height:70vh;margin-top:4vh;perspective:900px}.nox-clipped-stack article{position:absolute;inset:calc(var(--stack-i) * 4%) calc(var(--stack-i) * 2%);display:grid;align-content:center;padding:clamp(20px,6vw,80px);background:linear-gradient(120deg,#17151aee,#0c0d12ee);border:1px solid #d4a24a88;clip-path:inset(calc(var(--stack-i) * 2%) 0 0 round 18px);transform:translate3d(var(--stack-x,0),calc(var(--stack-i) * 12px),calc(var(--stack-i) * -20px)) rotate(var(--stack-rotate));transform-origin:center;transition:transform .6s cubic-bezier(.2,.8,.2,1),clip-path .6s;box-shadow:0 20px 70px #0009}.nox-clipped-stack article:nth-child(2n){background:linear-gradient(120deg,#20202aee,#0d0e12ee)}.nox-clipped-stack article small,.nox-clipped-stack article em{color:var(--stack-accent);font-style:normal}.nox-clipped-stack h2{font:800 clamp(42px,10vw,130px/1) Arial,sans-serif;letter-spacing:-.08em;margin:16px 0}.nox-clipped-stack article:hover{clip-path:inset(0 round 18px);transform:translate3d(var(--stack-x,0),-8px,40px) rotate(0deg)}@media(prefers-reduced-motion:reduce){.nox-clipped-stack{min-height:auto}.nox-clipped-stack article{transform:none;clip-path:none;position:relative;inset:auto;margin:8px 0}.nox-clipped-stack__panels{height:auto}}`;
