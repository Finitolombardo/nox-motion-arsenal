import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { clamp, damp, lerp, seededRandom, smoothstep, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useCanvas2D } from '../../lib/canvasUtils';

export const SIGNAL_PARTICLE_VARIANTS = [
  'energy-smoke-flow',
  'agent-constellation',
  'revenue-funnel',
  'forge-murmuration',
  'signal-vortex',
  'command-formation',
] as const;

export const SIGNAL_PARTICLE_ENERGIES = ['calm', 'charged', 'overdrive'] as const;

export type SignalParticleVariant = (typeof SIGNAL_PARTICLE_VARIANTS)[number];
export type SignalParticleEnergy = (typeof SIGNAL_PARTICLE_ENERGIES)[number];

type Rgb = readonly [number, number, number];
/** Woher neue Partikel in den Strom eingespeist werden. */
type SpawnZone = 'field' | 'edge' | 'upstream' | 'ring' | 'base';

interface SignalPreset {
  id: SignalParticleVariant;
  shortLabel: string;
  label: string;
  kicker: string;
  reference: string;
  primary: Rgb;
  secondary: Rgb;
  light: Rgb;
  background: string;
  /** Frequenz des Strömungsfeldes (1/px). Klein = weite, ruhige Schwaden. */
  flowScale: number;
  /** Wie schnell sich das Feld selbst verformt. */
  flowDrift: number;
  /** Streckung des Feldes in x/y — erzeugt gerichtete Bänder statt Wolken. */
  anisotropy: number;
  /** Tangentialanteil am Cursor: > 0 spiralt ein, statt direkt zu treffen. */
  swirl: number;
  /** Eigenturbulenz der Variante, multipliziert auf den Turbulence-Regler. */
  turbulence: number;
  /** Wie stark sich die gesamte Strömung Richtung Attraktor neigt. */
  convergenceBias: number;
  spawn: SpawnZone;
}

interface EnergyPreset {
  id: SignalParticleEnergy;
  label: string;
  speed: number;
  glow: number;
  turbulence: number;
  density: number;
}

export const SIGNAL_PARTICLE_PRESETS: Record<SignalParticleVariant, SignalPreset> = {
  'energy-smoke-flow': {
    id: 'energy-smoke-flow', shortLabel: 'SMOKE', label: 'Energy Smoke Flow', kicker: 'FLOW // ATTRACT // CONVERGE', reference: 'motion:premium-signal-particles@energy-smoke-flow',
    primary: [124, 126, 255], secondary: [45, 226, 210], light: [235, 249, 255],
    flowScale: 0.0021, flowDrift: 0.09, anisotropy: 1, swirl: 0.52, turbulence: 1, convergenceBias: 1, spawn: 'field',
    background: 'radial-gradient(78% 74% at 50% 50%,rgba(52,50,150,.22),transparent 70%),linear-gradient(180deg,#05060f,#010104)',
  },
  'agent-constellation': {
    id: 'agent-constellation', shortLabel: 'AGENTS', label: 'Agent Constellation Drift', kicker: 'NODES // ROUTING // CONSENSUS', reference: 'motion:premium-signal-particles@agent-constellation',
    primary: [124, 126, 255], secondary: [45, 226, 210], light: [235, 249, 255],
    flowScale: 0.0016, flowDrift: 0.07, anisotropy: 1, swirl: 0.38, turbulence: 0.72, convergenceBias: 0.85, spawn: 'ring',
    background: 'radial-gradient(76% 72% at 50% 50%,rgba(66,63,186,.23),transparent 68%),linear-gradient(180deg,#060711,#020205)',
  },
  'revenue-funnel': {
    id: 'revenue-funnel', shortLabel: 'REVENUE', label: 'Revenue Funnel Flight', kicker: 'ATTENTION // QUALIFY // CLOSE', reference: 'motion:premium-signal-particles@revenue-funnel',
    primary: [242, 183, 75], secondary: [255, 101, 61], light: [255, 248, 224],
    flowScale: 0.0018, flowDrift: 0.1, anisotropy: 2.1, swirl: 0.3, turbulence: 0.66, convergenceBias: 1.15, spawn: 'upstream',
    background: 'radial-gradient(74% 68% at 58% 52%,rgba(156,98,22,.22),transparent 68%),linear-gradient(180deg,#0b0804,#030201)',
  },
  'forge-murmuration': {
    id: 'forge-murmuration', shortLabel: 'FORGE', label: 'Forge Ember Murmuration', kicker: 'CHAOS // DISCIPLINE // FORM', reference: 'motion:premium-signal-particles@forge-murmuration',
    primary: [255, 76, 55], secondary: [218, 155, 65], light: [255, 239, 214],
    flowScale: 0.0029, flowDrift: 0.16, anisotropy: 0.85, swirl: 0.72, turbulence: 1.5, convergenceBias: 0.95, spawn: 'base',
    background: 'radial-gradient(80% 70% at 50% 56%,rgba(132,27,18,.24),transparent 68%),linear-gradient(180deg,#090607,#020203)',
  },
  'signal-vortex': {
    id: 'signal-vortex', shortLabel: 'VORTEX', label: 'Signal Resonance Vortex', kicker: 'NOISE // RESONANCE // DEMAND', reference: 'motion:premium-signal-particles@signal-vortex',
    primary: [255, 74, 164], secondary: [111, 101, 255], light: [255, 239, 251],
    flowScale: 0.0024, flowDrift: 0.12, anisotropy: 1, swirl: 1.15, turbulence: 1.1, convergenceBias: 1.3, spawn: 'edge',
    background: 'radial-gradient(82% 74% at 50% 50%,rgba(137,31,104,.24),transparent 70%),linear-gradient(180deg,#0a040b,#020204)',
  },
  'command-formation': {
    id: 'command-formation', shortLabel: 'COMMAND', label: 'Command Formation Stream', kicker: 'DEPLOY // ALIGN // EXECUTE', reference: 'motion:premium-signal-particles@command-formation',
    primary: [73, 171, 255], secondary: [120, 255, 208], light: [234, 249, 255],
    flowScale: 0.0014, flowDrift: 0.06, anisotropy: 1.6, swirl: 0.26, turbulence: 0.5, convergenceBias: 0.9, spawn: 'edge',
    background: 'radial-gradient(75% 70% at 50% 48%,rgba(35,103,170,.22),transparent 70%),linear-gradient(180deg,#030811,#010204)',
  },
};

