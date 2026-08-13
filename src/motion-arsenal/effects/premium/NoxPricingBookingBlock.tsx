import React, { useMemo } from 'react';

export interface PricingBookingPlan {
  name: string;
  eyebrow?: string;
  priceLabel?: string;
  description?: string;
  features?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  highlighted?: boolean;
}

export interface NoxPricingBookingBlockProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  plans?: PricingBookingPlan[];
  highlightFirst?: boolean;
  showIntro?: boolean;
  compact?: boolean;
  accentColor?: string;
  onPlanSelect?: (plan: PricingBookingPlan, index: number) => void;
}

const DEFAULT_PLANS: PricingBookingPlan[] = [
  {
    name: 'Einstieg',
    eyebrow: 'EMPFOHLENER START',
    priceLabel: 'Preis auf Anfrage',
    description: 'Ein klar abgegrenzter Einstieg mit direktem nächsten Schritt.',
    features: ['Leistungsumfang konfigurieren', 'Zeitrahmen abstimmen', 'Direkter Buchungs-CTA'],
    ctaLabel: 'Termin anfragen',
  },
  {
    name: 'Fokus',
    eyebrow: 'ERWEITERT',
    priceLabel: 'Preis auf Anfrage',
    description: 'Für einen größeren Leistungsumfang mit zusätzlichen Bausteinen.',
    features: ['Modular erweiterbar', 'Individuelle Prioritäten', 'Direkter Buchungs-CTA'],
    ctaLabel: 'Tarif anfragen',
  },
  {
    name: 'Individuell',
    eyebrow: 'CUSTOM',
    priceLabel: 'Preis auf Anfrage',
    description: 'Für Anforderungen, die nicht sauber in ein fixes Paket passen.',
    features: ['Individueller Scope', 'Flexible Zusammenstellung', 'Persönliche Abstimmung'],
    ctaLabel: 'Beratung anfragen',
  },
];

const safeHref = (href?: string) => {
  if (!href) return undefined;
  const value = href.trim();
  if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(value)) return value;
  return undefined;
};

