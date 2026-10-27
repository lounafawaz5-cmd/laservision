#!/usr/bin/env python3
"""Phase 8: assemble final.mp4 + final_no_captions.mp4 from 01_clean.mp4 + edit_plan.csv.
- no zooms; B-roll (RIB_0139/0140/0141) cut in over her voice
- LaserVision logo composited on the wall BEHIND her (matte from 05_matte.py) with a pop-in + ding
- overlays: "pop" = scale-up with overshoot (+ pop.wav), "slide_left/right" = slide in from that side (+ whoosh.wav);
  everything fades out at the row end
- captions.ass burned in (Tajawal, house style); a second output without captions pairs with captions.srt
- LaserVision outro: white card, line, logo, WhatsApp; audio -14 LUFS
Usage: python3 08_assemble.py [--preview]
"""
import csv, json, math, os, re, subprocess, sys
import cv2, numpy as np
from common import J, W, H, FPS, duration

PREVIEW = "--preview" in sys.argv
OUT = J("final_preview.mp4" if PREVIEW else "final.mp4")
OUT_CLEAN = J("final_preview_no_captions.mp4" if PREVIEW else "final_no_captions.mp4")
plan = list(csv.DictReader(open(J("edit_plan.csv"))))
for r in plan: r["a"], r["b"] = float(r["start"]), float(r["end"])
T_TALK = duration(); END = max(r["b"] for r in plan); NF = int(round(END * FPS))
man = json.load(open(J("overlays", "manifest.json")))

ease_out = lambda x: 1 - (1 - min(max(x, 0), 1)) ** 3
def ease_back(x, s=2.0):
    x = min(max(x, 0), 1) - 1; return 1 + (s + 1) * x ** 3 + s * x ** 2

def load(key):
    m = man[key]; x0, y0, x1, y1 = m["bbox"]; x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(W, x1), min(H, y1)
    im = cv2.imread(J("overlays", m["file"]), cv2.IMREAD_UNCHANGED)[y0:y1, x0:x1]
    a = im[..., 3:4].astype(np.float32) / 255
    return {"rgb": cv2.cvtColor(im[..., :3], cv2.COLOR_BGR2RGB).astype(np.float32) * a, "a": a, "x": x0, "y": y0}
OV = {k: load(k) for k in man}

def comp(frame, key, scale=1.0, alpha=1.0, dx=0.0, dy=0.0, mask=None):
    if alpha <= 0.003: return
    o = OV[key]; rgb, a = o["rgb"], o["a"]; h, w = a.shape[:2]
    if abs(scale - 1) > 1e-3:
        nw, nh = max(2, int(w * scale)), max(2, int(h * scale))
        rgb = cv2.resize(rgb, (nw, nh)); a = cv2.resize(a, (nw, nh))[..., None]
        x = o["x"] + (w - nw) / 2 + dx; y = o["y"] + (h - nh) / 2 + dy; w, h = nw, nh
    else:
        x, y = o["x"] + dx, o["y"] + dy
    x, y = int(round(x)), int(round(y))
    fx0, fy0, fx1, fy1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if fx1 <= fx0 or fy1 <= fy0: return
    sr = rgb[fy0 - y:fy1 - y, fx0 - x:fx1 - x] * alpha; sa = a[fy0 - y:fy1 - y, fx0 - x:fx1 - x] * alpha
    if mask is not None:                      # mask = foreground (her) alpha: logo only shows where she is not
        keep = 1 - mask[fy0:fy1, fx0:fx1]; sr = sr * keep; sa = sa * keep
    dst = frame[fy0:fy1, fx0:fx1].astype(np.float32)
    frame[fy0:fy1, fx0:fx1] = (sr + dst * (1 - sa)).clip(0, 255).astype(np.uint8)

