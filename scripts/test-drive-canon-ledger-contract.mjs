import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = path.join(root, 'docs', 'drive-canon-ledger.json');
const markdownPath = path.join(root, 'docs', 'drive-canon-ledger.md');
const allowedDispositions = new Set(['ACTIVE_CANONICAL', 'ACTIVE_STANDALONE', 'LEGACY_WRAPPER', 'PRESET_OR_MODE', 'INTERNAL_RUNTIME', 'REVIEW_UNRESOLVED']);
const allowedConfidence = new Set(['EXACT', 'STRONG', 'REVIEW']);
const semanticDecisionPrecedence = [
  'EXPLICIT_ACTIVE_CORE',
  'EXPLICIT_FUSION_TARGET',
  'EXPLICIT_KEEP_STANDALONE',
  'EXPLICIT_LEGACY_WRAPPER',
  'EXPLICIT_INTERNAL_RUNTIME',
  'EXPLICIT_PRESET_OR_MODE',
  'INCIDENTAL_MENTION',
];
const knownCanonicalCores = [
  'bg-atmosphere-field',
  'bg-nox-interactive-glyph-field',
  'hero-text-reveal',
  'cards-interactive-surface-card',
  'forms-signal-system',
  'cursor-pointer-interaction-field',
  'overlays-surface-system',
  'system-progress-feedback',
  'transitions-route-system',
  'canvasui-particle-field-system',
  'scroll-scene-system',
  'originkit-variable-weight-text',
  'originkit-text-mutation-system',
  'originkit-text-signal-system',
  'originkit-particle-text-transformation-system',
  'skilltree-node-state-system',
  'skilltree-scene-system',
];

