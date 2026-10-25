#!/usr/bin/env python3
"""Phase 1: probe + Whisper large-v3 word timestamps for every talking clip in source/.
Usage: python3 scripts/01_transcribe.py RIB_0124 RIB_0125
Writes transcripts/<clip>.json and transcripts/<clip>.txt
"""
import json, os, sys, warnings
warnings.filterwarnings("ignore")
import whisper
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(ROOT, "transcripts"), exist_ok=True)
model = whisper.load_model("large-v3")
for clip in sys.argv[1:]:
    res = model.transcribe(os.path.join(ROOT, "source", clip + ".MP4"), word_timestamps=True, language=None,
                           condition_on_previous_text=False,
                           initial_prompt="قسم الـ audiology، hearing test، hearing aids، customized earplugs")
    json.dump(res, open(os.path.join(ROOT, "transcripts", clip + ".json"), "w"), indent=1, ensure_ascii=False)
    with open(os.path.join(ROOT, "transcripts", clip + ".txt"), "w") as f:
        f.write(f"language: {res['language']}\n")
        for s in res["segments"]:
            f.write(f"[{s['start']:6.2f} - {s['end']:6.2f}] {s['text'].strip()}\n")
        f.write("\nwords:\n" + " ".join(f"{w['word'].strip()}@{w['start']:.2f}" for s in res["segments"] for w in s["words"]) + "\n")
    print(open(os.path.join(ROOT, "transcripts", clip + ".txt")).read())
