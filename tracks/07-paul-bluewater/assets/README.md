# assets — IL_paulBlueWater

Source footage: **IL_paulBlueWater** — a thin sheet of water washing a pale stone
floor, sky reflected blue on one side and a glassy rippled boundary drifting across
the frame, ~5.4 s. It was slowed slightly (≈1.7×, for a calmer ambient drift) and
optimized into a **seamless ~7.9 s loop** (the last ~1.2 s crossfades back to the
head, so it wraps with no visible seam) at 1280-wide. This is the shared source for
**both** halves of the track — the live WebGL scene and the rendered film.

| file | what | committed? |
|------|------|------------|
| `paul-bluewater.mp4`         | seamless loop, H.264 (universal / render input) | yes |
| `paul-bluewater.webm`        | seamless loop, VP9 (smaller, Chrome/Chromium)   | yes |
| `paul-bluewater.webm.b64.js` | the webm inlined as a taint-free `data:` URI    | yes (generated) |

## Why the base64 file exists

The live scene samples the footage as a WebGL texture. A `<video>` loaded from a
`file://` URL **taints the canvas cross-origin**, which makes `texImage2D` throw —
so opening `index.html` directly on a projection laptop would render black. A
`data:` URI does **not** taint, so the loop is inlined as base64 and the track runs
from pure `file://` with **no flags and no server** (per CLAUDE.md's "offline from
`file://`" rule). `build.js` / `build-player.js` inline this into the flattened
`dist` / `player.html` file, so the show file stays a single piece.

Regenerate it whenever `paul-bluewater.webm` changes:

```
node build-video-datauri.js
```

## Rebuilding the loop from a new source clip

```
# Slow ~1.7x for a calmer drift, normalize to 30fps, scale to 1280 wide.
ffmpeg -i SOURCE.mov -an -filter_complex \
 "[0:v]setpts=1.7*PTS,fps=30,scale=1280:-2:flags=lanczos,setsar=1[v]" \
 -map "[v]" -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p _slowed.mp4

# D = slowed duration, L = crossfade (1.2s). Output starts & ends on frame @L → seamless.
ffmpeg -i _slowed.mp4 -filter_complex \
 "[0:v]split=2[m][h];\
  [m]trim=start=1.2:end=D,setpts=PTS-STARTPTS[mid];\
  [h]trim=start=0:end=1.2,setpts=PTS-STARTPTS,format=yuva420p,fade=t=in:st=0:d=1.2:alpha=1,setpts=PTS+(D-2.4)/TB[hd];\
  [mid][hd]overlay=format=auto,format=yuv420p[out]" \
 -map "[out]" -an -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -movflags +faststart paul-bluewater.mp4

ffmpeg -i paul-bluewater.mp4 -an -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 -pix_fmt yuv420p paul-bluewater.webm
node build-video-datauri.js
```
