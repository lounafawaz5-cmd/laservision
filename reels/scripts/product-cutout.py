#!/usr/bin/env python3
"""Product photo on a white table → transparent PNG, cropped tight.

    product-cutout.py photo.jpg out.png [--solid-below 0.44]

Lenses are cleared (reflections removed), keeping the temples seen through them.
--solid-below Y: everything in the photo below Y (fraction of its height) is made opaque,
for a tinted clip-on photographed under the frame.

Silhouette from rembg (isnet), then "color to alpha" against the table's own lighting,
so clear lenses come out see-through (keeping their reflections) instead of solid white.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

src, out = sys.argv[1], sys.argv[2]
solid_below = float(sys.argv[sys.argv.index("--solid-below") + 1]) if "--solid-below" in sys.argv else None
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

# 4. Clear the lenses: the holes inside the rims. "Material" = dark or strongly colored, not
#    bluish glare. Inside the lenses only material survives (temples seen through the lens);
#    reflections of the room and glare go.
from scipy import ndimage
L = norm.mean(axis=2)
sat = norm.max(axis=2) - norm.min(axis=2)
blue_cast = norm[..., 2] - np.maximum(norm[..., 0], norm[..., 1])
warm = norm[..., 0] - norm[..., 2]  # gold / brass parts
material = ((L < 0.45) | ((sat > 0.3) & (L < 0.8)) | ((warm > 0.12) & (L < 0.9))) & (blue_cast < 0.12)
rim = ndimage.binary_closing((alpha > 0.45) & material, iterations=4)
rim = ndimage.binary_opening(rim, iterations=2)
holes = ndimage.binary_fill_holes(rim) & ~rim
keep = ndimage.binary_opening(material & (raw > 0.5), iterations=2)
clear = ndimage.binary_dilation(holes & ~keep, iterations=1) & ~rim
alpha = alpha * (1 - ndimage.gaussian_filter(clear.astype(np.float32), 1.5))

# 5. Tinted clip-on: solid.
if solid_below is not None:
    yy = np.arange(H)[:, None] >= int(solid_below * H)
    inner = ndimage.binary_erosion(sil > 0.5, iterations=10)
    solid = inner & yy
    soft = ndimage.gaussian_filter(solid.astype(np.float32), 2)
    alpha = np.maximum(alpha * (1 - (yy & (sil > 0.5) & ~solid)), 0.97 * soft)
    # Repaint the tint as a clean gradient (the photo's reflections on it go): colors sampled
    # from the top and bottom of the lens, a slightly darker edge, the gold studs kept.
    ys, xs = np.nonzero(solid)
    y0, y1 = ys.min(), ys.max()
    rows = (np.arange(H) - y0) / max(1, y1 - y0)
    top = np.percentile(norm[solid & (rows[:, None] < 0.35)], 15, axis=0)
    bot = np.percentile(norm[solid & (rows[:, None] > 0.7)], 60, axis=0)
    tt = np.clip(rows, 0, 1)[:, None, None]
    tt = tt * tt * (3 - 2 * tt)
    grad = top * (1 - tt) + bot * tt
    edge = ndimage.distance_transform_edt(solid)
    grad = grad * (1 - 0.18 * np.exp(-edge / 12))[..., None]
    studs = solid & (warm > 0.15) & (L > 0.55) & (sat > 0.25)
    studs = ndimage.binary_opening(studs, iterations=2)
    # Studs sit at the far left/right ends of the clip and are small.
    x0, x1 = xs.min(), xs.max()
    ends = np.zeros_like(studs); span = int((x1 - x0) * 0.1)
    ends[:, x0:x0 + span] = True; ends[:, x1 - span:x1 + 1] = True
    lab, nlab = ndimage.label(studs & ends)
    if nlab:
        areas = ndimage.sum(np.ones_like(lab), lab, range(1, nlab + 1))
        studs = np.isin(lab, [i + 1 for i, a in enumerate(areas) if a < 4000])
    studs = ndimage.binary_dilation(studs, iterations=3)
    color = np.where((solid & ~studs)[..., None], np.broadcast_to(grad, color.shape), color)
    color = np.where(studs[..., None], norm, color)
rgba = np.dstack([color, alpha]) * 255
img = Image.fromarray(rgba.astype(np.uint8), "RGBA")
img = img.crop(img.getbbox())
img.save(out)
print(out, img.size)
