#!/usr/bin/env python3
"""Phase 3: build edit/edit_plan.csv on the cut timeline (01_clean.mp4 time + appended recap/CTA tail).
Times are anchored to words, so re-running after a re-cut keeps everything in sync.
Card text follows exactly what she says (no added or changed advice).
"""
import csv
from common import J, clean_words, clean_tips, duration

words = clean_words(); tips = {t["tip"]: t for t in clean_tips()}
def at(word, after=0.0, end=False):
    w = next(w for w in words if w["word"].strip("،.") == word and w["start"] >= after - 1e-3)
    return round(w["end"] if end else w["start"], 2)
def line(a, b):
    return " ".join(w["word"] for w in words if a - 1e-3 <= w["start"] < b - 1e-3)

T = duration()
RECAP_START = round(T, 2)
RECAP_LINE = 0.55                          # each checklist line appears every 0.55 s
RECAP_END = round(RECAP_START + 7 * RECAP_LINE + 1.2, 2)
END = round(RECAP_END + 1.8, 2)            # CTA

COLS = ["start", "end", "spoken_line", "tip_number", "shot_type", "zoom_level", "overlay_text",
        "overlay_style", "animation", "sound_effect", "broll_needed"]
rows = []
def R(a, b, tip, shot, zoom, text="", style="", anim="", sfx="", broll=""):
    rows.append(dict(zip(COLS, [f"{a:.2f}", f"{b:.2f}", line(a, b), tip, shot, zoom, text, style, anim, sfx, broll])))

t1, t2, t3, t4, t5, t6, t7 = (tips[i] for i in range(1, 8))
# --- Hook / intro
R(0.00, 2.00, 0, "zoom", "1.00>1.12 fast", "Wearing contacts? Don't make these mistakes 👀", "hook", "scale_fade", "whoosh")
R(2.00, t1["start"], 0, "talking", "1.00", "", "", "", "")
# --- Tip 1 (do)
a = t1["start"]; b = at("ونشفونه")
R(a, at("بالمي"), 1, "zoom", "1.00>1.15 (always)", "Wash your hands with soap & water", "do", "whip_in, scale_fade", "whoosh+pop")
R(at("بالمي"), b, 1, "broll", "1.08", "Wash your hands with soap & water", "do", "", "", "broll_01")
R(b, t1["end"], 1, "talking", "1.00", "…and dry them well before putting your lenses in", "do", "text_swap", "")
# --- Tip 2 (don't) -- "never" emphasis
R(t2["start"], t2["end"], 2, "zoom", "1.00>1.15 (never)", "Don't sleep in your lenses", "dont", "whip_in, scale_fade, shake", "whoosh+buzzer", "broll_02")
# --- Tip 3 (don't)
R(t3["start"], at("بالمي", t3["start"]), 3, "talking", "1.05", "Don't wash your lenses with water", "dont", "whip_in, scale_fade, shake", "whoosh+buzzer")
R(at("بالمي", t3["start"]), t3["end"], 3, "broll", "1.10", "Don't wash your lenses with water", "dont", "", "", "broll_03")
# --- Tip 4 (do) -- "always" / "every time"
c = at("دايماً", t4["start"]); e = at("وكل"); f = at("كبوا"); g = at("وحطوا")
R(t4["start"], c, 4, "talking", "1.00", "Always use contact lens solution", "do", "whip_in, scale_fade", "whoosh+pop")
R(c, e, 4, "zoom", "1.00>1.15 (always)", "Always use contact lens solution", "do", "", "", "broll_04")
R(e, f, 4, "zoom", "1.00>1.12 (every time)", "Every time you take them out…", "do", "text_swap", "pop")
R(f, g, 4, "broll", "1.08", "…throw away the old solution", "do", "text_swap", "", "broll_05")
R(g, t4["end"], 4, "broll", "1.00", "…and add fresh solution", "do", "text_swap", "pop", "broll_06")
# --- Tip 5 (warning)
h = at("صاروا", t5["start"]); i = at("صار", t5["start"] + 1); k = at("شيلوا", t5["start"])
R(t5["start"], h, 5, "talking", "1.00", "Red, painful or blurry? Take your lenses out right away", "warning", "whip_in, scale_fade, pulse", "whoosh+pop")
R(h, i, 5, "broll", "1.10", "Red, painful or blurry? Take your lenses out right away", "warning", "pulse", "", "broll_07")
R(i, k, 5, "talking", "1.05", "Red, painful or blurry? Take your lenses out right away", "warning", "pulse, blur_to_sharp", "")
R(k, t5["end"], 5, "broll", "1.00", "Red, painful or blurry? Take your lenses out right away", "warning", "pulse", "", "broll_08")
# --- Tip 6 (doctor)
m = at("راجعوا")
R(t6["start"], m, 6, "broll", "1.00", "Problem doesn't go away? See your eye doctor", "doctor", "whip_in, scale_fade", "whoosh+pop", "broll_09")
R(m, t7["start"], 6, "zoom", "1.00>1.15 (doctor)", "Problem doesn't go away? See your eye doctor", "doctor", "", "")
# --- Tip 7 (do) -- "most important"
n = at("نضافة"); o = at("يعني")
R(t7["start"], n, 7, "zoom", "1.00>1.15 (most important)", "Most important: keep your lenses clean", "do", "whip_in, scale_fade", "whoosh+pop")
R(n, o, 7, "broll", "1.10", "Most important: keep your lenses clean", "do", "", "", "broll_10")
R(o, T, 7, "talking", "1.15>1.00", "Clean lenses = healthy eyes", "do", "text_swap", "pop")
# --- Recap (builds line by line) + CTA
for idx in range(7):
    a = RECAP_START + idx * RECAP_LINE
    b = a + RECAP_LINE if idx < 6 else RECAP_END
    R(round(a, 2), round(b, 2), "recap", "recap_bg", "1.00", f"recap line {idx+1}/7", "recap",
      "line_slide_in" if idx else "panel_scale_fade, line_slide_in", "whoosh" if idx == 0 else "pop")
R(RECAP_END, END, "cta", "recap_bg", "1.00", "Save this for later 👆", "recap", "scale_fade, bounce", "whoosh")

with open(J("edit_plan.csv"), "w", newline="") as fh:
    wr = csv.DictWriter(fh, fieldnames=COLS); wr.writeheader(); wr.writerows(rows)
gaps = [float(r["end"]) - float(r["start"]) for r in rows]
print(f"{len(rows)} rows, 0 -> {END}s; longest unchanged span {max(gaps):.2f}s")
for r in rows: print(r["start"], r["end"], r["tip_number"], r["shot_type"], r["zoom_level"], r["overlay_style"], r["broll_needed"], "|", r["overlay_text"])
