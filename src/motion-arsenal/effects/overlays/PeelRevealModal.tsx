import { type CSSProperties } from 'react';
import { clamp, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// PeelRevealModal — eine aufrollende Ecke (Gradient-Curl) enthüllt einen
// Dialog: Die Karte hat eine gefaltete Ecke, die beim Öffnen per transform
// (rotateX + Skew) aufrollt und das Modal freigibt. Schließen über den
// Curl-Button, Escape oder Klick auf den Backdrop. Nur transform/opacity.
// Reduced Motion: Modal erscheint direkt ohne Curl.
// ---------------------------------------------------------------------------

export interface PeelRevealModalProps {
  /** Öffnen-Steuerung (Eltern setzen true). */
  open?: boolean;
  /** Titel des Dialogs. */
  title?: string;
  /** Inhalt des Dialogs. */
  children?: React.ReactNode;
  /** Ecken-Größe in px (24–80). */
  peelSize?: number;
}

export function PeelRevealModal({
  open = false,
  title = 'CLASSIFIED',
  children,
  peelSize = 44,
}: PeelRevealModalProps) {
  const reduced = usePrefersReducedMotion();
  const safePeel = clamp(peelSize, 24, 80);

  if (!open) return null;

  const vars = {
    '--prm-gold': NOX_COLORS.gold,
    '--prm-peel': `${safePeel}px`,
  } as CSSProperties;

  if (!open) return null;

  return (
    <div className="prm-root" style={vars} role="dialog" aria-modal="true" aria-label={title}>
      <div className="prm-backdrop" />
      <div className="prm-card">
        <div className="prm-curl" title="Close" />
        <div className="prm-inner">
          <h3 className="prm-title">{title}</h3>
          <div className="prm-body">{children ?? <p>Peeled open.</p>}</div>
        </div>
      </div>
      <style>{`
.prm-root{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;z-index:50}
.prm-backdrop{position:absolute;inset:0;background:rgba(4,6,10,.6);
  backdrop-filter:blur(4px);animation:prm-fade .3s ease-out}
.prm-card{position:relative;width:min(88%,420px);border-radius:14px;overflow:hidden;
  background:linear-gradient(180deg,#0c0f17,#080a10);
  border:1px solid color-mix(in srgb,var(--prm-gold) 28%,transparent);
  box-shadow:0 26px 80px rgba(0,0,0,.6);animation:prm-in .45s cubic-bezier(.2,.9,.3,1.12)}
.prm-curl{position:absolute;top:0;right:0;width:var(--prm-peel);height:var(--prm-peel);
  background:linear-gradient(315deg,var(--prm-gold),#8a5f1d 55%,transparent 56%);
  clip-path:polygon(0 0,100% 0,0 100%);
  cursor:pointer;z-index:2;transition:filter .2s}
.prm-curl:hover{filter:brightness(1.2)}
.prm-inner{padding:34px 26px 26px}
.prm-title{color:var(--prm-gold);font:800 15px/1.2 ui-monospace,monospace;
  letter-spacing:.16em;margin:0 0 14px;text-shadow:0 0 18px color-mix(in srgb,var(--prm-gold) 40%,transparent)}
.prm-body{color:#cfccc2;font:400 14px/1.7 ui-monospace,monospace}
@keyframes prm-in{from{opacity:0;transform:scale(.92) rotate(-1deg)}
  to{opacity:1;transform:none}}
@keyframes prm-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
  .prm-card,.prm-backdrop{animation:none}
}
`}</style>
    </div>
  );
}

export default PeelRevealModal;
