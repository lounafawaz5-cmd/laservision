#!/usr/bin/env python3
"""Phase 4: overlays for the audiology reel (transparent 1080x1920 PNGs + manifest with bboxes).
Style (v2 review): clean titles, no notification-style boxes. Text in LaserVision blue with a soft white glow
so it reads on her white coat and on the B-roll; a thin accent line under titles.
End card = the "Claudia" LaserVision card (brand/references/laservision-endcard-claudia.png) WITHOUT the
Arabic sentence: logo, WhatsApp label + icon, number box, four branches.
"""
import io, json, os, re
import cairosvg
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from common import J, W, H, SAFE_TOP, SAFE_BOTTOM, LV_BLUE, LV_PALE, WHATSAPP

ROOT = os.path.dirname(J())
FB = os.path.join(ROOT, "brand/fonts/Outfit/Outfit-Bold.ttf")
FM = os.path.join(ROOT, "brand/fonts/Outfit/Outfit-Medium.ttf")
EMOJI = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
OUT = J("overlays"); os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
CARD_BLUE = (40, 90, 134)          # sampled from the Claudia end card (#285A86)
BLUE, PALE, WHITE = rgb(LV_BLUE), rgb(LV_PALE), (255, 255, 255)
font = lambda size, bold=True: ImageFont.truetype(FB if bold else FM, size)
manifest = {}

def save(key, img, bbox, check=True):
    x0, y0, x1, y1 = [int(v) for v in bbox]
    if check: assert y0 >= SAFE_TOP and y1 <= H - SAFE_BOTTOM, f"{key} outside safe zone {bbox}"
    img.save(os.path.join(OUT, key + ".png")); manifest[key] = {"file": key + ".png", "bbox": [x0, y0, x1, y1]}

def glow(img, radius=14, strength=2.2):
    """Soft white halo behind whatever is drawn on img (alpha-based), then the drawing on top."""
    a = img.getchannel("A").filter(ImageFilter.GaussianBlur(radius)).point(lambda v: min(255, int(v * strength)))
    halo = Image.new("RGBA", img.size, WHITE + (0,)); halo.putalpha(a)
    out = Image.new("RGBA", img.size); out.alpha_composite(halo); out.alpha_composite(img); return out

def emoji(ch, px):
    f = ImageFont.truetype(EMOJI, 109)
    im = Image.new("RGBA", (170, 170)); ImageDraw.Draw(im).text((10, 10), ch, font=f, embedded_color=True)
    im = im.crop(im.getbbox()); return im.resize((px, round(px * im.height / im.width)), Image.LANCZOS)

def circle_badge(ch, cx, cy, r):
    img = Image.new("RGBA", (W, H)); sh = Image.new("RGBA", (W, H))
    ImageDraw.Draw(sh).ellipse((cx - r, cy - r + 6, cx + r, cy + r + 6), fill=(0, 0, 0, 70))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    ImageDraw.Draw(img).ellipse((cx - r, cy - r, cx + r, cy + r), fill=WHITE + (250,), outline=PALE, width=4)
    e = emoji(ch, int(r * 1.15)); img.alpha_composite(e, (cx - e.width // 2, cy - e.height // 2))
    return img, (cx - r - 20, cy - r - 15, cx + r + 20, cy + r + 30)

# ---------- ear badge (short pop at "السمع") ----------
save("badge_ear", *circle_badge("👂", 870, 560, 80))

# ---------- titles ----------
def title(key, kicker, text, x0, y0, size=72, align="left", line=True):
    img = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(img)
    ft, fk = font(size), font(34)
    tw = ft.getlength(text); x = x0 if align == "left" else (W - tw) / 2
    y = y0
    if kicker:
        d.text((x, y), kicker, font=fk, fill=BLUE); y += 46
    d.text((x, y), text, font=ft, fill=CARD_BLUE)
    if line:
        d.rounded_rectangle((x, y + size + 14, x + min(tw, 260), y + size + 20), 3, fill=BLUE)
    img = glow(img)
    bb = img.getbbox(); save(key, img, (bb[0] - 4, bb[1] - 4, bb[2] + 4, bb[3] + 4))
    manifest[key]["line"] = [int(x), int(y + size + 14), int(min(tw, 260)), 6]
title("title_department", "NEW", "Audiology Department", 70, 1030)
title("title_hearing_aids", "", "Hearing aids", 0, 1060, size=80, align="center")

def tag(key, text, y, size=54):
    """Dark-blue pill behind white text (v1 style, kept by request); captions are hidden while these show."""
    f = font(size); w = int(f.getlength(text)) + 80; x1 = 1020; x0 = x1 - w
    img = Image.new("RGBA", (W, H)); sh = Image.new("RGBA", (W, H))
    ImageDraw.Draw(sh).rounded_rectangle((x0, y + 8, x1, y + 104), 48, fill=(0, 0, 0, 90))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(20)))
    ImageDraw.Draw(img).rounded_rectangle((x0, y, x1, y + 96), 48, fill=rgb("#005D83") + (245,))
    ImageDraw.Draw(img).text((x0 + 40, y + 18), text, font=f, fill=WHITE)
    save(key, img, (x0 - 30, y - 20, x1 + 30, y + 130))
