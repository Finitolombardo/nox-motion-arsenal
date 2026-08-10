// Runtime-QA Batch 1 (PR #40) — echte Verhaltensprüfungen im Browser.
// Nutzt scripts/runtime-harness.html: beide Effekte sind dort ECHT gemountet
// (kein Unmount durch EffectPreview), liegen below-fold und werden per
// window.__setGauge / window.__setGold mit Props versorgt.
//
// Gauge: below-fold → scroll → einmaliger Start; raus/rein → kein Restart;
//         min===max (kein NaN); value-Update (Label + Nadel folgen); reduced motion.
// Gold:  scroll-Latch; hover; click + Keyboard (Enter/Space); shimmer; reduced;
//         responsive (mobile, kein horizontaler Overflow).
//
// Konfigurierbar: CHROME_PATH, QA_BASE_URL (Default localhost:5196).
// Exit-Code 0 nur, wenn alle Checks grün — kein PASS auf Token-Ebene.

import { chromium } from 'playwright-core';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.QA_BASE_URL || 'http://localhost:5196';
const HARNESS = `${BASE}/scripts/runtime-harness.html`;

let passed = 0;
let failed = 0;
const failures = [];
const results = [];
const check = (name, cond, detail = '') => {
  if (cond) {
    passed++;
    results.push(`PASS  ${name}`);
  } else {
    failed++;
    failures.push(name);
    results.push(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
};
const info = (msg) => results.push(`INFO  ${msg}`);

async function openHarness(page) {
  await page.goto(HARNESS, { waitUntil: 'load' });
  // Harness lädt Komponenten + React asynchron; auf Mount warten.
  await page.waitForFunction(() => window.__qaReady === true, { timeout: 30000 });
  await page.waitForSelector('.gnds-root', { timeout: 30000 });
  await page.waitForSelector('.goft-root', { timeout: 30000 });
  await page.waitForTimeout(900); // IO-Init + erste Render-Welle
}

// Laufende Animationen eines Elements zählen (CSS + WAAPI).
const runningCount = (page, sel) =>
  page.evaluate((s) =>
    Array.from(document.querySelectorAll(s)).reduce(
      (n, el) => n + el.getAnimations().filter((a) => a.playState === 'running').length,
      0,
    ),
    sel,
  );

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('favicon')) consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(String(e)));

// =====================================================================
// 1) GAUGE — below-fold → scroll → einmaliger Start → raus/rein kein Restart
// =====================================================================
await openHarness(page);

