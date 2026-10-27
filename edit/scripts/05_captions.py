#!/usr/bin/env python3
"""Phase 5: edit/captions.ass from word timestamps (Lebanese Arabic, English terms in CAPS).
Caption style = brand/Video_Editing_Guide.pdf: Montserrat Arabic Bold, white, word-by-word fade,
glow in the account colour (GLOW_COLOR in common.py; intensity 30 / range 58 approximated with a blurred border).
Max 4 words per line, bottom-centre above the 400 px safe zone. English terms in CAPS (REEL_STYLE.md).
"""
from common import J, W, H, clean_words, duration, FONT_BOLD, FONT_IS_GUIDE, GLOW_COLOR

MAXW, MARGIN_V, SIZE = 4, 440, 86
import shutil as _sh
from PIL import ImageFont as _IF
_sh.copy(FONT_BOLD, J("fonts", __import__("os").path.basename(FONT_BOLD)))
FONT = _IF.truetype(FONT_BOLD, 10).getname()[0]      # guide: Montserrat Arabic Bold for all on-screen text
if not FONT_IS_GUIDE: print("WARNING: Montserrat Arabic not found in brand/fonts/MontserratArabic - using", FONT)
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
_tf = ImageFont.truetype(FONT_BOLD, SIZE)
_tl = ImageFont.truetype(FONT_BOLD, LATIN_SIZE)
def _w(text):
    return sum((_tl if x.isascii() else _tf).getlength(x + " ") for x in text.split())
MAX_PX = 920
caps_text = lambda w: " ".join(x.upper() if x.isascii() else x for x in w["word"].rstrip("،.").split())
fits = lambda ln: _w(" ".join(caps_text(t) for t in ln)) <= MAX_PX
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

# Your corrections: if edit/captions_corrected.srt exists, its text replaces the transcript text line by line
# (same line order as captions.srt). Same word count -> words swapped one-for-one, keeping each word's timing.
import os, re as _re
CORR = J("captions_corrected.srt")
if os.path.exists(CORR):
    blocks = [b for b in _re.split(r"\n\s*\n", open(CORR, encoding="utf-8-sig").read().strip()) if b.strip()]
    texts = [" ".join(b.strip().splitlines()[2:]).strip() for b in blocks]
    # line breaks come from YOUR file (its start times), so a font or layout change never misaligns corrections
    def _sec(x):
        h, m, r = x.strip().split(":"); sec, ms = r.split(","); return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000
    starts = [_sec(b.strip().splitlines()[1].split("-->")[0]) for b in blocks]
    toks_all = [t for ln in lines for t in ln]
    lines = []
    for i, st in enumerate(starts):
        en = starts[i + 1] if i + 1 < len(starts) else 1e9
        grp = [t for t in toks_all if st - 0.05 <= t["start"] < en - 0.05]
        if grp: lines.append(grp)
    assert len(texts) == len(lines), f"captions_corrected.srt has {len(texts)} lines, matched {len(lines)}"
    for ln, txt in zip(lines, texts):
        old_words = " ".join(t["word"].rstrip("،.") for t in ln).split()
        new_words = txt.split()
        if len(new_words) == len(old_words):
            it = iter(new_words)
            for t in ln:
                t["word"] = " ".join(next(it) for _ in t["word"].rstrip("،.").split())
        else:   # different word count: whole corrected line appears with the line's first word
            ln[0]["word"] = txt; del ln[1:]
    print("applied", CORR)

GLOW_BORD, GLOW_BLUR, GLOW_ALPHA = 7, 14, "40"   # ~ CapCut glow intensity 30, range 58
acc = ass_color(LV_BLUE) + "&"
head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{FONT},{SIZE},&H00FFFFFF,&H00FFFFFF,&H00000000,&HFF000000,-1,0,0,0,100,100,0,0,1,0,0,2,60,60,{MARGIN_V},-1
Style: Glow,{FONT},{SIZE},&HFF000000,&HFF000000,{ass_color(GLOW_COLOR, "00")},&HFF000000,-1,0,0,0,100,100,0,0,1,{GLOW_BORD},0,2,60,60,{MARGIN_V},-1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev = []
for n, ln in enumerate(lines):
    a = ln[0]["start"]
    nxt = lines[n + 1][0]["start"] if n + 1 < len(lines) else ln[-1]["end"] + 0.4
    b = min(ln[-1]["end"] + 0.35, nxt, duration() - 0.05)   # never run into the recap
    parts, glows = [], []
    for t in ln:
        rel = int((t["start"] - a) * 1000)
        txt = t["word"].rstrip("،.")
        shown = " ".join("{\\fs%d}%s{\\fs%d}" % (LATIN_SIZE, x.upper(), SIZE) if x.isascii() else x
                         for x in txt.split())    # English terms in CAPS, a touch smaller
        parts.append("{" + f"\\alpha&HFF&\\t({rel},{rel+120},\\1a&H00&)" + "}" + shown)
        glows.append("{" + f"\\alpha&HFF&\\t({rel},{rel+120},\\3a&H{GLOW_ALPHA}&)" + "}" + shown)
    ev.append(f"Dialogue: 0,{ts(a)},{ts(b)},Glow,,0,0,0,,{{\\an2\\blur{GLOW_BLUR}}}" + " ".join(glows))
    ev.append(f"Dialogue: 1,{ts(a)},{ts(b)},Cap,,0,0,0,,{{\\an2}}" + " ".join(parts))
open(J("captions.ass"), "w", encoding="utf-8").write(head + "\n".join(ev) + "\n")

# Editable copy: captions.srt (same lines and timings, plain text) to fix in CapCut / Premiere / DaVinci
# and lay over final_no_captions.mp4. Highlight colours are not part of SRT.
def srt_ts(t):
    ms = int(round(max(0, t) * 1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"
srt = []
for n, ln in enumerate(lines):
    a = ln[0]["start"]; nxt = lines[n + 1][0]["start"] if n + 1 < len(lines) else ln[-1]["end"] + 0.4
    b = min(ln[-1]["end"] + 0.35, nxt, duration() - 0.05)
    text = " ".join(caps_text(t) for t in ln)
    srt.append(f"{n+1}\n{srt_ts(a)} --> {srt_ts(b)}\n{text}\n")
open(J("captions.srt"), "w", encoding="utf-8-sig").write("\n".join(srt))
print(len(ev), "caption lines")
for ln in lines: print(f"{ln[0]['start']:5.2f}", " ".join(t["word"] for t in ln))
