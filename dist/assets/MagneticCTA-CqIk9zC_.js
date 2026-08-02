import{r as m,t as q,u as B,v as G,q as H,B as y,j as o}from"./index-CfWFdp0n.js";import{P as g,N as s,E as V}from"./motionPresets-D6LLYmvm.js";import{u as W,d as U}from"./cursorShared-u02RIbWN.js";const h=[{label:"ENTER FORGE",sub:"01"},{label:"RUN SCAN",sub:"02"},{label:"VIEW SIGNAL",sub:"03"}];function J({attractionRadius:A=g.magneticRadius,pullStrength:v=.45,labelParallax:R=.4,accent:r=s.red}){const f=m.useRef(null),C=m.useRef([]),$=m.useRef([]),F=q(f),b=B(),I=W(),M=m.useRef(h.map(()=>({x:0,y:0,vx:0,vy:0,pull:0})));return G((e,l)=>{const n=f.current;if(!n)return;const i=F.current;I||U(i,l);const c=n.getBoundingClientRect(),P=i.tx*c.width,T=i.ty*c.height;for(let a=0;a<h.length;a++){const p=C.current[a],j=$.current[a],t=M.current[a];if(!p)continue;const x=p.getBoundingClientRect(),k=x.left-c.left+x.width/2-t.x,D=x.top-c.top+x.height/2-t.y,E=P-k,S=T-D,O=Math.hypot(E,S),d=i.inside?H(1-O/Math.max(A,1),0,1):0;if(t.pull=y(t.pull,d,.12),d>0){const u=E*d*v,L=S*d*v,w=y(t.x,u,g.magneticPull),N=y(t.y,L,g.magneticPull);t.vx=(w-t.x)/Math.max(e,1e-4),t.vy=(N-t.y)/Math.max(e,1e-4),t.x=w,t.y=N}else{t.vx+=-t.x*110*e,t.vy+=-t.y*110*e;const u=Math.exp(-7.5*e);t.vx*=u,t.vy*=u,t.x+=t.vx*e,t.y+=t.vy*e}const z=1+t.pull*.05;p.style.transform=`translate3d(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px, 0) scale(${z.toFixed(3)})`,p.style.setProperty("--mcta-pull",t.pull.toFixed(3)),j&&(j.style.transform=`translate3d(${(t.x*R).toFixed(2)}px, ${(t.y*R).toFixed(2)}px, 0)`)}},!b),o.jsxs("div",{ref:f,style:{position:"absolute",inset:0,overflow:"hidden",background:`radial-gradient(120% 100% at 50% 115%, #17090b 0%, ${s.bg} 60%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"clamp(14px, 4cqh, 30px)",touchAction:"none"},children:[o.jsx("style",{children:`
        .mcta-btn {
          position: relative;
          border: 1px solid rgba(240, 236, 228, 0.16);
          background: linear-gradient(180deg, rgba(24, 24, 27, 0.9), rgba(14, 14, 16, 0.9));
          color: ${s.text};
          padding: 15px 30px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 650;
          letter-spacing: 0.14em;
          will-change: transform;
          transition: border-color .18s ease, box-shadow .5s ${V.krankOvershoot};
          border-color: color-mix(in srgb, ${r} calc(var(--mcta-pull, 0) * 85%), rgba(240,236,228,0.16));
          box-shadow: 0 0 calc(var(--mcta-pull, 0) * 34px) color-mix(in srgb, ${r} 42%, transparent);
        }
        .mcta-btn::after {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 999px;
          border: 1px dashed color-mix(in srgb, ${r} 60%, transparent);
          opacity: var(--mcta-pull, 0);
          transition: opacity .18s ease;
          pointer-events: none;
        }
        .mcta-label {
          display: inline-flex;
          align-items: baseline;
          gap: 10px;
          will-change: transform;
        }
        .mcta-sub {
          font-family: var(--mono, monospace);
          font-size: 9px;
          letter-spacing: 0.3em;
          color: color-mix(in srgb, ${r} calc(40% + var(--mcta-pull, 0) * 60%), ${s.textDim});
        }
      `}),o.jsxs("div",{style:{fontFamily:"var(--mono, monospace)",fontSize:10,letterSpacing:"0.4em",color:s.textDim},children:["MAGNETIC FIELD // ",b?"STATIC":"ACTIVE"]}),o.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"clamp(12px, 3cqw, 36px)",justifyContent:"center",padding:"0 16px"},children:h.map((e,l)=>o.jsx("button",{type:"button",className:"mcta-btn",ref:n=>{C.current[l]=n},children:o.jsxs("span",{className:"mcta-label",ref:n=>{$.current[l]=n},children:[e.label,o.jsx("span",{className:"mcta-sub",children:e.sub})]})},e.label))}),o.jsx("div",{style:{fontSize:11,color:s.textDim,letterSpacing:"0.08em"},children:b?"reduced motion — magnet parked":"move across the buttons — they reach for you"})]})}export{J as MagneticCTA,J as default};
