// DRIVE_UI_CANON_COVERAGE
//
// Reconciles the shipped UI OS against the Google-Drive dashboard canon
// (Dashboard 001–020 in "NOX Arsenal — Cumulative Patch"). Every requirement is
// listed with its source section, the implementation path that satisfies it,
// and a status. PASS requires that no known Drive requirement is simply
// skipped: everything must be EXISTS_EQUIVALENT, IMPLEMENTED_NOW, SUPERSEDED,
// or explicitly UNRESOLVED with a reason.
//
// Each row carries a `check` that proves the claim against the real code or the
// real behaviour — a coverage table nobody verifies is just a promise.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadCatalogMeta, repoRoot } from './lib/loadCatalogMeta.mjs';
import { loadArsenalModule, ARSENAL } from './lib/loadArsenalModule.mjs';

const read = (...parts) => fs.readFileSync(path.join(repoRoot, ...parts), 'utf8');
const src = {
  shell: read('src', 'motion-arsenal', 'components', 'ArsenalShell.tsx'),
  builder: read('src', 'motion-arsenal', 'components', 'CoreBuilder.tsx'),
  nichePacks: read('src', 'motion-arsenal', 'components', 'NichePacks.tsx'),
  composerUi: read('src', 'motion-arsenal', 'components', 'TemplateComposer.tsx'),
  compareUi: read('src', 'motion-arsenal', 'components', 'CompareWorkspace.tsx'),
  grid: read('src', 'motion-arsenal', 'components', 'IncrementalGrid.tsx'),
  preview: read('src', 'motion-arsenal', 'components', 'EffectPreview.tsx'),
  focus: read('src', 'motion-arsenal', 'lib', 'focusRestoration.ts'),
  coreState: read('src', 'motion-arsenal', 'lib', 'coreState.ts'),
  composerLib: read('src', 'motion-arsenal', 'lib', 'templateComposer.ts'),
  copyButton: read('src', 'motion-arsenal', 'components', 'CopyButton.tsx'),
};

const { metas, byId } = await loadCatalogMeta();
const canon = await loadArsenalModule(ARSENAL.coreCanon);
const state = await loadArsenalModule(ARSENAL.coreState);
const composer = await loadArsenalModule(ARSENAL.templateComposer);
const diff = await loadArsenalModule(ARSENAL.compareDiff);
const exp = await loadArsenalModule('src/motion-arsenal/lib/canonExports.ts');

const catalog = metas.map((meta) => ({ meta, Component: () => null }));
const atmosphere = canon.CORE_CANON.find((c) => c.id === 'bg-atmosphere-field');
const atmosphereMeta = byId.get('bg-atmosphere-field');
const atmospherePresets = canon.coreNichePresets('bg-atmosphere-field');
const atmosphereEntry = { meta: atmosphereMeta, Component: () => null };

const resolveNiche = (niche) => state.resolveCoreState(atmosphereMeta, atmosphere, {
  mode: null, presetId: `bg-atmosphere-field::${niche}`, profileId: null, overrides: {},
}, atmospherePresets).values;

const ROWS = [];
const row = (source, requirement, implementation, status, check) => {
  ROWS.push({ source, requirement, implementation, status, check });
};

// --- Dashboard 003 — Config / Niche Pack OS --------------------------------

row('D003', 'Effect config contract nox-arsenal-effect-config/v1', 'lib/canonExports.ts:buildEffectConfigV1', 'IMPLEMENTED_NOW', () => {
  const config = exp.buildEffectConfigV1(atmosphereEntry, atmosphere, {
    mode: null, presetId: 'bg-atmosphere-field::luxury', profileId: null, overrides: {},
  }, atmospherePresets);
  assert.equal(config.schema, 'nox-arsenal-effect-config/v1');
  for (const field of ['effectId', 'component', 'category', 'importPath', 'complexity', 'preset', 'niche', 'runtimeProfile', 'mobileProfile', 'overrides']) {
    assert.ok(field in config, `config v1 must carry ${field}`);
  }
  assert.equal(config.niche, 'luxury');
  assert.ok(
    Object.keys(config.overrides).length < Object.keys(config.resolved).length,
    'overrides must be minimal, not the full resolved surface',
  );
});

