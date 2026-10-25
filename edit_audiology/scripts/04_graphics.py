#!/usr/bin/env python3
"""Phase 4: overlays for the audiology reel (transparent 1080x1920 PNGs + manifest with bboxes).
LaserVision palette (brand/laservision/GUIDELINES.md), Outfit font, Noto Color Emoji.
Each overlay's animation is set in edit_plan.csv; the assembler adds the matching SFX (pop / whoosh / ding).
"""
import io, json, os, re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from common import J, W, H, SAFE_TOP, SAFE_BOTTOM, LV_PRIMARY, LV_DARK, LV_BLUE, LV_PALE, WHATSAPP

ROOT = os.path.dirname(J())
FB = os.path.join(ROOT, "brand/fonts/Outfit/Outfit-Bold.ttf")
FM = os.path.join(ROOT, "brand/fonts/Outfit/Outfit-Medium.ttf")
EMOJI = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
OUT = J("overlays"); os.makedirs(OUT, exist_ok=True)
rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
PRI, DARK, BLUE, PALE, WHITE = rgb(LV_PRIMARY), rgb(LV_DARK), rgb(LV_BLUE), rgb(LV_PALE), (255, 255, 255)
font = lambda size, bold=True: ImageFont.truetype(FB if bold else FM, size)
manifest = {}

