import React from 'react';
import type { CoreCanonEntry, EffectEntry } from '../types';
import { coreNichePresets } from '../data/coreCanon';
import { EffectPreview } from './EffectPreview';

const TIER_LABEL: Record<CoreCanonEntry['runtimeTier'], string> = {
  light: 'LIGHT',
  standard: 'STANDARD',
  heavy: 'HEAVY',
  gpu: 'GPU',
};

/**
 * Canonical core card.
 *
 * Leads with what the core *does* and what it can be configured into — modes,
 * modules, presets. The legacy history is one quiet line at the bottom: it is
 * why the fusion is valuable, but it is not what the operator is shopping for.
 */
export function CoreCard({
  entry,
  core,
  favorite,
  onOpen,
  onToggleFavorite,
}: {
  entry: EffectEntry;
  core: CoreCanonEntry;
  favorite: boolean;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const m = entry.meta;
  const presets = coreNichePresets(core.id);
  const modeCount = core.modes?.length ?? 0;
  const moduleCount = core.modules?.length ?? 0;

  return (
    <article
      className="core-card"
      data-effect-id={m.id}
      data-core-runtime={core.runtimeTier}
      onClick={() => onOpen(m.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpen(m.id);
      }}
      role="link"
      tabIndex={0}
    >
      <div className="core-card__preview">
        <EffectPreview entry={entry} interactive={false} variant="thumbnail" />
        <button
          type="button"
          className={`favorite-btn ${favorite ? 'on' : ''}`}
          aria-label={`${m.displayName ?? m.name} ${favorite ? 'aus Favoriten entfernen' : 'als Favorit markieren'}`}
          aria-pressed={favorite}
          data-favorite-effect={m.id}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(m.id);
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <span aria-hidden="true">{favorite ? '♥' : '♡'}</span>
        </button>
      </div>

      <div className="core-card__body">
        <div className="core-card__heading">
          <h3 className="core-card__title">{m.displayName ?? m.name}</h3>
          <span className="core-card__role">{core.role}</span>
        </div>
        <p className="core-card__summary">{core.summary}</p>

        <dl className="core-card__stats">
          <div><dt>Modes</dt><dd data-testid="core-mode-count">{modeCount || '—'}</dd></div>
          <div><dt>Modules</dt><dd data-testid="core-module-count">{moduleCount || '—'}</dd></div>
          <div><dt>Presets</dt><dd data-testid="core-preset-count">{presets.length || '—'}</dd></div>
        </dl>

        <div className="core-card__footer">
          <span className={`core-tier core-tier--${core.runtimeTier}`}>{TIER_LABEL[core.runtimeTier]}</span>
          <span className={`core-status ${m.productionSafe ? 'is-production' : 'is-candidate'}`}>
            {m.productionSafe ? 'PRODUCTION' : (m.status ?? 'CANDIDATE').toUpperCase()}
          </span>
          {core.absorbs.length > 0 && (
            <span className="core-card__absorbs" title={core.absorbs.join(', ')}>
              Absorbs {core.absorbs.length} legacy {core.absorbs.length === 1 ? 'effect' : 'effects'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
