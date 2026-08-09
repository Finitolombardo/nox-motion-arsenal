import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { EASE, NOX_COLORS } from '../../lib/motionPresets';
import { useInView, usePrefersReducedMotion } from '../../lib/animationUtils';

export interface QuestionTransitionProps {
  duration?: number;
  blurAmount?: number;
  accentColor?: string;
  direction?: 'forward' | 'back';
  autoCycle?: boolean;
}

const QUESTIONS = [
  { q: 'Welches SYSTEM treibt dich an?', a: ['FORGE', 'SIGNAL', 'RANK', 'SCAN'] },
  { q: 'Wie oft prüfst du deinen RANK?', a: ['TÄGLICH', 'WÖCHENTLICH', 'BEI SIGNAL', 'NIE'] },
  { q: 'Was startet dein nächster SCAN?', a: ['PROFIL', 'MISSION', 'FORGE-RUN', 'SYSTEM-CHECK'] },
] as const;

type Phase = 'idle' | 'collapse' | 'sweep' | 'expand';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function QuestionTransition({
  duration = 0.95,
  blurAmount = 10,
  accentColor = NOX_COLORS.red,
  direction = 'forward',
  autoCycle = true,
}: QuestionTransitionProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [dir, setDir] = useState<1 | -1>(1);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  const safeDuration = clamp(Number.isFinite(duration) ? duration : 0.95, 0.2, 3);
  const safeBlur = clamp(Number.isFinite(blurAmount) ? blurAmount : 10, 0, 24);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (inView) return;
    clearTimers();
    setPhase('idle');
  }, [clearTimers, inView]);

  const wrap = useCallback((i: number) => ((i % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length, []);

  const go = useCallback(
    (d: 1 | -1) => {
      if (reduced) {
        clearTimers();
        setIdx((i) => wrap(i + d));
        setPhase('idle');
        return;
      }
      if (phaseRef.current !== 'idle') return;

      clearTimers();
      setDir(d);
      setPhase('collapse');

      const D = safeDuration * 1000;
      const schedule = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
      schedule(() => setPhase('sweep'), D * 0.34);
      schedule(() => {
        setIdx((i) => wrap(i + d));
        setPhase('expand');
      }, D * 0.58);
      schedule(() => {
        setPhase('idle');
        timers.current = [];
      }, D);
    },
    [clearTimers, reduced, safeDuration, wrap],
  );

  useEffect(() => {
    if (!autoCycle || !inView || reduced || phase !== 'idle') return;
    const id = setTimeout(() => go(direction === 'back' ? -1 : 1), 2800);
    return () => clearTimeout(id);
  }, [autoCycle, direction, go, idx, inView, phase, reduced]);

  const D = safeDuration;
  const q = QUESTIONS[idx];
  const busy = phase !== 'idle';

  const wrapperStyle: CSSProperties =
    phase === 'collapse' || phase === 'sweep'
      ? { animation: `qtr-collapse ${D * 0.34}s ${EASE.sharpIn} forwards` }
      : phase === 'expand'
        ? { animation: `qtr-expand ${D * 0.42}s ${EASE.outExpo} forwards` }
        : {};

  const lineStyle: CSSProperties =
    phase === 'collapse'
      ? { animation: `qtr-line-in ${D * 0.34}s ${EASE.outQuint} forwards` }
      : phase === 'sweep'
        ? { animation: `qtr-line-sweep ${D * 0.24}s ${EASE.inOutSoft} forwards` }
        : phase === 'expand'
          ? { animation: `qtr-line-out ${D * 0.34}s ${EASE.outExpo} forwards` }
          : { opacity: 0 };

  const buttonBase: CSSProperties = {
    fontFamily: 'ui-monospace, monospace',
    border: '1px solid #2c2c31',
    background: 'linear-gradient(180deg, rgba(24,24,29,.96), rgba(11,11,15,.96))',
    color: NOX_COLORS.text,
    cursor: busy ? 'default' : 'pointer',
    transition: 'border-color 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
  };

  return (
    <div
      ref={rootRef}
      aria-busy={busy}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: `radial-gradient(110% 90% at 50% 10%, #121014 0%, ${NOX_COLORS.bg} 65%)`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 30px)', fontFamily: 'system-ui, sans-serif',
        color: NOX_COLORS.text, userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes qtr-collapse { from { transform: scaleY(1); filter: blur(0); opacity: 1; } to { transform: scaleY(.025); filter: blur(${safeBlur}px); opacity: .86; } }
        @keyframes qtr-expand { 0% { transform: scaleY(.025); filter: blur(${safeBlur * 0.55}px); opacity: .88; } 100% { transform: scaleY(1); filter: blur(0); opacity: 1; } }
        @keyframes qtr-line-in { from { opacity: 0; transform: translateX(0) scaleX(.3); } to { opacity: 1; transform: translateX(0) scaleX(1); } }
        @keyframes qtr-line-sweep { 0% { opacity: 1; transform: translateX(0) scaleX(1); } 55% { opacity: 1; transform: translateX(calc(var(--qtr-dir) * 30%)) scaleX(.7); } 100% { opacity: 1; transform: translateX(0) scaleX(1.08); } }
        @keyframes qtr-line-out { from { opacity: 1; transform: scaleX(1.08); } to { opacity: 0; transform: scaleX(1.34); } }
        @keyframes qtr-child { from { opacity: 0; transform: translateX(calc(var(--qtr-dir) * 26px)) translateY(6px); } to { opacity: 1; transform: translateX(0) translateY(0); } }
        .qtr-answer:focus-visible, .qtr-nav:focus-visible { outline: 2px solid ${accentColor}; outline-offset: 3px; border-color: ${accentColor} !important; box-shadow: 0 0 0 4px color-mix(in srgb, ${accentColor} 18%, transparent); }
        .qtr-answer:not(:disabled):hover, .qtr-nav:not(:disabled):hover { border-color: ${accentColor}; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,.24); }
        @media (max-width: 440px) { .qtr-answer-grid { grid-template-columns: 1fr !important; } }
        @media (prefers-reduced-motion: reduce) { .qtr-answer, .qtr-nav { transition: none !important; } }
      `}</style>

      <div style={{ position: 'relative', flex: '0 1 auto', ['--qtr-dir' as string]: String(dir) } as CSSProperties}>
        <div aria-hidden="true" style={{ position: 'absolute', left: '4%', right: '4%', top: '50%', height: 2, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, boxShadow: `0 0 12px 1px ${accentColor}aa, 0 0 30px 4px ${accentColor}44`, pointerEvents: 'none', zIndex: 2, opacity: 0, ...lineStyle }} />

        <div style={{ transformOrigin: '50% 50%', willChange: busy ? 'transform, filter' : 'auto', ...wrapperStyle }}>
          <div key={`h-${idx}`} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 'clamp(9px, 1.4vw, 11px)', letterSpacing: '0.3em', color: NOX_COLORS.textDim, marginBottom: 6, ...(phase === 'expand' && !reduced ? { animation: `qtr-child ${D * 0.36}s ${EASE.outExpo} 0.02s both` } : {}) }}>
            NPC-TEST · FRAGE {String(idx + 1).padStart(2, '0')}/{String(QUESTIONS.length).padStart(2, '0')}
          </div>
          <div key={`q-${idx}`} aria-live="polite" style={{ fontSize: 'clamp(15px, 2.8vw, 24px)', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 'clamp(10px, 2.4vh, 20px)', ...(phase === 'expand' && !reduced ? { animation: `qtr-child ${D * 0.4}s ${EASE.outExpo} 0.08s both` } : {}) }}>
            {q.q}
          </div>

          <div className="qtr-answer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1vw, 10px)' }}>
            {q.a.map((ans, i) => (
              <button
                className="qtr-answer"
                key={`${idx}-${i}`}
                type="button"
                disabled={busy}
                onClick={() => go(1)}
                style={{ ...buttonBase, fontSize: 'clamp(8px, 1.3vw, 11px)', letterSpacing: '0.16em', textAlign: 'left', padding: 'clamp(9px, 1.6vh, 13px) 12px', borderRadius: 9, opacity: busy ? 0.72 : 1, ...(phase === 'expand' && !reduced ? { animation: `qtr-child ${D * 0.4}s ${EASE.outExpo} ${0.14 + i * 0.05}s both` } : {}) }}
              >
                <span aria-hidden="true" style={{ color: accentColor, marginRight: 8 }}>▸</span>{ans}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 'clamp(10px, 2.5vh, 22px)' }}>
        {([['◀ ZURÜCK', -1], ['WEITER ▶', 1]] as const).map(([label, d]) => (
          <button
            className="qtr-nav"
            key={label}
            type="button"
            disabled={busy}
            onClick={() => go(d)}
            style={{ ...buttonBase, fontSize: 'clamp(8px, 1.3vw, 11px)', letterSpacing: '0.2em', padding: '8px 18px', borderRadius: 999, background: 'rgba(8,8,12,.52)', color: NOX_COLORS.textDim, opacity: busy ? 0.58 : 1 }}
          >{label}</button>
        ))}
      </div>
    </div>
  );
}

export default QuestionTransition;