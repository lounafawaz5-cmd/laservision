#!/usr/bin/env python3
"""Phase 5: edit/captions.ass from word timestamps (Lebanese Arabic, English terms kept in English).
- max 4 words per line, breaks at Arabic commas; "ال" is glued to the next (English) word
- bold white, black outline, bottom-center above the 400px bottom safe zone
- key words in the accent colour; each word pops in (scale 75%->100% + fade) as it is spoken
"""
from common import J, ACCENT, W, H, clean_words, duration

MAXW, MARGIN_V, SIZE = 4, 440, 100
LATIN_FONT, LATIN_SIZE = "Outfit", 80   # English terms; render with ass=...:fontsdir=brand/fonts/Outfit
FONT = "Noto Sans Arabic"
# soap, water, never/don't, sleep, solution, every time, red, hurts, blurry, doctor, hygienic/cleanliness
KEY = {"والصابون", "بالمي", "ما تناموا", "تناموا", "solution", "وكل", "مرة", "حمر", "وجعوك",
       "blurry", "vision", "حكيم", "العيون", "نضافة"}
GLUE_AFTER = ("ال", "soft", "contact", "lens", "blurry")   # keep phrases like "contact lenses" whole

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
lines = []
for ph in phrases:
    k = -(-len(ph) // MAXW); size = -(-len(ph) // k)
    lines += [ph[i:i + size] for i in range(0, len(ph), size)]

acc = ass_color(ACCENT)
head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{FONT},{SIZE},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,2,60,60,{MARGIN_V},-1

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
        col += f"\\fn{LATIN_FONT}\\fs{LATIN_SIZE}" if txt.isascii() or "ال " in txt and txt.split()[-1].isascii() else f"\\fn{FONT}\\fs{SIZE}"
        parts.append("{" + f"{col}\\alpha&HFF&\\fscx75\\fscy75\\t({rel},{rel+60},\\alpha&H00&)"
                     f"\\t({rel},{rel+140},\\fscx108\\fscy108)\\t({rel+140},{rel+220},\\fscx100\\fscy100)" + "}" + txt)
    ev.append(f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{{\\an2}}" + " ".join(parts))
open(J("captions.ass"), "w", encoding="utf-8").write(head + "\n".join(ev) + "\n")
print(len(ev), "caption lines")
for ln in lines: print(f"{ln[0]['start']:5.2f}", " ".join(t["word"] for t in ln))
