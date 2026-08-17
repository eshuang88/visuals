/* Animal Loop — soft breathing memory film (Ariana direction): an anonymous
   blurred form drifting in warm monochrome, halation + bloom, low saturation,
   long holds. Breathing lags the beat (emotion sync, not beat sync). */
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p  = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  float bass = u_bass;
  float ph = u_flow * 2.0;                        // very slow drift

  // a vague anonymous form whose centre wanders
  vec2  c    = 0.26 * vec2(sin(ph*0.6), cos(ph*0.5)) + vec2(0.02, 0.05*sin(ph*0.3));
  float body = fbm(p*1.4 + c + vec2(3.0));
  float form = smoothstep(0.35, 0.85, body + 0.10*sin(ph*0.7));
  float breath = 0.5 + 0.5*sin(u_beat*0.25);      // slow, lags the tempo
  float d = length((p - c) * vec2(1.0, 1.25));
  float figure = smoothstep(0.95, 0.12, d) * (0.6 + 0.4*form);
  figure *= (0.82 + 0.15*breath + 0.20*bass);

  // warm monochrome: violet-black shadows -> warm-white highlights
  vec3 shadow = mix(IL_BLACK, IL_VIOLET*0.5, 0.4);
  vec3 lo  = mix(shadow, IL_BLUE*0.6, 0.30);
  vec3 col = mix(lo, IL_WARMWHITE, figure);

  // halation / bloom around bright areas + a faint warm edge
  float glow = smoothstep(0.40, 1.0, figure);
  col += IL_WARMWHITE * glow*glow * 0.25;
  col += IL_EMBER     * glow      * 0.05;

  // exposure breathing (texture flicker), non-metronomic
  float ef = sin(ph*1.1) + 0.6*sin(ph*1.9 + 1.0);
  col *= 0.92 + 0.06*ef + 0.10*bass;

  // keep saturation low (house rule)
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 0.72);

  gl_FragColor = vec4(ambientPost(col, gl_FragCoord.xy, bass), 1.0);
}
