import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.ARSENAL_URL ?? 'http://localhost:5195';
const EFFECT_ID = 'canvasui-glass-lens';

const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');

async function setControl(page, key, value) {
  const control = page.locator(`[data-control-key="${key}"]`);
  await control.waitFor({ state: 'visible' });
  await control.evaluate((element, next) => {
    if (!(element instanceof HTMLInputElement)) throw new Error('expected input control');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setter) throw new Error('native input value setter unavailable');
    setter.call(element, String(next));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  await page.waitForTimeout(350);
}

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(`PAGEERROR: ${error.message}`));

    await page.goto(`${BASE}/#/effect/${EFFECT_ID}`, { waitUntil: 'load' });
    const preview = page.locator('.fx-preview-detail');
    await preview.waitFor({ state: 'visible' });
    await page.waitForTimeout(900);

    assert.equal(await preview.locator('canvas').count(), 1, 'GlassLens must render exactly one canvas');
    assert.equal(consoleErrors.length, 0, `GlassLens browser console errors: ${consoleErrors.join(' | ')}`);

    const lensRuntime = preview.locator('[data-lens-runtime]');
    const runtime = await lensRuntime.getAttribute('data-lens-runtime');
    assert.ok(runtime === 'idle' || runtime === 'drift', `unexpected active GlassLens runtime: ${runtime}`);

    const shot = async () => hash(await preview.screenshot({ animations: 'allow' }));
    const activeA = await shot();
    await page.waitForTimeout(450);
    const activeB = await shot();

    if (runtime === 'idle') {
      // Fine-pointer desktop: no hidden perpetual animation while the user is idle.
      assert.equal(activeB, activeA, 'fine-pointer GlassLens idle preview must remain pixel-stable');

      const box = await preview.boundingBox();
      assert.ok(box && box.width > 10 && box.height > 10, 'GlassLens preview has no usable browser box');
      await page.mouse.move(box.x + box.width * 0.76, box.y + box.height * 0.34);
      await page.waitForTimeout(280);
      const pointerHash = await shot();
      assert.notEqual(pointerHash, activeA, 'fine-pointer GlassLens interaction must change visible output');

      await page.mouse.move(Math.max(1, box.x - 8), Math.max(1, box.y - 8));
      await page.waitForTimeout(360);
      const resetHash = await shot();
      assert.equal(resetHash, activeA, 'fine-pointer GlassLens leave must return to the stable centered frame');
    } else {
      // Headless Chrome can report no hover/fine pointer. In that environment the
      // component intentionally uses the mobile/no-hover drift fallback instead.
      assert.notEqual(activeB, activeA, 'no-hover GlassLens drift fallback must remain visibly alive');
    }

    await context.close();

    // Reduced motion removes both desktop tracking and no-hover drift. Use this
    // frozen compositor state to prove that production controls repaint the paused
    // shader, then return to a deterministic static frame after the bounded refresh.
    const reducedContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    try {
      const reducedPage = await reducedContext.newPage();
      const reducedErrors = [];
      reducedPage.on('console', (message) => {
        if (message.type() === 'error') reducedErrors.push(message.text());
      });
      reducedPage.on('pageerror', (error) => reducedErrors.push(`PAGEERROR: ${error.message}`));

      await reducedPage.goto(`${BASE}/#/effect/${EFFECT_ID}`, { waitUntil: 'load' });
      const reducedPreview = reducedPage.locator('.fx-preview-detail');
      await reducedPreview.waitFor({ state: 'visible' });
      await reducedPage.waitForTimeout(900);

      assert.equal(reducedErrors.length, 0, `reduced GlassLens browser console errors: ${reducedErrors.join(' | ')}`);
      assert.equal(
        await reducedPreview.locator('[data-lens-runtime="frozen"]').count(),
        1,
        'reduced-motion GlassLens must expose frozen runtime state',
      );

      const reducedShot = async () => hash(await reducedPreview.screenshot({ animations: 'allow' }));
      const reducedA = await reducedShot();
      await reducedPage.waitForTimeout(450);
      const reducedB = await reducedShot();
      assert.equal(reducedB, reducedA, 'reduced-motion GlassLens must remain pixel-stable');

      await setControl(reducedPage, 'lensRadius', 0.4);
      assert.equal(await reducedPage.locator('[data-control-value="lensRadius"]').innerText(), '0.40');
      const radiusHash = await reducedShot();
      assert.notEqual(radiusHash, reducedA, 'lensRadius must visibly alter the frozen lens');
      await reducedPage.waitForTimeout(450);
      assert.equal(await reducedShot(), radiusHash, 'lensRadius repaint must return to a stable frozen frame');

      await setControl(reducedPage, 'zoom', 4);
      assert.equal(await reducedPage.locator('[data-control-value="zoom"]').innerText(), '4.0');
      const zoomHash = await reducedShot();
      assert.notEqual(zoomHash, radiusHash, 'zoom must visibly alter frozen refraction');
      await reducedPage.waitForTimeout(450);
      assert.equal(await reducedShot(), zoomHash, 'zoom repaint must return to a stable frozen frame');

      await setControl(reducedPage, 'chroma', 0.02);
      assert.equal(await reducedPage.locator('[data-control-value="chroma"]').innerText(), '0.020');
      const chromaHash = await reducedShot();
      assert.notEqual(chromaHash, zoomHash, 'chroma must visibly alter frozen rim dispersion');
      await reducedPage.waitForTimeout(450);
      assert.equal(await reducedShot(), chromaHash, 'chroma repaint must return to a stable frozen frame');
    } finally {
      await reducedContext.close();
    }

    console.log(`canvas UI glass lens browser QA: OK (active runtime=${runtime})`);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});