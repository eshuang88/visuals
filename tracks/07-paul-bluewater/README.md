# 07 — IL_paulBlueWater

A **footage** track built on the source clip **IL_paulBlueWater**: a thin sheet of
water washing a pale stone floor — sky reflected as a soft blue field on one side,
a glassy rippled boundary drifting across the frame, a dark reflective pool on the
other. *Floating Points* (surface tension, reflection, emergence) crossed with
*Moonvoid* (threshold / wet atmosphere). The clip is bright and high-key, so it is
graded **down** into the house mood rather than opened up: near-black base, the
blue reflection kept as a cool low-saturation body, warm-white only on the crests.
Palette stays canonical `IL_*` and low-saturation.

This track ships in **two halves** from one shared loop in `assets/`.

## 1. Live WebGL scene — `index.html` (the file the player uses)

The real loop plays as a GL texture, treated in the house style and pushed
further: a **flow-warp** liquefies the reflection (domain-warp on the sampling UV,
breathing with `u_bass`), a slow drifting 4:3 crop so no two passes frame alike, a
cool graphite/blue grade with a faint **ice→violet iridescent sheen** riding only
the glassy boundary (a soap-film breath, kept sparing and low-sat so it never reads
as rainbow), warm-white halation on the brightest floor crests, then `ambientPost`
(bass swell, S-grade, vignette, film grain). The loop is seamless and `u_flow`
never wraps, so it stays alive indefinitely — reading as a continuous **30 s+ loop**
with no cut and no hard repeat. Audio-reactive (mic bass, 115 BPM fallback).

Open `index.html` — it runs from pure `file://` (the footage is inlined as a
taint-free `data:` URI; see `assets/README.md` for why).

The live scene uses the engine's **additive** video feature — `Ambient.start({ video })`
binds a looping `<video>` to `u_tex` / `texCoverUV()`. Generative tracks pass no
video and are unaffected.

### In the concert player

This track is **visual-core-authored**, so it drops straight into the keyboard
player: it is listed in `setlist.js` and `node build-player.js` inlines its scene +
loop (as a `data:` URI) into `player.html`. Nothing else is needed — the shared
`lib/player-core.js` treats every footage track the same. 4:3, letterboxed on any
projector.

## 2. Rendered 30 s loop film — `render.py` (the literal "30 秒 loop")

```
python3 render.py            # -> out/track_paulBlueWater.mp4          (1440x1080)
python3 render.py --preview  # also -> out/..._preview.mp4            (small, for sharing)
```

A self-contained **30-second seamless file** to drop into Resolume / a projector as
a plain clip when you don't want the live player. It fits the loop to 4:3 with a
slow pan, lays a gentle `displace` flow-warp over it, grades it into the house look
(deep cool body, blue reflection, warm-white halation, vignette, film grain, a slow
non-metronomic exposure breath) and loops the seamless clip out to 30 s. Because the
loop is seamless and the pan / grade / warp evolve as slow functions of time, the
repeats read as continuous drift, not a hard loop, and the file itself loops cleanly
end-to-end. Only `ffmpeg` is required; `out/` is gitignored. Tune the whole-film
look via the constants at the top of `render.py`.
