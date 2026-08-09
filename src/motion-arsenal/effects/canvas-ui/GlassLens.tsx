import { useEffect, useRef, useState } from 'react';
import { clamp, damp, useInView, usePointer, usePrefersReducedMotion, useRafLoop } from '../../lib/animationUtils';
import { useShaderQuad } from '../../lib/canvasUtils';
import { NOX_COLORS } from '../../lib/motionPresets';
import { driftPointer, useHoverCapable } from '../cursor/cursorShared';

// ---------------------------------------------------------------------------
// GlassLens — a focused refraction mechanic inspired by a thick optical lens.
// The production variant keeps the procedural dashboard self-contained instead
// of relying on browser-flagged DOM-to-canvas capture APIs. The lens uses a
// spherical normal for Fresnel/specular response and pushes dispersion toward
// the rim, where real glass separates wavelengths most visibly.
// ---------------------------------------------------------------------------

export interface GlassLensProps {
  lensRadius?: number; // 0.08..0.4 — lens size in uv units
  zoom?: number; // 1..4 — magnification at lens center
  chroma?: number; // 0..0.02 — controlled rim dispersion
}

const FRAGMENT = `
precision mediump float;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_lensRadius;
uniform float u_zoom;
uniform float u_chroma;

float grid(vec2 uv, float cell) {
  vec2 g = abs(fract(uv * cell) - 0.5);
  return 1.0 - smoothstep(0.0, 0.035, min(g.x, g.y));
}

vec3 dashboard(vec2 p) {
  vec3 col = vec3(0.035, 0.035, 0.04);
  vec2 cellCount = vec2(6.0, 4.0);
  vec2 cellUv = fract(p * cellCount);
  vec2 cellId = floor(p * cellCount);
  float card = step(0.06, cellUv.x) * step(cellUv.x, 0.94) * step(0.1, cellUv.y) * step(cellUv.y, 0.9);
  float seed = fract(sin(dot(cellId, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 warm = mix(vec3(0.79, 0.19, 0.12), vec3(0.83, 0.64, 0.29), step(0.5, seed));
  col = mix(col, warm * 0.4, card * (0.35 + 0.15 * seed));
  float bar = step(0.7, cellUv.y) * step(cellUv.y, 0.78) * step(0.16, cellUv.x) * step(cellUv.x, 0.16 + 0.5 * fract(seed * 7.0));
  col += vec3(0.94, 0.9, 0.83) * bar * card * 0.5;
  col += grid(p, 30.0) * 0.04;
  return col;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 aspectScale = vec2(aspect, 1.0);
  vec2 d = (uv - u_pointer) * aspectScale;
  float dist = length(d);
  float r = max(u_lensRadius, 0.0001);

  vec3 col = dashboard(uv);
  if (dist < r) {
    float t = clamp(dist / r, 0.0, 1.0);
    float normalZ = sqrt(max(0.0, 1.0 - t * t));
    vec2 radial = dist > 0.0001 ? d / dist : vec2(0.0);
    vec3 normal = normalize(vec3(d / r, normalZ));

    // Magnification relaxes continuously toward 1x at the physical rim.
    float zoomScale = mix(1.0 / u_zoom, 1.0, smoothstep(0.0, 1.0, t));
    // A small spherical bend keeps the material from reading like a flat zoom mask.
    float sphereBend = (1.0 - normalZ) * 0.035 * max(u_zoom - 1.0, 0.0);
    vec2 warpedLocal = d * zoomScale - radial * sphereBend * r;
    vec2 warped = u_pointer + warpedLocal / aspectScale;

    // Dispersion is deliberately quiet at the center and exact silhouette.
    // It peaks in the thick optical rim instead of producing RGB fringing everywhere.
    float dispersion = u_chroma * smoothstep(0.18, 0.82, t) * (1.0 - smoothstep(0.9, 1.0, t));
    vec2 spectralOffset = radial * dispersion / aspectScale;
    float rC = dashboard(warped + spectralOffset).r;
    float gC = dashboard(warped).g;
    float bC = dashboard(warped - spectralOffset).b;
    col = vec3(rC, gC, bC);

    // Spherical Fresnel + two controlled light responses create glass thickness.
    float fresnel = pow(1.0 - normalZ, 3.0);
    vec3 keyLight = normalize(vec3(-0.42, 0.62, 0.66));
    vec3 fillLight = normalize(vec3(0.58, -0.42, 0.70));
    float specular = pow(max(dot(normal, keyLight), 0.0), 34.0);
    float internalHighlight = pow(max(dot(normal, fillLight), 0.0), 18.0);
    float innerRim = smoothstep(0.66, 0.94, t) * (1.0 - smoothstep(0.94, 1.0, t));

    col *= 1.0 - 0.12 * smoothstep(0.76, 1.0, t);
    col += vec3(0.98, 0.9, 0.76) * (fresnel * 0.34 + specular * 0.34);
    col += vec3(0.52, 0.64, 0.78) * internalHighlight * 0.13;
    col += vec3(0.95, 0.79, 0.57) * innerRim * 0.18;
  } else {
    // Outside edge: thin reflected silhouette plus contact shadow, not a neon ring.
    float contact = (1.0 - smoothstep(r, r + 0.045, dist)) * smoothstep(r, r + 0.006, dist);
    float outerRim = 1.0 - smoothstep(r, r + 0.014, dist);
    col *= 1.0 - contact * 0.18;
    col += vec3(0.86, 0.49, 0.31) * outerRim * 0.22;
  }

  col *= 1.0 - 0.4 * smoothstep(0.4, 1.1, distance(uv, vec2(0.5)));
  gl_FragColor = vec4(col, 1.0);
}
`;

