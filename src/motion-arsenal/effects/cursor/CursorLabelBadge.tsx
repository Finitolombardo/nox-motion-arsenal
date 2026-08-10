import { useRef, useState } from 'react';
import type React from 'react';
import { clamp, lerp, useRafLoop, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useHoverCapable } from './cursorShared';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// CursorLabelBadge — NOX Cursor DNA.
// Eine kleine Gold-Badge folgt dem Zeiger und wechselt ihre Beschriftung je
// nachdem, worueber er steht. Die Position wird per Lerp nachgezogen, damit die
// Badge dem Zeiger nachfedert statt an ihm zu kleben — das ist der ganze
// Unterschied zwischen "Cursor mit Anhaengsel" und "etwas, das reagiert".
// Die rAF-Schleife laeuft nur, solange der Zeiger im Feld ist, und gar nicht
// auf Touch-Geraeten: dort gibt es keinen Hover-Zustand, den man begleiten
// koennte. Die Badge ist rein dekorativ und deshalb aria-hidden — die Labels
// stehen zusaetzlich sichtbar an den Kacheln.
// ---------------------------------------------------------------------------

export interface CursorLabelBadgeProps {
  /** Labels der Kacheln, mit / getrennt. */
  labels?: string;
  /** Groesse der Badge. */
  size?: number;
  /** Wie schnell die Badge nachzieht. */
  speed?: number;
  /** Farbe der Badge. */
  color?: string;
  /** Badge-Form. */
  shape?: 'pill' | 'circle' | 'square';
}

export function CursorLabelBadge({
  labels = 'View / Drag / Explore',
  size = 0.6,
  speed = 1,
  color = NOX_COLORS.gold,
  shape = 'pill',
}: CursorLabelBadgeProps) {
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const stageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const [label, setLabel] = useState<string | null>(null);

  const tiles = labels.split('/').map((t) => t.trim()).filter(Boolean);
  const follow = clamp(speed, 0.1, 3);
  const scale = clamp(size, 0.3, 1.5);

  // Nur laufen, wenn es etwas zu begleiten gibt.
  const running = hoverCapable && !reduced && label !== null;

  useRafLoop(() => {
    const badge = badgeRef.current;
    if (!badge) return;
    // Zeitunabhaengig genug fuer eine Verfolgung; bei 60fps ergibt das eine
    // spuerbare, aber nicht traege Verzoegerung.
    const t = clamp(0.12 * follow, 0, 1);
    current.current.x = lerp(current.current.x, target.current.x, t);
    current.current.y = lerp(current.current.y, target.current.y, t);
    badge.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
  }, running);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    target.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onEnterTile = (text: string, event: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    // Beim ersten Auftauchen ohne Nachziehen setzen, sonst fliegt die Badge
    // aus der Ecke heran.
    if (label === null) {
      current.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      target.current = { ...current.current };
    }
    setLabel(text);
  };

  const style = {
    '--clb-color': color,
    '--clb-scale': scale,
  } as React.CSSProperties;

  return (
    <div
      ref={stageRef}
      className="nox-clb"
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setLabel(null)}
    >
      <style>{CSS}</style>

      <div className="nox-clb__grid">
        {tiles.map((tile, index) => (
          <div
            key={`${tile}-${index}`}
            className="nox-clb__tile"
            onPointerEnter={(event) => onEnterTile(tile, event)}
          >
            <span className="nox-clb__tile-label">{tile}</span>
          </div>
        ))}
      </div>

      {hoverCapable && !reduced && (
        <div
          ref={badgeRef}
          className={`nox-clb__badge is-${shape}${label ? ' is-visible' : ''}`}
          aria-hidden="true"
        >
          {label}
        </div>
      )}

      {!hoverCapable && (
        <p className="nox-clb__note">Auf Touch-Geraeten ohne Zeiger: die Labels stehen direkt an den Flaechen.</p>
      )}
    </div>
  );
}

const CSS = String.raw`
.nox-clb { position:relative; display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,34px); overflow:hidden; font-family:var(--sans,system-ui,sans-serif); cursor:crosshair; }
.nox-clb__grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(112px,1fr)); gap:12px; width:min(520px,100%); }
.nox-clb__tile { display:grid; place-items:center; aspect-ratio:4/3; border-radius:13px; border:1px solid rgba(236,231,219,.09); background:rgba(255,255,255,.022); transition:border-color .28s ease, background .28s ease; }
.nox-clb__tile:hover { border-color:color-mix(in srgb, var(--clb-color) 42%, transparent); background:color-mix(in srgb, var(--clb-color) 6%, transparent); }
.nox-clb__tile-label { color:rgba(236,231,219,.34); font-size:11px; letter-spacing:.2em; text-transform:uppercase; }
.nox-clb__badge { position:absolute; top:0; left:0; z-index:5; display:grid; place-items:center; min-width:62px; padding:7px 15px; border-radius:999px; background:linear-gradient(100deg, var(--clb-color), color-mix(in srgb, var(--clb-color) 55%, #fff)); color:#14100a; font-size:12px; font-weight:700; letter-spacing:.05em; white-space:nowrap; pointer-events:none; opacity:0; transition:opacity .2s ease; will-change:transform; }
.nox-clb__badge.is-visible { opacity:1; }
.nox-clb__badge.is-circle { min-width:0; width:66px; height:66px; padding:0; border-radius:50%; }
.nox-clb__badge.is-square { border-radius:8px; }
.nox-clb__note { position:absolute; bottom:12px; margin:0; color:rgba(236,231,219,.3); font-size:10.5px; }
@media (prefers-reduced-motion:reduce) {
  .nox-clb__tile, .nox-clb__badge { transition:none; }
}
`;

export default CursorLabelBadge;
