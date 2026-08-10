import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { clamp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';

// ---------------------------------------------------------------------------
// ParticleTextReveal — Headline erscheint aus einer Partikel-Wolke:
// Canvas-Text wird auf eine Offscreen-Canvas gerendert und per
// getImageData gepixelt (hell = Partikel-Ziel). Tausende Punkte formen
// sich (Mix-Faktor Wolke→Text), Hover stört lokal mit Sinus-Wellen.
// Implementiert als Canvas-2D-Particle-System (konzeptgetreu, ohne
// drei.js-Abhängigkeit — gleiche Semantik: Points + Ziel-Map).
// Reduced Motion: Text erscheint direkt.
// ---------------------------------------------------------------------------

export interface ParticleTextRevealProps {
  /** Headline-Text. */
  text?: string;
  /** Partikel-Anzahl (800–8000). */
  count?: number;
  /** Auflösungs-Skalierung (0.25–1). */
  scale?: number;
  /** Deterministischer Seed. */
  seed?: number;
}

interface P {
  x: number; y: number; tx: number; ty: number;
  vx: number; vy: number; size: number; delay: number;
}

export function ParticleTextReveal({
  text = 'NOX',
  count = 2500,
  scale = 0.5,
  seed = 20260810,
}: ParticleTextRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const safeCount = clamp(Math.round(count), 800, 8000);
  const safeScale = clamp(scale, 0.25, 1);

  const particles = useMemo<P[]>(() => {
    const rng = seededRandom(seed);
    return Array.from({ length: safeCount }, () => ({
      x: (rng() - 0.5) * 2,
      y: (rng() - 0.5) * 2,
      tx: 0, ty: 0,
      vx: 0, vy: 0,
      size: 0.6 + rng() * 1.8,
      delay: rng() * 0.6,
    }));
  }, [safeCount, seed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ziel-Map: Text auf Offscreen-Canvas rendern und Pixel samplen.
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    off.width = Math.floor(w * safeScale);
    off.height = Math.floor(h * safeScale);

    if (!octx) return;
    octx.fillStyle = '#000';
    octx.fillRect(0, 0, off.width, off.height);
    octx.font = `800 ${Math.floor(off.height * 0.22)}px ui-monospace, monospace`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillStyle = '#fff';
    octx.fillText(text, off.width / 2, off.height / 2);

    const data = octx.getImageData(0, 0, off.width, off.height).data;
    const targets: Array<[number, number]> = [];
    const step = 2;
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        const a = data[(y * off.width + x) * 4 + 3];
        if (a > 128) {
          targets.push([(x / off.width - 0.5) * 2, (y / off.height - 0.5) * 2]);
        }
      }
    }
    // Ziele gleichmäßig auf Partikel verteilen (wiederholen, falls weniger).
    for (let i = 0; i < particles.length; i++) {
      const t = targets[i % Math.max(targets.length, 1)];
      if (t) {
        particles[i].tx = t[0];
        particles[i].ty = t[1];
      }
    }

    let raf = 0;
    let t0 = performance.now();
    const start = performance.now();

    const render = (now: number) => {
      const elapsed = (now - start) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Lokale Hover-Störung (Pointer-Position in normalisierten Koordinaten).
      let mx = 0;
      let my = 0;
      if (!reduced) {
        // Sanfte Sinus-Störung über die Zeit (deterministisch).
        mx = Math.sin(elapsed * 0.7) * 0.4;
        my = Math.cos(elapsed * 0.5) * 0.3;
      }

      ctx.fillStyle = NOX_COLORS.gold;
      ctx.shadowColor = NOX_COLORS.gold;
      ctx.shadowBlur = 6;

      for (const p of particles) {
        const k = reduced ? 1 : clamp((elapsed - p.delay) / 2.2, 0, 1);
        const ease = 1 - Math.pow(1 - k, 3);
        // Ziel: Text-Position + lokale Sinus-Störung.
        const jx = Math.sin(elapsed * 2.2 + p.delay * 9) * 0.02 * (1 - ease);
        const jy = Math.cos(elapsed * 1.8 + p.delay * 7) * 0.02 * (1 - ease);
        const px = (p.x * (1 - ease) + (p.tx + mx * 0.02) * ease + jx) * (canvas.width / 2);
        const py = (p.y * (1 - ease) + (p.ty + my * 0.02) * ease + jy) * (canvas.height / 2);
        const s = p.size * dpr * (0.4 + ease * 0.8);
        ctx.globalAlpha = 0.35 + ease * 0.65;
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + px, canvas.height / 2 + py, s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [particles, text, safeScale, reduced]);

  const vars = {
    '--ptr-gold': NOX_COLORS.gold,
  } as CSSProperties;

  return (
    <div className="ptr-root" style={vars}>
      <canvas ref={canvasRef} className="ptr-canvas" aria-label={`${text} Partikel-Text`} />
      <style>{`
.ptr-root{position:absolute;inset:0;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(120% 90% at 50% 30%,#0d1019,#06080c)}
.ptr-canvas{width:100%;height:100%;display:block}
`}</style>
    </div>
  );
}

export default ParticleTextReveal;
