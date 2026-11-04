"""Generate a soft, short "pop" (public/sfx/pop.wav) for text pop-ups. Synthesized here, so no licensing.
Kept short (~80 ms) and mostly below the voice's presence range so it never covers the speaker."""
import sys, wave
import numpy as np

sr = 48000
t = np.arange(int(sr * 0.12)) / sr
# Bubble-style pop: a quick downward pitch sweep (520 -> 180 Hz) with a fast decay.
freq = 180 + 340 * np.exp(-t * 60)
phase = 2 * np.pi * np.cumsum(freq) / sr
y = np.sin(phase) * np.exp(-t * 45)
y *= np.minimum(1, t / 0.002)  # 2 ms attack, no click
y = 0.6 * y / np.abs(y).max()
out = sys.argv[1] if len(sys.argv) > 1 else "public/sfx/pop.wav"
with wave.open(out, "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((y * 32767).astype(np.int16).tobytes())
