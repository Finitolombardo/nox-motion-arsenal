import{u as H,r as s,v as O,x as T,j as t,q as B}from"./index-Mu6UxQSY.js";import{N as e,E as i}from"./motionPresets-DdDKkMP6.js";const v=[{tag:"INIT",title:"System Boot",body:"Runtime hochgefahren, Wahrheitskette geladen."},{tag:"SCAN",title:"Surface Analysis",body:"Oberfläche abgetastet, Signale extrahiert."},{tag:"FORGE",title:"Core Build",body:"Kernmodul geschmiedet und verdrahtet."},{tag:"RANK",title:"Signal Weighting",body:"Ränge gewichtet, Rauschen verworfen."},{tag:"DEPLOY",title:"Live Handover",body:"Übergabe an die Produktionsschiene."},{tag:"ORBIT",title:"Watch Loop",body:"Beobachtungsschleife aktiv, System sendet."}];function W({milestones:R=5,damping:$=8,glow:a=.8,accent:r=e.red,showPercent:w=!0}){const l=H(),S=B(Math.round(R),3,v.length),j=v.slice(0,S),f=s.useRef(null),g=s.useRef(null),b=s.useRef(null),h=s.useRef(null),u=s.useRef(null),m=s.useRef([]),d=s.useRef(0);O(n=>{const o=f.current,c=g.current,y=b.current;if(!o||!c||!y)return;const L=o.scrollTop/Math.max(1,o.scrollHeight-o.clientHeight);d.current=T(d.current,L,$,n);const N=c.scrollHeight,x=d.current*N;y.style.height=`${x.toFixed(1)}px`,h.current&&(h.current.style.top=`${x.toFixed(1)}px`),u.current&&(u.current.textContent=`${Math.round(d.current*100)}%`),m.current.forEach(p=>{if(!p)return;const F=p.offsetTop+30,k=x>=F;p.dataset.lit==="true"!==k&&(p.dataset.lit=String(k))})},!l);const E=(10+a*16).toFixed(0);return t.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",containerType:"size",background:"linear-gradient(160deg, #0d0c0e 0%, #0a0a0b 70%)"},children:[t.jsx("style",{children:`
        .tpr-scroll { scrollbar-width: thin; scrollbar-color: rgba(240,236,228,0.18) transparent; }
        .tpr-scroll::-webkit-scrollbar { width: 6px; }
        .tpr-scroll::-webkit-scrollbar-track { background: transparent; }
        .tpr-scroll::-webkit-scrollbar-thumb { background: rgba(240,236,228,0.14); border-radius: 3px; }
        @keyframes tpr-ignite {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, ${r} 60%, transparent); }
          60% { box-shadow: 0 0 ${E}px ${(a*6).toFixed(0)}px color-mix(in srgb, ${r} 45%, transparent); }
          100% { box-shadow: 0 0 ${(a*12).toFixed(0)}px 2px color-mix(in srgb, ${r} 35%, transparent); }
        }
        .tpr-node {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(240,236,228,0.22);
          background: #111114;
          display: grid; place-items: center;
          transition: border-color 0.3s ${i.outExpo}, transform 0.6s ${i.outBack}, background 0.3s ${i.outExpo};
        }
        .tpr-check { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 0.7s ${i.outExpo} 0.12s; }
        [data-lit="true"] .tpr-node {
          border-color: ${r};
          background: color-mix(in srgb, ${r} 24%, #111114);
          transform: scale(1.22);
          animation: tpr-ignite 0.9s ${i.outBack} both;
        }
        [data-lit="true"] .tpr-check { stroke-dashoffset: 0; }
        .tpr-row-txt { transition: opacity 0.45s ${i.outExpo}, transform 0.5s ${i.krankOvershoot}; opacity: 0.35; transform: translateX(0); }
        [data-lit="true"] .tpr-row-txt { opacity: 1; transform: translateX(6px); }
        [data-lit="true"] .tpr-tag { color: ${r}; }
        @media (prefers-reduced-motion: reduce) {
          .tpr-node, .tpr-check, .tpr-row-txt { transition: none !important; animation: none !important; }
        }
      `}),t.jsx("div",{ref:f,className:"tpr-scroll",style:{position:"absolute",inset:0,overflowY:"auto",overflowX:"hidden"},children:t.jsxs("div",{ref:g,style:{position:"relative",padding:"8cqh 14px 8cqh 0"},children:[t.jsxs("div",{style:{position:"absolute",left:29,top:0,bottom:0,width:2,background:"rgba(240,236,228,0.1)"},children:[t.jsx("div",{ref:b,style:{position:"absolute",top:0,left:0,width:"100%",height:l?"100%":"0px",background:`linear-gradient(180deg, ${r} 0%, ${e.gold} 100%)`,boxShadow:`0 0 ${(6+a*10).toFixed(0)}px color-mix(in srgb, ${r} 55%, transparent)`}}),!l&&t.jsx("div",{ref:h,style:{position:"absolute",left:"50%",top:0,width:8,height:8,borderRadius:"50%",transform:"translate(-50%, -50%)",background:e.gold,boxShadow:`0 0 ${(8+a*12).toFixed(0)}px ${e.gold}`}})]}),j.map((n,o)=>t.jsxs("div",{ref:c=>{m.current[o]=c},"data-lit":l?"true":"false",style:{position:"relative",minHeight:"46cqh",paddingLeft:58,display:"flex",alignItems:"flex-start",paddingTop:20},children:[t.jsx("div",{style:{position:"absolute",left:21,top:21},children:t.jsx("div",{className:"tpr-node",children:t.jsx("svg",{viewBox:"0 0 18 18",width:"11",height:"11",style:{overflow:"visible"},children:t.jsx("path",{className:"tpr-check",d:"M3.5 9.5 L7.5 13 L14.5 5",fill:"none",stroke:e.text,strokeWidth:2.4,strokeLinecap:"round",strokeLinejoin:"round",pathLength:1})})})}),t.jsxs("div",{className:"tpr-row-txt",children:[t.jsxs("div",{className:"tpr-tag",style:{fontFamily:"var(--mono, monospace)",fontSize:10,letterSpacing:"0.32em",color:e.textDim,marginBottom:4},children:[String(o+1).padStart(2,"0")," / ",n.tag]}),t.jsx("div",{style:{fontSize:"clamp(14px, 4cqw, 24px)",fontWeight:750,letterSpacing:"-0.02em",color:e.text,lineHeight:1.05},children:n.title}),t.jsx("div",{style:{fontSize:"clamp(10px, 2.2cqw, 13px)",color:e.textDim,marginTop:6,maxWidth:300,lineHeight:1.55},children:n.body})]})]},n.tag))]})}),w&&t.jsx("div",{ref:u,style:{position:"absolute",top:10,right:14,fontFamily:"var(--mono, monospace)",fontSize:11,letterSpacing:"0.18em",color:e.textDim,pointerEvents:"none"},children:l?"100%":"0%"})]})}export{W as TimelineProgressRail,W as default};
