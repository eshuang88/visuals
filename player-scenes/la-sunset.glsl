/* LA Sunset — threshold / warm fog (Moonvoid direction): a warm sunset
   gradient with a low soft sun glow and drifting dirty fog bands. Focus and
   pooling wander; nothing keyed to absolute time, so it is seamless. */
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p  = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  float bass = u_bass;
  float ph = u_flow * 2.5;
  float y = uv.y;

  // vertical sunset gradient: warm haze low -> violet -> cool blue high
  vec3 skyLo  = mix(IL_EMBER,      IL_WARMWHITE, 0.35);
  vec3 skyMid = mix(IL_EMBER*0.8,  IL_VIOLET,    0.55);
  vec3 skyHi  = mix(IL_VIOLET*0.7, IL_BLUE*0.8,  0.60);
  vec3 col = mix(skyLo, skyMid, smoothstep(0.15, 0.55, y));
  col = mix(col, skyHi, smoothstep(0.50, 1.00, y));

  // soft low sun glow (below centre), haze pool drifts a little
  vec2  sun = vec2(0.10*sin(ph*0.3), -0.16 + 0.02*sin(ph*0.5));
  float sd  = length((p - sun) * vec2(1.0, 1.6));
  col += mix(IL_WARMWHITE, IL_EMBER, 0.4) * exp(-sd*3.2) * (0.6 + 0.4*bass);
  col += IL_EMBER * exp(-sd*1.2) * 0.15;

  // drifting fog bands — dirty low-res atmosphere
  float fog  = fbm(vec2(p.x*1.2 + ph*0.20, p.y*2.5 - ph*0.15));
  float fog2 = fbm(vec2(p.x*0.8 - ph*0.10, p.y*1.6 + 5.0));
  float haze = 0.5*fog + 0.5*fog2;
  col = mix(col, mix(col, IL_WARMWHITE, 0.5), smoothstep(0.45, 0.9, haze) * (0.35 + 0.20*(1.0 - y)));
  col = mix(col, IL_GRAPHITE*0.6, smoothstep(0.35, 0.0, y) * 0.40 * haze);

  // exposure breathing + bass lift
  float ef = sin(ph*1.3) + 0.6*sin(ph*2.1 + 1.0);
  col *= 0.95 + 0.05*ef + 0.10*bass;

  // keep saturation low
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 0.80);

  gl_FragColor = vec4(ambientPost(col, gl_FragCoord.xy, bass), 1.0);
}
