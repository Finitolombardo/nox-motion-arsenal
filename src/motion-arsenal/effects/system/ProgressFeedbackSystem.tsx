import { ScanCompletePulse } from './ScanCompletePulse';
import { ProgressRingCharge } from './ProgressRingCharge';
import { XPFillSurge } from './XPFillSurge';

export const PROGRESS_FEEDBACK_SYSTEM_MODES = ['scan', 'ring', 'xp'] as const;
export type ProgressFeedbackSystemMode = (typeof PROGRESS_FEEDBACK_SYSTEM_MODES)[number];

export interface ProgressFeedbackSystemProps {
  mode?: ProgressFeedbackSystemMode;
  accent?: string;
  speed?: number;
  target?: number;
  autoReplay?: boolean;
}

/** Canonical progress selector; each feedback effect remains directly importable. */
export function ProgressFeedbackSystem({ mode = 'scan', accent = '#C93030', speed = 1, target = 100, autoReplay = true }: ProgressFeedbackSystemProps) {
  switch (mode) {
    case 'ring': return <ProgressRingCharge target={target} duration={3 / speed} accent={accent} autoReplay={autoReplay} />;
    case 'xp': return <XPFillSurge fillDuration={3.4 / speed} accent={accent} autoReplay={autoReplay} />;
    default: return <ScanCompletePulse speed={speed} accent={accent} autoReplay={autoReplay} />;
  }
}

export default ProgressFeedbackSystem;
