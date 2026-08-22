/* Marble Gold — warm marbled liquid metal. Deliberate warm palette variant
   (bronze/gold body, cold-white sheen). Seamless: all flow enters via
   continuous circular offsets of the accumulated drift, so there is no loop
   seam. u_bass swells the relief and the sheen. */
vec3 goldRamp(float h){
  h = clamp(h, 0.0, 1.0);
  vec3 c0 = vec3(0.040, 0.028, 0.018);
  vec3 c1 = vec3(0.300, 0.170, 0.050);
  vec3 c2 = vec3(0.620, 0.400, 0.120);
  vec3 c3 = vec3(0.920, 0.720, 0.300);
  vec3 c4 = vec3(1.000, 0.950, 0.720);
  vec3 col = mix(c0, c1, smoothstep(0.00, 0.35, h));
  col = mix(col, c2, smoothstep(0.30, 0.60, h));
  col = mix(col, c3, smoothstep(0.55, 0.80, h));
  col = mix(col, c4, smoothstep(0.78, 1.00, h));
  return col;
}
float heat(vec2 p, float ph, float bass){
  vec2 c1 = 0.55 * vec2(cos(ph),           sin(ph));
  vec2 c2 = 0.42 * vec2(cos(ph*0.73 + 1.7), sin(ph*0.73 + 1.7));
  float w1 = fbm(p + c1);
  vec2  p2 = p + 1.35 * vec2(w1, fbm(p + c1 + 3.1));
  float w2 = fbm(p2 + c2);
  vec2  p3 = p2 + 1.0 * vec2(w2, fbm(p2 + c2 + 6.2));
  float h  = fbm(p3);
  h = clamp(h * 1.18 - 0.05 + bass * 0.22, 0.0, 1.0);
  return mix(h, smoothstep(0.05, 0.95, h), 0.35);
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  float bass = u_bass;
  float ph = u_flow * 6.0;                       // continuous churn (seamless)
  vec2  p  = uv * 2.6 + 6.0;

  float e  = 0.014;
  float hC = heat(p,                 ph, bass);
  float hR = heat(p + vec2(e, 0.0),  ph, bass);
  float hL = heat(p - vec2(e, 0.0),  ph, bass);
  float hU = heat(p + vec2(0.0, e),  ph, bass);
  float hD = heat(p - vec2(0.0, e),  ph, bass);
  float relief = 0.55 + bass * 0.40;
  vec2  grad   = vec2(hR - hL, hU - hD) / (2.0 * e);
  vec3  N      = normalize(vec3(-grad * relief, 1.0));

  vec3 col = goldRamp(hC);

  // creamy chrome streaks from the heat-field normal direction
  float ang    = atan(N.y, N.x);
  float chrome = pow(0.5 + 0.5*sin(ang*3.0 + hC*10.0 + ph*0.3), 1.5);
  vec3  cream  = vec3(0.97, 0.92, 0.80);
  col = mix(col, col * cream * (0.55 + 0.9*chrome), 0.30 * smoothstep(0.30, 0.80, hC));

  // warm cream specular sheen — a non-metronomic flicker instrument. Kept warm
  // and gentle (no cold blue) to hold the low-saturation house rule.
  float sheen = smoothstep(0.0, 0.16, length(grad) * 0.5);
  float flick = 0.25 + 0.55 * (0.5 + 0.5*sin(ph*3.1) + 0.25*sin(ph*5.3)) * (0.5 + 0.5*bass);
  col += vec3(0.98, 0.95, 0.86) * sheen * chrome * flick * 0.55 * smoothstep(0.55, 0.96, hC);

  // deep molten valleys keep a faint bronze glow
  col += vec3(0.30, 0.14, 0.03) * smoothstep(0.40, 0.0, hC) * 0.15;

  // exposure flutter (few %), plus bass lift
  float ef = sin(ph*1.7 + 1.3) + 0.7*sin(ph*2.9);
  col *= 1.0 + 0.045*ef + 0.10*bass;

  // hue-preserving highlight rolloff: keep every channel under ~1 so the house
  // cold S-grade in ambientPost can't invert blown warm highlights toward blue.
  col /= 1.0 + 0.35 * max(max(col.r, col.g), col.b);

  gl_FragColor = vec4(ambientPost(col, gl_FragCoord.xy, bass), 1.0);
}
