/**
 * Verhaltenstest für premium-signal-particles V2.
 *
 * Prüft im laufenden Arsenal, dass der Strom wirklich lebt und dem Cursor
 * folgt: Canvas animiert, Partikel verdichten sich am Zeiger, Reduced Motion
 * jagt nicht hinterher, Mobile läuft ohne Overflow und ohne Console-Errors.
 * Nimmt zusätzlich ein Video des Mausflusses auf.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.ARSENAL_URL ?? 'http://127.0.0.1:5195';
const OUT = process.env.SIGNAL_ARTIFACTS ?? 'artifacts/signal-particles';
const ROUTE = `${BASE}/#/effect/premium-signal-particles`;

mkdirSync(OUT, { recursive: true });

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

/** Mittlere Helligkeit eines Canvas-Ausschnitts (Partikeldichte als Proxy). */
const REGION_LUMA = `(cx, cy, size) => {
  const canvas = document.querySelector('[data-preview-stage="detail"] canvas');
  if (!canvas) return -1;
  const ctx = canvas.getContext('2d');
  const dpr = canvas.width / canvas.getBoundingClientRect().width;
  const x = Math.max(0, Math.round((cx - size / 2) * dpr));
  const y = Math.max(0, Math.round((cy - size / 2) * dpr));
  const w = Math.min(canvas.width - x, Math.round(size * dpr));
  const h = Math.min(canvas.height - y, Math.round(size * dpr));
  if (w <= 0 || h <= 0) return -1;
  const data = ctx.getImageData(x, y, w, h).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += data[i] + data[i + 1] + data[i + 2];
  return sum / (data.length / 4) / 3;
}`;

async function regionLuma(page, cx, cy, size) {
  return page.evaluate(({ fn, cx, cy, size }) => eval(fn)(cx, cy, size), { fn: REGION_LUMA, cx, cy, size });
}

/**
 * Helligkeitsschwerpunkt des gesamten Feldes, normalisiert auf 0..1. Deutlich
 * stabiler als ein einzelner Ausschnitt: die driftende Wolke verschiebt lokale
 * Dichte stark, den Gesamtschwerpunkt aber kaum.
 */
const CENTROID = `() => {
  const canvas = document.querySelector('[data-preview-stage="detail"] canvas');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let sum = 0, sx = 0, sy = 0;
  const step = 4 * 4; // jedes 4. Pixel reicht und hält es schnell
  const perRow = canvas.width;
  for (let i = 0; i < data.length; i += step) {
    const p = i / 4;
    const luma = data[i] + data[i + 1] + data[i + 2];
    if (luma < 40) continue;
    const x = p % perRow;
    const y = (p - x) / perRow;
    sum += luma; sx += x * luma; sy += y * luma;
  }
  if (sum <= 0) return null;
  return { x: sx / sum / canvas.width, y: sy / sum / canvas.height };
}`;

