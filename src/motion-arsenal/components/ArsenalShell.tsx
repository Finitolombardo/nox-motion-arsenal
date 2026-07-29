import React, { useEffect, useMemo, useState } from 'react';
import type { EffectCategory, EffectEntry } from '../types';
import { effectUpdatedAtTimestamp } from '../lib/effectDates';
import { EffectCard } from './EffectCard';

const EffectDetail = React.lazy(() => import('./EffectDetail').then((module) => ({ default: module.EffectDetail })));

const FAVORITES_STORAGE_KEY = 'nox-motion-arsenal:favorites:v1';

const CATEGORY_LABELS: Record<EffectCategory, string> = {
  premium: 'Studio-Level NOX',
  'forge-skilltree': 'NOX Forge Skilltree Systems',
  backgrounds: 'Signature Backgrounds',
  hero: 'Hero Transitions',
  transitions: 'Page / Section Transitions',
  scroll: 'Scroll Choreography',
  cursor: 'Cursor / Mouse',
  cards: 'Cards / Panels',
  system: 'Data / System',
  forms: 'Form / Quiz',
  overlays: 'Modal / Overlay',
  'canvas-ui': 'Canvas UI Import',
  img2threejs: 'Image → 3D Rebuilds',
};

const CATEGORY_ORDER: EffectCategory[] = [
  'premium', 'forge-skilltree', 'backgrounds', 'hero', 'transitions', 'scroll', 'cursor', 'cards', 'system', 'forms', 'overlays', 'canvas-ui', 'img2threejs',
];

const CATEGORY_SET = new Set<string>(CATEGORY_ORDER);
const SIGNATURE_CATEGORIES = new Set<EffectCategory>(['premium', 'forge-skilltree']);

type ModeFilter = 'all' | 'signature' | 'production' | 'heavy' | 'lightweight';
type MaintenanceSort = 'catalog' | 'newest' | 'oldest';

const MODE_FILTERS: Array<{ id: ModeFilter; label: string }> = [
  { id: 'all', label: 'ALLE' },
  { id: 'signature', label: 'SIGNATURE' },
  { id: 'production', label: 'PRODUCTION READY' },
  { id: 'heavy', label: 'HEAVY' },
  { id: 'lightweight', label: 'LIGHTWEIGHT' },
];

const MODE_SET = new Set<ModeFilter>(MODE_FILTERS.map((filter) => filter.id));
const SORT_SET = new Set<MaintenanceSort>(['catalog', 'newest', 'oldest']);

function readSearchParams() {
  return new URLSearchParams(window.location.search);
}

function initialQuery() {
  return readSearchParams().get('q') ?? '';
}

function initialCategory(): EffectCategory | 'all' {
  const value = readSearchParams().get('category');
  return value && CATEGORY_SET.has(value) ? value as EffectCategory : 'all';
}

function initialMode(): ModeFilter {
  const value = readSearchParams().get('mode') as ModeFilter | null;
  return value && MODE_SET.has(value) ? value : 'all';
}

function initialSort(): MaintenanceSort {
  const value = readSearchParams().get('sort') as MaintenanceSort | null;
  return value && SORT_SET.has(value) ? value : 'catalog';
}

function initialFavoritesOnly() {
  return readSearchParams().get('favorites') === '1';
}

