import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'src', 'motion-arsenal', 'data', 'capabilitiesCatalog.ts');
const shellPath = path.join(root, 'src', 'motion-arsenal', 'components', 'CapabilityShell.tsx');
const appPath = path.join(root, 'src', 'App.tsx');
const mainPath = path.join(root, 'src', 'main.tsx');

const catalog = fs.readFileSync(catalogPath, 'utf8');
const shell = fs.readFileSync(shellPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');
const main = fs.readFileSync(mainPath, 'utf8');

const fail = (message) => { throw new Error(`[capabilities] ${message}`); };

const ids = [...catalog.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
const uniqueIds = new Set(ids);

if (ids.length < 14) fail(`expected at least 14 capability ids, found ${ids.length}`);
if (uniqueIds.size !== ids.length) fail(`duplicate capability ids detected (${ids.length - uniqueIds.size})`);

const requiredIds = [
  'agent-bus-direct-result-v2',
  'telegram-lifecycle-cockpit',
  'notion-agent-outbox-inbox',
  'self-restart-guard',
  'result-dedupe-stale-recovery',
  'brain-bridge-worker-queue',
  'peer-capability-dispatch',
  'anthropic-hermes-provider-bridge',
  'operator-go-approval-gates',
  'search-dominion-engine-adapters',
  'evidence-readiness-registry',
  'notebooklm-knowledge-runtime',
  'website-forge-remote-worker-handoff',
  'draft-only-action-layer',
];
for (const id of requiredIds) if (!uniqueIds.has(id)) fail(`required capability missing: ${id}`);

const forbiddenPublicPatterns = [
  /\/home\/hermesagent\//i,
  /\bBearer\s+[A-Za-z0-9._-]+/i,
  /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=]\s*['"][^'"]+/i,
  /\b159\.195\.62\.113\b/,
  /\b172\.22\.0\.1\b/,
  /\b127\.0\.0\.1:\d+\b/,
];
for (const pattern of forbiddenPublicPatterns) {
  if (pattern.test(catalog)) fail(`public capability catalog contains forbidden internal detail matching ${pattern}`);
}

for (const privateId of ['brain-bridge-worker-queue', 'anthropic-hermes-provider-bridge', 'notebooklm-knowledge-runtime']) {
  const start = catalog.indexOf(`id: '${privateId}'`);
  if (start === -1) fail(`private capability not found: ${privateId}`);
  const next = catalog.indexOf("\n  {\n    id:", start + 1);
  const block = catalog.slice(start, next === -1 ? catalog.length : next);
  if (!block.includes("publicSafe: false")) fail(`${privateId} must remain publicSafe:false`);
  if (!block.includes("exposure: 'operator-private'")) fail(`${privateId} must remain operator-private`);
}

if (!app.includes("CapabilityShell")) fail('App does not import/render CapabilityShell');
if (!app.includes("CAPABILITY ARSENAL")) fail('App mode switch missing Capability Arsenal label');
if (!main.includes("./styles/capabilities.css")) fail('capability stylesheet is not loaded');
if (!shell.includes('COPY INTEGRATION PROMPT')) fail('integration prompt copy control missing');
if (!shell.includes('OPERATOR PRIVATE')) fail('operator-private detail state missing');

console.log(`[capabilities] PASS entries=${ids.length} unique=${uniqueIds.size} public-safety=PASS`);
