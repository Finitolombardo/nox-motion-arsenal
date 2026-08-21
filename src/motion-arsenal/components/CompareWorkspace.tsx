import React, { useMemo, useState } from 'react';
import type { EffectEntry, NicheId } from '../types';
import { CORE_CANON, CORE_CANON_BY_ID, coreNichePresets, NICHE_LABELS } from '../data/coreCanon';
import { comparisonFacts, semanticDiff } from '../lib/compareDiff';
import { resolveCoreState } from '../lib/coreState';
import { EffectPreview } from './EffectPreview';

const MAX_SELECTION = 4;

const FACT_ROWS: Array<{ key: keyof ReturnType<typeof comparisonFacts>; label: string }> = [
  { key: 'mechanism', label: 'Mechanism' },
  { key: 'modes', label: 'Modes' },
  { key: 'modules', label: 'Modules' },
  { key: 'nichePresets', label: 'Niche presets' },
  { key: 'runtimeTier', label: 'Runtime' },
  { key: 'performanceNotes', label: 'Performance' },
  { key: 'mobileNotes', label: 'Mobile' },
  { key: 'reducedMotionNotes', label: 'Reduced motion' },
  { key: 'dependencies', label: 'Dependencies' },
  { key: 'absorbed', label: 'Legacy absorbed' },
  { key: 'templateRoles', label: 'Template roles' },
];

const PROVENANCE_ROWS: Array<{ key: keyof ReturnType<typeof comparisonFacts>; label: string }> = [
  { key: 'sourceWebsite', label: 'Source website' },
  { key: 'sourceFiles', label: 'Source files' },
  { key: 'version', label: 'Version' },
  { key: 'improvementChangelog', label: 'Improvement history' },
];

