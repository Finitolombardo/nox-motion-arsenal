import{r as t,j as D}from"./index-CfWFdp0n.js";import{k as ce,a3 as le,a1 as ue,a4 as J,a6 as fe,a as K,z as me,$ as de}from"./three-D1GiBGg0.js";import{g as $}from"./index-CzGW6FVa.js";import{C as ve,R as Z}from"./framerRuntime-DO_pVi2F.js";const ne=35,V=128,ge=`

varying vec2 vUv;



void main(){

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    vec4 viewPosition = viewMatrix * modelPosition;

    vec4 clipPosition = projectionMatrix * viewPosition;

    gl_Position = clipPosition;

    vUv = uv;

}

`,pe=`

varying vec2 vUv;

uniform float uProgress;      // Animation progress [0..1]

uniform vec2 uSize;           // Container size in pixels

uniform vec2 uImageSize;      // Image dimensions for aspect ratio

uniform sampler2D uTexture;   // The image texture

uniform int uBlobCount;

uniform float uFitCover;      // 1 = cover (fill+crop), 0 = contain (fit+letterbox)

#define PI 3.1415926538

#define TWO_PI 6.28318530718



// Creates wavy noise based on angle - adds organic feel to blob edges

float noise(vec2 point) {

    float frequency = 1.0;

    float angle = atan(point.y, point.x) + uProgress * PI;



    // Combine multiple wave frequencies for complex pattern

    float w0 = (cos(angle * frequency) + 1.0) / 2.0;

    float w1 = (sin(2.0 * angle * frequency) + 1.0) / 2.0;

    float w2 = (cos(3.0 * angle * frequency) + 1.0) / 2.0;

    return (w0 + w1 + w2) / 3.0;

}



// Smooth maximum function for organic blending

float softMax(float a, float b, float k) {

    return log(exp(k * a) + exp(k * b)) / k;

}



// Smooth minimum function - blends shapes together smoothly

float softMin(float a, float b, float k) {

    return -softMax(-a, -b, k);

}



// Signed distance field for a circle with noise

float circleSDF(vec2 pos, float rad) {

    float a = sin(uProgress * 0.2) * 0.25;

    float amt = 0.5 + a;

    float circle = length(pos);

    circle += noise(pos) * rad * amt;

    return circle;

}



// Creates circles arranged radially around the center

float radialCircles(vec2 p, float offset, float count) {

    float angle = (2.0 * PI) / count;

    float s = round(atan(p.y, p.x) / angle);

    float an = angle * s;

    vec2 q = vec2(offset * cos(an), offset * sin(an));

    vec2 pos = p - q;

    return circleSDF(pos, 15.0);

}



void main() {

    vec4 bg = vec4(0.0, 0.0, 0.0, 0.0);



    // UV for cover (fill + crop) or contain (fit + letterbox), vs plane aspect.

    vec2 coverUV = vUv;

    if (uSize.x > 0.0 && uSize.y > 0.0 && uImageSize.x > 0.0 && uImageSize.y > 0.0) {

        float containerAspect = uSize.x / uSize.y;

        float imageAspect = uImageSize.x / uImageSize.y;



        vec2 scale = vec2(1.0);

        if (uFitCover > 0.5) {

            // Cover: shrink UV on the long axis so the image fills, cropping.

            if (containerAspect > imageAspect) scale.y = imageAspect / containerAspect;

            else scale.x = containerAspect / imageAspect;

        } else {

            // Contain: expand UV so the whole image fits; rest is letterbox.

            if (containerAspect > imageAspect) scale.x = containerAspect / imageAspect;

            else scale.y = imageAspect / containerAspect;

        }



        coverUV = (vUv - 0.5) * scale + 0.5;

    }



    vec4 texture = texture2D(uTexture, coverUV);

    // Contain: anything sampled outside [0,1] is letterbox → transparent.

    if (uFitCover < 0.5 &&

        (coverUV.x < 0.0 || coverUV.x > 1.0 || coverUV.y < 0.0 || coverUV.y > 1.0)) {

        texture = vec4(0.0);

    }

    vec2 coords = vUv * uSize;

    vec2 center = vec2(0.5) * uSize;



    // Apply easing to progress for natural animation curve

    float t = pow(uProgress, 2.5);

    // Use diagonal to ensure full coverage - need at least half diagonal to cover rectangle

    // Add extra margin to account for noise distortion

    float maxDim = sqrt(uSize.x * uSize.x + uSize.y * uSize.y);

    float rad = t * maxDim * 1.0;



    // Create main center circle (always present)

    float c1 = circleSDF(coords - center, rad);

    float k = 50.0 / max(uSize.x, uSize.y);

    float circle = c1;



    // Add extra blobs only if blobCount > 1

    int extraBlobs = uBlobCount - 1;

    for (int i = 0; i < 20; i++) {

        if (i >= extraBlobs) break;



        float idx = float(i);

        float total = float(extraBlobs);



        // Distribute evenly around the center with pseudo-random offset

        float baseAngle = idx * TWO_PI / max(total, 1.0);

        float jitter = fract(sin(idx * 127.1 + 311.7) * 43758.5453) * 0.5 - 0.25;

        float angle = baseAngle + jitter;



        // Position at varying distances from center

        float distRatio = 0.25 + 0.2 * fract(sin(idx * 43.3) * 12345.6);

        vec2 offset = vec2(cos(angle), sin(angle)) * distRatio * min(uSize.x, uSize.y);



        // Each extra blob is a simple circle

        float blobDist = length(coords - center - offset);

        float blobNoise = noise(coords - center - offset) * rad * 0.4;

        float blob = blobDist + blobNoise;



        circle = softMin(circle, blob, k);

    }



    // Create sharp edge at the blob boundary

    circle = step(circle, rad);



    // Mix background (transparent) with texture based on blob mask

    gl_FragColor = mix(bg, texture, circle);

}

`;function he(o,m){const x=Math.max(o,1),p=m*Math.PI/360;return x/2/Math.tan(p)||1}function ee(o,m,x){const p=Math.max(m,1),h=Math.max(x,1);o.aspect=p/h,o.fov=ne,o.position.set(0,0,he(h,o.fov)),o.updateProjectionMatrix()}function be(o){if(o)return typeof o=="string"?o.trim()||void 0:o.src||void 0}const te={linear:[0,0,1,1],easeIn:[.42,0,1,1],easeOut:[0,0,.58,1],easeInOut:[.42,0,.58,1]};function re(o,m,x,p){const h=3*o,z=3*(x-o)-h,d=1-h-z,M=3*m,y=3*(p-m)-M,O=1-M-y,C=a=>((d*a+z)*a+h)*a,S=a=>((O*a+y)*a+M)*a,E=a=>(3*d*a+2*z)*a+h;return a=>{let i=a;for(let b=0;b<8;b++){const s=C(i)-a,k=E(i);if(Math.abs(s)<1e-4||Math.abs(k)<1e-6)break;i-=s/k}return i=i<0?0:i>1?1:i,S(i)}}function xe(o){if(Array.isArray(o)&&o.length===4)return re(o[0],o[1],o[2],o[3]);const m=typeof o=="string"&&te[o]||te.easeOut;return re(m[0],m[1],m[2],m[3])}function we(o){const{image:m={src:"https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/041b1d75-2371-44dc-4b15-972ecd7b2400/w=800"},fit:x="cover",blobCount:p=20,startAlign:h="bottom",replay:z=!0,transition:d={type:"tween",duration:2,ease:"easeOut"},style:M}=o,y=typeof(d==null?void 0:d.duration)=="number"?d.duration:2,O=JSON.stringify((d==null?void 0:d.ease)??null),C=t.useMemo(()=>xe(d==null?void 0:d.ease),[O]),S=t.useRef(null),E=t.useRef(null),a=t.useRef(null),i=t.useRef(null),b=t.useRef(null),s=t.useRef(null),k=t.useRef(null),L=t.useRef({width:0,height:0,zoom:0}),A=t.useRef(null),j=t.useRef(!1),w=t.useRef(null),[_,oe]=t.useState(!1),[H,ae]=t.useState(!1),[N,B]=t.useState(!1),[F,R]=t.useState(!1),I=be(m),P=Z.current()===Z.canvas,T=!!I,Y=t.useCallback(()=>{if(!E.current||!S.current)return null;const e=S.current,n=e.clientWidth||e.offsetWidth||1,r=e.clientHeight||e.offsetHeight||1,l=new ce;a.current=l;const u=new le(ne,n/r,.1,2e3);ee(u,n,r),b.current=u;const f=new ue({canvas:E.current,alpha:!0,antialias:!0});f.setSize(n,r,!1),f.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),i.current=f;const v=Math.max(1,n),X=Math.max(1,r),ie=new J(v,X,V,V),se=new fe({vertexShader:ge,fragmentShader:pe,transparent:!0,uniforms:{uProgress:{value:0},uSize:{value:new K(v,X)},uImageSize:{value:new K(1,1)},uTexture:{value:null},uBlobCount:{value:Math.min(20,Math.max(1,Math.round(p)))},uFitCover:{value:x==="contain"?0:1}}}),q=new me(ie,se);return s.current=q,l.add(q),{scene:l,camera:u,renderer:f,mesh:q}},[p]),G=t.useCallback(()=>{if(!I||!s.current){R(!1);return}R(!1),new de().load(I,e=>{var r;if(!((r=s.current)!=null&&r.material))return;const n=s.current.material;if(e.image){const l=e.image.width||1,u=e.image.height||1;n.uniforms.uImageSize.value.set(l,u)}n.uniforms.uTexture.value=e,R(!0),i.current&&a.current&&b.current&&i.current.render(a.current,b.current)},void 0,e=>{console.error("Texture loading error:",e),R(!1)})},[I]),Q=t.useCallback((e,n)=>{var l,u;if(!b.current||!i.current)return;ee(b.current,e,n),i.current.setSize(e,n,!1),i.current.setPixelRatio(Math.min(window.devicePixelRatio||1,2));const r=s.current;if(r){const f=Math.max(1,e),v=Math.max(1,n);r.geometry&&r.geometry.dispose(),r.geometry=new J(f,v,V,V),(u=(l=r.material)==null?void 0:l.uniforms)!=null&&u.uSize&&r.material.uniforms.uSize.value.set(f,v)}},[]),c=t.useCallback(()=>{!i.current||!a.current||!b.current||i.current.render(a.current,b.current)},[]),W=t.useCallback(()=>{c(),A.current=j.current?requestAnimationFrame(W):null},[c]),U=t.useCallback(()=>{j.current=!0,A.current==null&&(A.current=requestAnimationFrame(W))},[W]),g=t.useCallback(()=>{j.current=!1,A.current!=null&&(cancelAnimationFrame(A.current),A.current=null)},[]);return t.useEffect(()=>{B(!1),R(!1)},[]),t.useEffect(()=>{var e;if(!T){B(!1),R(!1);return}B(!1),R(!1),(e=s.current)!=null&&e.material&&(s.current.material.uniforms.uProgress.value=0)},[T,I,P]),t.useEffect(()=>{if(!T){g(),i.current&&(i.current.dispose(),i.current=null),a.current&&(a.current.clear(),a.current=null),s.current=null;return}Y(),i.current&&a.current&&b.current&&c();const e=setTimeout(()=>G(),0);return()=>{clearTimeout(e),g(),i.current&&(i.current.dispose(),i.current=null),a.current&&(a.current.clear(),a.current=null)}},[T,P,Y,G,g,c]),t.useEffect(()=>{const e=S.current;if(!e)return;const n=()=>{const u=e.clientWidth||e.offsetWidth||1,f=e.clientHeight||e.offsetHeight||1,v=L.current;(Math.abs(u-v.width)>1||Math.abs(f-v.height)>1)&&(v.width=u,v.height=f,Q(u,f),c())};n();const r=new ResizeObserver(n);r.observe(e);const l=setInterval(()=>{var v;const u=((v=k.current)==null?void 0:v.getBoundingClientRect().width)??20,f=L.current;Math.abs(u-f.zoom)>.5&&(f.zoom=u,n())},250);return()=>{r.disconnect(),clearInterval(l)}},[Q,c]),t.useEffect(()=>{var e;(e=s.current)!=null&&e.material&&(s.current.material.uniforms.uBlobCount.value=Math.min(20,Math.max(1,Math.round(p))),c())},[p,c]),t.useEffect(()=>{var n,r;const e=s.current;(r=(n=e==null?void 0:e.material)==null?void 0:n.uniforms)!=null&&r.uFitCover&&(e.material.uniforms.uFitCover.value=x==="contain"?0:1,c())},[x,c]),t.useEffect(()=>{let e=null;const n=()=>{if(!S.current)return;const l=S.current.getBoundingClientRect(),u=window.innerHeight||0,f=h==="top"?l.top:h==="center"?l.top+l.height/2:l.bottom;oe(f<=u&&l.bottom>=0),ae(l.top>u||l.bottom<0)},r=()=>{e&&cancelAnimationFrame(e),e=requestAnimationFrame(n)};return n(),window.addEventListener("scroll",r,{passive:!0}),window.addEventListener("resize",n),()=>{e&&cancelAnimationFrame(e),window.removeEventListener("scroll",r),window.removeEventListener("resize",n)}},[h,P]),t.useEffect(()=>{var r;if(!N||!F||!((r=s.current)!=null&&r.material)||!s.current.material.uniforms.uTexture.value)return;const e=s.current.material;U();const n=$.to(e.uniforms.uProgress,{value:1,duration:y,ease:C,onUpdate:c,onComplete:()=>{c(),g()}});return()=>{n.kill(),g()}},[N,F,y,C,P,c,U,g]),t.useEffect(()=>{var r;if(!F||!((r=s.current)!=null&&r.material)||!s.current.material.uniforms.uTexture.value)return;const e=s.current.material,n=e.uniforms.uProgress.value;if(H){w.current&&(w.current.kill(),w.current=null,g()),z&&n>.01&&(e.uniforms.uProgress.value=0,c());return}if(_&&n<.99){if(w.current)return;U(),w.current=$.to(e.uniforms.uProgress,{value:1,duration:y,ease:C,onUpdate:c,onComplete:()=>{c(),g(),w.current=null}})}},[_,H,z,F,y,C,P,c,U,g]),t.useEffect(()=>()=>{w.current&&(w.current.kill(),w.current=null),g()},[g]),t.useEffect(()=>{},[P,y,C,c,U,g,p]),T?D.jsxs("div",{ref:S,style:{...M,position:"relative",width:"100%",height:"100%",overflow:"hidden",display:"block",margin:0,padding:0},children:[D.jsx("div",{ref:k,style:{position:"absolute",width:20,height:20,opacity:0,pointerEvents:"none"}}),D.jsx("canvas",{ref:E,style:{position:"absolute",inset:0,width:"100%",height:"100%",display:"block"}})]}):D.jsx(ve,{style:{position:"relative",width:"100%",height:"100%",minWidth:0,minHeight:0,...M},title:"Blob Image Reveal",subtitle:"Add an image to see the blob reveal effect"})}we.defaultProps={image:{src:"https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/041b1d75-2371-44dc-4b15-972ecd7b2400/w=800"},fit:"cover",blobCount:20,startAlign:"bottom",replay:!0};export{we as default};
