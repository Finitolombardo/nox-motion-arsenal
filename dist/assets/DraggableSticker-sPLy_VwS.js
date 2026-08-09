import{R as j,r as l,j as X}from"./index-Mu6UxQSY.js";const pe="https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/3fb4a247-64e9-4c54-2391-86598eebfe00/w=800",ie=2,Te=20,ve=32,xe=1e3;let le=xe;function Re(){return le+=1,le}const Ee=3,Se=.05,Ae=.05,Me=.035,be=1.92,_e=.15,Le=.88,ye=`
attribute vec2 aPos;
attribute vec2 aUV;
uniform float uPeel;
uniform float uLift;
uniform float uPeelAngle;
uniform float uPasting;
uniform float uScale;
uniform float uElevation;
varying vec2 vUV;
varying float vHi;
varying float vSh;

void main() {
    vUV = aUV;
    vec2 p = aPos;
    vHi = 0.0;
    vSh = 0.0;

    if (uPeel > 0.0) {
        vec2 peelAxis = vec2(cos(uPeelAngle), sin(uPeelAngle));
        vec2 uvCentered = aUV - vec2(0.5);
        float proj = dot(uvCentered, peelAxis);
        float diag = 0.5 - proj;

        float peelLine = -0.3 + uPeel * 2.0;

        float rampWidth = 0.6;
        float lifted = smoothstep(peelLine - rampWidth, peelLine, diag);
        lifted = 1.0 - lifted;

        float scale = 1.0 + lifted * uElevation;
        p *= scale;

        float inRamp = smoothstep(peelLine - rampWidth, peelLine - rampWidth * 0.5, diag) *
                       smoothstep(peelLine + 0.05, peelLine - rampWidth * 0.3, diag);

        float curveAmount = uPasting > 0.5 ? 0.06 : 0.12;
        p += (-peelAxis) * inRamp * curveAmount;

        float t = smoothstep(peelLine - rampWidth, peelLine, diag);
        vHi = inRamp * 0.75 * pow(1.0 - t, 1.2);
        vSh = inRamp * 0.75 * pow(t, 1.2);
    }

    gl_Position = vec4(p * uScale, 0.0, 1.0);
}
`,Xe=`
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uTilt;
uniform float uSheenStrength;
uniform float uSheenTiltShift;
uniform float uSheenTiltDeadzone;
uniform float uMaxTiltDeg;
uniform float uHoloMode;
uniform float uHoloMotion;
uniform vec3 uSheenColor;
varying vec2 vUV;
varying float vHi;
varying float vSh;

vec3 overlayBlend(vec3 base, vec3 blend) {
    return mix(2.0 * base * blend, 1.0 - 2.0 * (1.0 - base) * (1.0 - blend), step(0.5, base));
}

vec3 hsl2rgb(float h, float s, float l) {
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c * 0.5;
    vec3 rgb;
    if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
    else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    return rgb + m;
}

void main() {
    vec4 tex = texture2D(uTex, vUV);
    if (tex.a < 0.01) discard;

    vec3 c = tex.rgb * 0.95;

    float maxTilt = max(0.001, uMaxTiltDeg);
    float tiltMag = clamp(length(uTilt) / maxTilt, 0.0, 1.0);
    float tiltGate = smoothstep(uSheenTiltDeadzone, 1.0, tiltMag);

    float gradient = fract(vUV.x * 0.5 + vUV.y * 0.5 + uTilt.x * uSheenTiltShift + uTilt.y * uSheenTiltShift);

    if (uHoloMode > 0.5) {
        float holoStrength = uSheenStrength * uHoloMotion;
        float distFromWhite = length(tex.rgb - vec3(1.0));
        float nonWhiteMask = smoothstep(0.06, 0.22, distFromWhite);
        vec3 rainbow = hsl2rgb(gradient, 0.8, 0.55);
        c = mix(c, rainbow, holoStrength * nonWhiteMask * tex.a);
    } else {
        float effectStrength = uSheenStrength * tiltGate;
        float sheen = smoothstep(0.2, 0.5, gradient) * (1.0 - smoothstep(0.5, 0.8, gradient));
        c = mix(c, uSheenColor, sheen * effectStrength * tex.a);
    }

    float hiW = clamp(vHi, 0.0, 1.0) * 0.55;
    float shW = clamp(vSh, 0.0, 1.0) * 0.60;

    vec3 hi = overlayBlend(c, vec3(1.0));
    c = mix(c, hi, hiW);

    vec3 sh = overlayBlend(c, vec3(0.0));
    c = mix(c, sh, shW);
    c *= (1.0 - shW * 0.35);

    c = clamp(c, 0.0, 1.0);
    gl_FragColor = vec4(c, tex.a);
}
`;function Ue(f){if(!f)return[1,1,1];const s=f.trim(),h=s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);if(h)return[+h[1]/255,+h[2]/255,+h[3]/255];let T=s.replace(/^#/,"");return T.length===3&&(T=T.split("").map(p=>p+p).join("")),T.length>=6?[parseInt(T.slice(0,2),16)/255,parseInt(T.slice(2,4),16)/255,parseInt(T.slice(4,6),16)/255]:[1,1,1]}const we="0px 1px 2px 0px rgba(0, 0, 0, 0.30)",De="0px 13px 14px 0px rgba(0, 0, 0, 0.30)",Ye=.3;function ae(f){const s={x:0,y:0,blur:0,color:"rgba(0,0,0,0.3)"};if(!f)return s;const h=f.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|\b[a-z]+\b(?=\s*$))/i);h&&(s.color=h[0]);const T=f.match(/-?\d+(\.\d+)?(px)?/g);if(T){const p=T.map(y=>parseFloat(y));p.length>=1&&(s.x=p[0]),p.length>=2&&(s.y=p[1]),p.length>=3&&(s.blur=p[2])}return s}function Ie(f,s,h){const T=f.x+(s.x-f.x)*h,p=f.y+(s.y-f.y)*h,y=f.blur+(s.blur-f.blur)*h,W=h>.5?s.color:f.color;return`drop-shadow(${T.toFixed(2)}px ${p.toFixed(2)}px ${y.toFixed(2)}px ${W})`}function Fe({image:f,imageWidth:s=600,imageHeight:h=400,tilt:T=45,tiltSmoothing:p=Se,lighting:y=!0,lightingStrength:W=10,lightingColor:z="#ffffff",sheenMode:S="sheen",elevation:ce=10,staticShadow:Z=we,dynamicShadow:q=De,style:se}){const $=Ee,E=Math.max(1,T),K=y?Math.max(1,Math.min(10,W))/10:0,U=j.useMemo(()=>Ue(z),[z]),w=Math.max(1,Math.min(10,ce))/10*Ye,D=l.useRef(null),Y=l.useRef(null),I=l.useRef(null),P=l.useRef(null),[F,ue]=l.useState({width:400,height:400}),O=l.useRef(null),G=l.useRef(null),A=l.useRef(null),C=l.useRef(null),N=l.useRef(null),Q=l.useRef(0),v=l.useRef({x:0,y:0,width:200,height:200,imageAspectRatio:null,scale:1,held:!1,peeling:!1,sticking:!1,dragStartX:0,dragStartY:0,dragOrigX:0,dragOrigY:0,peel:0,lift:0,peelAngle:-Math.PI/4,dragTiltX:0,dragTiltY:0,currentTiltX:0,currentTiltY:0,prevTiltX:0,prevTiltY:0,holoMotion:0,lastMoveX:0,lastMoveY:0,lastMoveT:0,texReady:!1}),M=l.useRef(null),b=l.useRef(null),B=l.useCallback(()=>{const t=O.current,e=G.current,r=A.current,n=v.current;if(!t||!e||!r||!n.texReady)return;t.viewport(0,0,t.canvas.width,t.canvas.height),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),t.useProgram(e),t.bindBuffer(t.ARRAY_BUFFER,C.current),t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,N.current);const o=t.getAttribLocation(e,"aPos"),i=t.getAttribLocation(e,"aUV");t.enableVertexAttribArray(o),t.enableVertexAttribArray(i),t.vertexAttribPointer(o,2,t.FLOAT,!1,16,0),t.vertexAttribPointer(i,2,t.FLOAT,!1,16,8),t.uniform1f(t.getUniformLocation(e,"uPeel"),n.peel),t.uniform1f(t.getUniformLocation(e,"uLift"),n.lift),t.uniform1f(t.getUniformLocation(e,"uPeelAngle"),n.peelAngle),t.uniform1f(t.getUniformLocation(e,"uPasting"),n.sticking?1:0),t.uniform1f(t.getUniformLocation(e,"uScale"),n.scale),t.uniform1f(t.getUniformLocation(e,"uElevation"),w),t.uniform2f(t.getUniformLocation(e,"uTilt"),n.currentTiltX,n.currentTiltY),t.uniform1f(t.getUniformLocation(e,"uSheenStrength"),K),t.uniform3f(t.getUniformLocation(e,"uSheenColor"),U[0],U[1],U[2]),t.uniform1f(t.getUniformLocation(e,"uSheenTiltShift"),Ae),t.uniform1f(t.getUniformLocation(e,"uSheenTiltDeadzone"),Me),t.uniform1f(t.getUniformLocation(e,"uMaxTiltDeg"),E),t.uniform1f(t.getUniformLocation(e,"uHoloMode"),S==="holo"?1:0),t.uniform1f(t.getUniformLocation(e,"uHoloMotion"),n.holoMotion),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,r),t.uniform1i(t.getUniformLocation(e,"uTex"),0),t.drawElements(t.TRIANGLES,Q.current,t.UNSIGNED_SHORT,0)},[K,U,S,w,E]),J=j.useMemo(()=>ae(Z),[Z]),ee=j.useMemo(()=>ae(q),[q]),H=l.useCallback(()=>{const t=P.current,e=v.current;if(!t)return;const r=Math.max(e.lift,e.peel),n=r*r*(3-2*r);t.style.filter=Ie(J,ee,n)},[J,ee]),V=l.useCallback(t=>{const e=v.current;b.current===null&&(b.current=t);const r=Math.min((t-b.current)/1e3,.1);b.current=t;const n=be*r;let o=!1;e.peeling&&(e.peel<1||e.lift<1)&&(e.peel=Math.min(1,e.peel+n),e.lift=Math.min(1,e.lift+n),o=!0),e.sticking&&(e.peel>0||e.lift>0?(e.peel=Math.max(0,e.peel-n),e.lift=Math.max(0,e.lift-n),o=!0):e.sticking=!1);const i=S==="holo"&&e.holoMotion>.005;i&&(e.holoMotion*=Le,e.holoMotion<.005&&(e.holoMotion=0),o=!0),o&&H(),(o||e.held||i)&&B(),e.held||e.peeling||e.sticking||i?M.current=requestAnimationFrame(V):(M.current=null,b.current=null)},[B,H,S]),k=l.useCallback(()=>{M.current===null&&(b.current=null,M.current=requestAnimationFrame(V))},[V]);l.useEffect(()=>{const t=P.current;if(!t)return;const e=t.getContext("webgl",{alpha:!0,antialias:!0,premultipliedAlpha:!1});if(!e)return;O.current=e;const r=(c,m)=>{const u=e.createShader(m);return u?(e.shaderSource(u,c),e.compileShader(u),e.getShaderParameter(u,e.COMPILE_STATUS)?u:(console.error("Shader compile error:",e.getShaderInfoLog(u)),e.deleteShader(u),null)):null},n=r(ye,e.VERTEX_SHADER),o=r(Xe,e.FRAGMENT_SHADER);if(!n||!o)return;const i=e.createProgram();if(!i)return;if(e.attachShader(i,n),e.attachShader(i,o),e.linkProgram(i),!e.getProgramParameter(i,e.LINK_STATUS)){console.error("Program link error:",e.getProgramInfoLog(i));return}G.current=i;const a=ve,g=[],d=[];for(let c=0;c<=a;c++)for(let m=0;m<=a;m++)g.push(m/a*2-1,c/a*2-1,m/a,1-c/a);for(let c=0;c<a;c++)for(let m=0;m<a;m++){const u=c*(a+1)+m;d.push(u,u+1,u+a+1,u+1,u+a+2,u+a+1)}const x=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,x),e.bufferData(e.ARRAY_BUFFER,new Float32Array(g),e.STATIC_DRAW),C.current=x;const R=e.createBuffer();return e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,R),e.bufferData(e.ELEMENT_ARRAY_BUFFER,new Uint16Array(d),e.STATIC_DRAW),N.current=R,Q.current=d.length,e.viewport(0,0,t.width,t.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),()=>{M.current&&cancelAnimationFrame(M.current),e.deleteShader(n),e.deleteShader(o),e.deleteProgram(i),C.current&&e.deleteBuffer(C.current),N.current&&e.deleteBuffer(N.current),A.current&&e.deleteTexture(A.current)}},[]);const _=l.useCallback(()=>{const t=D.current,e=P.current,r=Y.current,n=O.current,o=v.current;if(!t||!e||!r||!n)return;const i=t.clientWidth||200,a=t.clientHeight||200,g=s>0?s:i,d=h>0?h:a,R=Math.max(g,d)*w*.6,c=Te+R,m=g+c*2,u=d+c*2,ge=g/m,de=d/u,me=Math.min(ge,de),re=(i-g)/2,oe=(a-d)/2;e.width=Math.round(m*ie),e.height=Math.round(u*ie),e.style.width=`${m}px`,e.style.height=`${u}px`,e.style.position="absolute",e.style.left=`${-c}px`,e.style.top=`${-c}px`,r.style.width=`${g}px`,r.style.height=`${d}px`,r.style.left=`${re}px`,r.style.top=`${oe}px`,o.width=g,o.height=d,o.x=re,o.y=oe,o.scale=me,n.viewport(0,0,e.width,e.height),o.texReady&&B()},[B,w,s,h]);l.useEffect(()=>{const t=f||pe,e=O.current;if(!e||!G.current)return;const r=new Image;return r.crossOrigin="anonymous",r.onload=()=>{const n=v.current;n.imageAspectRatio=r.width/r.height,A.current&&e.deleteTexture(A.current);const o=e.createTexture();o&&(e.bindTexture(e.TEXTURE_2D,o),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),A.current=o,n.texReady=!0,_(),H())},r.onerror=()=>console.error("Failed to load image"),r.src=t,()=>{v.current.texReady=!1}},[f,_,H]);const L=l.useRef(null),te=5,fe=180,ne=l.useCallback((t,e)=>{L.current&&clearTimeout(L.current),L.current=setTimeout(()=>{L.current=null,ue(r=>{const n=Math.max(1,Math.round(t))||r.width,o=Math.max(1,Math.round(e))||r.height,i=Math.abs(n-r.width),a=Math.abs(o-r.height);return i<te&&a<te?r:{width:n,height:o}}),_()},fe)},[_]);l.useEffect(()=>{const t=D.current;if(!t)return;_();const e=new ResizeObserver(()=>{const r=t.clientWidth||t.offsetWidth||400,n=t.clientHeight||t.offsetHeight||400;ne(r,n)});return e.observe(t),()=>{e.disconnect(),L.current&&clearTimeout(L.current)}},[_,ne]);const he=l.useCallback(t=>{t.preventDefault();const e=v.current,r=D.current,n=Y.current,o=I.current;if(!r||!n||!o)return;const i=n.getBoundingClientRect(),a=t.clientX-i.left,g=t.clientY-i.top;o.style.transformOrigin=`${a}px ${g}px`;const d=i.left+i.width/2,x=i.top+i.height/2,R=t.clientX-d,c=t.clientY-x;e.peelAngle=Math.atan2(c,R),e.dragStartX=t.clientX,e.dragStartY=t.clientY,e.dragOrigX=e.x,e.dragOrigY=e.y,e.peel=0,e.lift=0,e.held=!0,e.peeling=!0,e.sticking=!1,e.lastMoveX=t.clientX,e.lastMoveY=t.clientY,e.lastMoveT=performance.now(),r.style.zIndex=`${Re()}`,k()},[k]);return l.useEffect(()=>{const t=r=>{const n=v.current;if(!n.held)return;const o=Y.current,i=I.current;if(!o||!i)return;n.x=n.dragOrigX+(r.clientX-n.dragStartX),n.y=n.dragOrigY+(r.clientY-n.dragStartY),o.style.left=`${n.x}px`,o.style.top=`${n.y}px`;const a=performance.now(),g=Math.max(1,a-n.lastMoveT),d=(r.clientX-n.lastMoveX)/g*16,x=(r.clientY-n.lastMoveY)/g*16;n.lastMoveX=r.clientX,n.lastMoveY=r.clientY,n.lastMoveT=a;const R=Math.max(-E,Math.min(E,d*$)),c=Math.max(-E,Math.min(E,-x*$));if(n.dragTiltX+=(c-n.dragTiltX)*p,n.dragTiltY+=(R-n.dragTiltY)*p,n.currentTiltX=n.dragTiltX,n.currentTiltY=n.dragTiltY,S==="holo"){const m=Math.abs(n.dragTiltX-n.prevTiltX)+Math.abs(n.dragTiltY-n.prevTiltY);n.holoMotion=Math.min(1,n.holoMotion+m*_e),n.prevTiltX=n.dragTiltX,n.prevTiltY=n.dragTiltY}i.style.transform=`rotateX(${n.dragTiltX}deg) rotateY(${n.dragTiltY}deg)`},e=()=>{const r=v.current;if(!r.held)return;const n=I.current;if(r.held=!1,r.peeling=!1,r.sticking=!0,r.peel>=.95&&n){const i=n.getBoundingClientRect(),a=i.left+i.width/2,g=i.top+i.height/2,d=r.lastMoveX-a,x=r.lastMoveY-g;r.peelAngle=Math.atan2(-x,-d),r.peel=1}const o=()=>{r.dragTiltX*=.9,r.dragTiltY*=.9,r.currentTiltX=r.dragTiltX,r.currentTiltY=r.dragTiltY,n&&(n.style.transform=`rotateX(${r.dragTiltX}deg) rotateY(${r.dragTiltY}deg)`),Math.abs(r.dragTiltX)>.1||Math.abs(r.dragTiltY)>.1?requestAnimationFrame(o):(r.dragTiltX=0,r.dragTiltY=0,r.currentTiltX=0,r.currentTiltY=0,r.prevTiltX=0,r.prevTiltY=0,n&&(n.style.transform=""))};o(),k()};return window.addEventListener("mousemove",t),window.addEventListener("mouseup",e),()=>{window.removeEventListener("mousemove",t),window.removeEventListener("mouseup",e)}},[$,p,k,S,E]),X.jsxs("div",{ref:D,style:{position:"relative",width:"100%",height:"100%",overflow:"visible",perspective:"800px",...se},children:[X.jsx("div",{style:{position:"relative",width:F.width,height:F.height,minWidth:F.width,minHeight:F.height,opacity:0,pointerEvents:"none",userSelect:"none"}}),X.jsx("div",{ref:Y,style:{position:"absolute",width:"100%",height:"100%",cursor:"grab",userSelect:"none",perspective:"800px",transformStyle:"preserve-3d",willChange:"transform",overflow:"visible"},onMouseDown:he,children:X.jsx("div",{ref:I,style:{position:"absolute",width:"100%",height:"100%",transformStyle:"preserve-3d",overflow:"visible"},children:X.jsx("canvas",{ref:P,style:{display:"block",pointerEvents:"none",position:"absolute"}})})})]})}export{Fe as default};
