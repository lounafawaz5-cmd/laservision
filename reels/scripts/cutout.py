#!/usr/bin/env python3
"""Cut the people out of a clip, frame by frame, for templates that put graphics behind them.

    pip install "rembg[cpu]"
    python3 scripts/cutout.py public/footage/battle/shot1.mp4 public/footage/battle/fg

Writes RGBA WebP frames 000.webp, 001.webp… at 1080x1920. The mask is averaged with its
neighbor frames so the edges don't flicker.
"""
import glob, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

video, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", "scale=1080:1920", f"{tmp}/%03d.png"], check=True)
    files = sorted(glob.glob(f"{tmp}/*.png"))
    session = new_session("u2net_human_seg")
    masks = [np.asarray(remove(Image.open(f), session=session, only_mask=True), dtype=np.float32) for f in files]
    for i, f in enumerate(files):
        a = masks[max(i - 1, 0)] * 0.25 + masks[i] * 0.5 + masks[min(i + 1, len(masks) - 1)] * 0.25
        mask = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
        im = Image.open(f).convert("RGB")
        im.putalpha(mask)
        im.save(f"{out}/{i:03d}.webp", quality=92, method=4)
print(f"{len(files)} frames → {out}")
