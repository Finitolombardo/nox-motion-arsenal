import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// GSAPFlipGalleryMorph — Galerie-Kachel wächst per FLIP in den Detail-View:
// First/Last/Invert/Play mit transform-only (scale+translate), Fokus-
// Dialog-Fallback (role=dialog + aria-modal, Escape schließt). Implementiert
// ohne GSAP-Library — reines FLIP, deterministische Kachel-Farben.
// Reduced Motion: Detail-View erscheint ohne Morph.
// ---------------------------------------------------------------------------

export interface GSAPFlipGalleryMorphProps {
  /** Kachel-Titel. */
  tiles?: string[];
  /** Deterministischer Seed. */
  seed?: number;
}

const DEFAULT_TILES = ['SIGNAL 01', 'SIGNAL 02', 'SIGNAL 03', 'SIGNAL 04', 'SIGNAL 05', 'SIGNAL 06'];

export function GSAPFlipGalleryMorph({
  tiles = DEFAULT_TILES,
  seed = 20260810,
}: GSAPFlipGalleryMorphProps) {
  const [active, setActive] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const rng = useMemo(() => seededRandom(seed), [seed]);
  const hues = useMemo(
    () => Array.from({ length: tiles.length }, () => Math.floor(rng() * 360)),
    [tiles.length, rng]
  );

  const open = (i: number) => {
    if (active !== null) return;
    setActive(i);
    // FLIP nach dem Rendern des Detail-Views.
    requestAnimationFrame(() => {
      const from = gridRef.current?.children[i] as HTMLElement | undefined;
      const to = overlayRef.current;
      if (!from || !to || reduced) return;
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const sx = a.width / b.width;
      const sy = a.height / b.height;
      const tx = a.left - b.left;
      const ty = a.top - b.top;
      to.animate(
        [
          { transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`, borderRadius: '12px' },
          { transform: 'translate(0, 0) scale(1, 1)', borderRadius: '0px' },
        ],
        { duration: reduced ? 0 : 480, easing: 'cubic-bezier(.2,.9,.3,1.05)' }
      );
    });
  };

  const close = () => {
    setActive(null);
  };

  const vars = {
    '--gfm-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div className="gfm-root" style={vars}>
      <div ref={gridRef} className="gfm-grid">
        {tiles.map((t, i) => (
          <button
            key={i}
            type="button"
            className="gfm-tile"
            style={{ background: `linear-gradient(150deg, hsl(${hues[i]} 45% 16%), #0a0c10 70%)` }}
            onClick={() => open(i)}
            aria-label={`${t} öffnen`}
          >
            <span className="gfm-tile-label">{t}</span>
            <span className="gfm-tile-idx">{String(i + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className="gfm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={tiles[active]}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          onKeyDown={(e) => e.key === 'Escape' && close()}
        >
          <div className="gfm-backdrop" />
          <div
            ref={overlayRef}
            className="gfm-detail"
            style={{ background: `linear-gradient(160deg, hsl(${hues[active]} 45% 22%), #0a0c10 75%)` }}
            tabIndex={-1}
          >
            <span className="gfm-detail-idx">{String(active + 1).padStart(2, '0')}</span>
            <h3 className="gfm-detail-title">{tiles[active]}</h3>
            <p className="gfm-detail-body">
              Deterministic FLIP morph — no library. Esc or backdrop closes.
            </p>
            <button type="button" className="gfm-close" onClick={close} aria-label="Schließen">
              ✕
            </button>
          </div>
        </div>
      )}

      <style>{`
.gfm-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.gfm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;
  width:min(86%,520px)}
.gfm-tile{position:relative;aspect-ratio:1;border:1px solid rgba(255,255,255,.1);
  border-radius:12px;cursor:pointer;display:grid;place-items:center;overflow:hidden;
  transition:border-color .2s,transform .15s}
.gfm-tile:hover{border-color:color-mix(in srgb,var(--gfm-gold) 55%,transparent);
  transform:translateY(-2px)}
.gfm-tile-label{color:#e8e6de;font:700 11px/1.3 ui-monospace,monospace;letter-spacing:.1em}
.gfm-tile-idx{position:absolute;top:8px;right:10px;color:var(--gfm-gold);
  font:600 9px/1 ui-monospace,monospace}
.gfm-overlay{position:absolute;inset:0;display:grid;place-items:center;z-index:50}
.gfm-backdrop{position:absolute;inset:0;background:rgba(4,6,10,.65);
  backdrop-filter:blur(4px);animation:gfm-fade .25s ease-out}
.gfm-detail{position:relative;width:min(86%,460px);min-height:300px;border-radius:0;
  border:1px solid color-mix(in srgb,var(--gfm-gold) 32%,transparent);
  box-shadow:0 30px 90px rgba(0,0,0,.6);padding:30px;display:flex;
  flex-direction:column;justify-content:flex-end;will-change:transform}
.gfm-detail-idx{position:absolute;top:18px;left:22px;color:var(--gfm-gold);
  font:700 12px/1 ui-monospace,monospace;letter-spacing:.2em}
.gfm-detail-title{color:#fff;font:800 24px/1.2 ui-monospace,monospace;letter-spacing:.08em;
  margin:0 0 10px;text-shadow:0 0 24px color-mix(in srgb,var(--gfm-gold) 45%,transparent)}
.gfm-detail-body{color:#cfccc2;font:400 13px/1.6 ui-monospace,monospace;margin:0;max-width:34ch}
.gfm-close{position:absolute;top:14px;right:16px;background:none;border:none;color:#cfccc2;
  font-size:16px;cursor:pointer;transition:color .2s}
.gfm-close:hover{color:var(--gfm-gold)}
@keyframes gfm-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
  .gfm-backdrop{animation:none}
  .gfm-detail{animation:gfm-pop .2s ease-out}
}
@keyframes gfm-pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
`}</style>
    </div>
  );
}

export default GSAPFlipGalleryMorph;
