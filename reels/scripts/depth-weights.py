#!/usr/bin/env python3
"""Depth → blur weight maps for pro-look.sh.

    depth-weights.py depth.npy outdir [far_a far_b mid_a mid_b]

Depth is normalized per frame (robust 1–99% range, smoothed over ~0.5 s so the blur doesn't pump),
1 = nearest. Below far_b → full strong blur, ramping to none at far_a; mid_* is a light blur.
Defaults suit a far window behind people (shot 2); for a wall a meter or two behind, use ~0.38 0.28 0.45 0.38.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

d = np.load(sys.argv[1]).astype(np.float32); out = sys.argv[2]
far_a, far_b, mid_a, mid_b = (map(float, sys.argv[3:7]) if len(sys.argv) >= 7 else (0.075, 0.035, 0.095, 0.07))
os.makedirs(f"{out}/far", exist_ok=True); os.makedirs(f"{out}/mid", exist_ok=True)

lo = np.percentile(d.reshape(len(d), -1), 1, axis=1)
hi = np.percentile(d.reshape(len(d), -1), 99, axis=1)
k = np.ones(15) / 15
pad = lambda v: np.pad(v, 7, mode="edge")
lo, hi = np.convolve(pad(lo), k, "valid"), np.convolve(pad(hi), k, "valid")
n = np.clip((d - lo[:, None, None]) / (hi - lo)[:, None, None], 0, 1)
n = (np.concatenate([n[:1], n[:-1]]) + 2 * n + np.concatenate([n[1:], n[-1:]])) / 4  # temporal smooth

def ramp(x, a, b): return np.clip((a - x) / (a - b), 0, 1)

for i, f in enumerate(n):
    # Grow near areas a little so blur never eats into hair or hands.
    near = np.asarray(Image.fromarray((f * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)), np.float32) / 255
    for name, a, b in (("far", far_a, far_b), ("mid", mid_a, mid_b)):
        w = ramp(near, a, b)
        Image.fromarray((w * 255).astype(np.uint8)).resize((1080, 1920), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3)).save(f"{out}/{name}/{i:04d}.png")
print(f"{len(n)} weight maps → {out}")