export const SIGNAL_PARTICLE_ENERGY_PRESETS: Record<SignalParticleEnergy, EnergyPreset> = {
  calm: { id: 'calm', label: 'CALM', speed: 0.66, glow: 0.72, turbulence: 0.6, density: 0.78 },
  charged: { id: 'charged', label: 'CHARGED', speed: 1, glow: 1, turbulence: 1, density: 1 },
  overdrive: { id: 'overdrive', label: 'OVERDRIVE', speed: 1.46, glow: 1.34, turbulence: 1.45, density: 1.18 },
};

export interface NoxSignalParticlesProps {
  /** Partikel im Strom. Wird auf kleinen Viewports automatisch reduziert. */
  count?: number;
  /** Grundgeschwindigkeit des Strömungsfeldes. */
  flowSpeed?: number;
  /** Anziehungskraft des (geglätteten) Cursors. */
  cursorAttraction?: number;
  /** Individuelle Störbeschleunigung pro Partikel. */
  turbulence?: number;
  /** Zähigkeit des Mediums — hoch = träger, rauchiger Fluss. */
  viscosity?: number;
  /** Wie lange der Rauch als Smear stehen bleibt (0 = keine Spur). */
  smokePersistence?: number;
  particleSize?: number;
  glow?: number;
  /** Radius (px), in dem sich der Strom um den Cursor verdichtet. */
  convergenceRadius?: number;
  variant?: SignalParticleVariant;
  energy?: SignalParticleEnergy;
  showVariantSwitcher?: boolean;
  showEnergySwitcher?: boolean;
}

interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  /** Parallax-Ebene 0..1 — steuert Kraftantwort, Größe und Deckkraft. */
  depth: number;
  age: number;
  life: number;
  size: number;
  /** Eigener Offset im Turbulenzfeld, damit Partikel nicht im Gleichtakt zittern. */
  flowOffsetX: number;
  flowOffsetY: number;
  /** Ausblenden beim Erreichen des Zentrums, bevor neu eingespeist wird. */
  fade: number;
  seed: number;
}