// below-fold: Seite steht auf scrollY 0, Gauge liegt bei translateY(260vh)
const before = await page.evaluate(() => {
  const needle = document.querySelector('.gnds-needle-wrap');
  const scale = document.querySelector('.gnds-scale');
  return {
    running: needle.getAnimations().filter((a) => a.playState === 'running').length
      + scale.getAnimations().filter((a) => a.playState === 'running').length,
    needleAnim: getComputedStyle(needle).animationName,
    needleRot: getComputedStyle(needle).transform,
    scaleOffset: getComputedStyle(scale).strokeDashoffset,
    ticks0: getComputedStyle(document.querySelector('.gnds-tick')).opacity,
    inView: needle.getBoundingClientRect().top > window.innerHeight,
  };
});
check('Gauge: below-fold (Effekt außerhalb Viewport)', before.inView, `top=${before.inView}`);
check('Gauge: below-fold — 0 laufende Animationen', before.running === 0, `running=${before.running}`);
check('Gauge: below-fold — Nadel-Animation = none', before.needleAnim === 'none', before.needleAnim);
check('Gauge: below-fold — Nadel auf Startposition (rotate(-105deg))', /matrix\(/.test(before.needleRot) && !before.needleRot.includes('0, 0, 0'), before.needleRot);
check('Gauge: below-fold — Skala noch nicht gezeichnet (offset 100)', Math.abs(parseFloat(before.scaleOffset) - 100) < 1, `offset=${before.scaleOffset}`);
check('Gauge: below-fold — Ticks unsichtbar (opacity 0)', parseFloat(before.ticks0) === 0, `opacity=${before.ticks0}`);

// Zum Gauge scrollen → Sequenz startet
await page.evaluate(() => document.querySelector('#gauge-block').scrollIntoView({ block: 'center' }));
await page.waitForTimeout(400);
const during = await page.evaluate(() => {
  const needle = document.querySelector('.gnds-needle-wrap');
  const scale = document.querySelector('.gnds-scale');
  const n = needle.getAnimations().filter((a) => a.playState === 'running').length;
  const s = scale.getAnimations().filter((a) => a.playState === 'running').length;
  return { running: n + s, needleAnim: getComputedStyle(needle).animationName, scaleAnim: getComputedStyle(scale).animationName };
});
check('Gauge: In-View — Animation gestartet', during.running >= 1, `running=${during.running}`);

// Sequenz abschließen lassen (Sweep 0.95s + delay 0.55s + Count-up 0.9s + Puffer)
await page.waitForTimeout(2800);
const afterDone = await runningCount(page, '.gnds-needle-wrap, .gnds-scale, .gnds-tick');
check('Gauge: Sequenz abgeschlossen — 0 laufende Animationen', afterDone === 0, `running=${afterDone}`);

// Wert-Label = Zielwert
const labelDone = await page.evaluate(() => document.querySelector('.gnds-value').textContent.trim());
check('Gauge: Label = 75 nach Sequenz', labelDone === '75', `label=${labelDone}`);

// Raus- / Reinscrollen → darf NICHT erneut starten
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(700);
await page.evaluate(() => document.querySelector('#gauge-block').scrollIntoView({ block: 'center' }));
await page.waitForTimeout(700);
const afterRe = await runningCount(page, '.gnds-needle-wrap, .gnds-scale, .gnds-tick');
check('Gauge: Raus/Rein — startet NICHT erneut', afterRe === 0, `running=${afterRe}`);

// =====================================================================
// 2) GAUGE — Controls / Value-Update (Label + Nadel folgen, kein Remount)
// =====================================================================
await page.evaluate(() => window.__setGauge({ value: 40 }));
await page.waitForTimeout(300);
const updStart = await page.evaluate(() => document.querySelector('.gnds-needle-wrap').getAnimations().filter((a) => a.playState === 'running').length);
await page.waitForTimeout(1800); // Nadel-Sweep 0.95s + delay 0.55s + Label-Count-up
const upd = await page.evaluate(() => {
  const needle = document.querySelector('.gnds-needle-wrap');
  const label = document.querySelector('.gnds-value').textContent.trim();
  const rect = needle.getBoundingClientRect();
  return { label, running: needle.getAnimations().filter((a) => a.playState === 'running').length, top: rect.top };
});
check('Gauge: Value-Update — Nadel-Animation restarted', updStart >= 1, `running=${updStart}`);
check('Gauge: Value-Update — Label = 40', upd.label === '40', `label=${upd.label}`);
check('Gauge: Value-Update — keine Endlosanimation', upd.running === 0, `running=${upd.running}`);

// =====================================================================
// 3) GAUGE — min === max (keine Division durch 0, kein NaN)
// =====================================================================
await page.evaluate(() => window.__setGauge({ min: 50, max: 50, value: 50 }));
await page.waitForTimeout(1600);
const mm = await page.evaluate(() => {
  const label = document.querySelector('.gnds-value').textContent.trim();
  return { label, noNaN: !/NaN|Infinity/i.test(label) };
});
check('Gauge: min===max — Label endlich (50)', mm.label === '50' && mm.noNaN, `label=${mm.label}`);

// =====================================================================
// 4) GAUGE — Reduced Motion (eigener Kontext, reducedMotion: reduce)
// =====================================================================
const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const rpage = await rctx.newPage();
const rErrors = [];
rpage.on('pageerror', (e) => rErrors.push(String(e)));
await openHarness(rpage);
const rm = await rpage.evaluate(() => {
  const needle = document.querySelector('.gnds-needle-wrap');
  const scale = document.querySelector('.gnds-scale');
  const ticks = Array.from(document.querySelectorAll('.gnds-tick'));
  return {
    needleAnim: getComputedStyle(needle).animationName,
    needleRunning: needle.getAnimations().filter((a) => a.playState === 'running').length,
    scaleOffset: getComputedStyle(scale).strokeDashoffset,
    tickOpacity: getComputedStyle(ticks[0]).opacity,
    label: document.querySelector('.gnds-value').textContent.trim(),
  };
});
check('Gauge: Reduced — keine Nadel-Animation', rm.needleAnim === 'none' && rm.needleRunning === 0, `anim=${rm.needleAnim}/run=${rm.needleRunning}`);
check('Gauge: Reduced — Skala sofort gezeichnet (offset 0)', Math.abs(parseFloat(rm.scaleOffset)) < 1, `offset=${rm.scaleOffset}`);
check('Gauge: Reduced — Ticks sofort sichtbar', parseFloat(rm.tickOpacity) >= 0.9, `opacity=${rm.tickOpacity}`);
check('Gauge: Reduced — Label = Endwert 75', rm.label === '75', `label=${rm.label}`);
check('Gauge: Reduced — 0 pageerrors', rErrors.length === 0, String(rErrors.slice(0, 2)));
await rctx.close();

// =====================================================================
// 5) GOLD — Scroll-Latch (einmal sichtbar → dauerhaft gefüllt)
// =====================================================================
// Gold liegt bei translateY(340vh) — aktuell out-of-view
const gBefore = await page.evaluate(() => ({
  filled: document.querySelector('.goft-text').classList.contains('goft-filled'),
  inView: document.querySelector('.goft-text').getBoundingClientRect().top > window.innerHeight,
}));
check('Gold: below-fold — Outline (kein filled)', !gBefore.filled && gBefore.inView, `filled=${gBefore.filled}`);

await page.evaluate(() => document.querySelector('#gold-block').scrollIntoView({ block: 'center' }));
await page.waitForTimeout(400);
const gIn = await page.evaluate(() => ({
  filled: document.querySelector('.goft-text').classList.contains('goft-filled'),
  running: document.querySelector('.goft-text').getAnimations().filter((a) => a.playState === 'running').length,
}));
check('Gold: In-View — gefüllt (Latch-Trigger)', gIn.filled);
check('Gold: In-View — Entrance-Transition läuft', gIn.running >= 1, `running=${gIn.running}`);

await page.waitForTimeout(1700); // Transition 1.2s fertig
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(700);
const gOut = await page.evaluate(() => document.querySelector('.goft-text').classList.contains('goft-filled'));
check('Gold: Rausscrollen — bleibt gefüllt (Latch)', gOut);

await page.evaluate(() => document.querySelector('#gold-block').scrollIntoView({ block: 'center' }));
await page.waitForTimeout(700);
const gRe = await page.evaluate(() => document.querySelector('.goft-text').getAnimations().filter((a) => a.playState === 'running').length);
check('Gold: Reinscrollen — keine zweite Entrance-Sequenz', gRe === 0, `running=${gRe}`);

// =====================================================================
// 6) GOLD — fillOn=hover (Pointer: Maus + Touch-Tap) 
// =====================================================================
await page.evaluate(() => window.__setGold({ fillOn: 'hover' }));
await page.waitForTimeout(300);
// Echte Mausbewegung: Playwright hover erzeugt pointerover/pointerenter
// (React lauscht auf pointerover/pointerout — dispatchEvent(pointerenter)
// würde React nicht erreichen).
await page.hover('.goft-text');
await page.waitForTimeout(250);
const hIn = await page.evaluate(() => document.querySelector('.goft-text').classList.contains('goft-filled'));
check('Gold: hover — Maus drüber füllt', hIn);
await page.mouse.move(5, 5);
await page.waitForTimeout(250);
const hOut = await page.evaluate(() => document.querySelector('.goft-text').classList.contains('goft-filled'));
check('Gold: hover — Maus weg entfüllt', !hOut);

// =====================================================================
// 7) GOLD — fillOn=click: Maus + Keyboard (Enter/Space) + A11y-Attribute
// =====================================================================
await page.evaluate(() => window.__setGold({ fillOn: 'click' }));
await page.waitForTimeout(300);
const clickA11y = await page.evaluate(() => {
  const t = document.querySelector('.goft-text');
  return { role: t.getAttribute('role'), tab: t.getAttribute('tabindex'), pressed: t.getAttribute('aria-pressed'), cursor: getComputedStyle(t).cursor };
});
check('Gold: click — role=button', clickA11y.role === 'button', clickA11y.role);
check('Gold: click — tabIndex=0', clickA11y.tab === '0', String(clickA11y.tab));
check('Gold: click — cursor pointer', clickA11y.cursor === 'pointer', clickA11y.cursor);

await page.evaluate(() => document.querySelector('.goft-text').click());
await page.waitForTimeout(200);
const cIn = await page.evaluate(() => ({
  filled: document.querySelector('.goft-text').classList.contains('goft-filled'),
  pressed: document.querySelector('.goft-text').getAttribute('aria-pressed'),
}));
check('Gold: click — Maus-Klick füllt', cIn.filled);
check('Gold: click — aria-pressed=true', cIn.pressed === 'true', String(cIn.pressed));

// Keyboard: Enter toggelt aus
await page.evaluate(() => document.querySelector('.goft-text').focus());
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
const kOut = await page.evaluate(() => ({
  filled: document.querySelector('.goft-text').classList.contains('goft-filled'),
  pressed: document.querySelector('.goft-text').getAttribute('aria-pressed'),
}));
check('Gold: click — Enter toggelt aus (Keyboard)', !kOut.filled && kOut.pressed === 'false', `filled=${kOut.filled}`);

// Space toggelt wieder ein
await page.keyboard.press('Space');
await page.waitForTimeout(200);
const kIn = await page.evaluate(() => document.querySelector('.goft-text').classList.contains('goft-filled'));
check('Gold: click — Space toggelt wieder ein (Keyboard)', kIn);

// =====================================================================
// 8) GOLD — Shimmer (nur bei filled + NICHT reduced)
// =====================================================================
await page.evaluate(() => window.__setGold({ shimmer: true }));
await page.waitForTimeout(300);
const sh = await page.evaluate(() => {
  const t = document.querySelector('.goft-text');
  return {
    cls: t.classList.contains('goft-shimmer'),
    anim: getComputedStyle(t).animationName,
    running: t.getAnimations().filter((a) => a.playState === 'running').length,
  };
});
check('Gold: Shimmer — Klasse gesetzt', sh.cls);
check('Gold: Shimmer — goftShimmer-Animation läuft', sh.anim === 'goftShimmer', sh.anim);
check('Gold: Shimmer — Animation aktiv', sh.running >= 1, `running=${sh.running}`);

// =====================================================================
// 9) GOLD — Reduced Motion (eigener Kontext)
// =====================================================================
const grctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const grpage = await grctx.newPage();
const grErrors = [];
grpage.on('pageerror', (e) => grErrors.push(String(e)));
await openHarness(grpage);
// Shimmer an, damit geprüft wird, dass reduced ihn unterdrückt
await grpage.evaluate(() => window.__setGold({ shimmer: true, fillOn: 'scroll' }));
await grpage.waitForTimeout(300);
const gr = await grpage.evaluate(() => {
  const t = document.querySelector('.goft-text');
  const cs = getComputedStyle(t);
  return {
    filled: t.classList.contains('goft-filled'),
    shimmer: t.classList.contains('goft-shimmer'),
    transition: cs.transitionProperty,
    animName: cs.animationName,
    running: t.getAnimations().filter((a) => a.playState === 'running').length,
  };
});
check('Gold: Reduced — sofort gefüllt', gr.filled);
check('Gold: Reduced — KEIN Shimmer (JS-Guard)', !gr.shimmer);
check('Gold: Reduced — KEINE Transition', gr.transition === 'none' || gr.transition === 'all', `transition=${gr.transition}`);
check('Gold: Reduced — KEINE Animation', gr.animName === 'none' && gr.running === 0, `anim=${gr.animName}/run=${gr.running}`);
check('Gold: Reduced — 0 pageerrors', grErrors.length === 0, String(grErrors.slice(0, 2)));
await grctx.close();

// =====================================================================
// 10) GOLD — Responsive (Mobile 375x812, kein horizontaler Overflow)
// =====================================================================
const mctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true });
const mpage = await mctx.newPage();
await openHarness(mpage);
const mob = await mpage.evaluate(() => {
  const t = document.querySelector('.goft-text');
  const doc = document.scrollingElement;
  return {
    overflowX: doc.scrollWidth > doc.clientWidth,
    textVisible: t.getBoundingClientRect().width > 0,
    fontSize: getComputedStyle(t).fontSize,
  };
});
check('Gold: Mobile — kein horizontaler Overflow', !mob.overflowX, `scrollW=${mob.overflowX}`);
check('Gold: Mobile — Text sichtbar', mob.textVisible, mob.fontSize);
await mctx.close();

// =====================================================================
// Abschluss
// =====================================================================
const errCount = consoleErrors.length;
console.log(`\n=== RUNTIME QA BATCH 1 ===`);
results.forEach((r) => console.log(r));
console.log(`\nPASS: ${passed}  FAIL: ${failed}${errCount ? `  CONSOLE-ERRORS(main-ctx): ${errCount}` : ''}`);
if (errCount) {
  console.log('Console-Errors (main context):');
  consoleErrors.slice(0, 5).forEach((e) => console.log(' -', e.slice(0, 180)));
}
await browser.close();
process.exit(failed === 0 ? 0 : 1);