row('D003', 'Niche pack contract nox-arsenal-niche-pack/v1, machine-readable', 'lib/canonExports.ts:buildNichePackV1', 'IMPLEMENTED_NOW', () => {
  const pack = exp.buildNichePackV1('saas', catalog);
  assert.equal(pack.schema, 'nox-arsenal-niche-pack/v1');
  assert.ok(pack.effects.length > 0, 'the saas pack must contain cores');
  assert.equal(JSON.parse(exp.stableStringify(pack)).schema, 'nox-arsenal-niche-pack/v1');
});

row('D003', 'Pack bundles only active production-safe cores; legacy stays metadata', 'lib/canonExports.ts:buildNichePackV1', 'IMPLEMENTED_NOW', () => {
  const pack = exp.buildNichePackV1('saas', catalog);
  const canonicalIds = new Set(canon.CORE_CANON.map((c) => c.id));
  for (const effect of pack.effects) {
    assert.ok(canonicalIds.has(effect.effectId), `${effect.effectId} is not a canonical core`);
    assert.ok(byId.get(effect.effectId).productionSafe, `${effect.effectId} is not production safe`);
    assert.ok(Array.isArray(effect.legacyIds));
    assert.ok(!pack.effects.some((e) => effect.legacyIds.includes(e.effectId)), 'legacy ids must not appear as their own effects');
  }
});

row('D003', 'Deterministic pack ordering, order-independent serialization', 'lib/canonExports.ts:buildNichePackV1', 'IMPLEMENTED_NOW', () => {
  const pack = exp.buildNichePackV1('saas', catalog);
  const sorted = [...pack.effects].sort((a, b) => a.category.localeCompare(b.category) || a.effectId.localeCompare(b.effectId));
  assert.deepEqual(pack.effects.map((e) => e.effectId), sorted.map((e) => e.effectId));
  assert.equal(
    exp.stableStringify(exp.buildNichePackV1('saas', [...catalog].reverse())),
    exp.stableStringify(pack),
    'pack export must be independent of catalog iteration order',
  );
});

row('D003', 'COPY NICHE PACK exposed in the UI', 'components/NichePacks.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.nichePacks, /testId="copy-niche-pack"/);
  assert.match(src.nichePacks, /buildNichePackV1/);
});

row('D003', 'Preset coverage as a catalog KPI', 'lib/readinessFacts.ts + dashboard 009', 'EXISTS_EQUIVALENT', () => {
  const facts = read('src', 'motion-arsenal', 'lib', 'readinessFacts.ts');
  assert.match(facts, /effectsWithPresets/);
  assert.match(facts, /totalPresets/);
});

// --- Dashboard 004 — Niche-real gallery ------------------------------------

row('D004', 'Niche cards render the actual niche preset, not the default', 'components/NichePacks.tsx + lib/coreState.ts', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.nichePacks, /resolveCoreState\(/);
  assert.match(src.nichePacks, /propValues=\{card\.values\}/);
  const bare = state.resolveCoreState(atmosphereMeta, atmosphere, state.emptyCoreState(atmosphere, atmosphereMeta), atmospherePresets);
  assert.notDeepEqual(resolveNiche('luxury'), bare.values);
});

row('D004', 'Thumbnail shows the active preset name', 'components/NichePacks.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.nichePacks, /core-status is-preset/);
  assert.match(src.nichePacks, /\{card\.preset\.label\}/);
});

row('D004', 'Legacy effects never enter niche options or packs', 'data/coreCanon.ts:coresForNiche', 'EXISTS_EQUIVALENT', () => {
  const canonicalIds = new Set(canon.CORE_CANON.map((c) => c.id));
  for (const niche of canon.NICHE_IDS) {
    for (const core of canon.coresForNiche(niche)) {
      assert.ok(canonicalIds.has(core.id), `${core.id} is not canonical`);
    }
  }
});

row('D004', 'Clipboard fallback for pack export', 'components/CopyButton.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.copyButton, /navigator\.clipboard\?\.writeText/);
  assert.match(src.copyButton, /else done\(\)/);
});

