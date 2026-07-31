import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const shared = Buffer.from(JSON.stringify({ v: 2, id: 'scroll-pinned-product-stage', p: {
  variant: 'nox-floating-card-os', showVariantSwitcher: false, chrome: 'minimal', pageScrollMode: true,
  cardStyle: 'glass', stageCardVariant: 'auto', cardScale: 1.12, cardTilt: 5, cardFloat: 8,
  cardFloatSpeed: .16, scrollRotationTurns: .18, morphStrength: .8, stageSpread: .9,
  glow: .6, bloom: .35, depth: 1, perspective: 1100, showHud: false,
} })).toString('base64url');
const base = process.env.ARSENAL_PRODUCT_STAGE_BASE ?? 'http://127.0.0.1:5195';
const url = process.env.ARSENAL_PRODUCT_STAGE_URL ?? `${base}/#/effect/scroll-pinned-product-stage?config=${shared}`;
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.locator('.pps-root').waitFor();
const state = await page.evaluate(() => {
  const root = document.querySelector('.pps-root');
  const product = document.querySelector('.pps-product');
  const scroll = document.querySelector('.pps-scroll');
  const rect = root?.getBoundingClientRect();
  return {
    height: rect?.height ?? 0,
    productVisible: Boolean(product && product.getBoundingClientRect().width > 0 && product.getBoundingClientRect().height > 0),
    cards: document.querySelectorAll('.nfco-card').length,
    text: document.body.innerText,
    before: product?.getAttribute('style') ?? '',
    scrollHeight: scroll?.scrollHeight ?? 0,
  };
});
assert.ok(state.height > 0, 'product stage has no visible height');
assert.ok(state.productVisible, 'product object is not visible');
assert.equal(state.cards, 4, 'floating card stack is incomplete');
assert.match(state.text, /NOX|SIGNALE/i, 'NOX stage text is missing');
assert.ok(state.scrollHeight > 0, 'preview simulation did not create an internal scroll track');
await page.evaluate(() => { const el = document.querySelector('.pps-scroll'); el.scrollTop = el.scrollHeight; });
await page.waitForTimeout(700);
const after = await page.locator('.pps-product').getAttribute('style');
assert.notEqual(after, state.before, 'rotation did not react to simulated scroll');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(100);
assert.ok(await page.locator('.nfco-card').first().isVisible(), 'floating card stack is not visible on mobile');
assert.deepEqual(errors, [], `runtime errors: ${errors.join('; ')}`);
await browser.close();
console.log('product-stage share regression: OK (visible stage, NOX copy, object, simulated rotation, no runtime error)');
