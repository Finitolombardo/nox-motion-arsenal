import { ModalIrisReveal } from './ModalIrisReveal';
import { GlassSheetOverlay } from './GlassSheetOverlay';

export const OVERLAY_SURFACE_SYSTEM_MODES = ['modal', 'sheet'] as const;
export type OverlaySurfaceSystemMode = (typeof OVERLAY_SURFACE_SYSTEM_MODES)[number];

export interface OverlaySurfaceSystemProps {
  mode?: OverlaySurfaceSystemMode;
  accent?: string;
  speed?: number;
  blur?: number;
}

/** Canonical overlay selector; ModalIrisReveal and GlassSheetOverlay remain standalone imports. */
export function OverlaySurfaceSystem({ mode = 'modal', accent = '#C93030', speed = 1, blur = 12 }: OverlaySurfaceSystemProps) {
  return mode === 'sheet'
    ? <GlassSheetOverlay accent={accent} speed={speed} blur={blur} />
    : <ModalIrisReveal accent={accent} speed={speed} blurBackdrop={blur} />;
}

export default OverlaySurfaceSystem;
