import { useCallback, useRef } from 'react';
import type React from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useHoverCapable } from '../cursor/cursorShared';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// MagneticFieldCards — NOX Cards DNA.
// Karten weichen dem Zeiger aus oder ziehen ihn an: innerhalb eines Radius
// bekommt jede Karte einen Versatz Richtung Cursor, dessen Staerke mit der
// Entfernung abfaellt. Das Zurueckfedern uebernimmt eine CSS-Transition mit
// Overshoot — dadurch braucht es keine Tween-Bibliothek und keine Dauerschleife.
// Die Transforms werden direkt im Pointer-Handler gesetzt statt in einer
// rAF-Schleife: Pointer-Events kommen ohnehin nur bei Bewegung, ein Loop wuerde
// auch bei stillem Zeiger weiterlaufen.
// ---------------------------------------------------------------------------

export interface MagneticFieldCardsProps {
  /** Wirkradius in px. */
  radius?: number;
  /** Staerke des Versatzes. */
  strength?: number;
  /** Anziehen oder abstossen. */
  polarity?: 'attract' | 'repel';
  /** Karten leicht zum Zeiger kippen. */
  tilt?: boolean;
  /** Anzahl der Karten. */
  count?: number;
  /** Akzentfarbe. */
  color?: string;
}

const LABELS = ['Analyse', 'Konzept', 'Aufbau', 'Motion', 'Test', 'Launch', 'Betrieb', 'Ausbau'];

export function MagneticFieldCards({
  radius = 190,
  strength = 0.55,
  polarity = 'attract',
  tilt = true,
  count = 6,
  color = NOX_COLORS.gold,
}: MagneticFieldCardsProps) {
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const total = clamp(Math.round(count), 2, 8);
  const reach = clamp(radius, 60, 400);
  const power = clamp(strength, 0, 1);
  const direction = polarity === 'repel' ? -1 : 1;

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reduced || !hoverCapable) return;
      for (const card of cardRefs.current) {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy);
        if (distance > reach) {
          card.style.transform = '';
          continue;
        }
        // Staerke faellt linear mit der Entfernung — nah wirkt es kraeftig,
        // am Rand des Radius laeuft es sanft aus.
        const falloff = (1 - distance / reach) * power * direction;
        const offsetX = dx * falloff * 0.42;
        const offsetY = dy * falloff * 0.42;
        const rotateY = tilt ? dx * falloff * 0.035 : 0;
        const rotateX = tilt ? -dy * falloff * 0.035 : 0;
        card.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      }
    },
    [reduced, hoverCapable, reach, power, direction, tilt],
  );

  const release = useCallback(() => {
    for (const card of cardRefs.current) {
      if (card) card.style.transform = '';
    }
  }, []);

  const style = { '--mfc-color': color } as React.CSSProperties;

  return (
    <div
      ref={gridRef}
      className="nox-mfc"
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={release}
    >
      <style>{CSS}</style>
      <div className="nox-mfc__grid">
        {Array.from({ length: total }, (_, index) => (
          <article
            key={index}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            className="nox-mfc__card"
          >
            <span className="nox-mfc__index">{String(index + 1).padStart(2, '0')}</span>
            <strong>{LABELS[index % LABELS.length]}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}

const CSS = String.raw`
.nox-mfc { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,34px); perspective:900px; font-family:var(--sans,system-ui,sans-serif); }
.nox-mfc__grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(104px,1fr)); gap:14px; width:min(470px,100%); transform-style:preserve-3d; }
/* Das Zurueckfedern steckt in dieser Transition — kein Tween im JS noetig. */
.nox-mfc__card { display:grid; align-content:center; justify-items:center; gap:6px; aspect-ratio:1; border-radius:15px; border:1px solid rgba(236,231,219,.09); background:linear-gradient(150deg, rgba(255,255,255,.045), rgba(255,255,255,.012)); transition:transform .5s cubic-bezier(.22,1.4,.4,1), border-color .3s ease, box-shadow .3s ease; will-change:transform; }
.nox-mfc__card:hover { border-color:color-mix(in srgb, var(--mfc-color) 48%, transparent); box-shadow:0 10px 32px rgb(0 0 0 / .4), 0 0 0 1px color-mix(in srgb, var(--mfc-color) 22%, transparent); }
.nox-mfc__index { color:var(--mfc-color); font-size:10px; letter-spacing:.24em; }
.nox-mfc__card strong { color:rgba(236,231,219,.66); font-size:12px; font-weight:600; letter-spacing:.04em; }
@media (prefers-reduced-motion:reduce) {
  .nox-mfc__card { transition:none; transform:none !important; }
}
`;

export default MagneticFieldCards;