def keys_for(r):
    a, t = r["asset"], r["overlay_text"]
    if a == "title": return ["title_department"] if "Audiology" in t else ["title_hearing_aids"]
    if a == "tag": return ["tag_audiometry"] if t == "AUDIOMETRY" else ["tag_tympanometry"]
    return {"emoji:👂": ["badge_ear"], "earplug": ["earplugs"], "emoji:🔊": ["badge_noise"],
            "emoji:💧": ["badge_water"], "name": ["name_hala"]}[a]
overlays = [(r, k) for r in plan if r["layer"] == "overlay" for k in keys_for(r)]

def draw_overlay(frame, r, key, t):
    a, b = r["a"], r["b"]
    if not (a <= t < b + 0.25): return
    anim = r["animation"]
    if t >= b:                                  # fade + slight drop on exit
        x = (t - b) / 0.25; comp(frame, key, 1 - 0.04 * x, 1 - ease_out(x), 0, 10 * x); return
    if anim == "pop":
        x = (t - a) / 0.28; comp(frame, key, 0.4 + 0.6 * ease_back(x), ease_out(x * 2))
    else:   # rise: fade up 40 px; titles carry their accent line, which draws in after the text
        x = (t - a) / 0.4; comp(frame, key, 1, ease_out(x * 1.4), 0, 40 * (1 - ease_out(x)))

logo_rows = [r for r in plan if r["layer"] == "logo"]
def draw_logo(frame, t, f):
    for r in logo_rows:
        a, b = r["a"], r["b"]
        if not (a <= t < b + 0.3): continue
        p = J("mattes", f"{f:05d}.png")
        mask = cv2.resize(cv2.imread(p, 0), (W, H)).astype(np.float32)[..., None] / 255 if os.path.exists(p) else None
        if t < b:
            x = (t - a) / 0.3; comp(frame, "logo_wall", 0.8 + 0.2 * ease_back(x), ease_out(x * 1.6), mask=mask)
        else:
            comp(frame, "logo_wall", 1, 1 - ease_out((t - b) / 0.3), mask=mask)

def reader(path, start=0.0, fps=FPS):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", str(start), "-i", path, "-vf",
                          f"fps={fps},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    while True:
        buf = p.stdout.read(W * H * 3)
        if len(buf) < W * H * 3: break
        yield np.frombuffer(buf, np.uint8).reshape(H, W, 3)

