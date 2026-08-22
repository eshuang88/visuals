# 06 — cave human (footage · grainy retro chroma)

A slow handheld drift across a cave wall, treated as a decaying analog
transmission. This is a **footage** track (like 05) but, unlike 05, it is a real
**visual-core scene** — the clip is a live texture (`u_tex`) that the fragment
shader grades and damages in real time, so it drops straight into `player.html`
and reacts to the mic bass like the generative tracks.

Reference direction: **Moonvoid / Rival Consoles** — the stone as a sculptural
object held in near-black, threshold and fog, dirty low-res atmosphere. Palette
is a deliberate deviation: warmer than canonical — the rock keeps a little
ember/ochre through the cold cast (per CLAUDE.md's per-track license).

## The look (all in the shader)

- **Chroma** — chromatic aberration / VHS chroma bleed, growing toward the edges
  and breathing with `u_flow` + the bass.
- **Retro** — fixed-raster scanlines, faint aperture grille, a dirty head-switch
  band along the very bottom, exposure breathing, rare 2–4-frame dropouts, and a
  sparse drifting tape scratch.
- **Grainy** — the engine's `ambientPost()` grain on top of a crushed, cold
  S-graded image.
- **Cold grade** — luma mapped across `IL_BLACK → IL_BLUE → IL_WARMWHITE` with
  violet sunk into the shadows; the footage's own colour kept low and half-desaturated.

## The loop

`assets/cave-human-loop.mp4` — a **30 s, 4:3, seamless** loop built from the
source clip (`IL_caveHuman.mov`, ~12.6 s, HDR):

1. HDR (HLG/bt2020) tonemapped to SDR bt709,
2. cropped to exact 4:3 and scaled to 960×720,
3. slowed to 15 s, then **palindrome** (forward + reverse) to 30 s — so it drifts
   one way and breathes back with no seam.

To re-cut it, run an equivalent ffmpeg palindrome; keep it 4:3 and seamless.

## Playing it (offline, from `file://`)

A `<video>` loaded from a plain file path is treated as cross-origin, so WebGL
samples it **black**. The fix is a base64 `data:` URI (same-origin, no server):

```
node build-video-datauri.js 06-cave-human    # -> tracks/06-cave-human/video-datauri.js (gitignored)
```

Then either open `tracks/06-cave-human/index.html` directly, or flatten it into a
single self-contained file for the show / Resolume / player.html:

```
node build.js 06-cave-human                  # -> dist/06-cave-human.html (data URI inlined)
```

(Serving the folder over http — `python3 -m http.server` — also works for dev
without the data URI, because then the clip is same-origin.)

Set `bpm` in `index.html`'s `Ambient.start` to the song (currently **112**).
