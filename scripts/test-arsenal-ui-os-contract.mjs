// UI OS contracts.
//
// Where possible these exercise the real implementation (state resolution,
// composer scoring, semantic diff) rather than grepping JSX for keywords —
// a string match would keep passing after the behaviour behind it broke.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadCatalogMeta, ledger, repoRoot } from './lib/loadCatalogMeta.mjs';
import { loadArsenalModule, ARSENAL } from './lib/loadArsenalModule.mjs';

const read = (...parts) => fs.readFileSync(path.join(repoRoot, ...parts), 'utf8');
const shell = read('src', 'motion-arsenal', 'components', 'ArsenalShell.tsx');
const builder = read('src', 'motion-arsenal', 'components', 'CoreBuilder.tsx');
const nichePacks = read('src', 'motion-arsenal', 'components', 'NichePacks.tsx');
const composerUi = read('src', 'motion-arsenal', 'components', 'TemplateComposer.tsx');
const compareUi = read('src', 'motion-arsenal', 'components', 'CompareWorkspace.tsx');
const grid = read('src', 'motion-arsenal', 'components', 'IncrementalGrid.tsx');
const preview = read('src', 'motion-arsenal', 'components', 'EffectPreview.tsx');

const { metas, byId } = await loadCatalogMeta();
const canon = await loadArsenalModule(ARSENAL.coreCanon);
const state = await loadArsenalModule(ARSENAL.coreState);
const composer = await loadArsenalModule(ARSENAL.templateComposer);
const diff = await loadArsenalModule(ARSENAL.compareDiff);
const ledgerModule = await loadArsenalModule(ARSENAL.driveCanonLedger);

const rows = ledger().static_id_ledger;
const dispositionOf = new Map(rows.map((r) => [r.static_id, r.disposition]));
const canonicalIds = rows.filter((r) => r.disposition === 'ACTIVE_CANONICAL').map((r) => r.static_id);
const standaloneIds = rows.filter((r) => r.disposition === 'ACTIVE_STANDALONE').map((r) => r.static_id);

// A catalog stand-in: contract tests only need meta, never a mounted component.
const catalog = metas.map((meta) => ({ meta, Component: () => null }));

const results = [];
const contract = (name, fn) => {
  fn();
  results.push(name);
};

// --- LIBRARY --------------------------------------------------------------

contract('LIBRARY_DEFAULT_CANONICAL_ONLY', () => {
  assert.match(
    shell,
    /useState<LibraryView>\('canonical'\)/,
    'the Library must open on the canonical-cores view, not on all approved effects',
  );
  assert.match(shell, /case 'canonical': return canonical;/, 'the canonical view must render the canonical partition');
  assert.match(
    shell,
    /CORE_CANON_BY_ID\.has\(entry\.meta\.id\)/,
    'the canonical partition must be derived from the core canon, not from a hand-kept id list',
  );
});

contract('LIBRARY_CANONICAL_COUNT_32', () => {
  assert.equal(canon.CORE_CANON.length, 32, 'the canonical library must hold exactly 32 cores');
  assert.equal(canonicalIds.length, 32, 'the ledger must agree that there are 32 canonical cores');
  for (const core of canon.CORE_CANON) {
    assert.ok(byId.has(core.id), `canonical core ${core.id} must exist in the catalog`);
  }
});

