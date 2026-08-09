import { useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { useInView, usePrefersReducedMotion } from '../../lib/animationUtils';

export type AnswerLockInVariant = 'assessment' | 'command-deck' | 'brand-lock';
export type AnswerLockInOrientation = 'horizontal' | 'vertical';

export interface AnswerLockInProps {
  accentColor?: string;
  lockDuration?: number;
  dimOpacity?: number;
  showEnergyLine?: boolean;
  variant?: AnswerLockInVariant;
  orientation?: AnswerLockInOrientation;
  energyIntensity?: number;
  showProgressRail?: boolean;
  eyebrow?: string;
  question?: string;
  brandMark?: string;
  logoUrl?: string;
  onChange?: (index: number) => void;
  onCommit?: (index: number) => void;
}

const SCALE = [
  { n: '01', label: 'SCHWACH' },
  { n: '02', label: 'GERING' },
  { n: '03', label: 'NEUTRAL' },
  { n: '04', label: 'STARK' },
  { n: '05', label: 'MAXIMAL' },
] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function AnswerLockIn({
  accentColor = NOX_COLORS.red,
  lockDuration = 0.58,
  dimOpacity = 0.28,
  showEnergyLine = true,
  variant = 'command-deck',
  orientation = 'horizontal',
  energyIntensity = 1,
  showProgressRail = true,
  eyebrow = 'SIGNAL CALIBRATION · NODE 03',
  question = 'Wie stark pulst dein SYSTEM-SIGNAL?',
  brandMark = 'NOX // DECISION CORE',
  logoUrl,
  onChange,
  onCommit,
}: AnswerLockInProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const statusId = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const [committed, setCommitted] = useState(false);
  const [lockKey, setLockKey] = useState(0);

  const intensity = clamp(Number.isFinite(energyIntensity) ? energyIntensity : 1, 0.25, 1.5);
  const safeDimOpacity = clamp(Number.isFinite(dimOpacity) ? dimOpacity : 0.28, 0.08, 0.86);
  const safeLockDuration = clamp(Number.isFinite(lockDuration) ? lockDuration : 0.58, 0.2, 1.5);
  const motionActive = inView && !reduced;

  const pick = (index: number) => {
    const next = clamp(index, 0, SCALE.length - 1);
    setSelected(next);
    setCommitted(false);
    setLockKey((key) => key + 1);
    onChange?.(next);
  };

  const moveSelection = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % SCALE.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + SCALE.length) % SCALE.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = SCALE.length - 1;
    if (next === null) return;
    event.preventDefault();
    optionRefs.current[next]?.focus();
    pick(next);
  };

  const commit = () => {
    if (selected === null || committed) return;
    setCommitted(true);
    onCommit?.(selected);
  };

  const selectedCenter = selected === null ? 50 : ((selected + 0.5) / SCALE.length) * 100;
  const selectedProgress = selected === null ? 0 : (selected + 1) / SCALE.length;
  const statusText = selected === null
    ? 'Awaiting calibrated response.'
    : committed
      ? `Signal ${selected + 1} committed.`
      : `Signal ${selected + 1} selected and ready to commit.`;

  const rootStyle = {
    '--ali-accent': accentColor,
    '--ali-intensity': intensity,
    '--ali-dim': safeDimOpacity,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={`ali-root ali-${variant} ali-${orientation}`}
      data-motion={motionActive ? 'true' : 'false'}
      data-committed={committed ? 'true' : 'false'}
      style={rootStyle}
    >
      <style>{`
        @keyframes ali-grid-drift { to { background-position:44px 44px,44px 44px; } }
        @keyframes ali-scan { 0%{transform:translateX(-130%);opacity:0} 18%{opacity:.9} 80%{opacity:.35} 100%{transform:translateX(130%);opacity:0} }
        @keyframes ali-lock { 0%{transform:translateY(0) scale(1)} 24%{transform:translateY(3px) scale(.94)} 58%{transform:translateY(-2px) scale(1.045)} 100%{transform:translateY(0) scale(1.02)} }
        @keyframes ali-trace { from{stroke-dashoffset:1;opacity:.25} to{stroke-dashoffset:0;opacity:1} }
        @keyframes ali-led { 0%{opacity:.15;transform:scale(.35)} 54%{opacity:1;transform:scale(1.8)} 100%{opacity:1;transform:scale(1)} }
        @keyframes ali-node { 0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ali-accent) 55%,transparent)} 50%{box-shadow:0 0 0 7px transparent,0 0 18px var(--ali-accent)} }
        @keyframes ali-flow { to{stroke-dashoffset:-1} }
        @keyframes ali-draw { from{stroke-dashoffset:1;opacity:0} 30%{opacity:1} to{stroke-dashoffset:0;opacity:1} }
        @keyframes ali-commit-pulse { 0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ali-accent) 30%,transparent)} 50%{box-shadow:0 0 24px color-mix(in srgb,var(--ali-accent) 28%,transparent)} }
        .ali-root{position:absolute;inset:0;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:clamp(12px,3vw,34px);color:${NOX_COLORS.text};font-family:system-ui,sans-serif;isolation:isolate;background:radial-gradient(120% 110% at 50% -10%,color-mix(in srgb,var(--ali-accent) 16%,#11121a) 0%,#08090d 55%,#030407 100%)}
        .ali-root::before{content:"";position:absolute;inset:-35%;z-index:-3;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:44px 44px;transform:perspective(700px) rotateX(62deg) translateY(18%);mask-image:radial-gradient(circle at center,#000 0,transparent 70%)}
        .ali-root[data-motion="true"]::before{animation:ali-grid-drift 10s linear infinite}
        .ali-root::after{content:"";position:absolute;inset:0;z-index:8;pointer-events:none;background:radial-gradient(circle at 50% 46%,transparent 28%,rgba(2,3,7,.25) 58%,rgba(2,3,7,.88) 100%)}
        .ali-aura{position:absolute;left:50%;top:50%;width:min(74vw,680px);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;z-index:-2;background:conic-gradient(from 180deg,transparent 0 18%,color-mix(in srgb,var(--ali-accent) 28%,transparent),transparent 44%,rgba(52,211,255,.12),transparent 74%);filter:blur(50px);opacity:calc(.65 * var(--ali-intensity))}
        .ali-scan{position:absolute;inset:0 auto 0 0;width:42%;z-index:-1;pointer-events:none;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--ali-accent) 8%,transparent),rgba(255,255,255,.08),transparent);filter:blur(2px);opacity:0}
        .ali-root[data-motion="true"] .ali-scan{animation:ali-scan 4.8s ease-in-out infinite}
        .ali-shell{position:relative;z-index:2;width:min(100%,920px);padding:clamp(16px,3vw,30px);border:1px solid rgba(255,255,255,.1);border-radius:22px;background:linear-gradient(145deg,rgba(16,17,24,.84),rgba(7,8,12,.66));box-shadow:0 28px 80px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.08),0 0 70px color-mix(in srgb,var(--ali-accent) 8%,transparent);backdrop-filter:blur(18px) saturate(1.2)}
        .ali-header{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:clamp(16px,3vh,26px)}
        .ali-eyebrow{font:600 clamp(8px,1vw,10px)/1 ui-monospace,monospace;letter-spacing:.28em;color:${NOX_COLORS.textDim};text-transform:uppercase}
        .ali-question{margin-top:7px;max-width:640px;font-size:clamp(17px,2.5vw,28px);font-weight:760;letter-spacing:-.025em;line-height:1.08}
        .ali-brand{display:flex;align-items:center;gap:8px;min-width:max-content;font:700 8px/1 ui-monospace,monospace;letter-spacing:.2em;color:color-mix(in srgb,var(--ali-accent) 72%,white)}
        .ali-brand img{width:22px;height:22px;object-fit:contain;filter:drop-shadow(0 0 8px color-mix(in srgb,var(--ali-accent) 45%,transparent))}
        .ali-brand-dot{width:8px;height:8px;border-radius:50%;background:var(--ali-accent);box-shadow:0 0 12px var(--ali-accent)}
        .ali-root[data-motion="true"] .ali-brand-dot{animation:ali-node 1.8s ease-in-out infinite}
        .ali-cards{position:relative;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(7px,1.4vw,14px)}
        .ali-vertical .ali-cards{grid-template-columns:1fr;gap:7px;max-height:58vh;overflow:auto;padding-right:4px}
        .ali-card{position:relative;min-width:0;min-height:clamp(86px,15vh,132px);padding:clamp(12px,2vh,20px) 8px 12px;overflow:hidden;color:inherit;cursor:pointer;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:linear-gradient(155deg,rgba(255,255,255,.065),rgba(255,255,255,.018));box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 12px 30px rgba(0,0,0,.28);transition:opacity .38s ${EASE.outExpo},filter .38s ${EASE.outExpo},transform .38s ${EASE.outExpo},border-color .22s,background .22s,box-shadow .22s;touch-action:manipulation}
        .ali-card:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--ali-accent) 38%,rgba(255,255,255,.12));background:linear-gradient(155deg,color-mix(in srgb,var(--ali-accent) 9%,rgba(255,255,255,.06)),rgba(255,255,255,.02))}
        .ali-card:focus-visible,.ali-cta:focus-visible{outline:2px solid color-mix(in srgb,var(--ali-accent) 75%,white);outline-offset:3px}
        .ali-card[data-selected="true"]{z-index:3;border-color:color-mix(in srgb,var(--ali-accent) 62%,white 8%);background:linear-gradient(155deg,color-mix(in srgb,var(--ali-accent) 22%,#171820),rgba(8,9,14,.92));box-shadow:0 18px 42px rgba(0,0,0,.36),0 0 calc(28px * var(--ali-intensity)) color-mix(in srgb,var(--ali-accent) 28%,transparent),inset 0 0 30px color-mix(in srgb,var(--ali-accent) 8%,transparent)}
        .ali-card[data-committed="true"]{border-color:color-mix(in srgb,#63f5b5 70%,white);box-shadow:0 0 28px rgba(99,245,181,.16),inset 0 0 26px rgba(99,245,181,.06)}
        .ali-index{position:relative;z-index:2;font:800 clamp(20px,3vw,34px)/1 ui-monospace,monospace;letter-spacing:-.06em;color:rgba(245,245,255,.92);transition:color .22s,text-shadow .22s}
        .ali-card[data-selected="true"] .ali-index{color:var(--ali-accent);text-shadow:0 0 20px color-mix(in srgb,var(--ali-accent) 60%,transparent)}
        .ali-label{position:relative;z-index:2;margin-top:8px;font:650 clamp(7px,1vw,9px)/1.2 ui-monospace,monospace;letter-spacing:.16em;color:${NOX_COLORS.textDim}}
        .ali-status{position:absolute;left:8px;right:8px;bottom:8px;display:flex;align-items:center;gap:6px;font:600 7px/1 ui-monospace,monospace;letter-spacing:.12em;color:rgba(255,255,255,.3)}
        .ali-status-line{flex:1;height:1px;background:rgba(255,255,255,.09);overflow:hidden}
        .ali-status-line::after{content:"";display:block;width:var(--ali-load,18%);height:100%;background:var(--ali-accent);box-shadow:0 0 7px var(--ali-accent);transition:width .45s ${EASE.outExpo}}
        .ali-led{position:absolute;top:9px;right:9px;width:7px;height:7px;border-radius:50%;background:#303039;transition:background .2s,box-shadow .2s}
        .ali-card[data-selected="true"] .ali-led{background:var(--ali-accent);box-shadow:0 0 10px 2px color-mix(in srgb,var(--ali-accent) 65%,transparent)}
        .ali-rail{position:relative;height:clamp(38px,7vh,62px);margin:4px 0 0}
        .ali-rail-base{position:absolute;left:2%;right:2%;top:50%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12) 8% 92%,transparent)}
        .ali-rail-fill{height:100%;width:var(--ali-progress);background:linear-gradient(90deg,var(--ali-accent),#72e8ff);box-shadow:0 0 14px color-mix(in srgb,var(--ali-accent) 55%,transparent);transition:width .55s ${EASE.outExpo}}
        .ali-rail-nodes{position:absolute;left:2%;right:2%;top:50%;display:flex;justify-content:space-between;transform:translateY(-50%)}
        .ali-rail-node{width:6px;height:6px;border-radius:50%;background:#303039;border:1px solid rgba(255,255,255,.13);transition:background .25s,box-shadow .25s,transform .25s}
        .ali-rail-node[data-active="true"]{transform:scale(1.35);background:var(--ali-accent);box-shadow:0 0 12px var(--ali-accent)}
        .ali-commit{display:flex;justify-content:space-between;align-items:center;gap:16px}
        .ali-commit-copy{min-width:0;font:600 8px/1.4 ui-monospace,monospace;letter-spacing:.14em;color:${NOX_COLORS.textDim}}
        .ali-commit-copy strong{display:block;margin-bottom:4px;color:color-mix(in srgb,var(--ali-accent) 70%,white);font-size:10px}
        .ali-cta{min-width:150px;padding:11px 22px;border-radius:999px;border:1px solid color-mix(in srgb,var(--ali-accent) 62%,rgba(255,255,255,.16));background:linear-gradient(180deg,color-mix(in srgb,var(--ali-accent) 16%,rgba(255,255,255,.04)),rgba(255,255,255,.015));color:${NOX_COLORS.text};font:700 9px/1 ui-monospace,monospace;letter-spacing:.16em;cursor:pointer;transition:opacity .2s,filter .2s,transform .2s}
        .ali-cta:disabled{cursor:default;opacity:.34;filter:saturate(.3)}
        .ali-cta:not(:disabled):hover{transform:translateY(-2px)}
        .ali-root[data-motion="true"] .ali-cta:not(:disabled):not([data-committed="true"]){animation:ali-commit-pulse 1.7s ease-in-out .45s infinite}
        .ali-cta[data-committed="true"]{border-color:rgba(99,245,181,.6);color:#9ff6cf}
        .ali-brand-lock .ali-shell{background:linear-gradient(145deg,rgba(19,16,27,.86),rgba(8,7,12,.7))}
        .ali-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        @media(max-width:700px){.ali-root{padding:10px}.ali-shell{padding:14px;border-radius:17px}.ali-header{margin-bottom:12px}.ali-brand{display:none}.ali-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.ali-card{min-height:78px;padding:11px 8px 10px}.ali-card:last-child{grid-column:1/-1}.ali-label{font-size:7px}.ali-status{display:none}.ali-commit{align-items:stretch;flex-direction:column}.ali-cta{width:100%}.ali-rail{height:38px}}
        @media(max-width:390px){.ali-cards{grid-template-columns:1fr;max-height:52vh;overflow:auto}.ali-card:last-child{grid-column:auto}.ali-card{min-height:68px}.ali-index{font-size:22px}.ali-question{font-size:17px}}
        @media(prefers-reduced-motion:reduce){.ali-root::before,.ali-scan,.ali-brand-dot,.ali-cta{animation:none!important}.ali-card,.ali-rail-fill,.ali-rail-node,.ali-cta{transition:none!important}}
      `}</style>

      <div className="ali-aura" aria-hidden="true" />
      <div className="ali-scan" aria-hidden="true" />

      <section className="ali-shell" aria-labelledby={`${statusId}-question`} aria-describedby={statusId}>
        <header className="ali-header">
          <div>
            <div className="ali-eyebrow">{eyebrow}</div>
            <div id={`${statusId}-question`} className="ali-question">{question}</div>
          </div>
          <div className="ali-brand" aria-hidden="true">
            {logoUrl ? <img src={logoUrl} alt="" /> : <span className="ali-brand-dot" />}
            {brandMark}
          </div>
        </header>

        <div className="ali-cards" role="radiogroup" aria-label={question}>
          {SCALE.map((scale, index) => {
            const isSelected = selected === index;
            const dimmed = selected !== null && !isSelected;
            const load = selected === null ? 16 + index * 7 : isSelected ? 100 : 10 + index * 5;
            return (
              <button
                key={scale.n}
                ref={(node) => { optionRefs.current[index] = node; }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${index + 1} of ${SCALE.length}: ${scale.label}`}
                tabIndex={selected === null ? (index === 0 ? 0 : -1) : isSelected ? 0 : -1}
                data-selected={isSelected}
                data-committed={isSelected && committed}
                onClick={() => pick(index)}
                onKeyDown={(event) => moveSelection(event, index)}
                className="ali-card"
                style={{
                  opacity: dimmed ? safeDimOpacity : 1,
                  filter: dimmed ? 'saturate(.26) brightness(.7)' : 'none',
                  transform: dimmed ? 'translateY(2px) scale(.975)' : undefined,
                  animation: isSelected && motionActive ? `ali-lock ${safeLockDuration}s ${EASE.krankOvershoot} both` : undefined,
                  '--ali-load': `${load}%`,
                } as CSSProperties}
              >
                {isSelected && (
                  <svg key={`trace-${lockKey}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%', overflow:'visible', pointerEvents:'none' }}>
                    <rect x="1" y="1" width="98" height="98" rx="12" fill="none" stroke={committed ? '#63f5b5' : accentColor} strokeWidth="2" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={1} strokeDashoffset={motionActive ? 1 : 0} style={{ animation:motionActive ? `ali-trace .65s ${EASE.outExpo} forwards` : undefined, filter:`drop-shadow(0 0 ${6 * intensity}px ${committed ? '#63f5b5' : accentColor})` }} />
                  </svg>
                )}
                <span key={isSelected ? `led-${lockKey}` : 'led-off'} className="ali-led" style={{ animation:isSelected && motionActive ? `ali-led .52s ${EASE.outBack} forwards` : undefined }} />
                <div className="ali-index">{scale.n}</div>
                <div className="ali-label">{scale.label}</div>
                <div className="ali-status" aria-hidden="true">
                  <span>{isSelected ? (committed ? 'COMMITTED' : 'LOCKED') : 'STANDBY'}</span>
                  <span className="ali-status-line" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="ali-rail" aria-hidden="true">
          {showEnergyLine && selected !== null && (
            <svg key={`energy-${lockKey}`} viewBox="0 0 100 50" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%', overflow:'visible', pointerEvents:'none' }}>
              <path d={`M ${selectedCenter} 0 C ${selectedCenter} 19, 50 14, 50 26`} fill="none" stroke={committed ? '#63f5b5' : accentColor} strokeWidth="1.4" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={1} strokeDashoffset={motionActive ? 1 : 0} opacity={0.64} style={{ animation:motionActive ? `ali-draw .56s ${EASE.outExpo} .08s both` : undefined }} />
              {motionActive && !committed && <path d={`M ${selectedCenter} 0 C ${selectedCenter} 19, 50 14, 50 26`} fill="none" stroke="#8cecff" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" pathLength={1} strokeDasharray=".06 .18" style={{ animation:'ali-flow .9s linear .25s infinite', filter:`drop-shadow(0 0 ${5 * intensity}px ${accentColor})` }} />}
            </svg>
          )}
          {showProgressRail && <div className="ali-rail-base"><div className="ali-rail-fill" style={{ '--ali-progress':`${selectedProgress * 100}%` } as CSSProperties} /></div>}
          {showProgressRail && <div className="ali-rail-nodes">{SCALE.map((scale,index) => <span key={scale.n} className="ali-rail-node" data-active={selected !== null && index <= selected} />)}</div>}
        </div>

        <footer className="ali-commit">
          <div className="ali-commit-copy" aria-hidden="true">
            <strong>{selected === null ? 'AWAITING INPUT' : committed ? 'SIGNAL COMMITTED' : `SIGNAL READY ${Math.round(selectedProgress * 100)}%`}</strong>
            {selected === null ? 'Select one calibrated response node.' : committed ? 'Decision sealed. Select another node to revise.' : 'Selection locked and ready for the next section.'}
          </div>
          <button type="button" className="ali-cta" disabled={selected === null || committed} data-committed={committed} onClick={commit}>
            {committed ? 'SIGNAL COMMITTED ✓' : 'COMMIT SIGNAL →'}
          </button>
        </footer>

        <p id={statusId} className="ali-sr" aria-live="polite">{statusText}</p>
      </section>
    </div>
  );
}

export default AnswerLockIn;
