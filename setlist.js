/* Imaginary Lands — CONCERT SETLIST (single source of truth for the show order).
 *
 * Edit this list, then run:  node build-player.js   -> regenerates player.html
 *
 * Order here = order in the player (→ / ← / 1–9 to move between them). Reorder
 * by moving lines; drop one by deleting its line; add one with a new line.
 *
 * Entry kinds:
 *   { track: 'NN-<song>', title, bpm }   a real visual-core scene track FOLDER.
 *       Footage tracks (assets/*.b64.js) load their taint-free data: URI offline.
 *   { cover: 'IL_cover_01', title }      a still cover slide from player-covers/
 *       (bake images with player-covers/build-covers.js). Shown contain-fit,
 *       letterboxed on black, with a whisper of grain so it isn't frozen.
 *   { scene: 'x.glsl', title, bpm }      a standalone scene in player-scenes/.
 */
module.exports = [
  { cover: 'IL_cover_01',           title: 'OPENING' },            // 開場
  { track: '01-chrome-sands',       title: 'CHROME SANDS',        bpm: 115 },
  { track: '06-cave-human',         title: 'CAVE HUMAN',          bpm: 112 },
  { track: '06-sand-taitung-warp',  title: 'SAND · TAITUNG WARP', bpm: 115 },
  { track: '07-drive-taitung',      title: 'DRIVE · TAITUNG',     bpm: 115 },
  { track: '07-ocean-shore-chroma', title: 'OCEAN · SHORE CHROMA',bpm: 115 },
  { track: '07-paul-bluewater',     title: 'PAUL · BLUE WATER',   bpm: 115 },
  { cover: 'IL_cover_02',           title: 'INTERMISSION' },       // 中場休息 — between the 6th & 7th songs
  { track: '07-umbrella-stone',     title: 'UMBRELLA STONE',      bpm: 115 },
  { track: '07-doorway-sea',        title: 'DOORWAY SEA',         bpm: 115 },
  { cover: 'IL_cover_01',           title: 'ENDING' }              // 結束 — 切回 cover 01
];
