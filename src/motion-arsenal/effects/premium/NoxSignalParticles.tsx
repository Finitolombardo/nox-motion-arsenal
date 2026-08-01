import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { clamp, damp, seededRandom, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';
import { useCanvas2D } from '../../lib/canvasUtils';

export const SIGNAL_PARTICLE_VARIANTS = [
  'agent-constellation',
  'revenue-funnel',
  'forge-murmuration',
  'signal-vortex',
  'command-formation',
] as const;

export const SIGNAL_PARTICLE_ENERGIES = ['calm', 'charged', 'overdrive'] as const;
export const SIGNAL_PARTICLE_MODES = ['auto', 'orbit', 'swarm', 'settle'] as const;

export type SignalParticleVariant = (typeof SIGNAL_PARTICLE_VARIANTS)[number];
export type SignalParticleEnergy = (typeof SIGNAL_PARTICLE_ENERGIES)[number];
export type SignalParticleMode = (typeof SIGNAL_PARTICLE_MODES)[number];
type SignalParticleVariantAlias = 'revenue-funnel-flight' | 'forge-ember-murmuration' | 'signal-resonance-vortex';
type Rgb = readonly [number, number, number];
type FlowProfile = 'flow' | 'gather' | 'vortex';

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
  flowScale: number;
  curlBias: number;
  focusBias: number;
}

interface EnergyPreset {
  id: SignalParticleEnergy;
  label: string;
  speed: number;
  glow: number;
  persistence: number;
  turbulence: number;
  focus: number;
}

export const SIGNAL_PARTICLE_PRESETS: Record<SignalParticleVariant, SignalPreset> = {
  'agent-constellation': {
    id: 'agent-constellation', shortLabel: 'AGENTS', label: 'Agent Signal Current', kicker: 'SIGNALS // ROUTING // CONVERGENCE', reference: 'motion:premium-signal-particles@agent-constellation', primary: [124, 126, 255], secondary: [45, 226, 210], light: [235, 249, 255], flowScale: 1, curlBias: 0.92, focusBias: 1.08,
    background: 'radial-gradient(72% 68% at 50% 50%,rgba(66,63,186,.18),transparent 70%),linear-gradient(180deg,#060711,#020205)',
  },
  'revenue-funnel': {
    id: 'revenue-funnel', shortLabel: 'REVENUE', label: 'Revenue Energy Current', kicker: 'ATTENTION // FLOW // CONVERSION', reference: 'motion:premium-signal-particles@revenue-funnel', primary: [242, 183, 75], secondary: [255, 101, 61], light: [255, 248, 224], flowScale: 0.82, curlBias: 0.72, focusBias: 1.24,
    background: 'radial-gradient(74% 68% at 58% 52%,rgba(156,98,22,.18),transparent 70%),linear-gradient(180deg,#0b0804,#030201)',
  },
  'forge-murmuration': {
    id: 'forge-murmuration', shortLabel: 'FORGE', label: 'Forge Smoke Current', kicker: 'EMBER // PRESSURE // FORM', reference: 'motion:premium-signal-particles@forge-murmuration', primary: [255, 76, 55], secondary: [218, 155, 65], light: [255, 239, 214], flowScale: 1.2, curlBias: 1.28, focusBias: 0.9,
    background: 'radial-gradient(80% 70% at 50% 56%,rgba(132,27,18,.2),transparent 70%),linear-gradient(180deg,#090607,#020203)',
  },
  'signal-vortex': {
    id: 'signal-vortex', shortLabel: 'VORTEX', label: 'Signal Distortion Vortex', kicker: 'NOISE // CURL // GRAVITY', reference: 'motion:premium-signal-particles@signal-vortex', primary: [255, 74, 164], secondary: [111, 101, 255], light: [255, 239, 251], flowScale: 1.08, curlBias: 1.5, focusBias: 0.82,
    background: 'radial-gradient(82% 74% at 50% 50%,rgba(137,31,104,.2),transparent 72%),linear-gradient(180deg,#0a040b,#020204)',
  },
  'command-formation': {
    id: 'command-formation', shortLabel: 'COMMAND', label: 'Command Energy Stream', kicker: 'DEPLOY // ALIGN // ABSORB', reference: 'motion:premium-signal-particles@command-formation', primary: [73, 171, 255], secondary: [120, 255, 208], light: [234, 249, 255], flowScale: 0.72, curlBias: 0.58, focusBias: 1.38,
    background: 'radial-gradient(75% 70% at 50% 48%,rgba(35,103,170,.18),transparent 72%),linear-gradient(180deg,#030811,#010204)',
  },
};

