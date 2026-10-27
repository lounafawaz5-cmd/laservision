#!/usr/bin/env python3
"""Phase 7: assemble edit/final.mp4 from 01_clean.mp4 + edit_plan.csv + overlays + captions + SFX.

Video (Python/OpenCV, frame by frame, piped into ffmpeg):
  - eased punch-in zooms anchored on her face; whip (motion-blur + zoom kick) at each tip change
  - B-roll from edit/broll/<slot>.mp4 when present, else the talking shot with an extra slow push-in
  - cards: scale-up + fade in (0.2 s), fade out; ❌ shake, ⚠️ pulse; tip counter top-right
  - blur-to-sharp on "blurry vision"; ZVC outro card (wordmark + WhatsApp) at the end
ffmpeg: burns captions.ass, mixes voice + SFX (+ ducked music from edit/music/ if present),
loudness -14 LUFS, H.264 CRF 16 + AAC 256k.
Also writes final_no_captions.mp4 (same edit, no burned-in captions) to pair with captions.srt.
Usage: python3 07_assemble.py [--preview]   (--preview = fast low-quality encode)
"""
import csv, glob, json, math, os, subprocess, sys
import cv2, numpy as np
from common import J, W, H, FPS, duration

PREVIEW = "--preview" in sys.argv
OUT = J("final_preview.mp4" if PREVIEW else "final.mp4")
OUT_CLEAN = J("final_preview_no_captions.mp4" if PREVIEW else "final_no_captions.mp4")   # for fixing captions yourself
ROOT = os.path.dirname(J())
FACE = (540.0, 470.0)               # zoom anchor (her face, measured in Phase 2/3)
plan = list(csv.DictReader(open(J("edit_plan.csv"))))
for r in plan: r["a"], r["b"] = float(r["start"]), float(r["end"])
END = plan[-1]["b"]; T_TALK = duration()
NF = int(round(END * FPS))
man = json.load(open(J("overlays", "manifest.json")))

# ---------------- easing ----------------
ease_io = lambda x: 0.5 - 0.5 * math.cos(math.pi * min(max(x, 0), 1))
ease_out = lambda x: 1 - (1 - min(max(x, 0), 1)) ** 3
def ease_back(x, s=1.7):
    x = min(max(x, 0), 1) - 1; return 1 + (s + 1) * x ** 3 + s * x ** 2

def row_at(t):
    for r in plan:
        if r["a"] <= t < r["b"]: return r
    return plan[-1] if t >= plan[-1]["a"] else None

# ---------------- zoom curve ----------------
def parse_zoom(z):
    z = z.split(" ")[0]
    if ">" in z: a, b = z.split(">"); return float(a), float(b)
    return None, float(z)
def broll_file(r):
    if not r["broll_needed"]: return None
    for e in (".mp4", ".mov", ".MP4", ".MOV"):
        p = J("broll", r["broll_needed"] + e)
        if os.path.exists(p): return p
    return None

TIP_STARTS = sorted({r["a"] for r in plan if "mix_in" in r["animation"]})
def whip_at(t):
    """returns strength 0..1 for the whip transition around each tip start."""
    for s in TIP_STARTS:
        d = t - s
        if -0.10 <= d <= 0.16: return 1 - abs(d) / (0.10 if d < 0 else 0.16)
    return 0.0

def zoom_at(t):
    """Piecewise zoom. A tip change is a hard cut (no zoom move); "a>b" rows ease slowly; empty B-roll
    slots simply stay on the talking shot (no extra zoom)."""
    z_prev = 1.0
    for r in plan:
        if r["shot_type"] == "outro": break
        a, b = parse_zoom(r["zoom_level"])
        if a is not None:
            start, dur = a, max(1.2, r["b"] - r["a"]) if "slow" in r["zoom_level"] else 0.45
        else:
            start, dur = (b, 1) if r["a"] in TIP_STARTS or abs(b - z_prev) < 1e-3 else (z_prev, 0.6)
        if t < r["b"]:
            return start + (b - start) * ease_io((t - r["a"]) / dur)
        z_prev = b
    return 1.0

