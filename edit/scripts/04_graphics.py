#!/usr/bin/env python3
"""Phase 4: transparent 1080x1920 PNG overlays in edit/overlays/ (Pillow).
Cards are generated from the unique overlay_text values in edit_plan.csv, plus the hook,
tip counters 1/7..7/7, recap checklist frames (one per line) and the CTA.
Writes overlays/manifest.json: {key: {file, bbox:[x0,y0,x1,y1]}} for the assembler.
All content stays inside the safe zone (y 250..1520).
"""
import csv, json, os, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from common import J, ACCENT, W, H, SAFE_TOP, SAFE_BOTTOM

ROOT = os.path.dirname(J())
from common import FONT_BOLD, FONT_IS_GUIDE
# guide: Montserrat Arabic Bold for all on-screen text (Outfit until the font file is added)
FONT_B = FONT_BOLD if FONT_IS_GUIDE else os.path.join(ROOT, "brand/fonts/Outfit/Outfit-Bold.ttf")
FONT_M = FONT_BOLD if FONT_IS_GUIDE else os.path.join(ROOT, "brand/fonts/Outfit/Outfit-Medium.ttf")
EMOJI = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
OUT = J("overlays"); os.makedirs(OUT, exist_ok=True)
INK, WHITE = (11, 31, 42), (255, 255, 255)
STYLE = {  # color, emoji, label
    "do": ((34, 197, 94), "✅", "DO"),
    "dont": ((239, 68, 68), "❌", "DON'T"),
    "warning": ((250, 204, 21), "⚠️", "WARNING"),
    "doctor": ((0, 180, 216), "🩺", "SEE A DOCTOR"),
}
SAFE_Y0, SAFE_Y1 = SAFE_TOP, H - SAFE_BOTTOM
EMO_RE = re.compile(r"([\U0001F300-\U0001FAFF☀-➿]️?)")
hexrgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
ACC = hexrgb(ACCENT)
font = lambda size, bold=True: ImageFont.truetype(FONT_B if bold else FONT_M, size)

def emoji(ch, px):
    f = ImageFont.truetype(EMOJI, 109)               # CBDT bitmap font: fixed 109 px strike
    im = Image.new("RGBA", (160, 160)); ImageDraw.Draw(im).text((10, 10), ch, font=f, embedded_color=True)
    im = im.crop(im.getbbox()); return im.resize((px, round(px * im.height / im.width)), Image.LANCZOS)

def rich_width(text, f):
    w = 0
    for part in EMO_RE.split(text):
        if not part: continue
        w += int(f.size * 1.1) if EMO_RE.fullmatch(part) else f.getlength(part)
    return w

def draw_rich(img, xy, text, f, fill, stroke=0, stroke_fill=None):
    x, y = xy; d = ImageDraw.Draw(img)
    for part in EMO_RE.split(text):
        if not part: continue
        if EMO_RE.fullmatch(part):
            e = emoji(part, int(f.size * 0.95)); img.alpha_composite(e, (int(x + f.size * 0.08), int(y + f.size * 0.12))); x += f.size * 1.1
        else:
            d.text((x, y), part, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill); x += f.getlength(part)

def wrap(text, f, maxw):
    lines, cur = [], ""
    for wd in text.split():
        t = (cur + " " + wd).strip()
        if rich_width(t, f) <= maxw or not cur: cur = t
        else: lines.append(cur); cur = wd
    return lines + [cur]

def shadowed(panel_box, radius, fill, blur=22, offset=10, alpha=110):
    img = Image.new("RGBA", (W, H))
    sh = Image.new("RGBA", (W, H)); x0, y0, x1, y1 = panel_box
    ImageDraw.Draw(sh).rounded_rectangle((x0, y0 + offset, x1, y1 + offset), radius, fill=(0, 0, 0, alpha))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(img).rounded_rectangle(panel_box, radius, fill=fill)
    return img

manifest = {}
def save(key, img, bbox):
    fn = f"{key}.png"; img.save(os.path.join(OUT, fn)); manifest[key] = {"file": fn, "bbox": [int(v) for v in bbox]}
    assert bbox[1] >= SAFE_Y0 and bbox[3] <= SAFE_Y1, f"{key} outside safe zone: {bbox}"

def slug(s): return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")[:40]

