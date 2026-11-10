// Builds a Canva-importable version of slides.html: per slide, one background image (art, shapes,
// highlight bands, icons, logo) plus every piece of text as a separate, editable text box.
// Usage (repo root): node carousels/laservision/prep-aftercare-checklist/export-canva.cjs <public base URL of canva/>
// Then import <base>/index.html into Canva (import-design-from-url, type instagram_post).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), url = require('url');

const here = __dirname, outDir = path.join(here, 'canva');
const base = (process.argv[2] || '').replace(/\/?$/, '/');
if (!/^https:\/\//.test(base)) { console.error('Pass the public https base URL of the canva/ folder'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(url.pathToFileURL(path.join(here, 'slides.html')).href);
  await page.evaluate(() => document.fonts.ready);

  // 1. Collect text blocks per slide.
  const slides = await page.evaluate(() => {
    const isInline = n => n.nodeType === 3 || (n.nodeType === 1 && getComputedStyle(n).display === 'inline' && n.tagName !== 'svg') || n.nodeName === 'BR';
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const ser = (n, parentCS) => {
      if (n.nodeType === 3) return esc(n.textContent.replace(/\s+/g, ' '));
      if (n.nodeName === 'BR') return '<br>';
      const cs = getComputedStyle(n);
      const inner = [...n.childNodes].map(c => ser(c, cs)).join('');
      const st = [];
      if (cs.color !== parentCS.color) st.push(`color:${cs.color}`);
      if (cs.fontWeight !== parentCS.fontWeight) st.push(`font-weight:${cs.fontWeight}`);
      return st.length ? `<span style="${st.join(';')}">${inner}</span>` : inner;
    };
    const out = [];
    for (const s of document.querySelectorAll('.slide')) {
      const sr = s.getBoundingClientRect(), blocks = [];
      const walk = el => {
        if (el.tagName === 'svg' || el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;
        const kids = [...el.childNodes];
        let run = [];
        const flush = () => {
          if (run.some(n => n.textContent.trim())) {
            while (run.length && run[0].nodeType === 3 && !run[0].textContent.trim()) run.shift();
            while (run.length && run[run.length - 1].nodeType === 3 && !run[run.length - 1].textContent.trim()) run.pop();
            const r = document.createRange(); r.setStartBefore(run[0]); r.setEndAfter(run[run.length - 1]);
            const rect = r.getBoundingClientRect(), first = r.getClientRects()[0];
            const cs = getComputedStyle(el);
            const fs = parseFloat(cs.fontSize);
            const lh = cs.lineHeight === 'normal' ? fs * 1.26 : parseFloat(cs.lineHeight);
            const multi = rect.height > lh * 1.5;
            const er = el.getBoundingClientRect();
            const contentW = er.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
            const right = cs.textAlign === 'right' || cs.textAlign === 'end';
            let w = multi ? Math.max(rect.width, contentW) + 6 : rect.width + 24;
            let left = right ? rect.right - w : rect.left;
            if (multi && !right) left = Math.min(rect.left, er.left + parseFloat(cs.paddingLeft));
            const top = first.top - (lh - first.height) / 2;
            blocks.push({
              left: left - sr.left, top: top - sr.top, width: w,
              html: run.map(n => ser(n, cs)).join('').trim(),
              style: `font-family:'Outfit';font-size:${cs.fontSize};line-height:${lh}px;font-weight:${cs.fontWeight};color:${cs.color};letter-spacing:${cs.letterSpacing === 'normal' ? '0' : cs.letterSpacing};text-transform:${cs.textTransform};word-spacing:${cs.wordSpacing};text-align:${right ? 'right' : 'left'}`
            });
          }
          run = [];
        };
        for (const k of kids) {
          if (isInline(k)) { if (k.nodeType === 1 && k.querySelector && k.querySelector('svg')) { flush(); walk(k); } else run.push(k); }
          else { flush(); if (k.nodeType === 1) walk(k); }
        }
        flush();
      };
      walk(s);
      out.push(blocks);
    }
    return out;
  });

  // 2. Background images: same slides, text made invisible (shapes, bands and icons stay).
  await page.addStyleTag({ content: '.slide, .slide * { -webkit-text-fill-color: transparent !important; } .slide svg text { -webkit-text-fill-color: initial !important; }' });
  const els = await page.$$('.slide');
  for (const [i, el] of els.entries()) await el.screenshot({ path: path.join(outDir, `bg-${String(i + 1).padStart(2, '0')}.png`) });
  await browser.close();

  // 3. Import HTML: one page element per slide.
  const pages = slides.map((blocks, i) => {
    const n = String(i + 1).padStart(2, '0');
    const texts = blocks.map(b =>
      `    <div style="position:absolute;left:${b.left.toFixed(1)}px;top:${b.top.toFixed(1)}px;width:${b.width.toFixed(1)}px;${b.style}">${b.html}</div>`).join('\n');
    return `  <section data-document-role="page" data-label="Slide ${n}" style="position:relative;width:1080px;height:1350px;overflow:hidden;background:url('${base}bg-${n}.png') center/cover no-repeat;">
    <img src="${base}bg-${n}.png" alt="" style="position:absolute;left:0;top:0;width:1080px;height:1350px;">
${texts}
  </section>`;
  }).join('\n');
  fs.writeFileSync(path.join(outDir, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>LaserVision before &amp; after checklist</title>
<style>@font-face{font-family:'Outfit';font-weight:300;src:url('https://raw.githubusercontent.com/lounafawaz5-cmd/laservision/claude/friendly-hypatia-ut5r07/brand/fonts/Outfit/Outfit-Light.ttf') format('truetype')}@font-face{font-family:'Outfit';font-weight:400;src:url('https://raw.githubusercontent.com/lounafawaz5-cmd/laservision/claude/friendly-hypatia-ut5r07/brand/fonts/Outfit/Outfit-Regular.woff2') format('woff2')}@font-face{font-family:'Outfit';font-weight:500;src:url('https://raw.githubusercontent.com/lounafawaz5-cmd/laservision/claude/friendly-hypatia-ut5r07/brand/fonts/Outfit/Outfit-Medium.ttf') format('truetype')}@font-face{font-family:'Outfit';font-weight:700;src:url('https://raw.githubusercontent.com/lounafawaz5-cmd/laservision/claude/friendly-hypatia-ut5r07/brand/fonts/Outfit/Outfit-Bold.ttf') format('truetype')}</style>
<style>body{margin:0;font-family:Outfit,sans-serif} section{margin:0}</style></head>
<body>
${pages}
</body></html>
`);
  console.log(slides.map((b, i) => `slide ${i + 1}: ${b.length} text boxes`).join('\n'));
})();
