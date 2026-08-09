// Runtime-QA Batch: pointer-text-depth + angled-gold-strike
//   CHROME_PATH / QA_BASE_URL als ENV (keine harten Pfade).
//   Prüft VERHALTEN: below-fold → scroll → genau einmal Start; raus/rein kein
//   Restart; min===max/Extremwerte; controls/value-Update; hover/leave;
//   reduced motion in eigenem Kontext; 0 Console-/Page-Errors.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.QA_BASE_URL ?? 'http://localhost:5196';
const URL = `${BASE}/scripts/runtime-qa-effects.html`;

const errors = { pageErrors: [] };
let failed = 0;
const report = (ok, name, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
};

const attachErrorSinks = (page, tag) => {
  page.on('pageerror', (e) => errors.pageErrors.push(`[${tag}] ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.pageErrors.push(`[${tag}] console: ${m.text()}`);
  });
};

const parseScaleX = (transformStr) => {
  const m3 = transformStr.match(/matrix3d\(([^)]+)\)/);
  if (m3) return Math.abs(parseFloat(m3[1].split(',')[0]));
  const m2 = transformStr.match(/matrix\(([^)]+)\)/);
  if (m2) return Math.abs(parseFloat(m2[1].split(',')[0]));
  return 1;
};

const readVar = (page, cls, name) =>
  page.evaluate(([c, n]) => document.querySelector(c)?.style.getPropertyValue(n) ?? null, [cls, name]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

// ---------------------------------------------------------------------------
// Kontext 1: Normal
// ---------------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  attachErrorSinks(page, 'normal');
  await page.goto(URL);
  await page.waitForFunction(() => window.__qaReady === true, null, { timeout: 20000 });

  // --- PTD: below-fold ------------------------------------------------
  report((await readVar(page, '.ptd-root', '--ptd-rx')) === '', 'PTD below-fold: kein rAF-Schreiben (--ptd-rx leer)');
  report(
    (await page.locator('.ptd-stage.ptd-entered').count()) === 0,
    'PTD below-fold: keine Entrance-Klasse',
  );

  // Scroll in → Entrance läuft genau einmal
  await page.locator('#ptd-block').scrollIntoViewIfNeeded();
  await page.waitForSelector('.ptd-stage.ptd-entered', { timeout: 8000 });
  report((await page.locator('.ptd-char.ptd-in').count()) > 0, 'PTD in-view: Entrance (ptd-in) gestartet');
  await sleep(1600); // Entrance (0.8s + Stagger) abwarten
  report(
    (await page.evaluate(() => document.getAnimations().filter((a) => a.animationName === 'ptd-stage-in' && a.playState === 'running').length)) === 0,
    'PTD nach Entrance: keine laufende Entrance-Animation',
  );

  // Pointer-Tracking: rAF schreibt Vars
  const box = await page.locator('.ptd-root').boundingBox();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.7);
  await sleep(700);
  const ry = await readVar(page, '.ptd-root', '--ptd-ry');
  report(ry !== '' && Math.abs(parseFloat(ry)) > 0.01, `PTD Pointer-Follow: --ptd-ry reagiert (${ry})`);

  // Raus / rein → kein Restart (startedRef-Latch)
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(600);
  const frozen1 = await readVar(page, '.ptd-root', '--ptd-ry');
  await sleep(500);
  const frozen2 = await readVar(page, '.ptd-root', '--ptd-ry');
  report(frozen1 === frozen2, 'PTD rausgescrollt: rAF pausiert (Var eingefroren)');
  await page.locator('#ptd-block').scrollIntoViewIfNeeded();
  await sleep(700);
  report(
    (await page.evaluate(() => document.getAnimations().filter((a) => a.animationName === 'ptd-stage-in' && a.playState === 'running').length)) === 0,
    'PTD rein: kein Entrance-Restart (genau einmal Start)',
  );

  // Value-Update: text/depth/speed (min===max-ähnlich: depth 0, speed max)
  await page.evaluate(() => window.__setPTD({ text: 'GOLD', depth: 0, speed: 3 }));
  await sleep(400);
  report((await page.locator('.ptd-char').count()) === 4, 'PTD Value-Update: Text auf 4 Zeichen');
  const noNaN = await page.evaluate(() => {
    const el = document.querySelector('.ptd-char');
    const t = getComputedStyle(el).transform;
    return !/NaN|Infinity/.test(t) && t !== '';
  });
  report(noNaN, 'PTD depth=0/speed=3: kein NaN/Infinity in Computed-Transform');

  // --- AGS: below-fold ------------------------------------------------
  report((await page.locator('.ags-line').count()) > 0, 'AGS below-fold: Strike-Linie gerendert (hover-trigger)');

  // Hover → Strike zeichnet (scaleX 0 → 1)
  const lineSel = '.ags-line';
  const before = await page.evaluate((s) => getComputedStyle(document.querySelector(s)).transform, lineSel);
  report(parseScaleX(before) < 0.05, `AGS before hover: scaleX≈0 (${parseScaleX(before).toFixed(3)})`);
  await page.hover('.ags-line-wrap');
  await sleep(1300); // transition 0.9s
  const after = await page.evaluate((s) => getComputedStyle(document.querySelector(s)).transform, lineSel);
  report(parseScaleX(after) > 0.9, `AGS hover: scaleX≈1 (${parseScaleX(after).toFixed(3)})`);

  // Leave → zurück
  await page.mouse.move(5, 5);
  await sleep(1300);
  const left = await page.evaluate((s) => getComputedStyle(document.querySelector(s)).transform, lineSel);
  report(parseScaleX(left) < 0.05, `AGS leave: scaleX zurück auf 0 (${parseScaleX(left).toFixed(3)})`);

  // struck-Prop → dauerhaft gestrichen
  await page.evaluate(() => window.__setAGS({ struck: true }));
  await sleep(1200);
  const struckClass = await page.evaluate(() => document.querySelector('.ags-root').classList.contains('ags-struck'));
  const struckX = await page.evaluate((s) => {
    const t = getComputedStyle(document.querySelector(s)).transform;
    const m3 = t.match(/matrix3d\(([^)]+)\)/);
    if (m3) return Math.abs(parseFloat(m3[1].split(',')[0]));
    const m2 = t.match(/matrix\(([^)]+)\)/);
    return m2 ? Math.abs(parseFloat(m2[1].split(',')[0])) : 1;
  }, lineSel);
  report(struckClass && struckX > 0.9, `AGS struck-Prop: Klasse + scaleX≈1 (${struckX.toFixed(3)})`);

  // Auto-Trigger
  await page.evaluate(() => window.__setAGS({ trigger: 'auto', struck: false }));
  await sleep(400);
  const anim = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.ags-line'));
    return { name: cs.animationName, dur: cs.animationDuration };
  });
  report(anim.name === 'ags-sweep' && parseFloat(anim.dur) > 2, `AGS auto: Sweep-Animation läuft (${anim.name} ${anim.dur})`);

  // Extremwerte (min===max-Bereich): angle/thickness/speed extrem
  await page.evaluate(() => window.__setAGS({ angle: 20, thickness: 8, speed: 0.1, trigger: 'hover', struck: false }));
  await sleep(400);
  const extOk = await page.evaluate(() => {
    const el = document.querySelector('.ags-line');
    const t = getComputedStyle(el).transform;
    return !/NaN|Infinity/.test(t) && el !== null;
  });
  report(extOk, 'AGS Extremwerte: kein NaN, Linie intakt');

  // Mobile: kein horizontaler Overflow
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true });
  const mpage = await mobile.newPage();
  attachErrorSinks(mpage, 'mobile');
  await mpage.goto(URL);
  await mpage.waitForFunction(() => window.__qaReady === true, null, { timeout: 20000 });
  await mpage.locator('#ags-block').scrollIntoViewIfNeeded();
  await sleep(500);
  const overflow = await mpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  report(overflow <= 1, `AGS/PTD mobile 375px: kein horizontaler Overflow (${overflow}px)`);
  await mobile.close();
  await ctx.close();
}

// ---------------------------------------------------------------------------
// Kontext 2: prefers-reduced-motion (eigener Browser-Kontext!)
// ---------------------------------------------------------------------------
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  attachErrorSinks(page, 'reduced');
  await page.goto(URL);
  await page.waitForFunction(() => window.__qaReady === true, null, { timeout: 20000 });

  await page.locator('#ptd-block').scrollIntoViewIfNeeded();
  await page.locator('#ags-block').scrollIntoViewIfNeeded();
  const box = await page.locator('.ptd-root').boundingBox();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.7);
  await sleep(800);

  report(
    (await readVar(page, '.ptd-root', '--ptd-rx')) === '',
    'PTD reduced: kein rAF (--ptd-rx bleibt leer)',
  );
  report(
    (await page.locator('.ptd-stage.ptd-entered').count()) === 0,
    'PTD reduced: keine Entrance-Animation',
  );
  report(
    (await page.evaluate(() => getComputedStyle(document.querySelector('.ptd-char')).transform)) === 'none',
    'PTD reduced: Chars flach (kein 3D-Transform)',
  );
  report(
    (await page.locator('.ags-line').count()) === 0,
    'AGS reduced: Linie nicht gerendert (struck=false)',
  );
  await page.evaluate(() => window.__setAGS({ struck: true }));
  await sleep(400);
  const redStruck = await page.evaluate(() => {
    const el = document.querySelector('.ags-line');
    if (!el) return null;
    const cs = getComputedStyle(el);
    const t = cs.transform;
    const m3 = t.match(/matrix3d\(([^)]+)\)/);
    const x = m3 ? Math.abs(parseFloat(m3[1].split(',')[0])) : 1;
    return { x, anim: cs.animationName, trans: cs.transitionDuration };
  });
  report(
    redStruck && redStruck.x > 0.9 && redStruck.anim === 'none' && redStruck.trans === '0s',
    `AGS reduced + struck: statische Linie, keine Animation (${JSON.stringify(redStruck)})`,
  );

  await ctx.close();
}

await browser.close();

report(errors.pageErrors.length === 0, '0 Console-/Page-Errors', errors.pageErrors.slice(0, 5).join(' | '));

if (failed > 0) {
  console.error(`\nRUNTIME QA FAILED: ${failed} Check(s) rot`);
  process.exit(1);
}
console.log('\nRUNTIME QA: alle Checks grün');
