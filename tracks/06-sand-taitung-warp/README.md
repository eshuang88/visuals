# 06 — IL_sandTaitung_warp

A **footage** track built on the source clip **IL_001_sandOcean_flowWarp**: an
aerial black-sand tidal flat (Taitung) — a dark, water-sheeted field on one side,
a broad band of braided flowing sediment on the other, split by a meandering
near-black waterline, the whole frame slowly warping. *Moonvoid* threshold /
atmosphere crossed with *Floating Points* flow. The palette already sits in the
house family (near-black · graphite-green · muted violet), kept low-saturation.

This track ships in **two halves** from one shared loop in `assets/`:

## 1. Live WebGL scene — `index.html`

The real loop plays as a GL texture, treated in the house style and pushed
further: a **flow-warp** liquefies the sand (domain-warp on the sampling UV,
breathing with `u_bass`), a slow drifting 4:3 crop so no two passes frame alike,
a cold graphite grade with warm-white halation on the dry-sand crests, then
`ambientPost` (bass swell, S-grade, vignette, film grain). The loop is seamless
and `u_flow` never wraps, so it stays alive indefinitely (well past 45 s) with no
cut and no hard repeat. Audio-reactive (mic bass, 115 BPM fallback).

Open `index.html` — it runs from pure `file://` (the footage is inlined as a
taint-free `data:` URI; see `assets/README.md` for why). This is the file the
gallery links, temporarily placed **3rd**.

The live scene uses a small **additive** engine feature — `Ambient.start({ video })`
binds a looping `<video>` to `u_tex` / `texCoverUV()`. Generative tracks pass no
video and are unaffected.

## 2. Rendered 45 s film — `render.py`

```
python3 render.py            # -> out/track_sandTaitung_warp.mp4          (1440x1080)
python3 render.py --preview  # also -> out/..._preview.mp4                (small, for sharing)
```

Fits the loop to 4:3 with a slow pan, lays a gentle `displace` flow-warp over it,
grades it into the house look (cool low-sat body, teal shadows, warm-white
halation, vignette, film grain, a slow non-metronomic exposure breath) and loops
the seamless clip out to **45 s**. Because the loop is seamless and the pan /
grade / warp all evolve as slow functions of time, the "further seconds" past the
~11 s of source read as continuous improvised drift, not a repeat. Only `ffmpeg`
is required; `out/` is gitignored. Tune the whole-film look via the constants at
the top of `render.py`.