export function GlassLens({ lensRadius = 0.16, zoom = 2.2, chroma = 0.006 }: GlassLensProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer(rootRef);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(rootRef, '80px');
  const hoverCapable = useHoverCapable();
  const [active, setActive] = useState(false);
  const [configRefresh, setConfigRefresh] = useState(false);
  const dampedPtr = useRef({ x: 0.5, y: 0.5 });

  const safeLensRadius = clamp(lensRadius, 0.08, 0.4);
  const safeZoom = clamp(zoom, 1, 4);
  const safeChroma = clamp(chroma, 0, 0.02);
  const pointerRunning = !reduced && inView && (!hoverCapable || active);
  // Paused shaders still need to repaint when their production props change.
  // A short refresh window lets useShaderQuad consume the latest uniforms, then
  // returns to a static frame instead of leaving a permanent idle rAF running.
  const shaderRunning = inView && (pointerRunning || configRefresh);

  const resetLens = () => {
    pointer.current.tx = 0.5;
    pointer.current.ty = 0.5;
    pointer.current.inside = false;
    dampedPtr.current.x = 0.5;
    dampedPtr.current.y = 0.5;
  };

  useEffect(() => {
    if (!inView) return;
    setConfigRefresh(true);
    const timeout = window.setTimeout(() => setConfigRefresh(false), 96);
    return () => window.clearTimeout(timeout);
  }, [safeLensRadius, safeZoom, safeChroma, inView]);

  useEffect(() => {
    if (inView) return;
    resetLens();
    setActive(false);
    setConfigRefresh(false);
  }, [inView]);

  useRafLoop((dt, elapsed) => {
    const p = pointer.current;
    if (!hoverCapable) driftPointer(p, elapsed);
    dampedPtr.current.x = damp(dampedPtr.current.x, p.inside ? p.tx : 0.5, 12, dt);
    dampedPtr.current.y = damp(dampedPtr.current.y, p.inside ? p.ty : 0.5, 12, dt);
  }, pointerRunning);

  useShaderQuad(canvasRef, {
    fragment: FRAGMENT,
    running: shaderRunning,
    frozenTime: 3,
    pointerRef: dampedPtr,
    dprCap: 1.25,
    uniforms: { u_lensRadius: safeLensRadius, u_zoom: safeZoom, u_chroma: safeChroma },
  });

  const runtimeLabel = reduced ? 'FROZEN' : !inView ? 'PAUSED' : hoverCapable ? (active ? 'TRACK' : 'IDLE') : 'DRIFT';

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-lens-runtime={runtimeLabel.toLowerCase()}
      onPointerEnter={() => {
        if (hoverCapable && inView && !reduced) setActive(true);
      }}
      onPointerLeave={() => {
        if (!hoverCapable) return;
        resetLens();
        setActive(false);
      }}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: NOX_COLORS.bg,
        touchAction: 'pan-y',
        contain: 'layout paint style',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          maxWidth: 'calc(100% - 32px)',
          fontFamily: 'var(--mono, monospace)',
          fontSize: 10,
          letterSpacing: '0.32em',
          color: NOX_COLORS.textDim,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        GLASS LENS // {runtimeLabel}
      </div>
    </div>
  );
}

export default GlassLens;
