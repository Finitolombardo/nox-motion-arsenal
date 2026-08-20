import React from 'react';
import { SkillNode, AtmosLayer, type SkillNodeState } from './skilltreeShared';


export type SkillNodeStatePresetId = 'fitness' | 'saas' | 'creator' | 'luxury';


export interface SkillNodeStatePreset {
  label: string;
  props: Partial<SkillNodeStateSystemProps>;
}


export interface SkillNodeStateSystemProps {
  state?: SkillNodeState;
  label?: string;
  badge?: string;
  size?: number;
  speed?: number;
  glitchIntensity?: number;
  atmosphere?: boolean;
  atmosphereDensity?: number;
  showContext?: boolean;
  showPath?: boolean;
  preset?: SkillNodeStatePresetId;
}


export const SKILL_NODE_STATE_PRESETS: Record<SkillNodeStatePresetId, SkillNodeStatePreset> = {
  fitness: { label: 'Fitness / Progress', props: { state: 'active', speed: 1.15, size: 68, atmosphereDensity: 8 } },
  saas: { label: 'SaaS / Recommended', props: { state: 'recommended', speed: .8, size: 62, badge: 'Recommended' } },
  creator: { label: 'Creator / Risk Signal', props: { state: 'risk', speed: 1.15, size: 64, glitchIntensity: 1.1 } },
  luxury: { label: 'Luxury / Focus', props: { state: 'recommended', speed: .55, size: 60, atmosphereDensity: 5 } },
};


const DEFAULTS: Required<Omit<SkillNodeStateSystemProps, 'preset' | 'badge'>> & { badge?: string } = {
  state: 'active', label: 'Active Node', size: 64, speed: 1, glitchIntensity: 1,
  atmosphere: true, atmosphereDensity: 8, showContext: true, showPath: true,
};


export function SkillNodeStateSystem(input: SkillNodeStateSystemProps = {}) {
  const presetProps = input.preset ? SKILL_NODE_STATE_PRESETS[input.preset]?.props ?? {} : {};
  const p = { ...DEFAULTS, ...presetProps, ...input };
  const contextState: SkillNodeState = p.state === 'risk' ? 'active' : p.state === 'recommended' ? 'available' : 'available';


  return (
    <div className="stfx-stage" data-skill-node-state={p.state}>
      {p.atmosphere && <AtmosLayer particles={p.atmosphereDensity} stars={p.state === 'recommended' ? p.atmosphereDensity : 0} />}
      {p.showPath && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className={`stfx-link stfx-link--${p.state === 'risk' ? 'risk' : 'lit'}`} d="M 26 54 Q 44 42 62 49" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      {p.showContext && <SkillNode state={contextState} x={26} y={54} label="Context" size={Math.round(p.size * .78)} />}
      <SkillNode
        state={p.state}
        x={62}
        y={49}
        label={p.label}
        badge={p.badge ?? (p.state === 'recommended' ? 'Von NOX empfohlen' : p.state === 'risk' ? 'Risk' : undefined)}
        size={p.size}
        speed={p.speed}
        glitch={p.glitchIntensity}
      />
    </div>
  );
}


export default SkillNodeStateSystem;
