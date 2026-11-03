"""Glow AROUND a logo that is burned into a CapCut export: one transparent PNG per frame.
The logo is keyed out of each frame, blurred into a halo, and the logo shape is cut back out, so the
halo only lands on the background and the original logo pixels stay untouched (sharp). Because it is
keyed per frame it follows CapCut's own pop-in / wipe-out exactly.
Glow colour defaults to the LaserVision account glow from brand/Video_Editing_Guide.pdf (#005d83).
Usage: python3 scripts/logo-halo.py <video> <start_s> <end_s> <out_dir> [y0 y1] [#hex]
"""
import os, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter

video, start, end, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
y0, y1 = (int(sys.argv[5]), int(sys.argv[6])) if len(sys.argv) > 6 else (1250, 1750)
hexc = sys.argv[7] if len(sys.argv) > 7 else "#005d83"
rgb = tuple(int(hexc[i:i + 2], 16) for i in (1, 3, 5))
os.makedirs(out, exist_ok=True)


def blur(a, r):
    return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))) / 255.0


with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["ffmpeg", "-v", "error", "-ss", str(start), "-t", str(end - start), "-i", video,
                    f"{tmp}/%04d.png"], check=True)
    for i, name in enumerate(sorted(os.listdir(tmp))):
        a = np.asarray(Image.open(f"{tmp}/{name}").convert("RGB"))[y0:y1].astype(int)
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        # Logo teal: green well above red and blue above red. The lilac backdrop (g < r) and navy
        # scrubs (g ≈ r) both fail this.
        m = ((g > b - 60) & (g > r + 30) & (b > r + 40) & (b < 200)).astype(float)
        # Halo ≈ CapCut glow intensity 30 / range 58: a tight core plus a wide soft spread.
        halo = np.clip(0.75 * blur(m, 6) * 2.2 + 0.55 * blur(m, 22) * 2.0, 0, 0.85)
        # Cut the logo back out (slightly grown, soft edge) so nothing is drawn on the logo itself.
        logo = blur(np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) / 255.0, 0.8)
        alpha = halo * (1 - np.clip(logo * 1.6, 0, 1))
        img = np.zeros((*m.shape, 4), np.uint8)
        img[..., :3] = rgb
        img[..., 3] = (alpha * 255).astype(np.uint8)
        Image.fromarray(img, "RGBA").save(f"{out}/{i:04d}.png")
