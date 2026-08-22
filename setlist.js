/* Imaginary Lands — CONCERT SETLIST (single source of truth for the show order).
 *
 * Edit this list, then run:  node build-player.js   -> regenerates player.html
 *
 * Order here = order in the player (→ / ← / 1–9 to move between them).
 * Two kinds of entry:
 *
 *   { track: '06-sand-taitung-warp', title, bpm }
 *       A real visual-core scene track FOLDER. The build pulls its
 *       <script id="scene"> shader; if the track is footage (its assets/ has a
 *       *.b64.js), the build inlines the loop's data: URI as `video` so the
 *       player runs it offline from file://. Only tracks authored for
 *       visual-core.js qualify (01, 06). Bespoke-engine tracks (02 canvas
 *       cinemagraph, 03/04 own-WebGL, 05 render-only) are NOT droppable here.
 *
 *   { scene: 'la-sunset.glsl', title, bpm }
 *       A standalone scene file in player-scenes/ (player-only reinterpretations
 *       of tracks whose real version uses a different engine).
 *
 * title / bpm are optional overrides; title falls back to the folder/file name,
 * bpm to 115.
 */
module.exports = [
  { track: '01-chrome-sands',       title: 'CHROME SANDS',        bpm: 115 },
  { scene: 'marble-gold.glsl',      title: 'MARBLE GOLD',         bpm: 115 },
  { scene: 'animal-loop.glsl',      title: 'ANIMAL LOOP',         bpm: 115 },
  { scene: 'la-sunset.glsl',        title: 'LA SUNSET',           bpm: 115 },
  { track: '06-sand-taitung-warp',  title: 'SAND · TAITUNG WARP', bpm: 115 },
  { track: '07-ocean-shore-chroma', title: 'OCEAN · SHORE CHROMA', bpm: 115 }
];
