# assets — IL_driveTaitung

Source footage: **IL_driveTaitung** — a driving clip from Taitung (dash / hand-held).
It is turned into a **seamless ~30 s loop** and downscaled to 1280-wide, then that
one loop feeds the live WebGL scene.

## Drop the source clip here

Commit your original clip into **this folder** as `assets/source.<ext>`
(e.g. `assets/source.mp4` or `assets/source.mov`) and push to the branch. Claude
then cuts the seamless 30 s loop, builds the taint-free `data:` URI, wires it into
`setlist.js`, and rebuilds `player.html`. (Anything named `source.*` is treated as
the raw input and is not projected directly.)

| file | what | committed? |
|------|------|------------|
| `source.<ext>`               | raw input clip you drop here                    | yes (input) |
| `drive-taitung.mp4`          | seamless ~30 s loop, H.264 (universal)          | yes (built) |
| `drive-taitung.webm`         | seamless ~30 s loop, VP9 (smaller, Chromium)    | yes (built) |
| `drive-taitung.webm.b64.js`  | the webm inlined as a taint-free `data:` URI    | yes (generated) |

## Why the base64 file exists

The live scene samples the footage as a WebGL texture. A `<video>` loaded from a
`file://` URL **taints the canvas cross-origin**, which makes `texImage2D` throw —
so opening `index.html` directly on a projection laptop would render black. A
`data:` URI does **not** taint, so the loop is inlined as base64 and the track runs
from pure `file://` with **no flags and no server** (per CLAUDE.md's
"offline from `file://`" rule). `build.js` inlines this `.js` into the flattened
`dist` file, so the show file stays a single piece.

Regenerate it whenever `drive-taitung.webm` changes:

```
node build-video-datauri.js
```

## Building the seamless 30 s loop from the source clip

`L` = crossfade length (1.0 s); output starts & ends on the frame at `L` so the
tail dissolves back into the head → no visible seam. `T` = target loop length
(≈ 30 s). If the source is shorter than `T`, drop `-t T`/`--to` and just loop the
whole clip; if longer, it is trimmed to `T`.

```
# 30 s seamless loop @ 1280-wide, H.264
ffmpeg -i assets/source.mp4 -t 31 -filter_complex \
 "[0:v]scale=1280:-2:flags=lanczos,setsar=1,fps=30,split=2[m][h];\
  [m]trim=start=1.0:end=31,setpts=PTS-STARTPTS[mid];\
  [h]trim=start=0:end=1.0,setpts=PTS-STARTPTS,format=yuva420p,fade=t=in:st=0:d=1.0:alpha=1,setpts=PTS+29/TB[hd];\
  [mid][hd]overlay=format=auto,format=yuv420p[out]" \
 -map "[out]" -an -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart \
 assets/drive-taitung.mp4
# VP9 sibling
ffmpeg -i assets/drive-taitung.mp4 -an -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -pix_fmt yuv420p \
 assets/drive-taitung.webm
node build-video-datauri.js
```
