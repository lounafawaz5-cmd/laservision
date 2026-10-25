#!/usr/bin/env python3
"""Generate simple SFX with ffmpeg into edit/sfx/ (skips any file you already put there).
pop.wav (✅ cards / recap lines), buzzer.wav (❌ cards), whoosh.wav (transitions)."""
import os, subprocess
from common import J
os.makedirs(J("sfx"), exist_ok=True)
SFX = {
 # short pitched blip with fast decay
 "pop.wav": "aevalsrc='0.9*sin(2*PI*(520+900*exp(-t*40))*t)*exp(-t*28)':s=48000:d=0.18",
 # low two-tone square-ish buzz
 "buzzer.wav": "aevalsrc='0.5*(sgn(sin(2*PI*150*t))+0.6*sgn(sin(2*PI*157*t)))/1.6*(1-exp(-t*120))*exp(-t*6)':s=48000:d=0.32,lowpass=f=2200",
 # band-passed noise with a rising/falling swell
 "whoosh.wav": "anoisesrc=d=0.42:c=pink:r=48000:a=0.9,bandpass=f=1400:width_type=o:w=2,"
               "volume='sin(PI*t/0.42)^2':eval=frame,afade=t=out:st=0.32:d=0.1",
}
for name, src in SFX.items():
    p = J("sfx", name)
    if os.path.exists(p): print("keep", name); continue
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", src, "-ac", "2", p], check=True)
    print("made", name)
