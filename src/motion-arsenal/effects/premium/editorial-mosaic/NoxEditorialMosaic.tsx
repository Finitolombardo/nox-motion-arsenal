import { useMemo, type CSSProperties } from 'react';

export type NoxEditorialMosaicVariant = 'atelier' | 'hospitality' | 'portfolio';
export type NoxEditorialMosaicMotion = 'subtle' | 'still';

export interface NoxEditorialMosaicItem {
  id: string;
  src: string;
  alt: string;
  label?: string;
  objectPosition?: string;
}

export interface NoxEditorialMosaicProps {
  items?: NoxEditorialMosaicItem[];
  variant?: NoxEditorialMosaicVariant;
  eyebrow?: string;
  headline?: string;
  supportingText?: string;
  wordmark?: string;
  showWordmark?: boolean;
  showLabels?: boolean;
  gap?: number;
  radius?: number;
  motion?: NoxEditorialMosaicMotion;
}

type Palette = readonly [string, string, string];

const escapeXml = (value: string) =>
  value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    };
    return entities[character] ?? character;
  });

const makeArtwork = (label: string, palette: Palette, index: number) => {
  const safeLabel = escapeXml(label.toUpperCase());
  const [base, mid, light] = palette;
  const x = 180 + index * 92;
  const y = 140 + (index % 3) * 72;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1000">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="${base}"/>
        <stop offset=".52" stop-color="${mid}"/>
        <stop offset="1" stop-color="${light}"/>
      </linearGradient>
      <radialGradient id="sun" cx="72%" cy="22%" r="52%">
        <stop stop-color="#fff8df" stop-opacity=".86"/>
        <stop offset=".46" stop-color="#fff4d4" stop-opacity=".18"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency=".78" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .055 0"/>
      </filter>
    </defs>
    <rect width="1400" height="1000" fill="url(#g)"/>
    <rect width="1400" height="1000" fill="url(#sun)"/>
    <path d="M0 710 C260 610 410 735 680 628 S1120 470 1400 560 V1000 H0Z" fill="#fff8ec" fill-opacity=".2"/>
    <rect x="${x}" y="${y}" width="510" height="470" rx="26" fill="#fffdf8" fill-opacity=".12" stroke="#fff" stroke-opacity=".18"/>
    <path d="M${x + 62} ${y + 425} V${y + 110} H${x + 440}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="4"/>
    <path d="M${x + 180} ${y + 425} V${y + 196} M${x + 304} ${y + 425} V${y + 154}" stroke="#241c16" stroke-opacity=".16" stroke-width="9"/>
    <ellipse cx="${1000 - index * 36}" cy="${670 - index * 18}" rx="240" ry="74" fill="#211912" fill-opacity=".13"/>
    <circle cx="${1040 - index * 28}" cy="${510 - index * 12}" r="132" fill="#f5e8ce" fill-opacity=".25"/>
    <rect width="1400" height="1000" filter="url(#grain)"/>
    <text x="58" y="934" fill="#fff" fill-opacity=".42" font-family="Arial, sans-serif" font-size="18" letter-spacing="8">${safeLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const PALETTES: Record<NoxEditorialMosaicVariant, Palette> = {
  atelier: ['#5a4938', '#b49b7d', '#e8dbc4'],
  hospitality: ['#241914', '#815846', '#d4ab7d'],
  portfolio: ['#11151c', '#39485d', '#a1adba'],
};

const LABELS: Record<NoxEditorialMosaicVariant, string[]> = {
  atelier: ['The room', 'Material', 'Quiet', 'Movement', 'Reception'],
  hospitality: ['Arrival', 'Suite', 'Table', 'Ritual', 'Evening'],
  portfolio: ['Identity', 'Interface', 'Detail', 'System', 'Launch'],
};

const PRESETS: Record<NoxEditorialMosaicVariant, NoxEditorialMosaicItem[]> = Object.fromEntries(
  (Object.keys(PALETTES) as NoxEditorialMosaicVariant[]).map((variant) => [
    variant,
    LABELS[variant].map((label, index) => ({
      id: `${variant}-${index + 1}`,
      src: makeArtwork(label, PALETTES[variant], index),
      alt: `${label} editorial placeholder artwork`,
      label,
    })),
  ]),
) as Record<NoxEditorialMosaicVariant, NoxEditorialMosaicItem[]>;

const SLOT_CLASSES = ['is-hero', 'is-top-a', 'is-top-b', 'is-wide', 'is-band'] as const;

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function NoxEditorialMosaic({
  items,
  variant = 'atelier',
  eyebrow = 'BRAND WORLD',
  headline = 'A world in composition.',
  supportingText = 'Large-format imagery is composed into one deliberate editorial field instead of a generic card grid.',
  wordmark = 'NOX',
  showWordmark = true,
  showLabels = true,
  gap = 3,
  radius = 0,
  motion = 'subtle',
}: NoxEditorialMosaicProps) {
  const resolvedItems = useMemo(() => {
    const preset = PRESETS[variant];
    if (!items?.length) return preset;
    return Array.from({ length: 5 }, (_, index) => items[index] ?? preset[index]);
  }, [items, variant]);

  const style = {
    '--nem-gap': `${clampNumber(gap, 0, 18)}px`,
    '--nem-radius': `${clampNumber(radius, 0, 28)}px`,
  } as CSSProperties;

  return (
    <section
      className={`nem ${motion === 'still' ? 'is-still' : 'has-motion'}`}
      style={style}
      aria-label={`${headline} editorial mosaic`}
      data-variant={variant}
    >
      <style>{CSS}</style>

      <div className="nem-shell">
        <header className="nem-header">
          <span className="nem-eyebrow">{eyebrow}</span>
          <h2>{headline}</h2>
          {supportingText && <p>{supportingText}</p>}
        </header>

        <div className="nem-grid">
          {resolvedItems.map((item, index) => (
            <figure key={item.id} className={`nem-tile ${SLOT_CLASSES[index]}`} style={{ '--nem-index': index } as CSSProperties}>
              <img
                src={item.src}
                alt={item.alt}
                draggable={false}
                loading={index < 2 ? 'eager' : 'lazy'}
                decoding="async"
                style={{ objectPosition: item.objectPosition ?? 'center' }}
              />
              <span className="nem-scrim" aria-hidden="true" />
              {index === 0 && showWordmark && wordmark && <span className="nem-wordmark" aria-hidden="true">{wordmark}</span>}
              {showLabels && item.label && <figcaption>{item.label}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const CSS = String.raw`
.nem{position:absolute;inset:0;overflow:hidden;padding:clamp(18px,3.4vw,46px);background:#f3eee5;color:#251f1a;font-family:var(--sans,Inter,system-ui,sans-serif);container-type:size}.nem-shell{width:min(1380px,100%);height:100%;margin:auto;display:grid;grid-template-rows:auto minmax(0,1fr);gap:clamp(16px,2.4cqh,28px);min-height:0}.nem-header{text-align:center;justify-self:center;max-width:min(760px,88%)}.nem-eyebrow{display:block;margin-bottom:9px;color:#8d7158;font:700 clamp(8px,1.05cqw,10px)/1 var(--mono,ui-monospace,monospace);letter-spacing:.32em}.nem-header h2{margin:0;font-family:var(--serif,Georgia,'Times New Roman',serif);font-weight:400;font-size:clamp(26px,4.8cqw,62px);line-height:1;letter-spacing:-.035em}.nem-header p{max-width:58ch;margin:12px auto 0;color:rgba(70,55,44,.62);font-size:clamp(10px,1.25cqw,14px);line-height:1.55}.nem-grid{min-height:0;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.54fr) minmax(0,.54fr);grid-template-rows:minmax(0,1fr) minmax(0,1fr) minmax(0,.72fr);grid-template-areas:'hero top-a top-b' 'hero wide wide' 'band band band';gap:var(--nem-gap);background:rgba(64,49,38,.08);overflow:hidden;border-radius:var(--nem-radius)}.nem-tile{position:relative;min-width:0;min-height:0;margin:0;overflow:hidden;isolation:isolate;background:#a9947e;border-radius:var(--nem-radius)}.nem-tile.is-hero{grid-area:hero}.nem-tile.is-top-a{grid-area:top-a}.nem-tile.is-top-b{grid-area:top-b}.nem-tile.is-wide{grid-area:wide}.nem-tile.is-band{grid-area:band}.nem-tile img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.012);filter:saturate(.88) contrast(.96) brightness(.97);transition:transform .85s cubic-bezier(.16,1,.3,1),filter .6s ease;-webkit-user-drag:none;user-select:none}.nem-tile:hover img{transform:scale(1.035);filter:saturate(.98) contrast(1) brightness(1)}.nem-scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,transparent 42%,rgba(24,18,14,.06) 68%,rgba(24,18,14,.46) 100%);pointer-events:none}.nem-wordmark{position:absolute;z-index:2;left:50%;top:52%;transform:translate(-50%,-50%);max-width:82%;color:rgba(255,251,243,.9);font-family:var(--serif,Georgia,'Times New Roman',serif);font-size:clamp(42px,8.6cqw,122px);font-weight:400;line-height:.82;letter-spacing:.08em;text-transform:uppercase;text-shadow:0 1px 16px rgba(30,22,16,.08);white-space:nowrap;pointer-events:none}.nem-tile figcaption{position:absolute;z-index:3;left:clamp(10px,1.35cqw,18px);bottom:clamp(9px,1.2cqh,15px);color:rgba(255,255,255,.88);font:700 clamp(7px,.9cqw,10px)/1 var(--mono,ui-monospace,monospace);letter-spacing:.22em;text-transform:uppercase;text-shadow:0 1px 12px rgba(0,0,0,.3)}.has-motion .nem-tile{animation:nem-in .78s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(var(--nem-index) * 70ms)}@keyframes nem-in{from{opacity:0;transform:translateY(12px) scale(.99)}to{opacity:1;transform:none}}.is-still .nem-tile,.is-still .nem-tile img{animation:none!important;transition:none!important}.is-still .nem-tile:hover img{transform:scale(1.012);filter:saturate(.88) contrast(.96) brightness(.97)}
@container (max-width:900px){.nem{overflow:auto}.nem-shell{height:auto;min-height:100%}.nem-grid{height:auto;grid-template-columns:1.15fr .85fr;grid-template-rows:280px 280px 230px 210px;grid-template-areas:'hero top-a' 'hero top-b' 'wide wide' 'band band'}.nem-header{padding-top:6px}}
@container (max-width:620px){.nem{padding:18px;overflow:auto}.nem-shell{gap:18px}.nem-header{max-width:100%;text-align:left;justify-self:stretch}.nem-header p{margin-left:0;margin-right:0}.nem-grid{grid-template-columns:1fr 1fr;grid-template-rows:330px 190px 220px 170px;grid-template-areas:'hero hero' 'top-a top-b' 'wide wide' 'band band'}.nem-wordmark{font-size:clamp(48px,18cqw,76px)}.nem-tile figcaption{font-size:8px}.nem-tile:hover img{transform:scale(1.012)}}
@media(prefers-reduced-motion:reduce){.nem-tile,.nem-tile img{animation:none!important;transition:none!important}.nem-tile:hover img{transform:scale(1.012)}}
`;

export default NoxEditorialMosaic;
