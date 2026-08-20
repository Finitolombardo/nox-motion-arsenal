import { SmoothSectionWipe } from './SmoothSectionWipe';
import { MaskedRouteTransition } from './MaskedRouteTransition';
import { ClipPathReveal } from './ClipPathReveal';
import { LayeredPageEnter } from './LayeredPageEnter';
import { PanelShiftTransition } from './PanelShiftTransition';

export const ROUTE_TRANSITION_SYSTEM_MODES = ['wipe', 'masked', 'clip', 'layered', 'panel'] as const;
export type RouteTransitionSystemMode = (typeof ROUTE_TRANSITION_SYSTEM_MODES)[number];

export interface RouteTransitionSystemProps {
  mode?: RouteTransitionSystemMode;
  accent?: string;
  speed?: number;
}

/** Canonical route-transition selector; all transition components remain standalone imports. */
export function RouteTransitionSystem({ mode = 'wipe', accent = '#C93030', speed = 1 }: RouteTransitionSystemProps) {
  switch (mode) {
    case 'masked': return <MaskedRouteTransition accent={accent} speed={speed} />;
    case 'clip': return <ClipPathReveal accent={accent} speed={speed} />;
    case 'layered': return <LayeredPageEnter accent={accent} speed={speed} />;
    case 'panel': return <PanelShiftTransition accent={accent} speed={speed} />;
    default: return <SmoothSectionWipe accent={accent} speed={speed} />;
  }
}

export default RouteTransitionSystem;
