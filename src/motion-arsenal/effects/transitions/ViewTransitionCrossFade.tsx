import { useMemo, useState, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ViewTransitionCrossFade — Dunkelraum-optimierter nativer Crossfade für
// DOM-Zustände: document.startViewTransition() mit Feature-Detect +
// Fallback (direkter State-Switch). Deterministische Zustände aus der
// NOX-Palette; ::view-transition-old/new-Keyframes mit Gold-Touch.
// Reduced Motion: direkter Wechsel ohne Fade.
// ---------------------------------------------------------------------------

export interface ViewTransitionCrossFadeProps {
  /** Zustands-Labels. */
  states?: string[];
  /** Deterministischer Seed. */
  seed?: number;
}

const DEFAULT_STATES = ['IDLE', 'SIGNAL', 'LOCK', 'DRIFT', 'PULSE'];

export function ViewTransitionCrossFade({
  states = DEFAULT_STATES,
  seed = 20260810,
}: ViewTransitionCrossFadeProps) {
  const [index, setIndex] = useState(0);
  const reduced = usePrefersReducedMotion();

  const rng = useMemo(() => seededRandom(seed), [seed]);
  const hues = useMemo(
    () => Array.from({ length: states.length }, () => Math.floor(rng() * 360)),
    [states.length, rng]
  );

  const go = (next: number) => {
    const target = ((next % states.length) + states.length) % states.length;
    if (target === index) return;
    const supports = typeof document !== 'undefined' && 'startViewTransition' in document;
    if (!supports || reduced) {
      setIndex(target);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).startViewTransition(() => setIndex(target));
  };

  const vars = {
    '--vtc-gold': NOX_COLORS.gold,
    '--vtc-hue': String(hues[index]),
  } as CSSProperties;

  return (
    <div className="vtc-root" style={vars}>
      <div className="vtc-stage" key={index}>
        <div className="vtc-glow" />
        <h2 className="vtc-label">{states[index]}</h2>
        <p className="vtc-sub">
          {String(index + 1).padStart(2, '0')} / {String(states.length).padStart(2, '0')}
        </p>
      </div>
      <div className="vtc-nav">
        <button type="button" className="vtc-btn" onClick={() => go(index - 1)} aria-label="Zurück">←</button>
        <button type="button" className="vtc-btn" onClick={() => go(index + 1)} aria-label="Weiter">→</button>
      </div>
      <style>{`
.vtc-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,hsl(var(--vtc-hue) 28% 9%),#06080c)}
.vtc-stage{position:relative;width:min(84%,480px);aspect-ratio:16/9;display:grid;
  place-items:center;border:1px solid color-mix(in srgb,var(--vtc-gold) 24%,transparent);
  border-radius:14px;background:rgba(6,8,12,.55);overflow:hidden;
  box-shadow:0 22px 70px rgba(0,0,0,.5)}
.vtc-glow{position:absolute;width:60%;aspect-ratio:1;border-radius:50%;
  background:radial-gradient(circle,hsl(var(--vtc-hue) 70% 45% / .3),transparent 70%)}
.vtc-label{position:relative;color:#fff;font:800 34px/1 ui-monospace,monospace;
  letter-spacing:.2em;text-shadow:0 0 30px color-mix(in srgb,var(--vtc-gold) 55%,transparent);
  margin:0}
.vtc-sub{position:absolute;bottom:14px;right:18px;color:#8a8578;
  font:600 10px/1 ui-monospace,monospace;letter-spacing:.2em;margin:0}
.vtc-nav{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);
  display:flex;gap:10px}
.vtc-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.16);
  color:var(--vtc-gold);font:700 14px/1 ui-monospace,monospace;width:36px;height:36px;
  border-radius:8px;cursor:pointer;transition:border-color .2s}
.vtc-btn:hover{border-color:var(--vtc-gold)}
::view-transition-old(vtc-stage){animation:vtc-out .35s ease-in forwards}
::view-transition-new(vtc-stage){animation:vtc-in .45s cubic-bezier(.2,.9,.3,1.1) forwards}
@keyframes vtc-out{to{opacity:0;transform:scale(.96) translateY(-6px)}}
@keyframes vtc-in{from{opacity:0;transform:scale(1.04) translateY(8px)}}
@media (prefers-reduced-motion:reduce){
  ::view-transition-old(vtc-stage),::view-transition-new(vtc-stage){animation:none}
}
`}</style>
    </div>
  );
}

export default ViewTransitionCrossFade;
