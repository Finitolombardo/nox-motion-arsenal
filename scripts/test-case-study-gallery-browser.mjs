import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const shared = Buffer.from(JSON.stringify({
  v: 2,
  id: 'premium-case-study-gallery',
  p: {
    variant: 'hospitality',
    layout: 'carousel',
    showCaptions: true,
    enableLightbox: false,
    autoplay: false,
  },
})).toString('base64url');

const base = process.env.ARSENAL_CASE_STUDY_GALLERY_BASE ?? 'http://127.0.0.1:5195';
const url = process.env.ARSENAL_CASE_STUDY_GALLERY_URL ?? `${base}/#/effect/premium-case-study-gallery?config=${shared}`;
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

await page.goto(url, { waitUntil: 'networkidle' });
const stage = page.locator('.ncsg-carousel .ncsg-stage');
await stage.waitFor({ state: 'visible' });

const initial = await page.evaluate(() => {
  const stage = document.querySelector('.ncsg-carousel .ncsg-stage');
  const cards = [...document.querySelectorAll('.ncsg-carousel .ncsg-card')];
  return {
    cards: cards.length,
    clientWidth: stage?.clientWidth ?? 0,
    scrollWidth: stage?.scrollWidth ?? 0,
    scrollLeft: stage?.scrollLeft ?? 0,
    active: document.querySelectorAll('.ncsg-carousel .ncsg-card.is-active').length,
  };
});
assert.ok(initial.cards >= 4, 'carousel did not render the expected card set');
assert.ok(initial.clientWidth > 0, 'carousel stage has no visible width');
assert.ok(initial.scrollWidth > initial.clientWidth, 'carousel track is not horizontally scrollable');
assert.equal(initial.active, 1, 'carousel must expose exactly one active card');

await page.locator('.ncsg-controls > button').last().click();
await page.waitForTimeout(700);
const afterArrow = await page.evaluate(() => {
  const stage = document.querySelector('.ncsg-carousel .ncsg-stage');
  return {
    left: stage?.scrollLeft ?? 0,
    active: document.querySelectorAll('.ncsg-carousel .ncsg-card.is-active').length,
  };
});
assert.ok(afterArrow.left > initial.scrollLeft + 20, 'next control did not move the horizontal track');
assert.equal(afterArrow.active, 1, 'arrow navigation produced an invalid active-card state');

const box = await stage.boundingBox();
assert.ok(box, 'carousel stage has no bounding box');
await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.55);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.22, box.y + box.height * 0.55, { steps: 14 });
await page.mouse.up();
await page.waitForTimeout(950);
const afterDrag = await stage.evaluate((el) => el.scrollLeft);
assert.notEqual(Math.round(afterDrag), Math.round(afterArrow.left), 'mouse drag/inertia did not move the track');

await page.setViewportSize({ width: 390, height: 844 });
await stage.evaluate((el) => { el.scrollLeft = 0; });
await page.waitForTimeout(180);
const mobile = await page.evaluate(() => {
  const stage = document.querySelector('.ncsg-carousel .ncsg-stage');
  const cards = [...document.querySelectorAll('.ncsg-carousel .ncsg-card')];
  const stageRect = stage?.getBoundingClientRect();
  const first = cards[0]?.getBoundingClientRect();
  const second = cards[1]?.getBoundingClientRect();
  return {
    stageWidth: stageRect?.width ?? 0,
    firstWidth: first?.width ?? 0,
    secondLeft: second?.left ?? Number.POSITIVE_INFINITY,
    stageRight: stageRect?.right ?? 0,
  };
});
assert.ok(mobile.firstWidth > 0 && mobile.firstWidth < mobile.stageWidth * 0.92, 'mobile card should leave a visible next-card preview');
assert.ok(mobile.secondLeft < mobile.stageRight, 'next card is not partially visible on mobile');

await page.emulateMedia({ reducedMotion: 'reduce' });
await page.waitForTimeout(60);
const reducedTransform = await page.locator('.ncsg-carousel .ncsg-card').first().evaluate((el) => getComputedStyle(el).transform);
assert.equal(reducedTransform, 'none', 'reduced-motion mode still applies carousel depth transforms');

assert.deepEqual(errors, [], `runtime errors: ${errors.join('; ')}`);
await browser.close();
console.log('case-study-gallery browser: OK (real scroll track, arrows, mouse drag/inertia, mobile peek, reduced motion)');