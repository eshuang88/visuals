#!/usr/bin/env bash
# Build the seamless loop for track 07 from a raw source clip, then bake the
# taint-free data: URI.
#
#   ./build-loop.sh assets/source.mov          # SDR source
#   HDR=1 ./build-loop.sh assets/source.mov    # tonemap HLG/HDR (bt2020) -> SDR
#
# Produces: assets/drive-taitung.mp4  (H.264, 1280w quality master),
#           assets/drive-taitung.webm (VP9, 1024w — the small clip inlined into
#                                      the data: URI and player.html),
#           assets/drive-taitung.webm.b64.js  (data: URI for offline file://).
#
# The tail crossfades back into the head (length L) so the loop wraps with no
# visible seam; the loop point sits at source t=L. Target loop length T≈30 s; if
# the source is shorter (this clip is ~14.7 s), the WHOLE clip is looped instead —
# the non-wrapping in-shader drift/grade/scan then mask the repeat past 30 s.
#
# The original IL_driveTaitung clip is 10-bit HLG (HDR, bt2020), so it was built
# with HDR=1. A plain SDR source should NOT set HDR (the tonemap would distort it).
set -euo pipefail
cd "$(dirname "$0")"

SRC="${1:-assets/source.mov}"
[ -f "$SRC" ] || { echo "source not found: $SRC (drop it in assets/, see assets/README.md)"; exit 1; }

L=1.0            # crossfade seconds
T=30             # target loop seconds (cap; source shorter than this loops whole)
MP4=assets/drive-taitung.mp4
WEBM=assets/drive-taitung.webm

# HLG/HDR -> SDR bt709 when HDR=1, else pass colours through untouched.
if [ "${HDR:-0}" = "1" ]; then
  TONEMAP="zscale=t=linear:npl=100,tonemap=hable,zscale=p=bt709:t=bt709:m=bt709:r=tv,format=yuv420p,"
else
  TONEMAP=""
fi

DUR=$(ffmpeg -i "$SRC" 2>&1 | awk -F'[:,]' '/Duration/{print $2*3600+$3*60+$4; exit}')
echo "source duration: ${DUR}s  (HDR=${HDR:-0})"

# usable body length = min(T, DUR); the head crossfade (length L) folds onto the
# tail, so the head clip is delayed to (BODY - 2L) and the output runs (BODY - L).
BODY=$(awk -v d="$DUR" -v t="$T" 'BEGIN{ b=(d<t)?d:t; printf "%.3f", b }')
OFF=$(awk  -v b="$BODY" -v l="$L" 'BEGIN{ printf "%.3f", b-2*l }')
echo "loop body: $(awk -v b="$BODY" -v l="$L" 'BEGIN{printf "%.3f", b-l}')s  (crossfade ${L}s -> seamless)"

ffmpeg -y -i "$SRC" -filter_complex \
 "[0:v]${TONEMAP}scale=1280:-2:flags=lanczos,setsar=1,fps=30,split=2[m][h];\
  [m]trim=start=${L}:end=${BODY},setpts=PTS-STARTPTS[mid];\
  [h]trim=start=0:end=${L},setpts=PTS-STARTPTS,format=yuva420p,fade=t=in:st=0:d=${L}:alpha=1,setpts=PTS+${OFF}/TB[hd];\
  [mid][hd]overlay=format=auto,format=yuv420p[out]" \
 -map "[out]" -an -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -movflags +faststart "$MP4"

# the inlined clip: 1024-wide VP9 (the shader adds grain/scan/chroma, so this is
# plenty and keeps player.html small).
ffmpeg -y -i "$MP4" -an -vf "scale=1024:-2:flags=lanczos" \
 -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 -pix_fmt yuv420p "$WEBM"

node build-video-datauri.js
echo "done: $MP4 / $WEBM (+ b64.js)"