function catalogEntries() {
  const effectsRoot = path.join(root, 'src', 'motion-arsenal', 'effects');
  const entries = [];
  for (const category of fs.readdirSync(effectsRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const catalogPath = path.join(effectsRoot, category.name, 'catalog.ts');
    if (!fs.existsSync(catalogPath)) continue;
    const source = ts.createSourceFile(catalogPath, fs.readFileSync(catalogPath, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const meta = node.properties.find((property) => ts.isPropertyAssignment(property) && property.name.getText(source) === 'meta');
        if (meta && ts.isPropertyAssignment(meta) && ts.isObjectLiteralExpression(meta.initializer)) {
          const idProperty = meta.initializer.properties.find((property) => ts.isPropertyAssignment(property) && property.name.getText(source) === 'id');
          if (idProperty && ts.isPropertyAssignment(idProperty) && ts.isStringLiteral(idProperty.initializer)) {
            entries.push({
              id: idProperty.initializer.text,
              catalogFile: path.relative(root, catalogPath).replaceAll('\\', '/'),
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return entries;
}

const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const markdown = fs.readFileSync(markdownPath, 'utf8');
const rawEntries = catalogEntries();
const rawIds = new Set(rawEntries.map((entry) => entry.id));
const ledgerIds = ledger.static_id_ledger.map((entry) => entry.static_id);
const ledgerIdSet = new Set(ledgerIds);

assert.equal(rawEntries.length, 167, 'catalog AST extraction must continue to discover the expected 167 raw static IDs');
assert.equal(ledgerIds.length, rawEntries.length, 'ledger must contain one row per raw static ID');
assert.equal(ledgerIdSet.size, ledgerIds.length, 'ledger static IDs must be unique');
assert.deepEqual([...ledgerIdSet].sort(), [...rawIds].sort(), 'ledger must exhaustively classify exactly the raw static catalog IDs');
assert.deepEqual(new Set(ledger.classification_contract.required_dispositions), allowedDispositions, 'ledger must declare the complete disposition vocabulary');
assert.deepEqual(new Set(ledger.classification_contract.required_confidence), allowedConfidence, 'ledger must declare the complete confidence vocabulary');
assert.equal(ledger.classification_contract.static_ids_classified, rawEntries.length, 'ledger summary count must equal catalog extraction');
assert.deepEqual(ledger.semantic_contracts.decision_precedence, semanticDecisionPrecedence, 'semantic repair must document explicit decision precedence');
assert.equal(ledger.semantic_contracts.decisions.length, rawEntries.length, 'semantic contracts must cover every raw static ID');
const semanticDecisions = new Map(ledger.semantic_contracts.decisions.map((decision) => [decision.static_id, decision]));
assert.equal(semanticDecisions.size, rawEntries.length, 'semantic contracts must not duplicate static IDs');
assert.deepEqual([...semanticDecisions.keys()].sort(), [...rawIds].sort(), 'semantic contracts must classify exactly the raw catalog IDs');
assert.ok(!ledger.static_id_ledger.some((entry) => entry.disposition === 'REVIEW_UNRESOLVED'), 'explicit decisions must resolve every semantic disposition');
for (const coreId of knownCanonicalCores) assert.equal(semanticDecisions.get(coreId)?.disposition, 'ACTIVE_CANONICAL', `${coreId} must remain a canonical core`);
assert.equal(ledger.source_read_order.length, 2, 'ledger must retain both complete local Drive sources in chronology');
assert.deepEqual(ledger.source_read_order.map((source) => source.order), [0, 1], 'source chronology must remain cumulative patch then shared state');
assert.ok(ledger.source_read_order.every((source) => Number.isInteger(source.line_count) && source.line_count > 0), 'source provenance must carry positive line counts');

const sourceLineCounts = new Map(ledger.source_read_order.map((source) => [source.source, source.line_count]));

for (const entry of ledger.static_id_ledger) {
  assert.ok(allowedDispositions.has(entry.disposition), `${entry.static_id} has a permitted disposition`);
  const semanticDecision = semanticDecisions.get(entry.static_id);
  assert.ok(semanticDecision, `${entry.static_id} has a semantic disposition contract`);
  assert.equal(semanticDecision.disposition, entry.disposition, `${entry.static_id} ledger row matches its semantic contract`);
  assert.ok(semanticDecisionPrecedence.includes(semanticDecision.decision), `${entry.static_id} semantic contract uses a recognized decision`);
  assert.equal(typeof semanticDecision.rationale, 'string', `${entry.static_id} semantic contract records its basis`);
  assert.ok(semanticDecision.rationale.length > 0, `${entry.static_id} semantic contract basis is non-empty`);
  assert.ok(allowedConfidence.has(entry.confidence), `${entry.static_id} has a permitted confidence`);
  assert.equal(typeof entry.rationale, 'string', `${entry.static_id} has a rationale`);
  assert.ok(entry.rationale.length > 0, `${entry.static_id} rationale is non-empty`);
  assert.ok(entry.deterministic_mapping, `${entry.static_id} records deterministic mapping evidence`);
  assert.equal(typeof entry.deterministic_mapping.catalog_file, 'string', `${entry.static_id} records its catalog file`);
  assert.ok(rawEntries.some((raw) => raw.id === entry.static_id && raw.catalogFile === entry.deterministic_mapping.catalog_file), `${entry.static_id} catalog mapping resolves to the AST source`);
  assert.ok(Array.isArray(entry.deterministic_mapping.source_files), `${entry.static_id} records meta.sourceFiles`);
  assert.ok(Array.isArray(entry.deterministic_mapping.legacy_ids), `${entry.static_id} records meta.legacyIds`);
  assert.ok(Array.isArray(entry.deterministic_mapping.supersedes), `${entry.static_id} records meta.supersedes`);
  assert.ok(Number.isInteger(entry.deterministic_mapping.evidence_match_count) && entry.deterministic_mapping.evidence_match_count >= 0, `${entry.static_id} records its deterministic evidence count`);
  if (entry.disposition === 'REVIEW_UNRESOLVED') assert.equal(entry.confidence, 'REVIEW', `${entry.static_id} unresolved evidence must be REVIEW confidence`);
  if (entry.latest_source_evidence) {
    assert.ok(sourceLineCounts.has(entry.latest_source_evidence.source), `${entry.static_id} source evidence must cite a declared source`);
    assert.ok(Number.isInteger(entry.latest_source_evidence.line) && entry.latest_source_evidence.line > 0 && entry.latest_source_evidence.line <= sourceLineCounts.get(entry.latest_source_evidence.source), `${entry.static_id} source evidence line must be in source bounds`);
    assert.equal(typeof entry.latest_source_evidence.text, 'string', `${entry.static_id} source evidence retains the matched source text`);
  }
  if (entry.confidence !== 'REVIEW') {
    assert.ok(entry.latest_source_evidence, `${entry.static_id} non-review classification needs source evidence`);
    assert.equal(typeof entry.latest_source_evidence.matched_token, 'string', `${entry.static_id} source evidence records a deterministic token`);
    assert.equal(typeof entry.latest_source_evidence.mapping_basis, 'string', `${entry.static_id} source evidence records its mapping basis`);
  }
}

const count = (field, value) => ledger.static_id_ledger.filter((entry) => entry[field] === value).length;
for (const disposition of allowedDispositions) assert.equal(ledger.classification_contract.disposition_counts[disposition], count('disposition', disposition), `${disposition} summary count must match rows`);
for (const confidence of allowedConfidence) assert.equal(ledger.classification_contract.confidence_counts[confidence], count('confidence', confidence), `${confidence} summary count must match rows`);
assert.match(markdown, new RegExp(`\\*\\*Static catalog IDs:\\*\\* ${rawEntries.length}; \\*\\*classified:\\*\\* ${rawEntries.length}`), 'markdown summary must report exhaustive classification');
assert.ok(markdown.includes('test-drive-canon-ledger-contract.mjs'), 'markdown must document the exhaustive classification contract');

console.log(`[drive-canon-ledger-contract] PASS ids=${rawEntries.length} classified=${ledgerIds.length}`);
