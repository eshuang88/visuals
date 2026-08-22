# 07 — IL_driveTaitung

A **footage** track built on the source clip **IL_driveTaitung**: a driving clip
from Taitung (dash / hand-held). It runs as a live WebGL texture treated toward a
**grainy, retro VHS/DV** look with a **chroma filter** — the endless-driving
diary. *Mac DeMarco* direction (consumer-signal texture), kept in the house
family (near-black · graphite-green · muted-violet, low-saturation) with a
deliberate whisper of ember warmth in the mids for the nostalgic feel.

## Live WebGL scene — `index.html`

The real loop plays as a GL texture, treated in the house style and pushed toward
retro signal damage:

- **chroma** — lens chromatic aberration that widens toward the frame edges and
  swells on the bass (accelerate → colours split further), plus a horizontal VHS
  chroma smear. This is the "chroma 濾鏡".
- **retro** — a rolling scanline comb, a slow head-switch luma bar drifting up the
  frame, a VHS dropout speckle band along the bottom, tape jitter + engine-idle
  micro-shake, and extra tape grain over `ambientPost`'s film grain.
- **framing** — `texCoverUV()` fits the clip into 4:3; a slow drift pans the crop
  so no two passes of the loop frame identically.
- **grade** — cold graphite body with warm-white headlight halation, then
  `ambientPost` (bass swell, S-grade, vignette, film grain) so it wears the same
  skin as every track.

The source clip is ~14.7 s, so the seamless footage loop is **~14 s**; but
`u_flow` / travel / drift / grade all evolve as slow functions that never wrap,
and the crop-drift reframes every pass, so it reads as continuous driving **well
past 30 s** — never a cut, never a hard repeat. Audio-reactive (mic bass, 115 BPM
fallback). (Want the *file* to literally span ~30 s? `build-loop.sh` can seam-tile
the loop 2×; it's seamless throughout — see `assets/README.md`.)

Open `index.html` — it runs from pure `file://` (the footage is inlined as a
taint-free `data:` URI; see `assets/README.md`).

## Building it

1. Drop the raw clip into `assets/source.<ext>` (see `assets/README.md`).
2. Cut the seamless loop → `assets/drive-taitung.mp4` + `.webm`
   (`HDR=1 ./build-loop.sh assets/source.mov`; recipe in `assets/README.md`).
3. `node build-video-datauri.js` → `assets/drive-taitung.webm.b64.js`.
4. Player: this track is a visual-core scene, so it drops straight into the concert
   player — add `{ track: '07-drive-taitung' }` to `setlist.js` and run
   `node build-player.js`.
5. Self-contained show file: `node build.js 07-drive-taitung` → `dist/07-drive-taitung.html`.
