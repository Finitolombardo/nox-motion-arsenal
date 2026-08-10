import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// AccordionCards — NOX Cards DNA.
// Gestapelte Panels, immer nur eines offen. Die Höhe animiert über einen
// Grid-Track (0fr → 1fr): der Browser interpoliert die Content-Höhe selbst,
// also kein Messen per JS und kein height-Hack mit Magic Numbers. JS hält nur
// den offenen Index. Als echtes Disclosure-Pattern gebaut — native Buttons,
// aria-expanded und aria-controls, damit Tastatur und Screenreader den Zustand
// sehen und nicht nur die Animation.
// ---------------------------------------------------------------------------

export interface AccordionCardItem {
  title: string;
  content: string;
}

export interface AccordionCardsProps {
  /** Panels; leer lässt das Demo-Set laufen. */
  items?: AccordionCardItem[];
  /** Anfangs offenes Panel (-1 = alle zu). */
  openIndex?: number;
  /** Tempo der Höhenanimation. */
  speed?: number;
  /** Gold-Akzent für Rahmen und Glow. */
  accent?: string;
  /** Offenes Panel per Klick wieder schließbar. */
  collapsible?: boolean;
}

const DEMO_ITEMS: AccordionCardItem[] = [
  {
    title: 'Wie läuft die Zusammenarbeit ab?',
    content:
      'Kickoff, Systemaufnahme, Umsetzung in Etappen. Nach jeder Etappe steht ein lauffähiger Stand, den Sie im Betrieb prüfen können — kein Big Bang am Ende.',
  },
  {
    title: 'Was kostet ein Motion-System?',
    content:
      'Der Rahmen richtet sich nach der Zahl der Flächen und der Tiefe der Interaktion. Ein Signature-Hero mit drei Sektionen liegt üblicherweise im mittleren vierstelligen Bereich.',
  },
  {
    title: 'Wie schnell ist das live?',
    content:
      'Erste Sektion nach zwei Wochen, vollständiges System je nach Umfang nach vier bis acht. Die Etappen sind so geschnitten, dass jederzeit ausgeliefert werden kann.',
  },
  {
    title: 'Läuft das auch auf schwachen Geräten?',
    content:
      'Jeder Effekt hat ein Performance-Budget und eine Reduced-Motion-Fassung. Auf schwacher Hardware greift automatisch die ruhige Variante — die Aussage bleibt, die Last fällt weg.',
  },
];

export function AccordionCards({
  items,
  openIndex = 0,
  speed = 1,
  accent = NOX_COLORS.gold,
  collapsible = false,
}: AccordionCardsProps) {
  const reduced = usePrefersReducedMotion();
  const panels = items?.length ? items : DEMO_ITEMS;
  const [open, setOpen] = useState(() => clamp(Math.round(openIndex), -1, panels.length - 1));

  // Externe Steuerung aus dem PropsPanel nachziehen.
  useEffect(() => {
    setOpen(clamp(Math.round(openIndex), -1, panels.length - 1));
  }, [openIndex, panels.length]);

  const duration = useMemo(
    () => `${clamp(0.32 / clamp(speed, 0.1, 3), 0.06, 2).toFixed(3)}s`,
    [speed],
  );

  const style = {
    '--acc-accent': accent,
    '--acc-dur': reduced ? '0s' : duration,
  } as React.CSSProperties;

  return (
    <div className="nox-acc" style={style}>
      <style>{CSS}</style>
      {panels.map((item, index) => {
        const isOpen = open === index;
        const panelId = `nox-acc-panel-${index}`;
        const headId = `nox-acc-head-${index}`;
        return (
          <section key={`${item.title}-${index}`} className={`nox-acc__panel${isOpen ? ' is-open' : ''}`}>
            <h3 className="nox-acc__title">
              <button
                id={headId}
                type="button"
                className="nox-acc__head"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(collapsible && isOpen ? -1 : index)}
              >
                <span>{item.title}</span>
                <span className="nox-acc__chev" aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={headId} className="nox-acc__body">
              <div className="nox-acc__inner">
                <p>{item.content}</p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

const CSS = String.raw`
.nox-acc { width:100%; max-width:640px; margin:0 auto; padding:clamp(12px,3vw,26px); font-family:var(--sans,system-ui,sans-serif); }
.nox-acc__panel { margin-bottom:10px; overflow:hidden; border-radius:14px; border:1px solid color-mix(in srgb, var(--acc-accent) 22%, transparent); background:color-mix(in srgb, #161618 92%, transparent); transition:border-color var(--acc-dur) ease, box-shadow var(--acc-dur) ease; }
.nox-acc__panel.is-open { border-color:color-mix(in srgb, var(--acc-accent) 65%, transparent); box-shadow:0 0 0 1px color-mix(in srgb, var(--acc-accent) 25%, transparent), 0 14px 34px rgb(0 0 0 / .45); }
.nox-acc__title { margin:0; font-size:inherit; font-weight:inherit; }
.nox-acc__head { display:flex; align-items:center; justify-content:space-between; gap:14px; width:100%; padding:16px 18px; border:0; background:transparent; color:#ece7db; font:inherit; font-size:14px; font-weight:600; text-align:left; cursor:pointer; }
.nox-acc__head:focus-visible { outline:2px solid var(--acc-accent); outline-offset:-3px; border-radius:13px; }
.nox-acc__chev { position:relative; flex:0 0 auto; width:11px; height:11px; border-right:1.5px solid var(--acc-accent); border-bottom:1.5px solid var(--acc-accent); transform:rotate(45deg); transition:transform var(--acc-dur) ease; }
.nox-acc__panel.is-open .nox-acc__chev { transform:rotate(225deg); }
/* Der 0fr→1fr-Track ist der eigentliche Trick: die Content-Höhe muss nie gemessen werden. */
.nox-acc__body { display:grid; grid-template-rows:0fr; transition:grid-template-rows var(--acc-dur) cubic-bezier(.22,1,.36,1); }
.nox-acc__panel.is-open .nox-acc__body { grid-template-rows:1fr; }
.nox-acc__inner { min-height:0; overflow:hidden; padding:0 18px; }
.nox-acc__inner p { margin:0; padding-bottom:18px; color:rgba(236,231,219,.62); font-size:13px; line-height:1.65; }
@media (prefers-reduced-motion:reduce) { .nox-acc__body, .nox-acc__chev, .nox-acc__panel { transition:none; } }
`;

export default AccordionCards;
