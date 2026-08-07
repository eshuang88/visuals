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

Each song lives in its own `tracks/NN-<song>/` folder (the show is
**Imaginary Lands**; the repo root is the show, one folder per song — this scales
to the full 30–50 song set). Version history per track is kept by git — no need
for copies or per-version branches.

- `tracks/01-chrome-sands/` — creamy liquid chrome, engine track (115 BPM)
- `tracks/03-thermal-blob/` — thermal fluid gold, 4 tangram blocks, engine track (115 BPM · 30s loop)
- `tracks/04-marble-gold/` — marbled liquid metal, 4 tangram blocks, engine track (115 BPM · 30s loop)
- `tracks/02-la-sunset/` — LA sunset / Moonvoid cinemagraph — *footage half* (2D canvas + video; also `motion.html`, `photo.html`)
- `tracks/05-animal-photo-loop/` — animal memory film — *footage half*, rendered via `render.py` (no live index.html)
- `tracks/_template/` — starter to copy for a new engine-based song

> **Two halves of the show (see `CLAUDE.md`).** The **generative / shader** tracks
> (`01`, `03`, `04`) run on the shared engine in `lib/` — scene shader +
> `Ambient.start()`, ending in `ambientPost()` so they share one house skin.
> `node build.js` flattens each into a single self-contained file for the show.
> The **footage / lived-photo** tracks (`02`, `05`) are a different medium
> (2D canvas / real video) and deliberately don't use the shader engine.

## New track

```
cp -r tracks/_template tracks/06-<song>
# edit the #scene shader + title/bpm, then:
node build.js 06-<song>      # -> dist/06-<song>.html  (single self-contained file for the show)
```

`node build.js` with no argument flattens every track that has an `index.html`.
