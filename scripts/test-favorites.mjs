import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.ARSENAL_URL ?? 'http://127.0.0.1:5195';
const OUT = process.env.FAVORITES_ARTIFACTS ?? 'artifacts/favorites';
const STORAGE_KEY = 'nox-motion-arsenal:favorites:v1';
const ARCHIVE_STORAGE_KEY = 'nox-motion-arsenal:archived:v1';

mkdirSync(OUT, { recursive: true });

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await desktop.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));

  await page.goto(BASE, { waitUntil: 'load' });
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.evaluate((key) => localStorage.removeItem(key), ARCHIVE_STORAGE_KEY);
  await page.reload({ waitUntil: 'load' });
  await page.locator('[data-effect-id]').first().waitFor({ state: 'visible' });

  const cardCount = await page.locator('[data-effect-id]').count();
  const updateCount = await page.locator('.fx-updated').count();
  const updateLabels = await page.locator('.fx-updated').allTextContents();
  assert(cardCount === 185, `expected 185 effect cards, found ${cardCount}`);
  assert(updateCount === cardCount, `only ${updateCount}/${cardCount} cards expose update metadata`);
  assert(!updateLabels.some((label) => label.includes('UNBEKANNT')), 'at least one update date is unknown');

  await page.getByText('Neue Effekte · Konzeptdeck', { exact: true }).click();
  assert((await page.locator('[data-effect-id]').count()) === 29, 'concept category does not contain all 29 concepts');
  await page.getByText('Alle Effekte', { exact: true }).click();

  const favoriteId = await page.locator('[data-effect-id]').first().getAttribute('data-effect-id');
  assert(favoriteId, 'first effect id missing');
  const favoriteButton = page.locator(`[data-favorite-effect="${favoriteId}"]`);
  await favoriteButton.click();
  assert(!page.url().includes('/effect/'), 'favorite click opened the effect route');
  assert((await favoriteButton.getAttribute('aria-pressed')) === 'true', 'favorite button was not pressed');
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), STORAGE_KEY);
  assert(stored.length === 1 && stored[0] === favoriteId, 'favorite was not persisted');

  await page.reload({ waitUntil: 'load' });
  const persistedButton = page.locator(`[data-favorite-effect="${favoriteId}"]`);
  assert((await persistedButton.getAttribute('aria-pressed')) === 'true', 'favorite did not survive reload');

  const archiveButton = page.locator(`[data-archive-effect="${favoriteId}"]`);
  await archiveButton.click();
  const archived = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), ARCHIVE_STORAGE_KEY);
  assert(archived.length === 1 && archived[0] === favoriteId, 'archive was not persisted');
  assert((await page.locator('[data-effect-id]').count()) === cardCount - 1, 'archived effect remained in the active catalog');
  await page.getByTestId('archive-sidebar-filter').click();
  assert((await page.locator('[data-effect-id]').count()) === 1, 'archive view did not show the archived effect');
  await page.locator(`[data-archive-effect="${favoriteId}"]`).click();
  await page.getByText('ARCHIV IST LEER · KARTE ÜBER ARCHIV ABLEGEN').waitFor({ state: 'visible' });
  await page.getByText('Alle Effekte', { exact: true }).click();
  assert((await page.locator('[data-effect-id]').count()) === cardCount, 'restored effect did not return to the active catalog');

  await page.getByTestId('favorites-chip').click();
  assert((await page.locator('[data-effect-id]').count()) === 1, 'favorites chip did not filter to one card');
  await page.getByTestId('favorites-chip').click();
  await page.getByTestId('favorites-sidebar-filter').click();
  assert((await page.locator('[data-effect-id]').count()) === 1, 'favorites sidebar collection did not filter');

  await page.getByTestId('favorites-chip').click();
  await page.getByTestId('maintenance-sort').selectOption('oldest');
  const sortedDates = await page.locator('.fx-updated').evaluateAll((items) =>
    items.slice(0, 2).map((item) => Date.parse(item.getAttribute('datetime') ?? '')),
  );
  assert(sortedDates.length === 2 && sortedDates[0] <= sortedDates[1], 'oldest-first sorting is incorrect');

  await page.getByTestId('favorites-chip').click();
  await page.locator(`[data-favorite-effect="${favoriteId}"]`).click();
  assert((await page.locator('[data-effect-id]').count()) === 0, 'removing the last filtered favorite left a card');
  await page.getByText('NOCH KEINE FAVORITEN · HERZ AUF EINER KARTE MARKIEREN').waitFor({ state: 'visible' });
  await page.getByTestId('favorites-chip').click();
  await page.screenshot({ path: join(OUT, 'desktop.png'), fullPage: false });

  assert(errors.length === 0, `desktop errors: ${errors.join(' | ')}`);
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobile.newPage();
  const mobileErrors = [];
  mobilePage.on('console', (message) => {
    if (message.type() === 'error') mobileErrors.push(message.text());
  });
  mobilePage.on('pageerror', (error) => mobileErrors.push(`PAGEERROR: ${error.message}`));
  await mobilePage.goto(BASE, { waitUntil: 'load' });
  await mobilePage.locator('[data-effect-id]').first().waitFor({ state: 'visible' });
  const mobileLayout = await mobilePage.evaluate(() => {
    const favorite = document.querySelector('.favorite-btn')?.getBoundingClientRect();
    return {
      bodyScrollWidth: document.body.scrollWidth,
      buttonHeight: favorite?.height ?? 0,
      buttonWidth: favorite?.width ?? 0,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
  assert(
    mobileLayout.bodyScrollWidth <= mobileLayout.viewportWidth,
    `mobile horizontal overflow: ${JSON.stringify(mobileLayout)}`,
  );
  assert(
    mobileLayout.buttonWidth >= 42 && mobileLayout.buttonHeight >= 42,
    `favorite touch target is too small: ${JSON.stringify(mobileLayout)}`,
  );
  assert(mobileErrors.length === 0, `mobile errors: ${mobileErrors.join(' | ')}`);
  await mobilePage.screenshot({ path: join(OUT, 'mobile.png'), fullPage: false });
  await mobile.close();

  console.log(JSON.stringify({
    base: BASE,
    cardCount,
    favoriteId,
    mobileLayout,
    ok: true,
    updateCount,
  }, null, 2));
} finally {
  await browser.close();
}
