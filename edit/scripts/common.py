"""Shared helpers: paths, source->clean time mapping, clean-timeline words and tips."""
import json, os
EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda *p: os.path.join(EDIT, *p)
ACCENT = "#00B4D8"
W, H, FPS = 1080, 1920, 30
SAFE_TOP, SAFE_BOTTOM = 250, 400          # app UI zones to keep clear

def segments():
    return json.load(open(J("segments.json")))

def to_clean(t, segs=None):
    """Map a source timestamp to the cut timeline (None if it was removed)."""
    for s in segs or segments():
        if s["src_start"] - 1e-3 <= t <= s["src_end"] + 1e-3:
            return round(t - s["src_start"] + s["out_start"], 3)
    return None

def clean_words():
    segs = segments(); out = []
    for w in json.load(open(J("transcript.json")))["words"]:
        a, b = to_clean(w["start"], segs), to_clean(w["end"], segs)
        if a is None and b is None: continue
        if a is None: a = next(s["out_start"] for s in segs if s["src_start"] >= w["start"])
        if b is None: b = max(s["out_end"] for s in segs if s["src_end"] <= w["end"])
        out.append({"word": w["word"], "start": a, "end": max(b, a + 0.08)})
    return out

def clean_tips():
    segs = segments(); out = []
    for t in json.load(open(J("tips.json"))):
        if t["tip"] < 0: continue
        a = to_clean(t["start"], segs) or next(s["out_start"] for s in segs if s["src_start"] >= t["start"])
        b = to_clean(t["end"], segs) or max(s["out_end"] for s in segs if s["src_end"] <= t["end"])
        out.append({**t, "start": a, "end": b})
    return out

def duration():
    return segments()[-1]["out_end"]

# ---- Video Editing Guide (brand/Video_Editing_Guide.pdf): one font for ALL on-screen text, glow per account ----
import glob as _glob
def _font(patterns, fallback):
    for p in patterns:
        hit = sorted(_glob.glob(os.path.join(os.path.dirname(EDIT), "brand", "fonts", "MontserratArabic", p)))
        if hit: return hit[0]
    return fallback
FONT_BOLD = _font(["*Bold.ttf", "*Bold.otf", "*bold*.ttf", "*bold*.otf"],
                  os.path.join(os.path.dirname(EDIT), "brand", "fonts", "Tajawal", "Tajawal-Bold.ttf"))
FONT_IS_GUIDE = "Montserrat" in os.path.basename(FONT_BOLD) or "montserrat" in FONT_BOLD.lower()
GLOW_COLOR = "#0C188D"          # ZEISS VISION CENTER glow (guide: intensity 30, range 58)
