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

    const shot = async () => hash(await preview.screenshot({ animations: 'allow' }));

    // Idle must be a genuinely static frame — no hidden perpetual time animation.
    const idleA = await shot();
    await page.waitForTimeout(450);
    const idleB = await shot();
    assert.equal(idleB, idleA, 'GlassLens idle preview must remain pixel-stable');

    // Desktop pointer tracking must visibly move the lens, then settle back to center.
    const box = await preview.boundingBox();
    assert.ok(box && box.width > 10 && box.height > 10, 'GlassLens preview has no usable browser box');
    await page.mouse.move(box.x + box.width * 0.76, box.y + box.height * 0.34);
    await page.waitForTimeout(280);
    const pointerHash = await shot();
    assert.notEqual(pointerHash, idleA, 'GlassLens pointer interaction must change visible output');

    await page.mouse.move(Math.max(1, box.x - 8), Math.max(1, box.y - 8));
    await page.waitForTimeout(300);
    const resetHash = await shot();
    assert.equal(resetHash, idleA, 'GlassLens pointer leave must return to the stable centered frame');

    // Production controls must repaint the paused shader without creating a permanent rAF loop.
    await setControl(page, 'lensRadius', 0.4);
    assert.equal(await page.locator('[data-control-value="lensRadius"]').innerText(), '0.40');
    const radiusHash = await shot();
    assert.notEqual(radiusHash, idleA, 'lensRadius must visibly alter the lens');
    await page.waitForTimeout(450);
    assert.equal(await shot(), radiusHash, 'lensRadius repaint must return to idle after the bounded refresh');

    await setControl(page, 'zoom', 4);
    assert.equal(await page.locator('[data-control-value="zoom"]').innerText(), '4.0');
    const zoomHash = await shot();
    assert.notEqual(zoomHash, radiusHash, 'zoom must visibly alter refraction');

    await setControl(page, 'chroma', 0.02);
    assert.equal(await page.locator('[data-control-value="chroma"]').innerText(), '0.020');
    const chromaHash = await shot();
    assert.notEqual(chromaHash, zoomHash, 'chroma must visibly alter rim dispersion');

    // Reduced motion must mount as a frozen frame while keeping config output deterministic.
    const reducedContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    try {
      const reducedPage = await reducedContext.newPage();
      await reducedPage.goto(`${BASE}/#/effect/${EFFECT_ID}`, { waitUntil: 'load' });
      await reducedPage.waitForTimeout(900);
      const reducedPreview = reducedPage.locator('.fx-preview-detail');
      assert.equal(
        await reducedPreview.locator('[data-lens-runtime="frozen"]').count(),
        1,
        'reduced-motion GlassLens must expose frozen runtime state',
      );
      const reducedA = hash(await reducedPreview.screenshot({ animations: 'allow' }));
      await reducedPage.waitForTimeout(450);
      const reducedB = hash(await reducedPreview.screenshot({ animations: 'allow' }));
      assert.equal(reducedB, reducedA, 'reduced-motion GlassLens must remain pixel-stable');
    } finally {
      await reducedContext.close();
    }

    console.log('canvas UI glass lens browser QA: OK');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
