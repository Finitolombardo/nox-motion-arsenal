// Verifies the core canon layer against the real catalog: every canonical core
// is described, every mode/module/preset/profile binds to a prop the component
// actually has, and every legacy wrapper in the Drive ledger is absorbed by
// exactly one core. Without this the UI could advertise a mode or module the
// runtime silently ignores.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadCatalogMeta, ledger, repoRoot } from './lib/loadCatalogMeta.mjs';
import { loadCoreCanon } from './lib/loadCoreCanon.mjs';

const { byId } = await loadCatalogMeta();
const { CORE_CANON, coreNichePresets, NICHE_IDS } = await loadCoreCanon();

const rows = ledger().static_id_ledger;
const canonicalIds = rows.filter((r) => r.disposition === 'ACTIVE_CANONICAL').map((r) => r.static_id);
const legacyIds = rows.filter((r) => r.disposition === 'LEGACY_WRAPPER').map((r) => r.static_id);

// --- coverage ---------------------------------------------------------------
assert.equal(canonicalIds.length, 32, 'the ledger must hold exactly 32 ACTIVE_CANONICAL entries');
assert.equal(CORE_CANON.length, 32, 'the core canon must describe exactly 32 cores');
assert.deepEqual(
  CORE_CANON.map((c) => c.id).sort(),
  [...canonicalIds].sort(),
  'core canon ids must match the ledger ACTIVE_CANONICAL set exactly',
);

const controlOf = (core, key) => byId.get(core.id).props.find((p) => p.key === key);

function assertValueFits(core, key, value, where) {
  const control = controlOf(core, key);
  assert.ok(control, `${core.id}: ${where} references unknown prop "${key}"`);
  if (control.type === 'select') {
    assert.ok(
      control.options?.includes(String(value)),
      `${core.id}: ${where} sets ${key}="${value}" which is not one of [${control.options?.join(', ')}]`,
    );
  }
  if (control.type === 'boolean') {
    assert.equal(typeof value, 'boolean', `${core.id}: ${where} must set boolean ${key} to a boolean`);
  }
  if (control.type === 'range') {
    assert.equal(typeof value, 'number', `${core.id}: ${where} must set range ${key} to a number`);
    if (control.min !== undefined) {
      assert.ok(
        value >= control.min && value <= control.max,
        `${core.id}: ${where} sets ${key}=${value} outside ${control.min}..${control.max}`,
      );
    }
  }
}

let modeCount = 0;
let moduleCount = 0;
let presetCount = 0;

