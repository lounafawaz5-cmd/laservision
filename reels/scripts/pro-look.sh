#!/usr/bin/env bash
# "Pro camera" finish for phone footage: color grade + depth-based background blur + sharpen + fine grain.
#   scripts/pro-look.sh in.mp4 out.mp4
#   FLIP=1 scripts/pro-look.sh …            mirror-fix (front-camera footage with backwards text)
#   DEPTH="0.38 0.28 0.45 0.38" scripts/…   blur cutoffs (see depth-weights.py); default suits a far window
# Needs: pip install onnxruntime pillow numpy; Depth Anything V2 small ONNX (downloaded on first run).
# Depth (not person cut-outs) decides the blur, so seated or half-hidden people stay sharp.
# Tune in scripts/depth-weights.py: "far" thresholds = what counts as background (window/outside).
set -euo pipefail
IN=$1; OUT=$2
PRE=""; [ "${FLIP:-0}" = 1 ] && PRE="hflip,"
HERE=$(cd "$(dirname "$0")" && pwd)
WORK=$(mktemp -d)
MODEL=${DEPTH_MODEL:-$HOME/.cache/depth-anything-v2-small.onnx}
[ -f "$MODEL" ] || curl -sSL -o "$MODEL" https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx
mkdir -p "$WORK/src"
ffmpeg -v error -y -i "$IN" -vf "${PRE}scale=1080:1920" -q:v 2 "$WORK/src/%04d.jpg"
python3 -I "$HERE/depth.py" "$MODEL" "$WORK/src" "$WORK"
python3 -I "$HERE/depth-weights.py" "$WORK/depth.npy" "$WORK" ${DEPTH:-}
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$IN")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$IN")
GRADE="hqdn3d=2:2:3:3,colorlevels=rimin=0.035:gimin=0.035:bimin=0.04,curves=master='0/0 0.12/0.09 0.45/0.5 0.8/0.84 1/0.98',eq=saturation=1.12:gamma=1.03,colorbalance=rs=0.02:bs=-0.03:rm=0.03:gm=0.005:bm=-0.03:bh=-0.015,vignette=angle=PI/9"
ffmpeg -v error -y -i "$IN" -framerate 30 -i "$WORK/mid/%04d.png" -framerate 30 -i "$WORK/far/%04d.png" -filter_complex \
 "[0:v]${PRE}$GRADE,split=3[s][b1][b2];[b1]scale=1080:1920,gblur=sigma=3,scale=$W:$H:flags=bicubic,format=yuva420p[m1];[b2]scale=1080:1920,gblur=sigma=10,scale=$W:$H:flags=bicubic,format=yuva420p[m2];[1:v]scale=$W:$H:flags=bicubic,format=gray[wm];[2:v]scale=$W:$H:flags=bicubic,format=gray[wf];[m1][wm]alphamerge[l1];[m2][wf]alphamerge[l2];[s][l1]overlay=format=auto[t1];[t1][l2]overlay=format=auto,unsharp=5:5:0.45,noise=alls=3:allf=t,format=yuv420p[v]" \
 -map "[v]" -map 0:a? -c:v libx264 -preset slow -crf 17 -c:a copy "$OUT"
rm -rf "$WORK"
echo "$OUT"