const rgba = (rgb: Rgb, alpha: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;

/**
 * Perlin-artiges 2D-Gradientenrauschen mit deterministischem Seed. Basis für
 * das Curl-Feld. Ungeseedete Zufallsquellen sind im Arsenal bewusst verboten,
 * damit Previews reproduzierbar bleiben.
 */
function createNoise2D(seed: number) {
  const rnd = seededRandom(seed);
  const perm = new Uint8Array(512);
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = base[i];
    base[i] = base[j];
    base[j] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255];

  const grad = new Float32Array(512);
  for (let i = 0; i < 256; i++) {
    const angle = (i / 256) * Math.PI * 2;
    grad[i * 2] = Math.cos(angle);
    grad[i * 2 + 1] = Math.sin(angle);
  }

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

  return (x: number, y: number): number => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const u = fade(xf);
    const v = fade(yf);
    const dot = (h: number, dx: number, dy: number) => grad[(h & 255) * 2] * dx + grad[(h & 255) * 2 + 1] * dy;
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    const top = lerp(dot(aa, xf, yf), dot(ba, xf - 1, yf), u);
    const bottom = lerp(dot(ab, xf, yf - 1), dot(bb, xf - 1, yf - 1), u);
    return lerp(top, bottom, v);
  };
}

/** Weiche radiale Sprites — deutlich billiger als createRadialGradient pro Partikel. */
function createSprite(color: Rgb, softness: number, size = 64): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext('2d');
  if (!ctx) return sprite;
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, rgba(color, 1));
  gradient.addColorStop(softness * 0.5, rgba(color, 0.34 * (1 - softness * 0.5)));
  gradient.addColorStop(softness, rgba(color, 0.08));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return sprite;
}

const STYLES = `
.nsp-root{--nsp-primary:124,126,255;--nsp-secondary:45,226,210;--nsp-light:235,249,255;--nsp-glow:1;position:absolute;inset:0;overflow:hidden;isolation:isolate}.nsp-root *{box-sizing:border-box}.nsp-grid{position:absolute;inset:0;opacity:.08;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:34px 34px;mask-image:radial-gradient(ellipse at center,#000 14%,transparent 74%)}.nsp-aura{position:absolute;inset:-30%;background:conic-gradient(from 0deg at 50% 50%,transparent 0 18%,rgba(var(--nsp-primary),.07) 26%,transparent 36% 57%,rgba(var(--nsp-secondary),.06) 65%,transparent 76%);filter:blur(60px);animation:nsp-spin 34s linear infinite}.nsp-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,.6) 100%);pointer-events:none}.nsp-ui{position:absolute;top:14px;left:14px;right:14px;z-index:5;display:flex;justify-content:space-between;gap:12px;pointer-events:none}.nsp-stack{display:flex;flex-direction:column;gap:5px}.nsp-controls{display:flex;flex-wrap:wrap;gap:5px;pointer-events:auto}.nsp-btn{appearance:none;border:1px solid rgba(255,255,255,.1);background:rgba(4,4,8,.62);color:rgba(255,255,255,.42);border-radius:999px;padding:6px 9px;font:700 7.5px/1 var(--mono,monospace);letter-spacing:.12em;cursor:pointer;backdrop-filter:blur(10px)}.nsp-btn[data-active='true']{color:rgb(var(--nsp-light));border-color:rgba(var(--nsp-primary),.55);box-shadow:0 0 14px rgba(var(--nsp-primary),.2)}.nsp-heading{position:absolute;left:16px;bottom:16px;z-index:5;pointer-events:none}.nsp-title{font-size:11px;font-weight:800;letter-spacing:.17em;color:rgb(var(--nsp-light));text-transform:uppercase}.nsp-kicker{margin-top:5px;font:700 7px/1 var(--mono,monospace);letter-spacing:.27em;color:rgba(var(--nsp-light),.34)}.nsp-mode{position:absolute;right:16px;bottom:15px;z-index:5;font:700 8px/1 var(--mono,monospace);letter-spacing:.18em;color:rgba(var(--nsp-secondary),.7)}.nsp-copy{position:absolute;right:16px;bottom:39px;z-index:5;border:1px solid rgba(255,255,255,.1);background:rgba(4,4,8,.62);color:rgba(255,255,255,.5);padding:7px 10px;border-radius:8px;font:700 8px/1 var(--mono,monospace);letter-spacing:.12em;cursor:pointer}.nsp-root[data-energy='overdrive'] .nsp-aura{animation-duration:16s;opacity:1}.nsp-root[data-energy='calm'] .nsp-aura{animation-duration:48s;opacity:.6}@keyframes nsp-spin{to{transform:rotate(360deg)}}@media(max-width:660px){.nsp-ui{align-items:flex-start}.nsp-controls{max-width:240px}.nsp-heading{display:none}.nsp-copy{display:none}}@media(prefers-reduced-motion:reduce){.nsp-aura{animation:none!important}}
`;

