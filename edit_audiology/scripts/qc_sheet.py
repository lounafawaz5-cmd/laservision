#!/usr/bin/env python3
"""QC helper: python3 qc_sheet.py <video> <out.png> t1 t2 ... -> labelled contact sheet."""
import subprocess, sys, numpy as np
from PIL import Image, ImageDraw
vid, out, ts = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3:]]
tiles = []
for t in ts:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", vid, "-frames:v", "1", "-vf", "scale=270:480",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    im = Image.fromarray(np.frombuffer(raw, np.uint8).reshape(480, 270, 3)); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 60, 18), fill="black"); d.text((3, 3), f"{t:.2f}s", fill="yellow")
    for y in (62, 380): d.line((0, y, 270, y), fill=(255, 0, 255), width=1)   # safe-zone guides (250 / 1520 px)
    tiles.append(im)
cols = 6; rows = -(-len(tiles) // cols)
sheet = Image.new("RGB", (270 * cols, 480 * rows), "white")
for i, t in enumerate(tiles): sheet.paste(t, (i % cols * 270, i // cols * 480))
sheet.save(out)
