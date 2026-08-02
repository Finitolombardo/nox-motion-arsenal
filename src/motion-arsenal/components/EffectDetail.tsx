import React, { useEffect, useMemo, useState } from 'react';
import type { EffectEntry } from '../types';
import { formatEffectUpdatedAt } from '../lib/effectDates';
import {
  buildConfigJson,
  buildEffectConfigDocument,
  buildImplementationBrief,
  buildImportLine,
  buildShareLink,
  buildUsageJsx,
  defaultConfigValues,
  normalizeConfigValues,
  normalizeControlValue,
  readPresetStore,
  writePresetStore,
  type EffectConfigValues,
  type ShareContext,
} from '../lib/effectConfig';
import { EffectPreview } from './EffectPreview';
import { PropsPanel } from './PropsPanel';
import { FullscreenPreview } from './FullscreenPreview';
import { GitHubContributionPanel } from './GitHubContributionPanel';

interface Props {
  entry: EffectEntry;
  onBack: () => void;
  /** Aus dem Share-Link deserialisierte Konfiguration. */
  initialConfig?: EffectConfigValues | null;
  /** Einsatzkontext/Notiz aus dem Share-Link. */
  initialContext?: ShareContext | null;
  onConfigChange?: (values: EffectConfigValues) => void;
}

function CopyButton({
  text,
  label,
  testId,
}: {
  text: string | (() => string);
  label: string;
  testId?: string;
}) {
  const [copied, setCopied] = useState(false);
  const resolve = () => (typeof text === 'function' ? text() : text);
  return (
    <button
      className="copy-btn"
      data-testid={testId}
      onClick={() => {
        const done = () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        };
        // Ohne Clipboard-Permission (headless Tests, unsichere Origins) darf
        // der Handoff nicht stumm scheitern.
        const write = navigator.clipboard?.writeText(resolve());
        if (write) write.then(done, done);
        else done();
      }}
    >
      {copied ? '✓ COPIED' : label}
    </button>
  );
}

