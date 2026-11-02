#!/usr/bin/env bash
# Append a brand end card to a finished video (e.g. a CapCut export).
# Usage: scripts/append-outro.sh <input.mp4> <laservision|zvc> <output.mp4>
set -euo pipefail

in="$1"; brand="$2"; out="$3"
case "$brand" in
  laservision) comp="Outro-LaserVision" ;;
  zvc) comp="Outro-ZVC" ;;
  *) echo "brand must be laservision or zvc" >&2; exit 1 ;;
esac

cd "$(dirname "$0")/.."
outro="out/outro-$brand.mp4"
npx remotion render src/index.ts "$comp" "$outro" >/dev/null 2>&1

# Match the outro to the input's size and frame rate, give it silent audio, then join.
IFS=, read -r w h fps < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "$in")
has_audio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$in" | head -1)

if [ -n "$has_audio" ]; then
  ffmpeg -loglevel error -y -i "$in" -i "$outro" -f lavfi -t 5 -i anullsrc=r=48000:cl=stereo -filter_complex \
    "[0:v]scale=$w:$h,setsar=1,fps=$fps,format=yuv420p[v0];[1:v]scale=$w:$h:force_original_aspect_ratio=decrease,pad=$w:$h:(ow-iw)/2:(oh-ih)/2:color=0x00303F,setsar=1,fps=$fps,format=yuv420p[v1];[0:a]aresample=48000,aformat=channel_layouts=stereo[a0];[2:a]atrim=duration=2.5[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" \
    -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -movflags +faststart "$out"
else
  ffmpeg -loglevel error -y -i "$in" -i "$outro" -filter_complex \
    "[0:v]scale=$w:$h,setsar=1,fps=$fps,format=yuv420p[v0];[1:v]scale=$w:$h:force_original_aspect_ratio=decrease,pad=$w:$h:(ow-iw)/2:(oh-ih)/2:color=0x00303F,setsar=1,fps=$fps,format=yuv420p[v1];[v0][v1]concat=n=2:v=1:a=0[v]" \
    -map "[v]" -c:v libx264 -crf 18 -preset medium -movflags +faststart "$out"
fi
echo "$out"
