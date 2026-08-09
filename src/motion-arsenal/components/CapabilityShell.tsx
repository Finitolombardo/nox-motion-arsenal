import React, { useMemo, useState } from 'react';
import type { CapabilityCategory, CapabilityEntry, CapabilityMaturity } from '../capabilities/types';
import { CAPABILITIES_CATALOG, CAPABILITY_CATEGORY_LABELS } from '../data/capabilitiesCatalog';
import { CapabilityCard } from './CapabilityCard';

const CATEGORY_ORDER: CapabilityCategory[] = [
  'agent-orchestration',
  'bridges-connectors',
  'provider-access',
  'reliability',
  'automation',
  'intelligence',
  'knowledge',
  'governance',
];

type ExposureFilter = 'all' | 'public-safe' | 'operator-private';
type MaturityFilter = 'all' | CapabilityMaturity;

function useCapabilityRoute(): [string, (next: string) => void] {
  const [hash, setHash] = React.useState(() => window.location.hash.slice(1));

  React.useEffect(() => {
    const onHash = () => setHash(window.location.hash.slice(1));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return [hash, (next: string) => { window.location.hash = next; }];
}

function buildIntegrationPrompt(entry: CapabilityEntry): string {
  const privacyLine = entry.publicSafe
    ? 'Nutze nur die dokumentierten öffentlichen Capability-Verträge.'
    : 'Die konkrete Implementierung ist operator-private. Keine Secrets, Sessiondaten, internen Endpoints oder Credential-Flows erfinden oder offenlegen; fordere stattdessen den privaten Registry-Eintrag an.';

  return [
    `NOX CAPABILITY INTEGRATION — ${entry.displayName ?? entry.name}`,
    '',
    `Capability-ID: ${entry.id}`,
    `Reifegrad: ${entry.maturity}`,
    `Portability: ${entry.portability}`,
    '',
    'ZIEL',
    `Integriere die bestehende NOX-Capability „${entry.displayName ?? entry.name}“ in das Zielprojekt, ohne die bewiesene Semantik zu verschlechtern.`,
    '',
    'PROBLEM, DAS DIE CAPABILITY LÖST',
    entry.problemSolved,
    '',
    'KANONISCHES INTEGRATIONSMUSTER',
    entry.integrationPattern,
    '',
    `Runtimes: ${entry.runtimes.join(', ')}`,
    `Interfaces: ${entry.interfaces.join(', ')}`,
    `Dependencies: ${entry.dependencies.join(', ')}`,
    '',
    'GUARDRAILS',
    ...entry.securityNotes.map((note) => `- ${note}`),
    `- ${privacyLine}`,
    '- Keine produktive Mutation, kein Deploy und keine Credential-Änderung ohne explizite Freigabe.',
    '',
    'ABNAHME',
    '- Bestehende Evidence-Grenzen beibehalten.',
    '- Negative Tests für Failure/Blocked-Pfade ergänzen.',
    '- Dedupe/Idempotenz prüfen, falls die Capability asynchron arbeitet.',
    '- Abschlussbericht mit geänderten Dateien, Tests, offenen Risiken und Rollback-Pfad liefern.',
  ].join('\n');
}

function CapabilityDetail({ entry, onBack }: { entry: CapabilityEntry; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const prompt = useMemo(() => buildIntegrationPrompt(entry), [entry]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="cap-detail-wrap">
      <button className="back-btn" onClick={onBack}>← CAPABILITY ARSENAL</button>

      <section className="cap-detail-hero">
        <div className="cap-detail-kicker">{CAPABILITY_CATEGORY_LABELS[entry.category]}</div>
        <div className="cap-detail-title-row">
          <div>
            <h1>{entry.displayName ?? entry.name}</h1>
            <p className="cap-code-name">{entry.name} · {entry.id}</p>
          </div>
          <div className="cap-detail-badges">
            <span className={`cap-maturity cap-maturity-${entry.maturity}`}>{entry.maturity.toUpperCase()}</span>
            <span className={`cap-exposure ${entry.exposure === 'operator-private' ? 'private' : ''}`}>
              {entry.exposure === 'operator-private' ? 'OPERATOR PRIVATE' : 'PUBLIC SAFE'}
            </span>
          </div>
        </div>
        <p className="cap-detail-summary">{entry.summary}</p>
      </section>

      <div className="cap-detail-grid">
        <section className="cap-panel">
          <h2>PROBLEM SOLVED</h2>
          <p>{entry.problemSolved}</p>
        </section>
        <section className="cap-panel">
          <h2>PORTABILITY</h2>
          <div className="cap-big-value">{entry.portability.toUpperCase()}</div>
          <p>{entry.reusable ? 'Als wiederverwendbare Capability registriert.' : 'Aktuell projektspezifisch.'}</p>
        </section>
        <section className="cap-panel">
          <h2>RUNTIMES</h2>
          <div className="cap-list-chips">{entry.runtimes.map((item) => <span key={item}>{item}</span>)}</div>
        </section>
        <section className="cap-panel">
          <h2>INTERFACES</h2>
          <div className="cap-list-chips">{entry.interfaces.map((item) => <span key={item}>{item}</span>)}</div>
        </section>
      </div>

      <section className="cap-panel cap-panel-wide">
        <h2>EVIDENCE</h2>
        <div className="cap-evidence-list">
          {entry.evidence.map((item) => (
            <div key={item.label} className="cap-evidence-row">
              <span className={`cap-evidence-status ${item.status}`}>{item.status.toUpperCase()}</span>
              <div><strong>{item.label}</strong><p>{item.summary}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="cap-panel cap-panel-wide">
        <h2>SECURITY / GOVERNANCE</h2>
        <ul className="cap-security-list">
          {entry.securityNotes.map((note) => <li key={note}>{note}</li>)}
          {entry.exposure === 'operator-private' && (
            <li>Konkrete interne Pfade, Endpoints, Tokens und Sessionmaterial werden absichtlich nicht in dieses öffentliche Repository geschrieben.</li>
          )}
        </ul>
      </section>

      <section className="cap-panel cap-panel-wide">
        <div className="cap-prompt-head">
          <div>
            <h2>USE IN PROJECT</h2>
            <p>Portabler Integrationsprompt aus der Capability-Metadatenstruktur.</p>
          </div>
          <button className="cap-copy-btn" onClick={copyPrompt}>{copied ? 'COPIED ✓' : 'COPY INTEGRATION PROMPT'}</button>
        </div>
        <pre className="cap-prompt-preview">{prompt}</pre>
      </section>
    </div>
  );
}

export function CapabilityShell({ catalog = CAPABILITIES_CATALOG }: { catalog?: CapabilityEntry[] }) {
  const [route, navigate] = useCapabilityRoute();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CapabilityCategory | 'all'>('all');
  const [maturity, setMaturity] = useState<MaturityFilter>('all');
  const [exposure, setExposure] = useState<ExposureFilter>('all');

  const openId = route.startsWith('/capability/') ? route.slice('/capability/'.length) : null;
  const openEntry = openId ? catalog.find((entry) => entry.id === openId) ?? null : null;

  const categoryCounts = useMemo(() => {
    const counts = new Map<CapabilityCategory, number>();
    for (const entry of catalog) counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    return counts;
  }, [catalog]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.filter((entry) => {
      if (category !== 'all' && entry.category !== category) return false;
      if (maturity !== 'all' && entry.maturity !== maturity) return false;
      if (exposure !== 'all' && entry.exposure !== exposure) return false;
      if (!needle) return true;

      const haystack = [
        entry.id,
        entry.name,
        entry.displayName ?? '',
        entry.summary,
        entry.problemSolved,
        ...entry.tags,
        ...entry.runtimes,
        ...entry.interfaces,
      ].join(' ').toLowerCase();

      return haystack.includes(needle);
    });
  }, [catalog, category, maturity, exposure, query]);

  if (openId && !openEntry) {
    return (
      <div className="shell" style={{ gridTemplateColumns: '1fr' }}>
        <main className="main">
          <button className="back-btn" onClick={() => navigate('/capabilities')}>← CAPABILITY ARSENAL</button>
          <div className="fallback-note" style={{ position: 'static', marginTop: 18, padding: 60 }}>CAPABILITY „{openId}“ NICHT GEFUNDEN</div>
        </main>
      </div>
    );
  }

  if (openEntry) {
    return <div className="shell" style={{ gridTemplateColumns: '1fr' }}><main className="main"><CapabilityDetail entry={openEntry} onBack={() => navigate('/capabilities')} /></main></div>;
  }

  return (
    <div className="shell capability-shell">
      <aside className="sidebar capability-sidebar">
        <div className="arsenal-header">
          <h1 style={{ fontSize: 16 }}>NOX CAPABILITY<br />ARSENAL <span style={{ color: 'var(--gold)' }}>v2</span></h1>
        </div>
        <p className="sub capability-sub">REUSABLE TECHNICAL IP</p>

        <div className="side-title">Registry</div>
        <button className={`side-link ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>
          <span>Alle Capabilities</span><span className="side-count">{catalog.length}</span>
        </button>
        {CATEGORY_ORDER.map((item) => (
          <button key={item} className={`side-link ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>
            <span>{CAPABILITY_CATEGORY_LABELS[item]}</span><span className="side-count">{categoryCounts.get(item) ?? 0}</span>
          </button>
        ))}

        <div className="side-title">Exposure</div>
        <button className={`side-link ${exposure === 'all' ? 'active' : ''}`} onClick={() => setExposure('all')}><span>Alle</span></button>
        <button className={`side-link ${exposure === 'public-safe' ? 'active' : ''}`} onClick={() => setExposure('public-safe')}><span>Public Safe</span></button>
        <button className={`side-link ${exposure === 'operator-private' ? 'active' : ''}`} onClick={() => setExposure('operator-private')}><span>Operator Private</span></button>
      </aside>

      <main className="main">
        <section className="capability-intro">
          <div>
            <span className="capability-eyebrow">NOX TECHNICAL IP REGISTRY</span>
            <h1>Bridges, Agents, Workflows & proven system capabilities.</h1>
            <p>Kein Snippet-Friedhof: Jede Karte beschreibt Problem, Reifegrad, Evidence, Portability, Sicherheitsgrenzen und ein wiederverwendbares Integrationsmuster.</p>
          </div>
          <div className="capability-stat-block">
            <strong>{catalog.length}</strong>
            <span>CAPABILITIES</span>
          </div>
        </section>

        <div className="topbar capability-topbar">
          <input
            type="search"
            placeholder="Capability suchen… (Agent, Bridge, Provider, Evidence)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {(['all', 'production-proven', 'verified', 'experimental'] as MaturityFilter[]).map((item) => (
            <button key={item} className={`chip ${maturity === item ? 'on' : ''}`} onClick={() => setMaturity(item)}>
              {item === 'all' ? 'ALLE REIFEGRAD' : item.replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <p className="result-count">{filtered.length} / {catalog.length} CAPABILITIES</p>

        <div className="cap-grid">
          {filtered.map((entry) => <CapabilityCard key={entry.id} entry={entry} onOpen={(id) => navigate(`/capability/${id}`)} />)}
        </div>

        {!filtered.length && <div className="fallback-note" style={{ position: 'static', padding: 60 }}>KEINE CAPABILITY-TREFFER</div>}
      </main>
    </div>
  );
}
