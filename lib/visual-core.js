/* Imaginary Lands — shared visual engine.
 *
 * Classic script (works from file:// with no server). Exposes window.Ambient.
 * A track supplies only a fragment-shader scene (a `void main(){...}`) that uses
 * the standard uniforms and the GLSL prelude helpers below, then calls:
 *
 *   Ambient.start({ title, subtitle, bpm });   // reads the #scene <script> tag
 *
 * Standard uniforms available to every scene:
 *   u_res   vec2   drawing-buffer resolution (px)
 *   u_time  float  seconds since load
 *   u_bass  float  0..1 low-frequency energy (mic, or BPM fallback when silent)
 *   u_flow  float  slowly accumulated drift phase (seamless; never resets)
 *   u_beat  float  continuous beat count at the track BPM
 *
 * Prelude helpers: hash(), vnoise(), fbm(), the IL_* palette consts, and
 * ambientPost(col, fragCoord, bass) — the house grade + vignette + grain.
 * See CLAUDE.md for the aesthetic conventions these encode.
 */
(function (global) {
  'use strict';

  var PRELUDE = [
    'precision highp float;',
    'uniform vec2  u_res;',
    'uniform float u_time;',
    'uniform float u_bass;',
    'uniform float u_flow;',
    'uniform float u_beat;',
    '',
    '// ---- Imaginary Lands canonical palette (see CLAUDE.md) ----',
    'const vec3 IL_BLACK     = vec3(0.035, 0.043, 0.051); // #090b0d near-black',
    'const vec3 IL_GRAPHITE  = vec3(0.188, 0.216, 0.204); // #303734 graphite green',
    'const vec3 IL_BLUE      = vec3(0.322, 0.412, 0.435); // #52696f desaturated blue',
    'const vec3 IL_VIOLET    = vec3(0.545, 0.482, 0.557); // #8b7b8e muted violet',
    'const vec3 IL_WARMWHITE = vec3(0.871, 0.851, 0.792); // #ded9ca warm white',
    'const vec3 IL_ICE       = vec3(0.596, 0.741, 0.769); // #98bdc4 accent (cool)',
    'const vec3 IL_ACID      = vec3(0.788, 0.910, 0.541); // #c9e88a accent (use sparingly)',
    'const vec3 IL_EMBER     = vec3(0.741, 0.514, 0.373); // #bd835f accent (warm)',
    '',
    '// ---- hash / value noise / smooth fbm ----',
    'float hash(vec2 p){',
    '  p = fract(p * vec2(123.34, 345.45));',
    '  p += dot(p, p + 34.345);',
    '  return fract(p.x * p.y);',
    '}',
    'float vnoise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f*f*(3.0-2.0*f);',
    '  float a = hash(i), b = hash(i+vec2(1.0,0.0));',
    '  float c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));',
    '  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);',
    '}',
    'const mat2 IL_M = mat2(1.62, 1.18, -1.18, 1.62);',
    '// low octave count + quick roll-off -> big soft forms, not high-frequency crinkle',
    'float fbm(vec2 p){',
    '  float v = 0.0, a = 0.58;',
    '  for(int i=0;i<5;i++){ v += a*vnoise(p); p = IL_M*p; a *= 0.44; }',
    '  return v;',
    '}',
    '',
    '// ---- house post: bass swell + cold S-grade + vignette + film grain ----',
    'vec3 ambientPost(vec3 col, vec2 fragCoord, float bass){',
    '  col *= 1.0 + bass * 0.10;                              // whole frame swells with the bass',
    '  col = pow(max(col, 0.0), vec3(0.95));                  // gentle lift',
    '  col = mix(col, col*col*(3.0-2.0*col), 0.45);           // S-contrast: crush valleys, bloom crests',
    '  vec2 uvn = fragCoord / u_res;',
    '  float vig = smoothstep(1.25, 0.35, length((uvn-0.5)*vec2(1.15,1.35)));',
    '  col *= 0.55 + 0.45*vig;',
    '  float g  = hash(fragCoord + fract(u_time)*vec2(91.7, 47.3));  // animated grain',
    '  float g2 = hash(fragCoord * 1.7 + 3.1);                       // static paper grain',
    '  col += (g - 0.5) * 0.055;',
    '  col *= 1.0 - (g2 - 0.5) * 0.05;',
    '  return clamp(col, 0.0, 1.0);',
    '}',
    ''
  ].join('\n');

  var VERT = 'attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }';

  function buildDOM(opts) {
    var wrap = document.createElement('div'); wrap.id = 'wrap';
    var stage = document.createElement('div'); stage.id = 'stage';
    var canvas = document.createElement('canvas'); canvas.id = 'gl';
    var hud = document.createElement('div'); hud.id = 'hud';
    hud.innerHTML = 'AMBIENT · <span id="src">' + (opts.bpm | 0) + ' BPM</span> · <span id="lvl">—</span>';
    var overlay = document.createElement('div'); overlay.id = 'overlay';
    overlay.innerHTML =
      '<div class="title">' + esc(opts.title || '') + '</div>' +
      '<div class="sub">' + (opts.subtitle || '') + '</div>' +
      '<div class="go">CLICK TO START</div>';
    stage.appendChild(canvas); stage.appendChild(hud); stage.appendChild(overlay);
    wrap.appendChild(stage);
    document.body.appendChild(wrap);
    return { stage: stage, canvas: canvas, overlay: overlay, hud: hud };
  }

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  function start(opts) {
    opts = opts || {};
    var BPM = opts.bpm || 115;
    var sceneSrc = opts.scene ||
      (document.getElementById(opts.sceneId || 'scene') || {}).textContent;
    if (!sceneSrc) throw new Error('Ambient.start: no scene shader (pass opts.scene or add a <script id="scene">).');

    var dom = buildDOM(opts);
    var canvas = dom.canvas, stage = dom.stage, overlay = dom.overlay;
    var srcEl = dom.hud.querySelector('#src'), lvlEl = dom.hud.querySelector('#lvl');

    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' })
          || canvas.getContext('experimental-webgl');
    if (!gl) { overlay.querySelector('.sub').textContent = '此瀏覽器不支援 WebGL'; return; }

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src);
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, PRELUDE + '\n' + sceneSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      bass: gl.getUniformLocation(prog, 'u_bass'),
      flow: gl.getUniformLocation(prog, 'u_flow'),
      beat: gl.getUniformLocation(prog, 'u_beat')
    };

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

    // ---------------- audio: mic bass with BPM fallback ----------------
    var analyser = null, freq = null;
    var micLevel = 0, silence = 0, fbWeight = 1, flowPhase = 0;
    var last = performance.now();

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
      })['catch'](function () { analyser = null; }); // denied / no device -> pure BPM fallback
    }

    function readBass() {
      if (!analyser) return 0;
      analyser.getByteFrequencyData(freq);
      var s = 0, N = 8; // lowest bins ~20-200 Hz for 44.1k / fft 1024
      for (var i = 1; i <= N; i++) s += freq[i];
      return Math.min(1, (s / N / 255) * 1.6);
    }

    function fallbackEnv(t) {
      // gentle undulation locked to the BPM: slow swell + soft per-beat pulse
      var beat = t * BPM / 60;
      var pulse = Math.exp(-((beat % 1)) * 3.2);
      var swell = 0.5 + 0.5 * Math.sin(t * (BPM / 60) * Math.PI);
      return Math.min(1, 0.30 * swell + 0.55 * pulse);
    }

    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      var t = now / 1000;

      var raw = readBass();
      micLevel += (raw - micLevel) * 0.25;
      if (micLevel < 0.045) silence += dt; else silence = 0;
      var wantFallback = (!analyser || silence > 1.4) ? 1 : 0;
      fbWeight += (wantFallback - fbWeight) * 0.04;

      var bass = micLevel * (1 - fbWeight) + fallbackEnv(t) * fbWeight;
      flowPhase += dt * (0.05 + bass * 0.06);

      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.time, t);
      gl.uniform1f(U.bass, bass);
      gl.uniform1f(U.flow, flowPhase);
      gl.uniform1f(U.beat, t * BPM / 60);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (stage.classList.contains('showhud')) {
        srcEl.textContent = fbWeight > 0.5 ? (BPM + ' BPM') : 'MIC';
        lvlEl.textContent = '▁▂▃▄▅▆▇█'[Math.min(7, Math.floor(bass * 8))] || '▁';
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // ---------------- start / fullscreen / UX ----------------
    function begin() {
      overlay.classList.add('hidden');
      resize();
      var el = document.documentElement;
      var rf = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
      if (rf) { try { rf.call(el); } catch (e) {} }
      startAudio().then(function () { setTimeout(resize, 120); });
    }
    overlay.addEventListener('click', begin);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'f' || e.key === 'F') {
        var el = document.documentElement;
        if (!document.fullscreenElement) { (el.requestFullscreen || el.webkitRequestFullscreen).call(el); }
        else { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
      }
      if (e.key === 'h' || e.key === 'H') stage.classList.toggle('showhud');
    });
    document.addEventListener('fullscreenchange', function () { setTimeout(resize, 120); });

    var idle;
    global.addEventListener('mousemove', function () {
      document.body.classList.remove('hidecursor');
      clearTimeout(idle);
      idle = setTimeout(function () { document.body.classList.add('hidecursor'); }, 2500);
    });
  }

  global.Ambient = { start: start, PRELUDE: PRELUDE };
})(window);
