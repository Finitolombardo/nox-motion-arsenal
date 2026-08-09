import{r as b,u as F,j as v}from"./index-Mu6UxQSY.js";import{a1 as A,k as P,a3 as G,a4 as T,a5 as z,a6 as I,c as C,D as j,A as U,O}from"./three-D1GiBGg0.js";const B=`
precision mediump float;
attribute vec4 instanceRandom;
uniform float uTime;
uniform float uScale;
varying vec2 vUv;
varying vec4 vRandom;

void main() {
  vUv = uv;
  vRandom = instanceRandom;
  vec3 pos = position;

  // Extrahierte Referenz-Mechanik (Butterflies-CFpdR9tM.js:307-330):
  float flapSpeed = 4.0 + instanceRandom.y * 4.0;
  float flapAmp = 0.8 + instanceRandom.z * 0.5;
  float phase = instanceRandom.x * 6.28;
  float t = uTime;
  float wave = sin(t * flapSpeed + phase) * flapAmp;
  wave += sin(t * 2.1 + instanceRandom.w * 3.14) * 0.2;
  wave += sin(t * 0.37 + instanceRandom.z * 5.0) * 0.3;
  float asymmetry = 1.0 + sign(pos.x) * sin(t * 0.7 + instanceRandom.w * 6.28) * 0.08;

  // Flap: Flügel klappen um die Y-Achse (x-Anteil hebt sich)
  pos.y += abs(pos.x) * wave * 0.55 * asymmetry;
  pos.x *= 1.0 - abs(wave) * 0.22;
  pos *= uScale * (0.8 + instanceRandom.x * 0.4);

  vec4 worldPos = modelMatrix * instanceMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,k=`
precision mediump float;
uniform float uTime;
uniform float uGlowIntensity;
uniform vec3 uColor;
uniform vec3 uGlowColor;
varying vec2 vUv;
varying vec4 vRandom;

void main() {
  // Prozedurale Flügel-Textur (statt Original-Asset)
  float dCenter = length(vUv - 0.5);
  float wing = smoothstep(0.5, 0.42, dCenter);
  float vein = smoothstep(0.02, 0.0, abs(fract(vUv.x * 6.0 + vRandom.x) - 0.5) - 0.42);
  vec3 color = uColor * (0.65 + vRandom.y * 0.5) + vein * 0.15;

  // Extrahierte Referenz-Mechanik (Butterflies:355-389): Fresnel-Edge-Glow + Puls
  float edgeGlow = smoothstep(1.0, 0.0, length(vUv - 0.5)) * uGlowIntensity;
  float pulse = sin(uTime * 2.0 + vRandom.w * 6.28) * 0.5 + 0.5;
  color += uGlowColor * edgeGlow * 0.3 * pulse;
  color = pow(color, vec3(1.5));

  gl_FragColor = vec4(color, wing * 0.95);
  if (gl_FragColor.a < 0.02) discard;
}
`;function Y({count:p=48,glowIntensity:h=1.4,speed:w=1}){const R=b.useRef(null),c=F();return b.useEffect(()=>{const s=R.current;if(!s)return;const a=new A({antialias:!0,alpha:!0});a.setPixelRatio(Math.min(window.devicePixelRatio,1.5)),s.appendChild(a.domElement);const x=new P,l=new G(50,1,.1,100);l.position.z=11;const i=Math.max(8,Math.min(96,Math.round(p))),m=new T(1,.8,6,2),o=new Float32Array(i*4);for(let e=0;e<i*4;e++)o[e]=Math.abs(Math.sin(e*12.9898)*43758.5453)%1;m.setAttribute("instanceRandom",new z(o,4));const d=new I({vertexShader:B,fragmentShader:k,transparent:!0,side:j,depthWrite:!1,uniforms:{uTime:{value:0},uScale:{value:1},uGlowIntensity:{value:h},uColor:{value:new C("#8f4fd6")},uGlowColor:{value:new C("#39ff8b")}}}),u=new U(m,d,i),r=new O,g=[];for(let e=0;e<i;e++){const n={x:(o[e*4]-.5)*16,y:(o[e*4+1]-.5)*9,z:(o[e*4+2]-.5)*6,r:o[e*4+3]*Math.PI*2,s:.5+o[e*4+1]*.7,o:o[e*4+2]*Math.PI*2};g.push(n)}x.add(u);const M=()=>{const e=s.getBoundingClientRect();a.setSize(e.width,e.height,!1),l.aspect=e.width/Math.max(e.height,1),l.updateProjectionMatrix()};M();const y=new ResizeObserver(M);y.observe(s);let f=0;const E=performance.now(),S=()=>{const e=c?2.4:(performance.now()-E)/1e3*w;d.uniforms.uTime.value=e;for(let n=0;n<i;n++){const t=g[n];r.position.set(t.x+Math.sin(e*.3+t.o)*1.2,t.y+Math.sin(e*.22+t.o*2)*.9,t.z+Math.cos(e*.26+t.o)*.8),r.rotation.set(Math.sin(e*.2+t.o)*.3,t.r+e*.05,Math.cos(e*.17+t.o)*.2),r.scale.setScalar(t.s),r.updateMatrix(),u.setMatrixAt(n,r.matrix)}u.instanceMatrix.needsUpdate=!0,a.render(x,l),c||(f=requestAnimationFrame(S))};return f=requestAnimationFrame(S),()=>{cancelAnimationFrame(f),y.disconnect(),m.dispose(),d.dispose(),a.dispose(),s.removeChild(a.domElement)}},[p,h,w,c]),v.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",background:"radial-gradient(100% 100% at 50% 100%, #101018 0%, #070708 60%)"},children:[v.jsx("div",{ref:R,style:{position:"absolute",inset:0}}),v.jsx("div",{style:{position:"absolute",left:12,bottom:10,fontFamily:"var(--mono, monospace)",fontSize:9.5,letterSpacing:"0.25em",color:"#6a675f",pointerEvents:"none"},children:"REFERENCE STUDY · SHOPIFY BUTTERFLIES INSTANCING — DO NOT SHIP"})]})}export{Y as ReferenceShopifyButterflies,Y as default};
