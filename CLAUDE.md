# Imaginary Lands — Visual System

Ambient-techno live visuals for the show **Imaginary Lands**. One self-contained
WebGL visual per track, sharing a common engine and a house aesthetic. Every
visual is **4:3, fullscreen, seamless, and audio-reactive** (mic bass, with a
per-track BPM fallback).

These pieces are the **generative / treatment** half of the project. The show's
full language also draws on lived iPhone footage — see the full illustrated visual
bible, [`Imaginary_Lands_Visual_Reference_Report.html`](./Imaginary_Lands_Visual_Reference_Report.html)
(the eight reference directions, the flicker family, and the iPhone-first
pipeline, covering **both** the generative and footage halves). This repo is where
the abstract, phenomenon-driven, "30% treatment" material lives; this file is the
text contract carrying that report's principles into shader work.

## Prime directive — texture over time

Hold attention through **continuous, low-frequency change** — light drifts,
liquid flows, focus wanders, grain breathes. A world, not a content feed.

> Do not make the image constantly change. Make it remain alive.

If a change would read as an "event" (a cut, a flash, a beat hit), it is
probably wrong. Aim for something you can watch for ten minutes.

## Aesthetic principles (the visual bible)

- **Restraint.** No compulsory beat sync. No constant scene changes. No generic
  spectacle. Not every frame beautiful. Don't clean every defect.
- **Motion.** Slow drift · natural / physical movement · long holds · rare
  weighted change · asynchronous breathing. Visuals may lead or lag the music by
  a beat or two — **emotion sync, not beat sync**.
- **Texture.** Film grain + halation · fog / glass / defocus · signal damage ·
  bloom / compression · *texture that itself changes over time*.
- **Phenomena to evoke** (generatively): water & fluid, soap-film iridescence,
  ice, ink / milk, fog, reflections, a single sculptural object held in
  darkness, anonymous human trace (fragments, blur, reflected skin).
- **Flicker is an instrument, not an effect.** A family of temporal
  modulations — exposure breathing, texture flicker (animate grain density only),
  rare 2–4 frame "memory replacement", light-leak sweep, club-light pulse, signal
  instability. Map loosely to musical density; **never metronomic**.

## Palette (canonical)

| role              | hex       | GLSL const     |
|-------------------|-----------|----------------|
| near-black        | `#090b0d` | `IL_BLACK`     |
| graphite green    | `#303734` | `IL_GRAPHITE`  |
| desaturated blue  | `#52696f` | `IL_BLUE`      |
| muted violet      | `#8b7b8e` | `IL_VIOLET`    |
| warm white        | `#ded9ca` | `IL_WARMWHITE` |
| accent · ice      | `#98bdc4` | `IL_ICE`       |
| accent · acid     | `#c9e88a` | `IL_ACID` (sparingly — edges/UI, not fields) |
| accent · ember    | `#bd835f` | `IL_EMBER`     |

Default mood: near-black base, cold body, warm-white highlights; violet and ice
for depth. **Keep saturation low.** Per-track deviation is allowed — just make it
deliberate and note it in the track file.

> **Track 01 (Chrome Sands)** leans colder — cream-blue polished chrome, the
> *Floating Points* direction. It's a deliberate variant. New tracks default to
> the canonical palette above unless the song asks for otherwise.

## Technical conventions

- **Aspect 4:3**, letterboxed on black. Fullscreen via a click (browsers require
  a user gesture for both fullscreen and mic).
- **Seamless.** Continuous generative motion, no hard loop seam. Avoid anything
  keyed to an absolute time that would visibly wrap.
- **Audio.** Mic low-frequency energy (~20–200 Hz) drives the slow undulation;
  after ~1.4 s of silence it crossfades to a BPM fallback. Default **115 BPM**;
  set per track. `u_flow` accumulates continuously so drift never jumps when the
  source changes.
- **House post lives in the engine.** `ambientPost()` applies the bass swell,
  cold S-grade, vignette and film grain. **End every scene with it** so all
  tracks share one skin.
- **No network assets.** No CDN, fonts, or remote images — everything must run
  offline from `file://` for the show.

## Repo layout

