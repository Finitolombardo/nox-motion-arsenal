import { useMemo, type CSSProperties } from 'react';
import { clamp, seededRandom } from '../../lib/animationUtils';

export interface AuroraBeamDriftProps { beams?: number; speed?: number; saturation?: number; color?: string; seed?: number; }

export default function AuroraBeamDrift({ beams = 3, speed = 1, saturation = .5, color = '#d4a24a', seed = 42 }: AuroraBeamDriftProps) {
  const count = clamp(Math.round(beams), 2, 6);
  const rate = clamp(speed, .1, 3);
  const vivid = clamp(saturation, 0, 1);
  const rnd = useMemo(() => seededRandom(seed), [seed]);
  const fields = useMemo(() => Array.from({ length: count }, (_, i) => ({
    i, x: 12 + rnd() * 76, y: 25 + rnd() * 50, angle: -28 + rnd() * 56,
    width: 24 + rnd() * 24, duration: (18 + rnd() * 12) / rate, delay: -rnd() * 8,
    opacity: .22 + vivid * (.2 + rnd() * .2),
  })), [count, rnd, vivid, rate]);
  return <div className="nox-aurora" style={{ '--aurora-color': color } as CSSProperties} aria-hidden="true">
    <div className="nox-aurora__wash" />
    {fields.map((beam) => <span key={beam.i} className="nox-aurora__beam" style={{ '--x': `${beam.x}%`, '--y': `${beam.y}%`, '--angle': `${beam.angle}deg`, '--width': `${beam.width}%`, '--duration': `${beam.duration}s`, '--delay': `${beam.delay}s`, '--opacity': beam.opacity } as CSSProperties} />)}
    <style>{CSS}</style>
  </div>;
}

const CSS = `.nox-aurora{position:relative;isolation:isolate;overflow:hidden;min-height:220px;background:#090a0e}.nox-aurora__wash{position:absolute;inset:-30%;background:radial-gradient(ellipse at center,#d4a24a1f,transparent 56%);filter:blur(42px);z-index:-1}.nox-aurora__beam{position:absolute;left:var(--x);top:var(--y);width:var(--width);height:180%;transform:translate(-50%,-50%) rotate(var(--angle));border-radius:50%;background:radial-gradient(ellipse at center,color-mix(in srgb,var(--aurora-color) 72%,white) 0%,color-mix(in srgb,var(--aurora-color) 32%,transparent) 34%,transparent 72%);opacity:var(--opacity);filter:blur(34px);mix-blend-mode:screen;animation:aurora-drift var(--duration) ease-in-out var(--delay) infinite alternate;will-change:transform}@keyframes aurora-drift{0%{translate:-8% -4%;rotate:-8deg}100%{translate:12% 7%;rotate:12deg}}@media(prefers-reduced-motion:reduce){.nox-aurora__beam{animation:none}}`;
