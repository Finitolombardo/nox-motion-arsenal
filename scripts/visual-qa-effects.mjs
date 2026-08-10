// Visual QA — Screenshots (t=0 / t≥1200ms) + objektiver Pixel-Nachweis.
// PNG-Decode (zlib-inflate + Unfilter) ohne externe Dependencies; beweist
// Animation über Pixel-Change-Ratio und die Gold-Signatur über Farbanteile.
import { chromium } from 'playwright-core';
import { inflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.QA_BASE_URL ?? 'http://localhost:5198';
const OUT = 'reports/visual-qa';
mkdirSync(OUT, { recursive: true });

// --- Minimaler PNG-Decoder (8-bit, non-interlaced, RGB/RGBA) -----------------
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('kein PNG');
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : 3; // RGBA bzw. RGB
  const stride = width * bpp;
  const out = Buffer.alloc(width * height * 3);
  let prev = Buffer.alloc(stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    const line = Buffer.from(raw.subarray(p, p + stride));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        v = (v + pr) & 0xff;
      }
      line[x] = v;
    }
    for (let x = 0; x < width; x++) {
      out[(y * width + x) * 3] = line[x * bpp];
      out[(y * width + x) * 3 + 1] = line[x * bpp + 1];
      out[(y * width + x) * 3 + 2] = line[x * bpp + 2];
    }
    prev = line;
    p += stride;
  }
  return { width, height, data: out };
}

function pixelStats(rgbA, rgbB) {
  let changed = 0, goldA = 0, goldB = 0;
  const total = rgbA.data.length / 3;
  for (let i = 0; i < total; i++) {
    const o = i * 3;
    const r1 = rgbA.data[o], g1 = rgbA.data[o + 1], b1 = rgbA.data[o + 2];
    const r2 = rgbB.data[o], g2 = rgbB.data[o + 1], b2 = rgbB.data[o + 2];
    if (Math.abs(r1 - r2) > 8 || Math.abs(g1 - g2) > 8 || Math.abs(b1 - b2) > 8) changed++;
    if (r1 > 150 && g1 > 100 && b1 < 140 && r1 > b1 + 40) goldA++;
    if (r2 > 150 && g2 > 100 && b2 < 140 && r2 > b2 + 40) goldB++;
  }
  return {
    changedRatio: changed / total,
    goldRatioB: goldB / total,
    goldDelta: (goldB - goldA) / total,
  };
}

let failed = 0;
const report = (ok, name, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto(`${BASE}/scripts/runtime-qa-effects.html`);
await page.waitForFunction(() => window.__qaReady === true, null, { timeout: 20000 });

// --- PTD: Entrance t0 → Pointer-Tilt t1 --------------------------------------
await page.locator('#ptd-block').scrollIntoViewIfNeeded();
await page.waitForSelector('.ptd-stage.ptd-entered', { timeout: 8000 });
const ptd = page.locator('.ptd-root');
await ptd.screenshot({ path: `${OUT}/ptd-t0.png` });
const box = await ptd.boundingBox();
await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.72);
await page.waitForTimeout(1400);
await ptd.screenshot({ path: `${OUT}/ptd-t1.png` });
const ptdStats = pixelStats(decodePng(readFileSync(OUT + '/ptd-t0.png')), decodePng(readFileSync(OUT + '/ptd-t1.png')));
report(ptdStats.changedRatio > 0.002, `PTD Pixel-Change (Animation beweist sich)`, `changed=${(ptdStats.changedRatio * 100).toFixed(2)}%`);
report(ptdStats.goldRatioB > 0.005, `PTD Gold-Signatur sichtbar`, `gold=${(ptdStats.goldRatioB * 100).toFixed(2)}%`);

// --- AGS: Auto-Sweep t0 → t1 --------------------------------------------------
await page.evaluate(() => window.__setAGS({ trigger: 'auto', struck: false }));
await page.locator('#ags-block').scrollIntoViewIfNeeded();
await page.waitForSelector('.ags-root.ags-auto', { timeout: 8000 });
const ags = page.locator('.ags-root');
await ags.screenshot({ path: `${OUT}/ags-t0.png` });
await page.waitForTimeout(1400);
await ags.screenshot({ path: `${OUT}/ags-t1.png` });
const agsStats = pixelStats(decodePng(readFileSync(OUT + '/ags-t0.png')), decodePng(readFileSync(OUT + '/ags-t1.png')));
report(agsStats.changedRatio > 0.002, `AGS Pixel-Change (Sweep-Animation)`, `changed=${(agsStats.changedRatio * 100).toFixed(2)}%`);
report(agsStats.goldRatioB > 0.001, `AGS Gold-Linie sichtbar`, `gold=${(agsStats.goldRatioB * 100).toFixed(2)}%`);

// --- Detailseiten rendern ohne Fehler ------------------------------------------
for (const [id, sel, name] of [
  ['hero-pointer-text-depth', '.ptd-root', 'Pointer Text Depth'],
  ['hero-angled-gold-strike', '.ags-root', 'Angled Gold Strikethrough'],
]) {
  await page.goto(`${BASE}/#/effect/${id}`);
  await page.waitForSelector(sel, { timeout: 15000 });
  const rendered = await page.evaluate((n) => document.body.textContent.includes(n), name);
  report(rendered, `Detailseite ${id}: gerendert + Titel sichtbar`);
  await page.screenshot({ path: `${OUT}/detail-${id}.png` });
}

report(errs.length === 0, '0 Console-/Page-Errors auf allen Seiten', errs.slice(0, 3).join(' | '));

await browser.close();
if (failed > 0) { console.error(`\nVISUAL QA FAILED: ${failed}`); process.exit(1); }
console.log('\nVISUAL QA: Screenshots + Pixel-Nachweis ok → reports/visual-qa/');