tag("tag_audiometry", "AUDIOMETRY", 980)
tag("tag_tympanometry", "TYMPANOMETRY", 1100)

# ---------- custom-molded earplugs (vector illustration, rendered with cairosvg) ----------
EARPLUG_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 280">
 <defs>
  <linearGradient id="sil" x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stop-color="#8FDCEC"/><stop offset="0.5" stop-color="#30A4BF"/><stop offset="1" stop-color="#1A6E89"/>
  </linearGradient>
  <radialGradient id="gloss" cx="0.35" cy="0.3" r="0.55"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/>
   <stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#00303F" flood-opacity="0.3"/></filter>
 </defs>
 <!-- ear, line art -->
 <g fill="none" stroke="#285A86" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
  <path d="M52 108 C 50 52, 92 18, 138 24 C 186 30, 204 80, 186 124 C 174 152, 152 160, 146 186
           C 140 214, 128 254, 92 256 C 66 258, 52 240, 50 220"/>
  <path d="M86 104 C 88 74, 116 60, 140 70 C 162 80, 166 108, 150 126"/>
 </g>
 <!-- custom-molded plug sitting in the concha / canal -->
 <g filter="url(#sh)">
  <path fill="url(#sil)" d="M92 150 C 88 126, 108 112, 128 118 C 146 124, 152 144, 144 162
        C 138 178, 124 190, 108 188 C 94 186, 94 170, 92 150 Z"/>
  <path fill="url(#sil)" d="M100 140 C 92 136, 80 140, 74 150 C 70 158, 76 164, 84 160 L 102 152 Z"/>
  <ellipse cx="116" cy="140" rx="20" ry="14" fill="url(#gloss)"/>
  <circle cx="122" cy="166" r="6" fill="#0F4B60" opacity="0.75"/>
 </g>
