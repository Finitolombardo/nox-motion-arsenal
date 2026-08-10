import { useState, type CSSProperties } from 'react';
export interface CubeSpinRouteTransitionProps { labels?: string[]; duration?: number; color?: string; }
export default function CubeSpinRouteTransition({ labels = ['ORIGIN', 'SIGNAL', 'MOTION'], duration = .8, color = '#d4a24a' }: CubeSpinRouteTransitionProps) {
  const [index, setIndex] = useState(0); const next = () => setIndex(v => (v + 1) % labels.length);
  return <div className="nox-cube-route" style={{ '--cube-speed': `${duration}s`, '--cube-color': color } as CSSProperties}>
    <button className="nox-cube-route__stage" onClick={next} aria-label="Next route"><span>{labels[index]}</span><i aria-hidden="true">↗</i></button>
    <div className="nox-cube-route__dots">{labels.map((label, i) => <button key={label} aria-label={`Show ${label}`} aria-pressed={i === index} onClick={() => setIndex(i)} />)}</div>
    <style>{`.nox-cube-route{display:grid;gap:18px;justify-items:center;padding:28px;background:#090807;color:var(--cube-color);perspective:900px}.nox-cube-route__stage{min-width:220px;min-height:130px;border:1px solid var(--cube-color);background:linear-gradient(135deg,#20170d,#080808);color:inherit;font:800 1.4rem ui-monospace;letter-spacing:.16em;cursor:pointer;transform-style:preserve-3d;box-shadow:0 0 25px color-mix(in srgb,var(--cube-color),transparent 78%)}.nox-cube-route__stage:active{animation:cube-spin var(--cube-speed) cubic-bezier(.2,.8,.2,1)}.nox-cube-route__stage i{display:block;margin:18px auto 0;font-style:normal}.nox-cube-route__dots{display:flex;gap:8px}.nox-cube-route__dots button{width:8px;height:8px;border:1px solid var(--cube-color);border-radius:50%;background:transparent}.nox-cube-route__dots button[aria-pressed=true]{background:var(--cube-color);box-shadow:0 0 10px var(--cube-color)}@keyframes cube-spin{50%{transform:rotateY(90deg) translateZ(30px)}100%{transform:none}}@media(prefers-reduced-motion:reduce){.nox-cube-route__stage:active{animation:none}}`}</style>
  </div>;
}
