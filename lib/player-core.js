/* Imaginary Lands — concert PLAYER engine.
 *
 * A live "set" player: many scene shaders in one page, one WebGL context, one
 * render loop. Seamless switching + a fade primitive, driven entirely from the
 * keyboard so you can run a 90-minute show off a MacBook with no VJ software and
 * no network — just one self-contained .html file opened from file://.
 *
 * It reuses the exact shared convention from visual-core.js:
 *   - the same GLSL prelude (window.Ambient.PRELUDE): u_res/u_time/u_bass/
 *     u_flow/u_beat, hash()/vnoise()/fbm(), the IL_* palette, ambientPost().
 *   - the same mic-bass + BPM-fallback audio model.
 * so any track written for visual-core drops in as a playlist entry unchanged.
 *
 * Usage (see player.html):
 *   AmbientPlayer.start({
 *     tracks: [ { title, subtitle, bpm, scene: '<glsl void main(){...}>' }, ... ],
 *     start: 0
 *   });
 *
 * Keyboard (a card is shown at start and on `?`):
 *   → / N      next track            ← / P       previous track
 *   Space      pause / resume        ↓ / B       transition: 3 s fade to black
 *                                                 (press again to fade back up)
 *   1..9       jump to that track    F           fullscreen      H / ?  help
 *
 * Design notes carried from CLAUDE.md:
 *   - Track changes are a quick, symmetric *dip to black* (~0.9 s), so the shader
 *     program swap happens while the frame is already black — no hard cut, reads
 *     as a breath rather than an "event".
 *   - The 3 s blackout ("transition") is the same fade primitive with a long
 *     duration that HOLDS at black until you fade back — for song gaps / talk.
 *   - One continuous virtual clock feeds every scene, so u_time/u_flow/u_beat
 *     never jump across a switch and each seamless loop just keeps breathing.
 */
