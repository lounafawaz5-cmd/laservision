#!/usr/bin/env python3
"""Phase 2: clean cut.
- silencedetect (> MIN_SIL s) -> remove, keeping PAD s of breathing room each side
- trims lead-in and the outtake after the last spoken word of tip 7
- filler words / repeated takes: removes any word in FILLERS from transcript.json
- audio: highpass, light FFT denoise, gentle compressor, 2-pass loudnorm to -14 LUFS
- source is already 1080x1920 9:16 -> no reframe needed; converts 50 -> 30 fps
Writes edit/segments.json (source->clean time map) and edit/01_clean.mp4
"""
import json, os, re, subprocess
EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda *p: os.path.join(EDIT, *p)
SRC, OUT = J("video.mp4"), J("01_clean.mp4")
MIN_SIL, PAD, NOISE_DB = 0.4, 0.1, -35
FILLERS = {"um", "uh", "umm", "uhh", "اممم", "ااا", "يعني؟"}

words = json.load(open(J("transcript.json")))["words"]
tips = json.load(open(J("tips.json")))
speech_start = words[0]["start"]
speech_end = max(t["end"] for t in tips if t["tip"] == 7)
dur = float(json.load(open(J("probe.json")))["format"]["duration"])

log = subprocess.run(["ffmpeg", "-i", SRC, "-af", f"silencedetect=n={NOISE_DB}dB:d={MIN_SIL}",
                      "-f", "null", "-"], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)] + [dur]
sil = list(zip(starts, ends))
remove = []
for a, b in sil:  # keep PAD of air on each side of every removed silence
    remove.append((0 if a <= 0.01 else a + PAD, dur if b >= dur - 0.01 else b - PAD))
remove += [(w["start"], w["end"]) for w in words if w["word"].strip("،.?!").lower() in FILLERS]
remove += [(0, max(0, speech_start - PAD)), (speech_end + PAD, dur)]   # lead-in + outtake
remove.sort()
# merge + invert to keep list
merged = []
for a, b in remove:
    if b - a <= 0.05: continue
    if merged and a <= merged[-1][1]: merged[-1][1] = max(merged[-1][1], b)
    else: merged.append([a, b])
keep, t = [], 0.0
for a, b in merged:
    if a > t: keep.append([round(t, 3), round(a, 3)])
    t = b
if t < dur: keep.append([round(t, 3), round(dur, 3)])
keep = [k for k in keep if k[1] - k[0] > 0.15]
off, segs = 0.0, []
for a, b in keep:
    segs.append({"src_start": a, "src_end": b, "out_start": round(off, 3), "out_end": round(off + b - a, 3)})
    off += b - a
json.dump(segs, open(J("segments.json"), "w"), indent=1)
print(f"keep {len(segs)} segments, {dur:.2f}s -> {off:.2f}s")
for s in segs: print(s)

# --- build filtergraph: trim + 8ms audio fades at each joint (no clicks) + concat
F = 0.008
parts, labels = [], ""
for i, s in enumerate(segs):
    a, b = s["src_start"], s["src_end"]
    parts.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}]")
    parts.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d={F},afade=t=out:st={b-a-F:.3f}:d={F}[a{i}]")
    labels += f"[v{i}][a{i}]"
parts.append(f"{labels}concat=n={len(segs)}:v=1:a=1[vc][ac]")
parts.append("[vc]fps=30,scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p[vo]")
CHAIN = "highpass=f=80,afftdn=nr=10:nf=-40:tn=1,acompressor=threshold=-20dB:ratio=3:attack=10:release=150:makeup=2"
# pass 1: measure loudness after cleanup
g1 = ";".join(parts) + f";[ac]{CHAIN},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[ao]"
r = subprocess.run(["ffmpeg", "-y", "-i", SRC, "-filter_complex", g1, "-map", "[vo]", "-map", "[ao]", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
m = json.loads(r[r.rfind("{"):r.rfind("}") + 1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
g2 = ";".join(parts) + f";[ac]{CHAIN},{ln},aresample=48000[ao]"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", SRC, "-filter_complex", g2, "-map", "[vo]", "-map", "[ao]",
                "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-c:a", "aac", "-b:a", "256k",
                "-movflags", "+faststart", OUT], check=True)
print("wrote", OUT)
