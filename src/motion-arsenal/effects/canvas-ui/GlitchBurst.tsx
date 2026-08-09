import { useEffect, useRef } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { seededRandom, usePrefersReducedMotion } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// GlitchBurst — canvas-ui "Glitch" + "VHS" mechanics combined: the panel
// tears into horizontally-shifted slices with an RGB channel split during
// short broadcast-style bursts (canvasui.dev/components/glitch), and idles
// with worn-tape scanline/chroma flicker between them
// (canvasui.dev/components/vhs). Source content is a self-drawn NOX system
// log panel rendered once into an offscreen buffer, sliced with drawImage —
// no live-DOM read, same spirit as the rest of the arsenal's shader/canvas
// reproductions.
// ---------------------------------------------------------------------------

export interface GlitchBurstProps {
  burstIntensity?: number; // 0..1 — slice displacement + split strength
  burstFrequency?: number; // 0.3..3 — average bursts per second
  // Skilltree-Erweiterungen. Alle Defaults entsprechen exakt dem urspruenglichen
  // Verhalten — der Effekt sieht ohne Zutun aus wie vorher.
  tearDirection?: 'horizontal' | 'vertical' | 'both'; // Achse, entlang der der Riss laeuft
  sliceShape?: 'band' | 'wedge' | 'block'; // Form der verschobenen Bruchstuecke
  splitColorA?: string; // erste Kanaltrennung (klassisch Rot)
  splitColorB?: string; // zweite Kanaltrennung (klassisch Cyan)
  accentColor?: string; // Tag-Farbe im Log-Panel
  scanline?: boolean; // rollende Bandzeile im Leerlauf
  seed?: number; // deterministisches Rauschen
}

const BUF_W = 260;
const BUF_H = 150;

// '#d4a24a' -> '212,162,74', damit die Alpha-Werte des Panels erhalten bleiben.
function toRgbTriplet(hex: string, fallback: string) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return fallback;
  const value = parseInt(match[1], 16);
  return `${(value >> 16) & 255},${(value >> 8) & 255},${value & 255}`;
}

function paintLogPanel(ctx: CanvasRenderingContext2D, rnd: () => number, accent: string) {
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, BUF_W, BUF_H);

  const tags = ['SCAN', 'EXEC', 'SIGNAL', 'SYNC', 'FORGE'];
  ctx.font = '8px monospace';
  for (let i = 0; i < 10; i++) {
    const y = 8 + i * 14;
    const tag = tags[Math.floor(rnd() * tags.length)];
    ctx.fillStyle = `rgba(${accent},0.85)`;
    ctx.fillText(`[${tag}]`, 8, y);
    ctx.fillStyle = 'rgba(240,236,228,0.4)';
    const barW = 60 + rnd() * 140;
    ctx.fillRect(58, y - 6, barW, 6);
  }
  ctx.strokeStyle = 'rgba(201,48,48,0.5)';
  ctx.strokeRect(4, 4, BUF_W - 8, BUF_H - 8);
}

