#!/usr/bin/env python3
"""SFX: pop.wav / whoosh.wav (copied from the contact-lens edit) + ding.wav for the logo. Files already in sfx/ are kept."""
import os, shutil, subprocess
from common import J
os.makedirs(J("sfx"), exist_ok=True)
for n in ("pop.wav", "whoosh.wav"):
    if not os.path.exists(J("sfx", n)): shutil.copy(J("..", "edit", "sfx", n), J("sfx", n))
if not os.path.exists(J("sfx", "ding.wav")):
    # bell-like: 1568 Hz (G6) + inharmonic partials, fast attack, ~1 s decay
    expr = ("0.55*sin(2*PI*1568*t)*exp(-t*4.5)+0.25*sin(2*PI*3136*t)*exp(-t*7)"
            "+0.12*sin(2*PI*4704*t)*exp(-t*10)+0.08*sin(2*PI*2093*t)*exp(-t*5)")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"aevalsrc='{expr}':s=48000:d=1.2",
                    "-af", "afade=t=in:d=0.004", "-ac", "2", J("sfx", "ding.wav")], check=True)
print(sorted(os.listdir(J("sfx"))))
