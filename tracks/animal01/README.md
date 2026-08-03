# animal01 — animal memory film (Zayn direction)

A ~50s montage of lived animal photos + a squirrel clip, treated as a memory
film: projector flicker / exposure breathing, heavy film grain, halation,
vignette, a cold unifying grade, and a slow push on each still. Photos and
videos of any aspect are fitted into a 4:3 frame with a blurred fill behind
them, so nothing gets cropped. This is the **footage** half of the project
(see the Reference Report / CLAUDE.md) — a companion to the generative shader
tracks, not a WebGL loop.

## Build

```
python3 render.py            # -> out/track_animal01.mp4   (1440x1080, full quality)
python3 render.py --preview  # also out/track_animal01_preview.mp4  (<30MB, for chat/sharing)
```

Only `ffmpeg`/`ffprobe` are required. `out/` is gitignored (rebuild anytime).

## Add / reorder shots

1. Drop the file into `assets/` (photo: jpg/png/webp; short video: mov/mp4).
2. Add a line to `shots.txt`, in the order you want it on screen:

   ```
   file | dur | bright | sat | gamma
   ```

   - `dur` — seconds to hold a photo (~5 is the house default); for a video use
     `full` to keep its native length, or a number to trim it.
   - `bright` — darken a too-bright photo here (e.g. `-0.12`); keep it near the
     others so the film stays tonally consistent. `sat` / `gamma` are optional.
3. `python3 render.py`. Reordering = reordering the lines. That's the whole loop.

Scales fine to 20–30+ shots — the film just gets longer (≈ sum of durations).
At ~5s each, 25 photos + a few clips ≈ a 2–3 minute piece.

## Tune the whole-film look

The grade, grain, projector flicker, halation and vignette are global constants
at the top of `render.py` (`GRAIN`, `FLICKER`, `VIGNETTE`, `BLOOM`, `XFADE`,
the slow-push `ZOOM_*`). Change them once and every shot follows — that's how
shots stay consistent. For a punchier flicker, raise the amplitudes in `FLICKER`;
for heavier grain, raise `GRAIN`.
