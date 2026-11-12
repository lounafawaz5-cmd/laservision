#!/usr/bin/env python3
"""Product photo on a white table → transparent PNG, cropped tight.

    product-cutout.py photo.jpg out.png

Silhouette from rembg (isnet), then "color to alpha" against the table's own lighting,
so clear lenses come out see-through (keeping their reflections) instead of solid white.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
W, H = im.size
small = im.resize((W // 2, H // 2))

# 1. Object silhouette, keep only big parts (drops handwriting / paper corners).
mask = remove(small, session=new_session("isnet-general-use"), only_mask=True)
m = np.asarray(mask) > 100
# Biggest blobs via a coarse flood fill on a downsampled grid.
from collections import deque
g = np.asarray(mask.resize((W // 16, H // 16))) > 60
lab = np.zeros(g.shape, int); sizes = {}
cur = 0
for y, x in zip(*np.nonzero(g)):
    if lab[y, x]: continue
    cur += 1; q = deque([(y, x)]); lab[y, x] = cur; n = 0
    while q:
        cy, cx = q.popleft(); n += 1
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < g.shape[0] and 0 <= nx < g.shape[1] and g[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = cur; q.append((ny, nx))
    sizes[cur] = n
big = max(sizes.values())
keep = np.isin(lab, [k for k, v in sizes.items() if v > big * 0.15])
keep_full = np.asarray(Image.fromarray((keep * 255).astype(np.uint8)).resize((W, H), Image.NEAREST)) > 0
sil = np.asarray(mask.resize((W, H), Image.BILINEAR)) > 40
sil = sil & keep_full
sil = np.asarray(Image.fromarray((sil * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(4)), np.float32) / 255

# 2. Table lighting: remove the glasses with a big max filter, then smooth.
bg = small.filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.GaussianBlur(30)).resize((W, H), Image.BILINEAR)
a = np.asarray(im, np.float32) / 255
b = np.maximum(np.asarray(bg, np.float32) / 255, 0.05)
norm = np.clip(a / b, 0, 1)

# 3. Color to alpha against white. Shown alpha is firmed up (frame solid, faint lens marks fade).
#    Where it's at least the raw alpha, unmix the color against white; where lens marks are
#    faded below it, keep the plain photo color so they read as soft glass, not dark smudges.
raw = (1 - norm).max(axis=2)
t = np.clip((raw - 0.08) / 0.3, 0, 1)
alpha = t * t * (3 - 2 * t) * sil
safe = np.maximum(alpha, 1e-3)[..., None]
unmixed = np.clip((norm - (1 - safe)) / safe, 0, 1)
color = np.where((alpha >= raw)[..., None], unmixed, norm)
rgba = np.dstack([color, alpha]) * 255
img = Image.fromarray(rgba.astype(np.uint8), "RGBA")
img = img.crop(img.getbbox())
img.save(out)
print(out, img.size)
