import{r as I,j as $}from"./index-CfWFdp0n.js";function ee(t){if(!t)return[.4,.4,.4];const s=t.match(/rgba?\(([^)]+)\)/i);if(s){const n=s[1].split(",").map(c=>parseFloat(c));return[(n[0]||0)/255,(n[1]||0)/255,(n[2]||0)/255]}let f=t.replace("#","").trim();f.length===3&&(f=f.split("").map(n=>n+n).join(""));const u=parseInt(f.slice(0,2),16)/255,e=parseInt(f.slice(2,4),16)/255,l=parseInt(f.slice(4,6),16)/255;return[u||0,e||0,l||0]}const j=6e3,te=20,oe=30,re=128,ue=1024,d=`#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}`,ie=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_velocity;
uniform sampler2D u_source;
uniform vec2 u_texel;
uniform float u_dt;
uniform float u_dissipation;
uniform float u_outward;
out vec4 outColor;
void main() {
    vec2 coord = v_uv - u_dt * texture(u_velocity, v_uv).xy * u_texel;
    if (u_outward > 0.0) coord -= (v_uv - vec2(0.5)) * u_outward;
    outColor = u_dissipation * texture(u_source, coord);
}`,ne=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_target;
uniform vec2 u_point;
uniform vec3 u_color;
uniform float u_radius;
uniform float u_aspect;
uniform float u_radial;
out vec4 outColor;
void main() {
    vec2 p = v_uv - u_point;
    p.x *= u_aspect;
    float falloff = exp(-dot(p, p) / u_radius);
    vec3 splat = falloff * u_color;
    float plen = length(p);
    vec2 rdir = plen > 0.0001 ? p / plen : vec2(0.0);
    float rmag = length(u_color.xy) * 1.5;
    splat.xy += u_radial * rdir * falloff * rmag;
    vec3 base = texture(u_target, v_uv).xyz;
    outColor = vec4(base + splat, 1.0);
}`,ae=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_velocity;
uniform vec2 u_texel;
out vec4 outColor;
void main() {
    float L = texture(u_velocity, v_uv - vec2(u_texel.x, 0.0)).x;
    float R = texture(u_velocity, v_uv + vec2(u_texel.x, 0.0)).x;
    float B = texture(u_velocity, v_uv - vec2(0.0, u_texel.y)).y;
    float T = texture(u_velocity, v_uv + vec2(0.0, u_texel.y)).y;
    vec2 C = texture(u_velocity, v_uv).xy;
    if (v_uv.x < u_texel.x) L = -C.x;
    if (v_uv.x > 1.0 - u_texel.x) R = -C.x;
    if (v_uv.y < u_texel.y) B = -C.y;
    if (v_uv.y > 1.0 - u_texel.y) T = -C.y;
    outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,ce=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_velocity;
uniform vec2 u_texel;
out vec4 outColor;
void main() {
    float L = texture(u_velocity, v_uv - vec2(u_texel.x, 0.0)).y;
    float R = texture(u_velocity, v_uv + vec2(u_texel.x, 0.0)).y;
    float B = texture(u_velocity, v_uv - vec2(0.0, u_texel.y)).x;
    float T = texture(u_velocity, v_uv + vec2(0.0, u_texel.y)).x;
    outColor = vec4(R - L - T + B, 0.0, 0.0, 1.0);
}`,fe=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_velocity;
uniform sampler2D u_curl;
uniform vec2 u_texel;
uniform float u_curlStrength;
uniform float u_dt;
out vec4 outColor;
void main() {
    float L = texture(u_curl, v_uv - vec2(u_texel.x, 0.0)).x;
    float R = texture(u_curl, v_uv + vec2(u_texel.x, 0.0)).x;
    float B = texture(u_curl, v_uv - vec2(0.0, u_texel.y)).x;
    float T = texture(u_curl, v_uv + vec2(0.0, u_texel.y)).x;
    float C = texture(u_curl, v_uv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(L) - abs(R));
    force /= length(force) + 0.0001;
    force *= u_curlStrength * C;
    force.y *= -1.0;
    vec2 vel = texture(u_velocity, v_uv).xy;
    vel += force * u_dt;
    vel = clamp(vel, -1000.0, 1000.0);
    outColor = vec4(vel, 0.0, 1.0);
}`,se=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
uniform vec2 u_texel;
out vec4 outColor;
void main() {
    float L = texture(u_pressure, v_uv - vec2(u_texel.x, 0.0)).x;
    float R = texture(u_pressure, v_uv + vec2(u_texel.x, 0.0)).x;
    float B = texture(u_pressure, v_uv - vec2(0.0, u_texel.y)).x;
    float T = texture(u_pressure, v_uv + vec2(0.0, u_texel.y)).x;
    float d = texture(u_divergence, v_uv).x;
    outColor = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
}`,le=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_pressure;
uniform sampler2D u_velocity;
uniform vec2 u_texel;
out vec4 outColor;
void main() {
    float L = texture(u_pressure, v_uv - vec2(u_texel.x, 0.0)).x;
    float R = texture(u_pressure, v_uv + vec2(u_texel.x, 0.0)).x;
    float B = texture(u_pressure, v_uv - vec2(0.0, u_texel.y)).x;
    float T = texture(u_pressure, v_uv + vec2(0.0, u_texel.y)).x;
    vec2 v = texture(u_velocity, v_uv).xy;
    v -= 0.5 * vec2(R - L, T - B);
    outColor = vec4(v, 0.0, 1.0);
}`,ve=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
out vec4 outColor;
void main() {
    vec3 c = texture(u_tex, v_uv).rgb;
    float a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);
    outColor = vec4(c, a);
}`,_e=`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_value;
out vec4 outColor;
void main() {
    outColor = u_value * texture(u_tex, v_uv);
}`;function q(t,s,f){const u=t.createShader(s);return u?(t.shaderSource(u,f),t.compileShader(u),t.getShaderParameter(u,t.COMPILE_STATUS)?u:(console.error(t.getShaderInfoLog(u)),t.deleteShader(u),null)):null}function h(t,s,f){const u=q(t,t.VERTEX_SHADER,s),e=q(t,t.FRAGMENT_SHADER,f);if(!u||!e)return null;const l=t.createProgram();return l?(t.attachShader(l,u),t.attachShader(l,e),t.linkProgram(l),t.getProgramParameter(l,t.LINK_STATUS)?l:(console.error(t.getProgramInfoLog(l)),t.deleteProgram(l),null)):null}function w(t,s,f,u,e,l,n){const c=t.createTexture();t.bindTexture(t.TEXTURE_2D,c),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,n),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,n),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,u,s,f,0,e,l,null);const _=t.createFramebuffer();return t.bindFramebuffer(t.FRAMEBUFFER,_),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,c,0),t.viewport(0,0,s,f),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),{tex:c,fbo:_,w:s,h:f,texel:[1/s,1/f],attach(p){return t.activeTexture(t.TEXTURE0+p),t.bindTexture(t.TEXTURE_2D,c),p}}}function M(t,s,f,u,e,l,n){let c=w(t,s,f,u,e,l,n),_=w(t,s,f,u,e,l,n);return{get read(){return c},get write(){return _},swap(){const p=c;c=_,_=p},w:s,h:f,texel:c.texel}}function me(t){const s=I.useRef(null),f=I.useRef(t);return f.current=t,I.useEffect(()=>{const u=s.current;if(!u)return;const e=u.getContext("webgl2",{alpha:!0,depth:!1,stencil:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1});if(!e){console.warn("FluidTrail: WebGL2 unavailable");return}e.getExtension("EXT_color_buffer_float"),e.getExtension("OES_texture_float_linear");const l=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,l),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW);const n=h(e,d,ie),c=h(e,d,ne),_=h(e,d,ae),p=h(e,d,ce),E=h(e,d,fe),U=h(e,d,se),y=h(e,d,le),D=h(e,d,ve),S=h(e,d,_e),O=[n,c,_,p,E,U,y,D,S];for(const o of O){e.useProgram(o);const a=e.getAttribLocation(o,"a_pos");a>=0&&(e.enableVertexAttribArray(a),e.vertexAttribPointer(a,2,e.FLOAT,!1,0,0))}let i,x,R,P,b;function N(o){const a=u.clientWidth/Math.max(1,u.clientHeight),r=a>=1?Math.round(o*a):o,T=a>=1?o:Math.round(o/a);return{w:r,h:T}}function X(){const o=N(re),a=N(ue),r=e;i=M(r,o.w,o.h,r.RG16F,r.RG,r.HALF_FLOAT,r.LINEAR),x=M(r,a.w,a.h,r.RGBA16F,r.RGBA,r.HALF_FLOAT,r.LINEAR),R=M(r,o.w,o.h,r.R16F,r.RED,r.HALF_FLOAT,r.NEAREST),P=w(r,o.w,o.h,r.R16F,r.RED,r.HALF_FLOAT,r.NEAREST),b=w(r,o.w,o.h,r.R16F,r.RED,r.HALF_FLOAT,r.NEAREST)}function m(o){o?(e.bindFramebuffer(e.FRAMEBUFFER,o.fbo),e.viewport(0,0,o.w,o.h)):(e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,u.width,u.height)),e.drawArrays(e.TRIANGLE_STRIP,0,4)}function G(){const o=Math.min(window.devicePixelRatio||1,1.5),a=Math.max(1,Math.floor(u.clientWidth*o)),r=Math.max(1,Math.floor(u.clientHeight*o));(u.width!==a||u.height!==r)&&(u.width=a,u.height=r,X())}G(),X();const v={x:.5,y:.5,dx:0,dy:0,moved:!1};function z(o,a){const r=u.getBoundingClientRect(),T=(o-r.left)/r.width,L=1-(a-r.top)/r.height;v.dx=T-v.x,v.dy=L-v.y,v.x=T,v.y=L,v.moved=Math.abs(v.dx)>0||Math.abs(v.dy)>0}const H=o=>z(o.clientX,o.clientY);u.addEventListener("pointermove",H);const V=new ResizeObserver(()=>G());V.observe(u);function k(o,a){return a>1?o*a:o}function K(o,a,r,T,L){var A;const g=u.width/u.height,C=Math.max(1,((A=f.current)==null?void 0:A.mouseRadius)??8),F=k(C*.005/100,g);e.useProgram(c),e.uniform1i(e.getUniformLocation(c,"u_target"),i.read.attach(0)),e.uniform1f(e.getUniformLocation(c,"u_aspect"),g),e.uniform2f(e.getUniformLocation(c,"u_point"),o,a),e.uniform3f(e.getUniformLocation(c,"u_color"),r,T,0),e.uniform1f(e.getUniformLocation(c,"u_radius"),F),e.uniform1f(e.getUniformLocation(c,"u_radial"),1),m(i.write),i.swap(),e.useProgram(c),e.uniform1i(e.getUniformLocation(c,"u_target"),x.read.attach(0)),e.uniform1f(e.getUniformLocation(c,"u_aspect"),g),e.uniform2f(e.getUniformLocation(c,"u_point"),o,a),e.uniform3f(e.getUniformLocation(c,"u_color"),L[0],L[1],L[2]),e.uniform1f(e.getUniformLocation(c,"u_radius"),F),e.uniform1f(e.getUniformLocation(c,"u_radial"),0),m(x.write),x.swap()}function J(){var r;if(!v.moved)return;const o=ee(((r=f.current)==null?void 0:r.color)??"#66aaff"),a=[o[0]*.7,o[1]*.7,o[2]*.7];K(v.x,v.y,v.dx*j,v.dy*j,a),v.moved=!1}function Q(o){var C,F;e.useProgram(p),e.uniform2f(e.getUniformLocation(p,"u_texel"),i.texel[0],i.texel[1]),e.uniform1i(e.getUniformLocation(p,"u_velocity"),i.read.attach(0)),m(b),e.useProgram(E),e.uniform2f(e.getUniformLocation(E,"u_texel"),i.texel[0],i.texel[1]),e.uniform1i(e.getUniformLocation(E,"u_velocity"),i.read.attach(0)),e.uniform1i(e.getUniformLocation(E,"u_curl"),b.attach(1)),e.uniform1f(e.getUniformLocation(E,"u_curlStrength"),oe),e.uniform1f(e.getUniformLocation(E,"u_dt"),o),m(i.write),i.swap(),e.useProgram(_),e.uniform2f(e.getUniformLocation(_,"u_texel"),i.texel[0],i.texel[1]),e.uniform1i(e.getUniformLocation(_,"u_velocity"),i.read.attach(0)),m(P),e.useProgram(S),e.uniform1i(e.getUniformLocation(S,"u_tex"),R.read.attach(0)),e.uniform1f(e.getUniformLocation(S,"u_value"),.8),m(R.write),R.swap(),e.useProgram(U),e.uniform2f(e.getUniformLocation(U,"u_texel"),i.texel[0],i.texel[1]);const a=e.getUniformLocation(U,"u_divergence"),r=e.getUniformLocation(U,"u_pressure");e.uniform1i(a,P.attach(0));for(let A=0;A<te;A++)e.uniform1i(r,R.read.attach(1)),m(R.write),R.swap();e.useProgram(y),e.uniform2f(e.getUniformLocation(y,"u_texel"),i.texel[0],i.texel[1]),e.uniform1i(e.getUniformLocation(y,"u_pressure"),R.read.attach(0)),e.uniform1i(e.getUniformLocation(y,"u_velocity"),i.read.attach(1)),m(i.write),i.swap(),e.useProgram(n),e.uniform2f(e.getUniformLocation(n,"u_texel"),i.texel[0],i.texel[1]),e.uniform1i(e.getUniformLocation(n,"u_velocity"),i.read.attach(0)),e.uniform1i(e.getUniformLocation(n,"u_source"),i.read.attach(0)),e.uniform1f(e.getUniformLocation(n,"u_dt"),o),e.uniform1f(e.getUniformLocation(n,"u_dissipation"),1-.2*o),e.uniform1f(e.getUniformLocation(n,"u_outward"),0),m(i.write),i.swap(),e.useProgram(n),e.uniform2f(e.getUniformLocation(n,"u_texel"),x.texel[0],x.texel[1]),e.uniform1i(e.getUniformLocation(n,"u_velocity"),i.read.attach(0)),e.uniform1i(e.getUniformLocation(n,"u_source"),x.read.attach(1)),e.uniform1f(e.getUniformLocation(n,"u_dt"),o);const L=3/Math.max(.1,((C=f.current)==null?void 0:C.trailDuration)??5);e.uniform1f(e.getUniformLocation(n,"u_dissipation"),1-L*o);const g=((F=f.current)==null?void 0:F.fade)==="outside";e.uniform1f(e.getUniformLocation(n,"u_outward"),g?.6*o:0),m(x.write),x.swap()}function Z(){e.useProgram(D),e.uniform1i(e.getUniformLocation(D,"u_tex"),x.read.attach(0)),m(null)}let B=0,W=performance.now();const Y=o=>{const a=Math.min(.0166,(o-W)/1e3);W=o,J(),Q(a),Z(),B=requestAnimationFrame(Y)};return B=requestAnimationFrame(Y),()=>{cancelAnimationFrame(B),V.disconnect(),u.removeEventListener("pointermove",H);for(const o of O)e.deleteProgram(o);e.deleteBuffer(l)}},[]),$.jsx("canvas",{ref:s,style:{display:"block",width:"100%",height:"100%",touchAction:"none",...t.style||{}}})}me.defaultProps={mouseRadius:7,trailDuration:30,color:"#66FF9C",fade:"outside"};export{me as default};
