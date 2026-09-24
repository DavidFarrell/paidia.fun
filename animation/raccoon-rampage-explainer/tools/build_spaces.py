"""Add token spaces to data/europe.json.

- Rest-of-Europe spaces (green, orange, red) for black raccoon tokens, placed at
  hand-picked spots, nearest to Germany and France first as on the game board.
- Candidate token spots inside Germany and France (Poisson-disc sampled) for
  the yellow and blue raccoon tokens.
"""
import json
import math
import random

d = json.load(open("data/europe.json"))
by = {c["iso"]: c for c in d["countries"]}

SPACES = {
    "green": [(632, 402), (590, 482), (700, 668), (885, 628), (925, 526), (738, 228), (648, 540)],
    "orange": [(1037, 400), (792, 752), (330, 860), (440, 400), (1068, 632), (1058, 560)],
    "red": [(893, 110), (120, 930), (960, 905), (1030, 782), (1262, 668), (250, 300), (1140, 230)],
}


def inside(pt, ring):
    x, y = pt
    c = False
    for i in range(len(ring)):
        x1, y1 = ring[i - 1]
        x2, y2 = ring[i]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def dist_to_edge(pt, ring):
    best = 1e9
    for i in range(len(ring)):
        (x1, y1), (x2, y2) = ring[i - 1], ring[i]
        dx, dy = x2 - x1, y2 - y1
        t = max(0, min(1, ((pt[0] - x1) * dx + (pt[1] - y1) * dy) / (dx * dx + dy * dy or 1)))
        best = min(best, math.hypot(pt[0] - x1 - t * dx, pt[1] - y1 - t * dy))
    return best


def slots(iso, n, r, margin, seed):
    ring = max(by[iso]["rings"], key=len)
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    rnd = random.Random(seed)
    pts = []
    tries = 0
    while len(pts) < n and tries < 200000:
        tries += 1
        p = (rnd.uniform(min(xs), max(xs)), rnd.uniform(min(ys), max(ys)))
        if not inside(p, ring) or dist_to_edge(p, ring) < margin:
            continue
        if all(math.hypot(p[0] - q[0], p[1] - q[1]) > r for q in pts):
            pts.append(p)
    # order roughly from the centre outward so early tokens sit in the heartland
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    pts.sort(key=lambda p: math.hypot(p[0] - cx, p[1] - cy))
    return [[round(p[0]), round(p[1])] for p in pts]


d["spaces"] = {k: [list(p) for p in v] for k, v in SPACES.items()}
d["slots"] = {"DEU": slots("DEU", 14, 51, 22, 7), "FRA": slots("FRA", 14, 62, 26, 11)}
json.dump(d, open("data/europe.json", "w"))
print({k: len(v) for k, v in d["slots"].items()})
