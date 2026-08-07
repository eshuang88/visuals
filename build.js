#!/usr/bin/env node
/* Flatten a track into a single self-contained HTML file for the show
 * (Resolume / a projection laptop / handing one file to someone).
 *
 *   node build.js 01-chrome-sands      # -> dist/01-chrome-sands.html
 *   node build.js                      # flattens every track in tracks/
 *
 * It inlines the linked <link rel="stylesheet"> and <script src> from lib/
 * so the result has zero external dependencies. The _template folder is skipped.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TRACKS = path.join(ROOT, 'tracks');
const DIST = path.join(ROOT, 'dist');

function flatten(trackDir) {
  const htmlPath = path.join(TRACKS, trackDir, 'index.html');
  if (!fs.existsSync(htmlPath)) throw new Error('no index.html in ' + trackDir);
  let html = fs.readFileSync(htmlPath, 'utf8');

  // inline <link rel="stylesheet" href="...">
  html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
    (m, href) => '<style>\n' + read(trackDir, href) + '\n</style>');

  // inline <script src="..."></script>
  html = html.replace(/<script[^>]*\ssrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (m, src) => '<script>\n' + read(trackDir, src) + '\n</script>');

  fs.mkdirSync(DIST, { recursive: true });
  const out = path.join(DIST, trackDir + '.html');
  fs.writeFileSync(out, html);
  console.log('built', path.relative(ROOT, out), '(' + (html.length / 1024).toFixed(1) + ' kB)');
}

function read(trackDir, rel) {
  return fs.readFileSync(path.resolve(TRACKS, trackDir, rel), 'utf8').trim();
}

const arg = process.argv[2];
const list = arg ? [arg]
  : fs.readdirSync(TRACKS).filter(d =>
      !d.startsWith('_') && fs.statSync(path.join(TRACKS, d)).isDirectory()
      && fs.existsSync(path.join(TRACKS, d, 'index.html'))); // skip render-only tracks

if (!list.length) { console.error('no tracks to build'); process.exit(1); }
list.forEach(flatten);
