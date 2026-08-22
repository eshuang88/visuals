# assets — IL_oceanShore_chroma

Source footage: **IL_oceanShore** — a high-angle shoreline (teal sea · white surf
· wet grey-green sand), ~9.3 s, handheld (the camera tilts/rolls through the clip
and a bright sky enters past ~8 s). It was optimized into a **seamless ~8.5 s
boomerang loop** and downscaled to 960×720.

| file | what | committed? |
|------|------|------------|
| `ocean-shore.mp4`         | seamless loop, H.264 (universal / http fallback) | yes |
| `ocean-shore.webm`        | seamless loop, VP9 (smaller, Chrome/Chromium)    | yes |
| `ocean-shore.webm.b64.js` | the webm inlined as a taint-free `data:` URI     | yes (generated) |

## Why a boomerang instead of a crossfade loop

The clip is handheld: the framing tilts and rolls continuously, so a tail→head
crossfade (as track 06 uses) would dissolve between two very different
compositions and ghost. A **boomerang** (forward then reverse) instead retraces
the exact camera path — it is position-seamless at both ends with no ghosting,
and the one artifact (a velocity reversal at the turn) reads as the tide
breathing in and out, which is on-brand for "texture over time". The window
**3.3–7.6 s** is the sky-free stretch that runs foam → open teal sea.

## Why the base64 file exists

The live scene samples the footage as a WebGL texture. A `<video>` loaded from a
`file://` URL **taints the canvas cross-origin**, which makes `texImage2D` throw —
so opening `index.html` directly on a projection laptop would render black. A
`data:` URI does **not** taint, so the loop is inlined as base64 and the track
runs from pure `file://` with **no flags and no server** (per CLAUDE.md's
"offline from `file://`" rule). `build.js` / `build-player.js` inline this `data:`
URI into the flattened `dist` file and into `player.html`, so the show files stay
one piece.

Regenerate it whenever `ocean-shore.webm` changes:

```
node build-video-datauri.js
```

## Rebuilding the loop from the source clip

`W` = crossfade-free boomerang; pick a sky-free `[start:end]` window, then:

```
# 1) boomerang master (forward + reverse; drop the duplicate turn frame)
ffmpeg -i IL_oceanShore.mov -filter_complex \
 "[0:v]trim=start=3.3:end=7.6,setpts=PTS-STARTPTS,crop=1440:1080:(iw-1440)/2:0,fps=24,format=yuv420p[f];\
  [f]split[f1][f2];[f2]reverse,trim=start=0.0417,setpts=PTS-STARTPTS[r];\
  [f1][r]concat=n=2:v=1[v]" -map "[v]" -an -c:v libx264 -crf 12 -preset medium -pix_fmt yuv420p master.mp4

# 2) delivery encodes (960x720, mild denoise — foam is expensive to compress)
ffmpeg -i master.mp4 -an -vf "scale=960:720,hqdn3d=6:5:8:6" \
  -c:v libvpx-vp9 -b:v 0 -crf 52 -row-mt 1 -deadline good -cpu-used 2 -pix_fmt yuv420p ocean-shore.webm
ffmpeg -i master.mp4 -an -vf "scale=960:720,hqdn3d=6:5:8:6" \
  -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p -movflags +faststart ocean-shore.mp4

node build-video-datauri.js
```

All grain / retro / chroma treatment lives in the **scene shader**, not the clip,
so the footage here stays clean (and compresses better) — the look is applied
live on the GPU.