```
lib/visual-core.js     shared engine (WebGL, audio, post, GLSL prelude) — window.Ambient
lib/visual-core.css    shared 4:3 stage + start-overlay styles
tracks/NN-<song>/      one folder per song: index.html = scene shader + Ambient.start()
tracks/_template/      starter to copy for a new song
build.js               flatten a track into a single self-contained file in dist/
build-video-datauri.js footage helper: encode a track's loop to a data: URI (see below)
index.html             gallery linking to the tracks
player.html            live show cue list — hosts one visual-core scene at a time (← → / F / Esc)
dist/                  build output (gitignored) — the files you actually project
```

## What a scene gets (engine prelude)

Every scene shader is prepended with the prelude, so you may use directly:

- **uniforms** — `u_res` (vec2 px), `u_time` (s), `u_bass` (0..1), `u_flow`
  (accumulated drift), `u_beat` (continuous beats at the BPM).
- **helpers** — `hash()`, `vnoise()`, `fbm()` (5-octave, quick roll-off → big
  soft forms). Don't re-implement these.
- **palette** — the `IL_*` consts above.
- **post** — `ambientPost(col, gl_FragCoord.xy, u_bass)`.

A scene is just a `void main(){ … gl_FragColor = vec4(ambientPost(col, gl_FragCoord.xy, u_bass), 1.0); }`.

**Footage tracks (optional).** A scene can treat lived footage in real time instead
of being purely generative (see `tracks/06-cave-human`). Pass a **seamless 4:3
loop** to the engine and its current frame is kept in a sampler for the shader to
grade/damage like any other input — so a footage piece is a first-class
visual-core scene (drops into `player.html`, reacts to the mic) rather than a
pre-rendered file:

- `Ambient.start({ …, video: window.IL_VIDEO || 'assets/loop.mp4' })`
- extra uniforms: `u_tex` (current frame), `u_texres` (its px size, 0 if none)
- helper: `il_frame(uv)` — cover-fit sample of the frame into the 4:3 stage

A `<video>` from a plain `file://` path is cross-origin, so WebGL samples it black
offline. Fix it with a same-origin data URI: `node build-video-datauri.js NN-<song>`
writes `tracks/NN-<song>/video-datauri.js` (`window.IL_VIDEO`, gitignored), which
`build.js` inlines into the self-contained `dist/` file. The loop in `assets/` is
the source of truth. This is the **generative-treatment** repo, so keep footage
tracks phenomenon-driven (a texture held in darkness, treated) — not literal clips.

## Adding a new track (one per song)

1. Copy `tracks/_template` → `tracks/NN-<song>/`.
2. Rewrite the `#scene` shader. Pick a **reference direction** (below) as its
   spine and lean the palette accordingly.
3. Set `title` / `subtitle` / `bpm` in `Ambient.start`.
4. Open `tracks/NN-<song>/index.html` to check it; iterate on the shader.
5. `node build.js NN-<song>` → `dist/NN-<song>.html`, the self-contained file to
   project or load into Resolume.

**Working across sessions:** each song can be its own Claude Code session — the
repo (this file + `lib/`) is the shared memory, so a fresh session starts with
the whole aesthetic already loaded. Keep `lib/` and `CLAUDE.md` stable; treat
them as the contract. (Sessions clone from the remote, so shared changes must be
pushed to be visible to a new session.)

## Reference directions (pick one per track)

- **Floating Points** → iridescent fluid, surface tension, emergence *(track 01)*.
- **Rival Consoles** → one sculptural object in black; light as protagonist; rare motion.
- **Moonvoid** → threshold / fog; focus drift; dirty low-res atmosphere.
- **Ariana Grande** → soft breathing memory; monochrome film; halation, bloom.
- **Zayn** → flicker / exposure pulse as the entire idea.
- **Emma** → anonymous bodies; club light; high-ISO crushed black.
- **Mac DeMarco** → consumer-signal texture (VHS / DV) diary.

## Guardrails — avoid

- EDM-style beat-locked strobing or hard flash cuts.
- Rainbow / high-saturation generative clichés.
- Busy, high-frequency "foil" texture — favor large slow forms. (Track 01's
  tuning history: lower frequency, smoother normals, broad creamy highlights beat
  the first "textured water" attempts.)
- Any network dependency.
