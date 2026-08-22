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

## Concert player (the whole set in one file)

For the live show, `player.html` plays a **playlist** of scenes in one page —
one WebGL context, one render loop, all driven from the keyboard. No VJ software,
no network: build it once and run the single self-contained file off a MacBook.

```
node build.js player          # -> dist/player.html  (one offline file, ~40 kB)
open dist/player.html         # click to start (fullscreen + mic), then use keys
```

Keys (a card shows at start and on `H` / `?`):

| key | action | | key | action |
|-----|--------|-|-----|--------|
| `→` / `N` | next track | | `Space` | pause / resume |
| `←` / `P` | previous track | | `↓` / `B` | transition — 3 s fade to black (press again to fade back up) |
| `1`–`9` | jump to a track | | `F` fullscreen · `H` help | |

Track changes are a quick symmetric **dip to black** (~0.9 s) — the shader swaps
while the frame is already black, so there's no hard cut. `↓`/`B` is the long
3-second blackout hold for gaps between songs. One continuous clock feeds every
scene, so pausing freezes cleanly and switches never jump.

The prototype set (`player.html`) carries four scenes — Chrome Sands (the real
track-01 shader), Marble Gold, Animal Loop, LA Sunset — all 115 BPM, 4:3. Any
scene written for the shared engine (`lib/visual-core.js`) drops straight into the
`tracks` array; see the comments in `player.html`. For a real 90-minute set, list
your 10–20 scenes there in order.

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
