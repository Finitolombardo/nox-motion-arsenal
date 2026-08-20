import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const shell = read('src', 'motion-arsenal', 'components', 'ArsenalShell.tsx');
const readiness = read('src', 'motion-arsenal', 'components', 'ReadinessDashboards.tsx');
const facts = read('src', 'motion-arsenal', 'lib', 'readinessFacts.ts');

for (const id of ['009', '010', '011', '012']) {
  assert.match(shell, new RegExp(`/dashboard/${id}`), `Dashboard ${id} must be reachable through ArsenalShell`);
  assert.match(shell, new RegExp(`dashboard-${id}-link`), `Dashboard ${id} needs a navigation link`);
  assert.match(readiness, new RegExp(`dashboard === '${id}'`), `Dashboard ${id} must identify itself`);
}
assert.match(readiness, /Niche Readiness/, 'Dashboard 009 must expose niche readiness');
assert.match(readiness, /Preset Quality/, 'Dashboard 010 must expose preset quality');
assert.match(readiness, /Runtime Compatibility/, 'Dashboard 011 must expose runtime compatibility');
assert.match(readiness, /Integration Readiness/, 'Dashboard 012 must expose integration readiness');
assert.match(readiness, /OPERATOR REVIEW/, 'Technical QA visual review must remain operator-owned');
assert.match(facts, /presets/, 'Dashboard facts must be computed from preset catalog metadata');
assert.match(facts, /importPath/, 'Integration facts must use catalog integration metadata');
assert.match(facts, /reducedMotionNotes/, 'Runtime facts must use runtime catalog metadata');
assert.doesNotMatch(readiness, /<button[^>]*>[^<]*(delete|remove)/i, 'Readiness dashboards must not expose destructive catalog actions');

console.log('[readiness-dashboards] PASS catalog-backed dashboard contracts');
