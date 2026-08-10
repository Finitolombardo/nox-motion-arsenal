import type React from 'react';

/**
 * Exact scroll-driven shader structure from Christian Alder's CodePen:
 * https://codepen.io/HejChristian/pen/YPzLbYX
 *
 * The author-hosted base/mask assets remain external so their attribution and
 * provenance stay intact. `background-attachment: fixed` is deliberately
 * retained: it is the mechanism that makes the shader move while the page
 * scrolls, rather than merely animating a gradient in place.
 */

export interface HolographicMaskShaderProps {
  // Skilltree-Erweiterungen. Die Struktur des Shaders und die externen Assets
  // bleiben unberuehrt — geregelt wird nur die Farbschicht darueber. Alle
  // Defaults ergeben exakt das bisherige Bild.
  palette?: 'spectrum' | 'gold' | 'ice' | 'ember' | 'mono'; // Farbfamilie der Interferenz
  gradientAngle?: number; // 0..360 — Richtung des Farbverlaufs
  saturation?: number; // 0..100 — Sattheit der Farbbaender
  lightness?: number; // 20..80 — Grundhelligkeit der Farbbaender
  blendMode?: 'color-dodge' | 'screen' | 'overlay' | 'hard-light'; // Aufbringen der Farbschicht
  showNote?: boolean; // Bildunterschrift einblenden
  // Skilltree-Erweiterungen. Defaults ergeben exakt das bisherige Bild.
  motion?: 'scroll' | 'drift' | 'static'; // Was den Schimmer antreibt
  bandCount?: number; // 3..26 — Zahl der Farbbaender
  contrast?: number; // 0..1 — Trennschaerfe zwischen den Baendern
}

