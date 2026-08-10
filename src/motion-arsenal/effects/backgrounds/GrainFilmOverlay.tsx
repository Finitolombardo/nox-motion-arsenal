import type React from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// GrainFilmOverlay — NOX Backgrounds DNA.
// Filmkorn als Overlay-Schicht: eine feTurbulence-Kachel als Data-URI wird in
// acht Schritten versetzt, sodass das Korn springt wie Filmmaterial statt weich
// zu gleiten — deshalb steps() und nicht linear. Dazu zwei driftende
// Lichtflecken fuer den Projektor-Charakter.
// Alles CSS, kein Canvas, kein JS pro Frame. Die Schicht ist rein dekorativ,
// liegt auf pointer-events:none und traegt aria-hidden, damit sie weder Klicks
// abfaengt noch von Screenreadern erwaehnt wird.
// ---------------------------------------------------------------------------

export interface GrainFilmOverlayProps {
  /** Staerke der Koernung. */
  intensity?: number;
  /** Tempo des Kornsprungs. */
  speed?: number;
  /** Driftende Lichtflecken. */
  glow?: boolean;
  /** Farbe der Lichtflecken. */
  glowColor?: string;
  /** Groesse der Kornkachel in px. */
  grainScale?: number;
  /** Vignette an den Raendern. */
  vignette?: boolean;
  // Skilltree-Erweiterungen. Defaults bilden das bisherige Bild exakt ab.
  /** Charakter der Koernung. */
  grainStyle?: 'fine' | 'coarse' | 'vertical' | 'halftone';
  /** Helligkeitsschwankung wie bei einem Projektor. */
  flicker?: number;
  /** Anzahl der driftenden Lichtflecken. */
  blobCount?: number;
}

// Jede Kornsorte ist eine eigene Turbulenz-Kachel. 'fine' ist das Original.
const GRAIN_TILES: Record<string, string> = {
  fine: "%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.62'/%3E%3C/svg%3E",
  coarse: "%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.34' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E",
  vertical: "%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.02 .9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.66'/%3E%3C/svg%3E",
  halftone: "%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Crect width='12' height='12' fill='black'/%3E%3Ccircle cx='6' cy='6' r='2.1' fill='white'/%3E%3C/svg%3E",
};

// Feste Positionen der Lichtflecken. Die ersten beiden sind die urspruenglichen,
// damit der Standard unveraendert bleibt; die weiteren kommen bei Bedarf dazu.
const BLOB_LAYOUT = [
  { name: 'a' },
  { name: 'b' },
  { name: 'c' },
  { name: 'd' },
] as const;

// Vorgerenderte Rauschkachel. Als Data-URI eingebettet, damit die Schicht
// ohne Netzwerkzugriff funktioniert und die CSP nicht aufgeweicht werden muss.
const NOISE_TILE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.62'/%3E%3C/svg%3E";

export function GrainFilmOverlay({
  intensity = 0.5,
  speed = 1,
  glow = true,
  glowColor = NOX_COLORS.gold,
  grainScale = 160,
  vignette = true,
  grainStyle = 'fine',
  flicker = 0,
  blobCount = 2,
}: GrainFilmOverlayProps) {
  const amount = clamp(intensity, 0, 1);
  const tempo = clamp(speed, 0.1, 3);
  const flickerAmount = clamp(flicker, 0, 1);
  const blobs = clamp(Math.round(blobCount), 0, 4);
  const tile = GRAIN_TILES[grainStyle] ?? GRAIN_TILES.fine;

  const style = {
    '--gfo-opacity': (amount * 0.34).toFixed(3),
    // Acht Sprünge pro Zyklus; bei speed 1 ergibt das rund 12 Bilder je Sekunde.
    '--gfo-dur': `${(0.66 / tempo).toFixed(3)}s`,
    // Halftone braucht eine kleine Kachel, sonst wird aus dem Raster ein Muster.
    '--gfo-tile': grainStyle === 'halftone'
      ? `${clamp(grainScale, 60, 400) / 20}px`
      : `${clamp(grainScale, 60, 400)}px`,
    '--gfo-glow': glowColor,
    '--gfo-noise': `url("data:image/svg+xml,${tile}")`,
    '--gfo-flicker-min': (1 - flickerAmount * 0.28).toFixed(3),
    '--gfo-flicker-dur': `${(2.4 / tempo).toFixed(2)}s`,
  } as React.CSSProperties;

  return (
    <div className={`nox-gfo${flickerAmount > 0 ? ' has-flicker' : ''}`} style={style}>
      <style>{CSS}</style>

      <div className="nox-gfo__scene">
        <span className="nox-gfo__title">FILM</span>
        <span className="nox-gfo__sub">Korn, Licht und ein ruhiger Grund</span>
      </div>

      {glow &&
        BLOB_LAYOUT.slice(0, blobs).map((blob, index) => (
          <span
            key={index}
            className={`nox-gfo__blob nox-gfo__blob--${blob.name}`}
            aria-hidden="true"
          />
        ))}
      <span className="nox-gfo__grain" aria-hidden="true" />
      {vignette && <span className="nox-gfo__vignette" aria-hidden="true" />}
    </div>
  );
}

