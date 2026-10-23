"""Detect beat times in a song for BeatAd edits.

usage: python3 -I scripts/beats.py public/audio/song.mp3 [start_sec] [count]
Prints bpm and beatTimesMs (relative to start_sec) to paste into the edit's props.
"""
import json
import sys

import librosa

path = sys.argv[1]
start = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
count = int(sys.argv[3]) if len(sys.argv) > 3 else 64

y, sr = librosa.load(path, sr=None, offset=start, duration=90)
tempo, frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
times = librosa.frames_to_time(frames, sr=sr)
print(json.dumps({"bpm": round(float(tempo), 2), "beatTimesMs": [round(t * 1000) for t in times[:count]]}))
