# Cut out lens + arrows from Luna's two lens illustrations (drop background, label, mark, shadow).
import sys
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage
src, out_path, y0, y1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
a = np.asarray(Image.open(src).convert('RGB')).astype(float)[y0:y1]
H, W, _ = a.shape
r, g, b = a[..., 0], a[..., 1], a[..., 2]
bgc = np.median(np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3)]), axis=0)
d = np.sqrt(((a - bgc) ** 2).sum(2))
lab, _ = ndimage.label(d < 14)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(edge))
arrow = ndimage.binary_dilation(r - b > 30, iterations=2) & ~bg
cyan = ndimage.binary_opening((g - r > 22) & (b - r > 22) & ~arrow, iterations=1)
lb, k = ndimage.label(cyan)
sizes = ndimage.sum(cyan, lb, range(1, k + 1))
lens = ndimage.binary_fill_holes(ndimage.binary_closing(lb == (1 + int(np.argmax(sizes))), iterations=4))
below = np.zeros((H, W), bool)
for x in range(W):
    ys = np.where(lens[:, x])[0]
    if len(ys):
        below[ys.max() + 1:, x] = True
keep = ~bg & ~(below & ~arrow)
keep = ndimage.binary_erosion(ndimage.binary_opening(keep, iterations=1), iterations=1)
alpha = np.asarray(Image.fromarray((keep * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.9))).astype(float)
alpha[~ndimage.binary_dilation(keep, iterations=2)] = 0
out = Image.fromarray(np.dstack([a, alpha]).astype('uint8'), 'RGBA')
out.crop(out.getbbox()).save(out_path)