export function NoxSignalParticles({
  count = 260,
  flowSpeed = 1,
  cursorAttraction = 1,
  turbulence = 0.45,
  viscosity = 1.35,
  smokePersistence = 0.82,
  particleSize = 1,
  glow = 1,
  convergenceRadius = 220,
  variant = 'energy-smoke-flow',
  energy = 'charged',
  showVariantSwitcher = true,
  showEnergySwitcher = true,
}: NoxSignalParticlesProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const particles = useRef<Particle[]>([]);
  const signatureRef = useRef('');
  /** Träger Attraktor — folgt dem echten Pointer verzögert. */
  const attractor = useRef({ x: 0.5, y: 0.5, vx: 0, vy: 0, engaged: 0 });
  const impulse = useRef(0);
  const spawnRandom = useRef(seededRandom(1337));
  const [activeVariant, setActiveVariant] = useState<SignalParticleVariant>(variant);
  const [activeEnergy, setActiveEnergy] = useState<SignalParticleEnergy>(energy);
  const [copied, setCopied] = useState(false);

  useEffect(() => setActiveVariant(variant), [variant]);
  useEffect(() => setActiveEnergy(energy), [energy]);

  const preset = SIGNAL_PARTICLE_PRESETS[activeVariant];
  const energyPreset = SIGNAL_PARTICLE_ENERGY_PRESETS[activeEnergy];

  const seed = useMemo(() => SIGNAL_PARTICLE_VARIANTS.indexOf(activeVariant) * 173 + 4242, [activeVariant]);
  const noise = useMemo(() => createNoise2D(seed), [seed]);

  // Mobile bekommt weniger Partikel: gleiche Optik, deutlich kleinere Last.
  const safeCount = useMemo(() => {
    const requested = clamp(Math.round(count), 40, 520);
    if (typeof window === 'undefined') return requested;
    const narrow = window.innerWidth < 720;
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const cap = narrow || coarse ? 150 : 520;
    return Math.min(requested, cap);
  }, [count]);

  const sprites = useMemo(() => ({
    core: createSprite(preset.light, 0.28),
    primary: createSprite(preset.primary, 0.52),
    secondary: createSprite(preset.secondary, 0.52),
    smoke: createSprite(preset.primary, 0.92, 96),
    smokeAlt: createSprite(preset.secondary, 0.92, 96),
  }), [preset]);

  const signature = `${activeVariant}:${safeCount}`;
  if (signatureRef.current !== signature) {
    const rnd = seededRandom(seed + safeCount);
    particles.current = Array.from({ length: safeCount }, (_, i) => ({
      x: Number.NaN, y: Number.NaN, px: 0, py: 0, vx: 0, vy: 0, ax: 0, ay: 0,
      depth: 0.18 + rnd() * 0.82,
      age: rnd() * 6,
      life: 5.5 + rnd() * 7.5,
      size: 0.55 + rnd() * 1.15,
      flowOffsetX: rnd() * 1000,
      flowOffsetY: rnd() * 1000,
      fade: 1,
      seed: i,
    }));
    signatureRef.current = signature;
  }

  useCanvas2D(canvasRef, (ctx, size, dt, elapsed) => {
    const { w, h } = size;
    const minSide = Math.min(w, h);
    const list = particles.current;
    if (!list.length) return;

    const speedScale = flowSpeed * energyPreset.speed * (reduced ? 0.22 : 1);
    const radius = clamp(convergenceRadius, 40, 900);
    const attraction = cursorAttraction * (reduced ? 0 : 1);

    // --- Attraktor: geglätteter Pointer, sonst langsamer Auto-Flow ----------
    const p = pointer.current;
    const autoX = 0.5 + 0.23 * Math.sin(elapsed * 0.17) + 0.07 * Math.sin(elapsed * 0.41);
    const autoY = 0.5 + 0.17 * Math.cos(elapsed * 0.13) + 0.06 * Math.cos(elapsed * 0.37);
    const targetX = p.inside ? p.tx : autoX;
    const targetY = p.inside ? p.ty : autoY;
    const a = attractor.current;
    const prevAx = a.x;
    const prevAy = a.y;
    // Verzögertes Folgen erzeugt den nachgezogenen Rauchstrom statt Zittern.
    const followLambda = p.inside ? (reduced ? 1.4 : 4.6) : 1.1;
    a.x = Number.isFinite(a.x) ? damp(a.x, targetX, followLambda, dt) : targetX;
    a.y = Number.isFinite(a.y) ? damp(a.y, targetY, followLambda, dt) : targetY;
    a.vx = dt > 0 ? (a.x - prevAx) / dt : 0;
    a.vy = dt > 0 ? (a.y - prevAy) / dt : 0;
    a.engaged = damp(a.engaged, p.inside ? 1 : 0.45, 2.2, dt);
    const ax = a.x * w;
    const ay = a.y * h;
    const dragX = a.vx * w;
    const dragY = a.vy * h;
    const pointerSpeed = clamp(Math.hypot(dragX, dragY) / 900, 0, 1);

    impulse.current = Math.max(0, impulse.current - dt * 1.25);
    // Kurze Kompression, danach weiches Ausströmen — kein sprengender Ring.
    const impulsePhase = impulse.current;
    const impulseAttraction = impulsePhase > 0.35 ? 1 + (impulsePhase - 0.35) * 1.9 : 1 - impulsePhase * 0.55;

    // --- Strömungsfeld: Curl eines Rauschpotentials (divergenzfrei) --------
    const flowScale = preset.flowScale;
    const drift = elapsed * preset.flowDrift * speedScale;
    const EPS = 0.6;
    const potential = (nx: number, ny: number) =>
      noise(nx, ny + drift) + 0.5 * noise(nx * 2.3 + 31.7, ny * 2.3 - drift * 0.8);

    const curl = (x: number, y: number, out: { x: number; y: number }) => {
      const nx = x * flowScale * preset.anisotropy;
      const ny = y * flowScale;
      out.x = (potential(nx, ny + EPS) - potential(nx, ny - EPS)) / (2 * EPS);
      out.y = -(potential(nx + EPS, ny) - potential(nx - EPS, ny)) / (2 * EPS);
    };

    const flow = { x: 0, y: 0 };
    // Fortlaufender deterministischer Strom — pro Frame neu gesetzt würden alle
    // Respawns eines Frames auf demselben Punkt landen.
    const rnd = spawnRandom.current;
    const maxSpeed = 520 * energyPreset.speed;
    const turbulenceAmount = turbulence * preset.turbulence * energyPreset.turbulence;
    const damping = Math.exp(-clamp(viscosity, 0.1, 6) * dt);

    const respawn = (s: Particle) => {
      const r0 = rnd();
      const r1 = rnd();
      const spread = minSide * (0.5 + r1 * 0.5);
      switch (preset.spawn) {
        case 'edge': {
          const angle = r0 * Math.PI * 2;
          s.x = w * 0.5 + Math.cos(angle) * spread;
          s.y = h * 0.5 + Math.sin(angle) * spread * 0.8;
          break;
        }
        case 'upstream': {
          // Gegen die Hauptströmung einspeisen, damit der Strom „gefüttert" wirkt.
          s.x = -w * 0.05 + r0 * w * 0.25;
          s.y = h * r1;
          break;
        }
        case 'ring': {
          const angle = r0 * Math.PI * 2;
          s.x = ax + Math.cos(angle) * radius * (1.6 + r1 * 1.4);
          s.y = ay + Math.sin(angle) * radius * (1.6 + r1 * 1.4);
          break;
        }
        case 'base': {
          s.x = w * r0;
          s.y = h * (0.86 + r1 * 0.2);
          break;
        }
        default:
          s.x = w * r0;
          s.y = h * r1;
      }
      s.px = s.x;
      s.py = s.y;
      s.vx = 0;
      s.vy = 0;
      s.age = 0;
      s.life = 5.5 + r1 * 7.5;
      s.fade = 0;
    };

    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (!Number.isFinite(s.x)) respawn(s);

      s.px = s.x;
      s.py = s.y;

      // 1. Strömungsfeld
      curl(s.x + s.flowOffsetX * 0.04, s.y + s.flowOffsetY * 0.04, flow);
      const depthResponse = 0.55 + s.depth * 0.75;
      s.ax = flow.x * 330 * speedScale * depthResponse;
      s.ay = flow.y * 330 * speedScale * depthResponse;

      // 2. Cursor-Anziehung + tangentialer Curl (spiralt ein statt zu kreisen)
      const dx = ax - s.x;
      const dy = ay - s.y;
      const dist = Math.max(6, Math.hypot(dx, dy));
      const norm = dist / radius;
      const pull = (attraction * 780 * impulseAttraction * a.engaged) / (1 + norm * norm * 2.1);
      const ux = dx / dist;
      const uy = dy / dist;
      s.ax += ux * pull * depthResponse;
      s.ay += uy * pull * depthResponse;

      // Tangentialanteil klingt zum Zentrum hin ab — sonst entstünden Orbits.
      const swirl = preset.swirl * pull * smoothstep(0, radius * 1.1, dist) * 0.62;
      s.ax += -uy * swirl;
      s.ay += ux * swirl;

      // 3. Die gesamte Strömung neigt sich Richtung Attraktor
      const bias = preset.convergenceBias * attraction * 46 * a.engaged * smoothstep(radius * 3.4, radius * 0.6, dist);
      s.ax += ux * bias;
      s.ay += uy * bias;

      // 4. Schnelle Mausbewegung zieht den Strom mit
      const dragInfluence = 1 / (1 + (dist / (radius * 1.5)) ** 2);
      s.ax += dragX * 0.42 * dragInfluence * attraction;
      s.ay += dragY * 0.42 * dragInfluence * attraction;

      // 5. Individuelle Turbulenz
      const tx = noise(s.x * flowScale * 4.1 + s.flowOffsetX, s.y * flowScale * 4.1 + drift * 2.2);
      const ty = noise(s.y * flowScale * 4.1 + s.flowOffsetY, s.x * flowScale * 4.1 - drift * 1.7);
      s.ax += tx * 190 * turbulenceAmount;
      s.ay += ty * 190 * turbulenceAmount;

      // Integration: Kräfte → Velocity → Position (kein Dampen auf Zielpunkte)
      s.vx = (s.vx + s.ax * dt) * damping;
      s.vy = (s.vy + s.ay * dt) * damping;
      const velocity = Math.hypot(s.vx, s.vy);
      if (velocity > maxSpeed) {
        s.vx = (s.vx / velocity) * maxSpeed;
        s.vy = (s.vy / velocity) * maxSpeed;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      s.age += dt;
      s.fade = Math.min(1, s.fade + dt * 1.6);

      // Im Kern verblassen und neu einspeisen. Muss auch ohne Pointer greifen,
      // sonst sammelt der Auto-Attraktor alle Partikel auf einem Punkt und der
      // additive Kern brennt aus.
      if (dist < radius * 0.19) s.fade -= dt * (1.6 + a.engaged * 1.4);
      const outside = s.x < -w * 0.3 || s.x > w * 1.3 || s.y < -h * 0.3 || s.y > h * 1.3;
      if (s.fade <= 0 || s.age > s.life || outside) respawn(s);
    }

    // --- Rendering ---------------------------------------------------------
    // Smear statt Clear: der Rauch bleibt als abklingende Spur stehen.
    const persistence = clamp(smokePersistence, 0, 0.97);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(3,4,9,${clamp(0.34 - persistence * 0.31, 0.02, 0.4)})`;
    ctx.fillRect(0, 0, w, h);

    // Kleine Canvas (Mobile, Thumbnails) tragen dieselbe Partikelzahl auf viel
    // weniger Fläche — ohne Ausgleich brennt der additive Kern dort aus.
    const areaScale = clamp(Math.sqrt((w * h) / 468_000), 0.62, 1.15);
    const glowAmount = glow * energyPreset.glow * areaScale;
    const density = energyPreset.density;

    // Rauchschicht (weich, nicht additiv → kein Neon-Konfetti)
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const alpha = clamp(s.fade * 0.05 * density * (0.35 + s.depth * 0.65), 0, 0.14);
      if (alpha <= 0.002) continue;
      const sprite = s.seed % 2 ? sprites.smoke : sprites.smokeAlt;
      const r = s.size * particleSize * (14 + s.depth * 26);
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, s.x - r, s.y - r, r * 2, r * 2);
    }

    // Gebogene Bewegungssegmente statt gerader Schweife
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const dx = s.x - s.px;
      const dy = s.y - s.py;
      const travel = Math.hypot(dx, dy);
      if (travel < 0.35) continue;
      const speedFade = clamp(travel / 9, 0, 1);
      const color = s.depth > 0.6 ? preset.primary : preset.secondary;
      // Kontrollpunkt senkrecht zur Bewegung → sichtbar gekrümmtes Segment.
      const cx = s.px + dx * 0.5 - dy * 0.32;
      const cy = s.py + dy * 0.5 + dx * 0.32;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = rgba(color, clamp(0.1 * speedFade * s.fade * glowAmount * (0.3 + s.depth), 0, 0.4));
      ctx.lineWidth = Math.max(0.4, s.size * particleSize * (0.5 + s.depth * 0.9));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.quadraticCurveTo(cx, cy, s.x, s.y);
      ctx.stroke();
    }

    // Energiekerne mit weichem Glow
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const sprite = s.depth > 0.6 ? sprites.primary : sprites.secondary;
      const r = s.size * particleSize * (2.1 + s.depth * 4.6);
      const alpha = clamp(s.fade * (0.16 + s.depth * 0.3) * glowAmount * density, 0, 0.8);
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, s.x - r, s.y - r, r * 2, r * 2);
      if (s.depth > 0.74) {
        const cr = r * 0.34;
        ctx.globalAlpha = clamp(alpha * 0.8, 0, 0.7);
        ctx.drawImage(sprites.core, s.x - cr, s.y - cr, cr * 2, cr * 2);
      }
    }

    // Verdichtung am Cursor: leicht stärkerer Glow, kein harter Ring.
    const convergenceGlow = clamp((0.05 + pointerSpeed * 0.07 + impulsePhase * 0.1) * glowAmount * a.engaged, 0, 0.3);
    if (convergenceGlow > 0.004) {
      const r = radius * (0.75 + impulsePhase * 0.25);
      ctx.globalAlpha = convergenceGlow;
      ctx.drawImage(sprites.smoke, ax - r, ay - r, r * 2, r * 2);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, true);

  const onImpulse = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Der Impuls setzt am Attraktor an, nicht als eigene Explosion im Feld.
    attractor.current.x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    attractor.current.y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    impulse.current = 1;
  };

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(`${preset.reference} + energy:${activeEnergy}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const style = {
    '--nsp-primary': preset.primary.join(','),
    '--nsp-secondary': preset.secondary.join(','),
    '--nsp-light': preset.light.join(','),
    '--nsp-glow': energyPreset.glow,
    background: preset.background,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="nsp-root" data-variant={activeVariant} data-energy={activeEnergy} data-reduced={reduced} style={style} onPointerDown={onImpulse}>
      <style>{STYLES}</style><div className="nsp-grid" /><div className="nsp-aura" /><canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} /><div className="nsp-vignette" />
      <div className="nsp-ui">
        <div className="nsp-stack">
          {showVariantSwitcher ? <div className="nsp-controls" aria-label="Signal particle variants">{SIGNAL_PARTICLE_VARIANTS.map((id) => <button key={id} type="button" className="nsp-btn" data-active={id === activeVariant} onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()} onClick={() => setActiveVariant(id)}>{SIGNAL_PARTICLE_PRESETS[id].shortLabel}</button>)}</div> : null}
        </div>
        {showEnergySwitcher ? <div className="nsp-controls" aria-label="Signal particle energy">{SIGNAL_PARTICLE_ENERGIES.map((id) => <button key={id} type="button" className="nsp-btn" data-active={id === activeEnergy} onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()} onClick={() => setActiveEnergy(id)}>{SIGNAL_PARTICLE_ENERGY_PRESETS[id].label}</button>)}</div> : null}
      </div>
      <div className="nsp-heading"><div className="nsp-title">{preset.label}</div><div className="nsp-kicker">{preset.kicker}</div></div>
      <div className="nsp-mode">FLOW // {reduced ? 'CALM DRIFT' : 'CURL FIELD'}</div><button type="button" className="nsp-copy" onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()} onClick={copyReference}>{copied ? 'COPIED' : 'COPY CONFIG'}</button>
    </div>
  );
}

export default NoxSignalParticles;
