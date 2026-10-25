#!/usr/bin/env bash
# Re-run the whole edit. Phase 1 (Whisper, slow) only runs if transcript_raw.json is missing.
set -euo pipefail
cd "$(dirname "$0")"
[ -f ../transcript_raw.json ] || python3 01_transcribe.py
python3 01b_fix_and_map.py >/dev/null
python3 02_clean_cut.py
python3 03_edit_plan.py
python3 04_graphics.py
python3 05_captions.py
python3 06_broll_list.py
python3 07a_sfx.py
python3 07_assemble.py "$@"
python3 08_qc.py
python3 09_extras.py