// --- Dashboard 005 — Preset deep links -------------------------------------

row('D005', 'Deep link carries preset context into the detail view', 'lib/coreState.ts:readCoreStateFromQuery', 'IMPLEMENTED_NOW', () => {
  const parsed = state.readCoreStateFromQuery('preset=bg-atmosphere-field::luxury', atmosphereMeta, atmosphere);
  assert.equal(parsed.presetId, 'bg-atmosphere-field::luxury');
  assert.equal(state.resolveCoreState(atmosphereMeta, atmosphere, parsed, atmospherePresets).preset?.niche, 'luxury');
});

row('D005', 'Drive-era bare-niche preset query still resolves', 'lib/coreState.ts:readCoreStateFromQuery', 'IMPLEMENTED_NOW', () => {
  assert.equal(
    state.readCoreStateFromQuery('preset=luxury', atmosphereMeta, atmosphere).presetId,
    'bg-atmosphere-field::luxury',
  );
});

row('D005', 'Legacy alias route keeps the preset query when normalizing to the core', 'components/ArsenalShell.tsx canonicalRedirect', 'IMPLEMENTED_NOW', () => {
  assert.match(
    src.shell,
    /navigate\(routeQuery \?/,
    'the redirect must preserve the query, otherwise a shared preset link degrades to the bare core',
  );
});

row('D005', 'Preset link survives refresh and sharing', 'lib/coreState.ts:buildPresetLink', 'EXISTS_EQUIVALENT', () => {
  const link = state.buildPresetLink(atmosphereMeta, {
    mode: null, presetId: 'bg-atmosphere-field::luxury', profileId: null, overrides: {},
  }, 'https://example.test/');
  assert.match(link, /#\/core\/bg-atmosphere-field\?preset=/);
  assert.equal(
    state.readCoreStateFromQuery(link.split('?')[1], atmosphereMeta, atmosphere).presetId,
    'bg-atmosphere-field::luxury',
  );
});

// --- Dashboard 006 — Minimal template output -------------------------------

row('D006', 'COPY MINIMAL JSX emits component + preset + real overrides only', 'lib/coreState.ts:buildMinimalJsx', 'EXISTS_EQUIVALENT', () => {
  const resolved = state.resolveCoreState(atmosphereMeta, atmosphere, {
    mode: null, presetId: 'bg-atmosphere-field::luxury', profileId: null, overrides: {},
  }, atmospherePresets);
  const jsx = state.buildMinimalJsx(atmosphereMeta, atmosphere, resolved);
  const emitted = (jsx.match(/\w+=/g) ?? []).length;
  assert.ok(emitted > 0 && emitted < atmosphereMeta.props.length, `minimal JSX emitted ${emitted}/${atmosphereMeta.props.length}`);
  const bare = state.resolveCoreState(atmosphereMeta, atmosphere, state.emptyCoreState(atmosphere, atmosphereMeta), atmospherePresets);
  assert.match(state.buildMinimalJsx(atmosphereMeta, atmosphere, bare), /^<\w+ \/>$/);
});

row('D006', 'COPY CONFIG JSON remains the full machine-readable contract', 'components/CoreBuilder.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.builder, /testId="copy-full-config"/);
  assert.match(src.builder, /stableStringify\(configV1\)/);
});

row('D006', 'COPY PRESET LINK produces a shareable deep link', 'components/CoreBuilder.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.builder, /testId="copy-preset-link"/);
});

// --- Dashboard 007 — Niche Template Composer --------------------------------

row('D007', 'Blueprint schema nox-arsenal-template-blueprint/v1', 'lib/canonExports.ts:buildTemplateBlueprintV1', 'IMPLEMENTED_NOW', () => {
  const slots = composer.composeTemplate(catalog, 'website', 'saas');
  const bp = exp.buildTemplateBlueprintV1('website', 'saas', slots, composer.runtimeBudget(slots, 'website'));
  assert.equal(bp.schema, 'nox-arsenal-template-blueprint/v1');
  for (const slot of bp.slots) assert.ok(['selected', 'open'].includes(slot.status));
});