BROLL_FROM = {"RIB_0139": 2.0, "RIB_0141": 4.0, "RIB_0140": 3.0}
broll_rows = [r for r in plan if r["layer"] == "broll"]
broll_frames = {}
def broll_frame(r, t):
    k = r["asset"]
    if k not in broll_frames:
        n = int((r["b"] - r["a"]) * FPS) + 2; it = reader(J("source", k + ".MP4"), BROLL_FROM[k])
        broll_frames[k] = [next(it) for _ in range(n)]
    fr = broll_frames[k]; img = fr[min(len(fr) - 1, int((t - r["a"]) * FPS))]
    z = 1.0 + 0.05 * (t - r["a"]) / (r["b"] - r["a"])       # slow push-in on the B-roll only
    M = np.float32([[z, 0, W / 2 * (1 - z)], [0, z, H / 2 * (1 - z)]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

outro = next(r for r in plan if r["layer"] == "outro")
def draw_outro(frame, t):
    """Claudia end card (no Arabic line): logo, then WhatsApp label + number box, then the four branches."""
    k = t - outro["a"] - 0.15; sp = lambda i: ease_out((k - i * 0.3) / 0.5)
    comp(frame, "end_logo", 0.94 + 0.06 * sp(0), sp(0))
    comp(frame, "end_whatsapp", 1, sp(1), 0, 30 * (1 - sp(1)))
    comp(frame, "end_branches", 1, sp(2), 0, 20 * (1 - sp(2)))

def audio_graph():
    ev = []
    for r in plan:
        if r["sound_effect"]: ev.append((r["sound_effect"], r["a"] + (0.0 if r["sound_effect"] != "whoosh" else -0.08)))
    vol = {"pop": -14, "whoosh": -19, "ding": -15}
    inputs = ["-i", J("01_clean.mp4")]; fg = []; labels = []
    for i, (s, t) in enumerate(ev):
        inputs += ["-i", J("sfx", f"{s}.wav")]; ms = int(max(0, t) * 1000)
        fg.append(f"[{i+1}:a]aresample=48000,aformat=channel_layouts=stereo,volume={vol[s]}dB,adelay={ms}|{ms}[s{i}]")
        labels.append(f"[s{i}]")
    fg.append(f"[0:a]aresample=48000,afade=t=out:st={T_TALK-0.3:.2f}:d=0.3,apad=whole_dur={END}[v]")
    fg.append(f"[v]{''.join(labels)}amix=inputs={1+len(labels)}:normalize=0:duration=first,atrim=0:{END}[mix]")
    return inputs, fg

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
                x = 0.5 - 0.5 * math.cos(math.pi * min(1, (t - c) / self.dur))
                img = (self.freeze.astype(np.float32) * (1 - x) + img.astype(np.float32) * x).astype(np.uint8)
        self.prev = raw
        return np.ascontiguousarray(img)

def main():
    inputs, fg = audio_graph()
    g = ";".join(fg) + ";[mix]loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[o]"
    r = subprocess.run(["ffmpeg", "-y"] + inputs + ["-filter_complex", g, "-map", "[o]", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    m = json.loads(r[r.rfind("{"):r.rfind("}") + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    afg = re.sub(r"\[(\d+):a\]", lambda mm: f"[{int(mm.group(1)) + 1}:a]", ";".join(fg))
    afg += f";[mix]{ln},aresample=48000,asplit[aout][aclean]"
    ass = J("captions.ass").replace(":", r"\:")
    vf = (f"[0:v]split[vc][vn];[vc]ass={ass}:fontsdir={J('fonts')},format=yuv420p[vout];[vn]format=yuv420p[vclean]")
    enc = ["-c:v", "libx264", "-preset", "ultrafast" if PREVIEW else "slow", "-crf", "28" if PREVIEW else "16",
           "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart"]
    cmd = (["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
           + inputs + ["-filter_complex", vf + ";" + afg,
                       "-map", "[vout]", "-map", "[aout]"] + enc + ["-t", f"{END:.3f}", OUT,
                       "-map", "[vclean]", "-map", "[aclean]"] + enc + ["-t", f"{END:.3f}", OUT_CLEAN])
    enc_p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    src = reader(J("01_clean.mp4")); last = None
    cuts = [sg["out_start"] for sg in json.load(open(J("segments.json")))[1:]]
    cuts += [r["a"] for r in broll_rows] + [r["b"] for r in broll_rows]
    mix = Mix(cuts)
    for f in range(NF):
        t = f / FPS
        if t < T_TALK:
            base = next(src, None)
            if base is None: base = last
            last = base
            br = next((r for r in broll_rows if r["a"] <= t < r["b"]), None)
            img = (broll_frame(br, t) if br else base).copy()
            if not br: draw_logo(img, t, f)
            img = mix.apply(img, t)                     # guide transition "Mix" at every cut / B-roll edge
            for r, k in overlays: draw_overlay(img, r, k, t)
        else:
            x = (t - T_TALK) / 0.3                      # quick fade to the white end card
            img = (last.astype(np.float32) * (1 - ease_out(x)) + 255 * ease_out(x)).astype(np.uint8)
            img = np.ascontiguousarray(img); draw_outro(img, t)
        enc_p.stdin.write(img.tobytes())
        if f % 300 == 0: print(f"  frame {f}/{NF}", flush=True)
    enc_p.stdin.close(); enc_p.wait()
    if enc_p.returncode: sys.exit("encode failed")
    print("wrote", OUT, "and", os.path.basename(OUT_CLEAN), f"({END:.2f}s)")

if __name__ == "__main__":
    main()
