// Reads the niche-preset records that live inside the canonical core
// components, so the catalog preset metadata can be verified against the
// values the runtime actually applies instead of a hand-copied duplicate.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { repoRoot } from './loadCatalogMeta.mjs';

export const CORE_PRESET_SOURCES = [
  ['bg-atmosphere-field', 'backgrounds/AtmosphereField', 'ATMOSPHERE_PRESETS'],
  ['canvasui-particle-field-system', 'canvas-ui/ParticleFieldSystem', 'PARTICLE_FIELD_PRESETS'],
  ['scroll-scene-system', 'scroll/ScrollSceneSystem', 'SCROLL_SCENE_PRESETS'],
  ['skilltree-scene-system', 'forge-skilltree/SkilltreeSceneSystem', 'SKILLTREE_SCENE_PRESETS'],
  ['skilltree-node-state-system', 'forge-skilltree/SkillNodeStateSystem', 'SKILL_NODE_STATE_PRESETS'],
  ['originkit-text-mutation-system', 'originkit/TextMutationSystem', 'TEXT_MUTATION_PRESETS'],
  ['originkit-variable-weight-text', 'originkit/VariableWeightText', 'VARIABLE_WEIGHT_PRESETS'],
];

const reactStub = `const h = () => null;
export const useEffect = h, useState = () => [undefined, h], useRef = () => ({ current: null }),
  useMemo = (f) => f(), useCallback = (f) => f, useId = () => 'id', useLayoutEffect = h;
export const lazy = () => ({}), memo = (c) => c, forwardRef = (c) => c, Fragment = 'fragment';
export const createElement = () => null;
export default { useEffect, useState, useRef, useMemo, useCallback, useId, useLayoutEffect, lazy, memo, forwardRef, createElement, Fragment };`;

let cache = null;

export async function loadCorePresetSources() {
  if (cache) return cache;
  const effects = path.join(repoRoot, 'src', 'motion-arsenal', 'effects').split(path.sep).join('/');
  const entry = CORE_PRESET_SOURCES.map(
    ([, mod, name], i) => `export { ${name} as p${i} } from ${JSON.stringify(`${effects}/${mod}`)};`,
  ).join('\n');
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: repoRoot, loader: 'ts', sourcefile: 'core-preset-entry.ts' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    jsx: 'transform',
    packages: 'external',
    logLevel: 'silent',
    plugins: [
      {
        name: 'core-preset-stubs',
        setup(build) {
          build.onResolve({ filter: /\.(css|svg|png|jpg|webp)$/ }, (args) => ({ path: args.path, namespace: 'empty' }));
          build.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: 'export default {};', loader: 'js' }));
        },
      },
    ],
  });
  // Written next to node_modules so bare `react` imports still resolve.
  const tmp = path.join(repoRoot, `.core-preset-sources.${process.pid}.mjs`);
  fs.writeFileSync(tmp, result.outputFiles[0].text);
  let mod;
  try {
    mod = await import(pathToFileURL(tmp).href);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
  cache = new Map(CORE_PRESET_SOURCES.map(([id], i) => [id, mod[`p${i}`]]));
  return cache;
}
