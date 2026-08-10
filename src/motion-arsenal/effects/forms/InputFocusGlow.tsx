import { useMemo } from 'react';
import type React from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// InputFocusGlow — NOX Forms DNA.
// Dark-Glass-Feld, das beim Fokus einen Gold-Rahmen aufglühen lässt, einen
// Lichtstreifen einmal durchs Feld schickt und das Label nach oben schweben
// lässt. Vollständig CSS: :focus-within trägt den Zustand, der Sweep ist eine
// Compositor-Transform statt einer background-position-Animation. Das Label ist
// ein echtes <label for>, kein Placeholder-Trick — der Feldname bleibt also
// sichtbar, sobald getippt wird, und Screenreader lesen ihn korrekt vor.
// ---------------------------------------------------------------------------

export interface InputFocusGlowProps {
  /** Feldbeschriftung. */
  label?: string;
  /** Eingabetyp. */
  type?: 'text' | 'email' | 'password' | 'search' | 'tel';
  /** Hinweis unter dem Feld (leer = keiner). */
  hint?: string;
  /** Farbe von Rahmen-Glow und Sweep. */
  glowColor?: string;
  /** Stärke des Glows. */
  glowIntensity?: number;
  /** Label schwebt beim Fokus nach oben. */
  labelFloat?: boolean;
  /** Eckenradius in px. */
  radius?: number;
  /** Lichtstreifen beim Fokus. */
  sweep?: boolean;
}

export function InputFocusGlow({
  label = 'E-Mail-Adresse',
  type = 'email',
  hint = 'Wir melden uns innerhalb eines Werktags.',
  glowColor = NOX_COLORS.gold,
  glowIntensity = 0.5,
  labelFloat = true,
  radius = 12,
  sweep = true,
}: InputFocusGlowProps) {
  const fieldId = useMemo(() => `nox-ifg-${Math.abs(hashString(label))}`, [label]);
  const hintId = `${fieldId}-hint`;
  const intensity = clamp(glowIntensity, 0, 1);

  const style = {
    '--ifg-glow': glowColor,
    '--ifg-alpha': intensity.toFixed(3),
    '--ifg-spread': `${(intensity * 9).toFixed(2)}px`,
    '--ifg-radius': `${clamp(radius, 0, 24)}px`,
  } as React.CSSProperties;

  return (
    <div className="nox-ifg" style={style}>
      <style>{CSS}</style>
      <div className={`nox-ifg__field${labelFloat ? ' has-float' : ''}${sweep ? ' has-sweep' : ''}`}>
        <input
          id={fieldId}
          className="nox-ifg__input"
          type={type}
          placeholder={labelFloat ? ' ' : label}
          aria-describedby={hint ? hintId : undefined}
        />
        <label className="nox-ifg__label" htmlFor={fieldId}>
          {label}
        </label>
        {sweep && <span className="nox-ifg__sweep" aria-hidden="true" />}
      </div>
      {hint && (
        <p id={hintId} className="nox-ifg__hint">
          {hint}
        </p>
      )}
    </div>
  );
}

// Stabile ID aus dem Label — bei gleicher Beschriftung immer dieselbe,
// damit die for/id-Verbindung über Re-Renders hält.
function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return hash;
}

const CSS = String.raw`
.nox-ifg { display:grid; align-content:center; gap:9px; width:min(420px,100%); margin:0 auto; padding:clamp(16px,4vw,32px); font-family:var(--sans,system-ui,sans-serif); }
.nox-ifg__field { position:relative; overflow:hidden; border-radius:var(--ifg-radius); border:1px solid rgba(236,231,219,.13); background:linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.012)); backdrop-filter:blur(7px); transition:border-color .28s ease, box-shadow .28s ease; }
.nox-ifg__field:focus-within { border-color:color-mix(in srgb, var(--ifg-glow) 72%, transparent); box-shadow:0 0 0 1px color-mix(in srgb, var(--ifg-glow) calc(var(--ifg-alpha)*55%), transparent), 0 0 var(--ifg-spread) color-mix(in srgb, var(--ifg-glow) calc(var(--ifg-alpha)*45%), transparent); }
.nox-ifg__input { width:100%; padding:22px 15px 10px; border:0; background:transparent; color:#f0ebe1; font:inherit; font-size:14px; outline:none; }
/* Der Glow allein traegt den Fokus nicht: bei Tastaturbedienung kommt eine
   echte Outline dazu. Mausklicks loesen :focus-visible nicht aus, dort bleibt
   es beim Glow. */
.nox-ifg__input:focus-visible { outline:2px solid var(--ifg-glow); outline-offset:-2px; border-radius:calc(var(--ifg-radius) - 1px); }
.nox-ifg__input::placeholder { color:transparent; }
.nox-ifg__label { position:absolute; top:16px; left:15px; color:rgba(236,231,219,.44); font-size:14px; pointer-events:none; transition:transform .24s cubic-bezier(.22,1,.36,1), color .24s ease; transform-origin:left top; }
/* Nur die Float-Variante hebt das Label an; sonst bleibt es als sichtbarer Feldname stehen. */
.nox-ifg__field.has-float:focus-within .nox-ifg__label,
.nox-ifg__field.has-float .nox-ifg__input:not(:placeholder-shown) + .nox-ifg__label { transform:translateY(-10px) scale(.74); color:var(--ifg-glow); }
.nox-ifg__field:not(.has-float) .nox-ifg__label { position:static; display:block; padding:10px 15px 0; }
.nox-ifg__field:not(.has-float) .nox-ifg__input { padding-top:8px; }
.nox-ifg__sweep { position:absolute; inset:0; pointer-events:none; background:linear-gradient(105deg, transparent 34%, color-mix(in srgb, var(--ifg-glow) 26%, transparent) 50%, transparent 66%); transform:translateX(-130%); }
.nox-ifg__field.has-sweep:focus-within .nox-ifg__sweep { transition:transform .72s cubic-bezier(.3,0,.2,1); transform:translateX(130%); }
.nox-ifg__hint { margin:0; padding-left:2px; color:rgba(236,231,219,.34); font-size:11.5px; }
@media (prefers-reduced-motion:reduce) {
  .nox-ifg__field, .nox-ifg__label { transition:none; }
  .nox-ifg__sweep { display:none; }
}
`;

export default InputFocusGlow;