(function (global) {
  'use strict';

  var VERT = 'attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }';

  function el(tag, id, cls) {
    var e = document.createElement(tag);
    if (id) e.id = id;
    if (cls) e.className = cls;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  function start(opts) {
    opts = opts || {};
    var tracks = opts.tracks || [];
    if (!tracks.length) throw new Error('AmbientPlayer.start: no tracks.');
    if (!global.Ambient || !global.Ambient.PRELUDE)
      throw new Error('AmbientPlayer needs visual-core.js loaded first (for Ambient.PRELUDE).');
    var PRELUDE = global.Ambient.PRELUDE;

    // ---------------- DOM ----------------
    var wrap = el('div', 'wrap');
    var stage = el('div', 'stage');
    var canvas = el('canvas', 'gl');
    var hud = el('div', 'hud');
    var help = el('div', 'help');
    var fade = el('div', 'fade');        // black transition curtain
    var overlay = el('div', 'overlay');

    var first = tracks[opts.start | 0] || tracks[0];
    overlay.innerHTML =
      '<div class="title">' + esc(opts.title || 'IMAGINARY LANDS') + '</div>' +
      '<div class="sub">' + (opts.subtitle ||
        ('現場視覺播放器 · ' + tracks.length + ' 首 · 4:3<br>' +
         '點擊進入全螢幕 — 允許麥克風以隨低音起伏<br>' +
         '<span style="opacity:.6">鍵盤操控：→ 下一首 · ← 上一首 · 空白鍵 暫停 · ↓ 3秒淡黑</span>')) +
      '</div><div class="go">CLICK TO START</div>';

    help.innerHTML =
      '<b>KEYS</b>' +
      '<span><kbd>→</kbd><kbd>N</kbd> next</span>' +
      '<span><kbd>←</kbd><kbd>P</kbd> prev</span>' +
      '<span><kbd>Space</kbd> pause</span>' +
      '<span><kbd>↓</kbd><kbd>B</kbd> fade&nbsp;to&nbsp;black</span>' +
      '<span><kbd>1</kbd>–<kbd>' + Math.min(9, tracks.length) + '</kbd> jump</span>' +
      '<span><kbd>F</kbd> fullscreen</span>' +
      '<span><kbd>H</kbd> hide&nbsp;keys</span>';

    stage.appendChild(canvas);
    stage.appendChild(fade);
    stage.appendChild(hud);
    stage.appendChild(help);
    stage.appendChild(overlay);
    wrap.appendChild(stage);
    document.body.appendChild(wrap);

    // ---------------- GL ----------------
    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' })
          || canvas.getContext('experimental-webgl');
    if (!gl) { overlay.querySelector('.sub').innerHTML = '此瀏覽器不支援 WebGL'; return; }

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s) + '\n' + src);
      return s;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT);   // shared across every program

    // ---- footage texture support (mirrors visual-core.js; see CLAUDE.md) ----
    // A 1x1 black placeholder stays bound on unit 0 so generative scenes that
    // never sample u_tex are unaffected. Footage tracks (a `video` in their
    // playlist entry) get their own <video> + texture, uploaded while active.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    var placeholderTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, placeholderTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    function makeVideo(spec) {
      var v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
      v.autoplay = true; v.preload = 'auto';
      (Array.isArray(spec) ? spec : [{ src: spec }]).forEach(function (s) {
        var el = document.createElement('source');
        el.src = s.src; if (s.type) el.type = s.type;
        v.appendChild(el);
      });
      v.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px;';
      document.body.appendChild(v);
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      var rec = { video: v, tex: tex, ready: false };
      v.addEventListener('loadeddata', function () { rec.ready = true; });
      v.load();
      return rec;
    }

    // one program per track (compiled lazily on first show, then cached)
    var programs = new Array(tracks.length);
    function programFor(i) {
      if (programs[i]) return programs[i];
      var fs = compile(gl.FRAGMENT_SHADER, PRELUDE + '\n' + tracks[i].scene);
      var prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      var loc = gl.getAttribLocation(prog, 'a_pos');
      var P = {
        prog: prog, loc: loc,
        U: {
          res: gl.getUniformLocation(prog, 'u_res'),
          time: gl.getUniformLocation(prog, 'u_time'),
          bass: gl.getUniformLocation(prog, 'u_bass'),
          flow: gl.getUniformLocation(prog, 'u_flow'),
          beat: gl.getUniformLocation(prog, 'u_beat'),
          tex: gl.getUniformLocation(prog, 'u_tex'),
          texRes: gl.getUniformLocation(prog, 'u_texRes')
        },
        vid: tracks[i].video ? makeVideo(tracks[i].video) : null
      };
      programs[i] = P;
      return P;
    }

    // bind + upload the active program's footage (or the placeholder) to unit 0
    function bindFootage(P) {
      gl.activeTexture(gl.TEXTURE0);
      if (P.vid) {
        var v = P.vid.video;
        gl.bindTexture(gl.TEXTURE_2D, P.vid.tex);
        if (P.vid.ready && v.readyState >= 2 && v.videoWidth) {
          try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v); } catch (e) {}
          if (P.U.texRes) gl.uniform2f(P.U.texRes, v.videoWidth, v.videoHeight);
        } else if (P.U.texRes) { gl.uniform2f(P.U.texRes, 0, 0); }
      } else {
        gl.bindTexture(gl.TEXTURE_2D, placeholderTex);
        if (P.U.texRes) gl.uniform2f(P.U.texRes, 0, 0);
      }
      if (P.U.tex) gl.uniform1i(P.U.tex, 0);
    }

    // play only the active footage clip; pause the rest (save decode)
    function syncVideoPlayback() {
      for (var i = 0; i < programs.length; i++) {
        var P = programs[i];
        if (!P || !P.vid) continue;
        if (i === active && playing && running) {
          var pr = P.vid.video.play(); if (pr && pr['catch']) pr['catch'](function () {});
        } else { try { P.vid.video.pause(); } catch (e) {} }
      }
    }

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    function resize() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var w = Math.round(stage.clientWidth * dpr);
      var h = Math.round(stage.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    global.addEventListener('resize', resize);
    resize();

    // ---------------- audio: mic bass with BPM fallback (as visual-core) ----------------
    var analyser = null, freq = null;
    var micLevel = 0, silence = 0, fbWeight = 1;

    function startAudio() {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return Promise.resolve();
      return navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      }).then(function (stream) {
        var ctx = new (global.AudioContext || global.webkitAudioContext)();
        var src = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.75;
        src.connect(analyser);
        freq = new Uint8Array(analyser.frequencyBinCount);
      })['catch'](function () { analyser = null; });
    }
    function readBass() {
      if (!analyser) return 0;
      analyser.getByteFrequencyData(freq);
      var s = 0, N = 8;
      for (var i = 1; i <= N; i++) s += freq[i];
      return Math.min(1, (s / N / 255) * 1.6);
    }
    function fallbackEnv(t, bpm) {
      var beat = t * bpm / 60;
      var pulse = Math.exp(-((beat % 1)) * 3.2);
      var swell = 0.5 + 0.5 * Math.sin(t * (bpm / 60) * Math.PI);
      return Math.min(1, 0.30 * swell + 0.55 * pulse);
    }

    // ---------------- player state ----------------
    var active = opts.start | 0;
    if (active < 0 || active >= tracks.length) active = 0;
    var playing = true;          // false = frozen (paused)
    var T = 0;                   // virtual seconds — advances only while playing
    var flowPhase = 0;           // accumulated drift — never resets across tracks
    var last = performance.now();

    // one fade controller drives BOTH the quick track-change dip and the long
    // 3 s blackout. level: 0 = clear, 1 = full black.
    var fadeState = { level: 0, target: 0, dur: 0.5, cb: null, busy: false };
    function fadeTo(target, dur, cb) {
      fadeState.target = target;
      fadeState.dur = Math.max(0.001, dur);
      fadeState.cb = cb || null;
    }
    function stepFade(dt) {
      var f = fadeState;
      if (f.level === f.target) return;
      var dir = f.target > f.level ? 1 : -1;
      f.level += dir * dt / f.dur;
      if ((dir > 0 && f.level >= f.target) || (dir < 0 && f.level <= f.target)) {
        f.level = f.target;
        var cb = f.cb; f.cb = null;
        if (cb) cb();
      }
      fade.style.opacity = f.level.toFixed(3);
    }

    var DIP = 0.45;              // half of the track-change dip (≈0.9 s round trip)
    var BLACKOUT = 3.0;          // the "transition" hold, per the brief

    function goto(idx) {
      idx = ((idx % tracks.length) + tracks.length) % tracks.length;
      if (fadeState.busy) return;             // ignore during a dip
      if (idx === active) return;
      fadeState.busy = true;
      fadeTo(1, DIP, function () {            // dipped to black -> swap under cover
        active = idx;
        try { programFor(active); } catch (e) { console.error(e); }
        syncVideoPlayback();                  // play the new clip, pause the old
        flashHud();
        fadeTo(0, DIP, function () { fadeState.busy = false; });
      });
    }
    function next() { goto(active + 1); }
    function prev() { goto(active - 1); }

    var blackedOut = false;
    function toggleBlackout() {
      if (fadeState.busy) return;
      blackedOut = !blackedOut;
      fadeTo(blackedOut ? 1 : 0, BLACKOUT);
      flashHud();
    }

    function togglePause() { playing = !playing; syncVideoPlayback(); flashHud(); }

    // ---------------- HUD ----------------
    var hudTimer;
    function hudText() {
      var t = tracks[active];
      var n = ('0' + (active + 1)).slice(-2);
      var src = fbWeight > 0.5 ? ((t.bpm | 0) + ' BPM') : 'MIC';
      var st = !playing ? 'PAUSED' : (blackedOut ? 'BLACK' : (fadeState.busy ? '…' : 'PLAY'));
      var meter = '▁▂▃▄▅▆▇█'[Math.min(7, Math.floor(curBass * 8))] || '▁';
      return n + '/' + ('0' + tracks.length).slice(-2) + ' · ' +
             esc(t.title || '') + ' · ' + src + ' ' + meter + ' · ' + st;
    }
    function flashHud() {
      stage.classList.add('showhud');
      clearTimeout(hudTimer);
      hudTimer = setTimeout(function () { stage.classList.remove('showhud'); }, 2600);
    }

    // ---------------- render loop ----------------
    var curBass = 0;
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      stepFade(dt);

      var bpm = tracks[active].bpm || 115;

      if (playing) {
        var raw = readBass();
        micLevel += (raw - micLevel) * 0.25;
        if (micLevel < 0.045) silence += dt; else silence = 0;
        var wantFallback = (!analyser || silence > 1.4) ? 1 : 0;
        fbWeight += (wantFallback - fbWeight) * 0.04;
        curBass = micLevel * (1 - fbWeight) + fallbackEnv(T, bpm) * fbWeight;

        T += dt;
        flowPhase += dt * (0.05 + curBass * 0.06);
      }

      var P = programFor(active);
      gl.useProgram(P.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(P.loc);
      gl.vertexAttribPointer(P.loc, 2, gl.FLOAT, false, 0, 0);
      bindFootage(P);
      gl.uniform2f(P.U.res, canvas.width, canvas.height);
      gl.uniform1f(P.U.time, T);
      gl.uniform1f(P.U.bass, curBass);
      gl.uniform1f(P.U.flow, flowPhase);
      gl.uniform1f(P.U.beat, T * bpm / 60);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (stage.classList.contains('showhud')) hud.textContent = hudText();
      requestAnimationFrame(frame);
    }

    // draw one idle frame behind the overlay so the stage isn't blank
    (function idle() {
      var P = programFor(active);
      gl.useProgram(P.prog);
      gl.enableVertexAttribArray(P.loc);
      gl.vertexAttribPointer(P.loc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(P.U.res, canvas.width, canvas.height);
      gl.uniform1f(P.U.time, 0); gl.uniform1f(P.U.bass, 0);
      gl.uniform1f(P.U.flow, 0); gl.uniform1f(P.U.beat, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    })();

    // ---------------- start / fullscreen / input ----------------
    var running = false;
    function begin() {
      if (running) return; running = true;
      overlay.classList.add('hidden');
      resize();
      var d = document.documentElement;
      var rf = d.requestFullscreen || d.webkitRequestFullscreen || d.mozRequestFullScreen;
      if (rf) { try { rf.call(d); } catch (e) {} }
      startAudio().then(function () { setTimeout(resize, 120); });
      programFor(active);        // ensure the first program (and its video) exists
      syncVideoPlayback();       // start the active clip if the opening track is footage
      last = performance.now();
      flashHud();
      requestAnimationFrame(frame);
    }
    overlay.addEventListener('click', begin);

    function toggleFullscreen() {
      var d = document.documentElement;
      if (!document.fullscreenElement) { (d.requestFullscreen || d.webkitRequestFullscreen || d.mozRequestFullScreen).call(d); }
      else { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    }

    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var k = e.key;
      if (!running && k !== 'f' && k !== 'F') { if (k === 'Enter' || k === ' ') { begin(); e.preventDefault(); } return; }
      switch (k) {
        case 'ArrowRight': case 'n': case 'N': next(); e.preventDefault(); break;
        case 'ArrowLeft':  case 'p': case 'P': prev(); e.preventDefault(); break;
        case ' ':          togglePause(); e.preventDefault(); break;
        case 'ArrowDown':  case 'b': case 'B': toggleBlackout(); e.preventDefault(); break;
        case 'f': case 'F': toggleFullscreen(); e.preventDefault(); break;
        case 'h': case 'H': case '?': help.classList.toggle('show'); flashHud(); e.preventDefault(); break;
        default:
          if (k >= '1' && k <= '9') { var i = (+k) - 1; if (i < tracks.length) { goto(i); e.preventDefault(); } }
      }
    });
    document.addEventListener('fullscreenchange', function () { setTimeout(resize, 120); });

    var idleTimer;
    global.addEventListener('mousemove', function () {
      document.body.classList.remove('hidecursor');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { document.body.classList.add('hidecursor'); }, 2500);
    });

    // small public handle (optional external control / testing)
    global.AmbientPlayer._live = {
      next: next, prev: prev, goto: goto,
      pause: togglePause, blackout: toggleBlackout,
      current: function () { return active; },
      state: function () {
        return { active: active, playing: playing, blackedOut: blackedOut,
                 busy: fadeState.busy, fade: fadeState.level, T: T, running: running };
      }
    };
  }

  global.AmbientPlayer = { start: start };
})(window);
