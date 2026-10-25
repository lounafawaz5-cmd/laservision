#!/usr/bin/env python3
"""Phase 9: editor markers (EDL + CSV) from edit_plan.csv, and the post caption.
- markers_premiere.csv / markers.csv : name, in, out, duration, tip, shot, overlay, sfx, broll (00:00:00:00 start)
- markers.edl          : CMX3600 marker EDL, timeline start 00:00:00:00 (Premiere)
- markers_resolve.edl  : same, timeline start 01:00:00:00 (DaVinci Resolve default) with |C:|M:|D: marker notes
  Resolve: Timeline > right-click > Timelines > Import > Timeline Markers from EDL.
"""
import csv
from common import J, FPS

def tc(sec, base_h=0):
    f = int(round(sec * FPS)); h = base_h + f // (3600 * FPS); f %= 3600 * FPS
    return f"{h:02d}:{f // (60 * FPS):02d}:{f // FPS % 60:02d}:{f % FPS:02d}"
COLOR = {"hook": "ResolveColorPurple", "do": "ResolveColorGreen", "dont": "ResolveColorRed",
         "warning": "ResolveColorYellow", "doctor": "ResolveColorCyan", "outro": "ResolveColorBlue"}
rows = list(csv.DictReader(open(J("edit_plan.csv"))))

def name(r):
    t = r["tip_number"]
    lab = {"0": "Hook", "outro": "Outro (ZVC)"}.get(t, f"Tip {t}")
    return f"{lab} - {r['shot_type']}" + (f" [{r['broll_needed']}]" if r["broll_needed"] else "")

with open(J("markers.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["Marker Name", "In", "Out", "Duration", "Tip", "Shot", "Zoom", "Overlay", "Style", "Animation", "SFX", "B-roll", "Spoken (AR)"])
    for r in rows:
        a, b = float(r["start"]), float(r["end"])
        w.writerow([name(r), tc(a), tc(b), tc(b - a), r["tip_number"], r["shot_type"], r["zoom_level"], r["overlay_text"],
                    r["overlay_style"], r["animation"], r["sound_effect"], r["broll_needed"], r["spoken_line"]])

for fn, base in (("markers.edl", 0), ("markers_resolve.edl", 1)):
    L = ["TITLE: contact_lens_tips_markers", "FCM: NON-DROP FRAME", ""]
    for i, r in enumerate(rows, 1):
        a, b = float(r["start"]), float(r["end"]); d = max(1, int(round((b - a) * FPS)))
        L.append(f"{i:03d}  001      V     C        {tc(a, base)} {tc(a + 1 / FPS, base)} {tc(a, base)} {tc(a + 1 / FPS, base)}  ")
        note = r["overlay_text"].replace("|", "/") or r["shot_type"]
        L.append(f" |C:{COLOR.get(r['overlay_style'], 'ResolveColorSand')} |M:{name(r)}: {note} |D:{d}")
        L.append("")
    open(J(fn), "w").write("\n".join(L))

open(J("post_caption.md"), "w").write("""# Post caption (ZEISS Vision Center)

Wearing soft contact lenses? Save these 7 habits 👇

✅ Wash and dry your hands well before touching your lenses
❌ Don't sleep in your lenses
❌ Don't wash your lenses with water
✅ Always use contact lens solution: every time you take your lenses out, throw away the old solution and put in fresh
⚠️ Red, painful or blurry eyes? Take your lenses out right away
🩺 If the problem doesn't go away, see your eye doctor
✅ Clean lenses = healthy eyes

Questions about your lenses? WhatsApp us: +961 81 47 20 20
ZEISS Vision Center by Laser Vision, Hazmieh

#ContactLenses #EyeCare #ZEISSVisionCenter #Hazmieh #Lebanon
""")

print("wrote markers.csv, markers.edl, markers_resolve.edl, post_caption.md")
