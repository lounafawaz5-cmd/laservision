#!/usr/bin/env python3
"""Phase 3: edit_plan.csv for the audiology reel (clean-timeline seconds, word-anchored).
Layers: broll (RIB_0139/0140/0141), overlay (animated graphic + matching SFX: pop-in -> pop, slide-in -> whoosh),
logo (LaserVision logo on the wall BEHIND her, masked by her silhouette, + ding, each time she says "Laser Vision"),
outro (LaserVision end card + WhatsApp). No zooms.
"""
import csv
from common import J, clean_words, duration

words = clean_words()
def at(word, after=0.0, end=False):
    w = next(w for w in words if w["word"].strip("،.") == word and w["start"] >= after - 1e-3)
    return round(w["end"] if end else w["start"], 2)
def line(a, b):
    return " ".join(w["word"] for w in words if a - 1e-3 <= w["start"] < b - 1e-3)
T = round(duration(), 2); OUTRO = 2.6; END = round(T + OUTRO, 2)

COLS = ["start", "end", "layer", "spoken_line", "asset", "overlay_text", "animation", "sound_effect", "notes"]
rows = []
def R(a, b, layer, asset="", text="", anim="", sfx="", notes=""):
    rows.append(dict(zip(COLS, [f"{a:.2f}", f"{b:.2f}", layer, line(a, b), asset, text, anim, sfx, notes])))

# --- LaserVision logo behind her, each "Laser Vision"
lv = [w["start"] for w in words if w["word"].endswith("Laser")]
nxt = [at("لنقدم"), at("ولأن"), T]
for i, (a, b) in enumerate(zip(lv, nxt)):
    R(a, b if i < 2 else T, "logo", "brand/laservision/logo-transparent.png", "", "pop_in, behind_subject",
      "ding", "her silhouette masks the logo (MediaPipe matte)")

# --- B-roll
R(at("لنقدم"), at("عنا", at("بالسمع")) - 0.25, "broll", "RIB_0139", notes="audiometer, wide; from 2.0 s")
R(at("audiometry") - 0.05, at("باستخدام"), "broll", "RIB_0141", notes="audiometric headphones; from 4.0 s")
R(at("باستخدام"), at("سماعات") - 0.2, "broll", "RIB_0140", notes="audiometer screen; from 3.0 s")

# --- animated overlays (+ matching SFX)
R(at("السمع"), at("نحن"), "overlay", "emoji:👂", "", "pop", "pop", "ear, right of her head")
R(at("A"), at("لنقدم"), "overlay", "card", "NEW|Audiology Department", "slide_left", "whoosh")
R(at("audiometry"), at("متطورة"), "overlay", "pill", "AUDIOMETRY", "slide_right", "whoosh")
R(at("tympanometry"), at("متطورة"), "overlay", "pill", "TYMPANOMETRY", "slide_right", "whoosh")
R(at("سماعات"), at("بالإضافة"), "overlay", "card", "🦻|Hearing aids", "pop", "pop")
R(at("Customized"), at("audiologist"), "overlay", "earplug", "Custom earplugs", "slide_right", "whoosh")
R(at("الضجيج"), at("audiologist"), "overlay", "emoji:🔊", "", "pop", "pop", "noise")
R(at("والماء"), at("audiologist"), "overlay", "emoji:💧", "", "pop", "pop", "water")
R(at("أنا"), at("ولأن"), "overlay", "lower_third", "Hala|Audiologist", "slide_left", "whoosh")

# --- outro
R(T, END, "outro", "brand/laservision/logo-transparent.png", f"WhatsApp", "fade_up_stagger", "whoosh")
rows.sort(key=lambda r: float(r["start"]))
with open(J("edit_plan.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=COLS); w.writeheader(); w.writerows(rows)
print(f"{len(rows)} rows, 0 -> {END}s")
for r in rows: print(r["start"], r["end"], r["layer"], r["asset"], r["overlay_text"], r["animation"], r["sound_effect"])
