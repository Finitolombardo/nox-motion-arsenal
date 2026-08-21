import React, { useMemo, useState } from 'react';
import type { CoreCanonEntry, EffectEntry, EffectPresetPerformanceProfile, NicheId } from '../types';
import { coreNichePresets, NICHE_LABELS } from '../data/coreCanon';
import {
  buildMinimalJsx,
  buildPresetLink,
  emptyCoreState,
  isModuleOn,
  moduleToggleValue,
  resolveCoreState,
  splitCoreControls,
  type CoreBuilderState,
} from '../lib/coreState';
import {
  buildImplementationBrief,
  buildImportLine,
  normalizeControlValue,
} from '../lib/effectConfig';
import { buildEffectConfigV1, payloadFingerprint, stableStringify } from '../lib/canonExports';
import { EffectPreview } from './EffectPreview';
import { FullscreenPreview } from './FullscreenPreview';
import { ControlList } from './PropsPanel';
import { CopyButton } from './CopyButton';

const TIER_NOTE: Record<CoreCanonEntry['runtimeTier'], string> = {
  light: 'DOM/CSS only — safe to use many times per page.',
  standard: 'One bounded loop or a few composited layers.',
  heavy: 'Canvas simulation — budget one per viewport.',
  gpu: 'WebGL context required — one per page.',
};

/**
 * Core Builder.
 *
 * A canonical core is not "an effect with forty sliders". The screen is ordered
 * by decision: what it looks like, which mode, which mechanics are on, which
 * niche, then the handful of controls that matter — with the full technical
 * surface folded away in ADVANCED and the legacy history at the very bottom.
 */
