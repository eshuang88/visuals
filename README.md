# Imaginary Lands — Visuals

Ambient-techno live visuals. One WebGL piece per track — 4:3, fullscreen,
seamless, audio-reactive (mic bass with a per-track BPM fallback).

**Read [`CLAUDE.md`](./CLAUDE.md) for the visual system and conventions.**

## Run

Open `index.html` (gallery) or any `tracks/NN-<song>/index.html` in a browser and
click to start. No build or server needed — click grants fullscreen + mic; with
no mic/signal it undulates at the track's default BPM (115).

Shortcuts: `F` fullscreen · `H` toggle HUD.

## Tracks

- `tracks/01-chrome-sands/` — creamy liquid chrome (115 BPM)
- `tracks/_template/` — starter to copy for a new song

## New track

```
cp -r tracks/_template tracks/02-<song>
# edit the #scene shader + title/bpm, then:
node build.js 02-<song>      # -> dist/02-<song>.html  (single self-contained file for the show)
```

`node build.js` with no argument flattens every track.
