import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const center = read('src', 'motion-arsenal', 'components', 'ConsolidationMigrationCenter.tsx');
const health = read('src', 'motion-arsenal', 'lib', 'catalogHealth.ts');
const shell = read('src', 'motion-arsenal', 'components', 'ArsenalShell.tsx');

assert.match(center, /buildEffectAliasIndex/, 'Dashboard 008 must use the centralized alias registry');
assert.match(center, /catalogHealth/, 'Dashboard 008 must present deterministic catalog health');
assert.match(center, /ACTIVE EFFECTS/, 'Dashboard 008 must show the active effect count');
assert.match(center, /LEGACY ALIASES/, 'Dashboard 008 must show the alias count');
assert.match(center, /DUPLICATE IDS/, 'Dashboard 008 must show duplicate-id health');
assert.match(center, /ORPHANED ALIASES/, 'Dashboard 008 must show orphan-alias health');
assert.match(center, /READ-ONLY/, 'Dashboard 008 must clearly communicate its read-only scope');
assert.match(health, /duplicateIds/, 'health inspection must calculate duplicate ids from data');
assert.match(health, /orphanedAliases/, 'health inspection must calculate orphaned aliases from data');
assert.match(shell, /\/dashboard\/008/, 'Dashboard 008 must be reachable through the Arsenal shell');
assert.doesNotMatch(center, /<button[^>]*>[^<]*(delete|remove)/i, 'Dashboard 008 must not expose destructive catalog actions');

console.log('[consolidation-migration-center] PASS read-only dashboard contract');
