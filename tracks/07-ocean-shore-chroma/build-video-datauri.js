#!/usr/bin/env node
/* Regenerate assets/ocean-shore.webm.b64.js from assets/ocean-shore.webm.
 *
 *   node build-video-datauri.js
 *
 * The live WebGL scene (index.html) samples the footage as a GL texture. A
 * <video> loaded from a file:// URL taints the canvas cross-origin, which blocks
 * texImage2D — so from a projection laptop opening the file directly it would go
 * black. A data: URI does NOT taint, so we inline the loop as base64 and the
 * track runs from pure file:// with no flags and no server (per CLAUDE.md).
 *
 * Run this whenever assets/ocean-shore.webm changes. build.js / build-player.js
 * then inline the generated data: URI, so the show files stay one piece.
 */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const WEBM = path.join(HERE, 'assets', 'ocean-shore.webm');
const OUT  = path.join(HERE, 'assets', 'ocean-shore.webm.b64.js');

if (!fs.existsSync(WEBM)) { console.error('missing', WEBM); process.exit(1); }
const b64 = fs.readFileSync(WEBM).toString('base64');

const js =
`/* GENERATED from assets/ocean-shore.webm — do not edit by hand.
   The loop is inlined as a taint-free data: URI so the WebGL footage texture
   works from pure file:// (a file:// <video> taints the canvas cross-origin and
   blocks texImage2D). External <source>s below are http(s) fallbacks. Rebuild:
     node build-video-datauri.js   (or see assets/README.md) */
window.IL_OCEAN_VIDEO = [
  { src: "data:video/webm;base64,${b64}", type: "video/webm" },
  { src: "assets/ocean-shore.mp4",  type: "video/mp4"  },
  { src: "assets/ocean-shore.webm", type: "video/webm" }
];
`;

fs.writeFileSync(OUT, js);
console.log('wrote', path.relative(HERE, OUT), '(' + (js.length / 1024 / 1024).toFixed(2) + ' MB)');
