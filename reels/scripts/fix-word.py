# Replace a mispronounced sound with the same speaker saying the right one elsewhere in the clip.
# Donor is time-stretched to fit, given the target pitch contour (x PF), loudness-matched and crossfaded.
# Usage: python3 scripts/fix-word.py <target_start> <target_end> <donor_start> <donor_end> <out.wav> [PF]
# Reads src48.wav (mono 48 kHz of the clip) from the current directory. Times in seconds on the raw clip.
# Beltone fix (RIB_0129): 15.245 15.43 11.005 11.19 fixE.wav 0.89
import sys, numpy as np, parselmouth
from parselmouth.praat import call
snd = parselmouth.Sound("src48.wav"); sr = int(snd.sampling_frequency)
x = snd.values[0].copy()
T0, T1 = float(sys.argv[1]), float(sys.argv[2])      # target span to replace ("-in")
D0, D1 = float(sys.argv[3]), float(sys.argv[4])      # donor span ("-ōn" from تلفزيون)
out = sys.argv[5]
PF = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
tgt = snd.extract_part(T0, T1)
don = snd.extract_part(D0, D1)
# Stretch donor to target length, then impose the target's pitch contour.
man = call(don, "To Manipulation", 0.005, 75, 400)
dur = call("Create DurationTier", "d", 0, don.duration, )
call(dur, "Add point", 0, (T1 - T0) / don.duration)
call([man, dur], "Replace duration tier")
tp = tgt.to_pitch(time_step=0.005, pitch_floor=75, pitch_ceiling=400)
ts = [t for t in np.arange(0.005, tgt.duration, 0.01)]
vals = [tp.get_value_at_time(t) for t in ts]
good = [(t, v) for t, v in zip(ts, vals) if v == v]
# Fill unvoiced ends by holding the nearest voiced value.
ptier = call("Create PitchTier", "p", 0, don.duration)
scale = don.duration / (T1 - T0)   # pitch tier lives on the donor's (pre-stretch) clock
for t, v in good:
    call(ptier, "Add point", t * scale, v * PF)
call([man, ptier], "Replace pitch tier")
new = call(man, "Get resynthesis (overlap-add)")
y = new.values[0]
n = int(round((T1 - T0) * sr)); y = np.interp(np.arange(n), np.arange(len(y)) * n / len(y) if len(y) != n else np.arange(n), y) if len(y) != n else y
# Loudness: match RMS of the vowel cores.
seg = x[int(T0*sr):int(T0*sr)+n]
y = y * (np.sqrt((seg**2).mean()) / (np.sqrt((y**2).mean()) + 1e-9))
# Equal-power crossfades at both joins.
f = int(0.012 * sr)
w = np.sin(np.linspace(0, np.pi/2, f))**2
y2 = y.copy()
y2[:f] = seg[:f] * (1 - w) + y[:f] * w
y2[-f:] = y[-f:] * (1 - w) + seg[-f:] * w
x[int(T0*sr):int(T0*sr)+n] = y2
import wave
xs = np.clip(x * 32767, -32768, 32767).astype(np.int16)
st = np.repeat(xs[:, None], 2, axis=1)
wf = wave.open(out, "wb"); wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes(st.tobytes()); wf.close()
print("ok", n, "samples; donor pitch mean", call(don.to_pitch(), "Get mean", 0, 0, "Hertz"), "target", call(tp, "Get mean", 0, 0, "Hertz"))
