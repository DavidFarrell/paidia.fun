"""Review helpers for a rendered MP4.

  python3 tools/review.py sheets out/video.mp4 out/review   # contact sheets, 1 frame/s
  python3 tools/review.py motion out/video.mp4              # frame-difference spikes

The motion report lists frames where the picture jumps much more than its
neighbours (unintended cuts or glitches), with the scene they fall in.
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw


def frames(path, w, h, fps=None):
    cmd = ["ffmpeg", "-loglevel", "error", "-i", path]
    if fps:
        cmd += ["-vf", f"fps={fps},scale={w}:{h}"]
    else:
        cmd += ["-vf", f"scale={w}:{h}"]
    cmd += ["-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = w * h * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)


def sheets(path, out):
    os.makedirs(out, exist_ok=True)
    w, h, cols, rows = 384, 216, 5, 6
    per = cols * rows
    batch, k = [], 0
    for i, fr in enumerate(frames(path, w, h, fps=1)):
        batch.append((i, fr))
        if len(batch) == per:
            save_sheet(batch, out, k, w, h, cols, rows)
            batch, k = [], k + 1
    if batch:
        save_sheet(batch, out, k, w, h, cols, rows)


def save_sheet(batch, out, k, w, h, cols, rows):
    sheet = Image.new("RGB", (cols * w, rows * (h + 18)), "black")
    d = ImageDraw.Draw(sheet)
    for j, (i, fr) in enumerate(batch):
        x, y = (j % cols) * w, (j // cols) * (h + 18)
        sheet.paste(Image.fromarray(fr), (x, y + 18))
        d.text((x + 4, y + 3), f"{i // 60}:{i % 60:02d}", fill="white")
    sheet.save(os.path.join(out, f"sheet_{k:02d}.jpg"), quality=82)


def motion(path, timeline="out/timeline.json"):
    tl = json.load(open(timeline)) if os.path.exists(timeline) else None
    prev, diffs = None, []
    for fr in frames(path, 192, 108):
        g = fr.astype(np.float32).mean(axis=2)
        if prev is not None:
            diffs.append(float(np.abs(g - prev).mean()))
        prev = g
    d = np.array(diffs)
    med = np.median(d)
    print(f"{len(d) + 1} frames; median change {med:.2f}, 95th pct {np.percentile(d, 95):.2f}, max {d.max():.2f}")
    for i in np.argsort(d)[::-1][:15]:
        f = i + 1
        scene = ""
        if tl:
            for s in tl["scenes"]:
                if s["start"] <= f < s["start"] + s["len"]:
                    scene = f"{s['id']} +{f - s['start']}"
        print(f"  frame {f:5d} ({f / 30:6.2f}s)  change {d[i]:6.2f}  {scene}")


if __name__ == "__main__":
    if sys.argv[1] == "sheets":
        sheets(sys.argv[2], sys.argv[3])
    else:
        motion(sys.argv[2])
