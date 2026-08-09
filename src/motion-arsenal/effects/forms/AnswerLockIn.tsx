export { AnswerLockIn, AnswerLockIn as default } from './AnswerLockInV2';

// Keep the public union literals visible at the canonical bridge path for
// source-contract compatibility while the runtime implementation lives in V2.
export type AnswerLockInVariant = 'assessment' | 'command-deck' | 'brand-lock';
export type AnswerLockInOrientation = 'horizontal' | 'vertical';

// Forwarded public prop contract remains owned by V2: showProgressRail, logoUrl,
// onChange (plus onCommit and the remaining visual/runtime controls).
export type { AnswerLockInProps } from './AnswerLockInV2';
