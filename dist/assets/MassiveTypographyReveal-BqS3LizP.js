import{u as g,r as l,j as r}from"./index-CfWFdp0n.js";import{N as c,E as s}from"./motionPresets-D6LLYmvm.js";function k({lines:o=["FORGE","THE","SIGNAL"],speed:u=1,stagger:n=.14,accent:d=c.red,loop:f=!0}){const t=g(),[h,x]=l.useState(0),e=Math.max(u,.2),p=l.useMemo(()=>(1.1+.9+o.length*n)/e*1e3+2600,[o.length,n,e]);l.useEffect(()=>{if(t||!f)return;const m=setInterval(()=>x(a=>a+1),p);return()=>clearInterval(m)},[t,f,p]);const i=1.1/e,y=.9/e;return r.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",background:`radial-gradient(130% 100% at 50% 115%, #150a0b 0%, ${c.bg} 60%)`,display:"flex",alignItems:"center",justifyContent:"center"},children:[r.jsx("style",{children:`
        @keyframes mtr-rise {
          from { transform: translateY(112%) skewY(4deg); }
          to   { transform: translateY(0) skewY(0deg); }
        }
        @keyframes mtr-settle {
          from { letter-spacing: 0.06em; font-weight: 650; }
          to   { letter-spacing: -0.015em; font-weight: 800; }
        }
        @keyframes mtr-underline {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes mtr-kicker {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mtr-anim { animation: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}),r.jsxs("div",{style:{padding:"0 6%",maxWidth:"100%"},children:[r.jsx("div",{className:"mtr-anim",style:{fontFamily:"var(--mono, monospace)",fontSize:10,letterSpacing:"0.4em",color:d,marginBottom:"0.9em",opacity:t?1:0,animation:t?void 0:`mtr-kicker ${.6/e}s ${s.outExpo} ${.1/e}s both`},children:"NOX // TRANSMISSION"}),o.map((m,a)=>r.jsx("div",{style:{overflow:"clip",lineHeight:1.02,paddingBottom:"0.04em"},children:r.jsx("div",{className:"mtr-anim",style:{fontSize:"clamp(30px, 9vw, 110px)",fontWeight:t?800:650,letterSpacing:t?"-0.015em":"0.06em",color:c.text,transform:t?"none":"translateY(112%)",willChange:"transform, letter-spacing",animation:t?void 0:`mtr-rise ${i}s ${s.outExpo} ${a*n/e}s both, mtr-settle ${y}s ${s.outQuint} ${(i*.75+a*n)/e}s both`},children:m})},a)),r.jsx("div",{className:"mtr-anim",style:{height:3,width:"clamp(80px, 22%, 220px)",marginTop:"0.7em",background:`linear-gradient(90deg, ${d}, transparent)`,transformOrigin:"left center",transform:t?"none":"scaleX(0)",animation:t?void 0:`mtr-underline ${.8/e}s ${s.outExpo} ${(i*.7+o.length*n)/e}s both`}})]},h)]})}export{k as MassiveTypographyReveal,k as default};
