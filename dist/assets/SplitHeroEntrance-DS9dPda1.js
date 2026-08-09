import{u as S,r as x,j as o}from"./index-Mu6UxQSY.js";import{N as r,E as s}from"./motionPresets-DdDKkMP6.js";const g=[{kicker:"NOX // 01",word:"BUILD",note:"FORGE READY"},{kicker:"NOX // 02",word:"THE",note:"RANK SYNC"},{kicker:"NOX // 03",word:"SYSTEM",note:"SCAN LIVE"}];function Y({panels:v=3,speed:k=1,accent:a=r.red,sweep:E=!0,loop:d=!0}){const t=S(),[$,b]=x.useState(0),n=Math.max(k,.2),p=Math.max(2,Math.min(3,Math.round(v))),i=.9/n,f=.12/n,h=(i+p*f+1.4/n)*1e3+2600;return x.useEffect(()=>{if(t||!d)return;const u=setInterval(()=>b(e=>e+1),h);return()=>clearInterval(u)},[t,d,h]),o.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",background:r.bg},children:[o.jsx("style",{children:`
        @keyframes she-in-down {
          from { transform: translateY(-108%); }
          to   { transform: translateY(0); }
        }
        @keyframes she-in-up {
          from { transform: translateY(108%); }
          to   { transform: translateY(0); }
        }
        @keyframes she-sweep {
          0%   { transform: translateY(-120%); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(320%); opacity: 0; }
        }
        @keyframes she-content {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .she-anim { animation: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}),o.jsx("div",{style:{position:"absolute",inset:0,display:"flex"},children:Array.from({length:p},(u,e)=>{const c=e%2===0,l=g[e%g.length],y=e*f,m=i+y;return o.jsxs("div",{className:"she-anim",style:{flex:1,position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"clamp(6px, 1.6vh, 14px)",background:`linear-gradient(${c?180:0}deg, #131114 0%, #0c0b0d 100%)`,borderLeft:e>0?"1px solid rgba(240, 236, 228, 0.07)":void 0,transform:t?"none":`translateY(${c?-108:108}%)`,animation:t?void 0:`${c?"she-in-down":"she-in-up"} ${i}s ${s.krankOvershoot} ${y}s both`,willChange:"transform"},children:[o.jsx("div",{className:"she-anim",style:{fontFamily:"var(--mono, monospace)",fontSize:9,letterSpacing:"0.35em",color:a,opacity:t?1:0,animation:t?void 0:`she-content ${.5/n}s ${s.outExpo} ${m*.85}s both`},children:l.kicker}),o.jsx("div",{style:{fontSize:"clamp(22px, 5.2vw, 64px)",fontWeight:820,letterSpacing:"-0.02em",color:r.text,lineHeight:1},children:l.word}),o.jsx("div",{className:"she-anim",style:{fontFamily:"var(--mono, monospace)",fontSize:8,letterSpacing:"0.25em",color:r.textDim,opacity:t?1:0,animation:t?void 0:`she-content ${.5/n}s ${s.outExpo} ${m*.85+.08}s both`},children:l.note}),E&&!t&&e>0&&o.jsx("div",{style:{position:"absolute",left:-1,top:0,width:2,height:"38%",background:`linear-gradient(to bottom, transparent, ${a}, transparent)`,boxShadow:`0 0 14px 2px ${a}66`,opacity:0,animation:`she-sweep ${1.3/n}s ${s.inOutSoft} ${m+.1}s both`,pointerEvents:"none"}})]},e)})},$)]})}export{Y as SplitHeroEntrance,Y as default};