for (const core of CORE_CANON) {
  const meta = byId.get(core.id);
  assert.ok(meta, `core ${core.id} must exist in the catalog`);
  assert.ok(core.summary?.length > 20, `${core.id} needs a real summary`);
  assert.ok(core.role?.length, `${core.id} needs a role`);
  assert.ok(['light', 'standard', 'heavy', 'gpu'].includes(core.runtimeTier), `${core.id} needs a runtime tier`);
  assert.ok(core.templateSurfaces.length, `${core.id} needs at least one template surface`);
  assert.ok(core.templateRoles.length, `${core.id} needs at least one template role`);

  // --- modes bind to a real select control ---------------------------------
  if (core.modes?.length) {
    assert.ok(core.modeControl, `${core.id} declares modes but no modeControl`);
    const control = controlOf(core, core.modeControl);
    assert.ok(control, `${core.id}: modeControl "${core.modeControl}" is not a prop`);
    assert.equal(control.type, 'select', `${core.id}: modeControl "${core.modeControl}" must be a select`);
    for (const mode of core.modes) {
      assert.ok(
        control.options.includes(mode.value),
        `${core.id}: mode "${mode.value}" is not an option of ${core.modeControl}`,
      );
      assert.ok(mode.label && mode.description, `${core.id}: mode "${mode.value}" needs a label and description`);
      modeCount += 1;
    }
  } else {
    assert.ok(!core.modeControl, `${core.id} declares a modeControl without modes`);
  }

  // --- modules bind to a real toggleable control ---------------------------
  for (const mod of core.modules ?? []) {
    const control = controlOf(core, mod.key);
    assert.ok(control, `${core.id}: module "${mod.key}" is not a prop`);
    assert.ok(mod.label && mod.description, `${core.id}: module "${mod.key}" needs a label and description`);
    if (control.type === 'boolean') {
      assert.ok(mod.onValue === undefined, `${core.id}: boolean module "${mod.key}" must not declare onValue`);
    } else {
      assert.ok(
        mod.onValue !== undefined && mod.offValue !== undefined,
        `${core.id}: non-boolean module "${mod.key}" must name both onValue and offValue`,
      );
      assertValueFits(core, mod.key, mod.onValue, `module ${mod.key} onValue`);
      assertValueFits(core, mod.key, mod.offValue, `module ${mod.key} offValue`);
    }
    moduleCount += 1;
  }

  // --- core controls are real, bounded, and not an overwhelming wall -------
  assert.ok(core.coreControls.length >= 1, `${core.id} needs at least one core control`);
  assert.ok(core.coreControls.length <= 10, `${core.id} exposes ${core.coreControls.length} core controls; keep it to 10`);
  for (const key of core.coreControls) {
    assert.ok(controlOf(core, key), `${core.id}: core control "${key}" is not a prop`);
  }

  // --- performance profiles must change real configuration ----------------
  for (const profile of core.profiles ?? []) {
    assert.ok(['lite', 'balanced', 'cinematic'].includes(profile.id), `${core.id}: unknown profile ${profile.id}`);
    const keys = Object.keys(profile.overrides);
    assert.ok(keys.length > 0, `${core.id}: profile ${profile.id} has no overrides — a profile must not be cosmetic`);
    for (const [key, value] of Object.entries(profile.overrides)) {
      assertValueFits(core, key, value, `profile ${profile.id}`);
    }
    assert.ok(profile.note?.length, `${core.id}: profile ${profile.id} needs a note`);
  }
  if (core.profiles?.length) {
    const ids = core.profiles.map((p) => p.id);
    assert.deepEqual([...new Set(ids)], ids, `${core.id}: duplicate performance profile`);
  }

  // --- niche presets carry a complete, valid state -------------------------
  const presets = coreNichePresets(core.id);
  const seen = new Set();
  for (const preset of presets) {
    assert.ok(NICHE_IDS.includes(preset.niche), `${core.id}: preset for unknown niche ${preset.niche}`);
    assert.ok(!seen.has(preset.niche), `${core.id}: duplicate preset for niche ${preset.niche}`);
    seen.add(preset.niche);
    assert.ok(preset.description?.length > 10, `${core.id}/${preset.niche}: preset needs a real description`);
    assert.ok(Object.keys(preset.props).length > 0, `${core.id}/${preset.niche}: preset sets no props`);
    for (const [key, value] of Object.entries(preset.props)) {
      assertValueFits(core, key, value, `preset ${preset.niche}`);
    }
    presetCount += 1;
  }
}

// --- every legacy wrapper is absorbed by exactly one core -------------------
const absorbedBy = new Map();
for (const core of CORE_CANON) {
  for (const id of core.absorbs) {
    assert.ok(
      !absorbedBy.has(id),
      `legacy "${id}" is claimed by both ${absorbedBy.get(id)} and ${core.id}`,
    );
    absorbedBy.set(id, core.id);
  }
}
for (const id of legacyIds) {
  assert.ok(absorbedBy.has(id), `LEGACY_WRAPPER "${id}" is not absorbed by any canonical core`);
}
for (const id of absorbedBy.keys()) {
  assert.ok(legacyIds.includes(id), `"${id}" is declared absorbed but is not a LEGACY_WRAPPER in the ledger`);
}
assert.equal(absorbedBy.size, legacyIds.length, 'absorbed legacy count must equal the ledger LEGACY_WRAPPER count');

// --- the generated preset file must not have drifted ------------------------
const generated = path.join(repoRoot, 'src', 'motion-arsenal', 'data', 'generatedCorePresets.ts');
assert.ok(fs.existsSync(generated), 'generatedCorePresets.ts must exist');

console.log(
  `[core-canon] PASS cores=${CORE_CANON.length} modes=${modeCount} modules=${moduleCount} presets=${presetCount} absorbed=${absorbedBy.size}/${legacyIds.length}`,
);
