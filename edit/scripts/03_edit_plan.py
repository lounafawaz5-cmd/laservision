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
OUTRO = 2.6                                # ZVC end card (same layout as the Monogram reel)
END = round(T + OUTRO, 2)

COLS = ["start", "end", "spoken_line", "tip_number", "shot_type", "zoom_level", "overlay_text",
        "overlay_style", "animation", "sound_effect", "broll_needed"]
rows = []
def R(a, b, tip, shot, zoom, text="", style="", anim="", sfx="", broll=""):
    rows.append(dict(zip(COLS, [f"{a:.2f}", f"{b:.2f}", line(a, b), tip, shot, zoom, text, style, anim, sfx, broll])))

t1, t2, t3, t4, t5, t6, t7 = (tips[i] for i in range(1, 8))
# --- Hook / intro
R(0.00, 2.00, 0, "zoom", "1.00>1.06 slow", "Wearing contacts? Don't make these mistakes 👀", "hook", "scale_fade", "whoosh")
R(2.00, t1["start"], 0, "talking", "1.06", "", "", "", "")
# --- Tip 1 (do)
a = t1["start"]; b = at("ونشفونه")
R(a, at("بالمي"), 1, "zoom", "1.00", "Wash your hands with soap & water", "do", "mix_in, scale_fade", "whoosh+pop")
R(at("بالمي"), b, 1, "broll", "1.00", "Wash your hands with soap & water", "do", "", "", "broll_01")
R(b, t1["end"], 1, "talking", "1.00", "…and dry them well before putting your lenses in", "do", "text_swap", "")
# --- Tip 2 (don't) -- "never" emphasis
R(t2["start"], t2["end"], 2, "zoom", "1.00", "Don't sleep in your lenses", "dont", "mix_in, scale_fade, shake", "whoosh+pop", "broll_02")
# --- Tip 3 (don't)
R(t3["start"], at("بالمي", t3["start"]), 3, "talking", "1.00", "Don't wash your lenses with water", "dont", "mix_in, scale_fade, shake", "whoosh+pop")
R(at("بالمي", t3["start"]), t3["end"], 3, "broll", "1.00", "Don't wash your lenses with water", "dont", "", "", "broll_03")
# --- Tip 4 (do) -- "always" / "every time"
c = at("دايماً", t4["start"]); e = at("وكل"); f = at("كبوا"); g = at("وحطوا")
R(t4["start"], c, 4, "talking", "1.00", "Always use contact lens solution", "do", "mix_in, scale_fade", "whoosh+pop")
R(c, e, 4, "zoom", "1.00", "Always use contact lens solution", "do", "", "", "broll_04")
R(e, f, 4, "zoom", "1.00", "Every time you take them out…", "do", "text_swap", "pop")
R(f, g, 4, "broll", "1.00", "…throw away the old solution", "do", "text_swap", "", "broll_05")
R(g, t4["end"], 4, "broll", "1.00", "…and add fresh solution", "do", "text_swap", "pop", "broll_06")
# --- Tip 5 (warning)
h = at("صاروا", t5["start"]); i = at("صار", t5["start"] + 1); k = at("شيلوا", t5["start"])
R(t5["start"], h, 5, "talking", "1.00", "Red, painful or blurry? Take your lenses out right away", "warning", "mix_in, scale_fade, pulse", "whoosh+pop")
R(h, i, 5, "broll", "1.00", "Red, painful or blurry? Take your lenses out right away", "warning", "pulse", "", "broll_07")
R(i, k, 5, "talking", "1.00", "Red, painful or blurry? Take your lenses out right away", "warning", "pulse, blur_to_sharp", "")
R(k, t5["end"], 5, "broll", "1.00", "Red, painful or blurry? Take your lenses out right away", "warning", "pulse", "", "broll_08")
# --- Tip 6 (doctor)
m = at("راجعوا")
R(t6["start"], m, 6, "broll", "1.00", "Problem doesn't go away? See your eye doctor", "doctor", "mix_in, scale_fade", "whoosh+pop", "broll_09")
R(m, t7["start"], 6, "zoom", "1.00>1.08 slow (doctor)", "Problem doesn't go away? See your eye doctor", "doctor", "", "")
# --- Tip 7 (do) -- "most important"
n = at("نضافة"); o = at("يعني")
R(t7["start"], n, 7, "zoom", "1.08", "Most important: keep your lenses clean", "do", "mix_in, scale_fade", "whoosh+pop")
R(n, o, 7, "broll", "1.08", "Most important: keep your lenses clean", "do", "", "", "broll_10")
R(o, T, 7, "talking", "1.08", "Clean lenses = healthy eyes", "do", "text_swap", "pop")
# --- ZVC outro: wordmark + WhatsApp
R(T, END, "outro", "outro", "1.00", "ZEISS Vision Center by Laser Vision | WhatsApp +961 81 47 20 20", "outro",
  "line_draw, logo_fade_up, whatsapp_fade (staggered 0.33 s)", "whoosh")

for r in rows:   # rows without a zoom move are plain talking shots
    if r["shot_type"] == "zoom" and ">" not in r["zoom_level"]: r["shot_type"] = "talking"
with open(J("edit_plan.csv"), "w", newline="") as fh:
    wr = csv.DictWriter(fh, fieldnames=COLS); wr.writeheader(); wr.writerows(rows)
gaps = [float(r["end"]) - float(r["start"]) for r in rows]
print(f"{len(rows)} rows, 0 -> {END}s; longest unchanged span {max(gaps):.2f}s")
for r in rows: print(r["start"], r["end"], r["tip_number"], r["shot_type"], r["zoom_level"], r["overlay_style"], r["broll_needed"], "|", r["overlay_text"])