row('D007', 'Website and dashboard role sets', 'lib/templateComposer.ts', 'EXISTS_EQUIVALENT', () => {
  assert.deepEqual(composer.WEBSITE_ROLES, ['background', 'hero', 'surface', 'scroll', 'transition', 'form', 'overlay']);
  assert.deepEqual(composer.DASHBOARD_ROLES, ['background', 'surface', 'form', 'overlay', 'cursor', 'system']);
});

row('D007', 'Deterministic scoring instead of first match', 'lib/templateComposer.ts:composeTemplate', 'EXISTS_EQUIVALENT', () => {
  const a = composer.composeTemplate(catalog, 'website', 'saas');
  const b = composer.composeTemplate([...catalog].reverse(), 'website', 'saas');
  assert.deepEqual(a.map((s) => s.chosen?.core.id ?? null), b.map((s) => s.chosen?.core.id ?? null));
});

row('D013', 'Tie-break: templatePriority desc, complexity asc, id asc', 'lib/templateComposer.ts sort', 'IMPLEMENTED_NOW', () => {
  assert.match(src.composerLib, /b\.core\.templatePriority - a\.core\.templatePriority/);
  assert.match(src.composerLib, /COMPLEXITY_ORDER\.indexOf\(a\.entry\.meta\.complexity\)/);
  assert.match(src.composerLib, /a\.core\.id\.localeCompare\(b\.core\.id\)/);
});

row('D007', 'Dashboard surface enforces heavy budget 0', 'lib/templateComposer.ts:isEligible + SURFACE_BUDGET', 'IMPLEMENTED_NOW', () => {
  for (const niche of canon.NICHE_IDS) {
    const slots = composer.composeTemplate(catalog, 'dashboard', niche);
    const budget = composer.runtimeBudget(slots, 'dashboard');
    assert.equal(budget.heavyMax, 0, 'dashboard heavy budget must be zero');
    assert.equal(budget.heavy, 0, `dashboard/${niche} selected a heavy core`);
    assert.equal(budget.gpu, 0, `dashboard/${niche} selected a GPU core`);
  }
});

row('D007', 'Unsuitable slots stay OPEN rather than forcing an effect', 'lib/templateComposer.ts openReason', 'EXISTS_EQUIVALENT', () => {
  const starved = composer.composeTemplate(
    catalog.filter((e) => {
      const core = canon.CORE_CANON_BY_ID.get(e.meta.id);
      return !core || !core.templateRoles.includes('form');
    }),
    'website', 'saas',
  );
  const formSlot = starved.find((s) => s.role === 'form');
  assert.equal(formSlot.chosen, null);
  assert.ok(formSlot.openReason);
});

row('D007', 'Blueprint exports score, reasons and up to two alternatives per role', 'lib/canonExports.ts:buildTemplateBlueprintV1', 'IMPLEMENTED_NOW', () => {
  const slots = composer.composeTemplate(catalog, 'website', 'saas');
  const bp = exp.buildTemplateBlueprintV1('website', 'saas', slots, composer.runtimeBudget(slots, 'website'));
  const selected = bp.slots.filter((s) => s.status === 'selected');
  assert.ok(selected.length > 0);
  for (const slot of selected) {
    assert.equal(typeof slot.score, 'number');
    assert.ok(slot.reasons.length > 0);
    assert.ok(slot.alternatives.length <= 2, 'the canon exports at most two alternatives per role');
  }
});

row('D007', 'Presets may declare templateSurfaces / templateRoles / templatePriority', 'types.ts + data/coreCanon.ts', 'EXISTS_EQUIVALENT', () => {
  const preset = atmospherePresets[0];
  assert.ok(Array.isArray(preset.templateSurfaces));
  assert.ok(Array.isArray(preset.templateRoles));
  assert.equal(typeof preset.templatePriority, 'number');
});

row('D007', 'COPY WEB / DASH BLUEPRINT', 'components/TemplateComposer.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.composerUi, /COPY WEB BLUEPRINT/);
  assert.match(src.composerUi, /COPY DASH BLUEPRINT/);
});

// --- Dashboard 013 — typed contracts & validation fixtures ------------------

