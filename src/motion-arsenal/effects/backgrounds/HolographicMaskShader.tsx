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

function buildGradient(palette: string, angle: number, saturation: number, lightness: number) {
  const hues = PALETTES[palette] ?? PALETTES.spectrum;
  const offset = lightness - 55; // 55 ist der Mittelwert des Originalprofils
  const stops = hues.map((hue, index) => {
    const light = Math.max(0, Math.min(100, LIGHTNESS_PROFILE[index] + offset));
    const sat = palette === 'mono' ? 0 : saturation;
    return `hsl(${hue},${sat}%,${light}%)`;
  });
  return `linear-gradient(${angle}deg,${stops.join(',')})`;
}

export default function HolographicMaskShader({
  palette = 'spectrum',
  gradientAngle = 0,
  saturation = 60,
  lightness = 55,
  blendMode = 'color-dodge',
  showNote = true,
}: HolographicMaskShaderProps = {}) {
  const gradient = buildGradient(palette, gradientAngle, saturation, lightness);

  return (
    <div className="holographic-mask-scroll-demo">
      <style>{`
        .holographic-mask-scroll-demo { position:relative; width:100%; height:100%; overflow:hidden; background:#08090d; }
        .holographic-mask-scroll-demo .shader { position:relative; width:100%; height:100%; overflow:hidden; backface-visibility:hidden; }
        .holographic-mask-scroll-demo .shader-layer { background:black; mix-blend-mode:multiply; position:absolute; inset:0; width:100%; height:100%; background-position:center; }
        .holographic-mask-scroll-demo .specular { mix-blend-mode:var(--holo-blend,color-dodge); background-attachment:fixed; }
        .holographic-mask-scroll-demo .mask { mix-blend-mode:multiply; object-fit:cover; }
        .holographic-mask-scroll-demo .gradient-sparrow { background-image:var(--holo-gradient); }
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
