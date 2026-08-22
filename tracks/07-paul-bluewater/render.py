#!/usr/bin/env python3
"""
IL_paulBlueWater — render the footage track as a treated 30s loop film.

  python3 render.py            # -> out/track_paulBlueWater.mp4        (1440x1080)
  python3 render.py --preview  # also -> out/..._preview.mp4           (<~15MB, for chat)

This is the FILM half of the track (companion to the live WebGL scene in
index.html), and the literal "30 秒 loop": a self-contained 30-second seamless
file to drop into Resolume / a projector as a plain clip when you don't want the
live player. It takes the seamless loop in assets/ and:

  · fits it to 4:3 with a slow horizontal pan (a drift across the wider frame),
  · lays a gentle DISPLACE flow-warp over it (two slow scrolling sine fields) so
    the reflection liquefies a touch — the "warp" the track leans on,
  · grades it into the house look, tuned for THIS clip (which is bright / high-key,
    unlike the dark-sand track): the whole frame is pulled DOWN into the near-black
    mood, the blue reflection kept as a cool low-saturation body, the pale floor a
    darkened graphite, warm-white halation only on the brightest crests, vignette,
    film grain, and a slow non-metronomic exposure breath,
  · loops the ~7.9s seamless clip out to 30s. Because the loop is seamless and the
    pan / grade / warp all evolve as slow functions of time, the repeats read as
    continuous drift rather than a hard loop — and the file itself loops cleanly
    end-to-end (it starts and ends on the loop's seam).

Only ffmpeg is required (set $FFMPEG to override the binary). out/ is gitignored.
Tune the whole-film look with the constants below — change once, every second
follows.
"""
import os, sys, subprocess

HERE   = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
OUT    = os.path.join(HERE, "out")
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")

SRC = os.path.join(ASSETS, "paul-bluewater.mp4")   # seamless ~7.9s loop (also .webm)

# ---- film canvas ----
W, H   = 1440, 1080     # 4:3
FPS    = 24
LENGTH = 30             # seconds — the "30 秒 loop"

# ---- house look (tweak here to restyle the whole film) ----
PAN_AMP   = 0.50        # how far the crop drifts across the wider frame (0..1 of slack)
PAN_RATE  = 0.018       # pan speed (Hz-ish)
WARP_AMP  = 9           # flow-warp displacement in px (0 = off)
WARP_RATE = 0.045       # warp scroll speed
SAT       = 0.70        # saturation (house = low)
CONTRAST  = 1.12
BRIGHT    = -0.060      # this clip is high-key — seat it well down into the mood
BLOOM_SIG = 12          # halation blur radius
BLOOM_OP  = 0.28        # halation opacity (restrained — only the brightest crests)
VIGNETTE  = "PI/4.2"    # smaller denominator = heavier vignette
GRAIN     = 12          # film grain strength
CRF       = 21          # x264 quality (lower = better/bigger; grain inflates size)
# slow, non-metronomic exposure breath (brightness offset over time):
FLICKER   = "0.018*sin(2*PI*0.050*t)+0.028*sin(2*PI*0.016*t+1.3)"


def build_filter():
    # up-scale the loop to canvas height, then a slowly panning 4:3 crop
    pan_x = ("(in_w-{W})/2 + (in_w-{W})/2*{A}*sin(2*PI*{R}*t)"
             .format(W=W, A=PAN_AMP, R=PAN_RATE))
    chain = [
        "[0:v]fps={fps},scale=-2:{H}:flags=bicubic,setsar=1".format(fps=FPS, H=H),
        "crop={W}:{H}:x='{px}':y=0".format(W=W, H=H, px=pan_x),
    ]
    pre = ",".join(chain)

    # gentle DISPLACE flow-warp: two smooth scrolling sine fields as x/y maps.
    # Maps are computed at quarter-res (geq is per-pixel + slow) then scaled up;
    # the warp is low-frequency so the upscale stays smooth. Maps center on 128
    # (= no shift); deviation from 128 is the per-pixel displacement in px.
    if WARP_AMP > 0:
        mw, mh = W // 4, H // 4
        base_src = "color=c=black:s={w}x{h}:r={fps}:d={dur},format=gray".format(
            w=mw, h=mh, fps=FPS, dur=LENGTH)
        mapx = ("{src},geq='128+{k}*sin((Y/10)+2*PI*{r}*T)"
                "+{k}*0.6*sin((X/15)-2*PI*{r}*0.7*T)',scale={W}x{H}"
                .format(src=base_src, k=WARP_AMP, r=WARP_RATE, W=W, H=H))
        mapy = ("{src},geq='128+{k}*sin((X/12)-2*PI*{r}*0.8*T)"
                "+{k}*0.6*sin((Y/16)+2*PI*{r}*1.1*T)',scale={W}x{H}"
                .format(src=base_src, k=WARP_AMP, r=WARP_RATE, W=W, H=H))
        warp = ("{pre}[base];"
                "{mapx}[mx];{mapy}[my];"
                "[base][mx][my]displace=edge=smear[warped]"
                .format(pre=pre, mapx=mapx, mapy=mapy))
        head = warp
        node = "[warped]"
    else:
        head = pre + "[warped]"
        node = "[warped]"

    # grade -> halation -> vignette -> exposure breath -> grain
    grade = (
        "{node}"
        "eq=saturation={sat}:contrast={con}:brightness={bri},"
        # cool the body: teal/blue in shadows + mids, keep the crests warm-white
        "colorbalance=rs=-0.06:gs=0.03:bs=0.08:rm=-0.04:gm=0.01:bm=0.05:rh=0.03:gh=0.01:bh=-0.02,"
        # pull the whole tonal range down; deepen the black, cap the highlights
        "curves=all='0/0.006 0.5/0.40 1/0.95',"
        "split[g_a][g_b];"
        "[g_b]gblur=sigma={bsig},curves=all='0/0 0.62/0.70 1/1'[g_glow];"
        "[g_a][g_glow]blend=all_mode=screen:all_opacity={bop},"
        "eq=brightness='{flick}':eval=frame,"
        "vignette={vig},"
        "noise=alls={grain}:allf=t+u,"
        "format=yuv420p[out]"
        .format(node=node, sat=SAT, con=CONTRAST, bri=BRIGHT, bsig=BLOOM_SIG,
                bop=BLOOM_OP, flick=FLICKER, vig=VIGNETTE, grain=GRAIN)
    )
    return head + ";" + grade


def render(preview=False):
    if not os.path.exists(SRC):
        sys.exit("missing " + SRC)
    os.makedirs(OUT, exist_ok=True)
    fc = build_filter()
    out = os.path.join(OUT, "track_paulBlueWater.mp4")
    cmd = [FFMPEG, "-hide_banner", "-y",
           "-stream_loop", "8", "-i", SRC,
           "-filter_complex", fc, "-map", "[out]",
           "-t", str(LENGTH), "-r", str(FPS),
           "-c:v", "libx264", "-crf", str(CRF), "-preset", "medium",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    print("rendering", out, "...")
    subprocess.check_call(cmd)
    print("wrote", out)

    if preview:
        pv = os.path.join(OUT, "track_paulBlueWater_preview.mp4")
        subprocess.check_call([
            FFMPEG, "-hide_banner", "-y", "-i", out,
            "-vf", "scale=960:720", "-c:v", "libx264", "-crf", "28",
            "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", pv])
        print("wrote", pv)


if __name__ == "__main__":
    render(preview="--preview" in sys.argv)
