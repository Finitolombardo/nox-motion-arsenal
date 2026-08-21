// Loads the TypeScript core-canon module into Node so contract tests can read
// the same data the app renders, instead of re-parsing it out of source text.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { repoRoot } from './loadCatalogMeta.mjs';

let cache = null;

export async function loadCoreCanon() {
  if (cache) return cache;
  const entry = path.join(repoRoot, 'src', 'motion-arsenal', 'data', 'coreCanon.ts');
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    packages: 'external',
    logLevel: 'silent',
  });
  const tmp = path.join(repoRoot, `.core-canon.${process.pid}.mjs`);
  fs.writeFileSync(tmp, result.outputFiles[0].text);
  try {
    cache = await import(pathToFileURL(tmp).href);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
  return cache;
}
