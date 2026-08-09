import{r as d,t as W,u as U,v as _,q as C,j as l}from"./index-Mu6UxQSY.js";import{P as J,N as c,E as K}from"./motionPresets-DdDKkMP6.js";import{u as Q}from"./cursorShared-rfFIOmTJ.js";const g=[{label:"ENTER FORGE",sub:"01"},{label:"RUN SCAN",sub:"02"},{label:"VIEW SIGNAL",sub:"03"}],k=(v,b)=>1-Math.exp(-v*Math.min(b,1/20));function ot({attractionRadius:v=J.magneticRadius,pullStrength:b=.45,labelParallax:M=.4,tiltStrength:i=5,accent:n=c.red}){const h=d.useRef(null),f=d.useRef([]),$=d.useRef([]),S=W(h),X=U(),p=Q()&&!X,w=d.useRef(g.map(()=>({x:0,y:0,vx:0,vy:0,pull:0})));return d.useEffect(()=>{if(!p)for(let e=0;e<g.length;e++){const a=f.current[e],o=$.current[e],r=w.current[e];r.x=0,r.y=0,r.vx=0,r.vy=0,r.pull=0,a&&(a.style.transform="",a.style.setProperty("--mcta-pull","0"),a.style.setProperty("--mcta-tilt-x","0deg"),a.style.setProperty("--mcta-tilt-y","0deg")),o&&(o.style.transform="")}},[p]),_(e=>{const a=h.current;if(!a)return;const o=S.current,r=a.getBoundingClientRect(),D=o.tx*r.width,O=o.ty*r.height,R=Math.max(v,1),Y=k(11,e),E=k(15,e),z=f.current.map(s=>s?s.getBoundingClientRect():null);for(let s=0;s<g.length;s++){const x=f.current[s],F=$.current[s],u=z[s],t=w.current[s];if(!x||!u)continue;const L=u.left-r.left+u.width/2-t.x,q=u.top-r.top+u.height/2-t.y,j=D-L,A=O-q,G=Math.hypot(j,A),y=o.inside?C(1-G/R,0,1):0;if(t.pull+=(y-t.pull)*Y,y>1e-4){const m=y*y,H=j*m*b,V=A*m*b,I=t.x+(H-t.x)*E,T=t.y+(V-t.y)*E;t.vx=(I-t.x)/Math.max(e,1e-4),t.vy=(T-t.y)/Math.max(e,1e-4),t.x=I,t.y=T}else{t.vx+=-t.x*110*e,t.vy+=-t.y*110*e;const m=Math.exp(-7.5*e);t.vx*=m,t.vy*=m,t.x+=t.vx*e,t.y+=t.vy*e,Math.abs(t.x)<.01&&Math.abs(t.vx)<.02&&(t.x=0,t.vx=0),Math.abs(t.y)<.01&&Math.abs(t.vy)<.02&&(t.y=0,t.vy=0)}const B=1+t.pull*.055,N=C(-t.y/R*i,-i,i),P=C(t.x/R*i,-i,i);x.style.transform=`translate3d(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px, 0) rotateX(${N.toFixed(2)}deg) rotateY(${P.toFixed(2)}deg) scale(${B.toFixed(3)})`,x.style.setProperty("--mcta-pull",t.pull.toFixed(3)),x.style.setProperty("--mcta-tilt-x",`${N.toFixed(2)}deg`),x.style.setProperty("--mcta-tilt-y",`${P.toFixed(2)}deg`),F&&(F.style.transform=`translate3d(${(t.x*M).toFixed(2)}px, ${(t.y*M).toFixed(2)}px, 12px)`)}},p),l.jsxs("div",{ref:h,style:{position:"absolute",inset:0,overflow:"hidden",background:`radial-gradient(120% 100% at 50% 115%, #17090b 0%, ${c.bg} 60%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"clamp(14px, 4cqh, 30px)",perspective:"900px"},children:[l.jsx("style",{children:`
        .mcta-btn {
          --mcta-pull: 0;
          position: relative;
          border: 1px solid rgba(240, 236, 228, 0.16);
          background:
            radial-gradient(circle at 50% 0%, color-mix(in srgb, ${n} calc(var(--mcta-pull) * 16%), transparent), transparent 58%),
            linear-gradient(180deg, rgba(24, 24, 27, 0.94), rgba(14, 14, 16, 0.92));
          color: ${c.text};
          padding: 15px 30px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 650;
          letter-spacing: 0.14em;
          transform-style: preserve-3d;
          will-change: transform;
          touch-action: manipulation;
          transition: border-color .18s ease, box-shadow .4s ${K.krankOvershoot}, background-color .18s ease;
          border-color: color-mix(in srgb, ${n} calc(var(--mcta-pull) * 85%), rgba(240,236,228,0.16));
          box-shadow:
            0 12px calc(18px + var(--mcta-pull) * 22px) rgba(0,0,0,.28),
            0 0 calc(var(--mcta-pull) * 36px) color-mix(in srgb, ${n} 42%, transparent),
            inset 0 1px 0 rgba(255,255,255,.04);
        }
        .mcta-btn::before {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background: linear-gradient(105deg, transparent 28%, rgba(255,255,255,.08) 48%, transparent 68%);
          opacity: calc(.2 + var(--mcta-pull) * .8);
          transform: translateX(calc((var(--mcta-pull) - .5) * 14%));
          pointer-events: none;
        }
        .mcta-btn::after {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 999px;
          border: 1px dashed color-mix(in srgb, ${n} 60%, transparent);
          opacity: var(--mcta-pull);
          transition: opacity .18s ease;
          pointer-events: none;
        }
        .mcta-btn:hover { border-color: color-mix(in srgb, ${n} 64%, rgba(240,236,228,.2)); }
        .mcta-btn:focus-visible {
          outline: 2px solid color-mix(in srgb, ${n} 85%, white 15%);
          outline-offset: 5px;
          box-shadow: 0 0 0 5px color-mix(in srgb, ${n} 18%, transparent), 0 14px 34px rgba(0,0,0,.34);
        }
        .mcta-label {
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          transform-style: preserve-3d;
          will-change: transform;
        }
        .mcta-sub {
          font-family: var(--mono, monospace);
          font-size: 9px;
          letter-spacing: 0.3em;
          color: color-mix(in srgb, ${n} calc(40% + var(--mcta-pull) * 60%), ${c.textDim});
        }
        @media (hover: none), (prefers-reduced-motion: reduce) {
          .mcta-btn, .mcta-label { will-change: auto; }
          .mcta-btn::before { transform: none; opacity: .22; }
        }
      `}),l.jsxs("div",{style:{fontFamily:"var(--mono, monospace)",fontSize:10,letterSpacing:"0.4em",color:c.textDim},children:["MAGNETIC FIELD // ",p?"ACTIVE":"STATIC"]}),l.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"clamp(12px, 3cqw, 36px)",justifyContent:"center",padding:"0 16px"},children:g.map((e,a)=>l.jsx("button",{type:"button",className:"mcta-btn",ref:o=>{f.current[a]=o},"aria-label":`${e.label} ${e.sub}`,children:l.jsxs("span",{className:"mcta-label",ref:o=>{$.current[a]=o},children:[e.label,l.jsx("span",{className:"mcta-sub","aria-hidden":"true",children:e.sub})]})},e.label))}),l.jsx("div",{style:{fontSize:11,color:c.textDim,letterSpacing:"0.08em"},children:p?"move across the buttons — they reach for you":"static mode — interaction stays native"})]})}export{ot as MagneticCTA,ot as default};
