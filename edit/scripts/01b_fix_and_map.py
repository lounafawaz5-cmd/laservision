#!/usr/bin/env python3
"""Phase 1b: apply manual transcript corrections and map the 7 tips.
Reads transcript.json (raw Whisper output; copied to transcript_raw.json once),
writes the corrected transcript.json (adds a flat "words" list), transcript.txt and tips.json.
"""
import json, os, shutil
EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda *p: os.path.join(EDIT, *p)
if not os.path.exists(J("transcript_raw.json")):
    shutil.copy(J("transcript.json"), J("transcript_raw.json"))
raw = json.load(open(J("transcript_raw.json")))

words = [{"word": w["word"].strip(), "start": round(w["start"], 2), "end": round(w["end"], 2)}
         for s in raw["segments"] for w in s["words"]]

# Correction: Whisper misheard 29.1-30.5 ("راجعوا حتى تشيلوا ال contact lenses").
# A focused re-pass on 27.4-30.6 gives "راجعوا حكيم العيون" (see your eye doctor).
i = next(k for k, w in enumerate(words) if w["word"] == "راجعوا")
j = next(k for k, w in enumerate(words) if w["word"] == "و" and w["start"] >= 30.0)
words[i:j] = [{"word": "راجعوا", "start": 29.00, "end": 29.72},
              {"word": "حكيم", "start": 29.72, "end": 30.14},
              {"word": "العيون.", "start": 30.14, "end": 30.46}]
# "و أهم" starts after the doctor line
for w in words:
    if w["word"] == "و" and w["start"] >= 30.0:
        w["start"], w["end"] = 30.60, 30.72

# English gloss per word (used for captions in English mode / editor notes)
TIPS = [
  # n, start, end, english summary (as spoken, no added advice)
  (0, 1.18, 5.18, "Intro: if you wear soft contact lenses, here are some important tips"),
  (1, 5.18, 10.60, "Always wash your hands with soap and water and dry them well before putting in your lenses"),
  (2, 10.60, 11.96, "Don't sleep in them"),
  (3, 11.96, 13.56, "Don't wash them with water"),
  (4, 13.56, 21.66, "Always use contact lens solution; every time you take your lenses out, throw away the old solution and put in fresh solution"),
  (5, 21.66, 27.52, "If your eyes turn red, hurt, or you get blurry vision, take the lenses out right away"),
  (6, 27.52, 30.46, "If the problem doesn't go away, see your eye doctor"),
  (7, 30.60, 33.86, "Most important: clean lenses mean healthy eyes"),
  (-1, 33.86, 37.56, "Outtake (off-camera 'okay', she stands up) - cut"),
]
tips = []
for n, a, b, en in TIPS:
    ar = " ".join(w["word"] for w in words if a <= w["start"] < b)
    tips.append({"tip": n, "start": a, "end": b, "arabic": ar, "english": en})

out = dict(raw); out["words"] = words; out["corrections"] = ["29.0-30.46 -> راجعوا حكيم العيون"]
json.dump(out, open(J("transcript.json"), "w"), indent=1, ensure_ascii=False)
json.dump(tips, open(J("tips.json"), "w"), indent=1, ensure_ascii=False)
with open(J("transcript.txt"), "w") as f:
    f.write(f"Language: {raw['language']} (Lebanese Arabic). Times in seconds of the source file.\n\n")
    for t in tips:
        label = {0: "INTRO", -1: "OUTTAKE"}.get(t["tip"], f"TIP {t['tip']}")
        f.write(f"[{t['start']:6.2f} - {t['end']:6.2f}] {label}\n  AR: {t['arabic']}\n  EN: {t['english']}\n\n")
print(open(J("transcript.txt")).read())
