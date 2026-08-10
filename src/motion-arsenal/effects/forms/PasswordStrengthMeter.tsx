import { useMemo, useState } from 'react';
import type React from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// PasswordStrengthMeter — NOX Forms DNA.
// Segmentbalken, der die Passwortstaerke nach festen Regeln bewertet: Laenge,
// Zeichenklassen und die ueblichen Schwaechen (Wiederholungen, Folgen,
// bekannte Muster). Die Bewertung ist rein deterministisch — dieselbe Eingabe
// ergibt immer denselben Score, damit sich niemand fragen muss, warum derselbe
// Wert einmal gruen und einmal gelb ist.
// Der Balken fuellt sich ueber scaleX, das Label wechselt in einer aria-live-
// Region, damit die Bewertung nicht nur farbig, sondern auch vorlesbar ist.
// ---------------------------------------------------------------------------

export interface PasswordStrengthMeterProps {
  /** Anzahl der Segmente. */
  segments?: number;
  /** Farbe der gefuellten Segmente. */
  color?: string;
  /** Strenge der Bewertung. */
  rules?: 'standard' | 'strict';
  /** Textbewertung anzeigen. */
  label?: boolean;
  /** Vorbelegung des Feldes. */
  initialValue?: string;
}

const LEVELS = ['Zu schwach', 'Schwach', 'Brauchbar', 'Stark', 'Sehr stark', 'Ausgezeichnet'];

// Score 0..1. Bewusst regelbasiert und nachvollziehbar, keine Blackbox.
function scorePassword(value: string, strict: boolean) {
  if (!value) return 0;

  const classes =
    Number(/[a-z]/.test(value)) +
    Number(/[A-Z]/.test(value)) +
    Number(/\d/.test(value)) +
    Number(/[^A-Za-z0-9]/.test(value));

  const minLength = strict ? 14 : 10;
  let points = Math.min(value.length / minLength, 1) * 0.55 + (classes / 4) * 0.45;

  // Abzuege fuer Muster, die Angreifer zuerst probieren.
  if (/(.)\1{2,}/.test(value)) points -= 0.15;
  if (/(012|123|234|345|456|567|678|789|abc|qwe|asd)/i.test(value)) points -= 0.15;
  if (/^(passwort|password|admin|willkommen|welcome)/i.test(value)) points -= 0.35;
  if (strict && value.length < 8) points -= 0.25;

  return clamp(points, 0, 1);
}

export function PasswordStrengthMeter({
  segments = 4,
  color = NOX_COLORS.gold,
  rules = 'standard',
  label = true,
  initialValue = '',
}: PasswordStrengthMeterProps) {
  const [value, setValue] = useState(initialValue);
  const [visible, setVisible] = useState(false);

  const count = clamp(Math.round(segments), 2, 6);
  const score = useMemo(() => scorePassword(value, rules === 'strict'), [value, rules]);

  // Bei Score > 0 mindestens ein Segment fuellen, sonst wirkt Tippen wirkungslos.
  const filled = value ? Math.max(1, Math.ceil(score * count)) : 0;
  const levelText = value ? LEVELS[Math.min(Math.round(score * (LEVELS.length - 1)), LEVELS.length - 1)] : 'Noch nichts eingegeben';

  const style = {
    '--psm-color': color,
    '--psm-count': count,
  } as React.CSSProperties;

  return (
    <div className="nox-psm" style={style}>
      <style>{CSS}</style>

      <div className="nox-psm__field">
        <input
          id="nox-psm-input"
          className="nox-psm__input"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Passwort eingeben"
          aria-describedby="nox-psm-status"
          autoComplete="new-password"
        />
        <button
          type="button"
          className="nox-psm__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
        >
          {visible ? 'verbergen' : 'zeigen'}
        </button>
      </div>

      <div className="nox-psm__bars" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <span key={index} className={`nox-psm__bar${index < filled ? ' is-filled' : ''}`} />
        ))}
      </div>

      {label && (
        <p id="nox-psm-status" className="nox-psm__label" aria-live="polite">
          {levelText}
        </p>
      )}
    </div>
  );
}

const CSS = String.raw`
.nox-psm { display:grid; align-content:center; gap:11px; width:min(400px,100%); margin:0 auto; padding:clamp(16px,4vw,32px); font-family:var(--sans,system-ui,sans-serif); }
.nox-psm__field { display:flex; align-items:center; gap:8px; padding:2px 4px 2px 0; border-radius:11px; border:1px solid rgba(236,231,219,.13); background:rgba(255,255,255,.03); transition:border-color .24s ease; }
.nox-psm__field:focus-within { border-color:color-mix(in srgb, var(--psm-color) 60%, transparent); }
.nox-psm__input { flex:1 1 auto; padding:12px 14px; border:0; background:transparent; color:#f0ebe1; font:inherit; font-size:14px; outline:none; }
.nox-psm__input:focus-visible { outline:2px solid var(--psm-color); outline-offset:-2px; border-radius:10px; }
.nox-psm__input::placeholder { color:rgba(236,231,219,.28); }
.nox-psm__toggle { flex:0 0 auto; padding:6px 11px; border:0; border-radius:7px; background:transparent; color:rgba(236,231,219,.44); font:inherit; font-size:11px; cursor:pointer; }
.nox-psm__toggle:hover { color:#f0ebe1; }
.nox-psm__toggle:focus-visible { outline:2px solid var(--psm-color); outline-offset:1px; }
.nox-psm__bars { display:grid; grid-template-columns:repeat(var(--psm-count),1fr); gap:5px; }
.nox-psm__bar { height:4px; border-radius:999px; background:rgba(236,231,219,.09); overflow:hidden; }
/* Overshoot im Easing gibt dem Fuellen den federnden Charakter. */
.nox-psm__bar::after { content:''; display:block; height:100%; border-radius:inherit; background:var(--psm-color); transform:scaleX(0); transform-origin:left; transition:transform .42s cubic-bezier(.34,1.4,.64,1); }
.nox-psm__bar.is-filled::after { transform:scaleX(1); }
.nox-psm__label { margin:0; color:rgba(236,231,219,.44); font-size:11.5px; letter-spacing:.05em; }
@media (prefers-reduced-motion:reduce) {
  .nox-psm__bar::after { transition:none; }
  .nox-psm__field { transition:none; }
}
`;

export default PasswordStrengthMeter;
