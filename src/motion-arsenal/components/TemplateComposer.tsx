import React, { useMemo, useState } from 'react';
import type { EffectEntry, EffectTemplateRole, EffectTemplateSurface, NicheId } from '../types';
import { NICHE_IDS, NICHE_LABELS } from '../data/coreCanon';
import {
  buildBlueprint,
  composeTemplate,
  ROLE_LABELS,
  runtimeBudget,
} from '../lib/templateComposer';
import { buildTemplateBlueprintV1, stableStringify } from '../lib/canonExports';
import { CopyButton } from './CopyButton';

/**
 * Template Composer.
 *
 * Fills one slot per role with the best-scoring canonical core for the chosen
 * surface and niche, shows why it won, and keeps a slot OPEN when nothing
 * genuinely fits. The runtime budget is a structural weight sum — never a
 * fabricated frame rate.
 */
export function TemplateComposer({
  catalog,
  onOpenCore,
}: {
  catalog: readonly EffectEntry[];
  onOpenCore: (id: string) => void;
}) {
  const [surface, setSurface] = useState<EffectTemplateSurface>('website');
  const [niche, setNiche] = useState<NicheId>('saas');
  const [pinned, setPinned] = useState<Partial<Record<EffectTemplateRole, string>>>({});

  const slots = useMemo(
    () => composeTemplate(catalog, surface, niche, pinned),
    [catalog, surface, niche, pinned],
  );
  const budget = useMemo(() => runtimeBudget(slots, surface), [slots, surface]);

  const swap = (role: EffectTemplateRole, coreId: string) => {
    setPinned((current) => ({ ...current, [role]: coreId }));
  };

  return (
    <div className="template-composer" data-testid="template-composer">
      <header className="section-header">
        <p className="kicker">Canonical cores only</p>
        <h1>Templates</h1>
        <p>A role-complete motion blueprint for one surface and one niche, with the runtime cost it implies.</p>
      </header>

      <div className="composer-controls">
        <div className="chip-row" role="tablist" aria-label="Surface">
          {(['website', 'dashboard'] as EffectTemplateSurface[]).map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={surface === id}
              className={`chip ${surface === id ? 'on' : ''}`}
              data-surface={id}
              onClick={() => { setSurface(id); setPinned({}); }}
            >
              {id.toUpperCase()}
            </button>
          ))}
        </div>
        <label className="composer-niche">
          <span>NICHE</span>
          <select
            data-testid="composer-niche"
            value={niche}
            onChange={(event) => { setNiche(event.target.value as NicheId); setPinned({}); }}
          >
            {NICHE_IDS.map((id) => <option key={id} value={id}>{NICHE_LABELS[id]}</option>)}
          </select>
        </label>
      </div>

      {/* ---- RUNTIME BUDGET ------------------------------------------------ */}
      <section className="runtime-budget" data-testid="runtime-budget" aria-label="Runtime budget">
        <div className={`budget-cell ${budget.runtime > budget.runtimeMax ? 'over' : ''}`}>
          <span className="budget-cell__label">RUNTIME</span>
          <span className="budget-cell__value" data-testid="budget-runtime">{budget.runtime} / {budget.runtimeMax}</span>
        </div>
        <div className={`budget-cell ${budget.heavy > budget.heavyMax ? 'over' : ''}`}>
          <span className="budget-cell__label">HEAVY</span>
          <span className="budget-cell__value" data-testid="budget-heavy">{budget.heavy} / {budget.heavyMax}</span>
        </div>
        <div className={`budget-cell ${budget.gpu > budget.gpuMax ? 'over' : ''}`}>
          <span className="budget-cell__label">GPU</span>
          <span className="budget-cell__value" data-testid="budget-gpu">{budget.gpu} / {budget.gpuMax}</span>
        </div>
        <div className="budget-cell">
          <span className="budget-cell__label">CLICK-TO-RUN</span>
          <span className="budget-cell__value">{budget.clickToRun}</span>
        </div>
        <div className="budget-cell">
          <span className="budget-cell__label">FULL BLEED</span>
          <span className="budget-cell__value">{budget.fullBleed}</span>
        </div>
        <p className="runtime-budget__note">
          Structural weights per runtime tier — not measured frame rates.
          {budget.mobileRisk.length ? ` Mobile risk: ${budget.mobileRisk.join('; ')}.` : ' No mobile risk flagged.'}
        </p>
      </section>

      {/* ---- SLOTS ---------------------------------------------------------- */}
      <div className="slot-list">
        {slots.map((slot) => (
          <section
            key={slot.role}
            className={`slot ${slot.chosen ? '' : 'slot--open'}`}
            data-role={slot.role}
            data-slot-state={slot.chosen ? 'filled' : 'open'}
          >
            <header className="slot__header">
              <h2>{ROLE_LABELS[slot.role]}</h2>
              {slot.chosen ? (
                <span className={`core-tier core-tier--${slot.chosen.core.runtimeTier}`}>
                  {slot.chosen.core.runtimeTier.toUpperCase()} · cost {slot.chosen.cost}
                </span>
              ) : (
                <span className="slot__open-badge">OPEN SLOT</span>
              )}
            </header>

            {slot.chosen ? (
              <>
                <button
                  type="button"
                  className="slot__core"
                  data-core-id={slot.chosen.core.id}
                  onClick={() => onOpenCore(slot.chosen!.core.id)}
                >
                  <span className="slot__core-name">{slot.chosen.entry.meta.displayName ?? slot.chosen.entry.meta.name}</span>
                  <span className="slot__core-preset">
                    {slot.chosen.preset ? slot.chosen.preset.label : 'core defaults'}
                  </span>
                  <span className="slot__core-score">score {slot.chosen.score}</span>
                </button>
                <ul className="slot__reasons">
                  {slot.chosen.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              </>
            ) : (
              <p className="slot__open-reason">{slot.openReason}</p>
            )}

            {slot.alternatives.length > 0 && (
              <div className="slot__alternatives">
                <span className="slot__alternatives-label">Alternatives</span>
                {slot.alternatives.map((alt) => (
                  <button
                    key={alt.core.id}
                    type="button"
                    className="chip"
                    data-alternative-id={alt.core.id}
                    onClick={() => swap(slot.role, alt.core.id)}
                  >
                    {alt.entry.meta.displayName ?? alt.entry.meta.name} · {alt.score}
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="section-toolbar">
        <CopyButton
          text={() => stableStringify(buildTemplateBlueprintV1(surface, niche, slots, budget))}
          label={surface === 'website' ? 'COPY WEB BLUEPRINT' : 'COPY DASH BLUEPRINT'}
          testId="copy-blueprint"
        />
        <CopyButton
          text={() => buildBlueprint(surface, niche, slots, budget)}
          label="COPY BLUEPRINT NOTES"
          testId="copy-blueprint-notes"
        />
        {Object.keys(pinned).length > 0 && (
          <button type="button" className="copy-btn" onClick={() => setPinned({})}>RESET SWAPS</button>
        )}
      </div>
    </div>
  );
}
