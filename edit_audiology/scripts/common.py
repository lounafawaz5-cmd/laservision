"""Shared helpers for the audiology reel: paths, multi-source time mapping, clean-timeline words."""
import json, os
EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda *p: os.path.join(EDIT, *p)
W, H, FPS = 1080, 1920, 30
SAFE_TOP, SAFE_BOTTOM = 250, 400
LV_PRIMARY, LV_DARK, LV_LIGHT, LV_BLUE, LV_PALE = "#005D83", "#00303F", "#F1F2F2", "#30A4BF", "#B6DFE5"
WHATSAPP = "+961 81 54 20 20"            # LaserVision CTA (strategy/SUMMARY.md)

def segments():
    return json.load(open(J("segments.json")))

def to_clean(t, src, segs=None):
    for s in segs or segments():
        if s["src"] == src and s["src_start"] - 1e-3 <= t <= s["src_end"] + 1e-3:
            return round(t - s["src_start"] + s["out_start"], 3)
    return None

def clean_words():
    segs = segments(); out = []
    for w in json.load(open(J("transcripts", "words.json"))):
        a, b = to_clean(w["start"], w["src"], segs), to_clean(w["end"], w["src"], segs)
        if a is None and b is None: continue
        if a is None:
            a = min(s["out_start"] for s in segs if s["src"] == w["src"] and s["src_start"] >= w["start"])
        if b is None:
            b = max(s["out_end"] for s in segs if s["src"] == w["src"] and s["src_end"] <= w["end"])
        out.append({"word": w["word"], "start": a, "end": max(b, a + 0.08)})
    return out

def duration():
    return segments()[-1]["out_end"]
