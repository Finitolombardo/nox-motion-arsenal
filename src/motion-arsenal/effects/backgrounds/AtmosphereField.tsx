import React from 'react';
import { NoiseFogField } from './NoiseFogField';
import { DepthGlowLayerStack } from './DepthGlowLayerStack';
import { RadialBeamAtmosphere } from './RadialBeamAtmosphere';
















export type AtmospherePresetId =
  | 'restaurant'
  | 'beauty'
  | 'fitness'
  | 'local-service'
  | 'real-estate'
  | 'automotive'
  | 'healthcare'
  | 'finance'
  | 'saas'
  | 'ecommerce'
  | 'luxury'
  | 'creator';
















export type AtmospherePerformanceProfile = 'lite' | 'balanced' | 'cinematic';
















export interface AtmospherePreset {
  label: string;
  fog: boolean;
  glow: boolean;
  beams: boolean;
  intensity: number;
  speed: number;
  fogScale: number;
  emberAmount: number;
  glowLayers: number;
  hueMix: number;
  parallax: number;
  beamCount: number;
  beamSpeed: number;
  beamColor: string;
  beamGlow: number;
  beamOriginY: number;
  vignette: number;
  overlayOpacity: number;
  performanceProfile: AtmospherePerformanceProfile;
}
















export const ATMOSPHERE_PRESETS: Record<AtmospherePresetId, AtmospherePreset> = {
  restaurant: { label: 'Restaurant / Hospitality', fog: true, glow: true, beams: false, intensity: 0.66, speed: 0.72, fogScale: 2.45, emberAmount: 0.48, glowLayers: 5, hueMix: 0.84, parallax: 0.22, beamCount: 7, beamSpeed: 88, beamColor: '#D89B5B', beamGlow: 0.38, beamOriginY: 82, vignette: 0.46, overlayOpacity: 0.88, performanceProfile: 'balanced' },
  beauty: { label: 'Beauty / Wellness', fog: true, glow: true, beams: false, intensity: 0.54, speed: 0.58, fogScale: 2.8, emberAmount: 0.18, glowLayers: 5, hueMix: 1, parallax: 0.16, beamCount: 6, beamSpeed: 110, beamColor: '#D9A8B8', beamGlow: 0.28, beamOriginY: 76, vignette: 0.34, overlayOpacity: 0.82, performanceProfile: 'balanced' },
  fitness: { label: 'Fitness / Sport', fog: true, glow: true, beams: true, intensity: 0.92, speed: 1.28, fogScale: 1.9, emberAmount: 0.92, glowLayers: 6, hueMix: 0.42, parallax: 0.5, beamCount: 12, beamSpeed: 36, beamColor: '#FF5B2E', beamGlow: 0.76, beamOriginY: 84, vignette: 0.58, overlayOpacity: 0.94, performanceProfile: 'cinematic' },
  'local-service': { label: 'Handwerk / Local Service', fog: true, glow: false, beams: true, intensity: 0.68, speed: 0.9, fogScale: 2.2, emberAmount: 0.6, glowLayers: 4, hueMix: 0.58, parallax: 0.18, beamCount: 8, beamSpeed: 72, beamColor: '#F2B544', beamGlow: 0.48, beamOriginY: 86, vignette: 0.52, overlayOpacity: 0.9, performanceProfile: 'balanced' },
  'real-estate': { label: 'Immobilien', fog: false, glow: true, beams: true, intensity: 0.46, speed: 0.46, fogScale: 3, emberAmount: 0.1, glowLayers: 4, hueMix: 0.9, parallax: 0.12, beamCount: 6, beamSpeed: 130, beamColor: '#C8B38A', beamGlow: 0.26, beamOriginY: 72, vignette: 0.3, overlayOpacity: 0.78, performanceProfile: 'lite' },
  automotive: { label: 'Automotive', fog: true, glow: true, beams: true, intensity: 0.84, speed: 1.06, fogScale: 2.05, emberAmount: 0.52, glowLayers: 6, hueMix: 0.24, parallax: 0.44, beamCount: 10, beamSpeed: 44, beamColor: '#C5D0D9', beamGlow: 0.7, beamOriginY: 80, vignette: 0.64, overlayOpacity: 0.95, performanceProfile: 'cinematic' },
  healthcare: { label: 'Healthcare / Praxis', fog: false, glow: true, beams: false, intensity: 0.34, speed: 0.4, fogScale: 3.1, emberAmount: 0, glowLayers: 4, hueMix: 1, parallax: 0.08, beamCount: 5, beamSpeed: 140, beamColor: '#69B8B4', beamGlow: 0.2, beamOriginY: 74, vignette: 0.2, overlayOpacity: 0.72, performanceProfile: 'lite' },
  finance: { label: 'Kanzlei / Finance', fog: false, glow: true, beams: true, intensity: 0.4, speed: 0.4, fogScale: 3, emberAmount: 0.06, glowLayers: 4, hueMix: 0.72, parallax: 0.08, beamCount: 5, beamSpeed: 150, beamColor: '#B8A46B', beamGlow: 0.24, beamOriginY: 70, vignette: 0.3, overlayOpacity: 0.78, performanceProfile: 'lite' },
  saas: { label: 'SaaS / Tech', fog: true, glow: true, beams: true, intensity: 0.74, speed: 0.92, fogScale: 2.15, emberAmount: 0.14, glowLayers: 6, hueMix: 1, parallax: 0.42, beamCount: 9, beamSpeed: 62, beamColor: '#62A7FF', beamGlow: 0.58, beamOriginY: 78, vignette: 0.48, overlayOpacity: 0.9, performanceProfile: 'cinematic' },
  ecommerce: { label: 'E-Commerce', fog: true, glow: true, beams: false, intensity: 0.66, speed: 0.82, fogScale: 2.35, emberAmount: 0.16, glowLayers: 5, hueMix: 1, parallax: 0.3, beamCount: 8, beamSpeed: 76, beamColor: '#F078B8', beamGlow: 0.44, beamOriginY: 80, vignette: 0.34, overlayOpacity: 0.86, performanceProfile: 'balanced' },
  luxury: { label: 'Luxury / Premium', fog: true, glow: true, beams: true, intensity: 0.46, speed: 0.38, fogScale: 2.9, emberAmount: 0.22, glowLayers: 5, hueMix: 0.82, parallax: 0.1, beamCount: 6, beamSpeed: 160, beamColor: '#C5A56B', beamGlow: 0.28, beamOriginY: 74, vignette: 0.42, overlayOpacity: 0.82, performanceProfile: 'balanced' },
  creator: { label: 'Creator / Personal Brand', fog: true, glow: true, beams: true, intensity: 0.86, speed: 1.12, fogScale: 1.95, emberAmount: 0.24, glowLayers: 6, hueMix: 1, parallax: 0.5, beamCount: 11, beamSpeed: 42, beamColor: '#B86CFF', beamGlow: 0.68, beamOriginY: 82, vignette: 0.48, overlayOpacity: 0.94, performanceProfile: 'cinematic' },
};
















