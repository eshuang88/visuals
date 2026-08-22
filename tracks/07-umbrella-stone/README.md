# 07 · Umbrella Stone (`IL_umbrellaStone`)

A generative reinterpretation of the **umbrella-stone** iPhone footage: two black
rock headlands framing a bright slot over the sea, with rippling foreground
water. Built as a pure `visual-core` scene (no external footage) so it drops
straight into the concert player and runs offline from `file://`.

- **Reference direction:** Rival Consoles / Moonvoid — a *threshold* between two
  sculptural masses held in darkness; light as the protagonist in the gap.
- **Aspect / loop:** 4:3, seamless **30 s** loop (all motion enters via circular
  offsets at harmonics of the loop, so the frame is identical at `t` and
  `t + 30`), **115 BPM** fallback.

## Deliberate palette deviation

Per `CLAUDE.md`, new tracks default to the canonical cold `IL_*` palette unless
the song asks otherwise — noted here: this track leans **magical RED · GOLD ·
BLACK · WHITE** instead.

- The gap between the stones is a **molten portal** — crimson → gold → white.
- The stones stay **near-black** with a **glowing rim** on the edges facing the gap.
- The foreground water carries a **red-gold reflection** of the portal with gold
  ripple glints.

## Audio reactivity

`u_bass` (mic low-end, 115 BPM fallback when silent) flares the portal, the rim
light, the foam and the water glints. A rare whole-frame **"memory bloom"**
(`surge`) fires a couple of times per loop — a magical surge, never a metronomic
strobe.

## Build

In the player: it's already a `{ track: '07-umbrella-stone' }` line in
`setlist.js` → `node build-player.js` regenerates `player.html`.

Standalone preview / Resolume file: `node build.js 07-umbrella-stone` →
`dist/07-umbrella-stone.html`.
