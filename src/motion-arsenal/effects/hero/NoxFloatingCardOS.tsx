import type { CSSProperties } from 'react';

export type NoxCardStyle = 'glass' | 'obsidian' | 'signal';
export type NoxStageCardVariant = 'auto' | 'radar' | 'score' | 'mutation' | 'timeline' | 'command';

type Props = {
  stageIndex?: number;
  cardStyle?: NoxCardStyle;
  stageCardVariant?: NoxStageCardVariant;
  morphStrength?: number;
  stageSpread?: number;
  glow?: number;
  bloom?: number;
  depth?: number;
};

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const STAGES = [
  { id: 'radar', eyebrow: '01 / SIGNAL CAPTURE', title: 'Incoming signal', value: '24', detail: 'verified inputs', bars: [28, 46, 72, 38] },
  { id: 'score', eyebrow: '02 / QUALIFICATION', title: 'Lead score', value: '86', detail: 'priority: high', bars: [34, 58, 82, 68] },
  { id: 'mutation', eyebrow: '03 / PITCH MUTATION', title: 'Message lift', value: '+31%', detail: 'angle recalibrated', bars: [24, 42, 67, 92] },
  { id: 'timeline', eyebrow: '04 / AGENT FOLLOW-UP', title: 'Next action', value: '09:30', detail: 'follow-up queued', bars: [88, 64, 44, 26] },
  { id: 'command', eyebrow: '05 / OPERATOR COMMAND', title: 'Approval gate', value: 'READY', detail: 'human control active', bars: [42, 58, 74, 94] },
] as const;

const CSS = String.raw`
.nfco-scene{position:absolute;inset:-14%;display:grid;place-items:center;transform-style:preserve-3d;pointer-events:none}
.nfco-stack{position:relative;width:min(100%,420px);aspect-ratio:1.05;transform-style:preserve-3d;transition:transform .72s cubic-bezier(.2,.75,.18,1)}
.nfco-card{position:absolute;left:50%;top:50%;width:74%;height:58%;padding:9%;border:1px solid color-mix(in srgb,var(--pps-accent) 52%,rgba(255,255,255,.14));border-radius:24px;background:linear-gradient(145deg,rgba(255,255,255,.11),rgba(10,12,18,.86) 38%,rgba(4,5,9,.96));box-shadow:inset 0 1px rgba(255,255,255,.13),0 30px 80px rgba(0,0,0,.48),0 0 calc(32px * var(--nfco-bloom)) color-mix(in srgb,var(--pps-accent) 26%,transparent);backdrop-filter:blur(12px);transform-style:preserve-3d;transition:transform .72s cubic-bezier(.2,.75,.18,1),opacity .4s ease,border-color .45s ease,box-shadow .45s ease}
.nfco-scene[data-style='obsidian'] .nfco-card{background:linear-gradient(145deg,#17181d,#08090d 54%,#030407);border-radius:16px}
.nfco-scene[data-style='signal'] .nfco-card{background:linear-gradient(145deg,color-mix(in srgb,var(--pps-accent) 13%,#10131b),rgba(4,6,11,.92));border-radius:30px}
.nfco-card[data-slot='0']{z-index:5;transform:translate3d(-50%,-50%,calc(72px * var(--nfco-depth))) rotateX(2deg) rotateZ(calc((var(--nfco-stage) - 2) * .8deg))}
.nfco-card[data-slot='1']{z-index:4;opacity:.72;transform:translate3d(calc(-50% - 18% * var(--nfco-spread)),calc(-50% - 19% * var(--nfco-spread)),calc(22px * var(--nfco-depth))) rotateZ(-8deg) scale(.78)}
.nfco-card[data-slot='2']{z-index:3;opacity:.54;transform:translate3d(calc(-50% + 25% * var(--nfco-spread)),calc(-50% + 26% * var(--nfco-spread)),calc(-26px * var(--nfco-depth))) rotateZ(9deg) scale(.7)}
.nfco-card[data-slot='3']{z-index:2;opacity:.34;transform:translate3d(calc(-50% + 8% * var(--nfco-spread)),calc(-50% - 34% * var(--nfco-spread)),calc(-58px * var(--nfco-depth))) rotateZ(3deg) scale(.58)}
.nfco-head{display:flex;align-items:center;justify-content:space-between;gap:10px;color:color-mix(in srgb,var(--pps-accent-2) 78%,white);font:700 9px/1.2 var(--mono,monospace);letter-spacing:.16em}
.nfco-live{width:8px;height:8px;border-radius:50%;background:var(--pps-accent-2);box-shadow:0 0 calc(14px * var(--nfco-glow)) var(--pps-accent)}
.nfco-main{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-top:16%}.nfco-title{font-size:clamp(16px,4cqw,28px);font-weight:720;letter-spacing:-.04em}.nfco-value{font:750 clamp(22px,6cqw,42px)/.9 var(--mono,monospace);color:#fff;text-shadow:0 0 calc(20px * var(--nfco-glow)) color-mix(in srgb,var(--pps-accent) 60%,transparent)}
.nfco-detail{margin-top:8px;color:rgba(255,255,255,.48);font:650 9px/1.2 var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase}
.nfco-chart{display:flex;align-items:flex-end;gap:7px;height:24%;margin-top:10%}.nfco-bar{flex:1;min-width:6px;height:var(--bar);border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,var(--pps-accent-2),var(--pps-accent));box-shadow:0 0 12px color-mix(in srgb,var(--pps-accent) 35%,transparent);transform-origin:bottom;transition:height calc(.38s + var(--nfco-morph) * .22s) cubic-bezier(.2,.75,.18,1)}
.nfco-radar{position:absolute;right:8%;top:24%;width:30%;aspect-ratio:1;border:1px solid color-mix(in srgb,var(--pps-accent) 38%,transparent);border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 16%,color-mix(in srgb,var(--pps-accent) 16%,transparent) 17% 18%,transparent 19% 32%)}
.nfco-radar::after{content:'';position:absolute;inset:48% -8% auto 50%;height:1px;background:linear-gradient(90deg,var(--pps-accent-2),transparent);transform-origin:left;transform:rotate(calc(var(--nfco-stage) * 43deg));transition:transform .7s ease}
.nfco-node{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 12px var(--pps-accent)}.nfco-node.a{left:24%;top:31%}.nfco-node.b{right:20%;top:55%}.nfco-node.c{left:42%;bottom:20%}
@media(prefers-reduced-motion:reduce){.nfco-stack,.nfco-card,.nfco-bar,.nfco-radar::after{transition:none!important}}
`;

