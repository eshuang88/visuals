# 07 · Paul Secret Sky (`IL_paulSecretSky`)

A generative reinterpretation of Paul's **concrete-canyon** photo: two raw
board-formed monoliths lean together and almost meet, leaving a secret jagged
**crack of daylight sky** running up the centre. Built as a pure `visual-core`
scene (no external footage) so it drops straight into the concert player and
runs offline from `file://`. Sits **right after UMBRELLA STONE** in the setlist.

- **Reference direction:** Rival Consoles / Moonvoid — sculptural masses held in
  darkness, light as the protagonist in the gap — pushed toward a **glittering,
  retro** treatment per the brief.
- **Aspect / loop:** 4:3, seamless **30 s** loop (all motion enters via circular
  offsets at integer harmonics of the loop phase, so the frame is identical at
  `t` and `t + 30`), **115 BPM** fallback.

## Palette

Canonical **cold `IL_*`** set — near-black + graphite/blue concrete with a
whisper of `IL_VIOLET` in the shadow; the sky slot is `IL_ICE` → `IL_WARMWHITE`.
No deliberate deviation (unlike its neighbour Umbrella Stone).

## The look (per brief — glitter / retro / chroma)

- **Concrete:** mottled board-formed faces, horizontal formwork lines, the
  signature **diagonal diamond seams**, and scattered **form-tie holes**.
- **Secret sky:** a thin daylight thread at the bottom that flares wide toward
  the top, with drifting clouds and a bright bloomed rim on the crack edges.
- **Raking light:** soft daylight brushed diagonally down each wall, slowly
  drifting.
- **Glitter:** a twinkling cellular star field, densest at the crack edges and
  along the light streaks, blinking on loop-periodic phases.
- **Retro chroma:** a radial **RGB-split** that fringes every bright edge (warm
  on one side, cool on the other), plus a faint analog **scanline** and the
  house film grain.

## Audio reactivity

`u_bass` (mic low-end, 115 BPM fallback when silent) drives an exposure breathe,
brightens the sky slot, the rim bloom and the glitter, and widens the chroma
split. A rare **deconstruction surge** (a couple of times per loop) shears the
walls into cool angular blocks with a whole-frame memory bloom — loose with the
music, **never a metronomic strobe**.

## Build

In the player: it's a `{ track: '07-paul-secret-sky' }` line in `setlist.js` →
`node build-player.js` regenerates `player.html`.

Standalone preview / Resolume file: `node build.js 07-paul-secret-sky` →
`dist/07-paul-secret-sky.html`.
