#!/usr/bin/env python3
"""Phase 5: edit/captions.ass from word timestamps (Lebanese Arabic, English terms in CAPS).
House caption style (reels/src/components/Captions.tsx "clean" + references/laservision/REEL_STYLE.md):
- Tajawal ExtraBold, white, no box, soft dark shadow (LaserVision navy #00303F), quick fade-in per word
- key words in LaserVision blue #30A4BF; max 4 words per line; bottom-center above the 400px safe zone
Render with ass=captions.ass:fontsdir=edit/fonts (Tajawal + Outfit).
"""
from common import J, ACCENT, W, H, clean_words, duration

MAXW, MARGIN_V, SIZE = 4, 440, 86
FONT = "Tajawal"                 # Arabic and the CAPS English terms share one font
LATIN_SIZE = 72                  # CAPS English terms look balanced next to Arabic at this size
LV_BLUE, LV_NAVY = "#30A4BF", "#00303F"   # brand/laservision/GUIDELINES.md
# soap, water, never/don't, sleep, solution, every time, red, hurts, blurry, doctor, hygienic/cleanliness
KEY = {"والصابون", "بالمي", "ما تناموا", "تناموا", "solution", "وكل", "مرة", "حمر", "وجعوك",
       "blurry", "vision", "حكيم", "العيون", "نضافة"}
GLUE_AFTER = ("ال", "soft", "contact", "blurry")   # keep phrases like "contact lenses" whole

def ass_color(hexs, a="00"):
    r, g, b = hexs[1:3], hexs[3:5], hexs[5:7]; return f"&H{a}{b}{g}{r}".upper()

def ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"

# tokens: glue "ال" to the following word
words, toks = clean_words(), []
for w in words:
    if toks and toks[-1]["word"].split()[-1] in GLUE_AFTER:
        toks[-1] = {"word": toks[-1]["word"] + " " + w["word"], "start": toks[-1]["start"], "end": w["end"]}
    else:
        toks.append(dict(w))
# chunk at commas / pauses, then split each phrase evenly into lines of <= MAXW tokens
phrases, cur = [], []
for i, t in enumerate(toks):
    cur.append(t)
    gap = toks[i + 1]["start"] - t["end"] if i + 1 < len(toks) else 9
    if t["word"].endswith(("،", ".")) or gap > 0.35:
        phrases.append(cur); cur = []
if cur: phrases.append(cur)
# a line must also fit the frame: measure it in Tajawal (CAPS English is wide) and split further if needed
import itertools
from PIL import ImageFont
_tf = ImageFont.truetype(J("fonts", "Tajawal-ExtraBold.ttf"), SIZE)
_tl = ImageFont.truetype(J("fonts", "Tajawal-ExtraBold.ttf"), LATIN_SIZE)
def _w(text):
    return sum((_tl if x.isascii() else _tf).getlength(x + " ") for x in text.split())
MAX_PX = 920
shown = lambda w: " ".join(x.upper() if x.isascii() else x for x in w["word"].rstrip("،.").split())
fits = lambda ln: _w(" ".join(shown(t) for t in ln)) <= MAX_PX
lines = []
for ph in phrases:
    # fewest lines that fit; then the most even split with that many lines
    best = None
    for k in range(1, len(ph) + 1):
        cands = []
        for cuts in itertools.combinations(range(1, len(ph)), k - 1):
            idx = (0,) + cuts + (len(ph),)
            parts = [ph[idx[j]:idx[j + 1]] for j in range(k)]
            if all(len(x) <= MAXW and fits(x) for x in parts):
                cands.append(parts)
        if cands:
            best = min(cands, key=lambda ps: (max(len(x) for x in ps) - min(len(x) for x in ps), -len(ps[0]))); break
    lines += best or [[t] for t in ph]

acc = ass_color(LV_BLUE) + "&"
head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{FONT},{SIZE},&H00FFFFFF,&H00FFFFFF,{ass_color(LV_NAVY, "20")},{ass_color(LV_NAVY, "70")},800,0,0,0,100,100,0,0,1,3,3,2,60,60,{MARGIN_V},-1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev = []
for n, ln in enumerate(lines):
    a = ln[0]["start"]
    nxt = lines[n + 1][0]["start"] if n + 1 < len(lines) else ln[-1]["end"] + 0.4
    b = min(ln[-1]["end"] + 0.35, nxt, duration() - 0.05)   # never run into the recap
    parts = []
    for t in ln:
        rel = int((t["start"] - a) * 1000)
        txt = t["word"].rstrip("،.")
        nxt_w = ln[ln.index(t) + 1]["word"] if t is not ln[-1] else ""
        is_key = any(k in KEY for k in txt.split()) or (txt == "ما" and nxt_w.startswith("تناموا"))
        col = f"\\1c{acc}" if is_key else "\\1c&H00FFFFFF&"
        shown = " ".join("{\\fs%d}%s{\\fs%d}" % (LATIN_SIZE, x.upper(), SIZE) if x.isascii() else x
                         for x in txt.split())    # English terms in CAPS, a touch smaller
        parts.append("{" + f"{col}\\alpha&HFF&\\t({rel},{rel+120},\\1a&H00&\\3a&H20&\\4a&H70&)" + "}" + shown)
    ev.append(f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{{\\an2\\blur3}}" + " ".join(parts))
open(J("captions.ass"), "w", encoding="utf-8").write(head + "\n".join(ev) + "\n")
print(len(ev), "caption lines")
for ln in lines: print(f"{ln[0]['start']:5.2f}", " ".join(t["word"] for t in ln))
