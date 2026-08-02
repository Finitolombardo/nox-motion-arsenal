import React, { useEffect, useMemo, useState } from 'react';
import type { EffectCategory, EffectEntry } from '../types';
import { effectUpdatedAtTimestamp } from '../lib/effectDates';
import { EFFECT_COLLECTIONS } from '../data/collections';
import { decodeConfigParam, decodeShareContext, SHARE_PARAM, type EffectConfigValues } from '../lib/effectConfig';
import { EffectCard } from './EffectCard';

const EffectDetail = React.lazy(() => import('./EffectDetail').then((module) => ({ default: module.EffectDetail })));

const FAVORITES_STORAGE_KEY = 'nox-motion-arsenal:favorites:v1';
const ARCHIVED_STORAGE_KEY = 'nox-motion-arsenal:archived:v1';

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
  originkit: 'Originkit Components',
  'canvas-ui': 'Canvas UI Import',
  img2threejs: 'Image → 3D Rebuilds',
  concepts: 'Neue Effekte · Konzeptdeck',
};

const CATEGORY_ORDER: EffectCategory[] = [
  'concepts', 'premium', 'forge-skilltree', 'backgrounds', 'hero', 'transitions', 'scroll', 'cursor', 'cards', 'system', 'forms', 'overlays', 'originkit', 'canvas-ui', 'img2threejs',
];

type ModeFilter = 'all' | 'nox-adapted' | 'production' | 'heavy' | 'lightweight';
type MaintenanceSort = 'catalog' | 'newest' | 'oldest';

