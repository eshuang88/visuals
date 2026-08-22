#!/usr/bin/env bash
# Build the seamless ~30 s loop for track 07 from a raw source clip, then bake
# the taint-free data: URI.
#
#   ./build-loop.sh assets/source.mp4     # or pass any source path
#
# Produces: assets/drive-taitung.mp4  (H.264), assets/drive-taitung.webm (VP9),
#           assets/drive-taitung.webm.b64.js  (data: URI for offline file://).
#
# The tail crossfades back into the head (length L) so the loop wraps with no
# visible seam. Target length T≈30 s; if the source is shorter, the whole clip
# is looped instead of trimmed.
set -euo pipefail
cd "$(dirname "$0")"

SRC="${1:-assets/source.mp4}"
[ -f "$SRC" ] || { echo "source not found: $SRC (drop it in assets/, see assets/README.md)"; exit 1; }

L=1.0            # crossfade seconds
T=30             # target loop seconds
MP4=assets/drive-taitung.mp4
WEBM=assets/drive-taitung.webm

DUR=$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$SRC" 2>/dev/null \
      || ffmpeg -i "$SRC" 2>&1 | awk -F'[:,]' '/Duration/{print $2*3600+$3*60+$4; exit}')
echo "source duration: ${DUR}s"

# usable body length = min(T, DUR) ; head crossfade of length L folds onto the tail
BODY=$(awk -v d="$DUR" -v t="$T" 'BEGIN{ b=(d<t)?d:t; printf "%.3f", b }')
OFF=$(awk -v b="$BODY" -v l="$L" 'BEGIN{ printf "%.3f", b-l }')   # where the faded head lands
echo "loop body: ${BODY}s (crossfade ${L}s -> seamless)"

ffmpeg -y -i "$SRC" -t "$BODY" -filter_complex \
 "[0:v]scale=1280:-2:flags=lanczos,setsar=1,fps=30,split=2[m][h];\
  [m]trim=start=${L}:end=${BODY},setpts=PTS-STARTPTS[mid];\
  [h]trim=start=0:end=${L},setpts=PTS-STARTPTS,format=yuva420p,fade=t=in:st=0:d=${L}:alpha=1,setpts=PTS+${OFF}/TB[hd];\
  [mid][hd]overlay=format=auto,format=yuv420p[out]" \
 -map "[out]" -an -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart "$MP4"

ffmpeg -y -i "$MP4" -an -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -pix_fmt yuv420p "$WEBM"

node build-video-datauri.js
echo "done: $MP4 / $WEBM (+ b64.js)"