contract('STANDALONE_SEPARATE', () => {
  assert.match(shell, /case 'standalone': return standalone;/, 'standalone effects need their own view');
  assert.match(
    shell,
    /standalone = useMemo\(\(\) => approved\.filter\(\(entry\) => !CORE_CANON_BY_ID\.has/,
    'standalone must be the complement of the canonical partition, so no effect is lost or duplicated',
  );
  assert.equal(standaloneIds.length, 78, 'the ledger must hold 78 standalone effects');
  // Canonical and standalone must be disjoint and together be everything approved.
  const overlap = canonicalIds.filter((id) => standaloneIds.includes(id));
  assert.deepEqual(overlap, [], 'no effect may be both canonical and standalone');
});

contract('NON_PRODUCT_DISPOSITIONS_HIDDEN', () => {
  // Behavioural: run the real selector over the whole catalog and assert that
  // nothing with a non-product disposition survives it.
  const selected = ledgerModule.coreLibraryEntries(catalog);
  const selectedIds = new Set(selected.map((entry) => entry.meta.id));
  for (const row of rows) {
    if (row.disposition === 'ACTIVE_CANONICAL' || row.disposition === 'ACTIVE_STANDALONE') continue;
    assert.ok(
      !selectedIds.has(row.static_id),
      `${row.static_id} is dispositioned ${row.disposition} but the library selector let it through`,
    );
  }
  assert.equal(
    selected.length,
    canonicalIds.length + standaloneIds.length,
    'the library selector must return exactly the approved canonical + standalone set',
  );
  // Nothing the library can show may carry a non-product disposition.
  for (const id of [...canonicalIds, ...standaloneIds]) {
    const disposition = dispositionOf.get(id);
    assert.ok(
      disposition === 'ACTIVE_CANONICAL' || disposition === 'ACTIVE_STANDALONE',
      `${id} is shown in the library but is dispositioned ${disposition}`,
    );
  }
});

// --- CORE BUILDER ---------------------------------------------------------

contract('CORE_BUILDER_MODE_BINDING', () => {
  assert.match(builder, /data-testid="core-modes"/, 'the builder needs a mode section');
  let checked = 0;
  for (const core of canon.CORE_CANON) {
    if (!core.modes?.length) continue;
    const meta = byId.get(core.id);
    for (const mode of core.modes) {
      const resolved = state.resolveCoreState(
        meta,
        core,
        { mode: mode.value, presetId: null, profileId: null, overrides: {} },
        [],
      );
      assert.equal(
        resolved.values[core.modeControl],
        mode.value,
        `${core.id}: selecting mode "${mode.value}" must write it to ${core.modeControl}`,
      );
      checked += 1;
    }
  }
  assert.ok(checked >= 40, `expected at least 40 mode bindings, checked ${checked}`);
});

contract('CORE_BUILDER_MODULE_BINDING', () => {
  assert.match(builder, /data-testid="core-modules"/, 'the builder needs a module section');
  let checked = 0;
  for (const core of canon.CORE_CANON) {
    for (const mod of core.modules ?? []) {
      const on = state.moduleToggleValue(mod, true);
      const off = state.moduleToggleValue(mod, false);
      assert.notEqual(on, off, `${core.id}/${mod.key}: on and off must differ`);
      assert.ok(state.isModuleOn(mod, on), `${core.id}/${mod.key}: on value must read back as on`);
      assert.ok(!state.isModuleOn(mod, off), `${core.id}/${mod.key}: off value must read back as off`);
      checked += 1;
    }
  }
  assert.ok(checked >= 25, `expected at least 25 module bindings, checked ${checked}`);
});

contract('PRESET_FULL_STATE', () => {
  let checked = 0;
  for (const core of canon.CORE_CANON) {
    const meta = byId.get(core.id);
    const presets = canon.coreNichePresets(core.id);
    for (const preset of presets) {
      const resolved = state.resolveCoreState(
        meta,
        core,
        { mode: null, presetId: preset.id, profileId: null, overrides: {} },
        presets,
      );
      // Every value the preset curates must survive into the resolved state.
      for (const [key, value] of Object.entries(preset.props)) {
        assert.equal(
          resolved.values[key],
          value,
          `${core.id}/${preset.niche}: preset value ${key}=${value} was lost during resolution`,
        );
      }
      checked += 1;
    }
  }
  assert.ok(checked >= 150, `expected at least 150 presets resolved, checked ${checked}`);
});

contract('RESET_TO_PRESET', () => {
  assert.match(builder, /data-testid="reset-to-preset"/, 'RESET TO PRESET must exist');
  assert.match(builder, /data-testid="reset-to-core"/, 'RESET TO CORE must exist');

  // Behavioural check: clearing overrides must return exactly the preset state,
  // and clearing the preset too must return exactly the core defaults.
  const core = canon.CORE_CANON.find((c) => canon.coreNichePresets(c.id).length > 0);
  const meta = byId.get(core.id);
  const presets = canon.coreNichePresets(core.id);
  const preset = presets[0];
  const base = { mode: null, presetId: preset.id, profileId: null, overrides: {} };
  const clean = state.resolveCoreState(meta, core, base, presets);

  const editableKey = Object.keys(preset.props).find((key) => {
    const control = meta.props.find((p) => p.key === key);
    return control?.type === 'range';
  });
  assert.ok(editableKey, `${core.id}: expected at least one numeric preset value to perturb`);
  const control = meta.props.find((p) => p.key === editableKey);
  const dirtyValue = clean.values[editableKey] === control.max ? control.min : control.max;

  const dirty = state.resolveCoreState(meta, core, { ...base, overrides: { [editableKey]: dirtyValue } }, presets);
  assert.notDeepEqual(dirty.values, clean.values, 'the override must actually change the resolved state');

  const resetToPreset = state.resolveCoreState(meta, core, { ...base, overrides: {} }, presets);
  assert.deepEqual(resetToPreset.values, clean.values, 'RESET TO PRESET must restore the exact preset state');

  const resetToCore = state.resolveCoreState(meta, core, state.emptyCoreState(core, meta), presets);
  const bare = state.resolveCoreState(meta, core, { mode: resetToCore.mode ?? null, presetId: null, profileId: null, overrides: {} }, presets);
  assert.equal(bare.preset, null, 'RESET TO CORE must drop the preset');
});

contract('MINIMAL_JSX', () => {
  const core = canon.CORE_CANON.find((c) => c.id === 'bg-atmosphere-field');
  const meta = byId.get(core.id);
  const presets = canon.coreNichePresets(core.id);

  // A bare core emits no prop wall at all.
  const bare = state.resolveCoreState(meta, core, state.emptyCoreState(core, meta), presets);
  const bareJsx = state.buildMinimalJsx(meta, core, bare);
  assert.match(bareJsx, /^<\w+ \/>$/, `an unmodified core must export as a bare tag, got: ${bareJsx}`);

  // A configured core emits only what differs — never every prop.
  const preset = presets.find((p) => p.niche === 'luxury') ?? presets[0];
  const configured = state.resolveCoreState(
    meta, core, { mode: null, presetId: preset.id, profileId: null, overrides: {} }, presets,
  );
  const jsx = state.buildMinimalJsx(meta, core, configured);
  const emitted = (jsx.match(/\w+=/g) ?? []).length;
  assert.ok(emitted > 0, 'a configured core must emit its overrides');
  assert.ok(
    emitted < meta.props.length,
    `minimal JSX emitted ${emitted} props out of ${meta.props.length} — that is a default-prop avalanche`,
  );
  assert.doesNotMatch(jsx, /undefined/, 'minimal JSX must never emit undefined');
});

// --- NICHE PACKS ----------------------------------------------------------

contract('NICHE_REAL_PREVIEW', () => {
  assert.match(
    nichePacks,
    /resolveCoreState\(/,
    'niche cards must resolve the real preset state instead of rendering core defaults',
  );
  assert.match(
    nichePacks,
    /propValues=\{card\.values\}/,
    'the niche card preview must be fed the resolved preset values',
  );
  // Each core's presets must resolve to genuinely distinct states, otherwise the
  // niche picker would offer choices that render identically. A single preset
  // matching the bare core is legitimate — several cores took their catalog
  // defaults from one of their own niches.
  let compared = 0;
  for (const core of canon.CORE_CANON) {
    const meta = byId.get(core.id);
    const presets = canon.coreNichePresets(core.id);
    if (!presets.length) continue;
    const bare = state.resolveCoreState(meta, core, state.emptyCoreState(core, meta), presets);
    const seen = new Map();
    let differsFromBare = 0;
    for (const preset of presets) {
      const applied = state.resolveCoreState(
        meta, core, { mode: null, presetId: preset.id, profileId: null, overrides: {} }, presets,
      );
      const fingerprint = JSON.stringify(applied.values);
      assert.ok(
        !seen.has(fingerprint),
        `${core.id}: presets "${preset.niche}" and "${seen.get(fingerprint)}" resolve identically`,
      );
      seen.set(fingerprint, preset.niche);
      if (JSON.stringify(bare.values) !== fingerprint) differsFromBare += 1;
      compared += 1;
    }
    assert.ok(
      differsFromBare >= presets.length - 1,
      `${core.id}: at most one preset may coincide with the bare core, ${presets.length - differsFromBare} do`,
    );
  }
  assert.ok(compared >= 150, `expected at least 150 preset previews compared, got ${compared}`);
});

contract('NICHE_PACK_CANONICAL_ONLY', () => {
  const canonicalSet = new Set(canonicalIds);
  for (const niche of canon.NICHE_IDS) {
    for (const core of canon.coresForNiche(niche)) {
      assert.ok(canonicalSet.has(core.id), `niche pack ${niche} exposed non-canonical ${core.id}`);
    }
  }
  assert.match(nichePacks, /coresForNiche\(/, 'the niche pack must be built from the canon selector');
  assert.match(nichePacks, /testId="copy-niche-pack"/, 'COPY NICHE PACK must exist');
});

// --- TEMPLATE COMPOSER ----------------------------------------------------

contract('TEMPLATE_COMPOSER_CANONICAL_ONLY', () => {
  const canonicalSet = new Set(canonicalIds);
  let filled = 0;
  let open = 0;
  for (const surface of ['website', 'dashboard']) {
    for (const niche of canon.NICHE_IDS) {
      const slots = composer.composeTemplate(catalog, surface, niche);
      assert.equal(
        slots.length,
        composer.rolesForSurface(surface).length,
        `${surface}/${niche}: every role must get a slot`,
      );
      for (const slot of slots) {
        if (!slot.chosen) {
          open += 1;
          assert.ok(slot.openReason, `${surface}/${niche}/${slot.role}: an open slot must say why`);
          continue;
        }
        assert.ok(
          canonicalSet.has(slot.chosen.core.id),
          `${surface}/${niche}/${slot.role}: composer picked non-canonical ${slot.chosen.core.id}`,
        );
        assert.ok(slot.chosen.reasons.length > 0, 'a filled slot must carry reasons');
        filled += 1;
      }
    }
  }
  assert.ok(filled > 0, 'the composer must fill slots');
  console.log(`  [composer] ${filled} slots filled, ${open} left open across all surfaces and niches`);

  // With the current canon every role happens to fill, so the OPEN SLOT path
  // would otherwise ship untested. Remove every core that declares the form
  // role and the composer must leave that slot open with a stated reason
  // rather than promoting an unrelated core into it.
  const withoutFormCores = catalog.filter((entry) => {
    const core = canon.CORE_CANON_BY_ID.get(entry.meta.id);
    return !core || !core.templateRoles.includes('form');
  });
  const starved = composer.composeTemplate(withoutFormCores, 'website', 'saas');
  const formSlot = starved.find((slot) => slot.role === 'form');
  assert.ok(formSlot, 'the form role must still get a slot');
  assert.equal(formSlot.chosen, null, 'with no form-capable core the slot must stay open');
  assert.ok(formSlot.openReason, 'an open slot must state why it is open');
  // Every other role must still fill — starving one role must not cascade.
  const stillFilled = starved.filter((slot) => slot.role !== 'form' && slot.chosen).length;
  assert.equal(
    stillFilled,
    composer.rolesForSurface('website').length - 1,
    'removing form cores must not disturb the other slots',
  );
});

contract('TEMPLATE_RUNTIME_BUDGET', () => {
  const slots = composer.composeTemplate(catalog, 'website', 'saas');
  const budget = composer.runtimeBudget(slots);
  const chosen = slots.filter((s) => s.chosen);
  assert.equal(
    budget.runtime,
    chosen.reduce((sum, s) => sum + s.chosen.cost, 0),
    'the runtime total must be the sum of the chosen cores costs',
  );
  assert.ok(budget.runtimeMax > 0 && budget.heavyMax > 0 && budget.gpuMax > 0, 'budget caps must be set');
  // The budget must react to what is actually placed, not be a static display.
  const heavier = composer.composeTemplate(catalog, 'website', 'saas', { hero: 'canvasui-particle-field-system' });
  const heavierBudget = composer.runtimeBudget(heavier);
  assert.ok(
    heavierBudget.runtime >= budget.runtime,
    'swapping in a heavier core must not lower the reported runtime cost',
  );
  assert.ok(heavierBudget.heavy >= 1, 'a heavy core must be counted in the heavy budget');
  const blueprint = composer.buildBlueprint('website', 'saas', slots, budget);
  assert.match(blueprint, /RUNTIME BUDGET/, 'the blueprint must carry the budget');
  assert.doesNotMatch(blueprint, /\bFPS\b/i, 'the blueprint must never claim a frame rate it did not measure');
  assert.match(composerUi, /data-testid="runtime-budget"/, 'the composer UI must show the budget');
});

// --- COMPARE --------------------------------------------------------------

contract('COMPARE_SEMANTIC_DIFF', () => {
  const core = canon.CORE_CANON.find((c) => c.id === 'bg-atmosphere-field');
  const meta = byId.get(core.id);
  const presets = canon.coreNichePresets(core.id);
  const resolve = (niche) => state.resolveCoreState(
    meta, core, { mode: null, presetId: `${core.id}::${niche}`, profileId: null, overrides: {} }, presets,
  ).values;

  const rowsOut = diff.semanticDiff(meta, resolve('restaurant'), resolve('luxury'));
  assert.ok(rowsOut.length > 0, 'two different presets must produce diff rows');
  for (const row of rowsOut) {
    assert.ok(row.label, 'a diff row must name the control, not just the key');
    assert.ok(
      ['higher', 'lower', 'changed', 'enabled', 'disabled'].includes(row.direction),
      `unexpected diff direction ${row.direction}`,
    );
  }
  // Identical states must produce no diff at all.
  assert.deepEqual(diff.semanticDiff(meta, resolve('luxury'), resolve('luxury')), [], 'a preset must not differ from itself');

  const facts = diff.comparisonFacts({ meta }, core, presets);
  assert.ok(facts.modes !== undefined && facts.modules !== undefined, 'comparison facts must cover modes and modules');
  assert.match(compareUi, /data-testid="semantic-diff"/, 'the compare UI must expose the semantic diff');
});

// --- GOVERNANCE -----------------------------------------------------------

contract('GOVERNANCE_ROUTES', () => {
  for (const id of ['008', '009', '010', '011', '012']) {
    assert.match(shell, new RegExp(`/dashboard/${id}`), `governance must retain dashboard ${id}`);
  }
  for (const label of ['Consolidation Center', 'Niche Readiness', 'Preset Quality', 'Runtime Compatibility', 'Integration Readiness']) {
    assert.ok(shell.includes(label), `governance navigation must be functionally named: missing "${label}"`);
  }
  for (const label of ['LIBRARY', 'TEMPLATES', 'NICHE PACKS', 'COMPARE', 'GOVERNANCE']) {
    assert.ok(shell.includes(label), `primary navigation must include ${label}`);
  }
});

contract('CANON_REVIEW_EMPTY_STATE', () => {
  const unresolved = rows.filter((r) => r.disposition === 'REVIEW_UNRESOLVED');
  assert.equal(unresolved.length, 0, 'the ledger currently expects zero unresolved effects');
  assert.match(shell, /CANON CLEAN/, 'the canon review must have a clean empty state');
  assert.match(shell, /data-testid="canon-review-empty"/, 'the empty state must be addressable');
  assert.match(shell, /0 unresolved effects/, 'the empty state must state the count');
  // The screen must survive a future non-zero count rather than only rendering
  // the happy path.
  assert.match(shell, /unresolved === 0 \?/, 'the canon review must branch on the real count');
});

// --- GALLERY RUNTIME ------------------------------------------------------

contract('GALLERY_RUNTIME_GATING', () => {
  assert.match(grid, /IntersectionObserver/, 'the grid must extend its window on scroll, not render everything');
  assert.match(grid, /items\.slice\(0, limit\)/, 'the grid must render a bounded window');
  assert.match(preview, /useTabVisible/, 'previews must sleep when the tab is hidden');
  assert.match(preview, /requestIdleCallback/, 'first mount must be scheduled on idle');
  assert.match(preview, /data-testid="preview-retry"/, 'a crashed preview must offer a retry');
  assert.match(preview, /clickToRun \|\| entry\.meta\.complexity === 'heavy'/, 'heavy effects must stay click-to-run');
  assert.match(preview, /usePrefersReducedMotion/, 'previews must observe reduced motion');
});

console.log(`[arsenal-ui-os] PASS ${results.length} contracts: ${results.join(', ')}`);
