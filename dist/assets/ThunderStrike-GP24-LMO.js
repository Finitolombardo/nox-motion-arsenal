import{r as x,j as C}from"./index-Mu6UxQSY.js";const q=t=>Math.max(0,Math.min(1,t)),Q=(t,o,n)=>t+(o-t)*n;function k(t){const o=Math.sin(t)*43758.5453123;return o-Math.floor(o)}function K(t,o){const n=Math.floor(t),f=t-n,e=f*f*(3-2*f);return Q(k(n+o*17.13),k(n+1+o*17.13),e)*2-1}function ae(t,o,n,f,e){const h=Math.max(24,Math.min(96,Math.round(t/18))),d=o*.5,R=[];for(let p=0;p<=h;p+=1){const g=p/h,i=g*t,a=K(g*3.2,e)*o*.24*f,M=K(g*11.5,e+3)*o*.1*n,P=K(g*27.3,e+7)*o*.04*n,m=Math.sin(Math.PI*g);R.push({x:i,y:d+(a+M+P)*m})}return R}function se({progress:t=0,direction:o="ltr",boltThickness:n=2.4,branchAmount:f=6,turbulence:e=1,glow:h=1,bloom:d=.85,flashIntensity:R=.7,revealSoftness:p=26,distortion:g=1,sparkAmount:i=24,colorStart:a="#ff3d6e",colorEnd:M="#ff8a4c",reducedMotionMode:P="static-line",seed:m=7,autoDemo:j=!1,className:U,style:N}){const H=x.useRef(null),b=x.useRef(null),[s,Z]=x.useState({w:0,h:0}),[$,Y]=x.useState(!1),[z,ee]=x.useState(!1),[te,re]=x.useState(0),y=q(j?te:t);x.useEffect(()=>{const c=window.matchMedia("(prefers-reduced-motion: reduce)"),l=()=>ee(c.matches);return l(),c.addEventListener("change",l),()=>c.removeEventListener("change",l)},[]),x.useEffect(()=>{const c=H.current;if(!c||typeof IntersectionObserver>"u"){Y(!0);return}const l=new IntersectionObserver(([r])=>Y(r.isIntersecting),{rootMargin:"15% 0px"});return l.observe(c),()=>l.disconnect()},[]),x.useEffect(()=>{const c=H.current;if(!c||typeof ResizeObserver>"u")return;const l=new ResizeObserver(([r])=>{const{width:I,height:S}=r.contentRect;Z(A=>A.w===I&&A.h===S?A:{w:I,h:S})});return l.observe(c),()=>l.disconnect()},[]),x.useEffect(()=>{if(!j||z||!$)return;let c=0,l=0;const r=I=>{l||(l=I);const S=(I-l)/2600;re(S>=1?1:S),S<1&&(c=requestAnimationFrame(r))};return c=requestAnimationFrame(r),()=>cancelAnimationFrame(c)},[j,z,$]);const W=s.w>0&&s.w<700,E=x.useMemo(()=>s.w>0&&s.h>0?ae(s.w,s.h,e,g,m):[],[s.w,s.h,e,g,m]),ne=x.useMemo(()=>{if(!E.length||!s.h)return"polygon(0 100%, 100% 100%, 100% 100%, 0 100%)";const c=(S,A)=>`${(S/A*100).toFixed(3)}%`,l=o==="ltr"?y:1-y,r=.09;return`polygon(${E.map((S,A)=>{const w=A/(E.length-1),_=o==="ltr"?w-l:l-w,L=q(_/r),u=L*L*(3-2*L);return`${c(S.x,s.w)} ${c(Q(S.y,s.h,u),s.h)}`}).join(",")}, 100% 100%, 0 100%)`},[E,y,o,s.w,s.h]);if(x.useEffect(()=>{const c=b.current;if(!c||z||!$||!E.length)return;const l=Math.min(2,window.devicePixelRatio||1);(c.width!==Math.round(s.w*l)||c.height!==Math.round(s.h*l))&&(c.width=Math.round(s.w*l),c.height=Math.round(s.h*l));const r=c.getContext("2d");if(!r||(r.setTransform(l,0,0,l,0,0),r.clearRect(0,0,s.w,s.h),y<=0))return;const I=Math.round(f*(W?.45:1)),S=d*(W?.55:1),A=o==="ltr"?y:1-y,w=E.filter((u,O)=>{const v=O/(E.length-1);return o==="ltr"?v<=A:v>=A});if(w.length<2)return;const _=r.createLinearGradient(0,0,s.w,0);_.addColorStop(0,a),_.addColorStop(1,M);const L=(u,O,v,V)=>{r.beginPath(),r.moveTo(u[0].x,u[0].y);for(let T=1;T<u.length;T+=1)r.lineTo(u[T].x,u[T].y);r.strokeStyle=_,r.globalAlpha=v,r.lineWidth=O,r.lineCap="round",r.lineJoin="round",r.shadowBlur=V,r.shadowColor=a,r.stroke()};r.globalCompositeOperation="lighter",L(w,n*9*S,.1*S,34*h),L(w,n*3.6,.26*h,20*h),L(w,n,.95,10*h);for(let u=0;u<I;u+=1){const O=Math.floor(k(u*3.7+m)*(w.length-2))+1,v=w[O];if(!v)continue;const V=k(u*9.1+m)>.5?-1:1,T=(14+k(u*5.3+m)*46)*e,F=3,X=[v];for(let B=1;B<=F;B+=1){const ie=B/F;X.push({x:v.x+(k(u*2.1+B+m)-.5)*T*1.6,y:v.y+V*T*ie+(k(u*4.4+B+m)-.5)*8*e})}const D=O/Math.max(1,w.length-1),G=q((y-D*y)*3);L(X,Math.max(.6,n*.45),.4*G*h,8*h)}if(y>.72&&i>0){const u=q((y-.72)/.28),O=Math.round(i*(W?.5:1));for(let v=0;v<O;v+=1){const V=k(v*1.7+m),T=Math.min(w.length-1,Math.floor(V*w.length)),F=w[T];if(!F)continue;const X=u*(18+k(v*6.1+m)*34),D=F.x+(k(v*2.9+m)-.5)*X*1.4,G=F.y+(k(v*8.3+m)-.5)*X,B=Math.max(.5,(1-u)*2.1+.4);r.globalAlpha=(1-u)*.8,r.shadowBlur=10*h,r.shadowColor=M,r.fillStyle=M,r.beginPath(),r.arc(D,G,B,0,Math.PI*2),r.fill()}}r.globalAlpha=1,r.shadowBlur=0,r.globalCompositeOperation="source-over"},[E,y,o,n,f,e,h,d,i,a,M,m,s.w,s.h,z,$,W]),z&&P==="hidden")return null;const oe={"--rift-progress":y,"--rift-soft":`${p}px`,"--rift-flash":R,"--rift-start":a,"--rift-end":M,"--rift-hero-fade":1-y};return C.jsxs("div",{ref:H,className:`nhr-root${U?` ${U}`:""}`,"data-reduced":z?P:void 0,"data-progress":y.toFixed(3),style:{...oe,...N},children:[C.jsx("style",{children:ce}),C.jsxs("div",{className:"nhr-hero","aria-hidden":"true",children:[C.jsx("span",{className:"nhr-hero-glow"}),C.jsx("span",{className:"nhr-hero-particles"})]}),C.jsx("div",{className:"nhr-cosmic","aria-hidden":"true",style:z?void 0:{clipPath:ne},children:C.jsx("span",{className:"nhr-stars"})}),!z&&C.jsx("canvas",{ref:b,className:"nhr-canvas","aria-hidden":"true"}),z&&P==="static-line"&&C.jsx("span",{className:"nhr-static-line","aria-hidden":"true"})]})}const ce=String.raw`
.nhr-root{position:relative;width:100%;height:100%;min-height:220px;overflow:hidden;isolation:isolate;background:#040306}
.nhr-hero,.nhr-cosmic{position:absolute;inset:0}
.nhr-hero{background:radial-gradient(120% 90% at 50% 0%,rgba(255,61,110,.16),rgba(8,4,10,0) 62%),linear-gradient(180deg,#120610,#06040a)}
.nhr-hero-glow{position:absolute;inset:0;background:radial-gradient(70% 46% at 50% 8%,color-mix(in srgb,var(--rift-start) 24%,transparent),transparent 70%);opacity:var(--rift-hero-fade,1);transition:opacity .25s linear}
/* Hero-Signal-Partikel blenden oberhalb der Kante aus. */
.nhr-hero-particles{position:absolute;inset:0;opacity:var(--rift-hero-fade,1);transition:opacity .25s linear;background-image:radial-gradient(circle,rgba(255,241,243,.7) 1px,transparent 1px),radial-gradient(circle,color-mix(in srgb,var(--rift-start) 70%,white) 1px,transparent 1px);background-size:120px 90px,190px 140px;background-position:0 0,60px 40px;mask-image:linear-gradient(180deg,#000 0%,#000 42%,transparent 62%)}
.nhr-cosmic{background:radial-gradient(90% 70% at 50% 100%,rgba(46,20,64,.55),#030206 70%)}
.nhr-stars{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.9) .9px,transparent 1px),radial-gradient(circle,rgba(190,205,255,.55) .8px,transparent 1px),radial-gradient(circle,color-mix(in srgb,var(--rift-end) 60%,white) .9px,transparent 1px);background-size:140px 110px,90px 70px,230px 180px;background-position:0 0,40px 30px,110px 70px}
.nhr-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
/* Flash ist ein weicher Kantensaum, kein Vollbild-Weiß. */
.nhr-root::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 40% at calc(var(--rift-progress,0) * 100%) 50%,color-mix(in srgb,var(--rift-start) 55%,transparent),transparent 62%);opacity:calc(var(--rift-flash,.7) * var(--rift-progress,0) * (1 - var(--rift-progress,0)) * 3.2);mix-blend-mode:screen;filter:blur(var(--rift-soft,26px))}
.nhr-static-line{position:absolute;left:0;right:0;top:50%;height:2px;background:linear-gradient(90deg,var(--rift-start),var(--rift-end));opacity:.8}
.nhr-root[data-reduced] .nhr-cosmic{opacity:var(--rift-progress,0);transition:opacity .3s linear}
.nhr-root[data-reduced] .nhr-hero{opacity:calc(1 - var(--rift-progress,0) * .85)}
.nhr-root[data-reduced]::after{display:none}
@media(prefers-reduced-motion:reduce){
  .nhr-hero-glow,.nhr-hero-particles,.nhr-cosmic{transition:none!important}
}
`;function J(t){const[o,n,f]=t.replace("rgb(","").replace(")","").split(",").map(i=>parseInt(i.trim())/255),e=Math.max(o,n,f),h=Math.min(o,n,f);let d=0;const R=e,p=e-h,g=e===0?0:p/e;if(e===h)d=0;else{switch(e){case o:d=(n-f)/p+(n<f?6:0);break;case n:d=(f-o)/p+2;break;case f:d=(o-n)/p+4;break}d*=60}return{h:d>=0?d:d+360,s:g,v:R}}function le(t){if(t.variant==="nox-horizon-rift"){const{variant:o,lightningColor:n,backgroundColor:f,xOffset:e,speed:h,intensity:d,size:R,angle:p,...g}=t;return C.jsx(se,{...g})}return C.jsx(fe,{...t})}function fe(t){const o=x.useRef(null);return x.useEffect(()=>{const n=o.current;if(!n)return;const f=()=>{n.width=n.clientWidth,n.height=n.clientHeight};f(),window.addEventListener("resize",f);const e=n.getContext("webgl");if(!e){console.error("WebGL not supported");return}let h=!1,d=0;const R=(N,H)=>{const b=e.createShader(H);return b?(e.shaderSource(b,N),e.compileShader(b),e.getShaderParameter(b,e.COMPILE_STATUS)?b:(console.error("Shader compile error:",e.getShaderInfoLog(b)),e.deleteShader(b),null)):null},p=R(ue,e.VERTEX_SHADER),g=R(he,e.FRAGMENT_SHADER);if(!p||!g)return;const i=e.createProgram();if(!i)return;if(e.attachShader(i,p),e.attachShader(i,g),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS)){console.error("Program linking error:",e.getProgramInfoLog(i));return}e.useProgram(i);const a={iResolution:e.getUniformLocation(i,"iResolution"),iTime:e.getUniformLocation(i,"iTime"),uHue:e.getUniformLocation(i,"uHue"),uBackgroundHsv:e.getUniformLocation(i,"uBackgroundHsv"),uXOffset:e.getUniformLocation(i,"uXOffset"),uSpeed:e.getUniformLocation(i,"uSpeed"),uIntensity:e.getUniformLocation(i,"uIntensity"),uSize:e.getUniformLocation(i,"uSize"),uAngle:e.getUniformLocation(i,"uAngle")},M=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),P=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,P),e.bufferData(e.ARRAY_BUFFER,M,e.STATIC_DRAW);const m=e.getAttribLocation(i,"aPosition");e.enableVertexAttribArray(m),e.vertexAttribPointer(m,2,e.FLOAT,!1,0,0);const j=performance.now(),U=()=>{if(h)return;f(),e.viewport(0,0,n.width,n.height),a.iResolution&&e.uniform2f(a.iResolution,n.width,n.height);const N=performance.now();a.iTime&&e.uniform1f(a.iTime,(N-j)/1e3);const H=J(t.lightningColor??"rgb(245, 114, 25)"),b=J(t.backgroundColor??"rgb(0, 0, 0)");a.uHue&&e.uniform1f(a.uHue,H.h),a.uBackgroundHsv&&e.uniform3f(a.uBackgroundHsv,b.h/360,b.s,b.v),a.uXOffset&&e.uniform1f(a.uXOffset,-(t.xOffset??1)/25),a.uSpeed&&e.uniform1f(a.uSpeed,(t.speed??55)/50),a.uIntensity&&e.uniform1f(a.uIntensity,(t.intensity??23)/50),a.uSize&&e.uniform1f(a.uSize,(t.size??50)*.03),a.uAngle&&e.uniform1f(a.uAngle,(t.angle??-27)*Math.PI/180),e.drawArrays(e.TRIANGLES,0,6),h||(d=requestAnimationFrame(U))};return U(),()=>{h=!0,window.removeEventListener("resize",f),d&&cancelAnimationFrame(d),P&&e.deleteBuffer(P),p&&e.deleteShader(p),g&&e.deleteShader(g),i&&e.deleteProgram(i)}},[t.lightningColor,t.backgroundColor,t.xOffset,t.speed,t.intensity,t.size,t.angle]),C.jsx("div",{style:{width:"100%",height:"100%",position:"relative"},children:C.jsx("canvas",{ref:o,style:{width:"100%",height:"100%",position:"relative",...t.style||{}}})})}const ue=`
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,he=`
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uHue;
uniform vec3 uBackgroundHsv;
uniform float uXOffset;
uniform float uSpeed;
uniform float uIntensity;
uniform float uSize;
uniform float uAngle;

