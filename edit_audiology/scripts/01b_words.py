#!/usr/bin/env python3
"""Phase 1b: build the corrected word list for the edit (transcripts/words.json) and transcript.txt.
Sources: RIB_0124 4.3-37.9 s (prompted large-v3 pass) + RIB_0125 retake of the closing line (asked to repeat at 0:39).
Manual fixes are listed in FIXES; English terms stay in English (shown in CAPS in captions).
"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = lambda *p: os.path.join(ROOT, "transcripts", *p)

def words(path, a, b):
    r = json.load(open(path))
    return [{"word": w["word"].strip(), "start": round(w["start"], 2), "end": round(w["end"], 2)}
            for s in r["segments"] for w in s["words"] if a <= w["start"] < b]

main = words(T("RIB_0124_prompted.json"), 4.3, 32.40)
intro_self = words(T("RIB_0124.json"), 32.40, 37.84)          # unprompted pass kept "audiologist بLaser Vision" in English
retake = words(T("RIB_0125.json"), 1.6, 7.4)

FIXES = {"-temporometry": "tympanometry", "اوديولوجيست": "audiologist", "لأهتم": "لاهتم",
         "السماع": "السمع", "يبدأ": "ببلش", "هذا": "هيدا", "يجده": "بتلاقوه", "أحتياجات": "احتياجات"}
def fix(ws, src):
    out = []
    for w in ws:
        t = FIXES.get(w["word"], w["word"])
        if t.startswith("بLaser"): t = "بـ Laser"
        out.append({**w, "word": t, "src": src})
    return out
retake = [{**w, "word": "بـ"} if w["word"] == "في" else w for w in retake]   # she says "بـ Laser Vision"
ws = fix(main, "RIB_0124") + fix(intro_self, "RIB_0124") + fix(retake, "RIB_0125")
ws = [w for w in ws if w["word"] not in ("3", "2", "1", "3,", "2,", "1,")]
json.dump(ws, open(T("words.json"), "w"), ensure_ascii=False, indent=1)
with open(os.path.join(ROOT, "transcript.txt"), "w") as f:
    f.write("Transcript (Arabic as spoken). Source times. RIB_0125 = retake of the closing line.\n\n")
    cur = None
    for w in ws:
        if w["src"] != cur: cur = w["src"]; f.write(f"\n[{cur}]\n")
        f.write(w["word"] + (" " if not w["word"].endswith(("،", ".")) else "\n"))
print(open(os.path.join(ROOT, "transcript.txt")).read())
