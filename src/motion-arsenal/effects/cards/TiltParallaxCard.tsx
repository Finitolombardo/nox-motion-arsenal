import InteractiveSurfaceCard, { type InteractiveSurfaceCardProps } from './InteractiveSurfaceCard';

/**
 * Legacy compatibility wrapper for saved imports.
 * Use InteractiveSurfaceCard for new work; its catalog entry is now canonical.
 */
export type TiltParallaxCardProps = InteractiveSurfaceCardProps;

export function TiltParallaxCard(props: TiltParallaxCardProps) {
  return <InteractiveSurfaceCard {...props} />;
}

export default TiltParallaxCard;
