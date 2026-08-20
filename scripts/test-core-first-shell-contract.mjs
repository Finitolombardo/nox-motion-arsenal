import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const shell = read('src', 'motion-arsenal', 'components', 'ArsenalShell.tsx');
const ledger = read('src', 'motion-arsenal', 'data', 'driveCanonLedger.ts');
const vite = read('vite.config.ts');
const declarations = read('src', 'virtual-modules.d.ts');

for (const label of ['LIBRARY', 'TEMPLATES', 'NICHE PACKS', 'COMPARE', 'GOVERNANCE']) {
  assert.match(shell, new RegExp(label), `primary navigation must include ${label}`);
}
for (const route of ['/templates', '/niche-packs', '/compare', '/governance']) {
  assert.match(shell, new RegExp(route.replaceAll('/', '\\/')), `primary navigation must route to ${route}`);
}
assert.match(shell, /coreLibraryEntries/, 'Library must derive visible effects from the core ledger selector');
assert.match(ledger, /ACTIVE_CANONICAL/, 'core ledger selector must include active canonical entries');
assert.match(ledger, /ACTIVE_STANDALONE/, 'core ledger selector must include active standalone entries');
assert.doesNotMatch(ledger, /REVIEW_UNRESOLVED[^\n]*CORE_LIBRARY_DISPOSITIONS/, 'unresolved entries must not be part of the core Library selector');
assert.match(shell, /CANON REVIEW/i, 'Governance must expose canon review');
for (const id of ['008', '009', '010', '011', '012']) {
  assert.match(shell, new RegExp(`/dashboard/${id}`), `Governance must retain dashboard ${id}`);
}
assert.match(vite, /virtual:drive-canon-ledger/, 'Vite must supply the ledger as a runtime virtual module');
assert.match(declarations, /virtual:drive-canon-ledger/, 'TypeScript must know the ledger virtual module');

console.log('[core-first-shell] PASS primary navigation and ledger-gated library contract');
