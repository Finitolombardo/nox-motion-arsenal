import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const prompt = read('src/motion-arsenal/contribution/githubContribution.ts');
for (const required of [
  'https://github.com/Finitolombardo/nox-motion-arsenal',
  'Target effect:',
  'Owned files:',
  'Current controls:',
  'Allowed dependencies:',
  'npm run test:previews:smoke',
  'community/${effect.id}/<short-description>',
  'Pull request must include:',
]) {
  assert(prompt.includes(required), `contribution prompt is missing: ${required}`);
}

for (const path of [
  '.github/pull_request_template.md',
  '.github/ISSUE_TEMPLATE/effect-improvement.yml',
  'docs/future/community-platform.md',
  'docs/control-audit.md',
]) {
  assert(existsSync(path), `required contribution file is missing: ${path}`);
}

for (const [path, expectedImport] of [
  ['api/community/submissions.ts', "'./_productionGuard.js'"],
  ['api/community/tokens/create.ts', "'../_productionGuard.js'"],
  ['api/community/tokens/revoke.ts', "'../_productionGuard.js'"],
]) {
  assert(read(path).includes(expectedImport), `${path} uses an unsafe extensionless ESM import`);
}

assert(read('api/community/_productionGuard.ts').includes("404).json({ code: 'FEATURE_NOT_AVAILABLE' })"));
assert(!read('vite.config.ts').includes('localDevelopment ||'), 'local development still enables community flags');
assert(!read('vite.config.ts').includes('communityApiPlugin'), 'local Vite still mounts the future community API');

console.log('MVP contribution contract: GitHub flow, templates, disabled APIs and future boundary OK');
