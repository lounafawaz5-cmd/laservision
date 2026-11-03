"""Key the burned-in LaserVision logo out of a CapCut export, one alpha PNG per frame.
Used to make the logo glow while following CapCut's own wipe-in / wipe-out exactly.
Usage: python3 scripts/logo-mask.py <video> <start_s> <end_s> <out_dir> [y0 y1]
"""
import os, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter

video, start, end, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
y0, y1 = (int(sys.argv[5]), int(sys.argv[6])) if len(sys.argv) > 6 else (1300, 1700)
os.makedirs(out, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["ffmpeg", "-v", "error", "-ss", str(start), "-t", str(end - start), "-i", video,
                    f"{tmp}/%04d.png"], check=True)
    for i, name in enumerate(sorted(os.listdir(tmp))):
        a = np.asarray(Image.open(f"{tmp}/{name}").convert("RGB")).astype(int)
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        # Logo teal (#005D83 / #30A4BF family): green well above red, blue above red. The lilac
        # backdrop (g < r) and navy scrubs (g ≈ r) both fail this.
        m = (g > b - 60) & (g > r + 30) & (b > r + 40) & (b < 200)
        m[:y0] = False; m[y1:] = False
        alpha = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
        # Pale brand cyan (between #30A4BF and #B6DFE5) so the mask screens over the logo as light, not white.
        img = Image.new("RGBA", alpha.size, (190, 236, 245, 0)); img.putalpha(alpha)
        img.crop((0, y0, a.shape[1], y1)).save(f"{out}/{i:04d}.png")
