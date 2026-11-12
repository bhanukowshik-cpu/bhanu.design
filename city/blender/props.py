"""Street props (metres, Z up)."""
import math
from kit import Part

def streetlamp(tag, x, y, coll=None):
    d = Part(f"{tag}_post", "ink", bevel=0.01, coll=coll)
    l = Part(f"{tag}_lamp", "lamp", bevel=0, coll=coll)
    d.cylinder((x, y, 0.25), 0.22, 0.5, 14)                       # plinth
    d.cylinder((x, y, 0.6), 0.16, 0.2, 14)
    for k in range(8):                                             # fluted shaft
        a = k * math.pi / 4
        d.tube([(x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), 0.7), (x + 0.05 * math.cos(a), y + 0.05 * math.sin(a), 3.6)], 0.03, 6)
    d.tube([(x, y, 0.7), (x, y, 3.7)], 0.06, 10)
    d.cylinder((x, y, 3.75), 0.12, 0.12, 12)
    l.ellipsoid((x, y, 4.05), (0.2, 0.2, 0.3), 14, 10)              # globe
    d.cylinder((x, y, 4.38), 0.14, 0.06, 12)
    d.tube([(x, y, 4.4), (x, y, 4.55)], 0.03, 6)
    return [d.finish(), l.finish()]

def bench(tag, x, y, rot=0.0, coll=None):
    w = Part(f"{tag}_wood", "wood", bevel=0.01, coll=coll)
    k = Part(f"{tag}_iron", "ink", bevel=0.005, coll=coll)
    c, s = math.cos(rot), math.sin(rot)
    def R(px, py, pz): return (x + px * c - py * s, y + px * s + py * c, pz)
    for i in range(4):                                              # seat slats
        w.box(R(0, -0.18 + i * 0.12, 0.45), (1.8, 0.09, 0.04), rot=(0, 0, rot))
    for i in range(3):                                              # back slats
        w.box(R(0, 0.26, 0.62 + i * 0.13), (1.8, 0.04, 0.09), rot=(0, 0, rot))
    for sx in (-0.78, 0.78):
        k.box(R(sx, 0.0, 0.22), (0.06, 0.5, 0.44), rot=(0, 0, rot))
        k.box(R(sx, 0.27, 0.65), (0.06, 0.05, 0.45), rot=(0, 0, rot))
        k.box(R(sx, 0.02, 0.68), (0.06, 0.48, 0.05), rot=(0, 0, rot))   # armrest
    return [w.finish(), k.finish()]

def tree(tag, x, y, h=4.5, coll=None, light=False):
    t = Part(f"{tag}_trunk", "wood", bevel=0, coll=coll)
    f = Part(f"{tag}_leaf", "foliage_l" if light else "foliage", bevel=0, coll=coll)
    t.tube([(x, y, 0), (x + 0.1, y, h * 0.45), (x + 0.05, y + 0.1, h * 0.62)], 0.13, 10)
    t.tube([(x + 0.08, y, h * 0.42), (x + 0.6, y - 0.2, h * 0.62)], 0.06, 6)
    for (dx, dy, dz, r) in ((0, 0, 0.72, 0.36), (0.45, -0.2, 0.62, 0.27), (-0.35, 0.25, 0.64, 0.28), (0.1, 0.3, 0.86, 0.24), (-0.2, -0.3, 0.8, 0.22)):
        f.ico((x + dx * h * 0.3, y + dy * h * 0.3, h * dz), h * r * 0.6, 2, squash=0.85)
    return [t.finish(), f.finish()]

