#!/usr/bin/env python3
"""Phase 2: clean cut from two takes.
RIB_0124 4.37 s -> end of "سماعكن" (the first closing take and the chatter after it are dropped),
then RIB_0125 (retake of the closing line). Inside each range, silences > MIN_SIL are cut with PAD of air.
Each take is gain-matched (EBU R128) before highpass, light denoise, gentle compressor, 2-pass loudnorm -14 LUFS.
Writes segments.json and 01_clean.mp4 (1080x1920, 30 fps).
"""
import json, re, subprocess
from common import J
MIN_SIL, PAD, NOISE_DB = 0.4, 0.1, -35
words = json.load(open(J("transcripts", "words.json")))
def span(src):
    ws = [w for w in words if w["src"] == src]; return ws[0]["start"], ws[-1]["end"]
RANGES = [("RIB_0124", 4.37, 37.80),   # 37.80 = dip after "سماعكن", before the first-take "ولأن"
          ("RIB_0125", 1.88, None)]    # retake; ends 0.1 s after her last word

def silences(path):
    log = subprocess.run(["ffmpeg", "-i", path, "-af", f"silencedetect=n={NOISE_DB}dB:d={MIN_SIL}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return list(zip(map(float, re.findall(r"silence_start: ([\d.]+)", log)), map(float, re.findall(r"silence_end: ([\d.]+)", log))))

segs, off = [], 0.0
for src, a, b_fixed in RANGES:
    path = J("source", src + ".MP4")
    _, last_end = span(src)
    sil = silences(path)
    # range ends at the first silence after the last kept word (+PAD)
    b = b_fixed or next((s + PAD for s, e in sil if s >= last_end - 0.05), last_end + 0.25)
    keep, t = [], a
    for s, e in sil:
        if e <= a or s >= b: continue
        if s >= last_end - 0.05: break        # never cut the hold after the last word
        if s + PAD > t: keep.append([t, s + PAD])
        t = max(t, e - PAD)
    if b > t: keep.append([t, b])
    for k0, k1 in keep:
        if k1 - k0 < 0.15: continue
        segs.append({"src": src, "src_start": round(k0, 3), "src_end": round(k1, 3),
                     "out_start": round(off, 3), "out_end": round(off + k1 - k0, 3)}); off += k1 - k0
json.dump(segs, open(J("segments.json"), "w"), indent=1)
print(f"{len(segs)} segments -> {off:.2f}s")

# per-take gain match
def lufs(src, a, b):
    r = subprocess.run(["ffmpeg", "-ss", str(a), "-to", str(b), "-i", J("source", src + ".MP4"), "-af", "ebur128", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])
gain = {}
for src in dict.fromkeys(s["src"] for s in segs):
    ss = [s for s in segs if s["src"] == src]
    gain[src] = -18.0 - lufs(src, ss[0]["src_start"], ss[-1]["src_end"])
print("gain match:", {k: round(v, 1) for k, v in gain.items()})

srcs = list(dict.fromkeys(s["src"] for s in segs)); idx = {s: i for i, s in enumerate(srcs)}
inputs = sum((["-i", J("source", s + ".MP4")] for s in srcs), [])
F = 0.008; parts = []; labels = ""
for i, s in enumerate(segs):
    k = idx[s["src"]]; a, b = s["src_start"], s["src_end"]
    parts.append(f"[{k}:v]trim={a}:{b},setpts=PTS-STARTPTS,fps=30[v{i}]")
    parts.append(f"[{k}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,volume={gain[s['src']]:.2f}dB,"
                 f"afade=t=in:d={F},afade=t=out:st={b-a-F:.3f}:d={F}[a{i}]")
    labels += f"[v{i}][a{i}]"
parts.append(f"{labels}concat=n={len(segs)}:v=1:a=1[vc][ac]")
parts.append("[vc]scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p[vo]")
CHAIN = "highpass=f=80,afftdn=nr=10:nf=-40:tn=1,acompressor=threshold=-20dB:ratio=3:attack=10:release=150:makeup=2"
g1 = ";".join(parts) + f";[ac]{CHAIN},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[ao]"
r = subprocess.run(["ffmpeg", "-y"] + inputs + ["-filter_complex", g1, "-map", "[vo]", "-map", "[ao]", "-f", "null", "-"],
                   capture_output=True, text=True).stderr
m = json.loads(r[r.rfind("{"):r.rfind("}") + 1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
g2 = ";".join(parts) + f";[ac]{CHAIN},{ln},aresample=48000[ao]"
subprocess.run(["ffmpeg", "-y", "-v", "error"] + inputs + ["-filter_complex", g2, "-map", "[vo]", "-map", "[ao]",
                "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-c:a", "aac", "-b:a", "256k",
                "-movflags", "+faststart", J("01_clean.mp4")], check=True)
print("wrote 01_clean.mp4")
