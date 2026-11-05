"""Map Whisper word timings from several takes onto a MultiTake cut list.

Usage: python3 -I scripts/multitake-words.py cuts.json
cuts.json = {"transcripts": {"RIB_0029": "path/RIB_0029.json", ...},
             "segments": [{"take": "RIB_0029", "from": 0.0, "to": 6.2}, ...]}
Transcript JSON = faster-whisper segments with word_timestamps (fields: words[{w, s, e}]).
Prints each kept word with its OUTPUT time in ms, grouped by segment, to chunk into 1-3 word captions by hand.
"""
import json
import sys

cfg = json.load(open(sys.argv[1]))
words = {k: [w for seg in json.load(open(p)) for w in seg["words"]] for k, p in cfg["transcripts"].items()}
out = 0.0
for i, g in enumerate(cfg["segments"]):
    print(f"--- seg {i} {g['take']} {g['from']:.2f}-{g['to']:.2f}  (out {out*1000:.0f} ms)")
    for w in words[g["take"]]:
        mid = (w["s"] + w["e"]) / 2
        if g["from"] <= mid < g["to"]:
            print(f"{(out + max(w['s'], g['from']) - g['from'])*1000:7.0f} {(out + min(w['e'], g['to']) - g['from'])*1000:7.0f}  {w['w'].strip()}")
    out += g["to"] - g["from"]
print(f"total {out:.2f} s")
