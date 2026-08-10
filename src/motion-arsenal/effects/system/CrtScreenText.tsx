import { useState, type CSSProperties } from 'react';

export interface CrtScreenTextProps { text?: string; flicker?: boolean; scanlines?: boolean; color?: string; }

export default function CrtScreenText({ text = 'SIGNAL LOCKED', flicker = true, scanlines = true, color = '#d4a24a' }: CrtScreenTextProps) {
  const [active, setActive] = useState(false);
  const style = { '--crt-color': color } as CSSProperties;
  return <button className={`nox-crt ${active ? 'is-active' : ''}`} style={style} onClick={() => setActive(v => !v)} aria-pressed={active}>
    <span className="nox-crt__screen" aria-label={text}><span className="nox-crt__glow">{text}</span><span className="nox-crt__ghost" aria-hidden="true">{text}</span></span>
    {scanlines && <span className="nox-crt__scan" aria-hidden="true" />}
    <style>{`.nox-crt{position:relative;display:block;width:min(100%,520px);padding:32px 24px;border:1px solid color-mix(in srgb,var(--crt-color),transparent 45%);border-radius:16px;background:#080807;color:var(--crt-color);cursor:pointer;overflow:hidden;text-align:left;box-shadow:inset 0 0 32px #000,0 0 22px color-mix(in srgb,var(--crt-color),transparent 82%)}.nox-crt__screen{position:relative;display:block;font:700 clamp(1.2rem,5vw,3rem)/1.1 ui-monospace,monospace;letter-spacing:.12em;text-shadow:0 0 8px var(--crt-color),0 0 25px var(--crt-color)}.nox-crt__ghost{position:absolute;inset:0;color:#e65e5e;opacity:.3;transform:translateX(2px);mix-blend-mode:screen}.nox-crt__scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 3px,#fff1 4px 5px);pointer-events:none;animation:crt-scan 5s linear infinite}.nox-crt.is-active .nox-crt__screen{animation:crt-jump .42s steps(3) both}.nox-crt:focus-visible{outline:2px solid var(--crt-color);outline-offset:4px}@keyframes crt-scan{to{transform:translateY(8px)}}@keyframes crt-jump{20%{transform:translateX(-3px) skewX(2deg)}55%{transform:translateX(3px)}100%{transform:none}}@media(prefers-reduced-motion:reduce){.nox-crt__scan{animation:none}.nox-crt.is-active .nox-crt__screen{animation:none}}`}</style>
  </button>;
}
