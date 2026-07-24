import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.ARSENAL_URL ?? 'http://127.0.0.1:5195';
const OUT = process.env.CONTRIBUTION_ARTIFACTS ?? 'artifacts/contribution';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${BASE}/#/effect/canvasui-particle-reveal`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Diesen Effekt verbessern' }).waitFor();

  await page.getByText('EFFEKTDATEIEN ANZEIGEN').click();
  await page.getByText(/ParticleReveal\.tsx/).waitFor();

  await page.getByRole('button', { name: 'AI-PROMPT KOPIEREN' }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  for (const required of [
    'https://github.com/Finitolombardo/nox-motion-arsenal',
    'canvasui-particle-reveal',
    'Particle Density',
    'src/motion-arsenal/effects/canvas-ui/ParticleReveal.tsx',
    'npm run test:previews:smoke',
    'community/canvasui-particle-reveal/<short-description>',
  ]) {
    assert(prompt.includes(required), `copied prompt is missing: ${required}`);
  }

  const repository = page.getByRole('link', { name: 'REPOSITORY ÖFFNEN' });
  assert.equal(await repository.getAttribute('href'), 'https://github.com/Finitolombardo/nox-motion-arsenal');
  const issue = page.getByRole('link', { name: 'VERBESSERUNG ALS GITHUB ISSUE EINREICHEN' });
  assert((await issue.getAttribute('href')).includes('template=effect-improvement.yml'));
  assert((await issue.getAttribute('href')).includes('canvasui-particle-reveal'));
  await page.screenshot({ path: join(OUT, 'desktop-effect-contribution.png'), fullPage: true });

  await page.goto(`${BASE}/#/admin/submissions`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('[data-effect-id]').count(), 76, 'disabled admin route did not fall back to the gallery');
  assert.equal(await page.locator('.admin-page, [data-testid="community-submit-page"]').count(), 0);

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(`${BASE}/#/effect/canvasui-particle-reveal`, { waitUntil: 'networkidle' });
  await mobile.getByRole('heading', { name: 'Diesen Effekt verbessern' }).waitFor();
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `contribution mobile overflow: ${overflow}px`);
  await mobile.screenshot({ path: join(OUT, 'mobile-effect-contribution.png'), fullPage: true });
  await mobile.close();

  assert.equal(errors.length, 0, errors.join(' | '));
  console.log('GitHub contribution E2E: prompt, files, repository, PR/issue links and disabled legacy UI OK');
  await context.close();
} finally {
  await browser.close();
}