row('D013', 'Fixture B: preset props must resolve to known controls', 'scripts/test-core-canon-contract.mjs', 'EXISTS_EQUIVALENT', () => {
  assert.match(read('scripts', 'test-core-canon-contract.mjs'), /references unknown prop/);
});

row('D013', 'Fixture C: legacy id may not shadow an active core id', 'data/effectRegistry.ts', 'EXISTS_EQUIVALENT', () => {
  assert.match(read('src', 'motion-arsenal', 'data', 'effectRegistry.ts'), /legacy effect id is still active/);
});

row('D013', 'Fixture F: reference-lab / non-production excluded from niche packs', 'lib/canonExports.ts:buildNichePackV1', 'IMPLEMENTED_NOW', () => {
  for (const niche of canon.NICHE_IDS) {
    for (const effect of exp.buildNichePackV1(niche, catalog).effects) {
      const meta = byId.get(effect.effectId);
      assert.ok(meta.productionSafe, `${effect.effectId} is not production safe`);
      assert.notEqual(meta.mode, 'reference-lab', `${effect.effectId} is a reference-lab entry`);
    }
  }
});

row('D013', 'Fixture G: no eligible candidate leaves the slot open, no first-match fallback', 'lib/templateComposer.ts', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.composerLib, /openReason/);
  assert.match(src.composerLib, /MIN_SCORE/);
  assert.match(src.composerLib, /function isEligible/);
});

row('D013', 'Fixture J: export stability — identical semantics serialize identically', 'lib/canonExports.ts:normalizeForExport', 'IMPLEMENTED_NOW', () => {
  assert.equal(
    exp.stableStringify({ b: 1, a: { d: 2, c: [3, 1] }, u: undefined }),
    exp.stableStringify({ a: { c: [3, 1], d: 2 }, b: 1 }),
  );
});

row('D013', 'Preset resolution order base → niche preset → explicit overrides', 'lib/coreState.ts:resolveCoreState', 'EXISTS_EQUIVALENT', () => {
  const resolved = state.resolveCoreState(atmosphereMeta, atmosphere, {
    mode: null, presetId: 'bg-atmosphere-field::luxury', profileId: null, overrides: { intensity: 1.5 },
  }, atmospherePresets);
  assert.equal(resolved.values.intensity, 1.5, 'an explicit override must win over the preset');
  assert.equal(resolved.provenance.intensity, 'user');
});

row('D013', 'Numeric values validated against control bounds, not silently clamped', 'scripts/test-core-canon-contract.mjs', 'EXISTS_EQUIVALENT', () => {
  assert.match(read('scripts', 'test-core-canon-contract.mjs'), /outside/);
});

row('D013', 'MigrationHealth / retireReadiness gate retained', 'dashboard 012 Integration Readiness', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.shell, /Integration Readiness/);
  assert.match(src.shell, /\/dashboard\/012/);
});

// --- Dashboard 016 — action state, virtualization, focus --------------------

row('D016', 'Export never reports success optimistically', 'components/CopyButton.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.copyButton, /write\.then\(done, done\)/);
});

row('D016', 'DOM work scales with the viewport window, not catalog size', 'components/IncrementalGrid.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.grid, /items\.slice\(0, limit\)/);
  assert.match(src.grid, /IntersectionObserver/);
});

row('D016', 'Preview priority derived from visibility; deferred items do no work', 'components/EffectPreview.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.preview, /useInView/);
  assert.match(src.preview, /useTabVisible/);
  assert.match(src.preview, /requestIdleCallback/);
  assert.match(src.preview, /\{live && \(/);
});

row('D016', 'Filtering recomputes the list and restarts the window', 'components/IncrementalGrid.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.grid, /setLimit\(INITIAL_WINDOW\);/);
});

row('D016', 'Focus restoration on drilldown close, never onto an unmounted row', 'lib/focusRestoration.ts', 'IMPLEMENTED_NOW', () => {
  assert.match(src.focus, /requestAnimationFrame/);
  assert.match(src.focus, /data-effect-id/);
  assert.match(src.focus, /preventScroll: true/);
  assert.match(src.focus, /pending\.token !== tokenRef\.current/, 'a stale token must not steal focus');
  assert.match(src.focus, /incremental-grid/, 'a semantic fallback is required when the row is gone');
  assert.match(src.shell, /useFocusRestoration/);
  assert.match(src.shell, /rememberFocus\(id\)/);
});