export const SIGNAL_PARTICLE_ENERGY_PRESETS: Record<SignalParticleEnergy, EnergyPreset> = {
  calm: { id: 'calm', label: 'CALM', speed: 0.72, glow: 0.64, persistence: 0.84, turbulence: 0.62, focus: 0.78 },
  charged: { id: 'charged', label: 'CHARGED', speed: 1, glow: 1, persistence: 1, turbulence: 1, focus: 1 },
  overdrive: { id: 'overdrive', label: 'OVERDRIVE', speed: 1.36, glow: 1.42, persistence: 1.18, turbulence: 1.34, focus: 1.24 },
};

export interface NoxSignalParticlesProps {
  count?: number;
  mode?: SignalParticleMode;
  intensity?: number;
  sparkSize?: number;
  variant?: SignalParticleVariant | SignalParticleVariantAlias;
  energy?: SignalParticleEnergy;
  trailLength?: number;
  /** Alias used by the Arsenal control schema. */
  trailPersistence?: number;
  /** Legacy name retained for saved configs; now controls the pointer-attraction radius. */
  linkDistance?: number;
  showVariantSwitcher?: boolean;
  showEnergySwitcher?: boolean;
  showModeSwitcher?: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  size: number;
  depth: number;
  age: number;
  life: number;
  generation: number;
}

interface Burst {
  x: number;
  y: number;
  started: number;
}

interface FlowTarget {
  x: number;
  y: number;
  px: number;
  py: number;
}

