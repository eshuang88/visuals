/* Cover slide — show a still image (u_tex) CONTAIN-fit inside the 4:3 frame,
   letterboxed on black (the cover art's own black field merges with the bars, so
   it reads full-bleed). Kept faithful to the artwork: only a whisper of animated
   grain and a few-percent bass lift so it breathes with the room instead of
   looking frozen. Used by setlist { cover: '…' } entries. */
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float ia = u_texRes.x / max(u_texRes.y, 1.0);   // image aspect
  float sa = u_res.x    / max(u_res.y, 1.0);       // stage aspect (4:3)

  // contain: fit the whole image, expanding the sample coord past [0,1] in the
  // letterbox direction so those pixels fall outside the image -> black.
  vec2 t = uv - 0.5;
  if (ia > sa) t.y *= ia / sa;   // image wider than 4:3 -> bars top/bottom
  else         t.x *= sa / ia;   // image taller/square -> bars left/right
  t += 0.5;

  vec3 col = vec3(0.0);
  if (t.x > 0.0 && t.x < 1.0 && t.y > 0.0 && t.y < 1.0)
    col = texture2D(u_tex, t).rgb;

  col *= 1.0 + 0.04 * u_bass;                       // subtle life with the room
  float g = hash(gl_FragCoord.xy + fract(u_time) * vec2(91.7, 47.3));
  col += (g - 0.5) * 0.02;                          // whisper of grain (not frozen)

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
