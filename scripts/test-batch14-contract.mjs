import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const concepts = readFileSync('src/motion-arsenal/effects/concepts/catalog.tsx', 'utf8');

const effects = [
  ['TumblerVaultOTP', 'forms', 'forms-tumbler-vault-otp'],
  ['StepFlowWizard', 'forms', 'forms-step-flow-wizard'],
  ['PeelRevealModal', 'overlays', 'overlays-peel-reveal-modal'],
  ['StrikethroughExplainModal', 'overlays', 'overlays-strikethrough-explain-modal'],
  ['VerticalSlitSlideshow', 'transitions', 'transitions-vertical-slit-slideshow'],
  ['ViewTransitionListFilter', 'transitions', 'transitions-view-transition-list-filter'],
];

for (const [component, category, id] of effects) {
  const path = `src/motion-arsenal/effects/${category}/${component}.tsx`;
  assert.ok(existsSync(path), `${path} fehlt`);

  const source = readFileSync(path, 'utf8');
  assert.ok(
    source.includes(`export default function ${component}`) ||
      source.includes(`export default ${component}`),
    `${component}: default export missing`
  );

  const catalog = readFileSync(`src/motion-arsenal/effects/${category}/catalog.ts`, 'utf8');
  assert.ok(catalog.includes(`id: '${id}'`), `${id}: Katalog-Eintrag fehlt`);
  assert.ok(catalog.includes(`name: '${component}'`), `${component}: Katalog-Name fehlt`);
  assert.ok(catalog.includes(`./${component}`), `${component}: lazy import fehlt`);
}

for (const name of ['Tumbler Vault OTP', 'Step Flow Wizard', 'Peel Reveal Modal', 'Strikethrough Explain Modal', 'Vertical Slit Slideshow', 'View Transition List Filter']) {
  assert.ok(!concepts.includes(`'${name}'`), `${name} noch im Deck`);
}

console.log(`OK — ${effects.length} Batch-14-Effekte erfüllen den Contract.`);
