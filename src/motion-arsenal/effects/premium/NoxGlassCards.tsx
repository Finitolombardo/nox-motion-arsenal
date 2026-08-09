import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { clamp, damp, seededRandom, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { GLSL_NOISE, useShaderQuad } from '../../lib/canvasUtils';

export const GLASS_CARD_VARIANTS = [
  'prism-command-grid',
  'liquid-chrome-vault',
  'obsidian-caustic-deck',
  'signal-crystal-array',
  'revenue-amber-monoliths',
] as const;

export const GLASS_CARD_ENERGIES = ['calm', 'charged', 'overdrive'] as const;

export type GlassCardVariant = (typeof GLASS_CARD_VARIANTS)[number];
export type GlassCardEnergy = (typeof GLASS_CARD_ENERGIES)[number];

type Rgb = readonly [number, number, number];

interface GlassCardPreset {
  id: GlassCardVariant;
  shortLabel: string;
  label: string;
  kicker: string;
  reference: string;
  materialIndex: number;
  accent: Rgb;
  secondary: Rgb;
  light: Rgb;
  background: string;
  cards: readonly { tag: string; title: string; body: string; metric: string }[];
}

interface EnergyPreset {
  id: GlassCardEnergy;
  label: string;
  speed: number;
  glow: number;
  refraction: number;
  lift: number;
  noise: number;
}

export const GLASS_CARD_PRESETS: Record<GlassCardVariant, GlassCardPreset> = {
  'prism-command-grid': {
    id: 'prism-command-grid',
    shortLabel: 'PRISM',
    label: 'Prism Command Grid',
    kicker: 'ROUTING // MEMORY // CONTROL',
    reference: 'motion:premium-glass-distortion-cards@prism-command-grid',
    materialIndex: 0,
    accent: [122, 126, 255],
    secondary: [45, 226, 210],
    light: [238, 249, 255],
    background: 'radial-gradient(80% 72% at 50% 52%,rgba(68,65,190,.25),transparent 68%),linear-gradient(180deg,#070711,#020205)',
    cards: [
      { tag: 'NODE 01', title: 'Agent Router', body: 'Signals enter a controlled orchestration layer and are assigned to the correct intelligence.', metric: '12 AGENTS' },
      { tag: 'NODE 02', title: 'Shared Memory', body: 'Context, decisions and operator constraints remain synchronized across the system.', metric: '99.8% SYNC' },
      { tag: 'NODE 03', title: 'Operator Gate', body: 'Human authority stays visible while routine execution runs at machine speed.', metric: '1 CONTROL' },
    ],
  },
  'liquid-chrome-vault': {
    id: 'liquid-chrome-vault',
    shortLabel: 'CHROME',
    label: 'Liquid Chrome Vault',
    kicker: 'REFLECT // DISTORT // REVEAL',
    reference: 'motion:premium-glass-distortion-cards@liquid-chrome-vault',
    materialIndex: 1,
    accent: [224, 232, 242],
    secondary: [111, 142, 180],
    light: [255, 255, 255],
    background: 'radial-gradient(74% 66% at 50% 48%,rgba(104,126,154,.22),transparent 70%),linear-gradient(180deg,#080a0d,#020304)',
    cards: [
      { tag: 'VAULT 01', title: 'Adaptive Surface', body: 'A reflective interface bends around attention instead of behaving like a flat card.', metric: 'LIVE LENS' },
      { tag: 'VAULT 02', title: 'Depth Memory', body: 'Layered highlights create a physical sense of thickness, edge and internal volume.', metric: '6 LAYERS' },
      { tag: 'VAULT 03', title: 'Material Signal', body: 'The surface itself communicates status before the visitor reads a single word.', metric: 'ZERO FLAT' },
    ],
  },
  'obsidian-caustic-deck': {
    id: 'obsidian-caustic-deck',
    shortLabel: 'OBSIDIAN',
    label: 'Obsidian Caustic Deck',
    kicker: 'FORGE // PRESSURE // MASTERY',
    reference: 'motion:premium-glass-distortion-cards@obsidian-caustic-deck',
    materialIndex: 2,
    accent: [255, 78, 58],
    secondary: [218, 155, 65],
    light: [255, 240, 216],
    background: 'radial-gradient(80% 70% at 50% 55%,rgba(133,27,18,.24),transparent 68%),linear-gradient(180deg,#0a0607,#020203)',
    cards: [
      { tag: 'FORGE 01', title: 'Signal Discipline', body: 'Noise is compressed into a smaller set of actions that actually move the system.', metric: '82% FOCUS' },
      { tag: 'FORGE 02', title: 'Execution Pressure', body: 'Each card feels carved, heated and locked into a deliberate operating state.', metric: 'HARD MODE' },
      { tag: 'FORGE 03', title: 'Mastery Layer', body: 'Progress becomes a visible artifact rather than an abstract promise.', metric: 'RANK VII' },
    ],
  },
  'signal-crystal-array': {
    id: 'signal-crystal-array',
    shortLabel: 'CRYSTAL',
    label: 'Signal Crystal Array',
    kicker: 'RESONANCE // PATTERN // DEMAND',
    reference: 'motion:premium-glass-distortion-cards@signal-crystal-array',
    materialIndex: 3,
    accent: [255, 75, 164],
    secondary: [108, 104, 255],
    light: [255, 240, 252],
    background: 'radial-gradient(80% 72% at 50% 52%,rgba(136,31,105,.24),transparent 70%),linear-gradient(180deg,#0a040b,#020204)',
    cards: [
      { tag: 'SIGNAL 01', title: 'Pattern Capture', body: 'Weak market signals become visible when refracted through a coherent data surface.', metric: '24 CHANNELS' },
      { tag: 'SIGNAL 02', title: 'Resonance Engine', body: 'Content, intent and distribution align around the strongest response vectors.', metric: '4.7× LIFT' },
      { tag: 'SIGNAL 03', title: 'Demand Crystal', body: 'The output is a focused beam: less noise, more recognition and faster action.', metric: 'HIGH SIGNAL' },
    ],
  },
  'revenue-amber-monoliths': {
    id: 'revenue-amber-monoliths',
    shortLabel: 'AMBER',
    label: 'Revenue Amber Monoliths',
    kicker: 'POSITION // OFFER // CLOSE',
    reference: 'motion:premium-glass-distortion-cards@revenue-amber-monoliths',
    materialIndex: 4,
    accent: [242, 183, 75],
    secondary: [255, 104, 61],
    light: [255, 249, 226],
    background: 'radial-gradient(76% 70% at 50% 54%,rgba(158,99,22,.24),transparent 68%),linear-gradient(180deg,#0c0904,#030201)',
    cards: [
      { tag: 'REVENUE 01', title: 'Positioning Core', body: 'A precise market position makes every later conversion mechanism more efficient.', metric: '1 CATEGORY' },
      { tag: 'REVENUE 02', title: 'Offer Architecture', body: 'Value, proof and delivery are compressed into one premium decision surface.', metric: '€25K VALUE' },
      { tag: 'REVENUE 03', title: 'Closing System', body: 'Qualification and follow-up keep momentum alive until the right decision is made.', metric: 'PIPELINE LIVE' },
    ],
  },
};

export const GLASS_CARD_ENERGY_PRESETS: Record<GlassCardEnergy, EnergyPreset> = {
  calm: { id: 'calm', label: 'CALM', speed: 0.65, glow: 0.62, refraction: 0.72, lift: 0.68, noise: 0.55 },
  charged: { id: 'charged', label: 'CHARGED', speed: 1, glow: 1, refraction: 1, lift: 1, noise: 1 },
  overdrive: { id: 'overdrive', label: 'OVERDRIVE', speed: 1.55, glow: 1.48, refraction: 1.35, lift: 1.3, noise: 1.45 },
};

export interface NoxGlassCardsProps {
  tilt?: number;
  refraction?: number;
  fresnel?: number;
  gridScale?: number;
  variant?: GlassCardVariant;
  energy?: GlassCardEnergy;
  depth?: number;
  glassOpacity?: number;
  showVariantSwitcher?: boolean;
  showEnergySwitcher?: boolean;
  interactiveLighting?: boolean;
  pointerReflection?: boolean;
  hoverGlare?: boolean;
  causticSweep?: boolean;
  specularIntensity?: number;
  ambientReflection?: number;
}

interface CardPhysics {
  rx: number;
  ry: number;
  trx: number;
  try_: number;
  hover: number;
  thover: number;
}

const rgba = (rgb: Rgb, alpha: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;

const FRAGMENT = `${GLSL_NOISE}
uniform float u_hover;
uniform float u_refraction;
uniform float u_fresnel;
uniform float u_scale;
uniform float u_variant;
uniform float u_energy;
uniform vec3 u_accent;
uniform vec3 u_secondary;
uniform vec3 u_light;

float grid(vec2 uv, float scale) {
  vec2 c = abs(fract(uv * scale) - .5);
  return smoothstep(.485, .5, max(c.x, c.y));
}

float hex(vec2 p) {
  p.x *= 1.1547;
  vec2 a = mod(p, 2.0) - 1.0;
  vec2 b = mod(p + 1.0, 2.0) - 1.0;
  return min(dot(a,a), dot(b,b));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 m = u_pointer;
  float d = distance(uv, m);
  float bump = smoothstep(.62, 0.0, d);
  vec2 dir = d > .0001 ? (uv - m) / d : vec2(0.0);
  float pulse = .72 + .28 * sin(u_time * (1.1 + u_energy));
  vec2 ruv = uv + dir * bump * u_refraction * u_hover * (.65 + .35 * pulse);
  float n = fbm(ruv * (3.0 + u_variant) + vec2(u_time * .045, -u_time * .035));
  float edge = min(min(uv.x,1.0-uv.x),min(uv.y,1.0-uv.y));
  float rim = pow(1.0 - clamp(edge * 6.2,0.0,1.0),u_fresnel);
  vec3 col = vec3(.018,.019,.024);

  if (u_variant < .5) {
    float g = grid(ruv + n * .015, u_scale);
    float node = smoothstep(.18,0.0,length(fract(ruv*u_scale)-.5));
    col += u_accent * g * (.18 + bump * .6);
    col += u_secondary * node * .12 * pulse;
  } else if (u_variant < 1.5) {
    float liquid = sin((ruv.x + n * .22) * 18.0 + u_time * .8) * sin((ruv.y - n * .18) * 14.0 - u_time * .55);
    float chrome = smoothstep(.12,.92,liquid * .5 + .5);
    col += mix(u_secondary,u_light,chrome) * (.06 + chrome * .24 + bump * .18);
    col += u_light * pow(max(0.0,1.0-abs(liquid)),14.0) * .12;
  } else if (u_variant < 2.5) {
    float crack = abs(sin((ruv.x*1.3 + ruv.y*.7 + n*.25)*24.0));
    crack = smoothstep(.94,1.0,crack);
    float heat = smoothstep(.72,.18,d) * (.5 + .5*sin(u_time*1.7+n*5.0));
    col += u_accent * crack * (.12 + heat*.42);
    col += u_secondary * n * .055;
  } else if (u_variant < 3.5) {
    float facets = smoothstep(.13,.02,hex((ruv-.5)*u_scale*.65));
    float spectrum = .5 + .5*sin((ruv.x-ruv.y)*18.0 + n*5.0 + u_time*.35);
    col += mix(u_accent,u_secondary,spectrum) * facets * (.12 + bump*.38);
    col += u_light * rim * .08;
  } else {
    float strata = smoothstep(.46,.5,abs(fract((ruv.y+n*.06)*u_scale*.7)-.5));
    float vein = smoothstep(.82,1.0,sin((ruv.x*1.2+ruv.y*.45+n*.2)*20.0)*.5+.5);
    col += u_accent * strata * (.11+bump*.42);
    col += u_secondary * vein * .12;
  }

  float streak = smoothstep(.075,0.0,abs((uv.x+uv.y)*.5-m.x*.82-.08));
  col += u_light * streak * u_hover * (.06 + .08*u_energy);
  col += u_accent * rim * (.08 + .34*u_hover) * (1.0 + .22*u_energy);
  col += u_secondary * n * .025 * u_energy;
  col *= 1.0 - .22 * smoothstep(.45,0.0,edge*3.0);
  gl_FragColor = vec4(col,.94);
}
`;

const STYLES = `
.ngc-root{--ngc-accent:122,126,255;--ngc-secondary:45,226,210;--ngc-light:238,249,255;--ngc-glow:1;--ngc-depth:1;--ngc-opacity:.86;--ngc-specular:.45;--ngc-ambient-reflection:.55;}
.ngc-root *{box-sizing:border-box}.ngc-field{position:absolute;inset:0;overflow:hidden;background:var(--ngc-bg);isolation:isolate}.ngc-grid{position:absolute;inset:0;opacity:.1;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:34px 34px;mask-image:radial-gradient(ellipse at center,#000 18%,transparent 76%)}
.ngc-ambient{position:absolute;inset:-20%;background:conic-gradient(from 180deg at 50% 50%,transparent 0 18%,rgba(var(--ngc-accent),.08) 25%,transparent 34% 55%,rgba(var(--ngc-secondary),.07) 62%,transparent 74%);filter:blur(42px);opacity:var(--ngc-ambient-reflection);animation:ngc-ambient 18s linear infinite}.ngc-grain{position:absolute;inset:0;opacity:.045;mix-blend-mode:overlay;pointer-events:none}
.ngc-ui{position:absolute;left:14px;right:14px;top:14px;z-index:8;display:flex;justify-content:space-between;gap:12px;pointer-events:none}.ngc-control-stack{display:flex;flex-direction:column;gap:5px;min-width:0}.ngc-controls{display:flex;flex-wrap:wrap;gap:5px;pointer-events:auto}.ngc-btn{appearance:none;border:1px solid rgba(255,255,255,.1);background:rgba(5,5,8,.62);color:rgba(255,255,255,.42);border-radius:999px;padding:6px 9px;font:700 7.5px/1 var(--mono,monospace);letter-spacing:.12em;cursor:pointer;backdrop-filter:blur(10px)}.ngc-btn[data-active='true']{color:rgb(var(--ngc-light));border-color:rgba(var(--ngc-accent),.55);box-shadow:0 0 14px rgba(var(--ngc-accent),.2)}
.ngc-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:clamp(58px,8cqw,86px) clamp(12px,3cqw,32px) 54px;perspective:1100px}.ngc-cards{display:flex;align-items:stretch;gap:clamp(9px,2cqw,22px);width:100%;max-width:980px;transform-style:preserve-3d}.ngc-card{position:relative;flex:1 1 0;min-width:0;max-width:330px;min-height:220px;border-radius:18px;border:1px solid rgba(var(--ngc-light),.12);background:linear-gradient(155deg,rgba(255,255,255,.055),rgba(12,12,17,var(--ngc-opacity)));padding:clamp(15px,2.5cqw,27px);transform:perspective(900px) rotateX(var(--gc-rx,0deg)) rotateY(var(--gc-ry,0deg)) translate3d(0,calc(var(--gc-hover,0)*-6px),calc(var(--gc-hover,0)*18px*var(--ngc-depth)));transform-style:preserve-3d;transition:border-color .4s cubic-bezier(.16,1,.3,1),filter .4s ease;will-change:transform;overflow:hidden}.ngc-card:hover{border-color:rgba(var(--ngc-accent),.56);filter:brightness(1.06)}
.ngc-depth{position:absolute;inset:8px -8px -10px 8px;border-radius:18px;border:1px solid rgba(var(--ngc-accent),.08);background:rgba(2,2,4,.48);transform:translateZ(-22px);box-shadow:0 34px 80px -42px rgba(var(--ngc-accent),.85)}.ngc-glass-slot{position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none}.ngc-glass-slot canvas{position:absolute;inset:0;width:100%;height:100%;opacity:1}.ngc-fallback{position:absolute;inset:0;background:radial-gradient(circle at var(--gc-px,50%) var(--gc-py,50%),rgba(var(--ngc-light),calc(.08 * var(--ngc-specular))),transparent 34%),linear-gradient(115deg,transparent 38%,rgba(255,255,255,calc(.065 * var(--ngc-specular))) 48%,transparent 58%);opacity:calc(1 - var(--gc-hover,0)*.85)}.ngc-rim{position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 1px 0 rgba(255,255,255,calc(.12 * var(--ngc-specular))),inset 0 0 28px rgba(var(--ngc-accent),calc(var(--gc-hover,0)*.18)),0 30px 75px -42px rgba(var(--ngc-accent),calc(var(--gc-hover,0)*.9));pointer-events:none}.ngc-caustic{position:absolute;width:85%;height:150%;left:-62%;top:-34%;transform:rotate(17deg) translateX(calc(var(--gc-hover,0)*90%));background:linear-gradient(90deg,transparent,rgba(var(--ngc-light),calc(.1 * var(--ngc-specular))),transparent);filter:blur(8px);mix-blend-mode:screen;transition:transform .8s cubic-bezier(.16,1,.3,1)}
.ngc-content{position:relative;z-index:3;display:flex;flex-direction:column;height:100%;transform:translateZ(calc(26px*var(--ngc-depth)))}.ngc-tag{font:750 8px/1 var(--mono,monospace);letter-spacing:.32em;color:rgb(var(--ngc-accent));margin-bottom:15px}.ngc-title{font-size:clamp(16px,2.15cqw,23px);font-weight:820;line-height:1.02;letter-spacing:-.035em;color:rgb(var(--ngc-light));margin-bottom:11px}.ngc-body{font-size:11.5px;line-height:1.58;color:rgba(var(--ngc-light),.54);max-width:28ch}.ngc-metric{margin-top:auto;padding-top:20px;font:750 9px/1 var(--mono,monospace);letter-spacing:.2em;color:rgba(var(--ngc-secondary),.86)}.ngc-index{position:absolute;right:14px;bottom:12px;font:800 44px/.8 var(--mono,monospace);color:rgba(var(--ngc-light),.035);transform:translateZ(8px)}
.ngc-impact{position:absolute;width:18px;height:18px;border-radius:50%;border:1px solid rgb(var(--ngc-light));box-shadow:0 0 18px rgba(var(--ngc-accent),.9),inset 0 0 12px rgba(var(--ngc-secondary),.7);transform:translate(-50%,-50%) scale(.1);opacity:0;pointer-events:none;z-index:6}.ngc-copy{position:absolute;right:15px;bottom:14px;z-index:8;border:1px solid rgba(255,255,255,.1);background:rgba(4,4,7,.62);color:rgba(255,255,255,.52);padding:7px 10px;border-radius:8px;font:700 8px/1 var(--mono,monospace);letter-spacing:.12em;cursor:pointer}.ngc-caption{position:absolute;left:16px;bottom:16px;z-index:8}.ngc-caption-title{font-size:11px;font-weight:800;letter-spacing:.16em;color:rgb(var(--ngc-light));text-transform:uppercase}.ngc-caption-kicker{margin-top:5px;font:700 7px/1 var(--mono,monospace);letter-spacing:.27em;color:rgba(var(--ngc-light),.32)}
.ngc-root[data-energy='overdrive'] .ngc-ambient{animation-duration:8s}.ngc-root[data-energy='calm'] .ngc-ambient{animation-duration:28s}.ngc-root[data-interactive-lighting='false'] .ngc-ambient{animation:none}.ngc-root[data-pointer-reflection='false'] .ngc-fallback{background:linear-gradient(155deg,rgba(255,255,255,calc(.045 * var(--ngc-specular))),transparent 42%)}.ngc-root[data-hover-glare='false'] .ngc-card:hover{filter:none;border-color:rgba(var(--ngc-light),.12)}@keyframes ngc-ambient{to{transform:rotate(360deg)}}@keyframes ngc-impact{0%{opacity:0;transform:translate(-50%,-50%) scale(.1)}18%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(14);border-width:.2px}}@media(max-width:720px){.ngc-stage{padding-top:90px;overflow:auto;align-items:flex-start}.ngc-cards{flex-direction:column;align-items:center}.ngc-card{width:min(94%,360px);min-height:175px}.ngc-ui{align-items:flex-start}.ngc-controls{max-width:245px}.ngc-caption{display:none}}@media(prefers-reduced-motion:reduce){.ngc-ambient{animation:none!important}.ngc-card{transition:none}.ngc-caustic{transition:none}}
`;

export function NoxGlassCards({
  tilt = 9,
  refraction = 0.065,
  fresnel = 3.1,
  gridScale = 15,
  variant = 'prism-command-grid',
  energy = 'charged',
  depth = 1,
  glassOpacity = 0.86,
  showVariantSwitcher = true,
  showEnergySwitcher = true,
  interactiveLighting = true,
  pointerReflection = true,
  hoverGlare = true,
  causticSweep = true,
  specularIntensity = 1,
  ambientReflection = 1,
}: NoxGlassCardsProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const impactRefs = useRef<Array<HTMLDivElement | null>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeVariant, setActiveVariant] = useState<GlassCardVariant>(variant);
  const [activeEnergy, setActiveEnergy] = useState<GlassCardEnergy>(energy);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const pointer = useRef({ x: 0.5, y: 0.5 });
  const phys = useRef<CardPhysics[]>([]);

  useEffect(() => setActiveVariant(variant), [variant]);
  useEffect(() => setActiveEnergy(energy), [energy]);

  const preset = GLASS_CARD_PRESETS[activeVariant];
  const energyPreset = GLASS_CARD_ENERGY_PRESETS[activeEnergy];

  if (phys.current.length !== preset.cards.length) {
    phys.current = preset.cards.map(() => ({ rx: 0, ry: 0, trx: 0, try_: 0, hover: 0, thover: 0 }));
  }

  const dust = useMemo(() => {
    const rnd = seededRandom(8129);
    return Array.from({ length: 20 }, (_, id) => ({
      id,
      x: rnd() * 100,
      y: rnd() * 100,
      size: 1 + rnd() * 2.2,
      opacity: 0.04 + rnd() * 0.14,
    }));
  }, []);

  useRafLoop((dt) => {
    phys.current.forEach((p, i) => {
      const el = cardRefs.current[i];
      if (!el) return;
      p.rx = damp(p.rx, p.trx, 9, dt);
      p.ry = damp(p.ry, p.try_, 9, dt);
      p.hover = damp(p.hover, p.thover, 8, dt);
      el.style.setProperty('--gc-rx', `${p.rx.toFixed(3)}deg`);
      el.style.setProperty('--gc-ry', `${p.ry.toFixed(3)}deg`);
      el.style.setProperty('--gc-hover', p.hover.toFixed(3));
    });
  }, !reduced && interactiveLighting);

  useShaderQuad(canvasRef, {
    fragment: FRAGMENT,
    running: !reduced && interactiveLighting && pointerReflection && activeCard !== null,
    frozenTime: 4,
    pointerRef: pointer,
    dprCap: 1.5,
    uniforms: {
      u_hover: activeCard !== null ? 1 : 0,
      u_refraction: refraction * energyPreset.refraction,
      u_fresnel: fresnel,
      u_scale: gridScale,
      u_variant: preset.materialIndex,
      u_energy: energyPreset.glow,
      u_accent: preset.accent.map((v) => v / 255) as [number, number, number],
      u_secondary: preset.secondary.map((v) => v / 255) as [number, number, number],
      u_light: preset.light.map((v) => v / 255) as [number, number, number],
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const host = activeCard !== null ? cardRefs.current[activeCard] : null;
    const slot = host?.querySelector('.ngc-glass-slot');
    if (slot) {
      slot.appendChild(canvas);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.inset = '0';
      canvas.style.opacity = '1';
    } else {
      canvas.style.width = '1px';
      canvas.style.height = '1px';
      canvas.style.opacity = '0';
    }
  }, [activeCard, activeVariant]);

  const onMove = (i: number) => (event: PointerEvent<HTMLDivElement>) => {
    if (reduced || !interactiveLighting) return;
    const el = cardRefs.current[i];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const ny = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
    pointer.current.x = nx;
    pointer.current.y = ny;
    const p = phys.current[i];
    p.try_ = (nx - 0.5) * tilt * energyPreset.lift;
    p.trx = -(ny - 0.5) * tilt * energyPreset.lift;
    p.thover = 1;
    el.style.setProperty('--gc-px', `${nx * 100}%`);
    el.style.setProperty('--gc-py', `${ny * 100}%`);
  };

  const onLeave = (i: number) => () => {
    const p = phys.current[i];
    p.trx = 0;
    p.try_ = 0;
    p.thover = 0;
    setActiveCard((current) => (current === i ? null : current));
  };

  const onImpact = (i: number) => (event: PointerEvent<HTMLDivElement>) => {
    const card = cardRefs.current[i];
    const impact = impactRefs.current[i];
    if (!card || !impact || reduced || !interactiveLighting || !hoverGlare) return;
    const rect = card.getBoundingClientRect();
    impact.style.left = `${event.clientX - rect.left}px`;
    impact.style.top = `${event.clientY - rect.top}px`;
    impact.style.animation = 'none';
    void impact.offsetWidth;
    impact.style.animation = `ngc-impact ${0.9 / energyPreset.speed}s cubic-bezier(.16,1,.3,1) both`;
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
    '--ngc-accent': preset.accent.join(','),
    '--ngc-secondary': preset.secondary.join(','),
    '--ngc-light': preset.light.join(','),
    '--ngc-glow': energyPreset.glow,
    '--ngc-depth': depth,
    '--ngc-opacity': glassOpacity,
    '--ngc-bg': preset.background,
    '--ngc-specular': Math.max(0, specularIntensity),
    '--ngc-ambient-reflection': Math.max(0, ambientReflection),
  } as CSSProperties;

  return (
    <div ref={rootRef} className="ngc-root ngc-field" data-variant={activeVariant} data-energy={activeEnergy} data-interactive-lighting={interactiveLighting} data-pointer-reflection={pointerReflection} data-hover-glare={hoverGlare} style={style}>
      <style>{STYLES}</style>
      <div className="ngc-grid" />
      <div className="ngc-ambient" />
      {dust.map((dot) => (
        <span key={dot.id} style={{ position: 'absolute', left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size, borderRadius: '50%', background: rgba(preset.light, dot.opacity), boxShadow: `0 0 7px ${rgba(preset.accent, dot.opacity * 1.4)}` }} />
      ))}
      <svg className="ngc-grain" aria-hidden="true"><filter id="ngc-noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" /></filter><rect width="100%" height="100%" filter="url(#ngc-noise)" /></svg>

      <div className="ngc-ui">
        <div className="ngc-control-stack">
          {showVariantSwitcher ? <div className="ngc-controls" aria-label="Glass material variants">{GLASS_CARD_VARIANTS.map((id) => <button key={id} className="ngc-btn" type="button" data-active={id === activeVariant} onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()} onClick={() => { setActiveVariant(id); setActiveCard(null); }}>{GLASS_CARD_PRESETS[id].shortLabel}</button>)}</div> : null}
        </div>
        {showEnergySwitcher ? <div className="ngc-controls" aria-label="Glass energy states">{GLASS_CARD_ENERGIES.map((id) => <button key={id} className="ngc-btn" type="button" data-active={id === activeEnergy} onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()} onClick={() => setActiveEnergy(id)}>{GLASS_CARD_ENERGY_PRESETS[id].label}</button>)}</div> : null}
      </div>

      <div className="ngc-stage">
        <div className="ngc-cards">
          {preset.cards.map((card, i) => (
            <div key={`${activeVariant}-${card.tag}`} ref={(el: HTMLDivElement | null) => { cardRefs.current[i] = el; }} className="ngc-card" onPointerMove={onMove(i)} onPointerEnter={() => !reduced && interactiveLighting && setActiveCard(i)} onPointerLeave={onLeave(i)} onPointerDown={onImpact(i)}>
              <div className="ngc-depth" />
              <div className="ngc-glass-slot" />
              <div className="ngc-fallback" />
              {causticSweep ? <div className="ngc-caustic" /> : null}
              <div className="ngc-rim" />
              {hoverGlare ? <div ref={(el: HTMLDivElement | null) => { impactRefs.current[i] = el; }} className="ngc-impact" /> : null}
              <div className="ngc-content">
                <div className="ngc-tag">{card.tag}</div>
                <div className="ngc-title">{card.title}</div>
                <div className="ngc-body">{card.body}</div>
                <div className="ngc-metric">{card.metric}</div>
              </div>
              <div className="ngc-index">0{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ngc-caption"><div className="ngc-caption-title">{preset.label}</div><div className="ngc-caption-kicker">{preset.kicker}</div></div>
      <button type="button" className="ngc-copy" onClick={copyReference}>{copied ? 'COPIED' : 'COPY CONFIG'}</button>
      <canvas ref={canvasRef} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}

export default NoxGlassCards;
