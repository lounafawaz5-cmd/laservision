#!/usr/bin/env python3
"""Phase 1: probe + transcribe with word-level timestamps.
Usage: python3 scripts/01_transcribe.py [input] [model]   (default model: large-v3)
Writes edit/probe.json, edit/transcript.json, edit/transcript.txt
"""
import json, subprocess, sys, os
import whisper

EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(EDIT, "video.mp4")
model_name = sys.argv[2] if len(sys.argv) > 2 else "large-v3"

probe = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json",
                        "-show_format", "-show_streams", src],
                       capture_output=True, text=True, check=True).stdout
open(os.path.join(EDIT, "probe.json"), "w").write(probe)

model = whisper.load_model(model_name)
res = model.transcribe(src, word_timestamps=True, language=None,  # auto-detect (source is Lebanese Arabic)
                       condition_on_previous_text=False,
                       initial_prompt="إذا بتلبسوا contact lenses، غسلوا إيديكن بالمي والصابون، solution، blurry vision")
json.dump(res, open(os.path.join(EDIT, "transcript.json"), "w"), indent=1, ensure_ascii=False)
with open(os.path.join(EDIT, "transcript.txt"), "w") as f:
    for s in res["segments"]:
        f.write(f"[{s['start']:6.2f} - {s['end']:6.2f}] {s['text'].strip()}\n")
print(open(os.path.join(EDIT, "transcript.txt")).read())