export function NoxFloatingCardOS({ stageIndex = 0, cardStyle = 'glass', stageCardVariant = 'auto', morphStrength = 1, stageSpread = 1, glow = .6, bloom = .35, depth = 1 }: Props) {
  const override = STAGES.findIndex((stage) => stage.id === stageCardVariant);
  const active = override >= 0 ? override : Math.max(0, Math.min(4, Math.round(stageIndex)));
  const primary = STAGES[active];
  const cards = [primary, STAGES[(active + 4) % 5], STAGES[(active + 1) % 5], STAGES[(active + 2) % 5]];
  const vars: Vars = { '--nfco-stage': active, '--nfco-morph': morphStrength, '--nfco-spread': stageSpread, '--nfco-glow': glow, '--nfco-bloom': bloom, '--nfco-depth': depth };
  return (
    <div className="nfco-scene" data-style={cardStyle} data-stage={primary.id} style={vars} aria-hidden="true">
      <style>{CSS}</style>
      <div className="nfco-stack">
        {cards.map((card, slot) => (
          <div className="nfco-card" data-slot={slot} key={`${card.id}-${slot}`}>
            <div className="nfco-head"><span>{card.eyebrow}</span><i className="nfco-live" /></div>
            {slot === 0 && <div className="nfco-radar"><i className="nfco-node a"/><i className="nfco-node b"/><i className="nfco-node c"/></div>}
            <div className="nfco-main"><strong className="nfco-title">{card.title}</strong><b className="nfco-value">{card.value}</b></div>
            <div className="nfco-detail">{card.detail}</div>
            <div className="nfco-chart">{card.bars.map((height, index) => <i className="nfco-bar" key={index} style={{ '--bar': `${height}%` } as Vars} />)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NoxFloatingCardOS;
