import React, { useRef } from 'react';
import { useShaderQuad, GLSL_NOISE } from '../../lib/canvasUtils';
import { clamp, useInView, usePointer, usePrefersReducedMotion } from '../../lib/animationUtils';

// ---------------------------------------------------------------------------
// NoiseFogField — NOX Adapted (KRANK-Klasse: fbm-Atmosphäre als Shader-Pass).
// Ein Fullscreen-Quad, domain-warped fbm, Ember-/Gold-Tiefe und optionale
// Pointer-Wärme. Der Pass pausiert offscreen und degradiert bei Reduced Motion
// auf einen deterministischen statischen Frame.
// ---------------------------------------------------------------------------

export interface NoiseFogFieldProps {
  intensity?: number;
  speed?: number;
  emberAmount?: number;
  scale?: number;
  /** Stärke der lokalen Pointer-Wärmeblase. 0 deaktiviert die Reaktion. */
  pointerHeat?: number;
  /** Film-Grain gegen Shader-Banding. */
  grain?: number;
  /** Obergrenze für die WebGL-Pixeldichte. */
  dprCap?: number;
}

const FRAG = `${GLSL_NOISE}
uniform float u_intensity;
uniform float u_speed;
uniform float u_ember;
uniform float u_scale;
uniform float u_pointerHeat;
uniform float u_grain;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = uv * vec2(aspect, 1.0) * u_scale;
  float t = u_time * 0.05 * u_speed;

  // Zwei gegenläufige Warp-Felder erzeugen weichere, weniger repetitiv lesbare
  // Strömung als ein einzelner linear verschobener fbm-Pass.
  vec2 warpA = vec2(
    fbm(p * 0.92 + vec2(t, -t * 0.64)),
    fbm(p * 0.88 + vec2(-t * 0.55, t * 0.82))
  );
  vec2 warpB = vec2(
    fbm(p * 1.55 - warpA * 0.72 + vec2(-t * 0.35, t * 0.22)),
    fbm(p * 1.32 + warpA * 0.58 + vec2(t * 0.18, -t * 0.44))
  );

  float broad = fbm(p * 0.78 + warpA * 1.15 + vec2(0.0, -t * 0.7));
  float detail = fbm(p * 1.72 + warpA * 1.25 + warpB * 0.68 + vec2(0.0, -t * 1.08));
  float fog = mix(broad, detail, 0.62);
  fog = smoothstep(0.26, 0.92, fog);

  // Dichte nach unten, aber ohne harte horizontale Kante.
  float depth = smoothstep(1.08, -0.08, uv.y);
  float floorDensity = mix(0.72, 1.12, depth);
  fog *= floorDensity;

  // Pointer-Wärme: weich, begrenzt und als Modulation statt als separater Orb.
  vec2 ptr = u_pointer * vec2(aspect, 1.0) * u_scale;
  float pointerDist = length(p - ptr);
  float heat = exp(-pointerDist * 2.25) * 0.42 * u_pointerHeat;
  float heatTexture = mix(0.55, 1.0, detail);

  vec3 base = vec3(0.025, 0.026, 0.032);
  vec3 coolFog = vec3(0.080, 0.086, 0.105);
  vec3 warmFog = vec3(0.145, 0.105, 0.090);
  vec3 fogCol = mix(coolFog, warmFog, depth * (0.36 + u_ember * 0.34));
  vec3 ember = vec3(0.78, 0.16, 0.13) * u_ember;
  vec3 gold = vec3(0.88, 0.61, 0.22) * u_ember;

  vec3 col = base;
  col += fogCol * fog * u_intensity;
  col += ember * fog * fog * depth * 0.42 * u_intensity;
  col += gold * heat * heatTexture * (0.34 + fog * 0.78);

  // Kleine Glutadern nur in dichten, tiefen Falten — weniger "rote Fläche",
  // mehr punktuelle Materialtiefe.
  float cores = smoothstep(0.72, 0.96, detail) * smoothstep(0.48, 0.98, fog) * depth;
  col += vec3(1.0, 0.34, 0.12) * cores * 0.22 * u_ember;

  // Text-Safe-Zone + Kantenkontrolle: Hintergrund bleibt atmosphärisch statt
  // an allen vier Seiten gleich laut zu sein.
  vec2 centered = uv - 0.5;
  float vignette = smoothstep(0.82, 0.18, dot(centered, centered));
  col *= mix(0.78, 1.0, vignette);

  // Grain gegen Banding; im statischen Reduced-Motion-Frame bleibt es stabil,
  // weil u_time dort eingefroren ist.
  float noise = hash21(gl_FragCoord.xy + floor(u_time * 24.0));
  col += (noise - 0.5) * 0.018 * u_grain;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function NoiseFogField({
  intensity = 0.9,
  speed = 1,
  emberAmount = 0.8,
  scale = 2.2,
  pointerHeat = 1,
  grain = 1,
  dprCap = 1.5,
}: NoiseFogFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef, '160px');
  const ptrProxy = useRef({ x: 0.5, y: 0.5 });

  // Pointer bleibt außerhalb von React-State, damit Pointer-Moves keinen
  // Component-Render auslösen. Der Shader liest die mutable Ref pro Frame.
  ptrProxy.current.x = clamp(pointer.current.tx, 0, 1);
  ptrProxy.current.y = clamp(pointer.current.ty, 0, 1);

  const safeIntensity = clamp(Number.isFinite(intensity) ? intensity : 0.9, 0, 1.6);
  const safeSpeed = clamp(Number.isFinite(speed) ? speed : 1, 0, 4);
  const safeEmber = clamp(Number.isFinite(emberAmount) ? emberAmount : 0.8, 0, 1.25);
  const safeScale = clamp(Number.isFinite(scale) ? scale : 2.2, 0.75, 6);
  const safePointerHeat = clamp(Number.isFinite(pointerHeat) ? pointerHeat : 1, 0, 1.5);
  const safeGrain = clamp(Number.isFinite(grain) ? grain : 1, 0, 2);
  const safeDpr = clamp(Number.isFinite(dprCap) ? dprCap : 1.5, 1, 2);

  useShaderQuad(canvasRef, {
    fragment: FRAG,
    running: !reduced && inView,
    frozenTime: 6,
    pointerRef: ptrProxy,
    dprCap: safeDpr,
    uniforms: {
      u_intensity: safeIntensity,
      u_speed: safeSpeed,
      u_ember: safeEmber,
      u_scale: safeScale,
      u_pointerHeat: safePointerHeat,
      u_grain: safeGrain,
    },
  });

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#07080a',
        pointerEvents: 'none',
        contain: 'layout paint size',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}

export default NoiseFogField;