row('D016', 'Bounded retry on preview error', 'components/EffectPreview.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.preview, /data-testid="preview-retry"/);
  assert.match(src.preview, /retryToken/);
});

row('D016', 'Legacy deep link normalizes the URL onto the canonical core id', 'components/ArsenalShell.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.shell, /canonicalRedirect/);
  assert.match(src.shell, /CORE_CANON_BY_ID\.has\(canonicalRedirect\)/);
});

// --- Dashboard 020 — compare, diff, provenance, export preview -------------

row('D020', 'Bounded compare workspace for 2–4 items', 'components/CompareWorkspace.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.compareUi, /MAX_SELECTION = 4/);
  assert.match(src.compareUi, /selected\.length < 2/);
});

row('D020', 'Compare stores references only and resolves through the canon', 'components/CompareWorkspace.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.compareUi, /selection: string\[\]/);
  assert.match(src.compareUi, /CORE_CANON_BY_ID\.get\(id\)/);
});

row('D020', 'Semantic diff grouped, not a raw JSON diff', 'lib/compareDiff.ts:semanticDiff', 'IMPLEMENTED_NOW', () => {
  const rows = diff.semanticDiff(atmosphereMeta, resolveNiche('restaurant'), resolveNiche('luxury'), atmosphere);
  assert.ok(rows.length > 0);
  const groups = new Set(rows.map((r) => r.group));
  for (const g of groups) {
    assert.ok(['IDENTITY', 'MODULES', 'PARAMETERS', 'NICHE_PRESET', 'PERFORMANCE'].includes(g), `unknown diff group ${g}`);
  }
  assert.ok(groups.has('MODULES'), 'a module toggle change must be grouped as MODULES, not as a parameter');
});

row('D020', 'Deterministic severity; cosmetic parameter changes never block', 'lib/compareDiff.ts', 'IMPLEMENTED_NOW', () => {
  const rows = diff.semanticDiff(atmosphereMeta, resolveNiche('restaurant'), resolveNiche('luxury'), atmosphere);
  for (const r of rows) {
    assert.ok(['INFO', 'MATERIAL', 'BLOCKING'].includes(r.severity));
    if (r.group === 'PARAMETERS') assert.notEqual(r.severity, 'BLOCKING');
  }
  assert.deepEqual(diff.semanticDiff(atmosphereMeta, resolveNiche('luxury'), resolveNiche('luxury'), atmosphere), []);
});

row('D020', 'Diff order is stable and group-sorted', 'lib/compareDiff.ts GROUP_ORDER', 'IMPLEMENTED_NOW', () => {
  const a = diff.semanticDiff(atmosphereMeta, resolveNiche('restaurant'), resolveNiche('luxury'), atmosphere);
  const b = diff.semanticDiff(atmosphereMeta, resolveNiche('restaurant'), resolveNiche('luxury'), atmosphere);
  assert.deepEqual(a.map((r) => r.key), b.map((r) => r.key));
});

row('D020', 'Provenance inspector shows which layer won', 'lib/coreState.ts + components/CoreBuilder.tsx', 'IMPLEMENTED_NOW', () => {
  assert.match(src.coreState, /provenance\[key\] = layer/);
  assert.match(src.builder, /data-testid="core-provenance"/);
  assert.match(src.builder, /data-provenance-layer=/);
  const resolved = state.resolveCoreState(atmosphereMeta, atmosphere, {
    mode: null, presetId: 'bg-atmosphere-field::luxury', profileId: 'lite', overrides: { intensity: 1.2 },
  }, atmospherePresets);
  assert.equal(resolved.provenance.intensity, 'user');
  assert.equal(resolved.provenance.performanceProfile, 'profile');
  assert.ok(Object.values(resolved.provenance).includes('preset'));
});

