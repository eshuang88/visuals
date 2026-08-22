#!/usr/bin/env node
/* Bake every image in player-covers/ into a taint-free data: URI JS file, so the
 * concert player can show it as a still "cover" slide offline from file://
 * (an <img> from a file:// URL taints the WebGL canvas; a data: URI does not).
 *
 *   node build-covers.js
 *
 * IL_cover_01.webp -> IL_cover_01.b64.js  defining  window.IL_COVER01 = "data:…".
 * Reference these in setlist.js with { cover: 'IL_cover_01' }.
 */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const TYPES = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

fs.readdirSync(HERE).forEach(f => {
  const ext = path.extname(f).toLowerCase();
  if (!TYPES[ext]) return;
  const base = path.basename(f, ext);                 // IL_cover_01
  const varName = base.replace(/[^A-Za-z0-9]/g, '').toUpperCase(); // ILCOVER01
  const b64 = fs.readFileSync(path.join(HERE, f)).toString('base64');
  const out = path.join(HERE, base + '.b64.js');
  fs.writeFileSync(out,
    '/* GENERATED from ' + f + ' — taint-free data: URI cover slide. */\n' +
    'window.' + varName + ' = "data:' + TYPES[ext] + ';base64,' + b64 + '";\n');
  console.log('wrote', base + '.b64.js', '(window.' + varName + ', ' + (b64.length / 1024 | 0) + ' KB)');
});