const MODE_FILTERS: Array<{ id: ModeFilter; label: string }> = [
  { id: 'all', label: 'ALLE' },
  { id: 'nox-adapted', label: 'NOX ADAPTED' },
  { id: 'production', label: 'PRODUCTION READY' },
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

function readFavorites(): Set<string> {
  try {
    const stored = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function readArchived(): Set<string> {
  try {
    const stored = JSON.parse(window.localStorage.getItem(ARCHIVED_STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export function ArsenalShell({ catalog }: { catalog: EffectEntry[] }) {
  const [route, navigate] = useHashRoute();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<EffectCategory | 'all'>('all');
  const [mode, setMode] = useState<ModeFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(readFavorites);
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [archived, setArchived] = useState<Set<string>>(readArchived);
  const [maintenanceSort, setMaintenanceSort] = useState<MaintenanceSort>('catalog');
  const [collectionId, setCollectionId] = useState<string | null>(null);

  const activeCollection = collectionId
    ? EFFECT_COLLECTIONS.find((c) => c.id === collectionId) ?? null
    : null;

  // Share-Links tragen die Konfiguration als Query im Hash:
  // #/effect/<id>?config=<base64url>
  const [routePath, routeQuery] = (() => {
    const index = route.indexOf('?');
    return index === -1 ? [route, ''] : [route.slice(0, index), route.slice(index + 1)];
  })();

  const openId = routePath.startsWith('/effect/') ? routePath.slice('/effect/'.length) : null;
  const openEntry = openId ? catalog.find((e) => e.meta.id === openId) : null;
  const sharedParam = new URLSearchParams(routeQuery).get(SHARE_PARAM);
  const sharedConfig: EffectConfigValues | null = openEntry
    ? decodeConfigParam(openEntry.meta, sharedParam)
    : null;
  const sharedContext = openEntry ? decodeShareContext(sharedParam) : null;

  const counts = useMemo(() => {
    const c = new Map<EffectCategory, number>();
    for (const e of catalog) c.set(e.meta.category, (c.get(e.meta.category) ?? 0) + 1);
    return c;
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Sammlungen behalten ihre kuratierte Reihenfolge, solange nicht nach
    // Update-Datum sortiert wird.
    const source = activeCollection
      ? activeCollection.effectIds
          .map((id) => catalog.find((e) => e.meta.id === id))
          .filter((e): e is EffectEntry => Boolean(e))
      : catalog;
    const entries = source.filter((e) => {
      const m = e.meta;
      if (archivedOnly ? !archived.has(m.id) : archived.has(m.id)) return false;
      if (favoritesOnly && !favorites.has(m.id)) return false;
      if (category !== 'all' && m.category !== category) return false;
      if (mode === 'nox-adapted' && m.mode !== 'nox-adapted') return false;
      if (mode === 'production' && !m.productionSafe) return false;
      if (mode === 'heavy' && m.complexity !== 'heavy') return false;
      if (mode === 'lightweight' && m.complexity !== 'low') return false;
      if (q) {
        const hay = `${m.id} ${m.name} ${m.description} ${m.bestFor.join(' ')} ${m.sourceWebsite}`.toLowerCase();
        if (!hay.includes(q)) return false;
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
  }, [catalog, query, category, mode, favoritesOnly, favorites, archivedOnly, archived, maintenanceSort, activeCollection]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
    } catch {
      // Favorites remain usable for the current session when storage is blocked.
    }
  }, [favorites]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify([...archived]));
    } catch {
      // Archive remains usable for the current session when storage is blocked.
    }
  }, [archived]);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleArchive = (id: string) => {
    setArchived((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Detail view scrolls to top on open.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [openId]);

  if (openEntry) {
    return (
      <div className="shell" style={{ gridTemplateColumns: '1fr' }}>
        <main className="main">
          <React.Suspense fallback={<div className="fallback-note" style={{ position: 'static', minHeight: 320 }}>EFFEKT LÄDT…</div>}>
            <EffectDetail
              // Ein Share-Link auf denselben Effekt muss den State neu setzen,
              // deshalb geht die serialisierte Config in den Key ein.
              key={`${openEntry.meta.id}:${routeQuery}`}
              entry={openEntry}
              initialConfig={sharedConfig}
              initialContext={sharedContext}
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
    <div className="shell">
      <aside className="sidebar">
        <div className="arsenal-header">
          <h1 style={{ fontSize: 16 }}>NOX MOTION<br />ARSENAL <span style={{ color: 'var(--red)' }}>v2</span></h1>
        </div>
        <p className="sub" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.14em', margin: '4px 0 0' }}>
          INTERNAL EFFECT LIBRARY
        </p>
        <div className="side-title">Sammlungen</div>
        {EFFECT_COLLECTIONS.map((c) => (
          <button
            key={c.id}
            className={`side-link ${collectionId === c.id ? 'active' : ''}`}
            data-testid={`collection-${c.id}`}
            title={c.description}
            onClick={() => {
            setCollectionId((current) => (current === c.id ? null : c.id));
            setFavoritesOnly(false);
            setArchivedOnly(false);
            setCategory('all');
            }}
          >
            <span>{c.label}</span>
            <span className="side-count">{c.effectIds.length}</span>
          </button>
        ))}
        <div className="side-title">Meine Auswahl</div>
        <button
          className={`side-link favorites-link ${favoritesOnly ? 'active' : ''}`}
          data-testid="favorites-sidebar-filter"
          onClick={() => {
            setFavoritesOnly(true);
            setArchivedOnly(false);
            setCategory('all');
            setCollectionId(null);
          }}
        >
          <span><span aria-hidden="true">♥</span> Favoriten</span>
          <span className="side-count">{favorites.size}</span>
        </button>
        <button
          className={`side-link archive-link ${archivedOnly ? 'active' : ''}`}
          data-testid="archive-sidebar-filter"
          onClick={() => {
            setArchivedOnly(true);
            setFavoritesOnly(false);
            setCategory('all');
            setCollectionId(null);
          }}
        >
          <span><span aria-hidden="true">▧</span> Archiv</span>
          <span className="side-count">{archived.size}</span>
        </button>
        <div className="side-title">Kategorien</div>
        <button
          className={`side-link ${!favoritesOnly && !collectionId && category === 'all' ? 'active' : ''}`}
          onClick={() => {
            setFavoritesOnly(false);
            setArchivedOnly(false);
            setCategory('all');
            setCollectionId(null);
          }}
        >
          <span>Alle Effekte</span>
          <span className="side-count">{catalog.length}</span>
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            className={`side-link ${!favoritesOnly && !collectionId && category === c ? 'active' : ''}`}
            onClick={() => {
              setFavoritesOnly(false);
              setArchivedOnly(false);
              setCategory(c);
              setCollectionId(null);
            }}
          >
            <span>{CATEGORY_LABELS[c]}</span>
            <span className="side-count">{counts.get(c) ?? 0}</span>
          </button>
        ))}
      </aside>

      <main className="main">
        <div className="topbar">
          <input
            type="search"
            placeholder="Effekt suchen… (Name, Use-Case, Quelle)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {MODE_FILTERS.map((f) => (
            <button key={f.id} className={`chip ${mode === f.id ? 'on' : ''}`} onClick={() => setMode(f.id)}>
              {f.label}
            </button>
          ))}
          <button
            className={`chip favorites-chip ${favoritesOnly ? 'on' : ''}`}
            data-testid="favorites-chip"
            aria-pressed={favoritesOnly}
            onClick={() => {
              setFavoritesOnly((active) => !active);
              setArchivedOnly(false);
              setCollectionId(null);
            }}
          >
            <span aria-hidden="true">♥</span> NUR FAVORITEN
          </button>
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
          {activeCollection ? ` · SAMMLUNG: ${activeCollection.label.toUpperCase()}` : ''}
          {favoritesOnly ? ` · ${favorites.size} FAVORITEN GESPEICHERT` : ''}
          {archivedOnly ? ` · ${archived.size} ARCHIVIERT` : ''}
        </p>
        <div className="grid">
          {filtered.map((e) => (
            <EffectCard
              key={e.meta.id}
              entry={e}
              favorite={favorites.has(e.meta.id)}
              archived={archived.has(e.meta.id)}
              onOpen={(id) => navigate(`/effect/${id}`)}
              onToggleFavorite={toggleFavorite}
              onToggleArchive={toggleArchive}
            />
          ))}
        </div>
        {!filtered.length && (
          <div className="fallback-note empty-favorites" style={{ position: 'static', padding: 60 }}>
            {archivedOnly ? 'ARCHIV IST LEER · KARTE ÜBER ARCHIV ABLEGEN' : favoritesOnly ? 'NOCH KEINE FAVORITEN · HERZ AUF EINER KARTE MARKIEREN' : 'KEINE TREFFER'}
          </div>
        )}
      </main>
    </div>
  );
}
