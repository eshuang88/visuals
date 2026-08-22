# 07 — IL_oceanShore_chroma

A **footage** track built on the source clip **IL_oceanShore**: a high-angle
shoreline — teal open sea, a broad band of breaking white surf, and wet
grey-green sand laced with lacy foam. *Moonvoid* threshold / atmosphere crossed
with the flicker family, pushed into a **grainy, retro, chroma-split** register
at the user's request. The palette is pulled low-saturation into the canonical IL
family (near-black sand · desaturated-blue / ice water · warm-white foam crests).

## The loop (assets/)

The source is only ~9.3 s and, being handheld, the camera tilts and rolls right
through it (a bright sky enters the frame past ~8 s). So the shared loop is a
**boomerang** (forward + reverse) cut from the sky-free window **3.3–7.6 s**:
because the reverse retraces the exact camera path, it is seam-free at both ends
(no crossfade ghosting between mismatched framings), and the velocity turn reads
as the tide breathing in and out. It runs foam → open teal sea → foam and back,
a seamless **~8.5 s** loop, downscaled to 960×720 (softness suits the retro look
and keeps the busy foam compressible). See `assets/README.md` to rebuild it.

## Live WebGL scene — `index.html`

The real loop plays as a GL texture, treated in the house style and pushed into
the requested look:

- **chroma** — the "chroma filter": radial **chromatic aberration** (R/B fringe
  out from the centre, heavier toward the edges) plus a horizontal VHS-style
  chroma bleed. Both breathe on the ~30 s cycle and swell with `u_bass`.
- **retro** — coarse animated **film grain** (density modulated per the flicker
  family, living mostly in the mids/foam), a slow **rolling exposure bar** and
  film-**gate weave**, faint scanline structure, warm-white **halation** off the
  foam crests.
- **flow-warp** — the sampling UV is domain-warped by `u_flow` (+ `u_bass`), so
  the water liquefies a touch beyond its own motion. Emotion sync, not beat sync.
- **framing** — `texCoverUV()` fits the 4:3 clip; a slow drift pans a slight
  zoom-crop so no two passes of the loop frame identically.
- **grade** — the source is high-key (bright foam), so it is pulled *down* into
  the near-black house range with a soft highlight knee (foam stays luminous, not
  clipped), upper-mids cooled toward ice, then `ambientPost` (bass swell,
  S-grade, vignette, film grain).

The footage loops every ~8.5 s but the treatment cycle is **~30 s**, and
`u_flow` / `u_time` never wrap — so the chroma breath, drift, warp phase and
exposure keep evolving. A 30-second loop that stays alive well past it, never a
hard cut. Audio-reactive (mic bass, 115 BPM fallback).

Open `index.html` — it runs from pure `file://` (the loop is inlined as a
taint-free `data:` URI; see `assets/README.md`).

## In the concert player

This track is a real `visual-core.js` scene, so it drops straight into the
keyboard-driven set player: it is listed in `setlist.js`; `node build-player.js`
pulls its `<script id="scene">` shader and inlines the loop's `data:` URI into
`player.html`. Nothing else to wire up.
