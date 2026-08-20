import { CursorLightField } from './CursorLightField';
import { HoverDistortionShader } from './HoverDistortionShader';
import { PointerParallaxStage } from './PointerParallaxStage';
import { SpotlightReveal } from './SpotlightReveal';
import { InteractiveSymbolDrift } from './InteractiveSymbolDrift';

export const POINTER_INTERACTION_FIELD_MODES = ['light', 'distortion', 'parallax', 'spotlight', 'symbols'] as const;
export type PointerInteractionFieldMode = (typeof POINTER_INTERACTION_FIELD_MODES)[number];

export interface PointerInteractionFieldProps {
  mode?: PointerInteractionFieldMode;
  accent?: string;
  intensity?: number;
}

/** Canonical catalog surface; underlying interaction effects remain standalone imports. */
export function PointerInteractionField({ mode = 'light', accent = '#C93030', intensity = 1 }: PointerInteractionFieldProps) {
  switch (mode) {
    case 'distortion': return <HoverDistortionShader strength={0.18 * intensity} />;
    case 'parallax': return <PointerParallaxStage accent={accent} depth={30 * intensity} />;
    case 'spotlight': return <SpotlightReveal haloColor={accent} darkness={Math.max(0.7, 0.92 - (intensity - 1) * 0.08)} />;
    case 'symbols': return <InteractiveSymbolDrift forceRadius={120 * intensity} />;
    default: return <CursorLightField intensity={intensity} />;
  }
}

export default PointerInteractionField;
