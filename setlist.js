/* Imaginary Lands — CONCERT SETLIST (single source of truth for the show order).
 *
 * Edit this list, then run:  node build-player.js   -> regenerates player.html
 *
 * Order here = order in the player (→ / ← / 1–9 to move between them). Reorder
 * by moving lines; drop one by deleting its line; add one with a new line.
 *
 * Entry kinds:
 *   { track: 'NN-<song>', title, bpm }   a real visual-core scene track FOLDER.
 *       The build pulls its <script id="scene">; if the track is footage (its
 *       assets/ has a *.b64.js), the loop's data: URI is inlined so it runs
 *       offline from file://.
 *   { scene: 'x.glsl', title, bpm }      a standalone scene in player-scenes/.
 *
 * All entries below are the real tracks. The prototype's earlier stand-in scenes
 * (marble-gold / animal-loop / la-sunset) still live in player-scenes/ if needed.
 */
module.exports = [
  { track: '01-chrome-sands',       title: 'CHROME SANDS',        bpm: 115 },
  { track: '06-cave-human',         title: 'CAVE HUMAN',          bpm: 112 },
  { track: '06-sand-taitung-warp',  title: 'SAND · TAITUNG WARP', bpm: 115 },
  { track: '07-drive-taitung',      title: 'DRIVE · TAITUNG',     bpm: 115 },
  { track: '07-ocean-shore-chroma', title: 'OCEAN · SHORE CHROMA',bpm: 115 },
  { track: '07-paul-bluewater',     title: 'PAUL · BLUE WATER',   bpm: 115 },
  { track: '07-umbrella-stone',     title: 'UMBRELLA STONE',      bpm: 115 },
  { track: '07-doorway-sea',        title: 'DOORWAY SEA',         bpm: 115 }
];
