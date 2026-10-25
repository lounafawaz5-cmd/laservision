# Audiology department reel (LaserVision)

Sources (Google Drive): RIB_0124 (main take), RIB_0125 (retake of the closing line; she was asked to repeat at 0:39),
B-roll RIB_0139 (audiometer), RIB_0140 (audiometer screen), RIB_0141 (audiometric headphones).

| Script | What it does | Output |
|---|---|---|
| `01_transcribe.py` / `01b_words.py` | Whisper large-v3 + manual fixes | `transcripts/`, `transcript.txt` |
| `02_clean_cut.py` | 0124 (4.37–37.80 s) + 0125 retake, silences >0.4 s cut, takes gain-matched, -14 LUFS | `01_clean.mp4`, `segments.json` |
| `03_edit_plan.py` | B-roll, overlays (pop -> pop sound, slide -> whoosh), logo moments (ding), outro | `edit_plan.csv` |
| `04_graphics.py` | Overlays in LaserVision colours (Outfit), earplug illustration, outro | `overlays/` |
| `05_matte.py` | MediaPipe person matte so the logo sits behind her head | `mattes/` |
| `06_captions.py` | House captions (Tajawal, white, navy glow, #30A4BF keywords, English in CAPS) | `captions.ass`, `captions.srt`, `captions.txt` |
| `07a_sfx.py` / `08_assemble.py` | SFX + assembly | `final.mp4`, `final_no_captions.mp4` |

Fix captions: edit `captions.srt` and save it as `captions_corrected.srt` (same number of lines), then re-run
`06_captions.py` and `08_assemble.py`.