</svg>"""
def render_svg(svg, w):
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(), output_width=w))).convert("RGBA")
ear = render_svg(EARPLUG_SVG, 230)
img = Image.new("RGBA", (W, H)); X, Y = 700, 860
img.alpha_composite(ear, (X, Y))
f = font(50); t = "Custom earplugs"; tx = min(1010 - f.getlength(t), X + (ear.width - f.getlength(t)) / 2)
d = ImageDraw.Draw(img); d.text((tx, Y + ear.height + 10), t, font=f, fill=CARD_BLUE)
img = glow(img, radius=12, strength=1.6); bb = img.getbbox()
save("earplugs", img, (bb[0] - 4, bb[1] - 4, bb[2] + 4, bb[3] + 4))
for key, ch, cy in (("badge_noise", "🔊", Y + 60), ("badge_water", "💧", Y + 170)):
    save(key, *circle_badge(ch, X - 70, cy, 46))

# ---------- name title: Hala / Audiologist · Laser Vision ----------
img = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(img); x0, y0 = 70, 1080
d.rounded_rectangle((x0, y0 + 6, x0 + 8, y0 + 150), 4, fill=BLUE)
d.text((x0 + 30, y0), "Hala", font=font(80), fill=CARD_BLUE)
d.text((x0 + 32, y0 + 100), "Audiologist · Laser Vision", font=font(40, bold=False), fill=CARD_BLUE)
img = glow(img); bb = img.getbbox(); save("name_hala", img, (bb[0] - 4, bb[1] - 4, bb[2] + 4, bb[3] + 4))

# ---------- LaserVision logo on the wall (composited BEHIND her) ----------
logo = Image.open(os.path.join(ROOT, "brand/laservision/logo-transparent.png")).convert("RGBA")
LW = 1000; logo = logo.resize((LW, round(LW * logo.height / logo.width)), Image.LANCZOS)
img = Image.new("RGBA", (W, H)); cx, cy = 540, 370
img.alpha_composite(logo, (cx - LW // 2, cy - logo.height // 2))
save("logo_wall", img, (cx - LW // 2, cy - logo.height // 2, cx + LW // 2, cy + logo.height // 2), check=False)

# ---------- end card (Claudia layout, Arabic line removed), white background ----------
svg = re.search(r'd="([^"]+)"', open(os.path.join(ROOT, "reels/src/components/WhatsAppIcon.tsx")).read()).group(1)
LOGO_W = 772                                   # measured from the reference card (scaled to 1080 wide)
lg = Image.open(os.path.join(ROOT, "brand/laservision/logo-transparent.png")).convert("RGBA")
lg = lg.resize((LOGO_W, round(LOGO_W * lg.height / lg.width)), Image.LANCZOS)
# vertical stack: logo, gap, [icon + WhatsApp], gap, number box, gap, branches
fl, fn, fb = font(38), font(58), font(36)   # number sized to leave the reference padding in the box
BOX_W, BOX_H = 487, 119
stack = lg.height + 130 + 40 + 16 + BOX_H + 80 + 36
y = (H - stack) // 2
y_logo = y; y_label = y_logo + lg.height + 130; y_box = y_label + 40 + 16; y_br = y_box + BOX_H + 80
img = Image.new("RGBA", (W, H)); img.alpha_composite(lg, ((W - LOGO_W) // 2, y_logo))
save("end_logo", img, ((W - LOGO_W) // 2, y_logo, (W + LOGO_W) // 2, y_logo + lg.height))
icon = Image.open(io.BytesIO(cairosvg.svg2png(
    bytestring=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#285A86" d="{svg}"/></svg>'.encode(),
    output_width=42, output_height=42))).convert("RGBA")
lab = "WhatsApp"; lw = 42 + 12 + fl.getlength(lab); lx = (W - lw) / 2
img = Image.new("RGBA", (W, H)); img.alpha_composite(icon, (int(lx), y_label))
ImageDraw.Draw(img).text((lx + 54, y_label + 21), lab, font=fl, fill=CARD_BLUE, anchor="lm")
bx = (W - BOX_W) // 2
d = ImageDraw.Draw(img); d.rectangle((bx, y_box, bx + BOX_W, y_box + BOX_H), fill=CARD_BLUE)
d.text((W / 2, y_box + BOX_H / 2), WHATSAPP, font=fn, fill=WHITE, anchor="mm")
save("end_whatsapp", img, (bx, y_label, bx + BOX_W, y_box + BOX_H))
img = Image.new("RGBA", (W, H))
ImageDraw.Draw(img).text((W / 2, y_br + 18), "Hazmieh · Saida · Tripoli · Hôtel-Dieu", font=fb, fill=CARD_BLUE, anchor="mm")
bb = img.getbbox(); save("end_branches", img, bb)

json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
print(len(manifest), "overlays:", ", ".join(manifest))
