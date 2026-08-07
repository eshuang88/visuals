#!/usr/bin/env python3
"""
animal01 — build a memory-film montage from a shot list (Zayn direction).

  python3 render.py            # -> out/track_animal01.mp4  (full quality)
  python3 render.py --preview  # also -> out/track_animal01_preview.mp4  (<30MB, for chat)

Reads shots.txt (see that file for the format). Each photo becomes a slow-push
4:3 clip with a blurred fill behind it (so nothing gets cropped); videos keep
their motion and, with `full`, their native length. Shots are joined with short
dissolves, then the whole timeline gets one consistent film treatment: cold
grade, heavy grain, projector flicker / exposure breathing, halation, vignette.

Add a shot later: drop the file in assets/, add a line to shots.txt, rerun.
Only ffmpeg/ffprobe are required.
"""
import os, sys, subprocess, shlex

HERE   = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
OUT    = os.path.join(HERE, "out")

# ---- house look (matches the approved cut; tweak here to restyle every shot) ----
W, H       = 1440, 1080     # 4:3 canvas
FPS        = 24             # film cadence
XFADE      = 0.5            # dissolve length between shots (s)
SUPER_W, SUPER_H = 1920, 1440  # oversized composite so the slow push stays sharp
ZOOM_RATE  = 0.0006         # slow push per frame
ZOOM_MAX   = 1.06
GRAIN      = 26            # film grain strength (higher = heavier)
BLOOM      = 0.45          # halation / highlight glow opacity
VIGNETTE   = "PI/4.2"      # smaller denominator = heavier vignette
# projector flicker + exposure breathing (time expression on brightness):
FLICKER = ("0.03*sin(2*PI*0.55*t)"          # slow exposure breathing
           "+0.05*sin(2*PI*3.3*t)"          # faster projector shimmer
           "+0.10*pow(max(0\\,sin(2*PI*0.13*t))\\,60)"        # sparse lamp surges
           "-0.10*pow(max(0\\,sin(2*PI*0.09*t+1.7))\\,60)")   # sparse dips
PHOTO_EXT = (".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff")


def probe_duration(path):
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", path])
    return float(out.strip())


def parse_shots():
    shots = []
    with open(os.path.join(HERE, "shots.txt")) as f:
        for raw in f:
            line = raw.split("#", 1)[0].strip()
            if not line:
                continue
            parts = [p.strip() for p in line.split("|")]
            fn = parts[0]
            dur = parts[1] if len(parts) > 1 else "5"
            bright = float(parts[2]) if len(parts) > 2 and parts[2] else 0.0
            sat = float(parts[3]) if len(parts) > 3 and parts[3] else 0.9
            gamma = float(parts[4]) if len(parts) > 4 and parts[4] else 1.0
            path = os.path.join(ASSETS, fn)
            if not os.path.exists(path):
                sys.exit(f"missing asset: {path}")
            is_photo = os.path.splitext(fn)[1].lower() in PHOTO_EXT
            if dur == "full":
                seconds = probe_duration(path)
            else:
                seconds = float(dur)
            shots.append(dict(fn=fn, path=path, photo=is_photo,
                              seconds=seconds, trim=(dur != "full"),
                              bright=bright, sat=sat, gamma=gamma))
    if not shots:
        sys.exit("shots.txt has no shots")
    return shots


def build_filter(shots):
    fill = (f"scale={SUPER_W}:{SUPER_H}:force_original_aspect_ratio=increase,"
            f"crop={SUPER_W}:{SUPER_H},gblur=sigma=55,eq=brightness=-0.22:saturation=0.4")
    fit = f"scale={SUPER_W}:{SUPER_H}:force_original_aspect_ratio=decrease"
    lines = []
    for k, s in enumerate(shots):
        eq = f"eq=brightness={s['bright']}:saturation={s['sat']}:gamma={s['gamma']}"
        lines.append(f"[{k}:v]split=2[b{k}][f{k}];"
                     f"[b{k}]{fill}[bb{k}];[f{k}]{fit}[ff{k}];"
                     f"[bb{k}][ff{k}]overlay=(W-w)/2:(H-h)/2[c{k}];")
        if s["photo"]:
            frames = max(1, round(s["seconds"] * FPS))
            zp = (f"zoompan=z='min(zoom+{ZOOM_RATE},{ZOOM_MAX})':"
                  f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                  f"d={frames}:s={W}x{H}:fps={FPS}")
            lines.append(f"[c{k}]{zp},{eq},setsar=1,format=yuv420p[s{k}];")
        else:
            trim = f"trim=0:{s['seconds']},setpts=PTS-STARTPTS," if s["trim"] else ""
            lines.append(f"[c{k}]scale={W}:{H},{trim}fps={FPS},{eq},"
                         f"setsar=1,format=yuv420p[s{k}];")

    # dissolve chain
    if len(shots) == 1:
        cur = "s0"
    else:
        acc = shots[0]["seconds"]
        prev = "s0"
        for k in range(1, len(shots)):
            off = acc - XFADE
            out = f"x{k}"
            lines.append(f"[{prev}][s{k}]xfade=transition=fade:duration={XFADE}:"
                         f"offset={off:.3f}[{out}];")
            acc += shots[k]["seconds"] - XFADE
            prev = out
        cur = prev

    # global film treatment
    lines.append(
        f"[{cur}]format=gbrp,"
        f"eq=saturation=0.66:contrast=1.08:brightness='{FLICKER}':eval=frame,"
        f"colorbalance=bs=0.08:bm=0.03:rh=0.02:gh=0.01,split=2[base][gl];")
    lines.append("[gl]curves=all='0/0 0.62/0 1/1',gblur=sigma=14[glb];")
    lines.append(f"[base][glb]blend=all_mode=screen:all_opacity={BLOOM}[bloom];")
    lines.append(f"[bloom]noise=alls={GRAIN}:allf=t+u,vignette={VIGNETTE},format=yuv420p[out]")
    return "\n".join(lines)


def main():
    shots = parse_shots()
    total = sum(s["seconds"] for s in shots) - XFADE * (len(shots) - 1)
    os.makedirs(OUT, exist_ok=True)
    fc = os.path.join(OUT, "_filter.txt")
    with open(fc, "w") as f:
        f.write(build_filter(shots))

    inputs = []
    for s in shots:
        inputs += ["-i", s["path"]]
    master = os.path.join(OUT, "track_animal01.mp4")
    print(f"{len(shots)} shots, ~{total:.1f}s -> {master}")
    subprocess.check_call(["ffmpeg", "-y", *inputs,
        "-filter_complex_script", fc, "-map", "[out]", "-an",
        "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "19",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", master])

    if "--preview" in sys.argv:
        # size-targeted two-pass to fit a ~30MB chat limit
        prev = os.path.join(OUT, "track_animal01_preview.mp4")
        kbps = max(800, int(26 * 8 * 1024 / total))
        common = ["-vf", "scale=1280:960", "-c:v", "libx264", "-preset", "slow",
                  "-tune", "grain", "-b:v", f"{kbps}k"]
        subprocess.check_call(["ffmpeg", "-y", "-i", master, *common,
                               "-pass", "1", "-an", "-f", "mp4", os.devnull])
        subprocess.check_call(["ffmpeg", "-y", "-i", master, *common,
                               "-pass", "2", "-an", "-movflags", "+faststart", prev])
        for junk in ("ffmpeg2pass-0.log", "ffmpeg2pass-0.log.mbtree"):
            if os.path.exists(junk):
                os.remove(junk)
        print(f"preview -> {prev} (~{kbps}kbps)")


if __name__ == "__main__":
    main()
