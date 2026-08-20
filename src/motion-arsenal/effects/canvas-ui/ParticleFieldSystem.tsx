import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvas2D } from '../../lib/canvasUtils';
import { damp, seededRandom, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from '../cursor/cursorShared';


export type ParticleFieldMode = 'asset' | 'reveal';
export type ParticleFieldPresetId =
  | 'restaurant' | 'beauty' | 'fitness' | 'local-service' | 'real-estate' | 'automotive'
  | 'healthcare' | 'finance' | 'saas' | 'ecommerce' | 'luxury' | 'creator';


export interface ParticleFieldPreset {
  label: string;
  mode: ParticleFieldMode;
  density: number;
  particleSize: number;
  springStrength: number;
  repelRadius: number;
  resolveRadius: number;
  scatter: number;
  cloudScale: number;
  interactionStrength: number;
  color: string;
}


export const PARTICLE_FIELD_PRESETS: Record<ParticleFieldPresetId, ParticleFieldPreset> = {
  restaurant: { label: 'Restaurant / Hospitality', mode: 'reveal', density: 2200, particleSize: 1.25, springStrength: 11, repelRadius: .16, resolveRadius: .28, scatter: 8, cloudScale: .9, interactionStrength: .72, color: '#D89B5B' },
  beauty: { label: 'Beauty / Wellness', mode: 'reveal', density: 2500, particleSize: 1.05, springStrength: 10, repelRadius: .15, resolveRadius: .3, scatter: 7, cloudScale: .94, interactionStrength: .58, color: '#D9A8B8' },
  fitness: { label: 'Fitness / Sport', mode: 'asset', density: 3300, particleSize: 2.3, springStrength: 19, repelRadius: .23, resolveRadius: .2, scatter: 16, cloudScale: 1, interactionStrength: 1.18, color: '#FF5B2E' },
  'local-service': { label: 'Handwerk / Local Service', mode: 'asset', density: 2800, particleSize: 2.15, springStrength: 16, repelRadius: .2, resolveRadius: .22, scatter: 12, cloudScale: .96, interactionStrength: .92, color: '#F2B544' },
  'real-estate': { label: 'Immobilien', mode: 'reveal', density: 2100, particleSize: 1.05, springStrength: 10, repelRadius: .14, resolveRadius: .26, scatter: 6, cloudScale: .9, interactionStrength: .48, color: '#C8B38A' },
  automotive: { label: 'Automotive', mode: 'asset', density: 3400, particleSize: 2.25, springStrength: 18, repelRadius: .22, resolveRadius: .2, scatter: 15, cloudScale: 1, interactionStrength: 1.08, color: '#C5D0D9' },
  healthcare: { label: 'Healthcare / Praxis', mode: 'reveal', density: 1800, particleSize: 1, springStrength: 9, repelRadius: .13, resolveRadius: .32, scatter: 4, cloudScale: .88, interactionStrength: .4, color: '#69B8B4' },
  finance: { label: 'Kanzlei / Finance', mode: 'reveal', density: 1900, particleSize: .95, springStrength: 10, repelRadius: .13, resolveRadius: .27, scatter: 4, cloudScale: .88, interactionStrength: .42, color: '#B8A46B' },
  saas: { label: 'SaaS / Tech', mode: 'asset', density: 3000, particleSize: 1.8, springStrength: 15, repelRadius: .19, resolveRadius: .24, scatter: 11, cloudScale: .96, interactionStrength: .88, color: '#62A7FF' },
  ecommerce: { label: 'E-Commerce', mode: 'asset', density: 3300, particleSize: 2, springStrength: 16, repelRadius: .21, resolveRadius: .24, scatter: 13, cloudScale: .98, interactionStrength: 1, color: '#F078B8' },
  luxury: { label: 'Luxury / Premium', mode: 'reveal', density: 2300, particleSize: .9, springStrength: 9, repelRadius: .12, resolveRadius: .3, scatter: 5, cloudScale: .9, interactionStrength: .38, color: '#C5A56B' },
  creator: { label: 'Creator / Personal Brand', mode: 'reveal', density: 3100, particleSize: 1.35, springStrength: 15, repelRadius: .21, resolveRadius: .25, scatter: 15, cloudScale: 1.02, interactionStrength: 1.06, color: '#B86CFF' },
};


export interface ParticleFieldSystemProps {
  preset?: ParticleFieldPresetId;
  mode?: ParticleFieldMode;
  text?: string;
  density?: number;
  particleSize?: number;
  springStrength?: number;
  repelRadius?: number;
  resolveRadius?: number;
  scatter?: number;
  cloudScale?: number;
  interactionStrength?: number;
  color?: string;
  allowAssetInput?: boolean;
}


interface FieldParticle {
  u: number;
  v: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  seed: number;
  sampledColor?: string;
}


const SAMPLE_STEP = 4;
const MIN_LUMINANCE = 16;


function parseHex(hex: string): [number, number, number] {
  const value = hex.replace('#', '').trim();
  const normalized = value.length === 3 ? value.split('').map((c) => c + c).join('') : value.padEnd(6, '0').slice(0, 6);
  const n = Number.parseInt(normalized, 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [214, 162, 74];
}


function sampleCanvas(src: HTMLCanvasElement, maxCount: number): FieldParticle[] {
  const { width: w, height: h } = src;
  const ctx = src.getContext('2d');
  if (!ctx || !w || !h) return [];
  const data = ctx.getImageData(0, 0, w, h).data;
  let hasTransparency = false;
  for (let i = 3; i < data.length; i += 4 * 37) {
    if (data[i] < 250) { hasTransparency = true; break; }
  }
  const out: FieldParticle[] = [];
  for (let y = 0; y < h; y += SAMPLE_STEP) {
    for (let x = 0; x < w; x += SAMPLE_STEP) {
      const i = (y * w + x) * 4;
      const r = data[i]; const g = data[i + 1]; const b = data[i + 2]; const a = data[i + 3];
      if (a < 40) continue;
      if (!hasTransparency && 0.2126 * r + 0.7152 * g + 0.0722 * b < MIN_LUMINANCE) continue;
      out.push({ u: x / w, v: y / h, x: 0, y: 0, vx: 0, vy: 0, seed: ((x * 13 + y * 17) % 997) / 997, sampledColor: `rgba(${r},${g},${b},${(a / 255).toFixed(2)})` });
    }
  }
  if (out.length <= maxCount) return out;
  const rnd = seededRandom(11);
  const picked: FieldParticle[] = [];
  const probability = maxCount / out.length;
  for (const p of out) if (rnd() < probability && picked.length < maxCount) picked.push(p);
  return picked;
}


function sampleText(text: string, maxCount: number): FieldParticle[] {
  const w = 720; const h = 220;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return [];
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '900 96px "Arial Black", Arial, sans-serif'; ctx.fillText(text, w / 2, h / 2);
  const data = ctx.getImageData(0, 0, w, h).data;
  const candidates: FieldParticle[] = [];
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
    if (data[(y * w + x) * 4 + 3] > 120) candidates.push({ u: x / w, v: y / h, x: 0, y: 0, vx: 0, vy: 0, seed: 0 });
  }
  const rnd = seededRandom(42);
  for (let i = candidates.length - 1; i > 0; i -= 1) { const j = Math.floor(rnd() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
  return candidates.slice(0, Math.min(maxCount, candidates.length)).map((p, i) => ({ ...p, seed: seededRandom(i + 1)() }));
}


function drawDefaultEmblem(c: HTMLCanvasElement, accent: string) {
  const ctx = c.getContext('2d'); if (!ctx) return;
  const { width: w, height: h } = c; ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = accent; ctx.lineWidth = w * .02; ctx.beginPath(); ctx.arc(w / 2, h / 2, w * .32, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = NOX_COLORS.red; ctx.lineWidth = w * .028; ctx.beginPath(); ctx.moveTo(w / 2, h * .28); ctx.lineTo(w / 2, h * .72); ctx.moveTo(w * .28, h / 2); ctx.lineTo(w * .72, h / 2); ctx.stroke();
  ctx.fillStyle = NOX_COLORS.text; ctx.font = `800 ${Math.round(w * .1)}px Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('NOX', w / 2, h / 2);
}


export function ParticleFieldSystem(props: ParticleFieldSystemProps) {
  const preset = PARTICLE_FIELD_PRESETS[props.preset ?? 'saas'];
  const mode = props.mode ?? preset.mode;
  const text = props.text ?? 'NOX SIGNAL';
  const density = Math.max(300, Math.min(4200, Math.round(props.density ?? preset.density)));
  const particleSize = Math.max(.5, props.particleSize ?? preset.particleSize);
  const springStrength = Math.max(2, props.springStrength ?? preset.springStrength);
  const repelRadius = Math.max(.04, props.repelRadius ?? preset.repelRadius);
  const resolveRadius = Math.max(.05, props.resolveRadius ?? preset.resolveRadius);
  const scatter = Math.max(0, props.scatter ?? preset.scatter);
  const cloudScale = Math.max(.55, props.cloudScale ?? preset.cloudScale);
  const interactionStrength = Math.max(0, props.interactionStrength ?? preset.interactionStrength);
  const color = props.color ?? preset.color;
  const allowAssetInput = props.allowAssetInput ?? true;
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const particles = useRef<FieldParticle[]>([]);
  const sourceAspect = useRef(1);
  const laidOut = useRef(false);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const hoverCapable = useHoverCapable();
  const dampedPtr = useRef({ x: .5, y: .5, active: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [assetLabel, setAssetLabel] = useState('NOX EMBLEM (DEFAULT)');


  const loadDefault = useCallback(() => {
    if (mode !== 'asset') return;
    const c = document.createElement('canvas'); c.width = 220; c.height = 220; drawDefaultEmblem(c, color);
    particles.current = sampleCanvas(c, density); sourceAspect.current = 1; laidOut.current = false; setAssetLabel('NOX EMBLEM (DEFAULT)');
  }, [color, density, mode]);


  const loadFromImage = useCallback((source: CanvasImageSource, w: number, h: number, label: string) => {
    const c = document.createElement('canvas'); const max = 260; const aspect = w / Math.max(1, h);
    c.width = aspect >= 1 ? max : Math.max(1, Math.round(max * aspect)); c.height = aspect >= 1 ? Math.max(1, Math.round(max / aspect)) : max;
    c.getContext('2d')?.drawImage(source, 0, 0, c.width, c.height);
    particles.current = sampleCanvas(c, density); sourceAspect.current = c.width / c.height; laidOut.current = false; setAssetLabel(label.toUpperCase());
  }, [density]);


  useEffect(() => {
    if (mode === 'reveal') { particles.current = sampleText(text, density); sourceAspect.current = 720 / 220; laidOut.current = false; }
    else loadDefault();
  }, [density, loadDefault, mode, text]);


  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { loadFromImage(img, img.naturalWidth || img.width, img.naturalHeight || img.height, file.name); URL.revokeObjectURL(url); };
    img.onerror = () => URL.revokeObjectURL(url); img.src = url;
  }, [loadFromImage]);


  useRafLoop((dt, elapsed) => {
    const p = pointer.current; if (!hoverCapable) driftPointer(p, elapsed);
    dampedPtr.current.x = damp(dampedPtr.current.x, p.inside ? p.tx : dampedPtr.current.x, 10, dt);
    dampedPtr.current.y = damp(dampedPtr.current.y, p.inside ? p.ty : dampedPtr.current.y, 10, dt);
    dampedPtr.current.active = damp(dampedPtr.current.active, p.inside || !hoverCapable ? 1 : 0, 6, dt);
  }, !reduced);


  useCanvas2D(canvasRef, (ctx, size, dt, elapsed) => {
    ctx.clearRect(0, 0, size.w, size.h); const list = particles.current; if (!list.length) return;
    const px = dampedPtr.current.x; const py = dampedPtr.current.y; const active = dampedPtr.current.active;
    if (mode === 'reveal') {
      const [r, g, b] = parseHex(color); const aspect = size.w / Math.max(1, size.h);
      for (const pt of list) {
        const u = .5 + (pt.u - .5) * cloudScale; const v = .5 + (pt.v - .5) * cloudScale;
        const dx = (u - px) * aspect; const dy = v - py; const dist = Math.hypot(dx, dy);
        const resolve = reduced ? 1 : active * Math.max(0, 1 - dist / resolveRadius) * interactionStrength;
        const diffusion = Math.max(0, 1 - resolve); const angle = pt.seed * Math.PI * 2 + elapsed * (.4 + pt.seed);
        const x = u * size.w + Math.cos(angle) * diffusion * scatter; const y = v * size.h + Math.sin(angle * 1.3) * diffusion * scatter;
        const whiteMix = Math.min(1, resolve * .66); const cr = r + (255 - r) * whiteMix; const cg = g + (250 - g) * whiteMix; const cb = b + (242 - b) * whiteMix;
        ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${(.34 + Math.min(1, resolve) * .62).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(x, y, particleSize * (.72 + Math.min(1, resolve) * .48), 0, Math.PI * 2); ctx.fill();
      }
      return;
    }


    const availW = size.w * .86; const availH = size.h * .86; const aspect = sourceAspect.current;
    let boxW = availW; let boxH = availW / aspect; if (boxH > availH) { boxH = availH; boxW = availH * aspect; }
    const offX = (size.w - boxW) / 2; const offY = (size.h - boxH) / 2; const pointerX = px * size.w; const pointerY = py * size.h;
    const repelPx = repelRadius * Math.max(size.w, size.h); ctx.globalCompositeOperation = 'lighter';
    for (const pt of list) {
      const tx = offX + pt.u * boxW; const ty = offY + pt.v * boxH;
      if (!laidOut.current || reduced) { pt.x = tx; pt.y = ty; pt.vx = 0; pt.vy = 0; }
      if (!reduced) {
        let fx = (tx - pt.x) * springStrength; let fy = (ty - pt.y) * springStrength;
        const dx = pt.x - pointerX; const dy = pt.y - pointerY; const dist = Math.hypot(dx, dy) + .0001;
        if (active > .01 && dist < repelPx) { const push = ((repelPx - dist) / repelPx) * 900 * active * interactionStrength; fx += (dx / dist) * push; fy += (dy / dist) * push; }
        pt.vx = (pt.vx + fx * dt) * .86; pt.vy = (pt.vy + fy * dt) * .86; pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      }
      ctx.fillStyle = pt.sampledColor ?? color; ctx.fillRect(pt.x - particleSize / 2, pt.y - particleSize / 2, particleSize, particleSize);
    }
    laidOut.current = true; ctx.globalCompositeOperation = 'source-over';
  }, !reduced);


  const assetMode = mode === 'asset';
  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: NOX_COLORS.bg, touchAction: 'none' }}
      onDragOver={assetMode && allowAssetInput ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
      onDragLeave={assetMode ? () => setDragOver(false) : undefined}
      onDrop={assetMode && allowAssetInput ? (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file && (file.type.startsWith('image/') || file.name.endsWith('.svg'))) handleFile(file); } : undefined}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      {assetMode && allowAssetInput && <input ref={fileInputRef} type="file" accept="image/*,.svg" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = ''; }} />}
      <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontFamily: 'var(--mono, monospace)', fontSize: 9, letterSpacing: '.26em', color: NOX_COLORS.textDim, pointerEvents: 'none' }}>
        <span>{assetMode ? assetLabel : `PARTICLE REVEAL // ${reduced ? 'STATIC' : hoverCapable ? 'TRACK' : 'DRIFT'}`}</span>
        {assetMode && allowAssetInput && <span style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ fontFamily: 'inherit', fontSize: 9, color: NOX_COLORS.text, background: `${color}22`, border: `1px solid ${color}55`, borderRadius: 5, padding: '4px 8px', cursor: 'pointer' }}>DROP / SELECT</button>
          <button type="button" onClick={loadDefault} style={{ fontFamily: 'inherit', fontSize: 9, color: NOX_COLORS.textDim, background: 'transparent', border: '1px solid #333', borderRadius: 5, padding: '4px 8px', cursor: 'pointer' }}>RESET</button>
        </span>}
      </div>
      {dragOver && assetMode && <div style={{ position: 'absolute', inset: 10, border: `1.5px dashed ${color}`, borderRadius: 10, display: 'grid', placeItems: 'center', background: `${color}11`, pointerEvents: 'none', fontFamily: 'var(--mono, monospace)', fontSize: 11, letterSpacing: '.2em', color }}>DROP TO SAMPLE</div>}
    </div>
  );
}


export default ParticleFieldSystem;
