import React from 'react';
import { AtmosLayer, DEMO_NODES, SkillNode, linkClass, det, type SkillNodeState } from './skilltreeShared';


export type SkilltreeSceneMode = 'float' | 'constellation' | 'forge';
export type SkilltreeAtmosphere = 'off' | 'particles' | 'stars' | 'embers' | 'hybrid';
export type SkilltreeLinks = 'off' | 'state' | 'flow' | 'risk-mix';
export type SkilltreeScenePresetId = 'fitness' | 'saas' | 'creator' | 'luxury';


export interface SkilltreeSceneSystemProps {
  mode?: SkilltreeSceneMode;
  nodeCount?: number;
  speed?: number;
  floatDistance?: number;
  atmosphere?: SkilltreeAtmosphere;
  atmosphereDensity?: number;
  links?: SkilltreeLinks;
  showLabels?: boolean;
  showNodes?: boolean;
  showRoot?: boolean;
  lockedVeil?: boolean;
  veilStrength?: number;
  preset?: SkilltreeScenePresetId;
}


export const SKILLTREE_SCENE_PRESETS: Record<SkilltreeScenePresetId, Partial<SkilltreeSceneSystemProps>> = {
  fitness: { mode: 'forge', speed: 1.15, atmosphere: 'embers', atmosphereDensity: 14, links: 'risk-mix', nodeCount: 6 },
  saas: { mode: 'constellation', speed: .8, atmosphere: 'stars', atmosphereDensity: 22, links: 'state', nodeCount: 6 },
  creator: { mode: 'float', speed: 1, atmosphere: 'hybrid', atmosphereDensity: 14, links: 'flow', nodeCount: 5 },
  luxury: { mode: 'constellation', speed: .55, atmosphere: 'stars', atmosphereDensity: 12, links: 'state', nodeCount: 5, showLabels: false },
};


const DEFAULTS: Required<Omit<SkilltreeSceneSystemProps, 'preset'>> = {
  mode: 'constellation', nodeCount: 6, speed: 1, floatDistance: 7,
  atmosphere: 'hybrid', atmosphereDensity: 16, links: 'state', showLabels: true,
  showNodes: true, showRoot: true, lockedVeil: false, veilStrength: .55,
};


const POS = [
  { x: 44, y: 14 }, { x: 68, y: 26 }, { x: 78, y: 52 },
  { x: 64, y: 80 }, { x: 40, y: 74 }, { x: 54, y: 46 },
];


function atmosphereProps(kind: SkilltreeAtmosphere, density: number) {
  if (kind === 'off') return { particles: 0, stars: 0, embers: 0 };
  if (kind === 'particles') return { particles: density, stars: 0, embers: 0 };
  if (kind === 'stars') return { particles: 0, stars: density, embers: 0 };
  if (kind === 'embers') return { particles: 0, stars: 0, embers: density };
  return { particles: Math.round(density * .55), stars: Math.round(density * .7), embers: Math.round(density * .25) };
}


export function SkilltreeSceneSystem(input: SkilltreeSceneSystemProps = {}) {
  const presetProps = input.preset ? SKILLTREE_SCENE_PRESETS[input.preset] ?? {} : {};
  const p = { ...DEFAULTS, ...presetProps, ...input };
  const n = Math.max(1, Math.min(6, Math.round(p.nodeCount)));
  const nodes = DEMO_NODES.slice(0, n);
  const root = p.mode === 'forge' ? { x: 50, y: 52 } : { x: 22, y: 48 };
  const atmos = atmosphereProps(p.atmosphere, p.atmosphereDensity);


  return (
    <div className={`stfx-stage stfx-stage--${p.mode === 'forge' ? 'forge' : 'scene'}`} style={{ ['--stfx-float' as any]: p.floatDistance, ['--stfx-veil' as any]: p.veilStrength }}>
      <AtmosLayer {...atmos} />
      {p.links !== 'off' && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {nodes.map((node, i) => {
            const pos = p.mode === 'float'
              ? { x: 12 + (i * 76) / Math.max(1, n - 1), y: 42 + (det(i, 3) - .5) * 26 }
              : POS[i % POS.length];
            const state = node.state as SkillNodeState;
            const effective = p.links === 'flow' ? 'active' : p.links === 'risk-mix' && i % 4 === 3 ? 'risk' : state;
            const lc = linkClass(effective, p.speed);
            return <path key={`${node.label}-path`} className={lc.className} style={lc.style} d={`M ${root.x} ${root.y} Q ${(root.x + pos.x) / 2} ${(root.y + pos.y) / 2 - 5} ${pos.x} ${pos.y}`} vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
      )}
      {p.showRoot && <SkillNode state="active" x={root.x} y={root.y} label={p.showLabels ? (p.mode === 'forge' ? 'Black Forge Protocol' : 'Core') : undefined} size={64} speed={p.speed} floatDur={8} />}
      {p.showNodes && nodes.map((node, i) => {
        const pos = p.mode === 'float'
          ? { x: 12 + (i * 76) / Math.max(1, n - 1), y: 42 + (det(i, 3) - .5) * 26 }
          : POS[i % POS.length];
        return (
          <SkillNode key={node.label} state={node.state as SkillNodeState} x={pos.x} y={pos.y}
            label={p.showLabels ? node.label : undefined}
            badge={node.state === 'recommended' ? 'Von NOX empfohlen' : node.state === 'risk' ? 'Blockiert' : undefined}
            floatDur={Math.max(3, 6 + det(i, 7) * 3)} floatDelay={i * -.9} speed={p.speed} />
        );
      })}
      {p.lockedVeil && <div className="stfx-veil" style={{ ['--vx' as any]: '76%', ['--vy' as any]: '50%' }} />}
    </div>
  );
}


export default SkilltreeSceneSystem;
