import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, KeyboardEvent } from 'react';
import { useInView, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS, EASE } from '../../lib/motionPresets';

export type ValidationPulseVariant = 'field' | 'command' | 'checkout';

export interface ValidationPulseProps {
  accent?: string;
  springDamping?: number;
  springFreq?: number;
  variant?: ValidationPulseVariant;
  successColor?: string;
  signalStrength?: number;
  label?: string;
  placeholder?: string;
  buttonLabel?: string;
  brandMark?: string;
  autoValidate?: boolean;
  showTelemetry?: boolean;
}

type ValidationState = 'idle' | 'error' | 'ok';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

export function ValidationPulse({
  accent = NOX_COLORS.red,
  springDamping = 6,
  springFreq = 9,
  variant = 'command',
  successColor = '#39ff8b',
  signalStrength = 1,
  label = 'OPERATOR EMAIL',
  placeholder = 'you@forge.system',
  buttonLabel = 'VALIDATE SIGNAL',
  brandMark = 'NOX // INPUT GATE',
  autoValidate = false,
  showTelemetry = true,
}: ValidationPulseProps) {
  const [value, setValue] = useState('');
  const [state, setState] = useState<ValidationState>('idle');
  const [pulseId, setPulseId] = useState(0);
  const [typing, setTyping] = useState(false);
  const [springActive, setSpringActive] = useState(false);
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, '140px');
  const fieldRef = useRef<HTMLDivElement>(null);
  const spring = useRef({ t: -1 });
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputId = useId();
  const statusId = useId();
  const strength = clamp(finite(signalStrength, 1), 0.3, 1.6);
  const damping = clamp(finite(springDamping, 6), 1, 18);
  const frequency = clamp(finite(springFreq, 9), 1, 18);

  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (autoTimer.current) clearTimeout(autoTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!reduced) return;
    spring.current.t = -1;
    setSpringActive(false);
    if (fieldRef.current) fieldRef.current.style.transform = 'translate3d(0,0,0)';
  }, [reduced]);

  useRafLoop(
    (dt) => {
      const oscillator = spring.current;
      if (oscillator.t < 0) {
        setSpringActive(false);
        return;
      }
      oscillator.t += Math.min(dt, 0.05);
      const amplitude = 14 * strength;
      const x = amplitude * Math.exp(-damping * oscillator.t) * Math.sin(frequency * Math.PI * 2 * oscillator.t);
      if (fieldRef.current) {
        fieldRef.current.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      }
      if (oscillator.t > 1.2 || Math.abs(x) < 0.05) {
        oscillator.t = -1;
        setSpringActive(false);
        if (fieldRef.current) fieldRef.current.style.transform = 'translate3d(0,0,0)';
      }
    },
    springActive && !reduced && inView,
  );

  const validateValue = (candidate = value) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(candidate.trim());
    setState(ok ? 'ok' : 'error');
    setPulseId((id) => id + 1);
    if (!ok && !reduced) {
      spring.current.t = 0;
      setSpringActive(true);
    } else {
      spring.current.t = -1;
      setSpringActive(false);
      if (fieldRef.current) fieldRef.current.style.transform = 'translate3d(0,0,0)';
    }
  };

  const onType = (nextValue: string) => {
    setValue(nextValue);
    setState('idle');
    setTyping(true);
    spring.current.t = -1;
    setSpringActive(false);
    if (fieldRef.current) fieldRef.current.style.transform = 'translate3d(0,0,0)';
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (autoTimer.current) clearTimeout(autoTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 560);
    if (autoValidate && nextValue.trim().length > 4) {
      autoTimer.current = setTimeout(() => validateValue(nextValue), 760);
    }
  };

  const borderColor = state === 'error' ? accent : state === 'ok' ? successColor : '#343540';
  const statusCopy = state === 'error' ? 'SIGNAL REJECTED' : state === 'ok' ? 'IDENTITY CONFIRMED' : typing ? 'PARSING INPUT' : 'AWAITING SIGNAL';
  const statusDetail = state === 'error' ? 'Format invalid. Recalibrate the channel.' : state === 'ok' ? 'Secure route established. Continue.' : 'Encrypted validation node standing by.';

  const rootStyle = {
    '--nvp-accent': accent,
    '--nvp-success': successColor,
    '--nvp-strength': strength,
    '--nvp-border': borderColor,
  } as CSSProperties;

  return (
    <div ref={rootRef} className={`nvp-root nvp-${variant}`} data-paused={!inView || reduced ? 'true' : 'false'} style={rootStyle}>
      <style>{`
        @keyframes nvp-grid { to { background-position:48px 48px,48px 48px; } }
        @keyframes nvp-scan { 0% { transform:translateY(-120%); opacity:0; } 15% { opacity:.7; } 75% { opacity:.22; } 100% { transform:translateY(120%); opacity:0; } }
        @keyframes nvp-ring-out { 0% { transform:scale(.96); opacity:.9; } 100% { transform:scale(1.32); opacity:0; } }
        @keyframes nvp-ring-in { 0% { transform:scale(1.34); opacity:0; } 52% { opacity:.85; } 100% { transform:scale(.98); opacity:0; } }
        @keyframes nvp-led { 0%,100% { opacity:.3; transform:scale(.8); } 50% { opacity:1; transform:scale(1.25); } }
        @keyframes nvp-check { from { stroke-dashoffset:1; } to { stroke-dashoffset:0; } }
        @keyframes nvp-orbit { to { transform:rotate(360deg); } }
        @keyframes nvp-bar { 0% { transform:scaleX(.12); opacity:.35; } 50% { transform:scaleX(1); opacity:1; } 100% { transform:scaleX(.28); opacity:.46; } }
        @keyframes nvp-particle { 0% { transform:translate(-50%,-50%) rotate(var(--angle)) translateX(18px) scale(.3); opacity:0; } 35% { opacity:1; } 100% { transform:translate(-50%,-50%) rotate(var(--angle)) translateX(66px) scale(0); opacity:0; } }
        @keyframes nvp-button { 0%,100% { box-shadow:0 0 0 0 color-mix(in srgb,var(--nvp-accent) 35%,transparent); } 50% { box-shadow:0 0 28px color-mix(in srgb,var(--nvp-accent) 28%,transparent); } }
        .nvp-root { position:absolute; inset:0; display:grid; place-items:center; overflow:hidden; padding:clamp(14px,3vw,34px); background:radial-gradient(120% 100% at 50% 0%,color-mix(in srgb,var(--nvp-accent) 10%,#10131d),#07080d 55%,#020306); color:${NOX_COLORS.text}; font-family:system-ui,sans-serif; isolation:isolate; }
        .nvp-root::before { content:""; position:absolute; inset:-30%; z-index:-3; background-image:linear-gradient(rgba(255,255,255,.032) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.032) 1px,transparent 1px); background-size:48px 48px; transform:perspective(680px) rotateX(62deg) translateY(25%); mask-image:radial-gradient(circle at center,#000 0,transparent 72%); animation:nvp-grid 12s linear infinite; }
        .nvp-root::after { content:""; position:absolute; inset:0; z-index:9; pointer-events:none; background:radial-gradient(circle at 50% 48%,transparent 30%,rgba(2,3,6,.3) 62%,rgba(2,3,6,.9) 100%); }
        .nvp-aura { position:absolute; left:50%; top:50%; width:min(78vw,760px); aspect-ratio:1; transform:translate(-50%,-50%); z-index:-2; border-radius:50%; background:conic-gradient(from 20deg,transparent,color-mix(in srgb,var(--nvp-accent) 24%,transparent),transparent 30%,rgba(34,211,238,.1),transparent 65%,color-mix(in srgb,var(--nvp-success) 12%,transparent),transparent); filter:blur(58px); opacity:calc(.7 * var(--nvp-strength)); }
        .nvp-panel { position:relative; z-index:2; width:min(100%,620px); padding:clamp(18px,3.5vw,34px); border:1px solid rgba(255,255,255,.11); border-radius:24px; background:linear-gradient(145deg,rgba(16,18,27,.86),rgba(7,8,13,.72)); backdrop-filter:blur(20px) saturate(1.2); box-shadow:0 30px 90px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08),0 0 calc(64px * var(--nvp-strength)) color-mix(in srgb,var(--nvp-border) 8%,transparent); }
        .nvp-panel::before { content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none; background:linear-gradient(118deg,rgba(255,255,255,.08),transparent 24%,transparent 72%,color-mix(in srgb,var(--nvp-border) 10%,transparent)); }
        .nvp-scan { position:absolute; left:0; right:0; height:40%; top:0; pointer-events:none; background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--nvp-border) 7%,transparent),rgba(255,255,255,.06),transparent); filter:blur(2px); animation:nvp-scan 4.2s ease-in-out infinite; }
        .nvp-header { position:relative; display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:clamp(20px,4vh,32px); }
        .nvp-kicker { font:700 8px/1 ui-monospace,monospace; letter-spacing:.25em; color:${NOX_COLORS.textDim}; }
        .nvp-title { margin-top:8px; font-size:clamp(20px,3.4vw,34px); font-weight:780; letter-spacing:-.045em; line-height:.96; }
        .nvp-brand { display:flex; align-items:center; gap:8px; font:700 8px/1 ui-monospace,monospace; letter-spacing:.18em; color:rgba(230,226,255,.52); white-space:nowrap; }
        .nvp-brand::before { content:""; width:7px; height:7px; border-radius:50%; background:var(--nvp-border); box-shadow:0 0 12px var(--nvp-border); animation:nvp-led 1.8s ease-in-out infinite; }
        .nvp-field-label { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:9px; font:700 9px/1 ui-monospace,monospace; letter-spacing:.2em; color:${NOX_COLORS.textDim}; }
        .nvp-led { display:flex; align-items:center; gap:7px; color:color-mix(in srgb,var(--nvp-border) 75%,white); }
        .nvp-led-dot { width:7px; height:7px; border-radius:50%; background:var(--nvp-border); box-shadow:0 0 10px color-mix(in srgb,var(--nvp-border) 70%,transparent); }
        .nvp-field-wrap { position:relative; transform:translate3d(0,0,0); }
        .nvp-field-wrap.nvp-springing { will-change:transform; }
        .nvp-field-shell { position:relative; border:1px solid var(--nvp-border); border-radius:15px; background:linear-gradient(180deg,rgba(20,21,29,.96),rgba(12,13,19,.94)); box-shadow:0 16px 36px rgba(0,0,0,.32),0 0 calc(24px * var(--nvp-strength)) color-mix(in srgb,var(--nvp-border) 12%,transparent),inset 0 1px 0 rgba(255,255,255,.05); transition:border-color .25s,box-shadow .25s; }
        .nvp-field-shell::before { content:""; position:absolute; left:14px; right:14px; top:0; height:1px; background:linear-gradient(90deg,transparent,var(--nvp-border),transparent); opacity:.65; }
        .nvp-input { width:100%; box-sizing:border-box; border:0; outline:0; border-radius:inherit; padding:17px 58px 17px 16px; color:${NOX_COLORS.text}; background:transparent; font:600 clamp(13px,2vw,16px)/1.2 ui-monospace,monospace; letter-spacing:.02em; caret-color:var(--nvp-border); }
        .nvp-input::placeholder { color:rgba(225,221,244,.24); }
        .nvp-input:focus-visible { box-shadow:0 0 0 2px color-mix(in srgb,var(--nvp-border) 78%,white),0 0 24px color-mix(in srgb,var(--nvp-border) 22%,transparent); }
        .nvp-icon { position:absolute; right:15px; top:50%; width:25px; height:25px; transform:translateY(-50%); display:grid; place-items:center; }
        .nvp-orbit { position:absolute; inset:0; border:1px solid color-mix(in srgb,var(--nvp-border) 38%,transparent); border-radius:50%; border-top-color:var(--nvp-border); animation:nvp-orbit 2.4s linear infinite; }
        .nvp-pulse-ring { position:absolute; inset:-3px; border-radius:18px; border:1.5px solid var(--nvp-border); pointer-events:none; }
        .nvp-particle { position:absolute; left:50%; top:50%; width:4px; height:4px; border-radius:50%; background:var(--nvp-success); box-shadow:0 0 8px var(--nvp-success); animation:nvp-particle .75s ${EASE.outExpo} both; }
        .nvp-feedback { display:flex; justify-content:space-between; gap:18px; min-height:46px; margin-top:12px; }
        .nvp-status strong { display:block; margin-bottom:5px; color:var(--nvp-border); font:800 9px/1 ui-monospace,monospace; letter-spacing:.18em; }
        .nvp-status span { color:rgba(225,221,244,.42); font-size:11px; line-height:1.35; }
        .nvp-telemetry { min-width:150px; display:grid; gap:5px; align-content:start; }
        .nvp-telemetry-row { display:grid; grid-template-columns:58px 1fr 26px; gap:7px; align-items:center; color:rgba(225,221,244,.36); font:600 7px/1 ui-monospace,monospace; letter-spacing:.1em; }
        .nvp-telemetry-track { height:2px; background:rgba(255,255,255,.08); overflow:hidden; }
        .nvp-telemetry-fill { width:var(--fill); height:100%; transform-origin:left; background:var(--nvp-border); box-shadow:0 0 8px var(--nvp-border); animation:nvp-bar 1.6s ease-in-out infinite; }
        .nvp-actions { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:8px; }
        .nvp-hint { font:600 8px/1.4 ui-monospace,monospace; letter-spacing:.12em; color:rgba(225,221,244,.28); }
        .nvp-button { min-width:180px; padding:12px 18px; border:1px solid color-mix(in srgb,var(--nvp-accent) 55%,rgba(255,255,255,.14)); border-radius:999px; background:linear-gradient(180deg,color-mix(in srgb,var(--nvp-accent) 16%,rgba(255,255,255,.04)),rgba(255,255,255,.015)); color:${NOX_COLORS.text}; font:750 9px/1 ui-monospace,monospace; letter-spacing:.18em; cursor:pointer; transition:transform .2s,border-color .2s,background .2s; animation:nvp-button 1.9s ease-in-out infinite; }
        .nvp-button:hover { transform:translateY(-2px); border-color:var(--nvp-accent); }
        .nvp-button:focus-visible { outline:2px solid color-mix(in srgb,var(--nvp-accent) 80%,white); outline-offset:3px; }
        .nvp-root[data-paused='true']::before,.nvp-root[data-paused='true'] .nvp-scan,.nvp-root[data-paused='true'] .nvp-brand::before,.nvp-root[data-paused='true'] .nvp-led-dot,.nvp-root[data-paused='true'] .nvp-orbit,.nvp-root[data-paused='true'] .nvp-telemetry-fill,.nvp-root[data-paused='true'] .nvp-button,.nvp-root[data-paused='true'] .nvp-pulse-ring,.nvp-root[data-paused='true'] .nvp-particle{animation-play-state:paused!important}
        .nvp-checkout .nvp-panel { max-width:560px; }
        .nvp-field .nvp-panel { max-width:520px; }
        @media(max-width:640px){ .nvp-root{padding:10px}.nvp-panel{padding:17px;border-radius:18px}.nvp-header{margin-bottom:18px}.nvp-brand,.nvp-telemetry,.nvp-hint{display:none}.nvp-feedback{min-height:40px}.nvp-button{width:100%}.nvp-actions{display:block}.nvp-title{font-size:24px} }
        @media(prefers-reduced-motion:reduce){ .nvp-root::before,.nvp-scan,.nvp-brand::before,.nvp-orbit,.nvp-telemetry-fill,.nvp-button,.nvp-pulse-ring,.nvp-particle{animation:none!important}.nvp-field-wrap{transform:none!important;will-change:auto!important} }
      `}</style>

      <div className="nvp-aura" />
      <section className="nvp-panel" aria-label="Signal validation terminal">
        <div className="nvp-scan" />
        <header className="nvp-header">
          <div>
            <div className="nvp-kicker">SECURE FORM PROTOCOL · 03</div>
            <div className="nvp-title">VALIDATION<br />PULSE</div>
          </div>
          <div className="nvp-brand">{brandMark}</div>
        </header>

        <label className="nvp-field-label" htmlFor={inputId}>
          <span>{label}</span>
          <span className="nvp-led">
            <span className="nvp-led-dot" style={{ animation: typing && !reduced && inView ? 'nvp-led .68s ease-in-out infinite' : undefined }} />
            {typing ? 'LIVE' : state === 'ok' ? 'VERIFIED' : state === 'error' ? 'FAULT' : 'IDLE'}
          </span>
        </label>

        <div ref={fieldRef} className={`nvp-field-wrap${springActive ? ' nvp-springing' : ''}`}>
          {state !== 'idle' && !reduced && [0, 1, 2].map((ring) => (
            <span
              key={`${pulseId}-${ring}`}
              className="nvp-pulse-ring"
              style={{
                animation: `${state === 'error' ? 'nvp-ring-out' : 'nvp-ring-in'} ${0.62 + ring * 0.12}s ${EASE.outExpo} ${ring * 0.07}s both`,
                opacity: 0.76 - ring * 0.18,
              }}
            />
          ))}
          <div className="nvp-field-shell">
            <input
              id={inputId}
              className="nvp-input"
              type="email"
              value={value}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onType(event.target.value)}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => event.key === 'Enter' && validateValue()}
              placeholder={placeholder}
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              aria-invalid={state === 'error'}
              aria-describedby={statusId}
            />
            <div className="nvp-icon" aria-hidden="true">
              {state === 'ok' ? (
                <svg width="25" height="25" viewBox="0 0 25 25">
                  <circle cx="12.5" cy="12.5" r="10.5" fill="none" stroke={successColor} strokeOpacity=".25" />
                  <path
                    d="M6.5 12.8L10.4 16.5L18.7 7.9"
                    fill="none"
                    stroke={successColor}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={reduced ? 0 : 1}
                    style={{ animation: reduced ? undefined : `nvp-check .44s ${EASE.outExpo} .08s both`, filter: `drop-shadow(0 0 4px ${successColor})` }}
                  />
                </svg>
              ) : (
                <span className="nvp-orbit" />
              )}
            </div>
          </div>
          {state === 'ok' && !reduced && Array.from({ length: 8 }, (_, index) => (
            <span
              key={`particle-${pulseId}-${index}`}
              className="nvp-particle"
              style={{ '--angle': `${index * 45}deg`, animationDelay: `${index * 0.025}s` } as CSSProperties}
            />
          ))}
        </div>

        <div className="nvp-feedback">
          <div id={statusId} className="nvp-status" role="status" aria-live="polite" aria-atomic="true">
            <strong>{statusCopy}</strong>
            <span>{statusDetail}</span>
          </div>
          {showTelemetry && (
            <div className="nvp-telemetry" aria-hidden="true">
              {[
                ['FORMAT', state === 'ok' ? 100 : state === 'error' ? 34 : typing ? 58 : 18],
                ['TRUST', state === 'ok' ? 94 : state === 'error' ? 18 : 42],
                ['ROUTE', state === 'ok' ? 88 : state === 'error' ? 12 : 31],
              ].map(([name, fill]) => (
                <div key={String(name)} className="nvp-telemetry-row">
                  <span>{name}</span>
                  <span className="nvp-telemetry-track"><span className="nvp-telemetry-fill" style={{ '--fill': `${fill}%` } as CSSProperties} /></span>
                  <span>{fill}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="nvp-actions">
          <div className="nvp-hint">ENTER TO COMMIT · REAL SPRING RESPONSE</div>
          <button type="button" className="nvp-button" onClick={() => validateValue()}>
            ▸ {buttonLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ValidationPulse;