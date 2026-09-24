"""Build data/europe.json from Natural Earth 1:50m country borders.

Projects lon/lat with a Lambert azimuthal equal-area projection centred on
Europe (like ETRS89-LAEA), crops to the area shown on the game board,
simplifies outlines, and writes coordinates normalised to an 1800 x 1200 map.

Usage: python3 tools/build_map.py path/to/ne_50m_admin_0_countries.geojson
"""
import json
import math
import sys

LON0, LAT0 = math.radians(10.0), math.radians(52.0)
MAP_W, MAP_H = 1800, 1200


def laea(lon, lat):
    lon, lat = math.radians(lon), math.radians(lat)
    k = math.sqrt(2 / (1 + math.sin(LAT0) * math.sin(lat)
                       + math.cos(LAT0) * math.cos(lat) * math.cos(lon - LON0)))
    x = k * math.cos(lat) * math.sin(lon - LON0)
    y = k * (math.cos(LAT0) * math.sin(lat)
             - math.sin(LAT0) * math.cos(lat) * math.cos(lon - LON0))
    return x, y


# Crop window chosen by eye: Portugal to Belarus, Scotland to Sicily.
X0, Y0 = laea(-10.8, 40.0)[0], laea(10, 60.8)[1]
X1, Y1 = laea(29.0, 44.0)[0], laea(10, 35.8)[1]
SX = MAP_W / (X1 - X0)
SY = MAP_H / (Y0 - Y1)
S = min(SX, SY)


def to_map(lon, lat):
    x, y = laea(lon, lat)
    return ((x - X0) * S, (Y0 - y) * S)


def perp_dist(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))


def simplify(pts, eps):
    if len(pts) < 3:
        return pts
    stack, keep = [(0, len(pts) - 1)], {0, len(pts) - 1}
    while stack:
        i, j = stack.pop()
        best, idx = 0, None
        for k in range(i + 1, j):
            d = perp_dist(pts[k], pts[i], pts[j])
            if d > best:
                best, idx = d, k
        if idx is not None and best > eps:
            keep.add(idx)
            stack += [(i, idx), (idx, j)]
    return [pts[k] for k in sorted(keep)]


def area(pts):
    return 0.5 * abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1]
                         for i in range(len(pts))))


def main(path):
    gj = json.load(open(path))
    out = []
    margin = 250
    for f in gj["features"]:
        p = f["properties"]
        iso = p.get("ADM0_A3") or p.get("ISO_A3")
        geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        rings = []
        for poly in polys:
            ring = [to_map(lon, lat) for lon, lat in poly[0]]
            xs = [q[0] for q in ring]
            ys = [q[1] for q in ring]
            if max(xs) < -margin or min(xs) > MAP_W + margin or max(ys) < -margin or min(ys) > MAP_H + margin:
                continue
            ring = simplify(ring, 1.6)
            if len(ring) < 4 or area(ring) < 60:
                continue
            rings.append([[round(x, 1), round(y, 1)] for x, y in ring])
        if rings:
            out.append({"iso": iso, "name": p.get("NAME"), "rings": rings})
    json.dump({"w": MAP_W, "h": MAP_H, "countries": out}, open("data/europe.json", "w"))
    total = sum(len(r) for c in out for r in c["rings"])
    print(len(out), "countries,", total, "points")


if __name__ == "__main__":
    main(sys.argv[1])
