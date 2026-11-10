// Renders slides.html to out/slide-01.png … slide-08.png (1080 × 1350).
// Usage (from repo root): node carousels/laservision/prep-aftercare-checklist/render.mjs
// Optional photos: put photos/slide-0N.jpg next to this file and that slide uses it instead of its illustration.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright'); // CommonJS lookup so a global Playwright install is found

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'out');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, 'slides.html')).href);
await page.evaluate(() => document.fonts.ready);

const slides = await page.$$('.slide');
for (const [i, el] of slides.entries()) {
  const n = String(i + 1).padStart(2, '0');
  const photo = join(here, 'photos', `slide-${n}.jpg`);
  if (existsSync(photo)) {
    await el.evaluate((s, url) => {
      s.classList.add('has-photo');
      const p = s.querySelector('.photo');
      if (p) p.style.backgroundImage = `url("${url}")`;
    }, pathToFileURL(photo).href);
  }
  await el.screenshot({ path: join(out, `slide-${n}.png`) });
  console.log(`slide-${n}.png${existsSync(photo) ? ' (photo)' : ''}`);
}
await browser.close();
