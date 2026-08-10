import type React from 'react';
import { clamp } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// TerminalTypewriterHover — NOX System DNA.
// Log-Zeilen, die sich beim Hover Zeichen fuer Zeichen selbst tippen. Die
// Animation laeuft ueber die Breite in ch-Einheiten mit steps(), sodass genau
// ein Zeichen pro Schritt erscheint — kein JS-Intervall, kein Timer.
// Die Zeilen stehen vollstaendig im DOM: wer nicht hovert oder mit Tastatur
// navigiert, sieht denselben Text, nur ohne Tippbewegung.
// ---------------------------------------------------------------------------

export interface TerminalTypewriterHoverProps {
  /** Zeilen, mit | getrennt. */
  lines?: string;
  /** Tipp-Tempo. */
  speed?: number;
  /** Blinkender Cursor am Zeilenende. */
  cursor?: boolean;
  /** Farbe des Prompts und Cursors. */
  color?: string;
  /** Farbe des Zeilentexts. */
  textColor?: string;
  /** Zeichen vor jeder Zeile. */
  prompt?: string;
  /** Zeilen dauerhaft getippt zeigen statt erst bei Hover. */
  alwaysOn?: boolean;
}

export function TerminalTypewriterHover({
  lines = 'scan --target arsenal --deep|resolving 285 effects …|contract check: 0 violations|deploy ready',
  speed = 1,
  cursor = true,
  color = NOX_COLORS.gold,
  textColor = '#d8d2c6',
  prompt = '›',
  alwaysOn = false,
}: TerminalTypewriterHoverProps) {
  const list = lines.split('|').map((line) => line.trim()).filter(Boolean);
  const tempo = clamp(speed, 0.1, 3);

  const style = {
    '--ttw-color': color,
    '--ttw-text': textColor,
  } as React.CSSProperties;

  return (
    <div className={`nox-ttw${alwaysOn ? ' is-always' : ''}`} style={style}>
      <style>{CSS}</style>
      <div className="nox-ttw__frame">
        <div className="nox-ttw__bar" aria-hidden="true">
          <span /><span /><span />
        </div>
        <ul className="nox-ttw__lines">
          {list.map((line, index) => (
            <li key={`${line}-${index}`} className="nox-ttw__row" tabIndex={0}>
              <span className="nox-ttw__prompt" aria-hidden="true">
                {prompt}
              </span>
              <span
                className={`nox-ttw__type${cursor ? ' has-cursor' : ''}`}
                style={
                  {
                    // Breite in ch und Schrittzahl gleich der Zeichenzahl:
                    // so erscheint exakt ein Zeichen pro Schritt.
                    '--ttw-chars': line.length,
                    '--ttw-dur': `${(line.length * 0.045 / tempo).toFixed(3)}s`,
                  } as React.CSSProperties
                }
              >
                {line}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const CSS = String.raw`
.nox-ttw { display:grid; place-items:center; width:100%; height:100%; padding:clamp(16px,4vw,32px); font-family:var(--mono,monospace); }
.nox-ttw__frame { width:min(470px,100%); overflow:hidden; border-radius:11px; border:1px solid rgba(236,231,219,.1); background:rgba(10,10,12,.92); }
.nox-ttw__bar { display:flex; gap:6px; padding:10px 13px; border-bottom:1px solid rgba(236,231,219,.07); }
.nox-ttw__bar span { width:9px; height:9px; border-radius:50%; background:rgba(236,231,219,.13); }
.nox-ttw__bar span:first-child { background:color-mix(in srgb, var(--ttw-color) 55%, transparent); }
.nox-ttw__lines { display:grid; gap:7px; margin:0; padding:15px 14px 17px; list-style:none; }
.nox-ttw__row { display:flex; align-items:baseline; gap:8px; font-size:12.5px; line-height:1.5; }
.nox-ttw__row:focus-visible { outline:2px solid var(--ttw-color); outline-offset:3px; border-radius:4px; }
.nox-ttw__prompt { flex:0 0 auto; color:var(--ttw-color); }
/* Ohne Hover steht die Zeile vollstaendig da — der Text ist nie versteckt. */
.nox-ttw__type { position:relative; display:inline-block; overflow:hidden; white-space:nowrap; color:var(--ttw-text); }
.nox-ttw__row:hover .nox-ttw__type,
.nox-ttw__row:focus-visible .nox-ttw__type,
.nox-ttw.is-always .nox-ttw__type { width:calc(var(--ttw-chars) * 1ch); animation:nox-ttw-type var(--ttw-dur) steps(var(--ttw-chars),end) 1 both; }
@keyframes nox-ttw-type { from { width:0; } to { width:calc(var(--ttw-chars) * 1ch); } }
.nox-ttw__type.has-cursor::after { content:''; position:absolute; right:-2px; top:.14em; width:7px; height:1em; background:var(--ttw-color); opacity:0; }
.nox-ttw__row:hover .has-cursor::after,
.nox-ttw__row:focus-visible .has-cursor::after,
.nox-ttw.is-always .has-cursor::after { animation:nox-ttw-blink .9s steps(1,end) infinite; }
@keyframes nox-ttw-blink { 0%,49% { opacity:1; } 50%,100% { opacity:0; } }
@media (prefers-reduced-motion:reduce) {
  .nox-ttw__type { width:auto !important; animation:none !important; }
  .has-cursor::after { animation:none !important; opacity:1; }
}
`;

export default TerminalTypewriterHover;
