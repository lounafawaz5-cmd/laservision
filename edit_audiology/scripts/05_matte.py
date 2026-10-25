#!/usr/bin/env python3
"""Phase 5: person matte for the "logo behind her" moments.
MediaPipe selfie_multiclass (models/selfie_multiclass_256x256.tflite) -> person confidence,
refined with a guided filter on the frame (sharp hijab/shoulder edges), smoothed over time (no flicker).
Only frames inside the plan's "logo" rows (+0.3 s) are processed. Writes mattes/<frame>.png (540x960, 8-bit).
"""
import csv, os, subprocess, warnings
import cv2, numpy as np
warnings.filterwarnings("ignore")
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
from common import J, W, H, FPS

OUT = J("mattes"); os.makedirs(OUT, exist_ok=True)
rows = [r for r in csv.DictReader(open(J("edit_plan.csv"))) if r["layer"] == "logo"]
need = set()
for r in rows:
    need |= set(range(int(float(r["start"]) * FPS) - 3, int((float(r["end"]) + 0.3) * FPS) + 1))

seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=mpt.BaseOptions(model_asset_path=J("models", "selfie_multiclass_256x256.tflite")),
    output_confidence_masks=True, output_category_mask=False))

def guided(I, p, r=10, eps=1e-3):
    box = lambda x: cv2.boxFilter(x, -1, (2 * r + 1, 2 * r + 1))
    mI, mp_ = box(I), box(p); cov = box(I * p) - mI * mp_; var = box(I * I) - mI * mI
    a = cov / (var + eps); b = mp_ - a * mI
    return box(a) * I + box(b)

w2, h2 = W // 2, H // 2
proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", J("01_clean.mp4"), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                        stdout=subprocess.PIPE)
prev, f, n = None, 0, 0
while True:
    buf = proc.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    if f in need:
        img = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        res = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(img)))
        p = 1.0 - res.confidence_masks[0].numpy_view().astype(np.float32)
        p = cv2.resize(p.squeeze(), (w2, h2), interpolation=cv2.INTER_LINEAR)
        g = cv2.cvtColor(cv2.resize(img, (w2, h2), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
        a = np.clip(guided(g, p), 0, 1)
        a = np.clip((a - 0.25) / 0.5, 0, 1)                       # firmer core, soft 1-2 px edge
        if prev is not None and (f - 1) in need: a = 0.65 * a + 0.35 * prev
        prev = a
        cv2.imwrite(os.path.join(OUT, f"{f:05d}.png"), (a * 255).astype(np.uint8)); n += 1
    else:
        prev = None
    f += 1
print(f"{n} mattes written for {len(rows)} logo moments")
