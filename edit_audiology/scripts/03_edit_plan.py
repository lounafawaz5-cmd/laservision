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
T = round(duration(), 2); OUTRO = 3.2; END = round(T + OUTRO, 2)

COLS = ["start", "end", "layer", "spoken_line", "asset", "overlay_text", "animation", "sound_effect", "notes"]
rows = []
def R(a, b, layer, asset="", text="", anim="", sfx="", notes=""):
    rows.append(dict(zip(COLS, [f"{a:.2f}", f"{b:.2f}", layer, line(a, b), asset, text, anim, sfx, notes])))

# --- LaserVision logo behind her: only the FIRST "Laser Vision"
lv = next(w["start"] for w in words if w["word"].endswith("Laser"))
R(lv, at("لنقدم"), "logo", "brand/laservision/logo-transparent.png", "", "pop_in, behind_subject",
  "ding", "her silhouette masks the logo (MediaPipe matte)")

# --- B-roll
R(at("لنقدم"), at("عنا", at("بالسمع")) - 0.25, "broll", "RIB_0139", notes="audiometer, wide; from 2.0 s")
import os as _os
if _os.path.exists(J("source", "RIB_2836.MP4")):   # tympanometer footage replaces the B-roll from "tympanometry"
    R(at("audiometry") - 0.05, at("tympanometry"), "broll", "RIB_0141", notes="audiometric headphones; from 4.0 s")
    R(at("tympanometry"), at("أجهزة"), "broll", "RIB_2836", notes="tympanometer, requested for 'tympanometry'; from 2.0 s")
else:
    R(at("audiometry") - 0.05, at("باستخدام"), "broll", "RIB_0141", notes="audiometric headphones; from 4.0 s")
R(at("أجهزة") if _os.path.exists(J("source", "RIB_2836.MP4")) else at("باستخدام"), at("سماعات") - 0.2,
  "broll", "RIB_0140", notes="audiometer screen; from 3.0 s")

# --- animated overlays (+ matching SFX). Clean titles, no notification-style boxes.
# rise = text rises in with an accent line drawing under it (soft whoosh); pop = scale-in with overshoot (pop)
R(at("السمع"), at("أساسي"), "overlay", "emoji:👂", "", "pop", "pop", "ear, right of her head; short")
R(at("A"), at("لنقدم"), "overlay", "title", "NEW|Audiology Department", "rise", "whoosh")
R(at("audiometry"), at("متطورة"), "overlay", "tag", "AUDIOMETRY", "pop", "pop")
R(at("tympanometry"), at("متطورة"), "overlay", "tag", "TYMPANOMETRY", "pop", "pop")
R(at("سماعات"), at("بالإضافة"), "overlay", "title", "|Hearing aids", "pop", "pop")
ep_end = at("هالا") - 0.12                       # earplugs leave before Hala's title comes in (no overlap)
R(at("Customized"), ep_end, "overlay", "earplug", "Custom earplugs", "pop", "pop")
R(at("الضجيج"), ep_end, "overlay", "emoji:🔊", "", "pop", "pop", "noise")
R(at("والماء"), ep_end, "overlay", "emoji:💧", "", "pop", "pop", "water")
R(at("هالا"), at("ولأن"), "overlay", "name", "Hala|Audiologist · Laser Vision", "rise", "whoosh")

# --- outro
R(T, END, "outro", "brand/references/laservision-endcard-claudia.png", "logo|WhatsApp +961 81 54 20 20|branches",
  "fade_up_stagger", "whoosh", "Claudia end card without the Arabic line")
rows.sort(key=lambda r: float(r["start"]))
with open(J("edit_plan.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=COLS); w.writeheader(); w.writerows(rows)
print(f"{len(rows)} rows, 0 -> {END}s")
for r in rows: print(r["start"], r["end"], r["layer"], r["asset"], r["overlay_text"], r["animation"], r["sound_effect"])
