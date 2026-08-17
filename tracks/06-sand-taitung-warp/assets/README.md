# assets — IL_sandTaitung_warp

Source footage: **IL_001_sandOcean_flowWarp** — an aerial clip of a black-sand
tidal flat (Taitung), ~11.7 s. It was optimized into a **seamless ~10.7 s loop**
(the last second crossfades back to the head, so it wraps with no visible seam)
and downscaled to 1280-wide. This is the shared source for **both** halves of the
track — the live WebGL scene and the rendered film.

| file | what | committed? |
|------|------|------------|
| `sand-taitung.mp4`         | seamless loop, H.264 (universal / render input) | yes |
| `sand-taitung.webm`        | seamless loop, VP9 (smaller, Chrome/Chromium)   | yes |
| `sand-taitung.webm.b64.js` | the webm inlined as a taint-free `data:` URI    | yes (generated) |

## Why the base64 file exists

The live scene samples the footage as a WebGL texture. A `<video>` loaded from a
`file://` URL **taints the canvas cross-origin**, which makes `texImage2D` throw —
so opening `index.html` directly on a projection laptop would render black. A
`data:` URI does **not** taint, so the loop is inlined as base64 and the track
runs from pure `file://` with **no flags and no server** (per CLAUDE.md's
"offline from `file://`" rule). `build.js` inlines this `.js` into the flattened
`dist` file, so the show file stays a single piece.

Regenerate it whenever `sand-taitung.webm` changes:

```
node build-video-datauri.js
```

## Rebuilding the loop from a new source clip

```
# D = source duration, L = crossfade (1.0s). Output starts & ends on frame @L → seamless.
ffmpeg -i SOURCE.mov -filter_complex \
 "[0:v]scale=1280:-2:flags=lanczos,setsar=1,split=2[m][h];\
  [m]trim=start=1.0:end=D,setpts=PTS-STARTPTS[mid];\
  [h]trim=start=0:end=1.0,setpts=PTS-STARTPTS,format=yuva420p,fade=t=in:st=0:d=1.0:alpha=1,setpts=PTS+(D-2)/TB[hd];\
  [mid][hd]overlay=format=auto,format=yuv420p[out]" \
 -map "[out]" -an -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart sand-taitung.mp4
ffmpeg -i sand-taitung.mp4 -an -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -pix_fmt yuv420p sand-taitung.webm
node build-video-datauri.js
```
