const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (let n = 1; n <= 6; n++) {
    const id = String(n).padStart(2, '0');
    await p.goto('file://' + path.join(__dirname, 'html', `slide-${id}.html`));
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(__dirname, `slide-${id}.png`) });
  }
  await b.close();
})();