row('D020', 'Compare reuses the composer score; no second ranking formula', 'components/CompareWorkspace.tsx', 'SUPERSEDED', () => {
  // The shipped Compare is a factual side-by-side and deliberately does no
  // ranking, so there is no competing formula that could diverge from the
  // composer. Scoring stays in the composer, where it is unit-tested.
  assert.doesNotMatch(src.compareUi, /score/i);
});

row('D020', 'Export preview is a side-effect-free projection', 'components/CoreBuilder.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.builder, /data-testid="export-preview"/);
  const block = src.builder.slice(src.builder.indexOf('data-testid="export-preview"'));
  const preview = block.slice(0, block.indexOf('</div>'));
  assert.doesNotMatch(preview, /setState|localStorage|navigator\.clipboard/);
});

row('D020', 'Export preview shows schema, preset, overrides and payload', 'components/CoreBuilder.tsx', 'IMPLEMENTED_NOW', () => {
  assert.match(src.builder, /configV1\.schema/);
  assert.match(src.builder, /Overrides/);
  assert.match(src.builder, /minimalJsx/);
});

row('D020', 'payloadFingerprint over the normalized payload', 'lib/canonExports.ts:payloadFingerprint', 'IMPLEMENTED_NOW', () => {
  const p1 = exp.payloadFingerprint({ a: 1, b: [2, 3] });
  const p2 = exp.payloadFingerprint({ b: [2, 3], a: 1 });
  const p3 = exp.payloadFingerprint({ a: 2, b: [2, 3] });
  assert.equal(p1, p2, 'semantically identical payloads must fingerprint identically');
  assert.notEqual(p1, p3, 'a changed payload must change the fingerprint');
  assert.match(src.builder, /payloadFingerprint/);
});

row('D020', 'Provenance / source inspector available in compare', 'components/CompareWorkspace.tsx', 'EXISTS_EQUIVALENT', () => {
  assert.match(src.compareUi, /data-testid="compare-provenance"/);
  assert.match(src.compareUi, /sourceWebsite/);
  assert.match(src.compareUi, /improvementChangelog/);
});

// --- Canon policy carried over from the hardening sections ------------------

row('HERO/BG HARDENING 010', 'Glyph field preset set limited to SaaS/Creator/Fitness/Luxury/Automotive', 'data/coreCanon.ts AUTHORED_PRESETS', 'IMPLEMENTED_NOW', () => {
  const allowed = new Set(['saas', 'creator', 'fitness', 'luxury', 'automotive']);
  const presets = canon.coreNichePresets('bg-nox-interactive-glyph-field');
  assert.ok(presets.length > 0, 'the glyph field must keep its preset set');
  for (const preset of presets) {
    assert.ok(allowed.has(preset.niche), `${preset.niche} is not in the canon-approved preset set for the glyph field`);
  }
});

// --- run --------------------------------------------------------------------

const failures = [];
for (const entry of ROWS) {
  try {
    entry.check();
  } catch (error) {
    failures.push({ entry, error });
  }
}

const byStatus = ROWS.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] ?? 0) + 1;
  return acc;
}, {});

console.log('\nDRIVE_UI_CANON_COVERAGE');
console.log('='.repeat(104));
for (const r of ROWS) {
  const mark = failures.some((f) => f.entry === r) ? 'FAIL' : 'ok';
  console.log(`[${mark.padEnd(4)}] ${r.source.padEnd(22)} ${r.status.padEnd(19)} ${r.requirement}`);
  console.log(`${' '.repeat(9)}-> ${r.implementation}`);
}
console.log('='.repeat(104));

if (failures.length) {
  for (const { entry, error } of failures) {
    console.error(`\nFAILED: ${entry.source} — ${entry.requirement}\n  ${error.message}`);
  }
  process.exit(1);
}

const unresolved = ROWS.filter((r) => r.status === 'UNRESOLVED');
assert.equal(unresolved.length, 0, `unresolved Drive requirements: ${unresolved.map((r) => r.requirement).join(', ')}`);

console.log(
  `[drive-ui-canon-coverage] PASS rows=${ROWS.length} `
  + Object.entries(byStatus).map(([k, v]) => `${k}=${v}`).join(' '),
);
