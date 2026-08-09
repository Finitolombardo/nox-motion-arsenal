import{r as o,t as f,u as d,z as p,j as e,G as v}from"./index-Mu6UxQSY.js";const m=`${v}
uniform float u_intensity;
uniform float u_speed;
uniform float u_ember;
uniform float u_scale;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * vec2(u_resolution.x / u_resolution.y, 1.0) * u_scale;
  float t = u_time * 0.05 * u_speed;

  // Doppel-fbm: Feld wird von einem zweiten fbm verschoben (Domain Warp) —
  // dieselbe Rezeptur wie die Distortion-Pässe der Referenzen.
  vec2 warp = vec2(fbm(p + vec2(t, -t * 0.7)), fbm(p + vec2(-t * 0.6, t)));
  float fog = fbm(p * 1.6 + warp * 1.8 + vec2(0.0, -t * 1.2));
  fog = smoothstep(0.28, 0.95, fog);

  // Pointer-Wärmeblase
  vec2 ptr = u_pointer * vec2(u_resolution.x / u_resolution.y, 1.0) * u_scale;
  float heat = exp(-length(p - ptr) * 2.2) * 0.5;

  // Tiefe: unten dichter + glühender
  float depth = smoothstep(1.0, 0.0, uv.y);

  vec3 base = vec3(0.039, 0.039, 0.043);
  vec3 fogCol = mix(vec3(0.10, 0.10, 0.12), vec3(0.16, 0.13, 0.12), depth);
  vec3 ember = vec3(0.79, 0.19, 0.19) * u_ember;
  vec3 gold = vec3(0.83, 0.64, 0.29) * u_ember;

  vec3 col = base;
  col += fogCol * fog * u_intensity;
  col += ember * fog * depth * 0.55;
  col += gold * heat * (0.4 + fog);
  // Glut-Kerne in den dichtesten Nebelfalten
  float cores = smoothstep(0.82, 1.0, fog) * depth;
  col += vec3(1.0, 0.42, 0.2) * cores * 0.35 * u_ember;

  // Grain (Blue-Noise-Ersatz) gegen Banding — KRANK nutzt getBlueNoise
  col += (hash21(gl_FragCoord.xy + u_time) - 0.5) * 0.02;

  gl_FragColor = vec4(col, 1.0);
}
`;function h({intensity:i=.9,speed:l=1,emberAmount:c=.8,scale:u=2.2}){const n=o.useRef(null),r=o.useRef(null),s=f(r),a=d(),t=o.useRef({x:.5,y:.5});return t.current.x=s.current.tx,t.current.y=s.current.ty,p(n,{fragment:m,running:!a,frozenTime:6,pointerRef:t,uniforms:{u_intensity:i,u_speed:l,u_ember:c,u_scale:u}}),e.jsxs("div",{ref:r,style:{position:"absolute",inset:0,overflow:"hidden",background:"#0a0a0b"},children:[e.jsx("canvas",{ref:n,style:{position:"absolute",inset:0,width:"100%",height:"100%"}}),e.jsx("div",{style:{position:"absolute",inset:0,display:"grid",placeItems:"center",pointerEvents:"none"},children:e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontFamily:"var(--mono, monospace)",fontSize:10,letterSpacing:"0.35em",color:"#8a8781"},children:"ATMOSPHERE PASS"}),e.jsx("div",{style:{fontSize:"clamp(26px, 4.5vw, 48px)",fontWeight:750,color:"#f0ece4"},children:"NOISE FOG FIELD"})]})})]})}export{h as NoiseFogField,h as default};