def car(tag, x, y, body="cloth_navy", rot=0.0, coll=None):
    b = Part(f"{tag}_body", body, bevel=0.12, segments=3, coll=coll)
    g = Part(f"{tag}_glass", "glass", bevel=0.04, coll=coll)
    k = Part(f"{tag}_tyre", "ink", bevel=0, coll=coll)
    h = Part(f"{tag}_lights", "lamp", bevel=0, coll=coll)
    b.box((x, y, 0.62), (4.2, 1.8, 0.75), rot=(0, 0, rot))
    b.box((x - 0.2, y, 1.18), (2.3, 1.62, 0.6), rot=(0, 0, rot))
    g.box((x - 0.2, y, 1.2), (2.2, 1.66, 0.46), rot=(0, 0, rot))
    for sx in (-1.35, 1.35):
        for sy in (-0.86, 0.86):
            k.tube([(x + sx, y + sy - 0.12, 0.36), (x + sx, y + sy + 0.12, 0.36)], 0.36, 16)
    for sy in (-0.6, 0.6):
        h.box((x + 2.1, y + sy, 0.72), (0.04, 0.32, 0.14), rot=(0, 0, rot))
    return [p.finish() for p in (b, g, k, h)]

def cable_car(tag, x, y, coll=None):
    """SF cable car: cream body, rust panels, open-bench ends, clerestory roof."""
    b = Part(f"{tag}_body", "facade_cream", bevel=0.04, coll=coll)
    r = Part(f"{tag}_panel", "cloth_rust", bevel=0.02, coll=coll)
    w = Part(f"{tag}_glass", "window", bevel=0, coll=coll)
    d = Part(f"{tag}_dark", "ink", bevel=0.01, coll=coll)
    L = 8.4
    b.box((x, y, 1.0), (L, 2.4, 0.6))                                  # floor/skirt
    r.box((x, y, 0.85), (L + 0.05, 2.45, 0.32))
    b.box((x, y, 2.0), (L * 0.5, 2.3, 1.5))                            # closed saloon
    for k in range(5):
        w.box((x - L * 0.2 + k * L * 0.1, y - 1.16, 2.15), (0.6, 0.04, 0.8))
    for sx in (-1, 1):                                                 # open ends: poles + benches
        for k in range(4):
            d.tube([(x + sx * (L * 0.28 + k * 0.38), y - 1.1, 1.3), (x + sx * (L * 0.28 + k * 0.38), y - 1.1, 2.9)], 0.035, 6)
            d.tube([(x + sx * (L * 0.28 + k * 0.38), y + 1.1, 1.3), (x + sx * (L * 0.28 + k * 0.38), y + 1.1, 2.9)], 0.035, 6)
        b.box((x + sx * L * 0.36, y, 1.55), (L * 0.22, 1.6, 0.2))
    r.box((x, y, 3.0), (L + 0.3, 2.6, 0.18))                           # roof
    b.box((x, y, 3.2), (L * 0.6, 1.4, 0.3))                            # clerestory
    for sx in (-1, 1):
        d.tube([(x + sx * 2.8, y - 0.7, 0.35), (x + sx * 2.8, y + 0.7, 0.35)], 0.32, 14)
    return [p.finish() for p in (b, r, w, d)]

def ferry(tag, x, y, coll=None):
    h = Part(f"{tag}_hull", "trim_white", bevel=0.15, coll=coll)
    k = Part(f"{tag}_keel", "cloth_navy", bevel=0.1, coll=coll)
    w = Part(f"{tag}_win", "window", bevel=0, coll=coll)
    d = Part(f"{tag}_dark", "ink", bevel=0.02, coll=coll)
    k.box((x, y, 0.5), (20, 6, 1.0))
    h.box((x, y, 1.6), (19, 5.8, 1.2))
    h.box((x - 1, y, 3.0), (13, 5.0, 1.6))
    h.box((x - 2, y, 4.4), (7, 4.0, 1.2))
    for row, (z, n, L) in enumerate(((3.0, 10, 12), (4.4, 5, 6))):
        for i in range(n):
            w.box((x - 1 - row - L / 2 + 0.6 + i * L / n, y - (2.52 - row * 0.5), z + 0.1), (0.8, 0.04, 0.6))
    d.cylinder((x - 4.2, y, 5.6), 0.5, 1.6, 16)
    return [p.finish() for p in (h, k, w, d)]
