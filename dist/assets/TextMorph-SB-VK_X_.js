import{r as m,j as e}from"./index-CfWFdp0n.js";function T(n){if(Array.isArray(n)&&n.length===4)return`cubic-bezier(${n.join(",")})`;switch(n){case"linear":return"linear";case"easeIn":return"ease-in";case"easeOut":return"ease-out";case"easeInOut":return"ease-in-out";case"circIn":return"cubic-bezier(0.6, 0.04, 0.98, 0.335)";case"circOut":return"cubic-bezier(0.075, 0.82, 0.165, 1)";case"circInOut":return"cubic-bezier(0.785, 0.135, 0.15, 0.86)";case"backIn":return"cubic-bezier(0.6, -0.28, 0.735, 0.045)";case"backOut":return"cubic-bezier(0.175, 0.885, 0.32, 1.275)";case"backInOut":return"cubic-bezier(0.68, -0.55, 0.265, 1.55)";default:return"ease-in-out"}}function G(n){const{words:c=`DESIGN
CODE
MOTION
SHIP`,color:l="#ffffff",fontSize:x=64,fontFamily:y="Inter",fontWeight:b=700,textAlign:g="center",morphDuration:I=1,holdDuration:j=1,ease:$="easeInOut",tag:S="div",style:w}=n,i=Math.max(.1,I),s=Math.max(0,j),v=T($),O=S,a=m.useMemo(()=>c.split(/\r?\n|,/).map(t=>t.trim()).filter(Boolean),[c]),u=m.useId().replace(/[:]/g,""),f=`tm-thr-${u}`,p=`tm-rot-${u}`,C=Math.max(1,a.length),h=i+s,d=h*C,o=t=>Math.min(100,t/d*100).toFixed(4),z=o(i),M=o(i+s),k=o(2*i+s),E=`
@keyframes ${p} {
  0% {
    opacity: 0;
    filter: blur(20px);
    transform: translate(-50%, -50%) scale(0.8);
  }
  ${z}% {
    opacity: 1;
    filter: blur(0px);
    transform: translate(-50%, -50%) scale(1);
  }
  ${M}% {
    opacity: 1;
    filter: blur(0px);
    transform: translate(-50%, -50%) scale(1);
  }
  ${k}%, 100% {
    opacity: 0;
    filter: blur(20px);
    transform: translate(-50%, -50%) scale(1.2);
  }
}
`,D={fontFamily:y,fontSize:x,fontWeight:b},H=a.reduce((t,r)=>r.length>t.length?r:t,"");return e.jsxs(O,{style:{position:"relative",width:"100%",height:"100%",display:"flex",justifyContent:"center",alignItems:"center",overflow:"hidden",userSelect:"none",...w||{}},children:[e.jsx("style",{children:E}),e.jsx("svg",{style:{position:"absolute",width:0,height:0,pointerEvents:"none"},"aria-hidden":!0,children:e.jsx("defs",{children:e.jsxs("filter",{id:f,children:[e.jsx("feColorMatrix",{in:"SourceGraphic",type:"matrix",values:`1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 25 -9`,result:"goo"}),e.jsx("feComposite",{in:"SourceGraphic",in2:"goo",operator:"atop"})]})})}),e.jsx("div",{style:{position:"relative",filter:`url(#${f})`,width:"100%",height:"100%",display:"flex",justifyContent:"center",alignItems:"center",textAlign:g,color:l,...D},children:e.jsxs("div",{style:{position:"relative",display:"inline-flex",justifyContent:"center",alignItems:"center",lineHeight:1.2,minHeight:"1.2em"},children:[e.jsx("span",{style:{visibility:"hidden",whiteSpace:"nowrap",display:"inline-block"},children:H||" "}),a.map((t,r)=>e.jsx("span",{style:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",opacity:0,color:l,whiteSpace:"nowrap",animation:`${p} ${d}s ${(h*r).toFixed(3)}s infinite ${v}`,willChange:"opacity, filter, transform"},children:t},`${t}-${r}`))]})})]})}export{G as default};