def save(key, img, bbox, anchor=None, check=True):
    x0, y0, x1, y1 = [int(v) for v in bbox]
    if check: assert y0 >= SAFE_TOP and y1 <= H - SAFE_BOTTOM, f"{key} outside safe zone {bbox}"
    img.save(os.path.join(OUT, key + ".png"))
    manifest[key] = {"file": key + ".png", "bbox": [x0, y0, x1, y1],
                     "anchor": anchor or [(x0 + x1) // 2, (y0 + y1) // 2]}

def emoji(ch, px):
    f = ImageFont.truetype(EMOJI, 109)
    im = Image.new("RGBA", (170, 170)); ImageDraw.Draw(im).text((10, 10), ch, font=f, embedded_color=True)
    im = im.crop(im.getbbox()); return im.resize((px, round(px * im.height / im.width)), Image.LANCZOS)

def shadow_shape(box, radius, fill, blur=20, off=8, alpha=90, outline=None):
    img = Image.new("RGBA", (W, H)); sh = Image.new("RGBA", (W, H))
    x0, y0, x1, y1 = box
    ImageDraw.Draw(sh).rounded_rectangle((x0, y0 + off, x1, y1 + off), radius, fill=(0, 0, 0, alpha))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(img).rounded_rectangle(box, radius, fill=fill, outline=outline, width=4 if outline else 0)
    return img

def badge(ch, cx, cy, r=86):
    img = shadow_shape((cx - r, cy - r, cx + r, cy + r), r, WHITE + (250,), outline=PALE)
    e = emoji(ch, int(r * 1.15)); img.alpha_composite(e, (cx - e.width // 2, cy - e.height // 2))
    return img, (cx - r - 25, cy - r - 20, cx + r + 25, cy + r + 40)

# ---------- emoji badges ----------
save("badge_ear", *badge("👂", 870, 560))

# ---------- "NEW | Audiology Department" card (slides in from the left) ----------
x0, y0 = 60, 1000
fl, ft = font(34), font(66)
title = "Audiology Department"; w = int(ft.getlength(title)) + 100
img = shadow_shape((x0, y0, x0 + w, y0 + 170), 34, WHITE + (248,))
d = ImageDraw.Draw(img)
d.rounded_rectangle((x0, y0, x0 + 14, y0 + 170), 7, fill=BLUE)
d.rounded_rectangle((x0 + 48, y0 + 24, x0 + 48 + fl.getlength("NEW") + 36, y0 + 72), 24, fill=BLUE)
d.text((x0 + 66, y0 + 28), "NEW", font=fl, fill=WHITE)
d.text((x0 + 48, y0 + 80), title, font=ft, fill=PRI)
save("card_department", img, (x0 - 30, y0 - 20, x0 + w + 30, y0 + 210))

# ---------- pills (slide in from the right) ----------
def pill(key, text, y):
    f = font(54); w = int(f.getlength(text)) + 80; x1 = 1020; x0 = x1 - w
    img = shadow_shape((x0, y, x1, y + 96), 48, PRI + (245,))
    ImageDraw.Draw(img).text((x0 + 40, y + 18), text, font=f, fill=WHITE)
    save(key, img, (x0 - 30, y - 20, x1 + 30, y + 130))
pill("pill_audiometry", "AUDIOMETRY", 980)
pill("pill_tympanometry", "TYMPANOMETRY", 1100)

# ---------- hearing aids card (pops) ----------
f = font(66); text = "Hearing aids"; w = int(f.getlength(text)) + 230; x0 = (W - w) // 2; y0 = 1010
img = shadow_shape((x0, y0, x0 + w, y0 + 150), 40, WHITE + (248,))
e = emoji("🦻", 100); img.alpha_composite(e, (x0 + 50, y0 + 25))
ImageDraw.Draw(img).text((x0 + 180, y0 + 32), text, font=f, fill=PRI)
ImageDraw.Draw(img).rounded_rectangle((x0 + 40, y0 + 136, x0 + w - 40, y0 + 142), 3, fill=BLUE)
save("card_hearing_aids", img, (x0 - 30, y0 - 20, x0 + w + 30, y0 + 190))

# ---------- earplug card (slides in from the right) + noise / water badges ----------
def earplug(size=300):
    """Two foam earplugs (drawn at 4x, downsampled): separate tapered cylinders with flat, slightly
    rounded ends, cylindrical shading and fine foam grooves."""
    S = size * 4; im = Image.new("RGBA", (S, S))
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    def plug(cx, cy, ang, L, R0, R1, base):
        c, s_ = np.cos(np.radians(ang)), np.sin(np.radians(ang))
        u = (xx - cx) * c + (yy - cy) * s_; v = -(xx - cx) * s_ + (yy - cy) * c
        t = np.clip((u + L / 2) / L, 0, 1); r = R0 + (R1 - R0) * t
        # rounded-rectangle profile: body + small end caps (corner radius 35% of the radius)
        cr = 0.35 * r
        body = (np.abs(u) <= L / 2 - cr) & (np.abs(v) <= r)
        ends = (np.abs(u) <= L / 2) & (np.abs(v) <= r - cr)
        corner = ((np.abs(u) - (L / 2 - cr)) ** 2 + (np.abs(v) - (r - cr)) ** 2) <= cr ** 2
        inside = body | ends | corner
        n = np.clip(v / np.maximum(r, 1), -1, 1)
        shade = (0.55 + 0.55 * np.sqrt(np.clip(1 - n ** 2, 0, 1)) - 0.15 * n)[..., None]
        grooves = (1 - 0.06 * (np.sin(u / (S * 0.012)) > 0.6))[..., None]
        col = np.clip(np.array(base, np.float32) * shade * grooves, 0, 255)
        edge = np.clip((inside.astype(np.float32)), 0, 1) * 255
        im.alpha_composite(Image.fromarray(np.dstack([col, edge]).astype(np.uint8), "RGBA"))
    plug(S * 0.33, S * 0.52, -58, S * 0.50, S * 0.13, S * 0.11, (247, 150, 30))
    plug(S * 0.66, S * 0.50, -38, S * 0.50, S * 0.13, S * 0.11, (247, 150, 30))
    out = im.resize((size, size), Image.LANCZOS)
    sh = Image.new("RGBA", out.size); sh.putalpha(out.getchannel("A").point(lambda a: a * 0.25))
    base = Image.new("RGBA", out.size); base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)), (4, 8))
    base.alpha_composite(out); return base

X0, Y0, X1, Y1 = 680, 900, 1020, 1290
img = shadow_shape((X0, Y0, X1, Y1), 40, WHITE + (248,))
ep = earplug(220); img.alpha_composite(ep, ((X0 + X1 - ep.width) // 2, Y0 + 0))
f = font(40); t = "Custom earplugs"
ImageDraw.Draw(img).text(((X0 + X1 - f.getlength(t)) / 2, Y0 + 222), t, font=f, fill=PRI)
ImageDraw.Draw(img).rounded_rectangle((X0 + 40, Y0 + 280, X1 - 40, Y0 + 285), 3, fill=BLUE)
save("card_earplugs", img, (X0 - 30, Y0 - 20, X1 + 30, Y1 + 40))
for key, ch, lab, cx in (("badge_noise", "🔊", "Noise", 790), ("badge_water", "💧", "Water", 910)):
    r = 40; cy = Y0 + 336
    b = shadow_shape((cx - r, cy - r, cx + r, cy + r), r, PALE + (255,), blur=8, off=3, alpha=60)
    e = emoji(ch, 54); b.alpha_composite(e, (cx - e.width // 2, cy - e.height // 2))
    save(key, b, (cx - r - 12, cy - r - 10, cx + r + 12, cy + r + 20))

# ---------- lower third: Hala, Audiologist (slides in from the left) ----------
x0, y0 = 60, 1110
fn, fs = font(66), font(40, bold=False)
w = int(max(fn.getlength("Hala"), fs.getlength("Audiologist · Laser Vision"))) + 110
img = shadow_shape((x0, y0, x0 + w, y0 + 170), 30, WHITE + (248,))
d = ImageDraw.Draw(img)
d.rounded_rectangle((x0, y0, x0 + 16, y0 + 170), 8, fill=PRI)
d.text((x0 + 50, y0 + 20), "Hala", font=fn, fill=PRI)
d.text((x0 + 50, y0 + 100), "Audiologist · Laser Vision", font=fs, fill=BLUE)
save("lower_third", img, (x0 - 30, y0 - 20, x0 + w + 30, y0 + 210))

# ---------- LaserVision logo on the wall (composited BEHIND her) ----------
logo = Image.open(os.path.join(ROOT, "brand/laservision/logo-transparent.png")).convert("RGBA")
LW = 1000; logo = logo.resize((LW, round(LW * logo.height / logo.width)), Image.LANCZOS)
img = Image.new("RGBA", (W, H)); cx, cy = 540, 370
img.alpha_composite(logo, (cx - LW // 2, cy - logo.height // 2))
save("logo_wall", img, (cx - LW // 2, cy - logo.height // 2, cx + LW // 2, cy + logo.height // 2), check=False)

# ---------- LaserVision outro (white card, line, logo, WhatsApp) ----------
import cairosvg
svg = re.search(r'd="([^"]+)"', open(os.path.join(ROOT, "reels/src/components/WhatsAppIcon.tsx")).read()).group(1)
LOGO_W, ICON, GAP = 760, 64, 56
lg = Image.open(os.path.join(ROOT, "brand/laservision/logo-transparent.png")).convert("RGBA")
lg = lg.resize((LOGO_W, round(LOGO_W * lg.height / lg.width)), Image.LANCZOS)
total = 5 + GAP + lg.height + GAP + ICON
y_line = (H - total) // 2; y_logo = y_line + 5 + GAP; y_wa = y_logo + lg.height + GAP
img = Image.new("RGBA", (W, H)); ImageDraw.Draw(img).rectangle((330, y_line, 750, y_line + 5), fill=BLUE)
save("outro_line", img, (330, y_line, 750, y_line + 5))
img = Image.new("RGBA", (W, H)); img.alpha_composite(lg, ((W - LOGO_W) // 2, y_logo))
save("outro_logo", img, ((W - LOGO_W) // 2, y_logo, (W + LOGO_W) // 2, y_logo + lg.height))
icon = Image.open(io.BytesIO(cairosvg.svg2png(
    bytestring=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="{LV_PRIMARY}" d="{svg}"/></svg>'.encode(),
    output_width=ICON, output_height=ICON))).convert("RGBA")
fn = font(56, bold=False); num_w = sum(fn.getlength(ch) + 3 for ch in WHATSAPP)
row_w = ICON + 22 + num_w; x = (W - row_w) / 2
img = Image.new("RGBA", (W, H)); img.alpha_composite(icon, (int(x), y_wa))
d = ImageDraw.Draw(img); cx = x + ICON + 22
for ch in WHATSAPP:
    d.text((cx, y_wa + ICON / 2), ch, font=fn, fill=PRI, anchor="lm"); cx += fn.getlength(ch) + 3
save("outro_whatsapp", img, (int(x) - 10, y_wa - 10, int(x + row_w) + 10, y_wa + ICON + 10))

json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
print(len(manifest), "overlays:", ", ".join(manifest))
