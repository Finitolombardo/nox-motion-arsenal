import { useEffect, useMemo, useRef } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// GlyphMatrixRain — deterministischer Glyphen-Regen als Terminal-Textur.
// Canvas-Spalten fallen mit eigenem Tempo; jeder Tropfen-Kopf leuchtet hell,
// der Schweif fällt über Opacity-Keyframes ab. Glyphen und Startwerte kommen
// aus seededRandom (kein Math.random) — bei gleichem Seed läuft der Regen
// identisch. Reduced Motion: genau ein statischer Frame wird gerendert.
// ---------------------------------------------------------------------------

export interface GlyphMatrixRainProps {
  /** Anzahl Regen-Spalten (8–60). */
  columns?: number;
  /** Fall-Tempo (0.1–3). */
  speed?: number;
  /** Zeichen-Satz. */
  glyphSet?: 'katakana' | 'nox' | 'hex';
  /** Leuchtfarbe der Glyphen. */
  color?: string;
  /** Kopf-Glanz (0–1). */
  headGlow?: number;
  /** Seed für die deterministische Textur. */
  seed?: number;
}

const GLYPHS = {
  katakana: 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789',
  nox: 'NOXARSENALΔΣΦΨΩ#$%&0123456789',
  hex: '0123456789ABCDEF',
};

export function GlyphMatrixRain({
  columns = 28,
  speed = 1,
  glyphSet = 'katakana',
  color = NOX_COLORS.gold,
  headGlow = 1,
  seed = 20260810,
}: GlyphMatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const safeCols = clamp(Math.round(columns), 8, 60);
  const safeSpeed = clamp(speed, 0.1, 3);
  const glyphs = useMemo(() => GLYPHS[glyphSet], [glyphSet]);

  // Deterministische Spalten-Zustände.
  const state = useMemo(() => {
    const rnd = seededRandom(seed);
    return Array.from({ length: safeCols }, () => ({
      y: rnd() * 100,
      step: Math.round(6 + rnd() * 26),
      speed: 0.4 + rnd() * 1.6,
      trail: Math.round(8 + rnd() * 20),
    }));
  }, [safeCols, seed]);

  // Einmalig pro Spalten-Änderung: Breite messen.
  const colWidth = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    colWidth.current = Math.max(8, rect.width / safeCols);
  }, [safeCols]);

  // Reduziert: statischen Frame einmal zeichnen, keinen Loop starten.
  const paint = (progress = 0, dt = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(rect.width));
    const h = Math.max(2, Math.round(rect.height));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = 'rgba(10,10,11,0.16)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = `600 ${Math.round(colWidth.current * 0.92)}px var(--nox-font-mono, "Courier New", monospace)`;
    ctx.textBaseline = 'top';
    const fade = Math.min(1, dt / 40);
    for (let c = 0; c < safeCols; c++) {
      const s = state[c];
      if (!s) continue;
      const x = c * colWidth.current + colWidth.current / 2;
      const y = ((s.y + progress * s.speed * 120) % (h + 200)) - 100;
      // Schweif: dunklere Glyphen oberhalb des Kopfes.
      for (let t = 1; t <= s.trail; t++) {
        const ty = y - t * 18;
        if (ty < -20 || ty > h) continue;
        const a = Math.max(0, 0.4 - (t / s.trail) * 0.36) * fade;
        ctx.fillStyle = `rgba(${hexToRgb(color)}, ${a.toFixed(3)})`;
        ctx.fillText(glyphs[(s.step * 7 + t * 13) % glyphs.length], x, ty);
      }
      // Kopf: hell + Glow.
      ctx.fillStyle = `rgba(${hexToRgb('#f0ece4')}, ${(0.55 + headGlow * 0.45) * fade})`;
      ctx.fillText(glyphs[(s.step * 7) % glyphs.length], x, y);
      s.y += s.speed * 0.12 * safeSpeed * fade;
    }
  };

  useRafLoop((_dt, elapsed) => {
    if (reduced) return;
    paint(elapsed, 16);
  }, !reduced);

  useEffect(() => {
    if (reduced) paint(0, 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, glyphs]);

  return (
    <canvas
      ref={canvasRef}
      className="gmr-canvas"
      role="img"
      aria-label="Deterministischer Glyphen-Regen als Terminal-Textur"
      style={{ '--gmr-color': color } as React.CSSProperties}
    >
      <style>{`
.gmr-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;
  background:radial-gradient(120% 120% at 50% 20%,#101013 0%,#0a0a0b 70%)}
@media (prefers-reduced-motion:reduce){
  .gmr-canvas{background:#0a0a0b}
}
`}</style>
    </canvas>
  );
}

function hexToRgb(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return '212,162,74';
  return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

export default GlyphMatrixRain;
