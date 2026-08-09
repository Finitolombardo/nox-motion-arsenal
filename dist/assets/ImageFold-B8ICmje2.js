import{r as t,j as q}from"./index-Mu6UxQSY.js";import{k as de,a3 as me,a1 as ve,a4 as pe,a6 as ge,ab as he,D as xe,z as we,ac as Re,L as ye}from"./three-D1GiBGg0.js";import{g as te}from"./index-CzGW6FVa.js";import{R as re}from"./framerRuntime-DO_pVi2F.js";const I=1.6,k=1,G=400,Ae=100,be=1e3,ne=80,Ee=`

uniform float time;

uniform float angle;

uniform float progress;

uniform float rolls;

uniform float rollRadius;

uniform vec4 resolution;

varying vec2 vUv;

varying float vFrontShadow;



const float pi = 3.14159265359;



mat4 rotationMatrix(vec3 axis, float angle) {

    axis = normalize(axis);

    float s = sin(angle);

    float c = cos(angle);

    float oc = 1.0 - c;



    return mat4(

        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,

        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,

        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,

        0.0,                                0.0,                                0.0,                                1.0

    );

}



vec3 rotate(vec3 v, vec3 axis, float angle) {

    mat4 m = rotationMatrix(axis, angle);

    return (m * vec4(v, 1.0)).xyz;

}



void main() {

    // Fold the full 0-360 angle into a 0-90 base (which the roll math handles

    // well) plus horizontal / vertical mirrors, so higher angles are just the

    // reverse: 91-180 mirror 89-0, 181-270 mirror 1-90, 271-360 mirror 179-91.

    float deg = mod(degrees(angle), 360.0);

    float base = deg;

    float fx = 1.0;

    float fy = 1.0;

    if (deg > 270.0) {

        base = 360.0 - deg;

        fy = -1.0;

    } else if (deg > 180.0) {

        base = deg - 180.0;

        fx = -1.0;

        fy = -1.0;

    } else if (deg > 90.0) {

        base = 180.0 - deg;

        fx = -1.0;

    }

    float finalAngle = radians(base);



    // Flip only the texture coords so the still image stays upright. The roll is

    // computed on the original position; the OUTPUT geometry is mirrored at the

    // end to reverse the on-screen sweep direction.

    vUv = uv;

    if (fx < 0.0) vUv.x = 1.0 - vUv.x;

    if (fy < 0.0) vUv.y = 1.0 - vUv.y;



    vec3 newposition = position;



    float rad = rollRadius;

    float rollCount = rolls;



    // Rotate to apply angle

    newposition = rotate(newposition - vec3(-0.5, 0.5, 0.0), vec3(0.0, 0.0, 1.0), -finalAngle) + vec3(-0.5, 0.5, 0.0);



    // Offset along the roll direction

    float offs = (newposition.x + 0.5) / (sin(finalAngle) + cos(finalAngle));

    float tProgress = clamp((progress - offs * 0.99) / 0.01, 0.0, 1.0);



    // Shading for depth

    vFrontShadow = clamp((progress - offs * 0.95) / 0.05, 0.7, 1.0);



    // Build the spiral roll

    newposition.z = rad + rad * (1.0 - offs / 2.0) * sin(-offs * rollCount * pi - 0.5 * pi);

    newposition.x = -0.5 + rad * (1.0 - offs / 2.0) * cos(-offs * rollCount * pi + 0.5 * pi);



    // Rotate back

    newposition = rotate(newposition - vec3(-0.5, 0.5, 0.0), vec3(0.0, 0.0, 1.0), finalAngle) + vec3(-0.5, 0.5, 0.0);



    // Unroll

    newposition = rotate(newposition - vec3(-0.5, 0.5, rad), vec3(sin(finalAngle), cos(finalAngle), 0.0), -pi * progress * rollCount);

    newposition += vec3(

        -0.5 + progress * cos(finalAngle) * (sin(finalAngle) + cos(finalAngle)),

        0.5 - progress * sin(finalAngle) * (sin(finalAngle) + cos(finalAngle)),

        rad * (1.0 - progress / 2.0)

    );



    // Mix between rolled and flat as the wavefront passes

    vec3 finalposition = mix(newposition, position, tProgress);



    // Mirror the finished geometry to reverse the sweep for angles > 90.

    if (fx < 0.0) finalposition.x = -finalposition.x;

    if (fy < 0.0) finalposition.y = -finalposition.y;



    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalposition, 1.0);

}

`,Se=`

uniform float time;

uniform float progress;

uniform sampler2D texture1;

uniform vec4 resolution;



varying vec2 vUv;

varying float vFrontShadow;



vec2 get_img_uv() {

    vec2 uv = vUv - 0.5;

    // resolution.z / .w carry the cover aspect corrections

    uv *= resolution.zw;

    return uv + 0.5;

}



void main() {

    vec2 img_uv = get_img_uv();



    vec4 color = texture2D(texture1, img_uv);



    // 3D depth shading

    color.rgb *= vFrontShadow;



    // Fade in as the unroll begins; unrolling edges stay visible

    color.a = clamp(progress * 5.0, 0.0, 1.0);



    gl_FragColor = color;

}

`;function Me(u){if(u)return typeof u=="string"?u.trim()||void 0:u.src||void 0}function oe(u){return u<=1?.01:u>=10?.13:.01+(u-1)/9*.12}function se(u,H,E){const S=u/H;return 2*Math.atan(u/S/(2*E))*(180/Math.PI)}function ke(u){const{image:H,angle:E=175,rolls:S=14,rollRadius:U=4,mode:f="enter",startAlign:j="center",replay:B=!1,duration:P=2,style:ie}=u,M=t.useRef(null),y=t.useRef(null),x=t.useRef(null),p=t.useRef(null),g=t.useRef(null),a=t.useRef(null),ae=t.useRef(null),le=t.useRef({width:0,height:0,zoom:0,aspect:0,ts:0}),z=t.useRef(null),ce=t.useRef(f),O=t.useRef(!1),A=t.useRef(null),[Y,ue]=t.useState(!1),[Q,fe]=t.useState(!1),[W,D]=t.useState(!1),[C,F]=t.useState(!1),Z=Me(H)||"https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/be854dd1-37aa-4fc7-f569-fdb948109300/w=800",w=re.current()===re.canvas,V=!0,J=t.useCallback((e,r)=>{var m,b;if(!g.current||!p.current||!a.current||!y.current)return;const s=Math.min(window.devicePixelRatio||1,2),n=e*I,i=r*I,o=e*k,d=r*k;g.current.aspect=n/i,g.current.fov=se(n,i,G),g.current.updateProjectionMatrix(),p.current.setSize(Math.round(n*s),Math.round(i*s),!1),y.current.style.width=`${n}px`,y.current.style.height=`${i}px`,a.current.scale.set(o,d,o/2);const c=a.current.material;if((m=c==null?void 0:c.uniforms)!=null&&m.resolution){const v=(b=c.uniforms.texture1)==null?void 0:b.value;if(v!=null&&v.image){const T=o/d,_=v.image.width/v.image.height;let R,N;T>_?(R=1,N=_/T):(R=T/_,N=1),c.uniforms.resolution.value.set(o,d,R,N)}else c.uniforms.resolution.value.set(o,d,1,1)}},[]),l=t.useCallback(()=>{!p.current||!x.current||!g.current||p.current.render(x.current,g.current)},[]),$=t.useCallback(()=>{l(),z.current=O.current?requestAnimationFrame($):null},[l]),L=t.useCallback(()=>{O.current=!0,z.current==null&&(z.current=requestAnimationFrame($))},[$]),h=t.useCallback(()=>{O.current=!1,z.current!=null&&(cancelAnimationFrame(z.current),z.current=null)},[]),K=t.useCallback(()=>{if(!y.current||!M.current)return null;const e=M.current,r=e.clientWidth||e.offsetWidth||1,s=e.clientHeight||e.offsetHeight||1,n=Math.min(window.devicePixelRatio||1,2),i=r*I,o=s*I,d=new de;x.current=d;const c=new me(se(i,o,G),i/o,Ae,be);c.position.set(0,0,G),c.lookAt(0,0,0),g.current=c;const m=new ve({canvas:y.current,alpha:!0,antialias:!0});m.setSize(Math.round(i*n),Math.round(o*n),!1),m.setPixelRatio(1),m.sortObjects=!1,p.current=m,y.current.style.width=`${i}px`,y.current.style.height=`${o}px`;const b=new pe(1,1,ne,ne),v=r*k,T=s*k,_=new ge({side:xe,uniforms:{time:{value:0},progress:{value:0},angle:{value:E*Math.PI/180},rolls:{value:S},rollRadius:{value:oe(U)},texture1:{value:null},resolution:{value:new he(v,T,1,1)}},transparent:!0,vertexShader:Ee,fragmentShader:Se}),R=new we(b,_);return R.scale.set(v,T,v/2),R.position.set(0,0,0),a.current=R,d.add(R),{scene:d,camera:c,renderer:m,mesh:R}},[E,S,U]),X=t.useCallback(()=>{if(!a.current){F(!1);return}F(!1);const e=new Image;e.crossOrigin="anonymous",e.onload=()=>{var v;if(!((v=a.current)!=null&&v.material))return;const r=new Re(e);r.needsUpdate=!0,r.minFilter=ye;const s=a.current.material,n=M.current;if(!n)return;const i=(n.clientWidth||1)*k,o=(n.clientHeight||1)*k,d=i/o,c=e.width/e.height;let m,b;d>c?(m=1,b=c/d):(m=d/c,b=1),s.uniforms.resolution.value.set(i,o,m,b),s.uniforms.texture1.value=r,F(!0),p.current&&x.current&&g.current&&p.current.render(x.current,g.current)},e.onerror=()=>{console.error("Texture loading error"),F(!1)},e.src=Z},[Z]);t.useEffect(()=>{ce.current=f},[f]),t.useEffect(()=>{D(!1),F(!1)},[]),t.useEffect(()=>{var e;D(!1),F(!1),(e=a.current)!=null&&e.material&&(a.current.material.uniforms.progress.value=0)},[V,f,w]),t.useEffect(()=>{K(),p.current&&x.current&&g.current&&l();const e=setTimeout(()=>X(),0);return()=>{clearTimeout(e),h(),p.current&&(p.current.dispose(),p.current=null),x.current&&(x.current.clear(),x.current=null)}},[V,w,K,X,h,l]),t.useEffect(()=>{const e=M.current;if(!e)return;const r=()=>{const n=e.clientWidth||e.offsetWidth||1,i=e.clientHeight||e.offsetHeight||1,o=le.current;(Math.abs(n-o.width)>1||Math.abs(i-o.height)>1)&&(o.width=n,o.height=i,J(n,i),l())};r();const s=new ResizeObserver(r);return s.observe(e),window.addEventListener("resize",r),()=>{s.disconnect(),window.removeEventListener("resize",r)}},[J,l,w]),t.useEffect(()=>{var r;if(!((r=a.current)!=null&&r.material))return;const e=a.current.material.uniforms;e.angle.value=E*Math.PI/180,e.rolls.value=S,e.rollRadius.value=oe(U),l()},[E,S,U,l]),t.useEffect(()=>{if(f!=="enter"||w)return;let e=null;const r=()=>{if(!M.current)return;const n=M.current.getBoundingClientRect(),i=window.innerHeight||0;let o;o=j==="top"?n.top:j==="center"?n.top+n.height/2:n.bottom,ue(o<=i&&n.bottom>=0),fe(n.top>i)},s=()=>{e&&cancelAnimationFrame(e),e=requestAnimationFrame(r)};return r(),window.addEventListener("scroll",s,{passive:!0}),window.addEventListener("resize",r),()=>{e&&cancelAnimationFrame(e),window.removeEventListener("scroll",s),window.removeEventListener("resize",r)}},[f,j,w]),t.useEffect(()=>{if(C&&f==="default"&&!W){const e=setTimeout(()=>D(!0),10);return()=>clearTimeout(e)}},[f,W,V,w,C]),t.useEffect(()=>{var s;if(f!=="default"||!W||!C||!((s=a.current)!=null&&s.material)||!a.current.material.uniforms.texture1.value)return;const e=a.current.material;L();const r=te.to(e.uniforms.progress,{value:1,duration:P,ease:"power2.out",onUpdate:l,onComplete:()=>{l(),h()}});return()=>{r.kill(),h()}},[W,C,P,f,w,l,L,h]),t.useEffect(()=>{var s;if(f!=="enter"||!C||!((s=a.current)!=null&&s.material)||!a.current.material.uniforms.texture1.value)return;const e=a.current.material,r=e.uniforms.progress.value;if(A.current&&(A.current.kill(),A.current=null,h()),Q){B&&r>.01&&(e.uniforms.progress.value=0,l());return}return Y&&r<.99&&(L(),A.current=te.to(e.uniforms.progress,{value:1,duration:P,ease:"power2.out",onUpdate:l,onComplete:()=>{l(),h(),A.current=null}})),()=>{A.current&&(A.current.kill(),A.current=null),h()}},[Y,Q,B,C,P,f,w,l,L,h]),t.useEffect(()=>{},[w,P,l,L,h,E,S,U]);const ee=(I-1)/2*100;return q.jsxs("div",{ref:M,style:{...ie,position:"relative",width:"100%",height:"100%",overflow:"hidden",display:"block",margin:0,padding:0},children:[q.jsx("div",{ref:ae,style:{position:"absolute",width:20,height:20,opacity:0,pointerEvents:"none"}}),q.jsx("canvas",{ref:y,style:{position:"absolute",top:`-${ee}%`,left:`-${ee}%`,display:"block"}})]})}export{ke as default};
