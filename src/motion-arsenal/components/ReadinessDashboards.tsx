import { useMemo } from 'react';
import { inspectReadinessFacts } from '../lib/readinessFacts';
import type { EffectEntry } from '../types';

interface ReadinessDashboardsProps {
  catalog: readonly EffectEntry[];
  dashboard: '009' | '010' | '011' | '012';
  onBack: () => void;
}

function Metric({ label, value, testId }: { label: string; value: number; testId?: string }) {
  return <article><span>{label}</span><strong data-testid={testId}>{value}</strong></article>;
}

function Empty({ children }: { children: string }) {
  return <p className="readiness-dashboard__empty">{children}</p>;
}

/** Dashboards 009–012: read-only, factual status views of active catalog metadata. */
export function ReadinessDashboards({ catalog, dashboard, onBack }: ReadinessDashboardsProps) {
  const facts = useMemo(() => inspectReadinessFacts(catalog), [catalog]);
  const title = dashboard === '009' ? 'Niche Readiness' : dashboard === '010' ? 'Preset Quality' : dashboard === '011' ? 'Runtime Compatibility' : 'Integration Readiness';

  return (
    <div className="shell" style={{ gridTemplateColumns: '1fr' }}>
      <main className="main readiness-dashboard" data-testid={`readiness-dashboard-${dashboard}`}>
        <button className="back-btn" onClick={onBack}>← ARSENAL</button>
        <header className="readiness-dashboard__header">
          <p className="readiness-dashboard__kicker">DASHBOARD {dashboard} · CATALOG GOVERNANCE</p>
          <h1>{title}</h1>
          <p>Read-only facts from active <code>EFFECTS_CATALOG</code> metadata. Statuses identify metadata coverage, not an automated technical QA verdict.</p>
        </header>

        {dashboard === '009' && <NicheReadiness facts={facts} />}
        {dashboard === '010' && <PresetQuality facts={facts} />}
        {dashboard === '011' && <RuntimeCompatibility facts={facts} />}
        {dashboard === '012' && <IntegrationReadiness facts={facts} />}
      </main>
    </div>
  );
}

function NicheReadiness({ facts }: { facts: ReturnType<typeof inspectReadinessFacts> }) {
  return <>
    <section className="readiness-dashboard__metrics" aria-label="Niche readiness summary">
      <Metric label="ACTIVE EFFECTS" value={facts.totalEffects} />
      <Metric label="EFFECTS WITH PRESETS" value={facts.effectsWithPresets} />
      <Metric label="REGISTERED PRESETS" value={facts.totalPresets} />
      <Metric label="NO PRESET METADATA" value={facts.effectsWithoutPresets.length} />
    </section>
    <section className="readiness-dashboard__panel"><h2>Effects without niche presets</h2>
      {facts.effectsWithoutPresets.length ? <ul className="readiness-dashboard__list">{facts.effectsWithoutPresets.map(({ meta }) => <li key={meta.id}><code>{meta.id}</code><span>{meta.displayName ?? meta.name}</span></li>)}</ul> : <Empty>Every active effect has registered preset metadata.</Empty>}
    </section>
  </>;
}

function PresetQuality({ facts }: { facts: ReturnType<typeof inspectReadinessFacts> }) {
  const incomplete = facts.presets.filter((item) => item.invalidPropKeys.length || item.missingMetadata.length);
  return <>
    <section className="readiness-dashboard__metrics" aria-label="Preset metadata quality summary">
      <Metric label="REGISTERED PRESETS" value={facts.totalPresets} />
      <Metric label="PRESETS WITH REVIEW FLAGS" value={incomplete.length} />
      <Metric label="UNMAPPED PROP KEYS" value={facts.presets.filter((item) => item.invalidPropKeys.length).length} />
      <Metric label="METADATA COMPLETE" value={facts.totalPresets - incomplete.length} />
    </section>
    <section className="readiness-dashboard__panel"><h2>Preset metadata review queue</h2>
      {incomplete.length ? <ul className="readiness-dashboard__list">{incomplete.map(({ effect, preset, invalidPropKeys, missingMetadata }) => <li key={`${effect.meta.id}:${preset.id}`}><code>{effect.meta.id} / {preset.id}</code><span>{[invalidPropKeys.length ? `unmapped props: ${invalidPropKeys.join(', ')}` : '', missingMetadata.length ? `missing: ${missingMetadata.join(', ')}` : ''].filter(Boolean).join(' · ')}</span></li>)}</ul> : <Empty>No preset metadata review flags were found.</Empty>}
    </section>
  </>;
}

function RuntimeCompatibility({ facts }: { facts: ReturnType<typeof inspectReadinessFacts> }) {
  const incomplete = facts.runtime.filter((item) => item.missingMetadata.length);
  const heavy = facts.runtime.filter(({ effect }) => effect.meta.complexity === 'heavy').length;
  return <>
    <section className="readiness-dashboard__metrics" aria-label="Runtime compatibility metadata summary">
      <Metric label="ACTIVE EFFECTS" value={facts.totalEffects} />
      <Metric label="HEAVY EFFECTS" value={heavy} />
      <Metric label="CLICK-TO-RUN" value={facts.runtime.filter(({ effect }) => effect.meta.clickToRun).length} />
      <Metric label="MISSING RUNTIME NOTES" value={incomplete.length} />
    </section>
    <section className="readiness-dashboard__panel"><div className="readiness-dashboard__panel-heading"><h2>Runtime metadata review queue</h2><span className="readiness-dashboard__operator">TECHNICAL QA VISUAL REVIEW · OPERATOR REVIEW</span></div>
      {incomplete.length ? <ul className="readiness-dashboard__list">{incomplete.map(({ effect, missingMetadata }) => <li key={effect.meta.id}><code>{effect.meta.id}</code><span>Missing: {missingMetadata.join(', ')}</span></li>)}</ul> : <Empty>All active effects include performance, mobile, and reduced-motion notes. Visual technical QA remains OPERATOR REVIEW.</Empty>}
    </section>
  </>;
}

function IntegrationReadiness({ facts }: { facts: ReturnType<typeof inspectReadinessFacts> }) {
  const incomplete = facts.integrations.filter((item) => item.missingMetadata.length);
  return <>
    <section className="readiness-dashboard__metrics" aria-label="Integration metadata summary">
      <Metric label="ACTIVE EFFECTS" value={facts.totalEffects} />
      <Metric label="METADATA COMPLETE" value={facts.totalEffects - incomplete.length} />
      <Metric label="REVIEW FLAGS" value={incomplete.length} />
      <Metric label="WITH DEPENDENCIES" value={facts.integrations.filter(({ effect }) => effect.meta.dependencies.length).length} />
    </section>
    <section className="readiness-dashboard__panel"><h2>Integration metadata review queue</h2>
      {incomplete.length ? <ul className="readiness-dashboard__list">{incomplete.map(({ effect, missingMetadata }) => <li key={effect.meta.id}><code>{effect.meta.id}</code><span>Missing: {missingMetadata.join(', ')}</span></li>)}</ul> : <Empty>All active effects provide import, usage, source, and technical-basis metadata.</Empty>}
    </section>
  </>;
}
