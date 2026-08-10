import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ToastStackSlide — NOX Overlays DNA.
// Benachrichtigungen fahren seitlich ein und schieben die aelteren in die
// Tiefe. JS haelt nur den Stapelzustand, die Bewegung liegt vollstaendig in
// CSS-Transitions — kein rAF. Der Fortschrittsbalken ist eine scaleX-Animation
// mit der Lebensdauer als Dauer, laeuft also ohne Timer-Ticks.
// Der Stapel ist eine aria-live-Region: neue Meldungen werden vorgelesen,
// ohne den Fokus zu stehlen.
// ---------------------------------------------------------------------------

export interface ToastStackSlideProps {
  /** Ecke, in der der Stapel sitzt. */
  position?: 'top-right' | 'top-left' | 'bottom-right';
  /** Lebensdauer je Meldung in Millisekunden. */
  duration?: number;
  /** Wie viele Meldungen gleichzeitig sichtbar bleiben. */
  maxStack?: number;
  /** Art der Meldung. */
  variant?: 'success' | 'error' | 'info';
  /** Fortschrittsbalken anzeigen. */
  showProgress?: boolean;
  /** Akzentfarbe. */
  color?: string;
}

interface Toast {
  id: number;
  title: string;
  body: string;
}

const MESSAGES: Record<string, { title: string; body: string }[]> = {
  success: [
    { title: 'Deployment live', body: 'Version 2.4.0 ist auf Production ausgerollt.' },
    { title: 'Zahlung erhalten', body: 'Rechnung 2026-0418 wurde beglichen.' },
    { title: 'Export fertig', body: '1.284 Datensaetze als CSV bereitgestellt.' },
  ],
  error: [
    { title: 'Build fehlgeschlagen', body: 'Typecheck bricht in 3 Dateien ab.' },
    { title: 'Verbindung verloren', body: 'Der Agent antwortet seit 40 Sekunden nicht.' },
    { title: 'Limit erreicht', body: 'Kontingent fuer diesen Monat aufgebraucht.' },
  ],
  info: [
    { title: 'Neue Version', body: 'Ein Update steht zur Installation bereit.' },
    { title: 'Wartung geplant', body: 'Sonntag 02:00 bis 04:00 eingeschraenkt erreichbar.' },
    { title: 'Bericht erstellt', body: 'Der Wochenreport liegt im Posteingang.' },
  ],
};

export function ToastStackSlide({
  position = 'top-right',
  duration = 4200,
  maxStack = 4,
  variant = 'success',
  showProgress = true,
  color = NOX_COLORS.gold,
}: ToastStackSlideProps) {
  const reduced = usePrefersReducedMotion();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  const life = clamp(Math.round(duration), 1500, 10000);
  const stackLimit = clamp(Math.round(maxStack), 1, 6);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(() => {
    const pool = MESSAGES[variant] ?? MESSAGES.info;
    // Reihum statt zufaellig — derselbe Klick liefert dieselbe Reihenfolge.
    const message = pool[nextId.current % pool.length];
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current, { id, ...message }].slice(-stackLimit));
    const timer = window.setTimeout(() => dismiss(id), life);
    timers.current.push(timer);
  }, [variant, stackLimit, life, dismiss]);

  // Timer aufraeumen, sonst feuern sie in eine abgebaute Komponente.
  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
    },
    [],
  );

  // Beim Wechsel der Einstellungen von vorn anfangen.
  useEffect(() => {
    setToasts([]);
  }, [variant, position, maxStack]);

  const style = {
    '--tss-color': color,
    '--tss-life': `${life}ms`,
    '--tss-enter': reduced ? '0s' : '.46s',
  } as React.CSSProperties;

  return (
    <div className="nox-tss" style={style}>
      <style>{CSS}</style>

      <button type="button" className="nox-tss__trigger" onClick={push}>
        Meldung ausloesen
      </button>

      <div className={`nox-tss__stack is-${position}`} role="status" aria-live="polite">
        {toasts.map((toast, index) => {
          // Der oberste Toast liegt vorn; aeltere weichen gestaffelt zurueck.
          const depth = toasts.length - 1 - index;
          return (
            <article
              key={toast.id}
              className={`nox-tss__toast is-${variant}`}
              style={{ '--tss-depth': depth } as React.CSSProperties}
            >
              <div className="nox-tss__body">
                <strong>{toast.title}</strong>
                <span>{toast.body}</span>
              </div>
              <button
                type="button"
                className="nox-tss__close"
                onClick={() => dismiss(toast.id)}
                aria-label={`Meldung schliessen: ${toast.title}`}
              >
                ×
              </button>
              {showProgress && <span className="nox-tss__progress" aria-hidden="true" />}
            </article>
          );
        })}
      </div>
    </div>
  );
}

