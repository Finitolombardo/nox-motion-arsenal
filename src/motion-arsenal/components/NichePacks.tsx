import React, { useMemo, useState } from 'react';
import type { EffectEntry, NicheId } from '../types';
import { CORE_CANON_BY_ID, coreNichePresets, coresForNiche, NICHE_IDS, NICHE_LABELS } from '../data/coreCanon';
import { buildNichePack } from '../lib/templateComposer';
import { resolveCoreState } from '../lib/coreState';
import { EffectPreview } from './EffectPreview';
import { IncrementalGrid } from './IncrementalGrid';
import { CopyButton } from './CopyButton';

/**
 * Niche Packs.
 *
 * Every card renders with the niche's real preset applied — not the core
 * default with a niche label stuck on it. A core only appears here if it
 * actually carries a curated preset for the selected niche.
 */
export function NichePacks({
  catalog,
  onOpenCore,
}: {
  catalog: readonly EffectEntry[];
  onOpenCore: (id: string, presetId: string) => void;
}) {
  const [niche, setNiche] = useState<NicheId>('saas');
  const entryById = useMemo(() => new Map(catalog.map((entry) => [entry.meta.id, entry])), [catalog]);

  const cards = useMemo(() => {
    return coresForNiche(niche)
      .map((core) => {
        const entry = entryById.get(core.id);
        if (!entry) return null;
        const presets = coreNichePresets(core.id);
        const preset = presets.find((item) => item.niche === niche);
        if (!preset) return null;
        // The preview must show the curated state, so the preset is resolved
        // through the same precedence the Core Builder uses.
        const resolved = resolveCoreState(entry.meta, core, {
          mode: null, presetId: preset.id, profileId: null, overrides: {},
        }, presets);
        return { core, entry, preset, values: resolved.values };
      })
      .filter((card): card is NonNullable<typeof card> => Boolean(card))
      .sort((a, b) => b.core.templatePriority - a.core.templatePriority);
  }, [niche, entryById]);

  return (
    <div className="niche-packs" data-testid="niche-packs">
      <header className="section-header">
        <p className="kicker">Canonical cores only</p>
        <h1>Niche Packs</h1>
        <p>Each pack is the set of canonical cores that carry a curated preset for that niche, previewed in that exact state.</p>
      </header>

      <div className="niche-picker" role="tablist" aria-label="Niche">
        {NICHE_IDS.map((id) => {
          const count = coresForNiche(id).length;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={niche === id}
              className={`niche-chip ${niche === id ? 'on' : ''}`}
              data-niche={id}
              onClick={() => setNiche(id)}
            >
              <span>{NICHE_LABELS[id]}</span>
              <span className="niche-chip__count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="section-toolbar">
        <p className="result-count" data-testid="niche-pack-count">
          {cards.length} CANONICAL CORES · {NICHE_LABELS[niche].toUpperCase()}
        </p>
        <CopyButton text={() => buildNichePack(niche, catalog)} label="COPY NICHE PACK" testId="copy-niche-pack" />
      </div>

      <IncrementalGrid
        items={cards}
        getKey={(card) => card.core.id}
        label={`Niche pack ${niche}`}
        emptyState={
          <div className="fallback-note" style={{ position: 'static', padding: 48 }}>
            NO CANONICAL CORE IS CURATED FOR THIS NICHE YET
          </div>
        }
        render={(card) => (
          <article
            className="core-card niche-card"
            data-effect-id={card.core.id}
            data-preset-id={card.preset.id}
            role="link"
            tabIndex={0}
            onClick={() => onOpenCore(card.core.id, card.preset.id)}
            onKeyDown={(event) => { if (event.key === 'Enter') onOpenCore(card.core.id, card.preset.id); }}
          >
            <div className="core-card__preview">
              <EffectPreview entry={card.entry} propValues={card.values} interactive={false} variant="thumbnail" />
            </div>
            <div className="core-card__body">
              <div className="core-card__heading">
                <h3 className="core-card__title">{card.entry.meta.displayName ?? card.entry.meta.name}</h3>
                <span className="core-card__role">{card.core.role}</span>
              </div>
              <p className="core-card__summary">{card.preset.description}</p>
              <div className="core-card__footer">
                <span className={`core-tier core-tier--${card.core.runtimeTier}`}>{card.core.runtimeTier.toUpperCase()}</span>
                <span className="core-status is-preset">{card.preset.label}</span>
              </div>
            </div>
          </article>
        )}
      />
    </div>
  );
}

export function nicheCoreCount(niche: NicheId): number {
  return coresForNiche(niche).filter((core) => CORE_CANON_BY_ID.has(core.id)).length;
}
