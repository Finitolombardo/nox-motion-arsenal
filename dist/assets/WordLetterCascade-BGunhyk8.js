import{u as D,r as d,j as n,l as N}from"./index-Mu6UxQSY.js";import{N as b,E as $}from"./motionPresets-DdDKkMP6.js";function P({text:p="SIGNAL FORGED IN THE DARK",speed:M=1,waviness:m=1,rotation:u=14,color:j=b.text,seed:f=5,loop:x=!0}){const s=D(),[v,E]=d.useState(0),i=Math.max(M,.2),{words:I,maxDelay:R}=d.useMemo(()=>{const t=N(f),e=t()*Math.PI*2,a=t()*Math.PI*2,l=t()*Math.PI*2;let r=0,o=0;return{words:p.split(/\s+/).filter(Boolean).map(g=>({word:g,letters:g.split("").map(S=>{const w=Math.sin(r*.9+e)*1+Math.sin(r*2.1+a)*.2+Math.sin(r*.37+l)*.3,c=(r*.045+(w*.5+.5)*.4*m)/i,k=w*u;return r+=1,c>o&&(o=c),{ch:S,delay:c,rot:k}})})),maxDelay:o}},[p,f,m,u,i]),y=.85/i,h=(R+y)*1e3+2600;return d.useEffect(()=>{if(s||!x)return;const t=setInterval(()=>E(e=>e+1),h);return()=>clearInterval(t)},[s,x,h]),n.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",background:`radial-gradient(120% 95% at 50% 112%, #130b0c 0%, ${b.bg} 60%)`,display:"flex",alignItems:"center",justifyContent:"center"},children:[n.jsx("style",{children:`
        @keyframes wlc-in {
          from {
            opacity: 0;
            transform: translateY(0.75em) rotate(var(--wlc-r, 0deg)) scale(0.92);
            filter: blur(7px);
          }
          60% { filter: blur(0px); }
          to {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
            filter: blur(0px);
          }
        }
        .wlc-letter {
          display: inline-block;
          will-change: transform, filter, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .wlc-letter { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
        }
      `}),n.jsx("div",{style:{padding:"0 7%",maxWidth:860,textAlign:"center",fontSize:"clamp(24px, 5.4vw, 62px)",fontWeight:790,letterSpacing:"-0.01em",lineHeight:1.15,color:j},children:I.map((t,e)=>n.jsx("span",{style:{display:"inline-block",whiteSpace:"nowrap",marginRight:"0.28em"},children:t.letters.map((a,l)=>n.jsx("span",{className:"wlc-letter",style:{"--wlc-r":`${a.rot.toFixed(1)}deg`,opacity:s?1:0,animation:s?void 0:`wlc-in ${y}s ${$.outBack} ${a.delay.toFixed(3)}s both`},children:a.ch},l))},e))},v)]})}export{P as WordLetterCascade,P as default};