# ---------- tip cards (top fixed at y=1000, grows down) ----------
def tip_card(tip, style, text):
    col, emo, label = STYLE[style]
    X0, X1, Y0, PAD = 60, 1020, 1000, 34
    ft, fl = font(60), font(34)
    lines = wrap(text, ft, X1 - X0 - 2 * PAD - 120)
    h = PAD + 44 + 12 + len(lines) * 70 + PAD + 10
    img = shadowed((X0, Y0, X1, Y0 + h), 44, (255, 255, 255, 245))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((X0, Y0, X0 + 18, Y0 + h), 9, fill=col)                     # style strip
    d.rounded_rectangle((X0 + 40, Y0 + h - 12, X1 - 40, Y0 + h - 6), 3, fill=ACC)   # accent underline
    e = emoji(emo, 92); img.alpha_composite(e, (X1 - PAD - 92, Y0 + (h - e.height) // 2))
    lab = f"TIP {tip}  ·  {label}"
    d.text((X0 + PAD + 10, Y0 + PAD - 4), lab, font=fl, fill=col if style != "warning" else (202, 138, 4))
    for i, ln in enumerate(lines):
        draw_rich(img, (X0 + PAD + 10, Y0 + PAD + 52 + i * 70), ln, ft, INK)
    return img, (X0 - 30, Y0 - 20, X1 + 30, Y0 + h + 40)

plan = list(csv.DictReader(open(J("edit_plan.csv"))))
for r in plan:
    if r["overlay_style"] in STYLE and r["overlay_text"]:
        key = f"card_t{r['tip_number']}_{slug(r['overlay_text'])}"
        if key not in manifest:
            img, bb = tip_card(r["tip_number"], r["overlay_style"], r["overlay_text"]); save(key, img, bb)

# ---------- hook ----------
def hook():
    X0, X1, Y0 = 70, 1010, 860
    f1, f2 = font(96), font(84)
    l2 = wrap("Don't make these mistakes 👀", f2, X1 - X0 - 80)
    h = 40 + 110 + len(l2) * 98 + 40
    img = shadowed((X0, Y0, X1, Y0 + h), 50, (11, 31, 42, 235))
    d = ImageDraw.Draw(img)
    t1 = "Wearing contacts?"; d.text(((W - f1.getlength(t1)) / 2, Y0 + 34), t1, font=f1, fill=ACC)
    for i, ln in enumerate(l2):
        draw_rich(img, ((W - rich_width(ln, f2)) / 2, Y0 + 40 + 112 + i * 98), ln, f2, WHITE)
    return img, (X0 - 30, Y0 - 20, X1 + 30, Y0 + h + 40)
save("hook", *hook())

# ---------- counters (top-right, just under the top safe line) ----------
for n in range(1, 8):
    img = Image.new("RGBA", (W, H)); f = font(44)
    t1, t2 = "TIP ", f"{n}/7"
    w = f.getlength(t1) + f.getlength(t2) + 56
    x1, y0 = 1030, 268; x0 = x1 - w
    img = shadowed((x0, y0, x1, y0 + 74), 37, (11, 31, 42, 215), blur=10, offset=4, alpha=90)
    d = ImageDraw.Draw(img)
    d.text((x0 + 28, y0 + 10), t1, font=f, fill=WHITE); d.text((x0 + 28 + f.getlength(t1), y0 + 10), t2, font=f, fill=ACC)
    save(f"counter_{n}", img, (x0 - 15, y0 - 10, x1 + 15, y0 + 95))

# ---------- ZVC outro (same layout as the Monogram reel end card, reels/src/templates/BeatAd.tsx) ----------
# black card, ZEISS Indigo line, "ZEISS Vision Center by Laser Vision" wordmark, white WhatsApp glyph + number.
# Never the blue ZEISS block logo (strategy/SUMMARY.md).
import io, cairosvg
ZVC_BLUE = (15, 45, 179)    # ZEISS Indigo #0F2DB3 (brand/zeiss/GUIDELINES.md)
WHATSAPP = "+961 81 47 20 20"
svg_path = re.search(r'd="([^"]+)"', open(os.path.join(ROOT, "reels/src/components/WhatsAppIcon.tsx")).read()).group(1)
LINE_W, LOGO_W, ICON, GAP = 420, 620, 64, 56
logo = Image.open(os.path.join(ROOT, "brand/zeiss/zvc-wordmark-white.png")).convert("RGBA")
logo = logo.resize((LOGO_W, round(LOGO_W * logo.height / logo.width)), Image.LANCZOS)
total = 5 + GAP + logo.height + GAP + ICON
y_line = (H - total) // 2; y_logo = y_line + 5 + GAP; y_wa = y_logo + logo.height + GAP

save("outro_bg", Image.new("RGBA", (W, H), (0, 0, 0, 255)), (0, SAFE_Y0, W, SAFE_Y1))
img = Image.new("RGBA", (W, H)); ImageDraw.Draw(img).rectangle(((W - LINE_W) // 2, y_line, (W + LINE_W) // 2, y_line + 5), fill=ZVC_BLUE)
save("outro_line", img, ((W - LINE_W) // 2, y_line, (W + LINE_W) // 2, y_line + 5))
img = Image.new("RGBA", (W, H)); img.alpha_composite(logo, ((W - LOGO_W) // 2, y_logo))
save("outro_logo", img, ((W - LOGO_W) // 2, y_logo, (W + LOGO_W) // 2, y_logo + logo.height))
icon = Image.open(io.BytesIO(cairosvg.svg2png(
    bytestring=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FFFFFF" d="{svg_path}"/></svg>'.encode(),
    output_width=ICON, output_height=ICON))).convert("RGBA")
fn = font(56, bold=False)
num_w = sum(fn.getlength(ch) + 3 for ch in WHATSAPP)                  # letter-spacing 3, as on the Monogram card
row_w = ICON + 22 + num_w; x = (W - row_w) / 2
img = Image.new("RGBA", (W, H)); img.alpha_composite(icon, (int(x), y_wa))
d = ImageDraw.Draw(img); cx = x + ICON + 22
for ch in WHATSAPP:
    d.text((cx, y_wa + ICON / 2), ch, font=fn, fill=WHITE, anchor="lm"); cx += fn.getlength(ch) + 3
save("outro_whatsapp", img, (int(x) - 10, y_wa - 10, int(x + row_w) + 10, y_wa + ICON + 10))

json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
print(len(manifest), "overlays:", ", ".join(manifest))