function renderFact(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

/**
 * Compare workspace.
 *
 * Two to four canonical cores side by side on the facts that decide a choice,
 * plus a semantic diff between two presets of one core — "Intensity: much
 * lower" rather than two raw JSON blobs.
 */
export function CompareWorkspace({
  catalog,
  selection,
  onSelectionChange,
}: {
  catalog: readonly EffectEntry[];
  selection: string[];
  onSelectionChange: (next: string[]) => void;
}) {
  const entryById = useMemo(() => new Map(catalog.map((entry) => [entry.meta.id, entry])), [catalog]);
  const selected = selection
    .map((id) => ({ entry: entryById.get(id), core: CORE_CANON_BY_ID.get(id) }))
    .filter((item): item is { entry: EffectEntry; core: NonNullable<typeof item.core> } => Boolean(item.entry && item.core));

  const [diffCoreId, setDiffCoreId] = useState<string>(selection[0] ?? '');
  const diffCore = CORE_CANON_BY_ID.get(diffCoreId);
  const diffEntry = entryById.get(diffCoreId);
  const diffPresets = diffCore ? coreNichePresets(diffCore.id) : [];
  const [leftNiche, setLeftNiche] = useState<NicheId | ''>('');
  const [rightNiche, setRightNiche] = useState<NicheId | ''>('');

  const diffRows = useMemo(() => {
    if (!diffCore || !diffEntry || !leftNiche || !rightNiche) return [];
    const left = diffPresets.find((p) => p.niche === leftNiche);
    const right = diffPresets.find((p) => p.niche === rightNiche);
    if (!left || !right) return [];
    const resolve = (presetId: string) => resolveCoreState(diffEntry.meta, diffCore, {
      mode: null, presetId, profileId: null, overrides: {},
    }, diffPresets).values;
    return semanticDiff(diffEntry.meta, resolve(left.id), resolve(right.id));
  }, [diffCore, diffEntry, diffPresets, leftNiche, rightNiche]);

  const toggle = (id: string) => {
    if (selection.includes(id)) onSelectionChange(selection.filter((item) => item !== id));
    else if (selection.length < MAX_SELECTION) onSelectionChange([...selection, id]);
  };

  return (
    <div className="compare-workspace" data-testid="compare-workspace">
      <header className="section-header">
        <p className="kicker">Canonical cores only</p>
        <h1>Compare</h1>
        <p>Pick two to four cores. Every row is read from catalog and canon metadata — nothing is estimated.</p>
      </header>

      <div className="compare-picker">
        {CORE_CANON.map((core) => {
          const entry = entryById.get(core.id);
          if (!entry) return null;
          const on = selection.includes(core.id);
          return (
            <button
              key={core.id}
              type="button"
              className={`chip ${on ? 'on' : ''}`}
              data-compare-option={core.id}
              aria-pressed={on}
              disabled={!on && selection.length >= MAX_SELECTION}
              onClick={() => toggle(core.id)}
            >
              {entry.meta.displayName ?? entry.meta.name}
            </button>
          );
        })}
      </div>

      {selected.length < 2 ? (
        <div className="fallback-note" style={{ position: 'static', padding: 48 }} data-testid="compare-empty">
          SELECT AT LEAST TWO CANONICAL CORES
        </div>
      ) : (
        <div className="compare-table-wrap">
          <table className="compare-table" data-testid="compare-table">
            <thead>
              <tr>
                <th scope="col">Facet</th>
                {selected.map(({ entry, core }) => (
                  <th key={core.id} scope="col">
                    <div className="compare-head">
                      <div className="compare-head__preview">
                        <EffectPreview entry={entry} interactive={false} variant="thumbnail" />
                      </div>
                      <span className="compare-head__name">{entry.meta.displayName ?? entry.meta.name}</span>
                      <span className="compare-head__role">{core.role}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACT_ROWS.map((row) => (
                <tr key={row.key as string} data-facet={row.key as string}>
                  <th scope="row">{row.label}</th>
                  {selected.map(({ entry, core }) => (
                    <td key={core.id}>
                      {renderFact(comparisonFacts(entry, core, coreNichePresets(core.id))[row.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <details className="compare-provenance" data-testid="compare-provenance">
            <summary>Provenance</summary>
            <table className="compare-table">
              <tbody>
                {PROVENANCE_ROWS.map((row) => (
                  <tr key={row.key as string}>
                    <th scope="row">{row.label}</th>
                    {selected.map(({ entry, core }) => (
                      <td key={core.id}>
                        {renderFact(comparisonFacts(entry, core, coreNichePresets(core.id))[row.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}

      {/* ---- SEMANTIC CONFIG DIFF ------------------------------------------ */}
      <section className="semantic-diff" data-testid="semantic-diff">
        <h2>Semantic config diff</h2>
        <p className="core-section__hint">Compare two niche presets of one core in plain language.</p>
        <div className="semantic-diff__controls">
          <label>
            <span>CORE</span>
            <select
              data-testid="diff-core"
              value={diffCoreId}
              onChange={(event) => { setDiffCoreId(event.target.value); setLeftNiche(''); setRightNiche(''); }}
            >
              <option value="">—</option>
              {CORE_CANON.filter((core) => coreNichePresets(core.id).length >= 2).map((core) => (
                <option key={core.id} value={core.id}>
                  {entryById.get(core.id)?.meta.displayName ?? core.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>LEFT</span>
            <select data-testid="diff-left" value={leftNiche} onChange={(e) => setLeftNiche(e.target.value as NicheId)}>
              <option value="">—</option>
              {diffPresets.map((p) => <option key={p.id} value={p.niche}>{NICHE_LABELS[p.niche as NicheId]}</option>)}
            </select>
          </label>
          <label>
            <span>RIGHT</span>
            <select data-testid="diff-right" value={rightNiche} onChange={(e) => setRightNiche(e.target.value as NicheId)}>
              <option value="">—</option>
              {diffPresets.map((p) => <option key={p.id} value={p.niche}>{NICHE_LABELS[p.niche as NicheId]}</option>)}
            </select>
          </label>
        </div>

        {diffRows.length > 0 ? (
          <ul className="diff-list" data-testid="diff-list">
            {diffRows.map((row) => (
              <li key={row.key} data-diff-key={row.key} data-diff-direction={row.direction}>
                <span className="diff-list__label">{row.label}</span>
                <span className={`diff-list__verdict diff-${row.direction}`}>
                  {row.direction === 'enabled' ? 'enabled'
                    : row.direction === 'disabled' ? 'disabled'
                      : row.direction === 'changed' ? `changed to ${String(row.right)}`
                        : `${row.magnitude}${row.direction}`}
                </span>
                <span className="diff-list__values">{String(row.left)} → {String(row.right)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="core-section__empty">
            {leftNiche && rightNiche ? 'These two presets resolve to an identical state.' : 'Pick a core and two niches.'}
          </p>
        )}
      </section>
    </div>
  );
}
