// Loads any arsenal TypeScript module into Node so contract tests can exercise
// the real implementation instead of grepping source text for keywords. Vite's
// virtual modules are stubbed with the same shape the app sees.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { repoRoot } from './loadCatalogMeta.mjs';

const VIRTUAL_STUBS = {
  'virtual:build-info': 'export default { commit: "test", buildTime: "1970-01-01T00:00:00.000Z" };',
  'virtual:effect-updates': 'export default {};',
  // The ledger stub carries the real file, so selector behaviour is testable.
  'virtual:drive-canon-ledger': `export default ${JSON.stringify(
    JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs', 'drive-canon-ledger.json'), 'utf8')),
  )};`,
};

const cache = new Map();

export async function loadArsenalModule(relativePath) {
  if (cache.has(relativePath)) return cache.get(relativePath);
  const entry = path.join(repoRoot, relativePath);
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    packages: 'external',
    logLevel: 'silent',
    plugins: [
      {
        name: 'virtual-stubs',
        setup(build) {
          build.onResolve({ filter: /^virtual:/ }, (args) => ({ path: args.path, namespace: 'virtual' }));
          build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => ({
            contents: VIRTUAL_STUBS[args.path] ?? 'export default {};',
            loader: 'js',
          }));
        },
      },
    ],
  });
  const tmp = path.join(repoRoot, `.arsenal-mod.${process.pid}.${cache.size}.mjs`);
  fs.writeFileSync(tmp, result.outputFiles[0].text);
  try {
    const mod = await import(pathToFileURL(tmp).href);
    cache.set(relativePath, mod);
    return mod;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

export const ARSENAL = {
  coreCanon: 'src/motion-arsenal/data/coreCanon.ts',
  coreState: 'src/motion-arsenal/lib/coreState.ts',
  templateComposer: 'src/motion-arsenal/lib/templateComposer.ts',
  compareDiff: 'src/motion-arsenal/lib/compareDiff.ts',
  driveCanonLedger: 'src/motion-arsenal/data/driveCanonLedger.ts',
};
