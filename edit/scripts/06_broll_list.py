#!/usr/bin/env python3
"""Phase 6: write edit/broll_list.md from edit_plan.csv and report which slots are filled.
Drop clips into edit/broll/ named by slot (broll_01.mp4 ...). Empty slots fall back to the
talking shot with an extra slow zoom in the assembler (07_assemble.py).
"""
import csv, os
from common import J

SHOTS = {
 "broll_01": ("Close-up of hands lathering soap under a tap, then drying them with a clean towel.",
              ["washing hands soap close up", "hand washing lather", "drying hands towel"]),
 "broll_02": ("Someone asleep in bed, soft morning light (bedside table, lens case visible is a bonus).",
              ["woman sleeping bed", "sleeping close up face", "bedroom night sleep"]),
 "broll_03": ("Running tap water close-up; a lens case near the sink (do NOT show lenses being rinsed as if correct).",
              ["running tap water close up", "faucet water flow", "bathroom sink tap"]),
 "broll_04": ("Contact lens solution bottle being picked up / held to camera, label turned away or neutral.",
              ["contact lens solution", "contact lens care", "lens solution bottle"]),
 "broll_05": ("Emptying old solution from a lens case into the sink.",
              ["contact lens case", "emptying lens case", "contact lens cleaning"]),
 "broll_06": ("Filling a clean lens case with fresh solution, slow and close.",
              ["pouring contact lens solution", "contact lens case solution", "contact lens storage"]),
 "broll_07": ("Macro of a red, irritated eye (or someone rubbing a sore eye).",
              ["red eye irritation", "eye irritation close up", "rubbing eyes"]),
 "broll_08": ("Clean fingertip removing a soft contact lens from the eye, in a mirror.",
              ["removing contact lens", "contact lens finger", "taking out contact lenses"]),
 "broll_09": ("Eye exam: patient reading a letter chart, or doctor at the slit lamp in the clinic.",
              ["eye exam chart", "optometrist eye exam", "ophthalmologist slit lamp"]),
 "broll_10": ("A clean, closed lens case and solution neatly placed on a bright shelf.",
              ["clean contact lens case", "contact lenses flat lay", "eye care products"]),
}
rows = [r for r in csv.DictReader(open(J("edit_plan.csv"))) if r["broll_needed"]]
os.makedirs(J("broll"), exist_ok=True)
L = ["# B-roll list", "",
     "Times are in the **final edit** (`final.mp4`). Film vertical 9:16 (1080x1920), 30 fps or more, steady, bright and clean.",
     "Save each clip as `edit/broll/<slot>.mp4` (e.g. `broll_03.mp4`), then re-run `scripts/run_all.sh`.",
     "A clip at least as long as the slot is enough; the assembler trims it, scales it to fill 9:16 and adds a slow push-in.",
     "Empty slots stay on the talking shot with an extra zoom.", "",
     "| Slot | Time | Dur | Tip | Spoken (AR) | What to film | Stock keywords (Pexels / Pixabay) | Status |",
     "|---|---|---|---|---|---|---|---|"]
missing = []
for r in rows:
    sid = r["broll_needed"]; a, b = float(r["start"]), float(r["end"])
    desc, kw = SHOTS[sid]
    have = any(os.path.exists(J("broll", sid + e)) for e in (".mp4", ".mov", ".MP4", ".MOV"))
    if not have: missing.append(sid)
    L.append(f"| {sid} | {a:.2f}–{b:.2f}s | {b-a:.1f}s | {r['tip_number']} | {r['spoken_line']} | {desc} | "
             + ", ".join(f"`{k}`" for k in kw) + f" | {'✅ in folder' if have else '⬜ missing'} |")
L += ["", "Note: tip 5's blurry-vision moment uses a blur-to-sharp effect on the talking shot, so no blurry POV clip is needed.",
      "If you want one anyway, it can replace the effect (keywords: `blurry vision pov`, `out of focus city`, `defocused lights`)."]
open(J("broll_list.md"), "w").write("\n".join(L) + "\n")
print(f"{len(rows)} slots, missing: {', '.join(missing) or 'none'}")
