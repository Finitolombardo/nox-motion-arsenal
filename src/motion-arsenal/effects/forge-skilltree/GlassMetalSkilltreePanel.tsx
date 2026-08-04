import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { clamp, damp, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { AtmosLayer, SkillNode, type SkillNodeState } from './skilltreeShared';

export const GLASS_METAL_PANEL_VARIANTS = [
  'obsidian-command-deck',
  'frosted-nexus',
  'gold-ascension-console',
  'holo-forge-matrix',
  'void-citadel-panel',
  'nox-revenue-glass-panel',
] as const;

export const GLASS_METAL_PANEL_ENERGIES = ['calm', 'charged', 'overdrive'] as const;

export type GlassMetalPanelVariant = (typeof GLASS_METAL_PANEL_VARIANTS)[number];
export type GlassMetalPanelEnergy = (typeof GLASS_METAL_PANEL_ENERGIES)[number];

type Rgb = readonly [number, number, number];
type PanelShell = 'obsidian' | 'frosted' | 'museum' | 'holo' | 'citadel' | 'revenue';

interface NodeSpec {
  state: SkillNodeState;
  x: number;
  y: number;
  label: string;
  size: number;
  badge?: string;
}

interface PanelPreset {
  id: GlassMetalPanelVariant;
  shortLabel: string;
  label: string;
  kicker: string;
  reference: string;
  shell: PanelShell;
  accent: Rgb;
  secondary: Rgb;
  light: Rgb;
  background: string;
  status: string;
  metrics: readonly [string, string, string];
  nodes: readonly NodeSpec[];
}

interface PanelEnergyPreset {
  id: GlassMetalPanelEnergy;
  label: string;
  speed: number;
  glow: number;
  tilt: number;
  pulse: number;
  particles: number;
}

export const GLASS_METAL_PANEL_PRESETS: Record<GlassMetalPanelVariant, PanelPreset> = {
  'obsidian-command-deck': {
    id: 'obsidian-command-deck',
    shortLabel: 'OBSIDIAN',
    label: 'Obsidian Command Deck',
    kicker: 'OPERATOR CONTROL // HARD SURFACE',
    reference: 'motion:skilltree-glass-metal-panel@obsidian-command-deck',
    shell: 'obsidian',
    accent: [255, 78, 54],
    secondary: [225, 164, 67],
    light: [255, 239, 216],
    background: 'radial-gradient(70% 58% at 50% 56%, rgba(129,30,18,.20), transparent 70%), linear-gradient(180deg,#090607,#020203)',
    status: 'OPERATOR LINKED',
    metrics: ['12 AGENTS', '94% ROUTED', '03 ALERTS'],
    nodes: [
      { state: 'completed', x: 17, y: 65, label: 'Intake', size: 40 },
      { state: 'available', x: 34, y: 36, label: 'Triage', size: 42 },
      { state: 'active', x: 52, y: 51, label: 'Orchestrator', size: 54 },
      { state: 'recommended', x: 72, y: 31, label: 'Agent Mesh', size: 44, badge: 'NEXT' },
      { state: 'locked', x: 84, y: 68, label: 'Scale Gate', size: 40 },
    ],
  },
  'frosted-nexus': {
    id: 'frosted-nexus',
    shortLabel: 'FROST',
    label: 'Frosted Nexus',
    kicker: 'AGENT NETWORK // GLASS DEPTH',
    reference: 'motion:skilltree-glass-metal-panel@frosted-nexus',
    shell: 'frosted',
    accent: [122, 124, 255],
    secondary: [45, 226, 210],
    light: [235, 249, 255],
    background: 'radial-gradient(72% 65% at 50% 52%, rgba(71,69,184,.22), transparent 70%), linear-gradient(180deg,#060711,#020205)',
    status: 'NEXUS SYNCHRONIZED',
    metrics: ['08 ROUTES', '2.4MS LATENCY', '100% LIVE'],
    nodes: [
      { state: 'completed', x: 17, y: 62, label: 'Input', size: 40 },
      { state: 'available', x: 35, y: 34, label: 'Router', size: 44 },
      { state: 'active', x: 52, y: 50, label: 'Nexus', size: 56 },
      { state: 'recommended', x: 71, y: 30, label: 'Toolchain', size: 44, badge: 'SYNC' },
      { state: 'locked', x: 85, y: 65, label: 'Output', size: 40 },
    ],
  },
  'gold-ascension-console': {
    id: 'gold-ascension-console',
    shortLabel: 'ASCEND',
    label: 'Gold Ascension Console',
    kicker: 'REVENUE SYSTEM // PREMIUM CONTROL',
    reference: 'motion:skilltree-glass-metal-panel@gold-ascension-console',
    shell: 'museum',
    accent: [239, 182, 73],
    secondary: [255, 105, 61],
    light: [255, 248, 223],
    background: 'radial-gradient(72% 68% at 50% 48%, rgba(156,98,22,.21), transparent 70%), linear-gradient(180deg,#0c0904,#030201)',
    status: 'ASCENSION ACTIVE',
    metrics: ['€248K PIPELINE', '31% CLOSE', '4.8X ROAS'],
    nodes: [
      { state: 'completed', x: 16, y: 66, label: 'Signal', size: 40 },
      { state: 'available', x: 34, y: 37, label: 'Offer', size: 44 },
      { state: 'active', x: 52, y: 50, label: 'Revenue Core', size: 56 },
      { state: 'recommended', x: 72, y: 30, label: 'Close', size: 44, badge: 'PRIME' },
      { state: 'locked', x: 85, y: 67, label: 'Scale', size: 40 },
    ],
  },
  'holo-forge-matrix': {
    id: 'holo-forge-matrix',
    shortLabel: 'HOLO',
    label: 'Holo Forge Matrix',
    kicker: 'SKILL SYSTEM // LIVE EVOLUTION',
    reference: 'motion:skilltree-glass-metal-panel@holo-forge-matrix',
    shell: 'holo',
    accent: [73, 219, 138],
    secondary: [49, 169, 255],
    light: [232, 255, 244],
    background: 'radial-gradient(70% 66% at 50% 53%, rgba(32,128,83,.20), transparent 70%), linear-gradient(180deg,#040b08,#020403)',
    status: 'FORGE MATRIX ONLINE',
    metrics: ['LVL 37', '06 UNLOCKS', '89% FOCUS'],
    nodes: [
      { state: 'completed', x: 17, y: 64, label: 'Foundation', size: 40 },
      { state: 'available', x: 34, y: 35, label: 'Discipline', size: 44 },
      { state: 'active', x: 52, y: 50, label: 'Forge Core', size: 56 },
      { state: 'recommended', x: 72, y: 30, label: 'Mastery', size: 44, badge: 'UNLOCK' },
      { state: 'risk', x: 85, y: 67, label: 'Entropy', size: 40 },
    ],
  },
  'void-citadel-panel': {
    id: 'void-citadel-panel',
    shortLabel: 'CITADEL',
    label: 'Void Citadel Panel',
    kicker: 'DEEP SYSTEM // EVENT HORIZON',
    reference: 'motion:skilltree-glass-metal-panel@void-citadel-panel',
    shell: 'citadel',
    accent: [69, 151, 255],
    secondary: [166, 86, 255],
    light: [235, 246, 255],
    background: 'radial-gradient(68% 72% at 62% 50%, rgba(43,80,171,.22), transparent 72%), linear-gradient(180deg,#02050d,#010102)',
    status: 'CITADEL SEALED',
    metrics: ['07 LAYERS', 'ZERO LEAKS', '∞ DEPTH'],
    nodes: [
      { state: 'completed', x: 17, y: 64, label: 'Ingress', size: 40 },
      { state: 'available', x: 34, y: 35, label: 'Vector', size: 44 },
      { state: 'active', x: 52, y: 50, label: 'Citadel', size: 56 },
      { state: 'recommended', x: 72, y: 30, label: 'Horizon', size: 44, badge: 'DEEP' },
      { state: 'locked', x: 85, y: 67, label: 'Singularity', size: 40 },
    ],
  },
  'nox-revenue-glass-panel': {
    id: 'nox-revenue-glass-panel',
    shortLabel: 'REVENUE',
    label: 'NOX Revenue Glass Panel',
    kicker: 'SIGNAL // QUALIFY // OPERATOR GATE',
    reference: 'motion:skilltree-glass-metal-panel@nox-revenue-glass-panel',
    shell: 'revenue',
    accent: [255, 80, 105],
    secondary: [213, 164, 118],
    light: [255, 241, 243],
    background: 'radial-gradient(72% 62% at 50% 54%, rgba(153,34,54,.16), transparent 70%), linear-gradient(180deg,#0b0709,#030204)',
    status: 'OPERATOR CONTROL ACTIVE',
    metrics: ['SIGNAL INTAKE', 'ACTION PREPARED', 'APPROVAL REQUIRED'],
    nodes: [
      { state: 'completed', x: 16, y: 64, label: 'Signale', size: 40 },
      { state: 'available', x: 34, y: 36, label: 'Fit', size: 44 },
      { state: 'active', x: 52, y: 50, label: 'Angebot', size: 56 },
      { state: 'recommended', x: 72, y: 31, label: 'Aktion', size: 44, badge: 'READY' },
      { state: 'locked', x: 85, y: 67, label: 'Freigabe', size: 40 },
    ],
  },
};

export const GLASS_METAL_PANEL_ENERGY_PRESETS: Record<GlassMetalPanelEnergy, PanelEnergyPreset> = {
  calm: { id: 'calm', label: 'CALM', speed: 0.7, glow: 0.66, tilt: 0.68, pulse: 0.62, particles: 0.62 },
  charged: { id: 'charged', label: 'CHARGED', speed: 1, glow: 1, tilt: 1, pulse: 1, particles: 1 },
  overdrive: { id: 'overdrive', label: 'OVERDRIVE', speed: 1.46, glow: 1.48, tilt: 1.22, pulse: 1.52, particles: 1.45 },
};

export interface GlassMetalSkilltreePanelProps {
  blur?: number;
  hoverLift?: boolean;
  variant?: GlassMetalPanelVariant;
  energy?: GlassMetalPanelEnergy;
  depth?: number;
  tilt?: number;
  showVariantSwitcher?: boolean;
  showEnergySwitcher?: boolean;
  interactiveLighting?: boolean;
  pointerSpotlight?: boolean;
  hoverGlow?: boolean;
  specularFollow?: boolean;
}

const rgb = (value: Rgb) => value.join(',');

const GLASS_METAL_PANEL_STYLES = `
.gmp2-root { --gmp-accent:122,124,255; --gmp-secondary:45,226,210; --gmp-light:235,249,255; --gmp-glow:1; --gmp-speed:1; --gmp-blur:14px; --stfx-accent:rgb(var(--gmp-accent)); --stfx-glow:rgba(var(--gmp-accent),.45); }
.gmp2-root * { box-sizing:border-box; }
.gmp2-atmosphere { position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at calc(var(--gmp-px,.5) * 100%) calc(var(--gmp-py,.5) * 100%),rgba(var(--gmp-accent),.15),transparent 34%),radial-gradient(ellipse 50% 34% at 50% 88%,rgba(var(--gmp-secondary),.11),transparent 70%); }
.gmp2-grid { position:absolute; inset:0; pointer-events:none; opacity:.12; background-image:linear-gradient(rgba(var(--gmp-light),.05) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--gmp-light),.04) 1px,transparent 1px); background-size:30px 30px; mask-image:radial-gradient(ellipse at center,#000 16%,transparent 76%); }
.gmp2-ui { position:absolute; inset:14px 14px auto; z-index:20; display:flex; justify-content:space-between; align-items:flex-start; gap:16px; pointer-events:none; }
.gmp2-kicker { font:700 8px/1.2 var(--mono,monospace); letter-spacing:.32em; color:rgba(255,255,255,.36); }
.gmp2-title { margin-top:5px; color:rgba(255,255,255,.94); font-size:clamp(17px,3.2cqw,27px); font-weight:820; letter-spacing:-.035em; text-shadow:0 0 30px rgba(var(--gmp-accent),.24); }
.gmp2-subtitle { margin-top:5px; font:700 7px/1.2 var(--mono,monospace); letter-spacing:.22em; color:rgba(var(--gmp-secondary),.66); }
.gmp2-controls { display:flex; flex-direction:column; align-items:flex-end; gap:5px; pointer-events:auto; }
.gmp2-control-row { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:4px; }
.gmp2-button { appearance:none; border:1px solid rgba(255,255,255,.10); background:rgba(3,4,8,.64); color:rgba(255,255,255,.42); border-radius:999px; padding:6px 8px; font:700 7px/1 var(--mono,monospace); letter-spacing:.11em; cursor:pointer; backdrop-filter:blur(10px); }
.gmp2-button[data-active='true'] { color:#fff; border-color:rgba(var(--gmp-accent),.58); box-shadow:0 0 16px rgba(var(--gmp-accent),.20),inset 0 0 10px rgba(var(--gmp-accent),.08); }
.gmp2-rig { position:relative; width:min(88%,760px); height:min(69%,450px); perspective:1300px; transform-style:preserve-3d; margin-top:30px; }
.gmp2-shadow { position:absolute; left:13%; right:13%; bottom:-30px; height:42px; border-radius:50%; background:#000; opacity:.58; filter:blur(22px); transform:translateZ(-90px); pointer-events:none; }
.gmp2-backplate { position:absolute; inset:4% -1% -4% 3%; transform:translateZ(-42px) translate(10px,14px); border:1px solid rgba(var(--gmp-accent),.10); background:linear-gradient(145deg,rgba(255,255,255,.025),rgba(0,0,0,.72)); box-shadow:0 34px 80px rgba(0,0,0,.54),0 0 calc(38px * var(--gmp-glow)) rgba(var(--gmp-accent),.10); }
.gmp2-panel { position:absolute; inset:0; transform-style:preserve-3d; will-change:transform; cursor:grab; }
.gmp2-panel:active { cursor:grabbing; }
.gmp2-surface { position:absolute; inset:0; overflow:hidden; border:1px solid rgba(var(--gmp-light),.13); background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(17,17,23,.55) 34%,rgba(3,4,8,.76)); box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -1px 0 rgba(255,255,255,.025),inset 0 0 54px rgba(0,0,0,.42),0 0 calc(42px * var(--gmp-glow)) rgba(var(--gmp-accent),.14); backdrop-filter:blur(var(--gmp-blur)) saturate(1.2); -webkit-backdrop-filter:blur(var(--gmp-blur)) saturate(1.2); }
.gmp2-panel--obsidian .gmp2-surface,.gmp2-panel--obsidian .gmp2-backplate { clip-path:polygon(3% 0,97% 0,100% 7%,100% 93%,97% 100%,3% 100%,0 93%,0 7%); }
.gmp2-panel--obsidian .gmp2-surface { background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(10,8,10,.82) 42%,rgba(3,2,3,.94)); border-color:rgba(var(--gmp-accent),.22); }
.gmp2-panel--frosted .gmp2-surface,.gmp2-panel--frosted .gmp2-backplate { border-radius:24px; }
.gmp2-panel--frosted .gmp2-surface { background:linear-gradient(145deg,rgba(227,243,255,.13),rgba(31,36,52,.38) 40%,rgba(4,6,12,.70)); }
.gmp2-panel--museum .gmp2-surface,.gmp2-panel--museum .gmp2-backplate { border-radius:8px; }
.gmp2-panel--museum .gmp2-surface { background:linear-gradient(145deg,rgba(255,248,224,.10),rgba(35,26,12,.42) 38%,rgba(7,5,2,.78)); border-color:rgba(var(--gmp-accent),.28); box-shadow:inset 0 0 0 7px rgba(255,255,255,.018),inset 0 0 54px rgba(0,0,0,.42),0 0 calc(44px * var(--gmp-glow)) rgba(var(--gmp-accent),.15); }
.gmp2-panel--holo .gmp2-surface,.gmp2-panel--holo .gmp2-backplate { clip-path:polygon(6% 0,94% 0,100% 12%,100% 88%,94% 100%,6% 100%,0 88%,0 12%); }
.gmp2-panel--holo .gmp2-surface { background:linear-gradient(145deg,rgba(226,255,241,.10),rgba(12,36,27,.42) 40%,rgba(2,8,5,.76)); border-color:rgba(var(--gmp-accent),.26); }
.gmp2-panel--citadel .gmp2-surface,.gmp2-panel--citadel .gmp2-backplate { border-radius:40px 12px 40px 12px; }
.gmp2-panel--citadel .gmp2-surface { background:linear-gradient(145deg,rgba(233,246,255,.08),rgba(12,18,43,.43) 42%,rgba(2,3,10,.82)); border-color:rgba(var(--gmp-accent),.24); }
.gmp2-panel--revenue .gmp2-surface,.gmp2-panel--revenue .gmp2-backplate { clip-path:polygon(4% 0,96% 0,100% 8%,100% 92%,96% 100%,4% 100%,0 92%,0 8%); }
.gmp2-panel--revenue .gmp2-surface { background:linear-gradient(148deg,rgba(255,241,243,.065),rgba(22,13,17,.86) 38%,rgba(5,3,5,.97));border-color:rgba(var(--gmp-accent),.25);box-shadow:inset 0 1px 0 rgba(255,255,255,.11),inset 0 0 0 7px rgba(255,255,255,.012),inset 0 0 64px rgba(0,0,0,.48),0 0 calc(34px * var(--gmp-glow)) rgba(var(--gmp-accent),.13); }
.gmp2-shell-grid { position:absolute; inset:0; opacity:.24; background-image:linear-gradient(rgba(var(--gmp-light),.055) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--gmp-light),.045) 1px,transparent 1px); background-size:22px 22px; mask-image:linear-gradient(180deg,transparent,#000 14%,#000 86%,transparent); }
.gmp2-metal-edge { position:absolute; left:2%; right:2%; top:0; height:2px; background:linear-gradient(90deg,transparent,rgba(var(--gmp-light),.42),rgba(var(--gmp-accent),.72),rgba(var(--gmp-light),.42),transparent); box-shadow:0 0 16px rgba(var(--gmp-accent),.34); }
.gmp2-caustic { position:absolute; width:64%; height:150%; left:-36%; top:-36%; transform:rotate(16deg) translateX(calc((var(--gmp-px,.5) - .5) * 52px)); background:linear-gradient(90deg,transparent,rgba(var(--gmp-light),.10),transparent); filter:blur(11px); mix-blend-mode:screen; opacity:.72; pointer-events:none; }
.gmp2-sweep { position:absolute; inset:-40%; background:conic-gradient(from 215deg at 50% 50%,transparent 0 33%,rgba(var(--gmp-accent),.11) 39%,rgba(var(--gmp-light),.10) 42%,transparent 48% 100%); mix-blend-mode:screen; animation:gmp2-sweep calc(8s / var(--gmp-speed)) ease-in-out infinite; pointer-events:none; }
.gmp2-scanline { position:absolute; left:0; right:0; height:18%; top:-22%; background:linear-gradient(180deg,transparent,rgba(var(--gmp-secondary),.09),rgba(var(--gmp-light),.07),transparent); filter:blur(2px); animation:gmp2-scan calc(5.8s / var(--gmp-speed)) ease-in-out infinite; pointer-events:none; }
.gmp2-header { position:absolute; left:18px; right:18px; top:14px; z-index:5; display:flex; align-items:center; justify-content:space-between; gap:14px; padding-bottom:10px; border-bottom:1px solid rgba(var(--gmp-light),.08); }
.gmp2-header-left { display:flex; align-items:center; gap:9px; color:rgba(var(--gmp-light),.84); font:800 8px/1 var(--mono,monospace); letter-spacing:.22em; }
.gmp2-status-dot { width:7px; height:7px; border-radius:50%; background:rgb(var(--gmp-accent)); box-shadow:0 0 calc(12px * var(--gmp-glow)) rgba(var(--gmp-accent),.9); animation:gmp2-pulse calc(2s / var(--gmp-speed)) ease-in-out infinite; }
.gmp2-serial { color:rgba(var(--gmp-light),.28); font:700 7px/1 var(--mono,monospace); letter-spacing:.18em; }
.gmp2-map { position:absolute; left:3%; right:3%; top:16%; bottom:20%; z-index:3; }
.gmp2-links { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }
.gmp2-link-base { fill:none; stroke:rgba(var(--gmp-light),.08); stroke-width:2; vector-effect:non-scaling-stroke; }
.gmp2-link-glow { fill:none; stroke:rgba(var(--gmp-accent),calc(.22 * var(--gmp-glow))); stroke-width:5; filter:blur(5px); vector-effect:non-scaling-stroke; }
.gmp2-link-flow { fill:none; stroke:rgb(var(--gmp-accent)); stroke-width:1.5; stroke-linecap:round; stroke-dasharray:7 13; filter:drop-shadow(0 0 5px rgba(var(--gmp-accent),.72)); vector-effect:non-scaling-stroke; animation:gmp2-flow calc(1.55s / var(--gmp-speed)) linear infinite; }
.gmp2-link-flow--secondary { stroke:rgb(var(--gmp-secondary)); animation-direction:reverse; animation-duration:calc(2.05s / var(--gmp-speed)); }
.gmp2-node-core { position:absolute; left:52%; top:50%; width:118px; aspect-ratio:1; transform:translate(-50%,-50%) translateZ(18px); border-radius:50%; border:1px solid rgba(var(--gmp-accent),.20); box-shadow:0 0 calc(42px * var(--gmp-glow)) rgba(var(--gmp-accent),.14),inset 0 0 30px rgba(var(--gmp-secondary),.08); pointer-events:none; }
.gmp2-node-core::before,.gmp2-node-core::after { content:''; position:absolute; inset:14%; border-radius:50%; border:1px dashed rgba(var(--gmp-light),.16); animation:gmp2-spin calc(14s / var(--gmp-speed)) linear infinite; }
.gmp2-node-core::after { inset:29%; border-color:rgba(var(--gmp-secondary),.22); animation-duration:calc(7s / var(--gmp-speed)); animation-direction:reverse; }
.gmp2-metrics { position:absolute; left:18px; right:18px; bottom:14px; height:54px; z-index:6; display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.gmp2-metric { position:relative; overflow:hidden; border:1px solid rgba(var(--gmp-light),.08); background:rgba(2,3,7,.42); padding:9px 10px; color:rgba(var(--gmp-light),.72); font:800 8px/1 var(--mono,monospace); letter-spacing:.12em; }
.gmp2-metric::after { content:''; position:absolute; left:0; right:35%; bottom:0; height:1px; background:linear-gradient(90deg,rgb(var(--gmp-accent)),transparent); box-shadow:0 0 8px rgba(var(--gmp-accent),.45); }
.gmp2-rail { position:absolute; right:8px; top:76px; bottom:82px; width:4px; display:flex; flex-direction:column; gap:5px; opacity:.5; }
.gmp2-rail span { flex:1; background:linear-gradient(180deg,rgba(var(--gmp-light),.10),rgba(var(--gmp-accent),.46),rgba(var(--gmp-secondary),.10)); animation:gmp2-rail calc(1.8s / var(--gmp-speed)) ease-in-out infinite alternate; }
.gmp2-rail span:nth-child(2){animation-delay:-.6s}.gmp2-rail span:nth-child(3){animation-delay:-1.2s}
.gmp2-glare { position:absolute; inset:-30%; pointer-events:none; background:radial-gradient(circle at calc(var(--gmp-px,.5) * 100%) calc(var(--gmp-py,.5) * 100%),rgba(var(--gmp-light),.15),transparent 24%); mix-blend-mode:screen; opacity:.82; }
.gmp2-corners { position:absolute; inset:10px; pointer-events:none; opacity:.56; }
.gmp2-corner { position:absolute; width:18px; height:18px; border-color:rgba(var(--gmp-light),.28); }
.gmp2-corner:nth-child(1){left:0;top:0;border-left:1px solid;border-top:1px solid}.gmp2-corner:nth-child(2){right:0;top:0;border-right:1px solid;border-top:1px solid}.gmp2-corner:nth-child(3){left:0;bottom:0;border-left:1px solid;border-bottom:1px solid}.gmp2-corner:nth-child(4){right:0;bottom:0;border-right:1px solid;border-bottom:1px solid}
.gmp2-impact { position:absolute; width:18px; height:18px; transform:translate(-50%,-50%); border-radius:50%; border:1px solid rgba(var(--gmp-light),.74); box-shadow:0 0 22px rgba(var(--gmp-accent),.8),inset 0 0 16px rgba(var(--gmp-secondary),.38); pointer-events:none; z-index:12; animation:gmp2-impact .95s cubic-bezier(.12,.8,.2,1) both; }
.gmp2-reference { position:absolute; right:14px; bottom:12px; z-index:20; appearance:none; border:1px solid rgba(255,255,255,.10); background:rgba(3,4,8,.64); color:rgba(255,255,255,.48); border-radius:7px; padding:7px 9px; font:700 7px/1 var(--mono,monospace); letter-spacing:.13em; cursor:pointer; backdrop-filter:blur(9px); }
.gmp2-hint { position:absolute; left:14px; bottom:15px; z-index:20; font:700 7px/1 var(--mono,monospace); letter-spacing:.18em; color:rgba(255,255,255,.27); pointer-events:none; }
.gmp2-root[data-energy='overdrive'] .gmp2-surface { box-shadow:inset 0 1px 0 rgba(255,255,255,.17),inset 0 0 64px rgba(0,0,0,.38),0 0 calc(58px * var(--gmp-glow)) rgba(var(--gmp-accent),.20); }
.gmp2-root[data-energy='calm'] .gmp2-sweep,.gmp2-root[data-energy='calm'] .gmp2-scanline { opacity:.38; }
.gmp2-root[data-interactive-lighting='false'] .gmp2-sweep,.gmp2-root[data-interactive-lighting='false'] .gmp2-scanline,.gmp2-root[data-interactive-lighting='false'] .gmp2-impact{display:none}.gmp2-root[data-pointer-spotlight='false'] .gmp2-atmosphere,.gmp2-root[data-pointer-spotlight='false'] .gmp2-glare{background:none}.gmp2-root[data-hover-glow='false'] .gmp2-panel{cursor:default}.gmp2-root[data-specular-follow='false'] .gmp2-caustic{transform:rotate(16deg) translateX(0);opacity:.2}
@keyframes gmp2-flow { to { stroke-dashoffset:-20; } }
@keyframes gmp2-spin { to { transform:rotate(360deg); } }
@keyframes gmp2-sweep { 0%,12% { transform:translate3d(-12%,-8%,0) rotate(-7deg); opacity:.12; } 48% { opacity:.9; } 78%,100% { transform:translate3d(12%,8%,0) rotate(8deg); opacity:.18; } }
@keyframes gmp2-scan { 0%,14% { transform:translateY(-150%); opacity:0; } 34% { opacity:1; } 68%,100% { transform:translateY(680%); opacity:0; } }
@keyframes gmp2-pulse { 0%,100% { scale:.78; opacity:.5; } 50% { scale:1.28; opacity:1; } }
@keyframes gmp2-rail { from { opacity:.18; filter:brightness(.7); } to { opacity:.82; filter:brightness(1.4); } }
@keyframes gmp2-impact { 0% { opacity:0; scale:.16; } 18% { opacity:1; } 100% { opacity:0; scale:13; border-width:.15px; } }
@media (max-width:720px) { .gmp2-ui{inset:10px 10px auto}.gmp2-controls{max-width:54%}.gmp2-button{padding:5px 6px;font-size:6px}.gmp2-subtitle{display:none}.gmp2-rig{width:94%;height:66%;margin-top:38px}.gmp2-header{left:12px;right:12px}.gmp2-map{left:0;right:0}.gmp2-metrics{left:10px;right:10px;gap:4px}.gmp2-metric{font-size:6px;padding:8px 6px}.gmp2-serial{display:none}.gmp2-reference{right:10px;bottom:9px}.gmp2-hint{left:10px;bottom:12px}.gmp2-node-core{width:92px} }
@media (max-width:520px) { .gmp2-rig{height:62%}.gmp2-map .stfx-label{font-size:8px;max-width:66px}.gmp2-map .stfx-badge{display:none}.gmp2-map .stfx-core{scale:.82}.gmp2-metrics{height:44px}.gmp2-header-left{font-size:6px}.gmp2-rail{display:none} }
@media (prefers-reduced-motion:reduce) { .gmp2-sweep,.gmp2-scanline,.gmp2-link-flow,.gmp2-node-core::before,.gmp2-node-core::after,.gmp2-status-dot,.gmp2-rail span{animation:none!important}.gmp2-impact{display:none} }
`;

const LINK_PATHS = [
  'M170 338 C238 326 276 205 340 182',
  'M340 182 C420 184 448 265 520 260',
  'M520 260 C615 260 635 155 720 155',
  'M520 260 C645 276 730 352 850 350',
  'M170 338 C320 398 650 410 850 350',
] as const;

export function GlassMetalSkilltreePanel({
  blur = 14,
  hoverLift = true,
  variant = 'frosted-nexus',
  energy = 'charged',
  depth = 1,
  tilt = 1,
  showVariantSwitcher = true,
  showEnergySwitcher = true,
  interactiveLighting = true,
  pointerSpotlight = true,
  hoverGlow = true,
  specularFollow = true,
}: GlassMetalSkilltreePanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const motion = useRef({ rx: 0, ry: 0, x: 0, y: 0, z: 0 });
  const [activeVariant, setActiveVariant] = useState<GlassMetalPanelVariant>(variant);
  const [activeEnergy, setActiveEnergy] = useState<GlassMetalPanelEnergy>(energy);
  const [copied, setCopied] = useState(false);
  const [impact, setImpact] = useState({ id: 0, x: 50, y: 50 });

  useEffect(() => setActiveVariant(variant), [variant]);
  useEffect(() => setActiveEnergy(energy), [energy]);

  const preset = GLASS_METAL_PANEL_PRESETS[activeVariant];
  const energyPreset = GLASS_METAL_PANEL_ENERGY_PRESETS[activeEnergy];

  useRafLoop((dt) => {
    const p = pointer.current;
    const inside = interactiveLighting && p.inside;
    const targetRx = inside ? (0.5 - p.ty) * 14 * tilt * energyPreset.tilt : 0;
    const targetRy = inside ? (p.tx - 0.5) * 18 * tilt * energyPreset.tilt : 0;
    const targetX = inside ? (p.tx - 0.5) * 8 * depth : 0;
    const targetY = inside ? (p.ty - 0.5) * 7 * depth - (hoverLift && hoverGlow ? 4 : 0) : 0;
    const targetZ = inside && hoverLift && hoverGlow ? 24 * depth : 0;
    motion.current.rx = damp(motion.current.rx, targetRx, 7.5, dt);
    motion.current.ry = damp(motion.current.ry, targetRy, 7.5, dt);
    motion.current.x = damp(motion.current.x, targetX, 7, dt);
    motion.current.y = damp(motion.current.y, targetY, 7, dt);
    motion.current.z = damp(motion.current.z, targetZ, 6.5, dt);
    const panel = panelRef.current;
    const root = rootRef.current;
    if (panel) {
      panel.style.transform = `translate3d(${motion.current.x.toFixed(2)}px,${motion.current.y.toFixed(2)}px,${motion.current.z.toFixed(2)}px) rotateX(${motion.current.rx.toFixed(2)}deg) rotateY(${motion.current.ry.toFixed(2)}deg)`;
    }
    if (root) {
      root.style.setProperty('--gmp-px', (inside ? p.tx : 0.5).toFixed(3));
      root.style.setProperty('--gmp-py', (inside ? p.ty : 0.5).toFixed(3));
    }
  }, !reduced && interactiveLighting);

  const handleImpulse = (event: PointerEvent<HTMLDivElement>) => {
    if (!interactiveLighting || !hoverGlow) return;
    const panel = panelRef.current?.getBoundingClientRect();
    if (!panel) return;
    setImpact((current) => ({
      id: current.id + 1,
      x: clamp(((event.clientX - panel.left) / Math.max(panel.width, 1)) * 100, 0, 100),
      y: clamp(((event.clientY - panel.top) / Math.max(panel.height, 1)) * 100, 0, 100),
    }));
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

  const rootStyle = {
    '--gmp-accent': rgb(preset.accent),
    '--gmp-secondary': rgb(preset.secondary),
    '--gmp-light': rgb(preset.light),
    '--gmp-glow': energyPreset.glow,
    '--gmp-speed': energyPreset.speed,
    '--gmp-blur': `${Math.max(0, blur)}px`,
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    display: 'grid',
    placeItems: 'center',
    background: preset.background,
    userSelect: 'none',
  } as CSSProperties;

  return (
    <div ref={rootRef} className="stfx-stage gmp2-root" data-variant={activeVariant} data-energy={activeEnergy} data-interactive-lighting={interactiveLighting} data-pointer-spotlight={pointerSpotlight} data-hover-glow={hoverGlow} data-specular-follow={specularFollow} style={rootStyle} onPointerDown={handleImpulse}>
      <style>{GLASS_METAL_PANEL_STYLES}</style>
      <AtmosLayer
        particles={Math.round(18 * energyPreset.particles)}
        stars={Math.round(24 * energyPreset.particles)}
        embers={preset.shell === 'obsidian' || preset.shell === 'museum' ? Math.round(8 * energyPreset.particles) : 0}
      />
      <div className="gmp2-atmosphere" />
      <div className="gmp2-grid" />

      <div className="gmp2-ui">
        <div>
          <div className="gmp2-kicker">GLASS / METAL SYSTEM // {reduced ? 'STATIC' : 'LIVE'}</div>
          <div className="gmp2-title">{preset.label}</div>
          <div className="gmp2-subtitle">{preset.kicker}</div>
        </div>
        <div className="gmp2-controls">
          {showVariantSwitcher ? (
            <div className="gmp2-control-row" aria-label="Glass metal panel variants">
              {GLASS_METAL_PANEL_VARIANTS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="gmp2-button"
                  data-active={id === activeVariant}
                  onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
                  onClick={() => setActiveVariant(id)}
                >
                  {GLASS_METAL_PANEL_PRESETS[id].shortLabel}
                </button>
              ))}
            </div>
          ) : null}
          {showEnergySwitcher ? (
            <div className="gmp2-control-row" aria-label="Glass metal panel energy">
              {GLASS_METAL_PANEL_ENERGIES.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="gmp2-button"
                  data-active={id === activeEnergy}
                  onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
                  onClick={() => setActiveEnergy(id)}
                >
                  {GLASS_METAL_PANEL_ENERGY_PRESETS[id].label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className={`gmp2-rig gmp2-panel--${preset.shell}`}>
        <div className="gmp2-shadow" />
        <div className="gmp2-backplate" />
        <div ref={panelRef} className="gmp2-panel">
          <div className="gmp2-surface">
            <div className="gmp2-shell-grid" />
            <div className="gmp2-metal-edge" />
            {specularFollow ? <div className="gmp2-caustic" /> : null}
            {interactiveLighting ? <div className="gmp2-sweep" /> : null}
            {interactiveLighting ? <div className="gmp2-scanline" /> : null}
            {pointerSpotlight ? <div className="gmp2-glare" /> : null}

            <div className="gmp2-header">
              <div className="gmp2-header-left"><span className="gmp2-status-dot" />{preset.status}</div>
              <div className="gmp2-serial">NOX // SYS-{String(GLASS_METAL_PANEL_VARIANTS.indexOf(activeVariant) + 1).padStart(2, '0')}</div>
            </div>

            <div className="gmp2-map">
              <svg className="gmp2-links" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
                {LINK_PATHS.map((path) => <path key={`base-${path}`} d={path} className="gmp2-link-base" />)}
                {LINK_PATHS.slice(0, 4).map((path) => <path key={`glow-${path}`} d={path} className="gmp2-link-glow" />)}
                {LINK_PATHS.slice(0, 4).map((path, index) => <path key={`flow-${path}`} d={path} className={`gmp2-link-flow${index % 2 ? ' gmp2-link-flow--secondary' : ''}`} />)}
              </svg>
              <div className="gmp2-node-core" />
              {preset.nodes.map((node, index) => (
                <SkillNode
                  key={`${activeVariant}-${node.label}`}
                  state={node.state}
                  x={node.x}
                  y={node.y}
                  label={node.label}
                  size={node.size}
                  badge={node.badge}
                  floatDur={6.4 + index * 0.55}
                  floatDelay={-index * 0.7}
                  speed={energyPreset.pulse}
                />
              ))}
            </div>

            <div className="gmp2-metrics">
              {preset.metrics.map((metric) => <div key={metric} className="gmp2-metric">{metric}</div>)}
            </div>
            <div className="gmp2-rail"><span /><span /><span /></div>
            <div className="gmp2-corners"><span className="gmp2-corner" /><span className="gmp2-corner" /><span className="gmp2-corner" /><span className="gmp2-corner" /></div>
            {interactiveLighting && hoverGlow && impact.id > 0 ? <span key={impact.id} className="gmp2-impact" style={{ left: `${impact.x}%`, top: `${impact.y}%` }} /> : null}
          </div>
        </div>
      </div>

      <div className="gmp2-hint">{interactiveLighting ? 'MOVE TO TILT // TAP TO IMPULSE' : 'STATIC MATERIAL // POINTER LIGHTING OFF'}</div>
      <button type="button" className="gmp2-reference" onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()} onClick={copyReference}>
        {copied ? 'COPIED' : 'COPY CONFIG'}
      </button>
    </div>
  );
}

export default GlassMetalSkilltreePanel;