export function GlitchBurst({
  burstIntensity = 0.7,
  burstFrequency = 1.1,
  tearDirection = 'horizontal',
  sliceShape = 'band',
  splitColorA = '#ff3b3b',
  splitColorB = '#39d0ff',
  accentColor = '#d4a24a',
  scanline = true,
  seed = 19,
}: GlitchBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const srcCanvas = useRef<HTMLCanvasElement | null>(null);
  const nextBurst = useRef(0.6);
  const burstUntil = useRef(0);
  const rnd = useRef(seededRandom(seed));

  useEffect(() => {
    rnd.current = seededRandom(seed);
  }, [seed]);

  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = BUF_W;
    c.height = BUF_H;
    paintLogPanel(c.getContext('2d')!, seededRandom(4), toRgbTriplet(accentColor, '212,162,74'));
    srcCanvas.current = c;
  }, [accentColor]);

  useCanvas2D(
    canvasRef,
    (ctx, size, dt, elapsed) => {
      const src = srcCanvas.current;
      if (!src) return;
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.imageSmoothingEnabled = false;

      const scaleX = size.w / BUF_W;
      const scaleY = size.h / BUF_H;

      if (elapsed > nextBurst.current && elapsed > burstUntil.current) {
        burstUntil.current = elapsed + 0.09 + rnd.current() * 0.16;
        nextBurst.current = elapsed + Math.max(0.15, (1 / Math.max(0.1, burstFrequency)) * (0.5 + rnd.current()));
      }
      const bursting = elapsed < burstUntil.current;

      // Base frame.
      ctx.drawImage(src, 0, 0, BUF_W, BUF_H, 0, 0, size.w, size.h);

      if (bursting) {
        const sliceCount = 4 + Math.floor(rnd.current() * 4);
        for (let i = 0; i < sliceCount; i++) {
          // Reihenfolge der Zufallsziehungen bleibt unveraendert, damit das
          // Bruchmuster in der Grundeinstellung dasselbe ist wie bisher.
          const bandH = (6 + rnd.current() * 18) * scaleY;
          const bandY = rnd.current() * size.h;
          const shift = (rnd.current() - 0.5) * 40 * burstIntensity;

          const vertical =
            tearDirection === 'vertical' || (tearDirection === 'both' && i % 2 === 1);
          // Quer zur Rissachse gemessen: bei vertikalem Riss wird aus der
          // Bandhoehe eine Spaltenbreite.
          const across = vertical ? size.h : size.w;
          const bandPos = vertical ? (bandY / size.h) * size.w : bandY;
          const thickness = vertical ? (bandH / scaleY) * scaleX : bandH;

          ctx.save();
          ctx.beginPath();
          if (sliceShape === 'wedge') {
            // Keil: laeuft von voller Dicke auf null zu.
            if (vertical) {
              ctx.moveTo(bandPos, 0);
              ctx.lineTo(bandPos + thickness, 0);
              ctx.lineTo(bandPos, across);
            } else {
              ctx.moveTo(0, bandPos);
              ctx.lineTo(across, bandPos);
              ctx.lineTo(0, bandPos + thickness);
            }
            ctx.closePath();
          } else if (sliceShape === 'block') {
            // Block: kurzes Bruchstueck statt durchgehender Riss.
            const start = ((i * 137) % 100) / 100;
            const length = across * 0.45;
            if (vertical) ctx.rect(bandPos, start * across * 0.55, thickness, length);
            else ctx.rect(start * across * 0.55, bandPos, length, thickness);
          } else if (vertical) {
            ctx.rect(bandPos, 0, thickness, across);
          } else {
            ctx.rect(0, bandPos, across, thickness);
          }
          ctx.clip();

          const dx = vertical ? 0 : shift;
          const dy = vertical ? shift : 0;
          ctx.drawImage(src, 0, 0, BUF_W, BUF_H, dx, dy, size.w, size.h);

          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.35 * burstIntensity;
          ctx.fillStyle = splitColorA;
          if (vertical) ctx.fillRect(bandPos, dy - 3, thickness, across);
          else ctx.fillRect(dx - 3, bandPos, across, thickness);
          ctx.fillStyle = splitColorB;
          if (vertical) ctx.fillRect(bandPos, dy + 3, thickness, across);
          else ctx.fillRect(dx + 3, bandPos, across, thickness);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          ctx.restore();
        }
        if (rnd.current() < 0.25) {
          ctx.fillStyle = `rgba(240,236,228,${(0.06 + rnd.current() * 0.1).toFixed(2)})`;
          ctx.fillRect(0, 0, size.w, size.h);
        }
      }

      // Idle worn-tape flicker: faint rolling scanline + grain.
      if (scanline) {
        const lineY = ((elapsed * 40) % size.h);
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(0, lineY, size.w, 1.5);
      }
      if (Math.sin(elapsed * 37) > 0.985) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, 0, size.w, size.h);
      }
      void dt;
    },
    !reduced,
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          fontFamily: 'var(--mono, monospace)',
          fontSize: 10,
          letterSpacing: '0.4em',
          color: NOX_COLORS.textDim,
          pointerEvents: 'none',
        }}
      >
        SIGNAL FEED // {reduced ? 'FROZEN' : 'LIVE'}
      </div>
    </div>
  );
}

export default GlitchBurst;