def scale_about(img, z, cx, cy):
    M = np.float32([[z, 0, cx * (1 - z)], [0, z, cy * (1 - z)]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def motion_blur(img, k):
    k = int(k) | 1
    if k < 3: return img
    ker = np.zeros((k, k), np.float32); ker[:, k // 2] = 1.0 / k     # vertical whip
    return cv2.filter2D(img, -1, ker)

# ---------------- overlays ----------------
def load_ov(key):
    m = man[key]; x0, y0, x1, y1 = m["bbox"]
    x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(W, x1), min(H, y1)
    im = cv2.imread(J("overlays", m["file"]), cv2.IMREAD_UNCHANGED)[y0:y1, x0:x1]
    rgb = cv2.cvtColor(im[..., :3], cv2.COLOR_BGR2RGB).astype(np.float32)
    a = im[..., 3:4].astype(np.float32) / 255.0
    return {"rgb": rgb * a, "a": a, "x": x0, "y": y0}       # premultiplied
OV = {k: load_ov(k) for k in man}

def comp(frame, key, scale=1.0, alpha=1.0, dx=0.0, dy=0.0):
    if alpha <= 0.003: return
    o = OV[key]; rgb, a = o["rgb"], o["a"]
    h, w = a.shape[:2]
    if abs(scale - 1) > 1e-3:
        nw, nh = max(2, int(w * scale)), max(2, int(h * scale))
        rgb = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_LINEAR)
        a = cv2.resize(a, (nw, nh), interpolation=cv2.INTER_LINEAR)[..., None]
        x = o["x"] + (w - nw) / 2 + dx; y = o["y"] + (h - nh) / 2 + dy; w, h = nw, nh
    else:
        x, y = o["x"] + dx, o["y"] + dy
    x, y = int(round(x)), int(round(y))
    fx0, fy0, fx1, fy1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if fx1 <= fx0 or fy1 <= fy0: return
    sub_rgb = rgb[fy0 - y:fy1 - y, fx0 - x:fx1 - x] * alpha
    sub_a = a[fy0 - y:fy1 - y, fx0 - x:fx1 - x] * alpha
    dst = frame[fy0:fy1, fx0:fx1].astype(np.float32)
    frame[fy0:fy1, fx0:fx1] = (sub_rgb + dst * (1 - sub_a)).clip(0, 255).astype(np.uint8)

def slug(s):
    import re; return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")[:40]

# runs of identical overlays -> in/out times
runs = []
for r in plan:
    if r["overlay_style"] in ("do", "dont", "warning", "doctor"):
        key = f"card_t{r['tip_number']}_{slug(r['overlay_text'])}"
    elif r["overlay_style"] == "hook":
        key = "hook"
    else:
        continue
    if runs and runs[-1]["key"] == key and abs(runs[-1]["b"] - r["a"]) < 0.2:
        runs[-1]["b"] = r["b"]; runs[-1]["anim"] += "," + r["animation"]
    else:
        runs.append({"key": key, "a": r["a"], "b": r["b"], "style": r["overlay_style"], "anim": r["animation"]})
for i, rn in enumerate(runs):   # text swaps within a tip: quick crossfade, no shake/scale re-entry
    rn["swap_in"] = i > 0 and "text_swap" in rn["anim"]
    rn["swap_out"] = i + 1 < len(runs) and runs[i + 1].get("swap_in", False) or \
        (i + 1 < len(runs) and "text_swap" in runs[i + 1]["anim"])

def draw_cards(frame, t):
    for rn in runs:
        a, b = rn["a"], rn["b"]
        if not (a - 0.01 <= t < b + 0.2): continue
        IN, OUTD = (0.12, 0.12) if rn["swap_in"] else (0.2, 0.15)
        if rn["swap_out"]: OUTD = 0.0
        if t < b:
            x = (t - a) / IN
            alpha = ease_out(x); sc = 0.96 + 0.04 * ease_out(x) if rn["swap_in"] else 0.82 + 0.18 * ease_back(x)
            if rn["key"] == "hook": alpha, sc = 1.0, 0.92 + 0.08 * ease_back(x)   # visible on frame 0 (cover/first impression)
        else:
            if OUTD == 0: continue
            x = (t - b) / OUTD
            if x >= 1: continue
            alpha = 1 - ease_out(x); sc = 1 - 0.06 * ease_out(x)
        dx = 0
        if "shake" in rn["anim"] and not rn["swap_in"]:
            d = t - (a + 0.15)
            if 0 <= d < 0.45: dx = 14 * math.sin(2 * math.pi * 11 * d) * (1 - d / 0.45)
        if "pulse" in rn["anim"] and t < b:
            sc *= 1 + 0.022 * (0.5 - 0.5 * math.cos(2 * math.pi * 1.4 * max(0, t - a - 0.2)))
        if rn["key"] == "hook" and t < b:   # extra punch on the hook
            sc *= 1 + 0.03 * math.sin(math.pi * min(1, (t - a) / 2.0))
        comp(frame, rn["key"], sc, alpha, dx)

def draw_counter(frame, t):
    r = row_at(t)
    if not r or not r["tip_number"].isdigit() or int(r["tip_number"]) < 1: return
    n = int(r["tip_number"])
    tip_rows = [x for x in plan if x["tip_number"] == str(n)]
    a, b = tip_rows[0]["a"], tip_rows[-1]["b"]
    x = (t - a) / 0.18
    sc = 0.85 + 0.15 * ease_back(x); al = ease_out(x)
    if n == 7 and b - t < 0.2: al *= max(0, (b - t) / 0.2)
    comp(frame, f"counter_{n}", sc, al)

# ---------------- ZVC outro (Monogram end-card layout, staggered like its spring animation) ----------------
OUTRO_STEP = 0.33
ZEISS_BLUE = (15, 45, 179)   # ZEISS Indigo #0F2DB3
def draw_outro(frame, t):
    k = t - T_TALK - 0.15
    sp = lambda i: ease_out((k - i * OUTRO_STEP) / 0.5)          # ~ spring(damping 200)
    o = OV["outro_line"]; w_full = o["a"].shape[1]; w = int(w_full * sp(0))
    if w > 1:
        cx = o["x"] + w_full // 2
        frame[o["y"]:o["y"] + 5, cx - w // 2:cx + w // 2] = ZEISS_BLUE
    comp(frame, "outro_logo", 1, sp(1), 0, 30 * (1 - sp(1)))
    comp(frame, "outro_whatsapp", 1, sp(2))

# ---------------- blur-to-sharp ----------------
words = json.load(open(J("transcript.json")))["words"]
from common import clean_words
cw = clean_words()
blur_row = next((r for r in plan if "blur_to_sharp" in r["animation"]), None)
BLUR_A = next(w["start"] for w in cw if w["word"].startswith("blurry")) if blur_row else None
def blur_sigma(t):
    if not blur_row or not (BLUR_A - 0.12 <= t < blur_row["b"]): return 0
    if t < BLUR_A + 0.05: return 16 * ease_out((t - BLUR_A + 0.12) / 0.17)
    return 16 * (1 - ease_io((t - BLUR_A - 0.05) / (blur_row["b"] - BLUR_A - 0.15)))

# ---------------- video sources ----------------
def reader(path, size=(W, H)):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf",
                          f"fps={FPS},scale={size[0]}:{size[1]}:force_original_aspect_ratio=increase,crop={size[0]}:{size[1]}",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = size[0] * size[1] * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n: break
        yield np.frombuffer(buf, np.uint8).reshape(size[1], size[0], 3)

broll_frames = {}
def broll_frame(r, t):
    path = broll_file(r)
    if path not in broll_frames:
        broll_frames[path] = list(reader(path))[: int((r["b"] - r["a"]) * FPS) + 2]
    fr = broll_frames[path]
    if not fr: return None
    img = fr[min(len(fr) - 1, int((t - r["a"]) * FPS))]
    z = 1.0 + 0.06 * (t - r["a"]) / (r["b"] - r["a"])       # slow push-in
    return scale_about(img, z, W / 2, H / 2)

# ---------------- audio graph ----------------
def build_audio_cmd():
    events = []
    for r in plan:
        sfx = r["sound_effect"]
        if not sfx: continue
        t = r["a"]
        for i, s in enumerate(sfx.split("+")):
            off = 0.0 if s == "whoosh" else 0.08
            if s == "whoosh" and r["tip_number"] not in ("0", "outro"): off = -0.15   # lead into the cut
            events.append((s, max(0, t + off)))
    vol = {"pop": -15, "buzzer": -19, "whoosh": -20}
    inputs = ["-i", J("01_clean.mp4")]; fg = []; labels = []
    for i, (s, t) in enumerate(events):
        inputs += ["-i", J("sfx", f"{s}.wav")]
        ms = int(t * 1000)
        fg.append(f"[{i+1}:a]aresample=48000,aformat=channel_layouts=stereo,volume={vol[s]}dB,adelay={ms}|{ms}[s{i}]")
        labels.append(f"[s{i}]")
    fg.append(f"[0:a]aresample=48000,apad=whole_dur={END}[v]")
    music = sorted(glob.glob(J("music", "*.mp3")) + glob.glob(J("music", "*.wav")) + glob.glob(J("music", "*.m4a")))
    mix_in = "[v]" + "".join(labels); n = 1 + len(labels)
    if music:
        k = len(events) + 1
        inputs += ["-stream_loop", "-1", "-i", music[0]]
        fg.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{END},volume=-22dB,"
                  f"afade=t=in:d=0.5,afade=t=out:st={END-1.5}:d=1.5[m]")
        fg.append("[v]asplit[v][vsc]")
        fg.append("[m][vsc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[md]")
        mix_in += "[md]"; n += 1
    fg.append(f"{mix_in}amix=inputs={n}:normalize=0:duration=first,atrim=0:{END}[mix]")
    return inputs, fg, events, bool(music)

class Mix:
    """Video Editing Guide transition "Mix": a soft crossfade from the last frame before each cut."""
    def __init__(self, cuts, dur=0.2):
        self.cuts, self.dur, self.prev, self.freeze, self.at = sorted(cuts), dur, None, None, None
    def apply(self, img, t):
        raw = img
        c = next((c for c in self.cuts if c <= t < c + self.dur), None)
        if c is not None:
            if self.at != c: self.freeze, self.at = self.prev, c
            if self.freeze is not None:
                x = ease_io((t - c) / self.dur)
                img = (self.freeze.astype(np.float32) * (1 - x) + img.astype(np.float32) * x).astype(np.uint8)
        self.prev = raw
        return np.ascontiguousarray(img)

def main():
    inputs, fg, events, has_music = build_audio_cmd()
    # loudness pass 1 on the mix
    g = ";".join(fg) + ";[mix]loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[o]"
    r = subprocess.run(["ffmpeg", "-y"] + inputs + ["-filter_complex", g, "-map", "[o]", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    m = json.loads(r[r.rfind("{"):r.rfind("}") + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    # in the encode command input 0 is the raw video pipe, so every audio input index shifts by one
    import re
    afg = re.sub(r"\[(\d+):a\]", lambda mm: f"[{int(mm.group(1)) + 1}:a]", ";".join(fg))
    afg += f";[mix]{ln},aresample=48000,asplit[aout][aclean]"
    ass = J("captions.ass").replace(":", r"\:")
    fonts = J("fonts")   # Tajawal + Outfit
    vf = (f"[0:v]split[vc][vn];[vc]ass={ass}:fontsdir={fonts},format=yuv420p[vout];"
          f"[vn]format=yuv420p[vclean]")
    enc = ["-c:v", "libx264", "-preset", "ultrafast" if PREVIEW else "slow", "-crf", "28" if PREVIEW else "16",
           "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", str(FPS),
           "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart"]
    cmd = (["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
            "-r", str(FPS), "-i", "-"] + inputs +
           ["-filter_complex", vf + ";" + afg, "-map", "[vout]", "-map", "[aout]"] + enc + ["-t", f"{END:.3f}", OUT,
            "-map", "[vclean]", "-map", "[aclean]"] + enc + ["-t", f"{END:.3f}", OUT_CLEAN])
    enc_p = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    src = reader(J("01_clean.mp4"))
    last = None
    cuts = [sg["out_start"] for sg in json.load(open(J("segments.json")))[1:]]
    cuts += [r["a"] for r in plan if r["shot_type"] == "broll" and broll_file(r)]
    cuts += [r["b"] for r in plan if r["shot_type"] == "broll" and broll_file(r)]
    mix = Mix(cuts)
    for f in range(NF):
        t = f / FPS
        r = row_at(t)
        if t < T_TALK:
            base = next(src, None)
            if base is None: base = last
            last = base
            if r and r["shot_type"] == "broll" and broll_file(r):
                fr = broll_frame(r, t)
                img = fr if fr is not None else scale_about(base, zoom_at(t), *FACE)
            else:
                img = scale_about(base, zoom_at(t), *FACE)
            s = blur_sigma(t)
            if s > 0.3: img = cv2.GaussianBlur(img, (0, 0), s)
            img = mix.apply(np.ascontiguousarray(img), t)   # guide transition "Mix" at every cut
            draw_cards(img, t)
            draw_counter(img, t)
        else:
            # 0.25 s fade from her last frame to black, then the end card builds
            x = (t - T_TALK) / 0.25
            img = (last.astype(np.float32) * max(0.0, 1 - ease_out(x))).astype(np.uint8)
            img = np.ascontiguousarray(img)
            draw_outro(img, t)
        enc_p.stdin.write(img.tobytes())
        if f % 150 == 0: print(f"  frame {f}/{NF}", flush=True)
    enc_p.stdin.close(); enc_p.wait()
    if enc_p.returncode: sys.exit("ffmpeg encode failed")
    print("wrote", OUT, "and", os.path.basename(OUT_CLEAN), f"({END:.2f}s, music: {'yes' if has_music else 'none found - skipped'})")

if __name__ == "__main__":
    main()
