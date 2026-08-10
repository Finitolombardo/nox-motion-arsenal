import React, { useMemo, useRef, useState } from 'react';
import { AtmosLayer, ICONS, det } from './skilltreeShared';

// ---------------------------------------------------------------------------
// LockedPathShadow — an interactive shadow network. The cursor becomes a
// scanner, locked nodes expose requirements on click and scan mode reveals the
// architecture behind the veil. React + CSS + SVG only; no runtime dependency.
// ---------------------------------------------------------------------------

export interface LockedPathShadowProps {
  veilStrength?: number; // 0..1
  // Skilltree-Erweiterungen. Defaults bilden das bisherige Verhalten exakt ab.
  scanDirection?: 'left-to-right' | 'right-to-left' | 'top-to-bottom'; // Laufrichtung des Scanstrahls
  scanSpeed?: number; // 0.3..2.5 — Tempofaktor des Scans
  nodeShape?: 'circle' | 'hex' | 'diamond'; // Umriss der gesperrten Knoten
  shadowColor?: string; // Grundton von Strahl, Staub und Sperrpfaden
  dustCount?: number; // 0..64 — Dichte des schwebenden Staubs
}

type CssVars = React.CSSProperties & Record<`--${string}`, string | number>;

type ShadowNode = {
  id: string;
  label: string;
  tier: string;
  requirement: string;
  x: number;
  y: number;
  size: number;
  path: string;
};

// --- Einfärbung -------------------------------------------------------------
// `shadowColor` soll den kompletten Violett-Anteil der Szene tragen: Strahl,
// Sperrpfade, Knotenränder, Glows und Staub. Diese Töne einzeln zu
// parametrisieren hieße zwei Dutzend CSS-Variablen zu pflegen — stattdessen
// wird der Farbabstand zum Standardton einmal berechnet und auf jeden
// violetten rgba-Wert im Stylesheet angewandt. Gold, Weiß, Grün und die
// dunklen Flächen bleiben unberührt.
//
// Beim Standardton ist der Abstand null, also gibt die Funktion exakt die
// ursprünglichen Werte zurück — das Aussehen ohne gesetztes Prop ist
// unverändert.

const DEFAULT_SHADOW = '#cb97f2';

