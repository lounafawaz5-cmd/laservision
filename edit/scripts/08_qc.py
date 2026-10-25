#!/usr/bin/env python3
"""Phase 8: QC of final.mp4.
- a frame every 3 s -> edit/qc/frame_XXs.png + edit/qc/contact_sheet.png (with safe-zone guides)
- audio: integrated loudness, true peak, clipped samples -> edit/qc/qc_report.txt
"""
import glob, json, os, re, subprocess
from common import J
V = J("final.mp4"); Q = J("qc"); os.makedirs(Q, exist_ok=True)
for f in glob.glob(os.path.join(Q, "frame_*.png")): os.remove(f)
dur = float(json.loads(subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", V],
                                      capture_output=True, text=True).stdout)["format"]["duration"])
ts = [t for t in range(0, int(dur) + 1, 3)]
for t in ts:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", V, "-frames:v", "1",
                    os.path.join(Q, f"frame_{t:02d}s.png")], check=True)
subprocess.run(["python3", os.path.join(os.path.dirname(__file__), "qc_sheet.py"), V,
                os.path.join(Q, "contact_sheet.png")] + [str(t) for t in ts], check=True)
log = subprocess.run(["ffmpeg", "-i", V, "-af", "ebur128=peak=true,astats=measure_overall=Peak_level+Number_of_samples:measure_perchannel=0",
                      "-f", "null", "-"], capture_output=True, text=True).stderr
I = re.findall(r"I:\s+(-?[\d.]+) LUFS", log)[-1]; TP = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", log)[-1]
clip = subprocess.run(["ffmpeg", "-i", V, "-af", "astats=measure_overall=Peak_count+Peak_level:measure_perchannel=none", "-f", "null", "-"],
                      capture_output=True, text=True).stderr
pk = re.findall(r"Peak level dB: (-?[\d.inf]+)", clip)
rep = (f"duration {dur:.2f}s\nintegrated loudness {I} LUFS (target -14)\ntrue peak {TP} dBTP (limit -1.0)\n"
       f"sample peak {pk[-1] if pk else '?'} dBFS\nclipping: {'NO' if float(TP) < -0.1 else 'YES'}\n"
       f"frames: {', '.join(f'frame_{t:02d}s.png' for t in ts)}\n")
open(os.path.join(Q, "qc_report.txt"), "w").write(rep); print(rep)