const CSS = String.raw`
.nox-tss { position:relative; display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,30px); font-family:var(--sans,system-ui,sans-serif); }
.nox-tss__trigger { padding:10px 22px; border-radius:999px; border:1px solid color-mix(in srgb, var(--tss-color) 45%, transparent); background:color-mix(in srgb, var(--tss-color) 12%, transparent); color:#f2ecd9; font:inherit; font-size:13px; font-weight:600; cursor:pointer; transition:background .24s ease; }
.nox-tss__trigger:hover { background:color-mix(in srgb, var(--tss-color) 20%, transparent); }
.nox-tss__trigger:focus-visible { outline:2px solid var(--tss-color); outline-offset:3px; }
.nox-tss__stack { position:absolute; display:flex; flex-direction:column; gap:9px; width:min(302px,72%); perspective:800px; pointer-events:none; }
.nox-tss__stack.is-top-right { top:16px; right:16px; }
.nox-tss__stack.is-top-left { top:16px; left:16px; }
.nox-tss__stack.is-bottom-right { bottom:16px; right:16px; flex-direction:column-reverse; }
.nox-tss__toast { position:relative; display:flex; align-items:flex-start; gap:10px; overflow:hidden; padding:12px 13px; border-radius:12px; border:1px solid rgba(236,231,219,.1); background:rgba(18,17,19,.94); backdrop-filter:blur(9px); box-shadow:0 14px 30px rgb(0 0 0 / .45); pointer-events:auto; transform-origin:center; animation:nox-tss-in var(--tss-enter) cubic-bezier(.22,1.2,.36,1) both; }
/* Aeltere Meldungen weichen in die Tiefe, statt einfach nach unten zu rutschen. */
.nox-tss__toast { transform:translateZ(calc(var(--tss-depth) * -26px)) scale(calc(1 - var(--tss-depth) * .035)); opacity:calc(1 - var(--tss-depth) * .16); transition:transform var(--tss-enter) cubic-bezier(.22,1,.36,1), opacity var(--tss-enter) ease; }
.nox-tss__stack.is-top-left .nox-tss__toast { animation-name:nox-tss-in-left; }
@keyframes nox-tss-in { from { transform:translateX(120%); opacity:0; } }
@keyframes nox-tss-in-left { from { transform:translateX(-120%); opacity:0; } }
.nox-tss__body { display:grid; gap:3px; flex:1 1 auto; }
.nox-tss__body strong { color:#f2ece1; font-size:12.5px; font-weight:650; }
.nox-tss__body span { color:rgba(236,231,219,.5); font-size:11.5px; line-height:1.45; }
.nox-tss__toast.is-success { border-left:2px solid var(--tss-color); }
.nox-tss__toast.is-error { border-left:2px solid #d8564f; }
.nox-tss__toast.is-info { border-left:2px solid #5aa9d8; }
.nox-tss__close { flex:0 0 auto; width:20px; height:20px; padding:0; border:0; border-radius:6px; background:transparent; color:rgba(236,231,219,.4); font-size:15px; line-height:1; cursor:pointer; }
.nox-tss__close:hover { color:#f2ece1; }
.nox-tss__close:focus-visible { outline:2px solid var(--tss-color); outline-offset:1px; }
/* Der Balken laeuft genau so lange wie die Meldung lebt. */
.nox-tss__progress { position:absolute; left:0; right:0; bottom:0; height:2px; background:var(--tss-color); transform-origin:left; animation:nox-tss-progress var(--tss-life) linear forwards; }
@keyframes nox-tss-progress { from { transform:scaleX(1); } to { transform:scaleX(0); } }
@media (prefers-reduced-motion:reduce) {
  .nox-tss__toast { animation:none; transition:none; }
  .nox-tss__progress { animation-duration:var(--tss-life); }
}
`;

export default ToastStackSlide;
