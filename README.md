# Imaginary Lands — Visuals

Ambient-techno live visuals. One WebGL piece per track — 4:3, fullscreen,
seamless, audio-reactive (mic bass with a per-track BPM fallback).

**The visual bible.** [`Imaginary_Lands_Visual_Reference_Report.html`](./Imaginary_Lands_Visual_Reference_Report.html)
is the illustrated reference every song follows — both the generative/shader half
and the lived-footage half (open it in a browser). [`CLAUDE.md`](./CLAUDE.md) is
its text companion — the system + conventions a Claude Code session reads.

## Run

Open `index.html` (gallery) or any `tracks/NN-<song>/index.html` in a browser and
click to start. No build or server needed — click grants fullscreen + mic; with
no mic/signal it undulates at the track's default BPM (115).

Shortcuts: `F` fullscreen · `H` toggle HUD.

**Live player.** [`player.html`](./player.html) is the show cue list — a full-window
frame that hosts one track at a time. Walk the set with `← →` (or number keys),
`F` for fullscreen, `Esc` for the menu. It plays visual-core scenes (the tracks
below, and any footage track once its data URI is built — see *Footage tracks*).

## Tracks

Each song lives in its own `tracks/NN-<song>/` folder (the show is
**Imaginary Lands**; the repo root is the show, one folder per song — this scales
to the full 30–50 song set). Version history per track is kept by git — no need
for copies or per-version branches.

- `tracks/01-chrome-sands/` — creamy liquid chrome, engine track (115 BPM)
- `tracks/02-la-sunset/` — LA sunset / Moonvoid cinemagraph (self-contained; also `motion.html`, `photo.html`)
- `tracks/03-thermal-blob/` — thermal fluid gold, 4 tangram blocks (self-contained, 115 BPM)
- `tracks/04-marble-gold/` — marbled liquid metal, 4 tangram blocks (self-contained, 115 BPM)
- `tracks/05-animal-photo-loop/` — animal memory film, rendered via `render.py` (no live index.html)
- `tracks/06-cave-human/` — cave-wall footage as a live visual-core scene: grainy retro chroma (footage, 112 BPM)
- `tracks/_template/` — starter to copy for a new engine-based song

> **Engine vs self-contained.** `01` (and new `_template` tracks) run on the
> shared engine in `lib/`. `02`–`04` are self-contained single-file visuals
> (their own WebGL, no `lib/` dependency) — they still open and run the same way;
> they're just not yet ported to the shared engine. `05` is a video render, not a
> browser visual.

## New track

```
cp -r tracks/_template tracks/06-<song>
# edit the #scene shader + title/bpm, then:
node build.js 06-<song>      # -> dist/06-<song>.html  (single self-contained file for the show)
```

`node build.js` with no argument flattens every track that has an `index.html`.

## Footage tracks

A track can be lived footage treated in real time instead of a pure generative
shader (see `06-cave-human`). Drop a **seamless 4:3 loop** in the track's
`assets/`, then pass it to the engine — the current frame lands in the `u_tex`
sampler and the scene grades/damages it like any other shader (sample it with
`il_frame(uv)`):

```
Ambient.start({ title, bpm, video: window.IL_VIDEO || 'assets/loop.mp4' });
```

Because a `<video>` loaded from a plain `file://` path is treated as cross-origin
(WebGL then samples it black), footage needs a same-origin `data:` URI to play
offline:

```
node build-video-datauri.js 06-cave-human   # -> tracks/06-cave-human/video-datauri.js (window.IL_VIDEO)
node build.js 06-cave-human                 # -> dist/06-cave-human.html (data URI inlined, self-contained)
```

The generated `video-datauri.js` and `dist/` are gitignored — the loop in
`assets/` is the source of truth. (For dev you can also just serve the folder over
http, where the plain `assets/loop.mp4` path is same-origin and needs no data URI.)