export function NoxPricingBookingBlock({
  eyebrow = 'PREISE & BUCHUNG',
  title = 'Wähle den passenden Einstieg.',
  description = 'Drei klar getrennte Optionen mit einem direkten nächsten Schritt. Inhalte, Preise und Ziele bleiben vollständig konfigurierbar.',
  plans,
  highlightFirst = true,
  showIntro = true,
  compact = false,
  accentColor = '#c93030',
  onPlanSelect,
}: NoxPricingBookingBlockProps) {
  const cards = useMemo(() => {
    const source = plans?.length ? plans.slice(0, 3) : DEFAULT_PLANS;
    return source.map((plan, index) => ({
      ...plan,
      highlighted: plan.highlighted ?? (highlightFirst && index === 0),
    }));
  }, [plans, highlightFirst]);

  return (
    <section
      className={`npbb-stage ${compact ? 'is-compact' : ''}`}
      aria-label="Preis- und Buchungsoptionen"
      style={{ '--npbb-accent': accentColor } as React.CSSProperties}
    >
      <style>{CSS}</style>
      <div className="npbb-shell">
        {showIntro && (
          <header className="npbb-intro">
            <span>{eyebrow}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </header>
        )}

        <div className="npbb-grid">
          {cards.map((plan, index) => {
            const href = safeHref(plan.ctaHref);
            const content = (
              <>
                <span>{plan.ctaLabel ?? 'Anfragen'}</span>
                <span aria-hidden="true">↗</span>
              </>
            );

            return (
              <article
                className={`npbb-card ${plan.highlighted ? 'is-highlighted' : ''}`}
                key={`${plan.name}-${index}`}
              >
                <div className="npbb-card-head">
                  <span className="npbb-kicker">{plan.eyebrow ?? `OPTION ${index + 1}`}</span>
                  <h3>{plan.name}</h3>
                  <strong>{plan.priceLabel ?? 'Preis auf Anfrage'}</strong>
                  {plan.description && <p>{plan.description}</p>}
                </div>

                {!!plan.features?.length && (
                  <ul>
                    {plan.features.slice(0, 6).map((feature) => (
                      <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>
                    ))}
                  </ul>
                )}

                {href ? (
                  <a
                    className="npbb-cta"
                    href={href}
                    onClick={() => onPlanSelect?.(plan, index)}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    className="npbb-cta"
                    type="button"
                    onClick={() => onPlanSelect?.(plan, index)}
                  >
                    {content}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const CSS = String.raw`
.npbb-stage{position:absolute;inset:0;overflow:auto;display:grid;place-items:center;padding:clamp(18px,4vw,58px);background:radial-gradient(circle at 16% 12%,color-mix(in srgb,var(--npbb-accent) 18%,transparent),transparent 34%),radial-gradient(circle at 88% 82%,rgba(255,255,255,.045),transparent 28%),linear-gradient(145deg,#08090c,#030405 72%);color:#f5f2eb;font-family:var(--sans,system-ui,sans-serif)}
.npbb-shell{width:min(1180px,100%);display:grid;gap:clamp(24px,4vw,46px)}
.npbb-intro{max-width:760px;display:grid;gap:12px}.npbb-intro>span,.npbb-kicker{font:700 10px/1 var(--mono,monospace);letter-spacing:.2em;color:color-mix(in srgb,var(--npbb-accent) 68%,white)}.npbb-intro h2{margin:0;font-size:clamp(30px,5vw,64px);line-height:.96;letter-spacing:-.055em}.npbb-intro p{max-width:64ch;margin:0;color:rgba(255,255,255,.56);font-size:clamp(13px,1.5vw,16px);line-height:1.6}
.npbb-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:stretch}.npbb-card{position:relative;min-width:0;min-height:430px;padding:clamp(22px,3vw,34px);display:flex;flex-direction:column;gap:28px;border:1px solid rgba(255,255,255,.1);border-radius:26px;background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.018));box-shadow:0 24px 70px rgba(0,0,0,.22);overflow:hidden}.npbb-card::before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(120deg,rgba(255,255,255,.07),transparent 24%,transparent 72%,rgba(255,255,255,.025));opacity:.55}.npbb-card.is-highlighted{border-color:color-mix(in srgb,var(--npbb-accent) 64%,white 8%);background:linear-gradient(160deg,color-mix(in srgb,var(--npbb-accent) 14%,#111216),rgba(255,255,255,.022));box-shadow:0 28px 90px color-mix(in srgb,var(--npbb-accent) 16%,transparent),0 24px 70px rgba(0,0,0,.3)}.npbb-card.is-highlighted::after{content:'START';position:absolute;top:18px;right:18px;padding:7px 9px;border:1px solid color-mix(in srgb,var(--npbb-accent) 46%,white 12%);border-radius:999px;background:color-mix(in srgb,var(--npbb-accent) 12%,#090a0c);font:700 8px/1 var(--mono,monospace);letter-spacing:.16em;color:#fff}
.npbb-card-head{position:relative;z-index:1;display:grid;gap:10px}.npbb-card-head h3{margin:8px 0 0;font-size:clamp(26px,3vw,40px);line-height:1;letter-spacing:-.045em}.npbb-card-head strong{font-size:clamp(18px,2vw,24px);line-height:1.1;letter-spacing:-.03em;color:#fff}.npbb-card-head p{min-height:3.2em;margin:2px 0 0;color:rgba(255,255,255,.52);font-size:13px;line-height:1.6}.npbb-card ul{position:relative;z-index:1;margin:0;padding:18px 0 0;display:grid;gap:11px;border-top:1px solid rgba(255,255,255,.08);list-style:none}.npbb-card li{display:grid;grid-template-columns:18px 1fr;gap:8px;align-items:start;color:rgba(255,255,255,.72);font-size:12px;line-height:1.45}.npbb-card li span{color:color-mix(in srgb,var(--npbb-accent) 62%,white)}
.npbb-cta{position:relative;z-index:1;margin-top:auto;min-height:48px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.045);color:#fff;text-decoration:none;font:700 11px/1 var(--mono,monospace);letter-spacing:.08em;cursor:pointer;transition:transform .2s ease,border-color .2s ease,background .2s ease}.npbb-card.is-highlighted .npbb-cta{border-color:color-mix(in srgb,var(--npbb-accent) 64%,white 8%);background:var(--npbb-accent)}.npbb-cta:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.32)}.npbb-cta:focus-visible{outline:2px solid #fff;outline-offset:3px}
.npbb-stage.is-compact .npbb-intro{display:none}.npbb-stage.is-compact .npbb-card{min-height:360px}
@media(max-width:820px){.npbb-stage{place-items:start center}.npbb-grid{grid-template-columns:1fr}.npbb-card{min-height:auto}.npbb-card.is-highlighted{order:-1}.npbb-card-head p{min-height:0}.npbb-cta{min-height:52px}}
@media(max-width:520px){.npbb-stage{padding:14px}.npbb-shell{gap:24px}.npbb-card{padding:22px;border-radius:20px}.npbb-card.is-highlighted::after{top:14px;right:14px}.npbb-intro h2{font-size:36px}}
@media(prefers-reduced-motion:reduce){.npbb-cta{transition:none}.npbb-cta:hover{transform:none}}
`;

export default NoxPricingBookingBlock;