function useHashRoute(): [string, (h: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const onHash = () => setHash(window.location.hash.slice(1));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return [hash, (h: string) => (window.location.hash = h)];
}

function readFavorites(): Set<string> {
  try {
    const stored = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export function ArsenalShell({ catalog }: { catalog: EffectEntry[] }) {
  const [route, navigate] = useHashRoute();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<EffectCategory | 'all'>(initialCategory);
  const [mode, setMode] = useState<ModeFilter>(initialMode);
  const [favoritesOnly, setFavoritesOnly] = useState(initialFavoritesOnly);
  const [favorites, setFavorites] = useState<Set<string>>(readFavorites);
  const [maintenanceSort, setMaintenanceSort] = useState<MaintenanceSort>(initialSort);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openId = route.startsWith('/effect/') ? route.slice('/effect/'.length) : null;
  const openEntry = openId ? catalog.find((entry) => entry.meta.id === openId) : null;

  const counts = useMemo(() => {
    const result = new Map<EffectCategory, number>();
    for (const entry of catalog) {
      result.set(entry.meta.category, (result.get(entry.meta.category) ?? 0) + 1);
    }
    return result;
  }, [catalog]);

  const libraryStats = useMemo(() => ({
    signature: catalog.filter((entry) => SIGNATURE_CATEGORIES.has(entry.meta.category)).length,
    production: catalog.filter((entry) => entry.meta.productionSafe).length,
    heavy: catalog.filter((entry) => entry.meta.complexity === 'heavy').length,
  }), [catalog]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const entries = catalog.filter((entry) => {
      const meta = entry.meta;
      if (favoritesOnly && !favorites.has(meta.id)) return false;
      if (category !== 'all' && meta.category !== category) return false;
      if (mode === 'signature' && !SIGNATURE_CATEGORIES.has(meta.category)) return false;
      if (mode === 'production' && !meta.productionSafe) return false;
      if (mode === 'heavy' && meta.complexity !== 'heavy') return false;
      if (mode === 'lightweight' && meta.complexity !== 'low') return false;
      if (normalizedQuery) {
        const haystack = `${meta.id} ${meta.name} ${meta.displayName ?? ''} ${meta.description} ${meta.bestFor.join(' ')} ${meta.sourceWebsite}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });

    if (maintenanceSort === 'catalog') return entries;
    const direction = maintenanceSort === 'newest' ? -1 : 1;
    return entries.sort(
      (a, b) =>
        (effectUpdatedAtTimestamp(a.meta.updatedAt) - effectUpdatedAtTimestamp(b.meta.updatedAt)) *
        direction,
    );
  }, [catalog, query, category, mode, favoritesOnly, favorites, maintenanceSort]);

  const hasActiveExplorerState = Boolean(
    query.trim() || category !== 'all' || mode !== 'all' || favoritesOnly || maintenanceSort !== 'catalog',
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
    } catch {
      // Favorites remain usable for the current session when storage is blocked.
    }
  }, [favorites]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const setOrDelete = (key: string, value: string, defaultValue: string) => {
      if (value === defaultValue || value === '') url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    };

    setOrDelete('q', query.trim(), '');
    setOrDelete('category', category, 'all');
    setOrDelete('mode', mode, 'all');
    setOrDelete('sort', maintenanceSort, 'catalog');
    if (favoritesOnly) url.searchParams.set('favorites', '1');
    else url.searchParams.delete('favorites');

    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [query, category, mode, favoritesOnly, maintenanceSort]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  }, [openId]);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chooseCategory = (nextCategory: EffectCategory | 'all') => {
    setFavoritesOnly(false);
    setCategory(nextCategory);
    setSidebarOpen(false);
  };

  const resetExplorer = () => {
    setQuery('');
    setCategory('all');
    setMode('all');
    setFavoritesOnly(false);
    setMaintenanceSort('catalog');
  };

  if (openEntry) {
    return (
      <div className="shell" style={{ gridTemplateColumns: '1fr' }}>
        <main className="main">
          <React.Suspense fallback={<div className="fallback-note" style={{ position: 'static', minHeight: 320 }}>EFFEKT LÄDT…</div>}>
            <EffectDetail
              key={openEntry.meta.id}
              entry={openEntry}
              onBack={() => navigate('/')}
            />
          </React.Suspense>
        </main>
      </div>
    );
  }

  if (openId) {
    return (
      <div className="shell" style={{ gridTemplateColumns: '1fr' }}>
        <main className="main">
          <button className="back-btn" onClick={() => navigate('/')}>← ARSENAL</button>
          <div className="fallback-note" style={{ position: 'static', marginTop: 18, padding: 60 }}>
            EFFEKT „{openId}“ NICHT GEFUNDEN
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="shell arsenal-v3-shell">
      <button
        className="mobile-arsenal-nav-trigger"
        type="button"
        aria-controls="arsenal-sidebar"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen(true)}
      >
        <b aria-hidden="true">☰</b> KATEGORIEN
      </button>

      {sidebarOpen && (
        <button
          className="mobile-nav-scrim"
          type="button"
          aria-label="Kategorien schließen"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside id="arsenal-sidebar" className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header-row">
          <div>
            <div className="arsenal-header">
              <h1 style={{ fontSize: 16 }}>NOX MOTION<br />ARSENAL <span style={{ color: 'var(--red)' }}>v3</span></h1>
            </div>
            <p className="sub" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', margin: '4px 0 0' }}>
              EFFECT INTELLIGENCE LIBRARY
            </p>
          </div>
          <button
            className="mobile-sidebar-close"
            type="button"
            aria-label="Kategorien schließen"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="side-title">Meine Auswahl</div>
        <button
          className={`side-link favorites-link ${favoritesOnly ? 'active' : ''}`}
          data-testid="favorites-sidebar-filter"
          onClick={() => {
            setFavoritesOnly(true);
            setCategory('all');
            setSidebarOpen(false);
          }}
        >
          <span><span aria-hidden="true">♥</span> Favoriten</span>
          <span className="side-count">{favorites.size}</span>
        </button>

        <div className="side-title">Kategorien</div>
        <button
          className={`side-link ${!favoritesOnly && category === 'all' ? 'active' : ''}`}
          onClick={() => chooseCategory('all')}
        >
          <span>Alle Effekte</span>
          <span className="side-count">{catalog.length}</span>
        </button>
        {CATEGORY_ORDER.map((categoryId) => (
          <button
            key={categoryId}
            className={`side-link ${!favoritesOnly && category === categoryId ? 'active' : ''}`}
            onClick={() => chooseCategory(categoryId)}
          >
            <span>{CATEGORY_LABELS[categoryId]}</span>
            <span className="side-count">{counts.get(categoryId) ?? 0}</span>
          </button>
        ))}
      </aside>

      <main className="main">
        <section className="arsenal-command-header" aria-labelledby="arsenal-command-title">
          <div className="arsenal-command-copy">
            <span className="command-kicker">NOX EFFECT INTELLIGENCE · FOUNDATION V3</span>
            <h2 id="arsenal-command-title">Finde den richtigen Effekt. Nicht nur den lautesten.</h2>
            <p>Filter nach Einsatzreife, Performance-Budget und NOX-Signature-Systemen. Der aktuelle Zustand bleibt in der URL erhalten und kann direkt geteilt werden.</p>
          </div>
          <div className="arsenal-command-stats" aria-label="Arsenal Status">
            <div className="command-stat"><strong>{libraryStats.signature}</strong><span>Signature</span></div>
            <div className="command-stat"><strong>{libraryStats.production}</strong><span>Production</span></div>
            <div className="command-stat"><strong>{libraryStats.heavy}</strong><span>Heavy</span></div>
          </div>
        </section>

        <div className="topbar">
          <input
            type="search"
            aria-label="Effekte durchsuchen"
            placeholder="Effekt suchen… (Name, Use-Case, Quelle)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {MODE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              className={`chip ${mode === filter.id ? 'on' : ''}`}
              onClick={() => setMode(filter.id)}
            >
              {filter.label}
            </button>
          ))}
          <button
            className={`chip favorites-chip ${favoritesOnly ? 'on' : ''}`}
            data-testid="favorites-chip"
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly((active) => !active)}
          >
            <span aria-hidden="true">♥</span> NUR FAVORITEN
          </button>
          {hasActiveExplorerState && (
            <button className="chip clear-filter-chip" type="button" onClick={resetExplorer}>
              RESET
            </button>
          )}
          <label className="maintenance-sort">
            <span>UPDATE</span>
            <select
              data-testid="maintenance-sort"
              value={maintenanceSort}
              onChange={(event) => setMaintenanceSort(event.target.value as MaintenanceSort)}
            >
              <option value="catalog">KATALOG-REIHENFOLGE</option>
              <option value="newest">NEUESTE ZUERST</option>
              <option value="oldest">ÄLTESTE ZUERST</option>
            </select>
          </label>
        </div>

        <p className="result-count">
          {filtered.length} / {catalog.length} EFFEKTE
          {favoritesOnly ? ` · ${favorites.size} FAVORITEN GESPEICHERT` : ''}
          {category !== 'all' ? ` · ${CATEGORY_LABELS[category]}` : ''}
        </p>

        <div className="grid">
          {filtered.map((entry) => (
            <EffectCard
              key={entry.meta.id}
              entry={entry}
              favorite={favorites.has(entry.meta.id)}
              onOpen={(id) => navigate(`/effect/${id}`)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>

        {!filtered.length && (
          <div className="fallback-note empty-favorites" style={{ position: 'static', padding: 60 }}>
            {favoritesOnly ? 'NOCH KEINE FAVORITEN · HERZ AUF EINER KARTE MARKIEREN' : 'KEINE TREFFER · FILTER ZURÜCKSETZEN'}
          </div>
        )}
      </main>
    </div>
  );
}
