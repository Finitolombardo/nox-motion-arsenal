// QA-Screenshots für Batch 1 (Gauge + Gold). Konfigurierbar über ENV:
//   CHROME_PATH  – Pfad zur Chrome/Chromium-Executable (Default: Windows-Standard)
//   QA_BASE_URL  – Dev-Server-URL (Default: http://localhost:5173)
//   QA_PORT      – alternativ nur den Port setzen (überschreibt QA_BASE_URL-Host)
// Aufruf: node scripts/qa-refine-batch1-shots.mjs [--base URL] [--chrome PATH]
import { chromium } from 'playwright-core';

const CHROME = process.env.CHROME_PATH || process.argv[3] || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const baseFromEnv = process.env.QA_BASE_URL || 'http://localhost:5173';
const port = process.env.QA_PORT;
const BASE = port ? `http://localhost:${port}` : baseFromEnv;
const SHOT_DIR = 'reports';

const shots = [
  ['system-gauge-needle-sweep', 'qa-gauge-full.png', 0],
  ['system-gauge-needle-sweep', 'qa-gauge-t1.png', 1200],
  ['hero-gold-outline-fill-text', 'qa-gold-full.png', 0],
  ['hero-gold-outline-fill-text', 'qa-gold-after.png', 1600],
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

for (const [id, out, waitMs] of shots) {
  await page.goto(`${BASE}/#/effect/${id}`, { waitUntil: 'load' });
  if (waitMs > 0) await page.waitForTimeout(waitMs);
  // Scroll to the preview shell if present
  const preview = page.locator('.fx-preview-detail');
  if (await preview.count()) await preview.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOT_DIR}/${out}` });
  console.log('shot:', out, '| errors so far:', errors.length);
}

if (errors.length) {
  console.log('CONSOLE ERRORS:');
  errors.forEach((e) => console.log(' -', e.slice(0, 200)));
} else {
  console.log('CONSOLE ERRORS: none');
}
await browser.close();
