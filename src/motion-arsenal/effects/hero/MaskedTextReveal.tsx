import HeroTextReveal, { type HeroTextRevealProps } from './HeroTextReveal';

/**
 * Legacy compatibility wrapper for saved imports.
 * Use HeroTextReveal for new work; its catalog entry is now canonical.
 */
export type MaskedTextRevealProps = HeroTextRevealProps;

export function MaskedTextReveal(props: MaskedTextRevealProps) {
  return <HeroTextReveal {...props} />;
}

export default MaskedTextReveal;
