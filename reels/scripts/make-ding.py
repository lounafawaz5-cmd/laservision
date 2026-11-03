"""Generate a soft bell "ding" (public/sfx/ding.wav). Synthesized here, so no licensing."""
import sys, wave
import numpy as np

sr = 48000
t = np.arange(int(sr * 1.4)) / sr
f0 = 1568.0  # G6
# Bell-like partials: fundamental, a bright upper partial and a soft low one, each with its own decay.
partials = [(1.0, 1.0, 3.2), (2.76, 0.35, 6.0), (5.40, 0.12, 9.0), (0.5, 0.18, 4.0)]
y = sum(a * np.exp(-t * d) * np.sin(2 * np.pi * f0 * r * t) for r, a, d in partials)
y *= np.minimum(1, t / 0.004)  # 4 ms attack so it doesn't click
y = 0.5 * y / np.abs(y).max()
out = sys.argv[1] if len(sys.argv) > 1 else "public/sfx/ding.wav"
with wave.open(out, "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((y * 32767).astype(np.int16).tobytes())
