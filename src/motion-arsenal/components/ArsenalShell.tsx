import React, { useEffect, useMemo, useState } from 'react';
import type { EffectCategory, EffectEntry } from '../types';
import { buildEffectAliasIndex, findEffectEntry, matchesEffectSearch, normalizeEffectIds } from '../data/effectRegistry';
import { canonDispositionCounts, canonReviewRows, coreLibraryEntries } from '../data/driveCanonLedger';
import { CORE_CANON_BY_ID } from '../data/coreCanon';
import { decodeConfigParam, decodeShareContext, SHARE_PARAM, type EffectConfigValues } from '../lib/effectConfig';
import { readCoreStateFromQuery } from '../lib/coreState';
import { useFocusRestoration } from '../lib/focusRestoration';
import { CoreCard } from './CoreCard';
import { EffectCard } from './EffectCard';
import { IncrementalGrid } from './IncrementalGrid';
import { ConsolidationMigrationCenter } from './ConsolidationMigrationCenter';
import { ReadinessDashboards } from './ReadinessDashboards';
import { NichePacks } from './NichePacks';
import { TemplateComposer } from './TemplateComposer';
import { CompareWorkspace } from './CompareWorkspace';

const EffectDetail = React.lazy(() => import('./EffectDetail').then((m) => ({ default: m.EffectDetail })));
const CoreBuilder = React.lazy(() => import('./CoreBuilder').then((m) => ({ default: m.CoreBuilder })));

const FAVORITES_STORAGE_KEY = 'nox-motion-arsenal:favorites:v1';
const ARCHIVED_STORAGE_KEY = 'nox-motion-arsenal:archived:v1';

const CATEGORY_LABELS: Record<EffectCategory, string> = {
  premium: 'Studio-Level NOX',
  'forge-skilltree': 'Forge Skilltree',
  backgrounds: 'Backgrounds',
  hero: 'Hero',
  transitions: 'Transitions',
  scroll: 'Scroll',
  cursor: 'Cursor',
  cards: 'Cards / Panels',
  system: 'Data / System',
  forms: 'Forms',
  overlays: 'Overlays',
  originkit: 'Originkit',
  'canvas-ui': 'Canvas UI',
  img2threejs: 'Image → 3D',
  concepts: 'Konzeptdeck',
};

type PrimarySection = 'library' | 'templates' | 'niche-packs' | 'compare' | 'governance';
type LibraryView = 'canonical' | 'standalone' | 'all' | 'favorites' | 'archive';

const PRIMARY_NAV: Array<{ id: PrimarySection; label: string; route: string }> = [
  { id: 'library', label: 'LIBRARY', route: '/' },
  { id: 'templates', label: 'TEMPLATES', route: '/templates' },
  { id: 'niche-packs', label: 'NICHE PACKS', route: '/niche-packs' },
  { id: 'compare', label: 'COMPARE', route: '/compare' },
  { id: 'governance', label: 'GOVERNANCE', route: '/governance' },
];

const LIBRARY_VIEWS: Array<{ id: LibraryView; label: string }> = [
  { id: 'canonical', label: 'Canonical Cores' },
  { id: 'standalone', label: 'Standalone' },
  { id: 'all', label: 'All Approved' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'archive', label: 'Archive' },
];

// The dashboards keep their internal numbers, but the operator navigates by
// function — 008–012 mean nothing outside this repository's history.
const GOVERNANCE_DASHBOARDS = [
  { id: '008', label: 'Consolidation Center', route: '/dashboard/008', testId: 'consolidation-dashboard-link' },
  { id: '009', label: 'Niche Readiness', route: '/dashboard/009', testId: 'dashboard-009-link' },
  { id: '010', label: 'Preset Quality', route: '/dashboard/010', testId: 'dashboard-010-link' },
  { id: '011', label: 'Runtime Compatibility', route: '/dashboard/011', testId: 'dashboard-011-link' },
  { id: '012', label: 'Integration Readiness', route: '/dashboard/012', testId: 'dashboard-012-link' },
] as const;

