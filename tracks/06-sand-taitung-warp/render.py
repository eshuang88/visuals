#!/usr/bin/env python3
"""
IL_sandTaitung_warp — render the footage track as a treated 45s film.

  python3 render.py            # -> out/track_sandTaitung_warp.mp4      (1440x1080)
  python3 render.py --preview  # also -> out/..._preview.mp4            (<~15MB, for chat)

This is the FILM half of the track (companion to the live WebGL scene in
index.html). It takes the seamless loop in assets/ and:

  · fits it to 4:3 with a slow horizontal pan (a drift across the wider frame),
  · lays a gentle DISPLACE flow-warp over it (two slow scrolling sine fields) so
    the sand liquefies a touch — the "warp" the track is named for,
  · grades it into the house look: cool low-saturation body, teal shadows, a
    warm-white halation lifted off the dry-sand crests, vignette, film grain,
    and a slow non-metronomic exposure breath,
  · loops the ~10.7s seamless clip out to 45s. Because the loop is seamless and
    the pan / grade / warp all evolve as slow functions of time, the repeats
    read as continuous "improvised" drift rather than a hard loop.

Only ffmpeg is required (set $FFMPEG to override the binary). out/ is gitignored.
Tune the whole-film look with the constants below — change once, every second
follows.
"""
import os, sys, subprocess

HERE   = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
OUT    = os.path.join(HERE, "out")
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")

SRC = os.path.join(ASSETS, "sand-taitung.mp4")   # seamless ~10.7s loop (also .webm)

# ---- film canvas ----
W, H   = 1440, 1080     # 4:3
FPS    = 24
LENGTH = 45             # seconds

# ---- house look (tweak here to restyle the whole film) ----
PAN_AMP   = 0.55        # how far the crop drifts across the wider frame (0..1 of slack)
PAN_RATE  = 0.020       # pan speed (Hz-ish)
WARP_AMP  = 10          # flow-warp displacement in px (0 = off)
WARP_RATE = 0.05        # warp scroll speed
SAT       = 0.74        # saturation (house = low)
CONTRAST  = 1.09
BLOOM_SIG = 11          # halation blur radius
BLOOM_OP  = 0.34        # halation opacity
VIGNETTE  = "PI/4.4"    # smaller denominator = heavier vignette
GRAIN     = 13          # film grain strength
CRF       = 21          # x264 quality (lower = better/bigger; grain inflates size)
# slow, non-metronomic exposure breath (brightness offset over time):
FLICKER   = "0.020*sin(2*PI*0.055*t)+0.030*sin(2*PI*0.017*t+1.3)"


def build_filter(loops):
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
        "eq=saturation={sat}:contrast={con}:brightness=-0.015,"
        # cool the body, push shadows teal/green, keep highlights warm-white
        "colorbalance=rs=-0.05:gs=0.04:bs=0.06:rm=-0.02:gm=0.01:bm=0.01:rh=0.03:gh=0.01:bh=-0.03,"
        "curves=all='0/0.008 0.5/0.46 1/0.985',"
        "split[g_a][g_b];"
        "[g_b]gblur=sigma={bsig},curves=all='0/0 0.55/0.72 1/1'[g_glow];"
        "[g_a][g_glow]blend=all_mode=screen:all_opacity={bop},"
        "eq=brightness='{flick}':eval=frame,"
        "vignette={vig},"
        "noise=alls={grain}:allf=t+u,"
        "format=yuv420p[out]"
        .format(node=node, sat=SAT, con=CONTRAST, bsig=BLOOM_SIG,
                bop=BLOOM_OP, flick=FLICKER, vig=VIGNETTE, grain=GRAIN)
    )
    return head + ";" + grade


def render(preview=False):
    if not os.path.exists(SRC):
        sys.exit("missing " + SRC)
    os.makedirs(OUT, exist_ok=True)
    loops = LENGTH  # -stream_loop count is generous; -t trims to LENGTH
    fc = build_filter(loops)
    out = os.path.join(OUT, "track_sandTaitung_warp.mp4")
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
        pv = os.path.join(OUT, "track_sandTaitung_warp_preview.mp4")
        subprocess.check_call([
            FFMPEG, "-hide_banner", "-y", "-i", out,
            "-vf", "scale=960:720", "-c:v", "libx264", "-crf", "28",
            "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", pv])
        print("wrote", pv)


if __name__ == "__main__":
    render(preview="--preview" in sys.argv)
