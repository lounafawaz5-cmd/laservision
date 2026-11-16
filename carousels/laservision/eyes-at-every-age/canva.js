// Builds a Canva-friendly PDF: background + illustrations flattened to one image per page,
// every text block as its own absolutely placed box (no letter-spacing, no flow dependence).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const out = path.join(__dirname, 'html');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const pdfs = [];
  for (let n = 1; n <= 6; n++) {
    const id = String(n).padStart(2, '0');
    await p.goto('file://' + path.join(out, `slide-${id}.html`));
    await p.evaluate(() => document.fonts.ready);
    // 1. background-only screenshot
    await p.addStyleTag({ content: '.txt,.logo,.foot{visibility:hidden}' });
    const bg = path.join(out, `bg-${id}.png`);
    await p.screenshot({ path: bg });
    // 2. pin each text block where it currently sits, then swap the background for the image
    await p.evaluate((bgUrl) => {
      const sel = '.txt .tag, .txt h1, .txt .sub, .txt li, .txt p';
      const els = [...document.querySelectorAll(sel)];
      const rects = els.map(e => e.getBoundingClientRect());
      const slide = document.querySelector('.slide');
      els.forEach((e, i) => {
        const r = rects[i];
        e.style.position = 'absolute'; e.style.margin = '0';
        e.style.left = r.left + 'px'; e.style.top = r.top + 'px';
        e.style.width = (r.width + 24) + 'px'; e.style.letterSpacing = '0';
        if (e.tagName === 'LI') e.style.listStyle = 'none';
        slide.appendChild(e);
      });
      document.querySelector('.txt').remove();
      ['.dots-bg', '.glow', 'svg.art', '.fade'].forEach(s => document.querySelector(s)?.remove());
      document.body.style.background = 'none';
      const img = document.createElement('img');
      img.src = bgUrl; img.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:1350px';
      slide.prepend(img);
      document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('visibility:hidden')) s.remove(); });
    }, 'file://' + bg);
    await p.waitForLoadState('load');
    await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => i.onload = r))));
    await p.screenshot({ path: path.join(out, `canva-check-${id}.png`) });
    const f = path.join(out, `canva-${id}.pdf`);
    await p.pdf({ path: f, width: '1080px', height: '1350px', printBackground: true, pageRanges: '1' });
    pdfs.push(f);
  }
  await b.close();
  fs.writeFileSync(path.join(out, 'list.txt'), pdfs.join('\n'));
})();
