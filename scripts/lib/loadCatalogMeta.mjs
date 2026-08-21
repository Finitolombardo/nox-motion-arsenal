// Loads every catalog module's `meta` objects without booting React or Vite.
// Component factories are stubbed so `lazy(() => import(...))` stays inert.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const effectsDir = path.join(root, 'src', 'motion-arsenal', 'effects');

const CATALOG_MODULES = [
  ['premium/showcaseCatalog', 'SHOWCASE_CATALOG'],
  ['premium/socialProofCatalog', 'SOCIAL_PROOF_CATALOG'],
  ['premium/catalog', 'PREMIUM_CATALOG'],
  ['forge-skilltree/catalog', 'FORGE_SKILLTREE_CATALOG'],
  ['backgrounds/catalog', 'BACKGROUNDS_CATALOG'],
  ['hero/catalog', 'HERO_CATALOG'],
  ['transitions/catalog', 'TRANSITIONS_CATALOG'],
  ['scroll/catalog', 'SCROLL_CATALOG'],
  ['cursor/catalog', 'CURSOR_CATALOG'],
  ['cards/catalog', 'CARDS_CATALOG'],
  ['system/catalog', 'SYSTEM_CATALOG'],
  ['forms/catalog', 'FORMS_CATALOG'],
  ['overlays/catalog', 'OVERLAYS_CATALOG'],
  ['canvas-ui/catalog', 'CANVAS_UI_CATALOG'],
  ['img2threejs/catalog', 'IMG2THREEJS_CATALOG'],
  ['lab/catalog', 'LAB_CATALOG'],
  ['originkit/catalog', 'ORIGINKIT_CATALOG'],
  ['concepts/catalog', 'CONCEPTS_CATALOG'],
];

const reactStub = `export const lazy = () => ({ __lazy: true });
export const memo = (c) => c;
export const forwardRef = (c) => c;
export default { lazy, memo, forwardRef };`;

// Any non-catalog import (component modules, style helpers) is replaced by an
// inert namespace so metadata extraction never executes effect runtime code.
// CommonJS so esbuild resolves any named import against the proxy at runtime.
const inertModule = `const inert = new Proxy(function () {}, { get: (t, k) => (k === '__esModule' ? false : inert), apply: () => inert });
module.exports = inert;`;

const entry = `${CATALOG_MODULES.map(([mod, name], i) => `import { ${name} as c${i} } from ${JSON.stringify(path.join(effectsDir, mod).replaceAll('\\', '/'))};`).join('\n')}
export const CATALOGS = [${CATALOG_MODULES.map((_, i) => `c${i}`).join(', ')}];`;

let cache = null;

export async function loadCatalogMeta() {
  if (cache) return cache;
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: root, loader: 'ts', sourcefile: 'catalog-meta-entry.ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
    plugins: [
      {
        name: 'catalog-meta-stubs',
        setup(build) {
          build.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, () => ({ path: 'react-stub', namespace: 'stub' }));
          build.onResolve({ filter: /^virtual:/ }, (args) => ({ path: args.path, namespace: 'inert' }));
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.kind === 'entry-point') return null;
            if (args.path.startsWith('.') || args.path.startsWith('/') || /^[A-Za-z]:/.test(args.path)) {
              const abs = path.resolve(args.resolveDir, args.path);
              for (const ext of ['.ts', '.tsx', '.mts', '.js', '']) {
                if (fs.existsSync(abs + ext) && fs.statSync(abs + ext).isFile()) {
                  // Only catalog + plain data modules are real; components stay inert.
                  if (/catalog\.tsx?$|Catalog\.tsx?$/.test(abs + ext)) return { path: abs + ext };
                  if ((abs + ext).endsWith('.tsx')) return { path: args.path, namespace: 'inert' };
                  return { path: abs + ext };
                }
              }
              return { path: args.path, namespace: 'inert' };
            }
            return { path: args.path, namespace: 'inert' };
          });
          build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: reactStub, loader: 'js' }));
          build.onLoad({ filter: /.*/, namespace: 'inert' }, () => ({ contents: inertModule, loader: 'js' }));
        },
      },
    ],
  });
  const code = result.outputFiles[0].text;
  const dataUrl = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
  const mod = await import(dataUrl);
  const entries = mod.CATALOGS.flat().map((e) => e.meta);
  cache = { metas: entries, byId: new Map(entries.map((m) => [m.id, m])) };
  return cache;
}

export function ledger() {
  return JSON.parse(fs.readFileSync(path.join(root, 'docs', 'drive-canon-ledger.json'), 'utf8'));
}

export const repoRoot = root;
export { pathToFileURL };
