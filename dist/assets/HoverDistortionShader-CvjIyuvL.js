import{r,t as g,u as h,v as _,x as c,z as y,G as b,j as o}from"./index-Mu6UxQSY.js";import{N as i}from"./motionPresets-DdDKkMP6.js";import{u as R,d as S}from"./cursorShared-rfFIOmTJ.js";const N=`${b}
uniform float u_strength;
uniform float u_radius;
uniform float u_scale;
uniform float u_pattern;

// Scalar potential — same sampling vocabulary as KRANK: noisePos = vec3(uv*2, time*0.5).
float psi(vec2 p) {
  return fbm(p * 2.0 + vec2(u_time * 0.5, -u_time * 0.35));
}

// Numeric curl of the potential: divergence-free 2D flow from fbm differences.
vec2 curlField(vec2 p) {
  float e = 0.02;
  float dPdy = psi(p + vec2(0.0, e)) - psi(p - vec2(0.0, e));
  float dPdx = psi(p + vec2(e, 0.0)) - psi(p - vec2(e, 0.0));
  return vec2(dPdy, -dPdx) / (2.0 * e);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 m = vec2(u_pointer.x * aspect, u_pointer.y);

  float d = distance(p, m);
  float fall = smoothstep(u_radius, u_radius * 0.1, d);

  // KRANK mechanic: uv += curl.xy * strength (scoped to the pointer zone).
  vec2 curl = curlField(p);
  vec2 duv = uv + curl * u_strength * fall;

  // Procedural pattern: grid lines vs. diagonal stripes.
  vec2 g = duv * u_scale;
  g.x *= aspect;
  vec2 cell = abs(fract(g) - 0.5);
  float gridLine = smoothstep(0.44, 0.5, max(cell.x, cell.y));
  float stripes = smoothstep(0.35, 0.65, 0.5 + 0.5 * sin((g.x + g.y) * 3.14159));
  float pat = mix(gridLine, stripes, u_pattern);

  // NOX palette: dim bone lines on near-black, ember heat inside the field.
  vec3 bg = vec3(0.039, 0.039, 0.043);
  vec3 lineCol = mix(vec3(0.29, 0.28, 0.27), vec3(0.86, 0.24, 0.2), fall);
  vec3 col = bg + lineCol * pat * (0.5 + 0.5 * fall);

  // Heat shimmer + soft core glow where the field is strongest.
  float shimmer = fbm(duv * 6.0 + u_time * 0.4);
  col += vec3(0.79, 0.19, 0.12) * fall * shimmer * 0.35;
  col += vec3(0.83, 0.64, 0.29) * smoothstep(u_radius * 0.35, 0.0, d) * 0.22;

  // Vignette.
  col *= 1.0 - 0.45 * smoothstep(0.45, 1.1, distance(uv, vec2(0.5)));

  gl_FragColor = vec4(col, 1.0);
}
`;function j({strength:u=.18,radius:d=.42,patternScale:p=12,pattern:f="grid"}){const n=r.useRef(null),a=r.useRef(null),m=g(n),s=h(),v=R(),e=r.useRef({x:.5,y:.5});return _((l,x)=>{const t=m.current;v||S(t,x),e.current.x=c(e.current.x,t.inside?t.tx:.5,10,l),e.current.y=c(e.current.y,t.inside?t.ty:.5,10,l)},!s),y(a,{fragment:N,running:!s,frozenTime:5,pointerRef:e,uniforms:{u_strength:u,u_radius:d,u_scale:p,u_pattern:f==="stripes"?1:0}}),o.jsxs("div",{ref:n,style:{position:"absolute",inset:0,overflow:"hidden",background:i.bg,touchAction:"none"},children:[o.jsx("canvas",{ref:a,style:{position:"absolute",inset:0,width:"100%",height:"100%",display:"block"}}),o.jsxs("div",{style:{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",mixBlendMode:"screen"},children:[o.jsxs("div",{style:{fontFamily:"var(--mono, monospace)",fontSize:10,letterSpacing:"0.42em",color:i.textDim},children:["CURL FIELD // ",s?"FROZEN":"LIVE"]}),o.jsx("div",{style:{fontSize:"clamp(24px, 5.5cqw, 52px)",fontWeight:800,letterSpacing:"-0.02em",color:i.text},children:"DISTORTION"})]})]})}export{j as HoverDistortionShader,j as default};
