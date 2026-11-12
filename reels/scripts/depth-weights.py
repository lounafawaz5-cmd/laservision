# Depth → blur weights. far = strong blur (window/city), mid = light blur (sofa/back wall). People + foreground stay sharp.
import sys, os, numpy as np
from PIL import Image, ImageFilter
d = np.load(sys.argv[1]); out = sys.argv[2]
os.makedirs(f"{out}/far", exist_ok=True); os.makedirs(f"{out}/mid", exist_ok=True)
lo, hi = np.percentile(d, [1, 99])
n = np.clip((d - lo) / (hi - lo), 0, 1)
n = (np.concatenate([n[:1], n[:-1]]) + 2 * n + np.concatenate([n[1:], n[-1:]])) / 4  # temporal smooth
def ramp(x, a, b): return np.clip((a - x) / (a - b), 0, 1)
for i, f in enumerate(n):
    near = np.asarray(Image.fromarray((f * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)), np.float32) / 255
    for name, a, b in (("far", 0.075, 0.035), ("mid", 0.095, 0.07)):
        w = ramp(near, a, b)
        Image.fromarray((w * 255).astype(np.uint8)).resize((1080, 1920), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3)).save(f"{out}/{name}/{i:03d}.png")
print(n.shape, [round(float(v), 3) for v in np.percentile(n, [5, 25, 50, 75, 95])])