#define OCTAVE_COUNT 10

vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

float hash11(float p) {
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

mat2 rotate2d(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat2(c, -s, s, c);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 fp = fract(p);
    float a = hash12(ip);
    float b = hash12(ip + vec2(1.0, 0.0));
    float c = hash12(ip + vec2(0.0, 1.0));
    float d = hash12(ip + vec2(1.0, 1.0));

    vec2 t = smoothstep(0.0, 1.0, fp);
    return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < OCTAVE_COUNT; ++i) {
        value += amplitude * noise(p);
        p *= rotate2d(0.45);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = 2.0 * uv - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    uv *= rotate2d(uAngle);
    uv.x += uXOffset;
    uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;

    float dist = abs(uv.x);
    vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
    vec3 bgColor = hsv2rgb(vec3(uBackgroundHsv.x, uBackgroundHsv.y, uBackgroundHsv.z));
    vec3 lightningEffect = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / dist, 1.0) * uIntensity;
    vec3 col = mix(bgColor, lightningEffect, lightningEffect.r);
    col = pow(col, vec3(1.0));
    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;le.defaultProps={lightningColor:"rgb(245, 114, 25)",backgroundColor:"rgb(0, 0, 0)",xOffset:1,speed:55,intensity:23,size:50,angle:-27};export{le as default};