export function CoreBuilder({
  entry,
  core,
  initialState,
  onBack,
  onCompare,
}: {
  entry: EffectEntry;
  core: CoreCanonEntry;
  initialState?: CoreBuilderState;
  onBack: () => void;
  onCompare?: (id: string) => void;
}) {
  const m = entry.meta;
  const presets = useMemo(() => coreNichePresets(core.id), [core.id]);
  const [state, setState] = useState<CoreBuilderState>(
    () => initialState ?? emptyCoreState(core, m),
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const resolved = useMemo(
    () => resolveCoreState(m, core, state, presets),
    [m, core, state, presets],
  );
  const { primary, advanced } = useMemo(() => splitCoreControls(m, core), [m, core]);
  const controlsByKey = useMemo(() => new Map(m.props.map((c) => [c.key, c])), [m]);

  const minimalJsx = useMemo(() => buildMinimalJsx(m, core, resolved), [m, core, resolved]);
  const importLine = useMemo(() => buildImportLine(m), [m]);
  const configV1 = useMemo(
    () => buildEffectConfigV1(entry, core, state, presets),
    [entry, core, state, presets],
  );
  const fullConfig = useMemo(() => stableStringify(configV1), [configV1]);
  const fingerprint = useMemo(() => payloadFingerprint(configV1), [configV1]);

  // D020.3: which layer actually won for each value. The builder already tracks
  // this to make RESET exact — surfacing it turns "why is this 0.46?" into a
  // one-glance answer instead of a guess.
  const provenanceRows = useMemo(() => {
    const order = { core: 0, mode: 1, preset: 2, profile: 3, user: 4 } as const;
    return Object.entries(resolved.provenance)
      .filter(([, layer]) => layer !== 'core')
      .sort((a, b) => order[b[1]] - order[a[1]] || a[0].localeCompare(b[0]));
  }, [resolved.provenance]);

  const setOverride = (key: string, value: unknown) => {
    const control = controlsByKey.get(key);
    if (!control) return;
    setState((current) => ({
      ...current,
      overrides: { ...current.overrides, [key]: normalizeControlValue(control, value) },
    }));
  };

  const overrideCount = Object.keys(state.overrides).length;
  const activeProfile = resolved.profile;

  return (
    <div className="core-builder" data-testid="core-builder" data-core-id={core.id}>
      <button className="back-btn" onClick={onBack}>← LIBRARY</button>

      <header className="core-builder__header">
        <div>
          <p className="kicker">{core.role} · Canonical Core</p>
          <h1>{m.displayName ?? m.name}</h1>
          <p className="core-builder__summary">{core.summary}</p>
        </div>
        <div className="core-builder__header-meta">
          <span className={`core-tier core-tier--${core.runtimeTier}`}>{core.runtimeTier.toUpperCase()}</span>
          <span className={`core-status ${m.productionSafe ? 'is-production' : 'is-candidate'}`}>
            {m.productionSafe ? 'PRODUCTION' : (m.status ?? 'candidate').toUpperCase()}
          </span>
          {onCompare && (
            <button type="button" className="copy-btn" data-testid="add-to-compare" onClick={() => onCompare(core.id)}>
              + COMPARE
            </button>
          )}
        </div>
      </header>

      {/* ---- LIVE PREVIEW -------------------------------------------------- */}
      <section className="core-builder__stage" aria-label="Live preview">
        <div className="core-builder__preview" data-testid="core-preview">
          <EffectPreview key={`${m.id}`} entry={entry} propValues={resolved.values} variant="detail" />
        </div>
        <div className="core-builder__stage-actions">
          <button type="button" className="copy-btn" onClick={() => setFullscreen(true)}>⛶ FULLSCREEN</button>
          {resolved.preset && (
            <span className="core-builder__stage-note" data-testid="active-preset-label">
              {resolved.preset.label}
            </span>
          )}
          {overrideCount > 0 && (
            <span className="core-builder__stage-note is-dirty" data-testid="override-count">
              {overrideCount} override{overrideCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </section>

      <div className="core-builder__columns">
        <div className="core-builder__col">
          {/* ---- MODE ------------------------------------------------------ */}
          {core.modes?.length ? (
            <section className="core-section" data-testid="core-modes">
              <h2>Mode</h2>
              <p className="core-section__hint">Exclusive — one mechanic at a time.</p>
              <div className="chip-row">
                {core.modes.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    className={`mode-chip ${state.mode === mode.value ? 'on' : ''}`}
                    data-mode-value={mode.value}
                    aria-pressed={state.mode === mode.value}
                    onClick={() => setState((current) => ({
                      ...current,
                      mode: mode.value,
                      // The mode control is owned by the mode picker; a stale
                      // override on that key would silently win over the click.
                      overrides: Object.fromEntries(
                        Object.entries(current.overrides).filter(([key]) => key !== core.modeControl),
                      ),
                    }))}
                  >
                    <span className="mode-chip__label">{mode.label}</span>
                    <span className="mode-chip__desc">{mode.description}</span>
                    {mode.absorbs?.length ? (
                      <span className="mode-chip__absorbs">replaces {mode.absorbs.join(', ')}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {/* ---- MODULES --------------------------------------------------- */}
          {core.modules?.length ? (
            <section className="core-section" data-testid="core-modules">
              <h2>Modules</h2>
              <p className="core-section__hint">Absorbed mechanics — combine freely.</p>
              <div className="module-grid">
                {core.modules.map((mod) => {
                  const on = isModuleOn(mod, resolved.values[mod.key]);
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      className={`module-toggle ${on ? 'on' : ''}`}
                      data-module-key={mod.key}
                      aria-pressed={on}
                      onClick={() => setOverride(mod.key, moduleToggleValue(mod, !on))}
                    >
                      <span className="module-toggle__dot" aria-hidden="true" />
                      <span className="module-toggle__body">
                        <span className="module-toggle__label">{mod.label}</span>
                        <span className="module-toggle__desc">{mod.description}</span>
                        {mod.absorbs?.length ? (
                          <span className="module-toggle__absorbs">from {mod.absorbs.join(', ')}</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* ---- NICHE PRESET ---------------------------------------------- */}
          <section className="core-section" data-testid="core-presets">
            <h2>Niche Preset</h2>
            {presets.length ? (
              <>
                <p className="core-section__hint">Loads the complete curated state for that niche.</p>
                <div className="preset-grid">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`preset-card ${state.presetId === preset.id ? 'on' : ''}`}
                      data-preset-id={preset.id}
                      data-preset-niche={preset.niche}
                      aria-pressed={state.presetId === preset.id}
                      onClick={() => setState((current) => ({
                        ...current,
                        presetId: current.presetId === preset.id ? null : preset.id,
                        // Selecting a preset must show the preset, not the
                        // preset plus whatever was fiddled with beforehand.
                        overrides: {},
                        profileId: null,
                      }))}
                    >
                      <span className="preset-card__niche">{NICHE_LABELS[preset.niche as NicheId]}</span>
                      <span className="preset-card__why">{preset.description}</span>
                      <span className="preset-card__profile">{preset.performanceProfile}</span>
                    </button>
                  ))}
                </div>
                <div className="core-section__actions">
                  <button
                    type="button"
                    className="copy-btn"
                    data-testid="reset-to-preset"
                    disabled={!state.presetId}
                    onClick={() => setState((current) => ({ ...current, overrides: {}, profileId: null }))}
                  >
                    RESET TO PRESET
                  </button>
                  <button
                    type="button"
                    className="copy-btn"
                    data-testid="reset-to-core"
                    onClick={() => setState(emptyCoreState(core, m))}
                  >
                    RESET TO CORE
                  </button>
                </div>
              </>
            ) : (
              <p className="core-section__empty" data-testid="no-presets">
                No niche is curated for this core yet — it runs on core defaults.
              </p>
            )}
          </section>

          {/* ---- PERFORMANCE PROFILE --------------------------------------- */}
          {core.profiles?.length ? (
            <section className="core-section" data-testid="core-profiles">
              <h2>Performance Profile</h2>
              <p className="core-section__hint">Changes real configuration — density, layers, blur, particle budget.</p>
              <div className="chip-row">
                {core.profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    className={`profile-chip ${activeProfile === profile.id ? 'on' : ''}`}
                    data-profile-id={profile.id}
                    aria-pressed={activeProfile === profile.id}
                    onClick={() => setState((current) => ({
                      ...current,
                      profileId: current.profileId === profile.id ? null : (profile.id as EffectPresetPerformanceProfile),
                      overrides: Object.fromEntries(
                        Object.entries(current.overrides).filter(([key]) => !(key in profile.overrides)),
                      ),
                    }))}
                  >
                    <span className="profile-chip__label">{profile.label}</span>
                    <span className="profile-chip__note">{profile.note}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="core-builder__col">
          {/* ---- CORE CONTROLS --------------------------------------------- */}
          <section className="core-section" data-testid="core-controls">
            <h2>Core Controls</h2>
            <ControlList controls={primary} values={resolved.values} onChange={setOverride} />
          </section>

          {/* ---- ADVANCED --------------------------------------------------- */}
          {advanced.length > 0 && (
            <section className="core-section core-section--collapsible" data-testid="core-advanced">
              <button type="button" className="section-toggle" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((o) => !o)}>
                <span>Advanced</span>
                <span className="section-toggle__meta">{advanced.length} parameters</span>
                <span className={`section-toggle__chevron ${advancedOpen ? 'open' : ''}`} aria-hidden="true">▾</span>
              </button>
              {advancedOpen && <ControlList controls={advanced} values={resolved.values} onChange={setOverride} />}
            </section>
          )}

          {/* ---- MOBILE / REDUCED MOTION ------------------------------------ */}
          <section className="core-section" data-testid="core-runtime-notes">
            <h2>Mobile &amp; Reduced Motion</h2>
            <dl className="runtime-notes">
              <div><dt>Runtime</dt><dd>{TIER_NOTE[core.runtimeTier]}</dd></div>
              <div><dt>Performance</dt><dd>{m.performanceNotes}</dd></div>
              <div><dt>Mobile behaviour</dt><dd>{m.mobileNotes}</dd></div>
              <div><dt>Touch fallback</dt><dd>{m.clickToRun ? 'Click-to-run: the preview never auto-starts on touch.' : 'Mounts automatically; no tap required.'}</dd></div>
              <div><dt>Reduced motion</dt><dd>{m.reducedMotionNotes}</dd></div>
              <div><dt>Dependencies</dt><dd>{m.dependencies.length ? m.dependencies.join(', ') : 'none'}</dd></div>
            </dl>
          </section>

          {/* ---- PROVENANCE --------------------------------------------------- */}
          <section className="core-section core-section--collapsible" data-testid="core-provenance">
            <button
              type="button"
              className="section-toggle"
              aria-expanded={provenanceOpen}
              onClick={() => setProvenanceOpen((o) => !o)}
            >
              <span>Provenance</span>
              <span className="section-toggle__meta">
                {provenanceRows.length ? `${provenanceRows.length} non-default` : 'all core defaults'}
              </span>
              <span className={`section-toggle__chevron ${provenanceOpen ? 'open' : ''}`} aria-hidden="true">▾</span>
            </button>
            {provenanceOpen && (
              provenanceRows.length ? (
                <ul className="provenance-list" data-testid="provenance-list">
                  {provenanceRows.map(([key, layer]) => (
                    <li key={key} data-provenance-key={key} data-provenance-layer={layer}>
                      <span className="provenance-list__key">{controlsByKey.get(key)?.label ?? key}</span>
                      <span className={`provenance-list__layer provenance-${layer}`}>{layer}</span>
                      <span className="provenance-list__value">{String(resolved.values[key])}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="core-section__empty">Every value comes from the core defaults.</p>
              )
            )}
          </section>

          {/* ---- EXPORT ------------------------------------------------------ */}
          <section className="core-section core-section--export" data-testid="core-export">
            <h2>Export</h2>
            <button type="button" className="section-toggle" aria-expanded={exportOpen} onClick={() => setExportOpen((o) => !o)}>
              <span>Export preview</span>
              <span className={`section-toggle__chevron ${exportOpen ? 'open' : ''}`} aria-hidden="true">▾</span>
            </button>
            {exportOpen && (
              <div className="export-preview" data-testid="export-preview">
                <dl>
                  <div><dt>Component</dt><dd>{m.name}</dd></div>
                  <div><dt>Preset</dt><dd>{resolved.preset ? resolved.preset.label : 'core defaults'}</dd></div>
                  <div><dt>Overrides</dt><dd>{overrideCount || 'none'}</dd></div>
                  <div><dt>Runtime assumption</dt><dd>{TIER_NOTE[core.runtimeTier]}</dd></div>
                  <div><dt>Schema</dt><dd>{configV1.schema}</dd></div>
                  <div><dt>Fingerprint</dt><dd><code>{fingerprint}</code></dd></div>
                </dl>
                <pre className="codebox">{minimalJsx}</pre>
              </div>
            )}
            <div className="export-actions">
              <CopyButton text={() => `${importLine}\n\n${minimalJsx}`} label="COPY MINIMAL JSX" testId="copy-minimal-jsx" />
              <CopyButton text={() => fullConfig} label="COPY FULL CONFIG" testId="copy-full-config" />
              <CopyButton text={() => buildPresetLink(m, state)} label="COPY PRESET LINK" testId="copy-preset-link" />
              <CopyButton
                text={() => buildImplementationBrief(entry, resolved.values, { usage: resolved.preset?.label ?? '', note: core.summary })}
                label="COPY IMPLEMENTATION BRIEF"
                testId="copy-implementation-brief"
              />
            </div>
          </section>
        </div>
      </div>

      {/* ---- MIGRATION HISTORY --------------------------------------------- */}
      <section className="core-section core-section--history" data-testid="core-migration-history">
        <button type="button" className="section-toggle" aria-expanded={historyOpen} onClick={() => setHistoryOpen((o) => !o)}>
          <span>Migration history</span>
          <span className="section-toggle__meta">{core.absorbs.length} absorbed · engineering only</span>
          <span className={`section-toggle__chevron ${historyOpen ? 'open' : ''}`} aria-hidden="true">▾</span>
        </button>
        {historyOpen && (
          <div className="migration-history">
            {core.absorbs.length ? (
              <>
                <h3>Absorbed effects</h3>
                <ul>
                  {core.absorbs.map((id) => <li key={id}><code>{id}</code></li>)}
                </ul>
              </>
            ) : (
              <p>This core absorbed no legacy effects — it was canonical from the start.</p>
            )}
            {m.supersedes?.length ? (
              <>
                <h3>Supersedes</h3>
                <ul>{m.supersedes.map((name) => <li key={name}><code>{name}</code></li>)}</ul>
              </>
            ) : null}
            {m.legacyIds?.length ? (
              <>
                <h3>Legacy IDs resolving here</h3>
                <ul>{m.legacyIds.map((id) => <li key={id}><code>{id}</code></li>)}</ul>
              </>
            ) : null}
            {core.migrationNotes ? <p className="migration-history__note">{core.migrationNotes}</p> : null}
            {m.deprecationNotes ? <p className="migration-history__note">{m.deprecationNotes}</p> : null}
          </div>
        )}
      </section>

      {fullscreen && <FullscreenPreview entry={entry} propValues={resolved.values} onClose={() => setFullscreen(false)} />}
    </div>
  );
}