function rgbToHsl(r: number, g: number, b: number) {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
  else if (max === gg) h = ((bb - rr) / d + 2) / 6;
  else h = ((rr - gg) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [channel(hue + 1 / 3), channel(hue), channel(hue - 1 / 3)].map((v) => Math.round(v * 255));
}

function parseHex(hex: string) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

// Violett im Sinne dieser Szene: Farbton zwischen Blau und Magenta und
// erkennbar bunt. Das trifft alle Schattentöne und keinen der Goldakzente.
const isShadowTone = (h: number, s: number) => h >= 250 && h <= 325 && s > 0.08;

function tintStylesheet(css: string, shadowColor: string) {
  const target = parseHex(shadowColor);
  const base = parseHex(DEFAULT_SHADOW)!;
  if (!target) return css;
  const targetHsl = rgbToHsl(target.r, target.g, target.b);
  const baseHsl = rgbToHsl(base.r, base.g, base.b);
  const hueDelta = targetHsl.h - baseHsl.h;
  const satRatio = baseHsl.s === 0 ? 1 : targetHsl.s / baseHsl.s;
  if (hueDelta === 0 && satRatio === 1) return css;

  return css.replace(/rgba\((\d+),(\d+),(\d+),([.\d]+)\)/g, (whole, r, g, b, a) => {
    const hsl = rgbToHsl(Number(r), Number(g), Number(b));
    if (!isShadowTone(hsl.h, hsl.s)) return whole;
    const [nr, ng, nb] = hslToRgb(hsl.h + hueDelta, Math.max(0, Math.min(1, hsl.s * satRatio)), hsl.l);
    return `rgba(${nr},${ng},${nb},${a})`;
  });
}

const LOCKED_NODES: ShadowNode[] = [
  { id: 'system-mastery', label: 'SYSTEM MASTERY', tier: 'TIER IV', requirement: 'Complete 3 core protocols', x: 68, y: 24, size: 54, path: 'M 40 49 Q 52 31 68 24' },
  { id: 'autonomous-ops', label: 'AUTONOMOUS OPS', tier: 'TIER V', requirement: 'Stabilize the operator loop', x: 76, y: 52, size: 62, path: 'M 40 49 Q 58 47 76 52' },
  { id: 'black-vault', label: 'BLACK VAULT', tier: 'TIER VI', requirement: 'Acquire 4 encrypted fragments', x: 63, y: 78, size: 50, path: 'M 40 49 Q 49 70 63 78' },
  { id: 'ascension', label: 'ASCENSION', tier: 'TIER VII', requirement: 'Master every preceding branch', x: 91, y: 37, size: 70, path: 'M 76 52 Q 88 52 91 37' },
];

const CSS = String.raw`
.lps-stage { position:absolute; inset:0; overflow:hidden; isolation:isolate; color:#f4ead4; background:radial-gradient(ellipse 58% 76% at 17% 48%,rgba(215,177,74,.12),transparent 66%),radial-gradient(ellipse 70% 90% at 82% 49%,rgba(82,20,122,.17),transparent 70%),linear-gradient(115deg,#0c0b0d 0%,#08080a 41%,#030305 100%); font-family:var(--mono,monospace); touch-action:none; }
.lps-stage::before { content:''; position:absolute; inset:0; z-index:1; pointer-events:none; background:repeating-linear-gradient(90deg,transparent 0 68px,rgba(255,255,255,.018) 69px 70px),repeating-linear-gradient(0deg,transparent 0 68px,rgba(255,255,255,.014) 69px 70px); mask-image:linear-gradient(90deg,rgba(0,0,0,.3),#000 45%,#000); }
.lps-stage::after { content:''; position:absolute; inset:0; z-index:8; pointer-events:none; background:radial-gradient(circle 15rem at var(--lps-x,74%) var(--lps-y,50%),transparent 0 18%,rgba(2,2,4,.08) 44%,rgba(2,2,4,calc(var(--lps-veil,.55)*.78)) 100%),linear-gradient(90deg,transparent 0 39%,rgba(0,0,0,calc(var(--lps-veil,.55)*.22)) 53%,rgba(0,0,0,calc(var(--lps-veil,.55)*.78)) 100%); transition:opacity .35s ease; }
.lps-stage.is-scanning::after { opacity:.48; }
.lps-vignette { position:absolute; inset:0; z-index:20; pointer-events:none; box-shadow:inset 0 0 110px 22px rgba(0,0,0,.82); }
.lps-noise { position:absolute; inset:-30%; z-index:7; pointer-events:none; opacity:.055; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.75'/%3E%3C/svg%3E"); animation:lps-noise-shift .25s steps(2) infinite; }
@keyframes lps-noise-shift { 0%{transform:translate3d(-2%,-1%,0)}25%{transform:translate3d(1%,2%,0)}50%{transform:translate3d(2%,-2%,0)}75%{transform:translate3d(-1%,1%,0)} }
.lps-header { position:absolute; top:clamp(14px,3vw,28px); left:clamp(14px,3vw,30px); z-index:30; pointer-events:none; }
.lps-kicker { display:flex; align-items:center; gap:8px; color:rgba(212,175,55,.72); font-size:8px; font-weight:800; letter-spacing:.28em; }
.lps-kicker::before { content:''; width:24px; height:1px; background:currentColor; box-shadow:0 0 9px currentColor; }
.lps-title { margin-top:7px; font-family:var(--sans,sans-serif); font-size:clamp(19px,3vw,38px); line-height:.92; font-weight:760; letter-spacing:-.055em; }
.lps-title span { color:#6f6579; }
.lps-instruction { margin-top:9px; color:rgba(255,255,255,.32); font-size:8px; letter-spacing:.15em; }
.lps-map { position:absolute; inset:0; z-index:3; width:100%; height:100%; overflow:visible; pointer-events:none; }
.lps-path-base { fill:none; stroke:rgba(255,255,255,.045); stroke-width:1.05; vector-effect:non-scaling-stroke; }
.lps-path-shadow { fill:none; stroke:rgba(129,77,163,.16); stroke-width:6; opacity:.65; filter:blur(5px); vector-effect:non-scaling-stroke; }
.lps-path-locked { fill:none; stroke:rgba(180,151,201,.16); stroke-width:1.1; stroke-dasharray:2 7; vector-effect:non-scaling-stroke; transition:stroke .35s ease,opacity .35s ease,filter .35s ease; }
.lps-path-locked.is-selected,.lps-stage.is-scanning .lps-path-locked { stroke:rgba(206,165,237,.72); opacity:.9; filter:drop-shadow(0 0 5px rgba(164,88,218,.72)); animation:lps-shadow-flow 1.25s linear infinite; }
.lps-path-active-shadow { fill:none; stroke:rgba(212,175,55,.18); stroke-width:8; filter:blur(7px); vector-effect:non-scaling-stroke; }
.lps-path-active { fill:none; stroke:url(#lpsGold); stroke-width:1.7; stroke-linecap:round; stroke-dasharray:7 10; filter:drop-shadow(0 0 5px rgba(212,175,55,.8)); vector-effect:non-scaling-stroke; animation:lps-active-flow 1.15s linear infinite; }
@keyframes lps-active-flow { to{stroke-dashoffset:-34} }
@keyframes lps-shadow-flow { to{stroke-dashoffset:-18} }
.lps-packet { fill:#fff0ad; filter:drop-shadow(0 0 5px #d4af37) drop-shadow(0 0 13px rgba(212,175,55,.75)); }
.lps-scan-beam { position:absolute; top:-8%; bottom:-8%; left:42%; z-index:11; width:1px; pointer-events:none; opacity:0; background:linear-gradient(180deg,transparent,rgba(203,151,242,.78) 18%,#fff 49%,rgba(203,151,242,.7) 77%,transparent); box-shadow:0 0 18px rgba(176,90,235,.75),0 0 55px rgba(107,41,154,.4); }
.lps-scan-beam::after { content:''; position:absolute; top:0; bottom:0; left:-90px; width:180px; background:linear-gradient(90deg,transparent,rgba(151,74,204,.11),transparent); }
.lps-stage.is-scanning .lps-scan-beam { opacity:1; animation:lps-scan var(--lps-scan-dur,3.6s) cubic-bezier(.55,0,.2,1) infinite; }
@keyframes lps-scan { 0%{transform:translateX(0);opacity:0}9%{opacity:.9}78%{opacity:.75}100%{transform:translateX(54vw);opacity:0} }
/* Laufrichtung: eigene Keyframes statt Variable, weil Transforms in
   Keyframe-Schritten nicht per CSS-Variable umkehrbar sind. */
.lps-stage.scan-rtl .lps-scan-beam { left:auto; right:42%; }
.lps-stage.scan-rtl.is-scanning .lps-scan-beam { animation-name:lps-scan-rtl; }
@keyframes lps-scan-rtl { 0%{transform:translateX(0);opacity:0}9%{opacity:.9}78%{opacity:.75}100%{transform:translateX(-54vw);opacity:0} }
.lps-stage.scan-ttb .lps-scan-beam { top:0; bottom:auto; left:-8%; right:-8%; width:auto; height:1px; background:linear-gradient(90deg,transparent,rgba(203,151,242,.78) 18%,#fff 49%,rgba(203,151,242,.7) 77%,transparent); }
.lps-stage.scan-ttb .lps-scan-beam::after { top:-90px; bottom:auto; left:0; right:0; width:auto; height:180px; background:linear-gradient(180deg,transparent,rgba(151,74,204,.11),transparent); }
.lps-stage.scan-ttb.is-scanning .lps-scan-beam { animation-name:lps-scan-ttb; }
@keyframes lps-scan-ttb { 0%{transform:translateY(0);opacity:0}9%{opacity:.9}78%{opacity:.75}100%{transform:translateY(46vh);opacity:0} }
.lps-dust { position:absolute; z-index:4; width:var(--dust-size); height:var(--dust-size); left:var(--dust-x); top:var(--dust-y); border-radius:50%; pointer-events:none; background:rgba(196,147,230,.55); opacity:var(--dust-o); box-shadow:0 0 7px rgba(172,96,226,.45); animation:lps-dust-drift var(--dust-d) ease-in-out var(--dust-delay) infinite alternate; }
@keyframes lps-dust-drift { to{transform:translate3d(var(--dust-dx),var(--dust-dy),0) scale(1.7);opacity:.08} }
.lps-active-node,.lps-locked-node { position:absolute; z-index:15; transform:translate(-50%,-50%); }
.lps-active-node { left:40%; top:49%; width:clamp(60px,9vw,92px); height:clamp(60px,9vw,92px); display:grid; place-items:center; border-radius:50%; border:1px solid rgba(212,175,55,.82); color:#ffeaa7; background:radial-gradient(circle at 36% 32%,rgba(255,246,190,.2),transparent 28%),radial-gradient(circle,rgba(102,71,8,.42),rgba(12,10,7,.96) 68%); box-shadow:0 0 22px rgba(212,175,55,.32),inset 0 0 22px rgba(212,175,55,.12); animation:lps-core-breathe 2.8s ease-in-out infinite; }
.lps-active-node::before,.lps-active-node::after { content:''; position:absolute; border-radius:inherit; border:1px solid rgba(212,175,55,.36); }
.lps-active-node::before { inset:-10px; animation:lps-ring 3s ease-out infinite; }
.lps-active-node::after { inset:-19px; border-style:dashed; animation:lps-spin 18s linear infinite; }
@keyframes lps-core-breathe { 50%{box-shadow:0 0 42px rgba(212,175,55,.58),inset 0 0 30px rgba(212,175,55,.18);transform:translate(-50%,-50%) scale(1.035)} }
@keyframes lps-ring { 0%,100%{opacity:.2;transform:scale(.88)}48%{opacity:.8;transform:scale(1.12)} }
@keyframes lps-spin { to{transform:rotate(360deg)} }
.lps-active-node svg { width:22px; height:22px; filter:drop-shadow(0 0 7px rgba(255,226,126,.85)); }
.lps-active-copy { position:absolute; top:calc(100% + 13px); left:50%; width:150px; transform:translateX(-50%); text-align:center; pointer-events:none; }
.lps-active-copy strong,.lps-node-copy strong { display:block; font-size:9px; letter-spacing:.16em; }
.lps-active-copy span,.lps-node-copy span { display:block; margin-top:3px; color:rgba(255,255,255,.28); font-size:7px; letter-spacing:.13em; }
.lps-locked-node { left:var(--node-x); top:var(--node-y); width:var(--node-size); height:var(--node-size); padding:0; border:1px solid rgba(177,140,201,.17); border-radius:var(--lps-node-radius,50%); clip-path:var(--lps-node-clip,none); color:rgba(206,187,220,.45); background:radial-gradient(circle at 34% 30%,rgba(180,132,212,.08),transparent 32%),radial-gradient(circle,rgba(19,14,23,.9),rgba(4,4,6,.98) 70%); box-shadow:inset 0 0 17px rgba(0,0,0,.9),0 0 0 7px rgba(115,61,151,.02); cursor:crosshair; opacity:.62; filter:saturate(.48); transition:opacity .32s ease,color .32s ease,border-color .32s ease,box-shadow .32s ease,filter .32s ease,transform .32s cubic-bezier(.16,1,.3,1); }
.lps-locked-node::before { content:''; position:absolute; inset:-8px; border-radius:inherit; border:1px dashed rgba(184,133,218,.14); animation:lps-spin 26s linear infinite reverse; }
.lps-locked-node::after { content:''; position:absolute; inset:19%; border-radius:inherit; background:linear-gradient(135deg,transparent 44%,rgba(208,165,237,.18) 48%,rgba(208,165,237,.18) 52%,transparent 56%); transform:rotate(-11deg); }
.lps-locked-node:hover,.lps-locked-node:focus-visible,.lps-locked-node.is-selected,.lps-stage.is-scanning .lps-locked-node { opacity:1; color:#d8b8eb; filter:saturate(1); border-color:rgba(197,137,235,.65); box-shadow:inset 0 0 20px rgba(63,22,88,.9),0 0 25px rgba(152,67,205,.32),0 0 0 7px rgba(115,61,151,.06); transform:translate(-50%,-50%) scale(1.08); }
.lps-locked-node:focus-visible { outline:2px solid #d8b8eb; outline-offset:5px; }
.lps-locked-node.is-selected { animation:lps-node-strike .72s cubic-bezier(.16,1,.3,1); }
@keyframes lps-node-strike { 0%{transform:translate(-50%,-50%) scale(.86)}45%{transform:translate(-50%,-50%) scale(1.18)}100%{transform:translate(-50%,-50%) scale(1.08)} }
.lps-locked-node svg { width:17px; height:17px; }
.lps-node-copy { position:absolute; top:calc(100% + 10px); left:50%; width:130px; transform:translateX(-50%); text-align:center; pointer-events:none; opacity:.48; transition:opacity .3s ease; }
.lps-locked-node:hover .lps-node-copy,.lps-locked-node:focus-visible .lps-node-copy,.lps-locked-node.is-selected .lps-node-copy,.lps-stage.is-scanning .lps-node-copy { opacity:1; }
.lps-node-copy strong { color:#bda9c9; }
.lps-node-copy span { color:rgba(203,159,231,.5); }
.lps-root { position:absolute; left:14%; top:54%; z-index:13; transform:translate(-50%,-50%); display:grid; place-items:center; width:clamp(44px,6.5vw,66px); height:clamp(44px,6.5vw,66px); border:1px solid rgba(73,214,146,.42); border-radius:50%; color:#8ce8b8; background:radial-gradient(circle,rgba(28,112,71,.24),rgba(5,10,8,.96) 70%); box-shadow:0 0 18px rgba(52,211,153,.17),inset 0 0 15px rgba(52,211,153,.08); }
.lps-root svg { width:18px; height:18px; }
.lps-root-label { position:absolute; top:calc(100% + 9px); left:50%; transform:translateX(-50%); color:rgba(118,226,173,.72); font-size:8px; letter-spacing:.14em; white-space:nowrap; }
.lps-control { position:absolute; top:clamp(14px,3vw,25px); right:clamp(14px,3vw,28px); z-index:35; min-height:40px; padding:0 14px; border:1px solid rgba(188,132,225,.28); border-radius:4px; color:rgba(218,190,236,.68); background:rgba(7,5,9,.72); backdrop-filter:blur(12px); font-family:inherit; font-size:8px; font-weight:800; letter-spacing:.17em; cursor:pointer; transition:color .25s ease,border-color .25s ease,background .25s ease,box-shadow .25s ease; }
.lps-control:hover,.lps-control:focus-visible,.lps-control.is-active { color:#ead8f5; border-color:rgba(197,137,235,.68); background:rgba(61,22,84,.55); box-shadow:0 0 22px rgba(150,61,205,.24); }
.lps-control:focus-visible { outline:2px solid #d8b8eb; outline-offset:3px; }
.lps-panel { position:absolute; left:clamp(14px,3vw,30px); bottom:clamp(14px,3vw,26px); z-index:35; width:min(330px,calc(100% - 28px)); min-height:74px; padding:13px 15px; border:1px solid rgba(255,255,255,.075); border-left:2px solid rgba(212,175,55,.62); background:linear-gradient(105deg,rgba(13,11,15,.88),rgba(5,5,7,.68)); backdrop-filter:blur(14px); box-shadow:0 18px 45px rgba(0,0,0,.32); pointer-events:none; }
.lps-panel-top { display:flex; align-items:center; justify-content:space-between; gap:12px; color:rgba(255,255,255,.32); font-size:7px; letter-spacing:.16em; }
.lps-panel-top b { color:rgba(212,175,55,.72); font-weight:800; }
.lps-panel-main { margin-top:8px; color:#d8cce0; font-family:var(--sans,sans-serif); font-size:12px; font-weight:650; }
.lps-panel-main span { color:#a66bc8; }
.lps-panel-rule { width:100%; height:1px; margin-top:10px; overflow:hidden; background:rgba(255,255,255,.05); }
.lps-panel-rule::after { content:''; display:block; width:42%; height:100%; background:linear-gradient(90deg,#d4af37,#a66bc8); box-shadow:0 0 9px rgba(166,107,200,.8); animation:lps-rule 2.2s ease-in-out infinite alternate; }
@keyframes lps-rule { to{transform:translateX(138%)} }
@media (max-width:720px) { .lps-header{max-width:58%}.lps-title{font-size:19px}.lps-instruction{display:none}.lps-control{min-height:36px;padding:0 10px;font-size:7px}.lps-node-copy{width:90px}.lps-node-copy strong{font-size:7px}.lps-node-copy span{display:none}.lps-panel{min-height:62px;padding:10px 12px}.lps-panel-main{font-size:10px} }
@media (max-width:480px) { .lps-header{top:12px;left:12px}.lps-title{font-size:16px}.lps-kicker{font-size:6px}.lps-control{top:10px;right:10px}.lps-active-node{left:38%;top:48%}.lps-root{left:12%}.lps-panel{left:10px;bottom:10px;width:calc(100% - 20px)} }
@media (prefers-reduced-motion:reduce) { .lps-noise,.lps-path-active,.lps-path-locked,.lps-scan-beam,.lps-dust,.lps-active-node,.lps-active-node::before,.lps-active-node::after,.lps-locked-node,.lps-locked-node::before,.lps-panel-rule::after{animation:none!important}.lps-stage *,.lps-stage::after{transition-duration:.01ms!important} }
`;

export function LockedPathShadow({
  veilStrength = 0.55,
  scanDirection = 'left-to-right',
  scanSpeed = 1,
  nodeShape = 'circle',
  shadowColor = '#cb97f2',
  dustCount = 32,
}: LockedPathShadowProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const veil = Math.max(0, Math.min(1, veilStrength));
  const selected = LOCKED_NODES.find((node) => node.id === selectedId) ?? null;
  const dustTotal = Math.max(0, Math.min(64, Math.round(dustCount)));

  const dust = useMemo(() => Array.from({ length: dustTotal }, (_, index) => ({
    x: 43 + det(index, 31) * 56,
    y: det(index, 32) * 100,
    size: 1 + det(index, 33) * 2.6,
    opacity: 0.08 + det(index, 34) * 0.34,
    duration: 5 + det(index, 35) * 9,
    delay: det(index, 36) * -8,
    dx: (det(index, 37) - 0.5) * 44,
    dy: (det(index, 38) - 0.5) * 64,
  })), [dustTotal]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 100;
    const y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 100;
    event.currentTarget.style.setProperty('--lps-x', `${Math.max(0, Math.min(100, x))}%`);
    event.currentTarget.style.setProperty('--lps-y', `${Math.max(0, Math.min(100, y))}%`);
  };

  const SHAPES: Record<string, { radius: string; clip: string }> = {
    circle: { radius: '50%', clip: 'none' },
    hex: { radius: '12%', clip: 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0% 50%)' },
    diamond: { radius: '10%', clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  };
  const shape = SHAPES[nodeShape] ?? SHAPES.circle;
  const scanClass =
    scanDirection === 'right-to-left' ? 'scan-rtl' : scanDirection === 'top-to-bottom' ? 'scan-ttb' : '';

  const stageStyle: CssVars = {
    '--lps-veil': veil,
    '--lps-x': '74%',
    '--lps-y': '50%',
    '--lps-scan-dur': `${(3.6 / Math.max(0.3, scanSpeed)).toFixed(2)}s`,
    '--lps-node-radius': shape.radius,
    '--lps-node-clip': shape.clip,
  };

  const tintedCss = useMemo(() => tintStylesheet(CSS, shadowColor), [shadowColor]);

  return (
    <div ref={stageRef} className={`lps-stage ${scanClass} ${scanning ? 'is-scanning' : ''}`} style={stageStyle} onPointerMove={handlePointerMove} onPointerDown={handlePointerMove} onPointerLeave={(event) => { event.currentTarget.style.setProperty('--lps-x', '74%'); event.currentTarget.style.setProperty('--lps-y', '50%'); }}>
      <style>{tintedCss}</style>
      <AtmosLayer particles={8} stars={14} />
      <div className="lps-noise" aria-hidden="true" />
      <div className="lps-scan-beam" aria-hidden="true" />

      {dust.map((particle, index) => (
        <span key={index} className="lps-dust" aria-hidden="true" style={{ '--dust-x': `${particle.x}%`, '--dust-y': `${particle.y}%`, '--dust-size': `${particle.size}px`, '--dust-o': particle.opacity, '--dust-d': `${particle.duration}s`, '--dust-delay': `${particle.delay}s`, '--dust-dx': `${particle.dx}px`, '--dust-dy': `${particle.dy}px` } as CssVars} />
      ))}

      <header className="lps-header">
        <div className="lps-kicker">NOX SHADOW PROTOCOL</div>
        <div className="lps-title">LOCKED <span>PATH NETWORK</span></div>
        <div className="lps-instruction">MOVE CURSOR TO REVEAL · SELECT A NODE TO INSPECT</div>
      </header>

      <button type="button" className={`lps-control ${scanning ? 'is-active' : ''}`} aria-pressed={scanning} onClick={() => setScanning((current) => !current)}>
        {scanning ? '◉ SCAN ACTIVE' : '◎ SCAN SHADOW'}
      </button>

      <svg className="lps-map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="lpsGold" x1="0" x2="1"><stop offset="0" stopColor="#6ee7a8" /><stop offset=".5" stopColor="#d4af37" /><stop offset="1" stopColor="#fff1a8" /></linearGradient></defs>
        <path className="lps-path-active-shadow" d="M 14 54 Q 25 41 40 49" />
        <path className="lps-path-active" d="M 14 54 Q 25 41 40 49" />
        <circle className="lps-packet" r=".72"><animateMotion dur="2.25s" repeatCount="indefinite" path="M 14 54 Q 25 41 40 49" /></circle>
        {LOCKED_NODES.map((node) => <g key={node.id}><path className="lps-path-shadow" d={node.path} /><path className="lps-path-base" d={node.path} /><path className={`lps-path-locked ${selectedId === node.id ? 'is-selected' : ''}`} d={node.path} /></g>)}
      </svg>

      <div className="lps-root" aria-label="Foundation completed">{ICONS.completed}<span className="lps-root-label">FOUNDATION</span></div>
      <div className="lps-active-node" aria-label="Current path active">{ICONS.active}<div className="lps-active-copy"><strong>ACTIVE PATH</strong><span>OPERATOR CORE · ONLINE</span></div></div>

      {LOCKED_NODES.map((node) => (
        <button key={node.id} type="button" className={`lps-locked-node ${selectedId === node.id ? 'is-selected' : ''}`} style={{ '--node-x': `${node.x}%`, '--node-y': `${node.y}%`, '--node-size': `${node.size}px` } as CssVars} aria-pressed={selectedId === node.id} aria-label={`${node.label}, ${node.tier}, locked. ${node.requirement}`} onClick={() => setSelectedId((current) => current === node.id ? null : node.id)}>
          {ICONS.locked}<span className="lps-node-copy"><strong>{node.label}</strong><span>{node.tier} · LOCKED</span></span>
        </button>
      ))}

      <aside className="lps-panel" aria-live="polite">
        <div className="lps-panel-top"><b>SHADOW NETWORK // {LOCKED_NODES.length} SEALED</b><span>{selected ? selected.tier : 'SCANNER READY'}</span></div>
        <div className="lps-panel-main">{selected ? <>ACCESS DENIED — <span>{selected.requirement}</span></> : <>Select a sealed node to expose its <span>unlock condition</span>.</>}</div>
        <div className="lps-panel-rule" />
      </aside>

      <div className="lps-vignette" aria-hidden="true" />
    </div>
  );
}

export default LockedPathShadow;
