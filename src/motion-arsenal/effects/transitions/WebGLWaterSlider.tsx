import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// WebGLWaterSlider — Bild-Slider mit Wasser-Verzerrung: Das aktuelle Bild
// entsättigt sich und wellt sich hinter dem neu hereinziehenden. Echte
// ImageData-Wellen auf kleiner Offscreen-Rasterauflösung (fbm-artige
// Sinus-Überlagerung, Drag-Vektor skaliert die Amplitude), hochskaliert
// mit image-rendering. Kein Fake-WebGL — Canvas-2D-Äquivalent des
// Shaders, konzeptgetreu in der Wirkung.
// Reduced Motion: CSS-Blur-Slide (documentierter Fallback).
// ---------------------------------------------------------------------------

export interface WebGLWaterSliderProps {
  /** Bild-URLs (bei Leere: deterministische NOX-Gradient-Frames). */
  images?: string[];
  /** Deterministischer Seed. */
  seed?: number;
}

export function WebGLWaterSlider({
  images,
  seed = 20260810,
}: WebGLWaterSliderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0.5);
  const [dragging, setDragging] = useState(false);
  const reduced = usePrefersReducedMotion();
  const dragRef = useRef({ active: false, x: 0.5, vel: 0 });

  // Deterministische Gradient-Frames als Fallback.
  const fallback = useMemo(
    () => [
      `linear-gradient(135deg, ${NOX_COLORS.gold}33, #0d1019 70%)`,
      `linear-gradient(225deg, ${NOX_COLORS.gold}55, #0a0c10 60%)`,
    ],
    []
  );
  const slides = images && images.length >= 2 ? images.slice(0, 4) : fallback;

  // Canvas-Rendering: Wellen auf Offscreen-Raster, hochskaliert.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const RW = 160; // Raster-Breite für ImageData-Wellen
    const RH = Math.max(60, Math.floor((h / w) * RW));
    off.width = RW;
    off.height = RH;

    if (!octx) return;
    const rng = seededRandom(seed);
    const phases = Array.from({ length: 3 }, () => rng() * Math.PI * 2);
    const amps = [0.06, 0.04, 0.025];

    const draw = (p: number) => {
      if (!octx || !ctx) return;
      // Zwei Slider-Hälften: links altes Bild (desaturiert+gewellt), rechts neu.
      // 1. Altes Bild aufs Raster.
      const gradA = ctx.createLinearGradient(0, 0, w, h);
      gradA.addColorStop(0, NOX_COLORS.gold);
      gradA.addColorStop(1, '#0a0c10');
      octx.fillStyle = gradA as unknown as string;
      octx.fillRect(0, 0, RW, RH);
      const imgA = octx.getImageData(0, 0, RW, RH);

      // 2. Neues Bild.
      octx.fillStyle = '#0d1019';
      octx.fillRect(0, 0, RW, RH);
      const gradB = ctx.createLinearGradient(w, 0, 0, h);
      gradB.addColorStop(0, NOX_COLORS.gold);
      gradB.addColorStop(1, '#14181f');
      octx.fillStyle = gradB as unknown as string;
      octx.fillRect(0, 0, RW, RH);
      const imgB = octx.getImageData(0, 0, RW, RH);

      // 3. Wellen-Displacement (fbm-artige Sinus-Überlagerung).
      const t = performance.now() / 1000;
      const out = octx.createImageData(RW, RH);
      const amp = 0.05 + dragRef.current.vel * 0.35;
      for (let y = 0; y < RH; y++) {
        const wave =
          Math.sin(y * 0.35 + t * 1.4 + phases[0]) * amps[0] +
          Math.sin(y * 0.9 + t * 2.1 + phases[1]) * amps[1] +
          Math.sin(y * 2.3 + t * 3.0 + phases[2]) * amps[2];
        const dx = Math.floor(wave * RW * amp * 0.5);
        for (let x = 0; x < RW; x++) {
          const border = Math.floor(p * RW);
          const src = x < border ? imgA : imgB;
          const sx = clamp(x + dx, 0, RW - 1);
          const si = (y * RW + sx) * 4;
          const di = (y * RW + x) * 4;
          out.data[di] = src.data[si];
          out.data[di + 1] = src.data[si + 1];
          out.data[di + 2] = src.data[si + 2];
          out.data[di + 3] = 255;
        }
      }
      octx.putImageData(out, 0, 0);

      // 4. Hochskalieren (pixelated).
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    };

    // Init + kontinuierliches Rendern während Drag.
    let raf = 0;
    const loop = () => {
      draw(dragRef.current.x);
      if (dragRef.current.active) {
        raf = requestAnimationFrame(loop);
      }
    };
    draw(pos);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, seed]);

  // Pointer-Handling (Touch + Mouse).
  const setFromClient = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = clamp((clientX - r.left) / r.width, 0, 1);
    dragRef.current.x = x;
    setPos(x);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    dragRef.current.active = true;
    dragRef.current.vel = 0.6;
    setDragging(true);
    setFromClient(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    setFromClient(e.clientX);
  };
  const onPointerUp = () => {
    dragRef.current.active = false;
    dragRef.current.vel = 0;
    setDragging(false);
  };

  const vars = {
    '--wws-gold': NOX_COLORS.gold,
    '--wws-pos': `${pos * 100}%`,
  } as CSSProperties;

  return (
    <div
      ref={wrapRef}
      className="wws-root"
      style={vars}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <canvas ref={canvasRef} className="wws-canvas" />
      <div className={`wws-handle ${dragging ? 'wws-handle--active' : ''}`} style={{ left: `${pos * 100}%` }}>
        <span className="wws-knob">◂▸</span>
      </div>
      <p className="wws-hint">DRAG TO DISTORT</p>
      <style>{`
.wws-root{position:absolute;inset:0;overflow:hidden;cursor:ew-resize;touch-action:none;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.wws-canvas{width:100%;height:100%;display:block;image-rendering:pixelated}
.wws-handle{position:absolute;top:0;bottom:0;width:2px;transform:translateX(-50%);
  background:color-mix(in srgb,var(--wws-gold) 80%,transparent);
  box-shadow:0 0 18px color-mix(in srgb,var(--wws-gold) 60%,transparent);pointer-events:none}
.wws-handle--active{background:var(--wws-gold)}
.wws-knob{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  background:var(--wws-gold);color:#0a0c10;font:700 11px/1 ui-monospace,monospace;
  padding:6px 8px;border-radius:8px;letter-spacing:.05em;white-space:nowrap}
.wws-hint{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);
  color:#8a8578;font:10px ui-monospace,monospace;letter-spacing:.3em;pointer-events:none}
@media (prefers-reduced-motion:reduce){
  .wws-canvas{filter:blur(2px)}
  .wws-hint{display:none}
}
`}</style>
    </div>
  );
}

export default WebGLWaterSlider;