const rgba = (rgb: Rgb, alpha: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
const hash01 = (value: number) => {
  const n = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return n - Math.floor(n);
};

function normalizeVariant(value: SignalParticleVariant | SignalParticleVariantAlias): SignalParticleVariant {
  if (value === 'revenue-funnel-flight') return 'revenue-funnel';
  if (value === 'forge-ember-murmuration') return 'forge-murmuration';
  if (value === 'signal-resonance-vortex') return 'signal-vortex';
  return value;
}

function activeProfileFor(requested: SignalParticleMode, elapsed: number): FlowProfile {
  if (requested === 'orbit') return 'vortex';
  if (requested === 'swarm') return 'gather';
  if (requested === 'settle') return 'flow';
  const phases: FlowProfile[] = ['flow', 'gather', 'vortex', 'gather'];
  return phases[Math.floor(elapsed / 6.5) % phases.length] ?? 'flow';
}

function resetSpark(spark: Spark, index: number, w: number, h: number, targetX: number, targetY: number) {
  spark.generation += 1;
  const seed = index * 173 + spark.generation * 977;
  const edge = Math.floor(hash01(seed + 1) * 4);
  const margin = 18 + hash01(seed + 2) * 54;
  const along = hash01(seed + 3);

  if (edge === 0) {
    spark.x = -margin;
    spark.y = along * h;
  } else if (edge === 1) {
    spark.x = w + margin;
    spark.y = along * h;
  } else if (edge === 2) {
    spark.x = along * w;
    spark.y = -margin;
  } else {
    spark.x = along * w;
    spark.y = h + margin;
  }

  const dx = targetX - spark.x;
  const dy = targetY - spark.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const launch = 5 + hash01(seed + 4) * 12;
  spark.vx = (dx / distance) * launch + (hash01(seed + 5) - 0.5) * 8;
  spark.vy = (dy / distance) * launch + (hash01(seed + 6) - 0.5) * 8;
  spark.phase = hash01(seed + 7) * Math.PI * 2;
  spark.age = 0;
  spark.life = 7 + hash01(seed + 8) * 9;
}

const STYLES = `
.nsp-root{--nsp-primary:124,126,255;--nsp-secondary:45,226,210;--nsp-light:235,249,255;position:absolute;inset:0;overflow:hidden;isolation:isolate}.nsp-root *{box-sizing:border-box}.nsp-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 28%,rgba(0,0,0,.56) 100%);pointer-events:none}.nsp-ui{position:absolute;top:14px;left:14px;right:14px;z-index:5;display:flex;justify-content:space-between;gap:12px;pointer-events:none}.nsp-stack{display:flex;flex-direction:column;gap:5px}.nsp-controls{display:flex;flex-wrap:wrap;gap:5px;pointer-events:auto}.nsp-btn{appearance:none;border:1px solid rgba(255,255,255,.1);background:rgba(4,4,8,.62);color:rgba(255,255,255,.42);border-radius:999px;padding:6px 9px;font:700 7.5px/1 var(--mono,monospace);letter-spacing:.12em;cursor:pointer;backdrop-filter:blur(10px)}.nsp-btn[data-active='true']{color:rgb(var(--nsp-light));border-color:rgba(var(--nsp-primary),.55);box-shadow:0 0 14px rgba(var(--nsp-primary),.2)}.nsp-heading{position:absolute;left:16px;bottom:16px;z-index:5;pointer-events:none}.nsp-title{font-size:11px;font-weight:800;letter-spacing:.17em;color:rgb(var(--nsp-light));text-transform:uppercase}.nsp-kicker{margin-top:5px;font:700 7px/1 var(--mono,monospace);letter-spacing:.27em;color:rgba(var(--nsp-light),.34)}.nsp-mode{position:absolute;right:16px;bottom:15px;z-index:5;font:700 8px/1 var(--mono,monospace);letter-spacing:.18em;color:rgba(var(--nsp-secondary),.72)}.nsp-copy{position:absolute;right:16px;bottom:39px;z-index:5;border:1px solid rgba(255,255,255,.1);background:rgba(4,4,8,.62);color:rgba(255,255,255,.5);padding:7px 10px;border-radius:8px;font:700 8px/1 var(--mono,monospace);letter-spacing:.12em;cursor:pointer}@media(max-width:660px){.nsp-ui{align-items:flex-start}.nsp-controls{max-width:240px}.nsp-heading{display:none}.nsp-copy{display:none}}
`;

export function NoxSignalParticles({
  count = 72,
  mode = 'auto',
  intensity = 1,
  sparkSize = 1.15,
  variant = 'agent-constellation',
  energy = 'charged',
  trailLength = 0.78,
  trailPersistence,
  linkDistance = 120,
  showVariantSwitcher = true,
  showEnergySwitcher = true,
  showModeSwitcher = true,
}: NoxSignalParticlesProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const sparks = useRef<Spark[]>([]);
  const sparkSignature = useRef('');
  const burst = useRef<Burst | null>(null);
  const focus = useRef<FlowTarget>({ x: Number.NaN, y: Number.NaN, px: Number.NaN, py: Number.NaN });
  const [activeVariant, setActiveVariant] = useState<SignalParticleVariant>(normalizeVariant(variant));
  const [activeEnergy, setActiveEnergy] = useState<SignalParticleEnergy>(energy);
  const [activeMode, setActiveMode] = useState<SignalParticleMode>(mode);
  const [displayMode, setDisplayMode] = useState('FLOW');
  const [copied, setCopied] = useState(false);

  useEffect(() => setActiveVariant(normalizeVariant(variant)), [variant]);
  useEffect(() => setActiveEnergy(energy), [energy]);
  useEffect(() => setActiveMode(mode), [mode]);

  const preset = SIGNAL_PARTICLE_PRESETS[activeVariant];
  const energyPreset = SIGNAL_PARTICLE_ENERGY_PRESETS[activeEnergy];
  const safeCount = Math.max(12, Math.min(180, Math.round(count)));
  const persistence = clamp(trailPersistence ?? trailLength, 0, 1);
  const seed = useMemo(() => SIGNAL_PARTICLE_VARIANTS.indexOf(activeVariant) * 173 + 4242, [activeVariant]);
  const signature = `${activeVariant}:${safeCount}:${sparkSize}:${seed}`;

  if (sparkSignature.current !== signature) {
    const random = seededRandom(seed);
    sparks.current = Array.from({ length: safeCount }, (_, index) => ({
      x: Number.NaN,
      y: Number.NaN,
      vx: 0,
      vy: 0,
      phase: random() * Math.PI * 2,
      size: (0.58 + random() * 1.15) * sparkSize,
      depth: 0.22 + random() * 0.78,
      age: index * 0.05,
      life: 7 + random() * 9,
      generation: Math.floor(random() * 1000),
    }));
    sparkSignature.current = signature;
  }

  useCanvas2D(canvasRef, (ctx, size, dt, elapsed) => {
    const { w, h } = size;
    const profile = activeProfileFor(activeMode, elapsed);
    const profileLabel = profile.toUpperCase();
    if (displayMode !== profileLabel) setDisplayMode(profileLabel);

    const p = pointer.current;
    const burstAge = burst.current ? performance.now() / 1000 - burst.current.started : 99;
    const burstActive = burst.current && burstAge < 1.15;
    const targetX = burstActive
      ? burst.current!.x * w
      : (p.inside ? p.tx : 0.5 + Math.sin(elapsed * 0.24) * 0.16) * w;
    const targetY = burstActive
      ? burst.current!.y * h
      : (p.inside ? p.ty : 0.5 + Math.cos(elapsed * 0.2) * 0.1) * h;

    const f = focus.current;
    if (!Number.isFinite(f.x)) {
      f.x = targetX;
      f.y = targetY;
      f.px = targetX;
      f.py = targetY;
    }
    f.px = f.x;
    f.py = f.y;
    f.x = reduced ? targetX : damp(f.x, targetX, 7.5, dt);
    f.y = reduced ? targetY : damp(f.y, targetY, 7.5, dt);
    const pointerVx = (f.x - f.px) / Math.max(dt, 1 / 120);
    const pointerVy = (f.y - f.py) / Math.max(dt, 1 / 120);

    // Translucent decay creates a smoke-like flow body without hard line trails.
    ctx.globalCompositeOperation = 'source-over';
    const fade = clamp(0.2 - persistence * 0.145 * energyPreset.persistence, 0.028, 0.2);
    ctx.fillStyle = `rgba(2,3,7,${fade})`;
    ctx.fillRect(0, 0, w, h);

    const profileFocus = profile === 'gather' ? 1.35 : profile === 'vortex' ? 0.64 : 0.92;
    const profileCurl = profile === 'vortex' ? 1.6 : profile === 'gather' ? 0.72 : 1;
    const attractionRadius = Math.max(180, linkDistance * 2.4);
    const speedLimit = (42 + intensity * 32) * energyPreset.speed;

    for (let index = 0; index < sparks.current.length; index += 1) {
      const spark = sparks.current[index];
      if (!Number.isFinite(spark.x) || spark.age > spark.life || spark.x < -140 || spark.x > w + 140 || spark.y < -140 || spark.y > h + 140) {
        resetSpark(spark, index, w, h, f.x, f.y);
      }

      const dx = f.x - spark.x;
      const dy = f.y - spark.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / distance;
      const ny = dy / distance;
      const tx = -ny;
      const ty = nx;
      const proximity = clamp(1 - distance / attractionRadius, 0, 1);
      const globalPull = 0.12 + proximity * 0.88;

      const scale = (0.0042 + spark.depth * 0.0022) * preset.flowScale;
      const waveA = Math.sin(spark.y * scale + elapsed * 0.7 * energyPreset.speed + spark.phase);
      const waveB = Math.cos(spark.x * scale * 1.18 - elapsed * 0.53 * energyPreset.speed + spark.phase * 0.67);
      const flowAngle = waveA * 2.2 + waveB * 1.35;
      const flowX = Math.cos(flowAngle);
      const flowY = Math.sin(flowAngle);
      const curlPulse = 0.7 + Math.sin(elapsed * 0.8 + spark.phase) * 0.3;

      const focusForce = (14 + proximity * 72) * preset.focusBias * energyPreset.focus * profileFocus * intensity;
      const curlForce = (12 + proximity * 46) * preset.curlBias * energyPreset.turbulence * profileCurl * curlPulse * intensity;
      const flowForce = (18 + spark.depth * 18) * energyPreset.turbulence * intensity;
      const burstForce = burstActive ? Math.sin(clamp(burstAge / 1.15, 0, 1) * Math.PI) * 48 : 0;

      spark.vx += (flowX * flowForce + nx * focusForce * globalPull + tx * curlForce * proximity + nx * burstForce + pointerVx * 0.018 * proximity) * dt;
      spark.vy += (flowY * flowForce + ny * focusForce * globalPull + ty * curlForce * proximity + ny * burstForce + pointerVy * 0.018 * proximity) * dt;

      const drag = Math.exp(-(1.7 + spark.depth * 0.45) * dt);
      spark.vx *= drag;
      spark.vy *= drag;
      const velocity = Math.hypot(spark.vx, spark.vy);
      if (velocity > speedLimit) {
        spark.vx = (spark.vx / velocity) * speedLimit;
        spark.vy = (spark.vy / velocity) * speedLimit;
      }

      if (!reduced) {
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.age += dt;
      }

      if (distance < 8 + spark.size * 2.5) resetSpark(spark, index, w, h, f.x, f.y);
    }

    ctx.globalCompositeOperation = 'lighter';
    for (let index = 0; index < sparks.current.length; index += 1) {
      const spark = sparks.current[index];
      const lifeFade = clamp(Math.min(spark.age * 1.8, (spark.life - spark.age) * 1.4), 0, 1);
      const flicker = 0.76 + Math.sin(elapsed * (2.2 + spark.depth * 2.6) + spark.phase) * 0.24;
      const alpha = clamp(lifeFade * flicker * (0.28 + spark.depth * 0.5) * intensity * energyPreset.glow, 0, 0.92);
      const radius = spark.size * (0.72 + spark.depth * 0.75);
      const color = index % 3 === 0 ? preset.secondary : preset.primary;

      ctx.shadowColor = rgba(color, alpha * 0.95);
      ctx.shadowBlur = (5 + radius * 5) * energyPreset.glow;
      ctx.fillStyle = rgba(color, alpha * 0.26);
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, radius * 2.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = radius * 2.2;
      ctx.fillStyle = rgba(index % 9 === 0 ? preset.light : color, alpha);
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, Math.max(0.45, radius), 0, Math.PI * 2);
      ctx.fill();
    }

    const focusGlow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, Math.min(w, h) * 0.13);
    focusGlow.addColorStop(0, rgba(preset.light, 0.12 * energyPreset.glow));
    focusGlow.addColorStop(0.2, rgba(preset.primary, 0.065 * energyPreset.glow));
    focusGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.shadowBlur = 0;
    ctx.fillStyle = focusGlow;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }, !reduced);

  const onBurst = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    burst.current = {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
      started: performance.now() / 1000,
    };
  };

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(`${preset.reference} + energy:${activeEnergy} + mode:${activeMode}`);
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
    background: preset.background,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="nsp-root" data-variant={activeVariant} data-energy={activeEnergy} style={style} onPointerDown={onBurst}>
      <style>{STYLES}</style>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div className="nsp-vignette" />
      <div className="nsp-ui">
        <div className="nsp-stack">
          {showVariantSwitcher ? (
            <div className="nsp-controls" aria-label="Signal particle variants">
              {SIGNAL_PARTICLE_VARIANTS.map((id) => (
                <button key={id} type="button" className="nsp-btn" data-active={id === activeVariant} onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()} onClick={() => setActiveVariant(id)}>
                  {SIGNAL_PARTICLE_PRESETS[id].shortLabel}
                </button>
              ))}
            </div>
          ) : null}
          {showModeSwitcher ? (
            <div className="nsp-controls" aria-label="Particle choreography">
              {SIGNAL_PARTICLE_MODES.map((id) => (
                <button key={id} type="button" className="nsp-btn" data-active={id === activeMode} onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()} onClick={() => setActiveMode(id)}>
                  {id.toUpperCase()}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {showEnergySwitcher ? (
          <div className="nsp-controls" aria-label="Signal particle energy">
            {SIGNAL_PARTICLE_ENERGIES.map((id) => (
              <button key={id} type="button" className="nsp-btn" data-active={id === activeEnergy} onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()} onClick={() => setActiveEnergy(id)}>
                {SIGNAL_PARTICLE_ENERGY_PRESETS[id].label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="nsp-heading"><div className="nsp-title">{preset.label}</div><div className="nsp-kicker">{preset.kicker}</div></div>
      <div className="nsp-mode">MODE // {displayMode}</div>
      <button type="button" className="nsp-copy" onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()} onClick={copyReference}>{copied ? 'COPIED' : 'COPY CONFIG'}</button>
    </div>
  );
}

export default NoxSignalParticles;