// Jede Palette ist eine Liste von Farbtonwinkeln. Saettigung und Helligkeit
// kommen aus den Props, damit alle Paletten gleich reagieren.
const PALETTES: Record<string, number[]> = {
  spectrum: [359, 16, 33, 45, 58, 58, 58, 96, 146, 183, 225, 265, 303],
  gold: [28, 34, 40, 45, 48, 45, 40, 36, 30, 26, 34, 42, 48],
  ice: [188, 196, 204, 210, 218, 224, 210, 200, 192, 186, 198, 208, 216],
  ember: [4, 10, 16, 22, 28, 20, 12, 6, 2, 8, 14, 20, 26],
  mono: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

// Die Original-Rampe laeuft in der Helligkeit von 40 auf 70 und zurueck auf 40.
// Dieses Profil bleibt erhalten und wird nur um `lightness` verschoben.
const LIGHTNESS_PROFILE = [40, 45, 50, 55, 60, 65, 70, 65, 60, 55, 50, 45, 40];

// Werte zwischen den Stuetzstellen der Originalrampe abtasten, damit eine
// abweichende Bandzahl denselben Farbverlauf trifft — nur feiner oder groeber.
function sample(list: number[], t: number) {
  const position = t * (list.length - 1);
  const low = Math.floor(position);
  const high = Math.min(low + 1, list.length - 1);
  return list[low] + (list[high] - list[low]) * (position - low);
}

function buildGradient(
  palette: string,
  angle: number,
  saturation: number,
  lightness: number,
  bandCount: number,
  contrast: number,
) {
  const hues = PALETTES[palette] ?? PALETTES.spectrum;
  const offset = lightness - 55; // 55 ist der Mittelwert des Originalprofils
  const bands = Math.max(2, Math.round(bandCount));
  const sat = palette === 'mono' ? 0 : saturation;

  const stops: string[] = [];
  for (let i = 0; i < bands; i += 1) {
    const t = bands === 1 ? 0 : i / (bands - 1);
    const hue = sample(hues, t);
    const light = Math.max(0, Math.min(100, sample(LIGHTNESS_PROFILE, t) + offset));
    const color = `hsl(${hue.toFixed(1)},${sat}%,${light.toFixed(1)}%)`;
    if (contrast <= 0) {
      stops.push(color);
    } else {
      // Harte Kanten entstehen, indem jedes Band zweimal gesetzt wird: einmal
      // am Anfang und einmal am Ende seines Abschnitts. Der Kontrastwert
      // bestimmt, wie breit der harte Anteil gegenueber dem weichen ist.
      const width = 100 / bands;
      const start = i * width;
      const hard = width * contrast;
      stops.push(`${color} ${start.toFixed(2)}%`, `${color} ${(start + hard).toFixed(2)}%`);
    }
  }
  return `linear-gradient(${angle}deg,${stops.join(',')})`;
}

export default function HolographicMaskShader({
  palette = 'spectrum',
  gradientAngle = 0,
  saturation = 60,
  lightness = 55,
  blendMode = 'color-dodge',
  showNote = true,
  motion = 'scroll',
  bandCount = 13,
  contrast = 0,
}: HolographicMaskShaderProps = {}) {
  const gradient = buildGradient(
    palette,
    gradientAngle,
    saturation,
    lightness,
    bandCount,
    Math.max(0, Math.min(1, contrast)),
  );

  return (
    <div className={`holographic-mask-scroll-demo motion-${motion}`}>
      <style>{`
        .holographic-mask-scroll-demo { position:relative; width:100%; height:100%; overflow:hidden; background:#08090d; }
        .holographic-mask-scroll-demo .shader { position:relative; width:100%; height:100%; overflow:hidden; backface-visibility:hidden; }
        .holographic-mask-scroll-demo .shader-layer { background:black; mix-blend-mode:multiply; position:absolute; inset:0; width:100%; height:100%; background-position:center; }
        .holographic-mask-scroll-demo .specular { mix-blend-mode:var(--holo-blend,color-dodge); background-attachment:fixed; }
        .holographic-mask-scroll-demo .mask { mix-blend-mode:multiply; object-fit:cover; }
        .holographic-mask-scroll-demo .gradient-sparrow { background-image:var(--holo-gradient); }
        /* 'scroll' ist das Original: die feste Verankerung laesst den Verlauf
           beim Seitenscroll hinter der Maske durchwandern. 'drift' loest ihn
           davon und bewegt ihn von selbst, 'static' laesst ihn stehen. */
        .holographic-mask-scroll-demo.motion-drift .specular { background-attachment:scroll; background-size:100% 260%; animation:holo-drift 14s linear infinite; }
        .holographic-mask-scroll-demo.motion-static .specular { background-attachment:scroll; }
        @keyframes holo-drift { from { background-position:0 0; } to { background-position:0 -260%; } }
        @media (prefers-reduced-motion:reduce) { .holographic-mask-scroll-demo.motion-drift .specular { animation:none; } }
        .holographic-mask-scroll-demo .holo-base { width:100%; height:100%; display:block; object-fit:cover; }
        .holographic-mask-scroll-demo .holo-note { position:absolute; z-index:3; left:14px; bottom:10px; color:#eee6d8; font:9px var(--mono,monospace); letter-spacing:.13em; }
        @media (prefers-reduced-motion:reduce) { .holographic-mask-scroll-demo .specular { background-attachment:scroll; } }
      `}</style>
      <div className="shader">
        <img
          className="holo-base"
          src="/effects/holographic/sparrow-base.png"
          alt="Silhouette design of a sparrow sitting on a branch"
        />
        <div
          className="shader-layer specular gradient-sparrow"
          style={{ '--holo-gradient': gradient, '--holo-blend': blendMode } as React.CSSProperties}
        >
          <img
            className="shader-layer mask"
            src="/effects/holographic/sparrow-mask.png"
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>
      {showNote && <span className="holo-note">SCROLL THE PAGE · FIXED-BACKGROUND MASK SHADER</span>}
    </div>
  );
}
