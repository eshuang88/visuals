# assets — IL_driveTaitung

Source footage: **IL_driveTaitung** — a driving clip from Taitung (dash / hand-held),
~14.7 s, shot 10-bit **HLG / HDR** (bt2020). It is tonemapped to SDR and turned
into a **seamless ~14 s loop** (the source length), which feeds the live WebGL
scene. The scene's non-wrapping drift/grade makes it read as continuous driving
well past 30 s; if you want the *file* to literally span ~30 s, `build-loop.sh`
can seam-tile it 2× (seamless throughout).

## Drop the source clip here

Commit your original clip into **this folder** as `assets/source.<ext>`
(e.g. `assets/source.mp4` or `assets/source.mov`) and push to the branch. Claude
then cuts the seamless loop, builds the taint-free `data:` URI, wires it into
`setlist.js`, and rebuilds `player.html`. (Anything named `source.*` is treated as
the raw input and is not projected directly.)

| file | what | committed? |
|------|------|------------|
| `source.mov`                 | raw HLG/HDR input clip (~14.7 s)                | yes (input) |
| `drive-taitung.mp4`          | seamless ~14 s loop, H.264 1280w (quality)      | yes (built) |
| `drive-taitung.webm`         | seamless ~14 s loop, VP9 1024w (inlined clip)   | yes (built) |
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

## Rebuilding the loop from the source clip

Use the track's script — it tonemaps HDR→SDR, cuts the seamless crossfade loop,
makes the 1024-wide VP9 clip, and bakes the `data:` URI in one go:

```
# from tracks/07-drive-taitung/ — HDR=1 because the source is 10-bit HLG
HDR=1 ./build-loop.sh assets/source.mov
```

Under the hood: `L` = crossfade length (1.0 s); the tail dissolves back into the
head so the loop wraps with no visible seam (the loop point sits at source t=L).
`T` = target loop length (≈ 30 s); a source shorter than `T` (this clip, ~14.7 s)
is looped whole. The head clip is delayed to `BODY - 2L` and the output runs
`BODY - L`. Drop `HDR=1` for an already-SDR source.
