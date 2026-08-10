import { useMemo, useState, type CSSProperties } from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// StepFlowWizard — mehrstufiges Formular als Gold-Wizard: Fortschrittslinie
// zeichnet sich per scaleX (Compositor), Connector-Kreise füllen sich mit
// Feder-Easing, Panel-Wechsel als translateX/opacity. Zustände via
// data-state=done|active|todo, Zustand in React-State (kein Router).
// Deterministische Schritte aus den Props; Check-Icons für erledigte Steps.
// Reduced Motion: Panel-Wechsel ohne Sliden.
// ---------------------------------------------------------------------------

export interface StepFlowWizardProps {
  /** Schritttitel. */
  steps?: string[];
  /** Panel-Inhalte (ein Element pro Schritt). */
  panels?: React.ReactNode[];
  /** Deterministischer Seed (nur für Stagger-Details). */
  seed?: number;
}

export function StepFlowWizard({
  steps = ['CONFIG', 'SIGNAL', 'VERIFY'],
  panels,
  seed = 20260810,
}: StepFlowWizardProps) {
  const [current, setCurrent] = useState(0);
  const reduced = usePrefersReducedMotion();
  const safeSteps = clamp(steps.length, 2, 8);

  const state = (i: number): 'done' | 'active' | 'todo' =>
    i < current ? 'done' : i === current ? 'active' : 'todo';

  const progress = safeSteps > 1 ? current / (safeSteps - 1) : 1;

  const vars = {
    '--sfw-gold': NOX_COLORS.gold,
    '--sfw-progress': `${progress * 100}%`,
  } as CSSProperties;

  return (
    <div className="sfw-root" style={vars}>
      <ol className="sfw-track">
        {steps.slice(0, safeSteps).map((s, i) => (
          <li
            key={i}
            className="sfw-step"
            data-state={state(i)}
            style={{ transitionDelay: reduced ? '0s' : `${i * 0.04}s` }}
          >
            <span className="sfw-dot">
              {state(i) === 'done' ? '✓' : i + 1}
            </span>
            <span className="sfw-label">{s}</span>
          </li>
        ))}
      </ol>
      <div className="sfw-line">
        <span className="sfw-fill" />
      </div>
      <div className="sfw-panel" key={current}>
        {panels?.[current] ?? (
          <p className="sfw-placeholder">
            STEP {String(current + 1).padStart(2, '0')} / {String(safeSteps).padStart(2, '0')}
          </p>
        )}
      </div>
      <div className="sfw-nav">
        <button
          type="button"
          className="sfw-btn"
          disabled={current === 0}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
        >
          ← BACK
        </button>
        <button
          type="button"
          className="sfw-btn sfw-btn--primary"
          disabled={current >= safeSteps - 1}
          onClick={() => setCurrent((c) => Math.min(safeSteps - 1, c + 1))}
        >
          NEXT →
        </button>
      </div>
      <style>{`
.sfw-root{position:absolute;inset:0;display:flex;flex-direction:column;gap:18px;
  justify-content:center;padding:6%;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.sfw-track{display:flex;justify-content:space-between;list-style:none;margin:0;
  padding:0 6px;position:relative;z-index:1}
.sfw-step{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;
  text-align:center;opacity:.55;transition:opacity .3s}
.sfw-step[data-state=active],.sfw-step[data-state=done]{opacity:1}
.sfw-dot{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;
  font:700 13px/1 ui-monospace,monospace;color:#8a8578;
  background:#0b0e15;border:1px solid rgba(255,255,255,.14);
  transition:background .35s cubic-bezier(.2,.9,.3,1.2),border-color .35s,color .35s}
.sfw-step[data-state=active] .sfw-dot{color:#0a0c10;background:var(--sfw-gold);
  border-color:var(--sfw-gold);box-shadow:0 0 20px color-mix(in srgb,var(--sfw-gold) 45%,transparent)}
.sfw-step[data-state=done] .sfw-dot{color:var(--sfw-gold);border-color:var(--sfw-gold)}
.sfw-label{font:600 10px/1.2 ui-monospace,monospace;letter-spacing:.12em;color:#cfccc2}
.sfw-line{position:relative;height:2px;margin:0 34px;background:rgba(255,255,255,.08);
  border-radius:2px;overflow:hidden}
.sfw-fill{position:absolute;inset:0;transform-origin:left;
  transform:scaleX(calc(var(--sfw-progress) / 100));
  background:linear-gradient(90deg,var(--sfw-gold),color-mix(in srgb,var(--sfw-gold) 55%,#fff));
  transition:transform .5s cubic-bezier(.2,.9,.3,1.12);width:100%}
.sfw-panel{min-height:120px;display:grid;place-items:center;border:1px dashed
  color-mix(in srgb,var(--sfw-gold) 22%,transparent);border-radius:12px;
  background:rgba(255,255,255,.02);padding:18px;
  animation:sfw-panel .38s cubic-bezier(.2,.9,.3,1.1)}
.sfw-placeholder{color:#8a8578;font:600 13px/1.6 ui-monospace,monospace;letter-spacing:.14em}
.sfw-nav{display:flex;justify-content:space-between}
.sfw-btn{background:none;border:1px solid rgba(255,255,255,.16);color:#cfccc2;
  font:600 11px/1 ui-monospace,monospace;letter-spacing:.12em;padding:11px 18px;
  border-radius:8px;cursor:pointer;transition:border-color .25s,color .25s}
.sfw-btn:hover:not(:disabled){border-color:var(--sfw-gold);color:var(--sfw-gold)}
.sfw-btn:disabled{opacity:.35;cursor:default}
.sfw-btn--primary{background:var(--sfw-gold);border-color:var(--sfw-gold);color:#0a0c10}
.sfw-btn--primary:hover:not(:disabled){color:#0a0c10;filter:brightness(1.1)}
@keyframes sfw-panel{from{opacity:0;transform:translateX(14px)}
  to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){
  .sfw-panel{animation:none}
  .sfw-fill{transition:none}
}
`}</style>
    </div>
  );
}

export default StepFlowWizard;
