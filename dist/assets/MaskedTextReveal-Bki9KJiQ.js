import{u as S,r,j as s}from"./index-CfWFdp0n.js";import{N as m,E as g}from"./motionPresets-D6LLYmvm.js";function I({text:k="SIGNAL OVER NOISE — THE NOX SYSTEM IS ONLINE",speed:b=1,stagger:p=.09,textColor:h=m.text,accent:y=m.redBright,loop:l=!0}){const e=S(),[w,x]=r.useState(0),i=Math.max(b,.2),n=r.useMemo(()=>k.split(/\s+/).filter(Boolean),[k]),o=1.2/i,c=(o+n.length*(p/i))*1e3+2400;r.useEffect(()=>{if(e||!l)return;const a=setInterval(()=>x(t=>t+1),c);return()=>clearInterval(a)},[e,l,c]);const d="linear-gradient(100deg, transparent 8%, #000 32%, #000 100%)";return s.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",background:`linear-gradient(180deg, ${m.bg} 0%, #120b0c 100%)`,display:"flex",alignItems:"center",justifyContent:"center"},children:[s.jsx("style",{children:`
        @keyframes msk-wipe {
          from {
            -webkit-mask-position: 130% 0;
            mask-position: 130% 0;
            transform: translateY(0.5em);
          }
          to {
            -webkit-mask-position: 40% 0;
            mask-position: 40% 0;
            transform: translateY(0);
          }
        }
        @keyframes msk-edge {
          0%   { -webkit-mask-position: 135% 0; mask-position: 135% 0; opacity: 1; }
          80%  { -webkit-mask-position: -35% 0; mask-position: -35% 0; opacity: 1; }
          100% { -webkit-mask-position: -35% 0; mask-position: -35% 0; opacity: 0; }
        }
        .msk-word {
          display: inline-block;
          position: relative;
          white-space: pre;
          will-change: transform, mask-position;
        }
        @media (prefers-reduced-motion: reduce) {
          .msk-word, .msk-word > span { animation: none !important; transform: none !important; }
        }
      `}),s.jsx("div",{style:{padding:"0 8%",fontSize:"clamp(22px, 4.6vw, 52px)",fontWeight:760,lineHeight:1.18,letterSpacing:"-0.015em",color:h,textAlign:"center",maxWidth:900},children:n.map((a,t)=>{const u=t*p/i,M=e?{}:{WebkitMaskImage:d,maskImage:d,WebkitMaskSize:"300% 100%",maskSize:"300% 100%",WebkitMaskRepeat:"no-repeat",maskRepeat:"no-repeat",WebkitMaskPosition:"130% 0",maskPosition:"130% 0"},f="linear-gradient(100deg, transparent 42%, #000 50%, transparent 58%)";return s.jsxs("span",{className:"msk-word",style:{...M,transform:e?void 0:"translateY(0.5em)",animation:e?void 0:`msk-wipe ${o}s ${g.outBack} ${u}s both`},children:[a,!e&&s.jsx("span",{"aria-hidden":!0,style:{position:"absolute",inset:0,color:y,WebkitMaskImage:f,maskImage:f,WebkitMaskSize:"300% 100%",maskSize:"300% 100%",WebkitMaskRepeat:"no-repeat",maskRepeat:"no-repeat",animation:`msk-edge ${o*1.05}s ${g.outQuint} ${u}s both`,pointerEvents:"none"},children:a}),t<n.length-1?" ":""]},t)})},w)]})}export{I as MaskedTextReveal,I as default};