const CSS = String.raw`
.nox-gfo { position:relative; width:100%; height:100%; overflow:hidden; background:linear-gradient(150deg,#0c0b0d,#08080a 55%,#050506); font-family:var(--sans,system-ui,sans-serif); }
.nox-gfo__scene { position:absolute; inset:0; display:grid; place-content:center; justify-items:center; gap:9px; text-align:center; }
.nox-gfo__title { font-size:clamp(2.2rem,8vw,5rem); font-weight:780; letter-spacing:.18em; color:rgba(242,236,226,.9); }
.nox-gfo__sub { color:rgba(236,231,219,.32); font-size:11px; letter-spacing:.24em; text-transform:uppercase; }
/* steps() laesst das Korn springen — linear wuerde es weich gleiten lassen
   und damit nach Nebel aussehen statt nach Film. */
.nox-gfo__grain { position:absolute; inset:-100%; z-index:3; pointer-events:none; background-image:var(--gfo-noise); background-size:var(--gfo-tile) var(--gfo-tile); opacity:var(--gfo-opacity); animation:nox-gfo-grain var(--gfo-dur) steps(1,end) infinite; }
@keyframes nox-gfo-grain {
  0%   { transform:translate3d(0,0,0); }
  12%  { transform:translate3d(-2%,-3%,0); }
  25%  { transform:translate3d(-4%,2%,0); }
  37%  { transform:translate3d(3%,-1%,0); }
  50%  { transform:translate3d(-1%,4%,0); }
  62%  { transform:translate3d(4%,1%,0); }
  75%  { transform:translate3d(-3%,-2%,0); }
  87%  { transform:translate3d(1%,3%,0); }
}
.nox-gfo__blob { position:absolute; z-index:2; border-radius:50%; pointer-events:none; filter:blur(58px); opacity:.3; background:radial-gradient(circle, color-mix(in srgb, var(--gfo-glow) 62%, transparent), transparent 68%); }
.nox-gfo__blob--a { width:46%; aspect-ratio:1; top:-8%; left:-6%; animation:nox-gfo-drift-a 19s ease-in-out infinite alternate; }
.nox-gfo__blob--b { width:38%; aspect-ratio:1; bottom:-10%; right:-4%; animation:nox-gfo-drift-b 23s ease-in-out infinite alternate; }
.nox-gfo__blob--c { width:30%; aspect-ratio:1; top:34%; right:-12%; opacity:.22; animation:nox-gfo-drift-a 27s ease-in-out infinite alternate-reverse; }
.nox-gfo__blob--d { width:26%; aspect-ratio:1; bottom:22%; left:-10%; opacity:.2; animation:nox-gfo-drift-b 31s ease-in-out infinite alternate-reverse; }
@keyframes nox-gfo-drift-a { to { transform:translate3d(22%,16%,0) scale(1.18); } }
@keyframes nox-gfo-drift-b { to { transform:translate3d(-18%,-14%,0) scale(1.24); } }
/* Projektor-Flackern: eine leichte, unregelmaessige Helligkeitsschwankung
   ueber der ganzen Szene. Bei flicker 0 ist die Untergrenze 1 — also nichts. */
.nox-gfo.has-flicker .nox-gfo__scene { animation:nox-gfo-flicker var(--gfo-flicker-dur) steps(1,end) infinite; }
@keyframes nox-gfo-flicker {
  0%, 100% { opacity:1; }
  17% { opacity:var(--gfo-flicker-min); }
  34% { opacity:1; }
  51% { opacity:calc(var(--gfo-flicker-min) + (1 - var(--gfo-flicker-min)) * .45); }
  68% { opacity:1; }
  85% { opacity:var(--gfo-flicker-min); }
}
.nox-gfo__vignette { position:absolute; inset:0; z-index:4; pointer-events:none; box-shadow:inset 0 0 110px 26px rgb(0 0 0 / .72); }
@media (prefers-reduced-motion:reduce) {
  .nox-gfo__grain { animation:none; }
  .nox-gfo__blob { animation:none; }
  .nox-gfo.has-flicker .nox-gfo__scene { animation:none; }
}
`;

export default GrainFilmOverlay;
