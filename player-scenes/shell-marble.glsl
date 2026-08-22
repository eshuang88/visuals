/* Shell · Marble — a still photo (u_tex) treated as a glittering retro/VHS
   loop: chromatic aberration, scanlines, a faded CRT grade, animated glitter
   that pulses with the beat, and burst-gated random glitch "damage" (row tears,
   dropouts, channel corruption). Deliberately beat-synced + glittery per the
   brief (a chosen exception to the usual non-metronomic rule). Continuous —
   noise/time driven, so it stays alive with no visible loop seam. */

float h11(float x){ return fract(sin(x * 127.1) * 43758.5453); }

void main(){
  vec2 uv0 = gl_FragCoord.xy / u_res;
  vec2 uv  = texCoverUV(uv0);            // cover-fit the photo into 4:3
  float bass = u_bass;
  float t = u_time;

  // ---- random GLITCH: OCCASIONAL bursts (the image is mostly intact) ----
  // a global gate is open only ~30% of the time (retimed a couple times a sec),
  // so destruction comes in waves rather than constantly.
  float gate  = step(0.70, h11(floor(t * 2.3)));               // ~30% of windows
  float big   = gate * step(0.6, h11(floor(t * 2.3) + 3.3));   // heavier within a burst
  float band  = floor(uv.y * 28.0);
  float burst = gate * step(0.80, h11(band + floor(t * 8.0))); // ~20% of bands, only while gated
  float shift = (h11(band * 1.7 + floor(t * 8.0)) - 0.5) * (0.10 * burst + 0.22 * big) * (0.5 + bass);
  uv.x += shift;
  float drop  = gate * step(0.985, h11(band * 4.1 + floor(t * 8.0))) * (0.6 + 0.4 * big);

  // ---- retro chromatic aberration (RGB split), widens with the bass ----
  float ca = 0.0016 + 0.004 * bass + 0.01 * big * burst;
  vec3 col;
  col.r = texture2D(u_tex, clamp(uv + vec2(ca, 0.0), 0.001, 0.999)).r;
  col.g = texture2D(u_tex, clamp(uv,                 0.001, 0.999)).g;
  col.b = texture2D(u_tex, clamp(uv - vec2(ca, 0.0), 0.001, 0.999)).b;

  // ---- faded retro grade: raised blacks, slight magenta/cyan, gentle desat ----
  col = pow(max(col, 0.0), vec3(0.92));                    // lift
  col = mix(col, col * vec3(1.06, 0.99, 1.06), 0.6);       // faint magenta-cyan cast
  col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), 0.12);
  col = col * 0.9 + 0.03;                                  // faded film black

  // ---- CRT scanlines ----
  col *= 0.92 + 0.08 * sin(gl_FragCoord.y * 3.14159 + t * 2.0);

  // ---- GLITTER: fast twinkles on the highlights, pulsing with the beat ----
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float beatP = 0.5 + 0.5 * sin(u_beat * 6.28318);
  float field = hash(floor(gl_FragCoord.xy / 2.0) + floor(t * 18.0) * vec2(3.1, 7.7));
  float spark = smoothstep(0.80, 1.0, lum) * step(0.990 - 0.18 * bass, field);
  col += vec3(1.0, 0.97, 0.9) * spark * (1.1 + 2.0 * bass) * (0.45 + 0.75 * beatP);
  // sparser bigger "stars" that drift and flare on the beat
  float star = smoothstep(0.92, 1.0, hash(floor(gl_FragCoord.xy / 6.0) + floor(t * 10.0) * 1.3));
  col += vec3(0.9, 0.95, 1.0) * star * smoothstep(0.6, 1.0, lum) * (0.35 + 0.9 * bass) * beatP;

  // ---- damage: dropouts + rare channel-swap corruption inside bursts ----
  col = mix(col, vec3(0.02, 0.02, 0.03) + hash(gl_FragCoord.xy + t) * 0.06, drop);
  float corrupt = step(0.97, h11(floor(t * 6.0)));
  col = mix(col, col.gbr, corrupt * burst * 0.6);

  // ---- projector exposure flicker, kicked by the beat ----
  col *= 0.9 + 0.1 * hash(vec2(floor(t * 12.0), 1.0)) + 0.12 * bass;

  gl_FragColor = vec4(ambientPost(col, gl_FragCoord.xy, bass), 1.0);
}
