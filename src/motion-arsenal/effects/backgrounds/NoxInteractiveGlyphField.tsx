import type { CSSProperties } from 'react';
import ForgeEnergyGlyphs, { type ForgeEnergyGlyphsProps } from './ForgeEnergyGlyphs';
import NoxAdaptedScribbleField, { type ScribbleFieldProps } from './NoxAdaptedScribbleField';

export type NoxInteractiveGlyphFieldMode = 'glyphs' | 'scribble' | 'hybrid';
export type NoxInteractiveGlyphFieldInteraction = 'ambient' | 'pointer-proximity' | 'pointer-attract';

export interface NoxInteractiveGlyphFieldProps {
  /** Select the deterministic Forge glyph field, organic scribbles, or both layers. */
  mode?: NoxInteractiveGlyphFieldMode;
  /** Ambient is static interaction; proximity energizes; attract also nudges shapes toward the pointer. */
  interaction?: NoxInteractiveGlyphFieldInteraction;
  glyphCount?: ForgeEnergyGlyphsProps['glyphCount'];
  density?: number;
  intensity?: number;
  color?: ForgeEnergyGlyphsProps['color'];
  variant?: ForgeEnergyGlyphsProps['variant'];
  stateMode?: ForgeEnergyGlyphsProps['stateMode'];
  proximityRadius?: number;
  parallax?: number;
  seed?: number;
  showControls?: boolean;
  scribbleColorMode?: ScribbleFieldProps['colorMode'];
  blendMode?: ScribbleFieldProps['blendMode'];
  className?: string;
  style?: CSSProperties;
}

function forgeInteraction(interaction: NoxInteractiveGlyphFieldInteraction): ForgeEnergyGlyphsProps['interactionMode'] {
  if (interaction === 'ambient') return 'none';
  return 'pointer';
}

/**
 * Canonical background entry for NOX glyph atmospheres.
 *
 * The previous Forge and Scribble components remain direct-import compatibility
 * wrappers; catalog aliases resolve their saved effect ids to this unified field.
 */
export function NoxInteractiveGlyphField({
  mode = 'hybrid',
  interaction = 'pointer-proximity',
  glyphCount = 18,
  density = 1,
  intensity = 0.8,
  color,
  variant,
  stateMode,
  proximityRadius = 190,
  parallax = 0.5,
  seed = 313,
  showControls = false,
  scribbleColorMode = 'nox',
  blendMode = 'screen',
  className,
  style,
}: NoxInteractiveGlyphFieldProps) {
  const showScribbles = mode === 'scribble' || mode === 'hybrid';
  const showGlyphs = mode === 'glyphs' || mode === 'hybrid';

  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }}
      data-nox-glyph-mode={mode}
      data-nox-glyph-interaction={interaction}
      aria-label="NOX interactive glyph field"
    >
      {showScribbles && (
        <NoxAdaptedScribbleField
          colorMode={scribbleColorMode}
          intensity={intensity}
          density={mode === 'hybrid' ? Math.max(3, Math.round(density * 5)) : Math.max(3, Math.round(density * 7))}
          parallax={parallax}
          proximityRadius={proximityRadius}
          blendMode={blendMode}
          seed={seed}
          interaction={interaction}
        />
      )}
      {showGlyphs && (
        <ForgeEnergyGlyphs
          variant={variant}
          stateMode={stateMode}
          glyphCount={glyphCount}
          density={density}
          intensity={intensity}
          color={color}
          interactionMode={forgeInteraction(interaction)}
          proximityRadius={proximityRadius}
          parallax={parallax}
          seed={seed + (mode === 'hybrid' ? 97 : 0)}
          showVariantSwitcher={showControls}
          showStateSwitcher={showControls}
        />
      )}
    </div>
  );
}

export default NoxInteractiveGlyphField;
