import { useEffect, useState, type CSSProperties } from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// StrikethroughExplainModal — Erklär-Modal mit Durchstreich-Animation:
// Eine (falsche) Antwort wird mit einem Gold-Strich durchgestrichen
// (scaleX + skew), danach klappt die richtige Erklärung auf. Zustände:
// 'answer' → 'strike' (Linie wächst) → 'reveal' (Erklärung). aria-live
// für das Ergebnis. Nur transform/opacity-Animationen.
// Reduced Motion: Durchstreichung erscheint ohne Wachstums-Animation.
// ---------------------------------------------------------------------------

export interface StrikethroughExplainModalProps {
  /** Sichtbar (Eltern steuern). */
  open?: boolean;
  /** Zu durchstreichende (falsche) Antwort. */
  wrongAnswer?: string;
  /** Richtige Erklärung. */
  explanation?: string;
  /** Durchstreich-Dauer in s (0.3–1.2). */
  duration?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

export function StrikethroughExplainModal({
  open = false,
  wrongAnswer = '42',
  explanation = 'The answer is actually 43 — off by one.',
  duration = 0.7,
  seed = 20260810,
}: StrikethroughExplainModalProps) {
  const [phase, setPhase] = useState<'answer' | 'strike' | 'reveal'>('answer');
  const reduced = usePrefersReducedMotion();
  const safeDuration = clamp(duration, 0.3, 1.2);

  // Beim Öffnen: Phase zurücksetzen; nach kurzer Pause Strike-Phase.
  useEffect(() => {
    if (!open) return;
    setPhase('answer');
    const t1 = setTimeout(() => setPhase('strike'), reduced ? 0 : 600);
    const t2 = setTimeout(() => setPhase('reveal'), reduced ? 0 : safeDuration * 1000 + 950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, reduced, safeDuration]);

  if (!open) return null;

  const vars = {
    '--sem-gold': NOX_COLORS.gold,
    '--sem-duration': `${safeDuration}s`,
  } as CSSProperties;

  return (
    <div className="sem-root" style={vars} role="dialog" aria-modal="true" aria-label="Explanation">
      <div className="sem-backdrop" />
      <div className="sem-card">
        <p className="sem-kicker">EXPLAINED</p>
        <div className="sem-answer" aria-live="polite">
          <span className="sem-answer-text">{wrongAnswer}</span>
          <span
            className="sem-strike"
            style={{
              transform:
                phase === 'answer'
                  ? 'scaleX(0)'
                  : `scaleX(1) skewX(-8deg)`,
              transition: reduced
                ? 'none'
                : `transform var(--sem-duration) cubic-bezier(.2,.9,.3,1.1)`,
            }}
          />
        </div>
        <div
          className="sem-reveal"
          style={{
            maxHeight: phase === 'reveal' ? '160px' : '0',
            opacity: phase === 'reveal' ? 1 : 0,
            transition: reduced
              ? 'none'
              : 'max-height .5s cubic-bezier(.2,.9,.3,1.1), opacity .4s',
          }}
          aria-hidden={phase !== 'reveal'}
        >
          <p className="sem-explanation">{explanation}</p>
        </div>
      </div>
      <style>{`
.sem-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;z-index:50}
.sem-backdrop{position:absolute;inset:0;background:rgba(4,6,10,.6);backdrop-filter:blur(4px);
  animation:sem-fade .3s ease-out}
.sem-card{position:relative;width:min(88%,400px);padding:28px 24px;border-radius:14px;
  background:linear-gradient(180deg,#0c0f17,#080a10);
  border:1px solid color-mix(in srgb,var(--sem-gold) 28%,transparent);
  box-shadow:0 26px 80px rgba(0,0,0,.6);animation:sem-in .4s cubic-bezier(.2,.9,.3,1.1)}
.sem-kicker{color:var(--sem-gold);font:700 11px/1 ui-monospace,monospace;
  letter-spacing:.3em;margin:0 0 16px}
.sem-answer{position:relative;display:inline-block;padding:2px 4px;margin-bottom:10px}
.sem-answer-text{color:#cfccc2;font:700 22px/1.2 ui-monospace,monospace}
.sem-strike{position:absolute;left:-6px;right:-6px;top:50%;height:3px;border-radius:2px;
  background:linear-gradient(90deg,var(--sem-gold),color-mix(in srgb,var(--sem-gold) 60%,#fff));
  transform-origin:left center;box-shadow:0 0 12px color-mix(in srgb,var(--sem-gold) 50%,transparent)}
.sem-reveal{overflow:hidden}
.sem-explanation{margin:0;color:#e8e6de;font:400 14px/1.7 ui-monospace,monospace;
  border-top:1px solid rgba(255,255,255,.08);padding-top:12px}
@keyframes sem-in{from{opacity:0;transform:translateY(10px) scale(.97)}
  to{opacity:1;transform:none}}
@keyframes sem-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
  .sem-card,.sem-backdrop{animation:none}
}
`}</style>
    </div>
  );
}

export default StrikethroughExplainModal;