export interface AtmosphereFieldProps {
  preset?: AtmospherePresetId;
  fog?: boolean;
  glow?: boolean;
  beams?: boolean;
  intensity?: number;
  speed?: number;
  fogScale?: number;
  emberAmount?: number;
  glowLayers?: number;
  hueMix?: number;
  parallax?: number;
  beamCount?: number;
  beamSpeed?: number;
  beamColor?: string;
  beamGlow?: number;
  beamOriginY?: number;
  vignette?: number;
  overlayOpacity?: number;
  performanceProfile?: AtmospherePerformanceProfile;
}
















const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
















export function AtmosphereField(props: AtmosphereFieldProps) {
  const preset = ATMOSPHERE_PRESETS[props.preset ?? 'saas'];
  const fog = props.fog ?? preset.fog;
  const glow = props.glow ?? preset.glow;
  const beams = props.beams ?? preset.beams;
  const intensity = clamp01(props.intensity ?? preset.intensity);
  const speed = Math.max(0.08, props.speed ?? preset.speed);
  const fogScale = Math.max(0.5, props.fogScale ?? preset.fogScale);
  const emberAmount = clamp01(props.emberAmount ?? preset.emberAmount);
  const glowLayers = Math.max(3, Math.min(9, Math.round(props.glowLayers ?? preset.glowLayers)));
  const hueMix = clamp01(props.hueMix ?? preset.hueMix);
  const parallax = clamp01(props.parallax ?? preset.parallax);
  const beamCount = Math.max(4, Math.min(18, Math.round(props.beamCount ?? preset.beamCount)));
  const beamSpeed = Math.max(18, props.beamSpeed ?? preset.beamSpeed);
  const beamColor = props.beamColor ?? preset.beamColor;
  const beamGlow = clamp01(props.beamGlow ?? preset.beamGlow);
  const beamOriginY = Math.max(0, Math.min(100, props.beamOriginY ?? preset.beamOriginY));
  const vignette = clamp01(props.vignette ?? preset.vignette);
  const overlayOpacity = clamp01(props.overlayOpacity ?? preset.overlayOpacity);
  const performanceProfile = props.performanceProfile ?? preset.performanceProfile;
  const effectiveFog = fog && performanceProfile !== 'lite';
  const effectiveGlowLayers = performanceProfile === 'lite' ? Math.min(glowLayers, 4) : performanceProfile === 'balanced' ? Math.min(glowLayers, 6) : glowLayers;
  const effectiveBeamCount = performanceProfile === 'lite' ? Math.min(beamCount, 6) : performanceProfile === 'balanced' ? Math.min(beamCount, 10) : beamCount;
















  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', isolation: 'isolate', background: '#08080a' }}>
      {effectiveFog && (
        <div style={{ position: 'absolute', inset: 0, opacity: overlayOpacity }}>
          <NoiseFogField intensity={intensity} speed={speed} emberAmount={emberAmount} scale={fogScale} />
        </div>
      )}
      {glow && (
        <div style={{ position: 'absolute', inset: 0, opacity: overlayOpacity, mixBlendMode: 'screen' }}>
          <DepthGlowLayerStack layerCount={effectiveGlowLayers} hueMix={hueMix} driftSpeed={speed} parallax={parallax} intensity={intensity} />
        </div>
      )}
      {beams && (
        <div style={{ position: 'absolute', inset: 0, opacity: overlayOpacity }}>
          <RadialBeamAtmosphere beamCount={effectiveBeamCount} rotationSpeed={beamSpeed / speed} color={beamColor} coreGlow={beamGlow * intensity} originY={beamOriginY} />
        </div>
      )}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 50% 48%, transparent 26%, rgba(5,5,7,${(vignette * 0.4).toFixed(3)}) 66%, rgba(4,4,6,${(vignette * 0.86).toFixed(3)}) 100%)`, zIndex: 5 }} />
    </div>
  );
}
















export default AtmosphereField;