export function EffectDetail({ entry, onBack, initialConfig, initialContext, onConfigChange }: Props) {
  const m = entry.meta;
  const updated = formatEffectUpdatedAt(m.updatedAt);
  const [fullscreen, setFullscreen] = useState(false);

  // Der eine kanonische Config-State. Preview, Controls, JSON, JSX, Brief und
  // Share-Link lesen ausschließlich hieraus. Vorher kam der Usage-Code aus dem
  // statischen `meta.usageJsx`-String und zeigte andere Werte als die Regler.
  const [config, setConfig] = useState<EffectConfigValues>(() =>
    initialConfig ? normalizeConfigValues(m, initialConfig) : defaultConfigValues(m),
  );
  // Einsatzkontext und Notiz reisen im Share-Link und im Brief mit — sie sind
  // kein Prop des Effekts und gehören deshalb nicht in `config`.
  const [usage, setUsage] = useState(initialContext?.usage ?? '');
  const [note, setNote] = useState(initialContext?.note ?? '');
  const shareContext: ShareContext = { usage, note };
  const [presetName, setPresetName] = useState('');
  const [presetKeys, setPresetKeys] = useState<string[]>(() => Object.keys(readPresetStore()));
  const [notice, setNotice] = useState('');

  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const setControl = (key: string, value: unknown) => {
    const control = m.props.find((c) => c.key === key);
    if (!control) return;
    setConfig((current) => ({ ...current, [key]: normalizeControlValue(control, value) }));
  };

  const doc = useMemo(() => buildEffectConfigDocument(entry, config), [entry, config]);
  const importLine = useMemo(() => buildImportLine(m), [m]);
  const usageJsx = useMemo(() => buildUsageJsx(entry, config), [entry, config]);
  const configJson = useMemo(() => buildConfigJson(entry, config), [entry, config]);

  const storageKeyFor = (name: string) => `${m.id}::${name}`;

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) {
      setNotice('Bitte einen Preset-Namen eingeben');
      return;
    }
    const store = readPresetStore();
    store[storageKeyFor(name)] = normalizeConfigValues(m, config);
    writePresetStore(store);
    setPresetKeys(Object.keys(store));
    setNotice(`Preset „${name}“ gespeichert`);
  };

  const loadPreset = (name: string) => {
    const stored = readPresetStore()[storageKeyFor(name)];
    if (!stored) {
      setNotice(`Preset „${name}“ nicht gefunden`);
      return;
    }
    setConfig(normalizeConfigValues(m, stored));
    setNotice(`Preset „${name}“ geladen`);
  };

  const savedForEffect = presetKeys
    .filter((key) => key.startsWith(`${m.id}::`))
    .map((key) => key.slice(`${m.id}::`.length));

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        ← ARSENAL
      </button>
      <div className="arsenal-header" style={{ marginBottom: 16 }}>
        <h1>{m.displayName ?? m.name}</h1>
        <span className="sub">{m.name} · {m.id}</span>
      </div>
      <div className="badges" style={{ marginBottom: 16 }}>
        <span className={`badge ${m.mode === 'nox-concept' ? 'lab' : 'adapted'}`}>{m.mode === 'nox-concept' ? 'NOX Concept' : 'NOX Adapted'}</span>
        <span className={`badge ${m.complexity === 'heavy' ? 'heavy' : ''}`}>{m.complexity}</span>
        {m.status ? (
          <span className={`badge ${m.status === 'production-safe' ? 'prod' : m.status === 'experimental' ? 'heavy' : ''}`}>{m.status}</span>
        ) : m.productionSafe ? (
          <span className="badge prod">production safe</span>
        ) : (
          <span className="badge heavy">not for production</span>
        )}
        <span className="badge">{m.sourceWebsite}</span>
        <span className="badge" data-testid="effect-version">v{doc.build.effectVersion}</span>
        <span className="badge" data-testid="build-commit">{doc.build.commit}</span>
      </div>

      <div className="detail-grid">
        <div>
          <div className="fx-preview-detail">
            <EffectPreview key={entry.meta.id} entry={entry} propValues={config} variant="detail" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {m.fullBleed && (
              <button className="copy-btn" onClick={() => setFullscreen(true)}>
                ⛶ FULLSCREEN
              </button>
            )}
            <CopyButton text={importLine} label="COPY IMPORT" testId="copy-import" />
            <CopyButton text={usageJsx} label="COPY JSX" testId="copy-jsx" />
            <CopyButton text={configJson} label="COPY CONFIG" testId="copy-config" />
            <CopyButton
              text={() => buildImplementationBrief(entry, config, shareContext)}
              label="COPY IMPLEMENTATION BRIEF"
              testId="copy-brief"
            />
            <CopyButton
              text={() => buildShareLink(entry, config, undefined, shareContext)}
              label="COPY SHARE LINK"
              testId="copy-share-link"
            />
          </div>

          <GitHubContributionPanel entry={entry} />

          <div className="panel" style={{ marginTop: 14 }}>
            <h4>Usage</h4>
            <div className="codebox" data-testid="usage-code">{`${importLine}\n\n${usageJsx}`}</div>
          </div>

          <div className="panel">
            <h4>Canonical Config</h4>
            <div className="codebox" data-testid="config-json">{configJson}</div>
          </div>

          <div className="panel">
            <h4>Beschreibung</h4>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-dim)' }}>{m.description}</p>
          </div>
        </div>

        <div>
          <PropsPanel controls={m.props} values={config} onChange={setControl} />
          <div className="panel">
            <h4>Handoff-Kontext</h4>
            <div className="prop-row">
              <label htmlFor="share-usage"><span>Einsatzkontext</span></label>
              <input
                id="share-usage"
                data-testid="share-usage"
                type="text"
                placeholder="z. B. Homepage Revenue OS Section"
                value={usage}
                onChange={(e) => setUsage(e.target.value)}
              />
            </div>
            <div className="prop-row">
              <label htmlFor="share-note"><span>Notiz</span></label>
              <input
                id="share-note"
                data-testid="share-note"
                type="text"
                placeholder="optionaler Hinweis für den nächsten Agenten"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-dim)' }}>
              Beides reist im Share-Link und im Implementation Brief mit.
            </p>
          </div>
          {m.props.length > 0 && (
            <div className="panel">
              <h4>Presets</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  data-testid="preset-name"
                  placeholder="Preset-Name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  style={{ flex: '1 1 140px', minWidth: 120 }}
                />
                <button className="copy-btn" data-testid="save-preset" onClick={savePreset}>
                  SAVE PRESET
                </button>
                <button
                  className="copy-btn"
                  data-testid="reset-config"
                  onClick={() => {
                    setConfig(defaultConfigValues(m));
                    setNotice('Auf Katalog-Defaults zurückgesetzt');
                  }}
                >
                  RESET
                </button>
              </div>
              {savedForEffect.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {savedForEffect.map((name) => (
                    <button
                      key={name}
                      className="copy-btn"
                      data-load-preset={name}
                      onClick={() => loadPreset(name)}
                    >
                      ⤓ {name}
                    </button>
                  ))}
                </div>
              )}
              {notice && (
                <p data-testid="preset-notice" style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-dim)' }}>
                  {notice}
                </p>
              )}
            </div>
          )}
          <div className="panel">
            <h4>Metadaten</h4>
            <div className="meta-row"><span className="k">Source</span><span className="v">{m.sourceWebsite}</span></div>
            <div className="meta-row"><span className="k">Files</span><span className="v mono" style={{ fontSize: 10.5, wordBreak: 'break-all' }}>{m.sourceFiles.join(' · ')}</span></div>
            <div className="meta-row"><span className="k">Deps</span><span className="v">{m.dependencies.length ? m.dependencies.join(', ') : 'keine'}</span></div>
            <div className="meta-row"><span className="k">Best for</span><span className="v">{m.bestFor.join(', ')}</span></div>
            <div className="meta-row"><span className="k">Effect Version</span><span className="v">{doc.build.effectVersion}</span></div>
            <div className="meta-row"><span className="k">Build Commit</span><span className="v mono">{doc.build.commit}</span></div>
            <div className="meta-row">
              <span className="k">Letztes Update</span>
              <time className="v" dateTime={m.updatedAt}>{updated.date} · {updated.relative}</time>
            </div>
            {m.currentUsage?.length ? (
              <div className="meta-row"><span className="k">Aktuell in</span><span className="v">{m.currentUsage.join(', ')}</span></div>
            ) : null}
            {m.technicalBasis ? (
              <div className="meta-row"><span className="k">Technik</span><span className="v">{m.technicalBasis}</span></div>
            ) : null}
          </div>
          <div className="panel">
            <h4>Performance</h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-dim)' }}>{m.performanceNotes}</p>
          </div>
          <div className="panel">
            <h4>Mobile</h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-dim)' }}>{m.mobileNotes}</p>
          </div>
          <div className="panel">
            <h4>Reduced Motion</h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-dim)' }}>{m.reducedMotionNotes}</p>
          </div>
        </div>
      </div>

      {fullscreen && <FullscreenPreview entry={entry} propValues={config} onClose={() => setFullscreen(false)} />}
    </div>
  );
}
