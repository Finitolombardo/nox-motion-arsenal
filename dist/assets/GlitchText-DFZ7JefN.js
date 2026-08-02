import{r as e,j as s}from"./index-CfWFdp0n.js";function O({text:i="GLITCH",color:m="#ffffff",fontSize:d=64,fontFamily:$="monospace",fontWeight:y=700,letterSpacing:b=4,glitchInterval:f=3e3,glitchDuration:o=200,intensity:k=6,mode:n="rgb-split",style:R}){const j=e.useRef(null),[M,p]=e.useState(!1),[v,r]=e.useState(""),l=e.useRef(0),a=e.useRef(!1),g=e.useCallback(()=>{if(a.current)return;a.current=!0,p(!0);const c=performance.now(),h=A=>{const x=A-c;if(x>=o){a.current=!1,p(!1),r("");return}const u=x/o;u<.3?r("glitch-split"):u<.6?r("glitch-skip"):r("glitch-flash"),l.current=requestAnimationFrame(h)};l.current=requestAnimationFrame(h)},[o]);e.useEffect(()=>{const c=setInterval(g,f);return()=>{clearInterval(c),cancelAnimationFrame(l.current),a.current=!1}},[f,g]);const G=Math.random()>.5?1:-1,t=k*(2+Math.random()*3),C=n==="rgb-split"||n==="full"?t*1.5:0,F=n==="rgb-split"||n==="full"?-t*1.2:0;return s.jsxs(s.Fragment,{children:[s.jsx("style",{children:`
        .gt-root {
          position: relative;
          display: inline-block;
          font-family: ${$};
          font-size: ${d}px;
          font-weight: ${y};
          letter-spacing: ${b}px;
          color: ${m};
          line-height: 1.2;
        }
        .gt-root.glitch-split {
          animation: gt-none 0.05s infinite;
        }
        .gt-root.glitch-split .gt-text::before {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          color: #ff0040;
          clip: rect(${t*.5}px, 9999px, ${t*2}px, 0);
          transform: translate(${C}px, 0);
          opacity: 0.85;
        }
        .gt-root.glitch-split .gt-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          color: #00e5ff;
          clip: rect(${t*2.5}px, 9999px, ${t*4}px, 0);
          transform: translate(${F}px, 0);
          opacity: 0.85;
        }
        .gt-root.glitch-skip {
          animation: gt-none 0.02s infinite;
          opacity: 0.9;
        }
        .gt-root.glitch-skip .gt-text {
          transform: translate(${G*t*.6}px, ${Math.random()*3}px);
          clip-path: inset(${Math.random()*40}% 0 ${Math.random()*40}% 0);
        }
        .gt-root.glitch-flash {
          opacity: 0.05;
          transition: opacity 0.03s;
        }
        .gt-text {
          position: relative;
          display: inline-block;
          transition: transform 0.05s, clip-path 0.05s;
        }
        @keyframes gt-none {
          0%, 100% { transform: none; }
          50% { transform: translate(${Math.random()>.7?2:0}px, 0); }
        }
      `}),s.jsx("div",{ref:j,className:`gt-root ${M?v:""}`,"data-text":i,style:R,children:s.jsx("span",{className:"gt-text","data-text":i,children:i})})]})}export{O as default};
