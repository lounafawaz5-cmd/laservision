import sys, glob, numpy as np, onnxruntime as ort
from PIL import Image
model, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
files = sorted(glob.glob(f"{src}/*.png"))
if len(sys.argv) > 4: files = [files[int(i)] for i in sys.argv[4].split(",")]
sess = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
name = sess.get_inputs()[0].name
mean = np.array([0.485, 0.456, 0.406], np.float32); std = np.array([0.229, 0.224, 0.225], np.float32)
deps = []
for f in files:
    im = Image.open(f).convert("RGB").resize((518, 924), Image.BICUBIC)
    x = ((np.asarray(im, np.float32) / 255 - mean) / std).transpose(2, 0, 1)[None]
    d = sess.run(None, {name: x})[0][0]
    deps.append(d)
deps = np.stack(deps)
np.save(f"{out}/depth.npy", deps)
print(deps.shape, deps.min(), deps.max(), np.percentile(deps, [2, 50, 98]))