type ModeFilter = 'all' | 'production' | 'heavy' | 'lightweight';

const MODE_FILTERS: Array<{ id: ModeFilter; label: string }> = [
  { id: 'all', label: 'ALLE' },
  { id: 'production', label: 'PRODUCTION' },
  { id: 'heavy', label: 'HEAVY' },
  { id: 'lightweight', label: 'LIGHTWEIGHT' },
];

function useHashRoute(): [string, (h: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const onHash = () => setHash(window.location.hash.slice(1));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return [hash, (h: string) => (window.location.hash = h)];
}

function readStored(key: string, aliases: ReturnType<typeof buildEffectAliasIndex>): Set<string> {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return normalizeEffectIds(Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [], aliases);
  } catch {
    return new Set();
  }
}

function GovernanceHub({ catalog, onNavigate }: { catalog: readonly EffectEntry[]; onNavigate: (route: string) => void }) {
  const reviewRows = useMemo(() => canonReviewRows(catalog), [catalog]);
  const counts = useMemo(() => canonDispositionCounts(), []);
  const unresolved = counts.REVIEW_UNRESOLVED ?? 0;

  return (
    <div className="governance-hub" data-testid="governance-hub">
      <header className="section-header">
        <p className="kicker">Read-only governance</p>
        <h1>Governance</h1>
        <p>Catalog governance is separate from the production library. Canon review reads the Drive disposition ledger without changing classifications.</p>
      </header>

      <section className="governance-counts" aria-label="Disposition counts">
        {(['ACTIVE_CANONICAL', 'ACTIVE_STANDALONE', 'LEGACY_WRAPPER', 'PRESET_OR_MODE', 'INTERNAL_RUNTIME', 'REVIEW_UNRESOLVED'] as const).map((key) => (
          <div key={key} className="governance-count">
            <span className="governance-count__value">{counts[key] ?? 0}</span>
            <span className="governance-count__label">{key.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </section>

      <section className="governance-section" aria-label="Governance dashboards">
        <h2>Dashboards</h2>
        <div className="governance-hub__actions">
          {GOVERNANCE_DASHBOARDS.map((dashboard) => (
            <button key={dashboard.id} className="side-link" data-testid={dashboard.testId} onClick={() => onNavigate(dashboard.route)}>
              <span>{dashboard.label}</span>
              <span className="side-count">{dashboard.id}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="governance-section" data-testid="canon-review">
        <h2>Canon Review</h2>
        {unresolved === 0 ? (
          <div className="canon-clean" data-testid="canon-review-empty">
            <strong>CANON CLEAN</strong>
            <span>0 unresolved effects</span>
            <p>Newly imported effects with an unclear disposition land here for review.</p>
          </div>
        ) : (
          <p>{unresolved} entries still need a disposition decision.</p>
        )}
        <details className="governance-details">
          <summary>{reviewRows.length} entries excluded from the core Library</summary>
          <ul className="readiness-dashboard__list" data-testid="canon-review-list">
            {reviewRows.map((row) => (
              <li key={row.static_id}><code>{row.static_id}</code><span>{row.disposition} · {row.name}</span></li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}

export function ArsenalShell({ catalog }: { catalog: EffectEntry[] }) {
  const [route, navigate] = useHashRoute();
  const effectAliases = useMemo(() => buildEffectAliasIndex(catalog), [catalog]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<EffectCategory | 'all'>('all');
  const [mode, setMode] = useState<ModeFilter>('all');
  const [libraryView, setLibraryView] = useState<LibraryView>('canonical');
  const [favorites, setFavorites] = useState<Set<string>>(() => readStored(FAVORITES_STORAGE_KEY, effectAliases));
  const [archived, setArchived] = useState<Set<string>>(() => readStored(ARCHIVED_STORAGE_KEY, effectAliases));
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const [routePath, routeQuery] = (() => {
    const index = route.indexOf('?');
    return index === -1 ? [route, ''] : [route.slice(0, index), route.slice(index + 1)];
  })();

  // D016: coming back from a core restores focus to the card it was opened from.
  const rememberFocus = useFocusRestoration(routePath === '/' || routePath === '');

  const coreId = routePath.startsWith('/core/') ? routePath.slice('/core/'.length) : null;
  const openId = routePath.startsWith('/effect/') ? routePath.slice('/effect/'.length) : null;
  const primarySection: PrimarySection = routePath === '/templates' ? 'templates'
    : routePath === '/niche-packs' ? 'niche-packs'
      : routePath === '/compare' ? 'compare'
        : routePath === '/governance' ? 'governance'
          : 'library';
  const isConsolidationCenter = routePath === '/dashboard/008';
  const readinessDashboard = (['009', '010', '011', '012'] as const).find((id) => routePath === `/dashboard/${id}`);

  // --- catalog partitions ---------------------------------------------------
  const approved = useMemo(() => coreLibraryEntries(catalog), [catalog]);
  const canonical = useMemo(() => approved.filter((entry) => CORE_CANON_BY_ID.has(entry.meta.id)), [approved]);
  const standalone = useMemo(() => approved.filter((entry) => !CORE_CANON_BY_ID.has(entry.meta.id)), [approved]);

  const viewSource = useMemo(() => {
    switch (libraryView) {
      case 'canonical': return canonical;
      case 'standalone': return standalone;
      case 'all': return approved;
      case 'favorites': return approved.filter((entry) => favorites.has(entry.meta.id));
      case 'archive': return approved.filter((entry) => archived.has(entry.meta.id));
    }
  }, [libraryView, canonical, standalone, approved, favorites, archived]);

  const counts = useMemo(() => {
    const map = new Map<EffectCategory, number>();
    for (const entry of viewSource) map.set(entry.meta.category, (map.get(entry.meta.category) ?? 0) + 1);
    return map;
  }, [viewSource]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return viewSource.filter((entry) => {
      const m = entry.meta;
      // Archived entries stay out of every view except the archive itself.
      if (libraryView !== 'archive' && archived.has(m.id)) return false;
      if (category !== 'all' && m.category !== category) return false;
      if (mode === 'production' && !m.productionSafe) return false;
      if (mode === 'heavy' && m.complexity !== 'heavy') return false;
      if (mode === 'lightweight' && m.complexity !== 'low') return false;
      return matchesEffectSearch(entry, q);
    });
  }, [viewSource, libraryView, archived, category, mode, query]);

  useEffect(() => {
    setFavorites((current) => normalizeEffectIds(current, effectAliases));
    setArchived((current) => normalizeEffectIds(current, effectAliases));
  }, [effectAliases]);

  useEffect(() => {
    try { window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites])); } catch { /* storage blocked */ }
  }, [favorites]);
  useEffect(() => {
    try { window.localStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify([...archived])); } catch { /* storage blocked */ }
  }, [archived]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [routePath]);

  // Legacy /effect/<id> deep links to a fused core resolve to the Core Builder.
  const canonicalRedirect = openId
    ? findEffectEntry(catalog, openId, effectAliases)?.meta.id ?? null
    : null;
  useEffect(() => {
    if (canonicalRedirect && CORE_CANON_BY_ID.has(canonicalRedirect)) {
      navigate(routeQuery ? `/core/${canonicalRedirect}?${routeQuery}` : `/core/${canonicalRedirect}`);
    }
  }, [canonicalRedirect, routeQuery]);

  const toggleIn = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (id: string) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleFavorite = toggleIn(setFavorites);
  const toggleArchive = toggleIn(setArchived);

  const addToCompare = (id: string) => {
    setCompareSelection((current) => (current.includes(id) || current.length >= 4 ? current : [...current, id]));
    navigate('/compare');
  };

  // --- routed screens -------------------------------------------------------
  if (isConsolidationCenter) {
    return <ConsolidationMigrationCenter catalog={catalog} onBack={() => navigate('/governance')} />;
  }
  if (readinessDashboard) {
    return <ReadinessDashboards catalog={catalog} dashboard={readinessDashboard} onBack={() => navigate('/governance')} />;
  }

  if (coreId) {
    const entry = findEffectEntry(catalog, coreId, effectAliases);
    const core = entry ? CORE_CANON_BY_ID.get(entry.meta.id) : undefined;
    if (entry && core) {
      return (
        <div className="shell shell--single">
          <main className="main">
            <React.Suspense fallback={<div className="fallback-note" style={{ position: 'static', minHeight: 320 }}>CORE LÄDT…</div>}>
              <CoreBuilder
                key={`${entry.meta.id}:${routeQuery}`}
                entry={entry}
                core={core}
                initialState={routeQuery ? readCoreStateFromQuery(routeQuery, entry.meta, core) : undefined}
                onBack={() => navigate('/')}
                onCompare={addToCompare}
              />
            </React.Suspense>
          </main>
        </div>
      );
    }
    return (
      <div className="shell shell--single">
        <main className="main">
          <button className="back-btn" onClick={() => navigate('/')}>← LIBRARY</button>
          <div className="fallback-note" style={{ position: 'static', marginTop: 18, padding: 60 }}>
            KEIN CANONICAL CORE „{coreId}“
          </div>
        </main>
      </div>
    );
  }

  if (openId) {
    const entry = findEffectEntry(catalog, openId, effectAliases);
    // A canonical core always opens in the builder, even via a legacy deep link.
    // The redirect itself runs in an effect (see canonicalRedirect above).
    if (entry && CORE_CANON_BY_ID.has(entry.meta.id)) {
      return (
        <div className="shell shell--single">
          <main className="main">
            <div className="fallback-note" style={{ position: 'static', minHeight: 200 }}>CORE ÖFFNEN…</div>
          </main>
        </div>
      );
    }
    const sharedParam = new URLSearchParams(routeQuery).get(SHARE_PARAM);
    const sharedConfig: EffectConfigValues | null = entry ? decodeConfigParam(entry.meta, sharedParam) : null;
    return (
      <div className="shell shell--single">
        <main className="main">
          {entry ? (
            <React.Suspense fallback={<div className="fallback-note" style={{ position: 'static', minHeight: 320 }}>EFFEKT LÄDT…</div>}>
              <EffectDetail
                key={`${entry.meta.id}:${routeQuery}`}
                entry={entry}
                initialConfig={sharedConfig}
                initialContext={decodeShareContext(sharedParam)}
                onBack={() => navigate('/')}
              />
            </React.Suspense>
          ) : (
            <>
              <button className="back-btn" onClick={() => navigate('/')}>← LIBRARY</button>
              <div className="fallback-note" style={{ position: 'static', marginTop: 18, padding: 60 }}>
                EFFEKT „{openId}“ NICHT GEFUNDEN
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  const sidebar = (
    <aside className="sidebar">
      <div className="arsenal-header">
        <h1 className="arsenal-wordmark">NOX MOTION<br />ARSENAL <span>v2</span></h1>
        <p className="arsenal-sub">MOTION SYSTEM OS</p>
      </div>
      <nav className="primary-nav primary-nav--sidebar" aria-label="Arsenal primary navigation">
        {PRIMARY_NAV.map((item) => (
          <button
            key={item.id}
            className={`side-link ${primarySection === item.id ? 'active' : ''}`}
            data-testid={`primary-nav-${item.id}`}
            onClick={() => navigate(item.route)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {primarySection === 'library' && (
        <>
          <div className="side-title">Library</div>
          {LIBRARY_VIEWS.map((view) => {
            const count = view.id === 'canonical' ? canonical.length
              : view.id === 'standalone' ? standalone.length
                : view.id === 'all' ? approved.length
                  : view.id === 'favorites' ? favorites.size
                    : archived.size;
            return (
              <button
                key={view.id}
                className={`side-link ${libraryView === view.id ? 'active' : ''}`}
                data-testid={`library-view-${view.id}`}
                aria-pressed={libraryView === view.id}
                onClick={() => { setLibraryView(view.id); setCategory('all'); }}
              >
                <span>{view.label}</span>
                <span className="side-count">{count}</span>
              </button>
            );
          })}
        </>
      )}
    </aside>
  );

  const isCoreView = libraryView === 'canonical';

  return (
    <div className="shell">
      {sidebar}
      <main className="main">
        {primarySection === 'templates' && <TemplateComposer catalog={catalog} onOpenCore={(id) => navigate(`/core/${id}`)} />}
        {primarySection === 'niche-packs' && (
          <NichePacks catalog={catalog} onOpenCore={(id, presetId) => navigate(`/core/${id}?preset=${encodeURIComponent(presetId)}`)} />
        )}
        {primarySection === 'compare' && (
          <CompareWorkspace catalog={catalog} selection={compareSelection} onSelectionChange={setCompareSelection} />
        )}
        {primarySection === 'governance' && <GovernanceHub catalog={catalog} onNavigate={navigate} />}

        {primarySection === 'library' && (
          <>
            <header className="section-header">
              <p className="kicker">
                {isCoreView ? 'Primary surface' : libraryView === 'standalone' ? 'Secondary library' : 'Full approved catalog'}
              </p>
              <h1>{LIBRARY_VIEWS.find((v) => v.id === libraryView)?.label}</h1>
              <p>
                {isCoreView
                  ? 'The fused canonical cores. Each one carries modes, modules, niche presets and performance profiles.'
                  : libraryView === 'standalone'
                    ? 'Independently usable approved effects that were not folded into a canonical core.'
                    : libraryView === 'all'
                      ? 'Every source-approved effect: canonical cores and standalone mechanics together.'
                      : libraryView === 'favorites'
                        ? 'Your marked effects.'
                        : 'Effects you archived out of the working views.'}
              </p>
            </header>

            <div className="topbar">
              <input
                type="search"
                placeholder="Suchen… (Name, Use-Case, Quelle)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="topbar__filters">
                {MODE_FILTERS.map((f) => (
                  <button key={f.id} className={`chip ${mode === f.id ? 'on' : ''}`} onClick={() => setMode(f.id)}>{f.label}</button>
                ))}
              </div>
            </div>

            <div className="category-filter" role="group" aria-label="Kategorie">
              <button className={`chip chip--quiet ${category === 'all' ? 'on' : ''}`} onClick={() => setCategory('all')}>
                ALLE <span>{viewSource.length}</span>
              </button>
              {[...counts.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([id, count]) => (
                  <button
                    key={id}
                    className={`chip chip--quiet ${category === id ? 'on' : ''}`}
                    data-category={id}
                    onClick={() => setCategory((current) => (current === id ? 'all' : id))}
                  >
                    {CATEGORY_LABELS[id]} <span>{count}</span>
                  </button>
                ))}
            </div>

            <p className="result-count" data-testid="library-result-count">
              {filtered.length} / {viewSource.length} {isCoreView ? 'CANONICAL CORES' : 'EFFECTS'}
            </p>

            <IncrementalGrid
              items={filtered}
              getKey={(entry) => entry.meta.id}
              label={`Library ${libraryView}`}
              emptyState={
                <div className="fallback-note" style={{ position: 'static', padding: 60 }}>
                  {libraryView === 'archive' ? 'ARCHIV IST LEER'
                    : libraryView === 'favorites' ? 'NOCH KEINE FAVORITEN'
                      : 'KEINE TREFFER'}
                </div>
              }
              render={(entry) => {
                const core = CORE_CANON_BY_ID.get(entry.meta.id);
                return core ? (
                  <CoreCard
                    entry={entry}
                    core={core}
                    favorite={favorites.has(entry.meta.id)}
                    onOpen={(id) => { rememberFocus(id); navigate(`/core/${id}`); }}
                    onToggleFavorite={toggleFavorite}
                  />
                ) : (
                  <EffectCard
                    entry={entry}
                    favorite={favorites.has(entry.meta.id)}
                    archived={archived.has(entry.meta.id)}
                    onOpen={(id) => { rememberFocus(id); navigate(`/effect/${id}`); }}
                    onToggleFavorite={toggleFavorite}
                    onToggleArchive={toggleArchive}
                  />
                );
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