async function centroid(page, samples = 5, gap = 300) {
  let x = 0;
  let y = 0;
  let n = 0;
  for (let i = 0; i < samples; i++) {
    const c = await page.evaluate((fn) => eval(fn)(), CENTROID);
    if (c) { x += c.x; y += c.y; n++; }
    await page.waitForTimeout(gap);
  }
  if (!n) return null;
  return { x: x / n, y: y / n };
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

try {
  // --- 1. Desktop: Flow lebt und folgt dem Cursor -------------------------
  // Video nur auf Anforderung: recordVideo braucht Playwrights gebündeltes
  // ffmpeg, das auf CI-Runnern mit playwright-core nicht installiert ist.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(process.env.SIGNAL_RECORD_VIDEO === '1'
      ? { recordVideo: { dir: OUT, size: { width: 1440, height: 900 } } }
      : {}),
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));

  await page.goto(ROUTE, { waitUntil: 'networkidle' });
  const canvas = page.locator('[data-preview-stage="detail"] canvas');
  await canvas.waitFor();
  const box = await canvas.boundingBox();
  assert(box && box.width > 200, 'preview canvas has no usable size');

  // Der Strom muss sich von selbst bewegen.
  await page.waitForTimeout(900);
  const frameA = await regionLuma(page, box.width / 2, box.height / 2, 260);
  await page.waitForTimeout(700);
  const frameB = await regionLuma(page, box.width / 2, box.height / 2, 260);
  assert(frameA > 0 && frameB > 0, 'canvas is empty — no particles rendered');
  assert(Math.abs(frameA - frameB) > 0.05, `flow looks frozen (${frameA} vs ${frameB})`);

  // Cursor links oben halten: dort muss sich der Strom verdichten.
  const left = { x: box.x + box.width * 0.24, y: box.y + box.height * 0.32 };
  const right = { x: box.x + box.width * 0.78, y: box.y + box.height * 0.7 };
  for (let i = 0; i <= 24; i++) {
    await page.mouse.move(
      box.x + box.width * (0.78 - 0.54 * (i / 24)),
      box.y + box.height * (0.7 - 0.38 * (i / 24)),
    );
    await page.waitForTimeout(28);
  }
  await page.mouse.move(left.x, left.y);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: join(OUT, 'flow-cursor-left.png') });

  const nearLeft = await regionLuma(page, left.x - box.x, left.y - box.y, 240);
  const farRight = await regionLuma(page, right.x - box.x, right.y - box.y, 240);
  assert(
    nearLeft > farRight * 1.25,
    `stream does not converge on the cursor (near ${nearLeft.toFixed(2)} vs far ${farRight.toFixed(2)})`,
  );

  // Gegenprobe: Cursor auf die andere Seite ziehen, Verdichtung muss folgen.
  for (let i = 0; i <= 24; i++) {
    await page.mouse.move(
      box.x + box.width * (0.24 + 0.54 * (i / 24)),
      box.y + box.height * (0.32 + 0.38 * (i / 24)),
    );
    await page.waitForTimeout(28);
  }
  await page.mouse.down();
  await page.waitForTimeout(160);
  await page.mouse.up();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: join(OUT, 'flow-cursor-right.png') });

  const nearRight = await regionLuma(page, right.x - box.x, right.y - box.y, 240);
  const farLeft = await regionLuma(page, left.x - box.x, left.y - box.y, 240);
  assert(
    nearRight > farLeft * 1.25,
    `stream did not follow the cursor (near ${nearRight.toFixed(2)} vs far ${farLeft.toFixed(2)})`,
  );

  // Share-Link mit den neuen Controls muss exakt zurückkommen.
  const share = await page.evaluate(() => {
    const encode = (v) => btoa(v).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const config = JSON.parse(document.querySelector('[data-testid="config-json"]').textContent);
    const props = { ...config.props, cursorAttraction: 1.6, turbulence: 0.9, convergenceRadius: 320, variant: 'signal-vortex' };
    return { hash: `#/effect/premium-signal-particles?config=${encode(JSON.stringify(props))}`, props };
  });
  await page.goto(`${BASE}/${share.hash}`, { waitUntil: 'networkidle' });
  await page.locator('[data-testid="config-json"]').waitFor();
  const restored = JSON.parse(await page.locator('[data-testid="config-json"]').textContent());
  for (const key of ['cursorAttraction', 'turbulence', 'convergenceRadius', 'variant']) {
    assert(
      String(restored.props[key]) === String(share.props[key]),
      `share link lost "${key}" (${restored.props[key]} != ${share.props[key]})`,
    );
  }
  assert(
    await page.locator('[data-preview-stage="detail"] .nsp-root[data-variant="signal-vortex"]').count() === 1,
    'share link did not restore the preview variant',
  );

  await context.close();

  // --- 2. Reduced Motion: ruhige Drift, keine Cursorjagd ------------------
  const calm = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const calmPage = await calm.newPage();
  calmPage.on('pageerror', (e) => errors.push(`PAGEERROR(reduced): ${e.message}`));
  calmPage.on('console', (m) => { if (m.type() === 'error') errors.push(`reduced: ${m.text()}`); });
  await calmPage.goto(ROUTE, { waitUntil: 'networkidle' });
  const calmRoot = calmPage.locator('[data-preview-stage="detail"] .nsp-root');
  await calmRoot.waitFor();
  assert(await calmRoot.getAttribute('data-reduced') === 'true', 'reduced motion flag not applied');
  const calmBox = await calmPage.locator('[data-preview-stage="detail"] canvas').boundingBox();
  await calmPage.waitForTimeout(1400);

  // Der Cursor sitzt in einer Ecke: ohne Anziehung darf der Schwerpunkt der
  // Wolke nicht zu ihm wandern.
  const target = { x: 0.2, y: 0.24 };
  const distance = (c) => Math.hypot(c.x - target.x, c.y - target.y);

  const calmBefore = await centroid(calmPage);
  assert(calmBefore, 'reduced motion renders nothing');
  await calmPage.mouse.move(calmBox.x + calmBox.width * target.x, calmBox.y + calmBox.height * target.y);
  await calmPage.waitForTimeout(2600);
  const calmAfter = await centroid(calmPage);
  assert(calmAfter, 'reduced motion stopped rendering');
  const calmDistBefore = distance(calmBefore);
  const calmDistAfter = distance(calmAfter);
  assert(
    calmDistAfter > calmDistBefore * 0.7 && calmDistAfter > 0.12,
    `reduced motion still chases the cursor (centroid distance ${calmDistBefore.toFixed(3)} -> ${calmDistAfter.toFixed(3)})`,
  );
  await calmPage.screenshot({ path: join(OUT, 'flow-reduced-motion.png') });
  await calm.close();

  // --- 3. Mobile: Touch-Attraktor, kein Overflow --------------------------
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const mobilePage = await mobile.newPage();
  mobilePage.on('pageerror', (e) => errors.push(`PAGEERROR(mobile): ${e.message}`));
  mobilePage.on('console', (m) => { if (m.type() === 'error') errors.push(`mobile: ${m.text()}`); });
  await mobilePage.goto(ROUTE, { waitUntil: 'networkidle' });
  await mobilePage.locator('[data-preview-stage="detail"] canvas').waitFor();
  await mobilePage.waitForTimeout(1600);
  const overflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `mobile layout overflows horizontally by ${overflow}px`);
  const mobileBox = await mobilePage.locator('[data-preview-stage="detail"] canvas').boundingBox();
  const mobileLuma = await regionLuma(mobilePage, mobileBox.width / 2, mobileBox.height / 2, 160);
  assert(mobileLuma > 0, 'mobile canvas renders nothing');
  await mobilePage.screenshot({ path: join(OUT, 'flow-mobile.png') });
  await mobile.close();

  assert(!errors.length, `console/page errors: ${errors.join(' | ')}`);
  console.log(JSON.stringify({
    ok: true,
    motionDelta: Number(Math.abs(frameA - frameB).toFixed(3)),
    cursorLeft: { near: Number(nearLeft.toFixed(2)), far: Number(farRight.toFixed(2)) },
    cursorRight: { near: Number(nearRight.toFixed(2)), far: Number(farLeft.toFixed(2)) },
    reducedMotion: { centroidDistBefore: Number(calmDistBefore.toFixed(3)), centroidDistAfter: Number(calmDistAfter.toFixed(3)) },
    mobileLuma: Number(mobileLuma.toFixed(2)),
    artifacts: OUT,
  }, null, 2));
} finally {
  await browser.close();
}
