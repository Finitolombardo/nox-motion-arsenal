import{r as o,t as k,u as U,m as O,v as A,x as R,z as F,j as d,q as f}from"./index-Mu6UxQSY.js";import{N as b}from"./motionPresets-DdDKkMP6.js";import{u as P,d as I}from"./cursorShared-rfFIOmTJ.js";const T=`
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
`;function N({lensRadius:_=.16,zoom:C=2.2,chroma:S=.006}){const n=o.useRef(null),p=o.useRef(null),r=k(n),c=U(),e=O(n,"80px"),s=P(),[m,i]=o.useState(!1),[L,u]=o.useState(!1),t=o.useRef({x:.5,y:.5}),v=f(_,.08,.4),h=f(C,1,4),g=f(S,0,.02),x=!c&&e&&(!s||m),z=e&&(x||L),w=()=>{r.current.tx=.5,r.current.ty=.5,r.current.inside=!1,t.current.x=.5,t.current.y=.5};o.useEffect(()=>{if(!e)return;u(!0);const l=window.setTimeout(()=>u(!1),96);return()=>window.clearTimeout(l)},[v,h,g,e]),o.useEffect(()=>{e||(w(),i(!1),u(!1))},[e]),A((l,E)=>{const a=r.current;s||I(a,E),t.current.x=R(t.current.x,a.inside?a.tx:.5,12,l),t.current.y=R(t.current.y,a.inside?a.ty:.5,12,l)},x),F(p,{fragment:T,running:z,frozenTime:3,pointerRef:t,dprCap:1.25,uniforms:{u_lensRadius:v,u_zoom:h,u_chroma:g}});const y=c?"FROZEN":e?s?m?"TRACK":"IDLE":"DRIFT":"PAUSED";return d.jsxs("div",{ref:n,"aria-hidden":"true","data-lens-runtime":y.toLowerCase(),onPointerEnter:()=>{s&&e&&!c&&i(!0)},onPointerLeave:()=>{s&&(w(),i(!1))},style:{position:"absolute",inset:0,overflow:"hidden",background:b.bg,touchAction:"pan-y",contain:"layout paint style"},children:[d.jsx("canvas",{ref:p,style:{position:"absolute",inset:0,width:"100%",height:"100%",display:"block"}}),d.jsxs("div",{style:{position:"absolute",top:14,left:16,maxWidth:"calc(100% - 32px)",fontFamily:"var(--mono, monospace)",fontSize:10,letterSpacing:"0.32em",color:b.textDim,pointerEvents:"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:["GLASS LENS // ",y]})]})}export{N as GlassLens,N as default};
