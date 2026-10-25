# Contact-lens tips reel: edit pipeline

Source: Google Drive `RIB_0123.MP4` (Lebanese Arabic, 1080x1920, 50 fps, 37.6 s). Saved read-only as
`edit/source/RIB_0123.MP4`, with a working copy at `edit/video.mp4`. The original is never modified.

Run everything: `bash edit/scripts/run_all.sh` (add `--preview` for a fast low-quality render).

| Script | Phase | Output |
|---|---|---|
| `01_transcribe.py` | Probe + Whisper large-v3, word timestamps | `probe.json`, `transcript_raw.json` |
| `01b_fix_and_map.py` | Manual corrections + 7-tip map | `transcript.json`, `transcript.txt`, `tips.json` |
| `02_clean_cut.py` | Cut silences >0.4 s (0.1 s pad), lead-in and outtake; denoise, compressor, -14 LUFS | `01_clean.mp4`, `segments.json` |
| `03_edit_plan.py` | Word-anchored edit plan | `edit_plan.csv` |
| `04_graphics.py` | Pillow overlays (Outfit font, #00B4D8) | `overlays/*.png`, `overlays/manifest.json` |
| `05_captions.py` | Arabic ASS captions (max 4 words, pop-in, keyword colour) | `captions.ass` |
| `06_broll_list.py` | B-roll slots + status | `broll_list.md` |
| `07a_sfx.py` / `07_assemble.py` | SFX + final assembly | `sfx/*.wav`, `final.mp4` |
| `08_qc.py` | Frames every 3 s + loudness/clipping check | `qc/` |
| `09_extras.py` | Editor markers + post caption | `markers.csv`, `markers.edl`, `markers_resolve.edl`, `post_caption.md` |

Drop-in folders: `broll/` (name clips `broll_01.mp4` … `broll_10.mp4`), `music/` (any .mp3/.wav/.m4a; mixed at -22 dB
with ducking), `sfx/` (replace `pop.wav`, `buzzer.wav`, `whoosh.wav`). Then re-run from `03_edit_plan.py` on.
