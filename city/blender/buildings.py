"""
Modular San Francisco building kit (metres, Z up, facade faces −Y).
Hero-grade types carry real detail (trims, bays, cornices, brackets, stoops);
filler() is deliberately low-poly for the blocks that only fill the skyline.
"""
import math
from kit import Part

def _window(parts, x, z, w, h, y, lit=False, pediment=True):
    """A sash window on a facade plane at depth y: frame, sill, header, glass."""
    trim, glass = parts["trim"], (parts["lit"] if lit else parts["glass"])
    glass.box((x, y - 0.04, z), (w, 0.03, h))            # glass sits just proud of the wall
    t = 0.09
    trim.box((x, y - 0.06, z + h / 2 + t / 2), (w + 2 * t, 0.14, t))       # head
    trim.box((x, y - 0.06, z - h / 2 - t / 2), (w + 2 * t, 0.14, t))       # bottom
    for sx in (-1, 1):
        trim.box((x + sx * (w / 2 + t / 2), y - 0.06, z), (t, 0.14, h))
    trim.box((x, y - 0.07, z), (0.05, 0.06, h))                           # mullion
    trim.box((x, y - 0.07, z + h * 0.08), (w, 0.06, 0.05))                # meeting rail
    trim.box((x, y - 0.12, z - h / 2 - 0.12), (w + 0.4, 0.26, 0.08))      # sill
    if pediment:
        trim.box((x, y - 0.1, z + h / 2 + 0.22), (w + 0.5, 0.22, 0.14))   # hood
        trim.box((x, y - 0.06, z + h / 2 + 0.34), (w + 0.2, 0.14, 0.1))

def _parts(tag, facade, coll, lit):
    return {
        "body": Part(f"{tag}_body", facade, bevel=0.03, coll=coll),
        "trim": Part(f"{tag}_trim", "trim_white", bevel=0.01, coll=coll),
        "glass": Part(f"{tag}_glass", "glass", bevel=0, coll=coll),
        "lit": Part(f"{tag}_lit", "window", bevel=0, coll=coll),
        "roof": Part(f"{tag}_roof", "roof", bevel=0.02, coll=coll),
        "dark": Part(f"{tag}_dark", "ink", bevel=0.01, coll=coll),
        "wood": Part(f"{tag}_wood", "wood", bevel=0.01, coll=coll),
        "stone": Part(f"{tag}_stone", "concrete", bevel=0.02, coll=coll),
    }

def _finish(parts):
    out = []
    for p in parts.values():
        if p.bm.verts:
            out.append(p.finish())
        else:
            p.bm.free()
    return out

def victorian(tag, x0, y0, facade="facade_rose", lit_pattern=(0, 1, 1, 0, 1), coll=None):
    """Italianate 'painted lady': garage, stoop, two-storey canted bay, bracketed cornice, false front."""
    P = _parts(tag, facade, coll, True)
    W, D = 7.6, 11.0
    G, F1, F2 = 2.8, 3.4, 3.4
    top = G + F1 + F2
    P["body"].box((x0, y0 + D / 2, top / 2), (W, D, top))
    P["stone"].box((x0, y0 - 0.05, G / 2), (W + 0.1, 0.3, G))               # rusticated base
    for k in range(4):
        P["stone"].box((x0, y0 - 0.21, 0.35 + k * 0.62), (W + 0.12, 0.04, 0.05))
    # garage (left) and stoop + door (right)
    P["dark"].box((x0 - 1.6, y0 - 0.2, 1.15), (2.8, 0.06, 2.3))
    for k in range(6):
        P["trim"].box((x0 - 1.6, y0 - 0.24, 0.3 + k * 0.36), (2.7, 0.03, 0.03))
    for k in range(8):                                                       # stoop steps
        P["stone"].box((x0 + 2.3, y0 - 2.4 + k * 0.3, 0.17 + k * 0.33), (1.7, 0.36, 0.34))
    P["stone"].box((x0 + 2.3, y0 - 0.25, G + 0.05), (2.0, 0.6, 0.1))        # landing
    P["wood"].box((x0 + 2.3, y0 + 0.02, G + 1.25), (1.1, 0.1, 2.3))         # door
    P["lit"].box((x0 + 2.3, y0 - 0.02, G + 2.6), (1.0, 0.04, 0.3))          # transom
    for sx in (-1, 1):                                                       # porch columns
        P["trim"].tube([(x0 + 2.3 + sx * 0.85, y0 - 0.45, G), (x0 + 2.3 + sx * 0.85, y0 - 0.45, G + 2.9)], 0.11, 12)
    P["trim"].box((x0 + 2.3, y0 - 0.45, G + 3.0), (2.2, 0.8, 0.22))         # porch hood
    # canted bay on floors 1–2 (left)
    bx, bd, bw = x0 - 1.4, 0.95, 3.4
    for fl, (z0, h) in enumerate(((G, F1), (G + F1, F2))):
        zc = z0 + h / 2
        P["body"].box((bx, y0 - bd / 2, zc), (bw * 0.6, bd, h))              # bay front block
        for sx in (-1, 1):                                                   # canted sides
            P["body"].box((bx + sx * bw * 0.38, y0 - bd / 2 + 0.05, zc), (0.95, 0.18, h), rot=(0, 0, sx * 0.785))
        lit = lit_pattern[(fl * 2) % len(lit_pattern)]
        _window(P, bx, zc + 0.1, 1.1, h * 0.62, y0 - bd, lit=lit)
        for sx in (-1, 1):
            P["lit" if lit else "glass"].box((bx + sx * 1.33, y0 - bd / 2 - 0.12, zc + 0.1), (0.5, 0.04, h * 0.6), rot=(0, 0, sx * 0.785))
        P["trim"].box((bx, y0 - bd / 2, z0 + 0.06), (bw + 0.2, bd + 0.2, 0.12))   # bay string course
    # right-hand windows above the door
    for fl, z0 in enumerate((G + F1,)):
        _window(P, x0 + 2.2, z0 + F2 / 2 + 0.1, 1.0, F2 * 0.6, y0, lit=lit_pattern[3 % len(lit_pattern)])
    # bracketed cornice + false front with a pediment
    P["trim"].box((x0, y0 - 0.45, top + 0.25), (W + 0.6, 1.0, 0.5))
    for k in range(13):
        P["trim"].box((x0 - W / 2 + 0.3 + k * 0.58, y0 - 0.55, top - 0.05), (0.14, 0.4, 0.34))
    P["body"].box((x0, y0 + 0.1, top + 1.0), (W, 0.4, 1.0))
    P["trim"].box((x0, y0 - 0.08, top + 1.55), (W + 0.3, 0.6, 0.18))
    P["trim"].box((x0, y0 - 0.06, top + 1.85), (2.2, 0.4, 0.45))           # pediment
    P["roof"].box((x0, y0 + D / 2 + 0.3, top + 0.15), (W - 0.2, D - 1, 0.3))
    return _finish(P)

def edwardian(tag, x0, y0, facade="facade_sage", floors=3, lit_pattern=(1, 0, 1, 1, 0, 1), coll=None):
    """Edwardian flats: twin flat bays, simpler trim, flat cornice."""
    P = _parts(tag, facade, coll, True)
    W, D, F = 8.6, 12.0, 3.2
    top = 1.2 + floors * F
    P["body"].box((x0, y0 + D / 2, top / 2), (W, D, top))
    P["stone"].box((x0, y0 - 0.05, 0.6), (W + 0.1, 0.3, 1.2))
    k = 0
    for fl in range(floors):
        zc = 1.2 + fl * F + F / 2
        for bx in (x0 - 2.2, x0 + 2.2):
            P["body"].box((bx, y0 - 0.4, zc), (3.2, 0.8, F))
            for wx in (-0.9, 0.0, 0.9):
                _window(P, bx + wx, zc + 0.15, 0.62, F * 0.58, y0 - 0.8, lit=lit_pattern[k % len(lit_pattern)], pediment=False); k += 1
        P["trim"].box((x0, y0 - 0.86, 1.2 + fl * F + 0.05), (W + 0.2, 0.12, 0.1))
    P["wood"].box((x0, y0 - 0.02, 1.2 + 1.1), (1.2, 0.1, 2.2))
    P["trim"].box((x0, y0 - 0.6, top + 0.3), (W + 0.5, 1.4, 0.6))
    for k in range(14):
        P["trim"].box((x0 - W / 2 + 0.3 + k * 0.62, y0 - 0.9, top - 0.1), (0.14, 0.4, 0.3))
    P["roof"].box((x0, y0 + D / 2, top + 0.1), (W - 0.2, D - 0.6, 0.2))
    return _finish(P)

def warehouse(tag, x0, y0, coll=None):
    """Brick warehouse with arched windows, pilasters, parapet and a rooftop water tower."""
    P = _parts(tag, "facade_terra", coll, True)
    W, D, H = 22.0, 18.0, 13.0
    P["body"].box((x0, y0 + D / 2, H / 2), (W, D, H))
    for k in range(7):                                                       # pilasters
        P["body"].box((x0 - W / 2 + 0.5 + k * (W - 1) / 6, y0 - 0.25, H / 2), (0.7, 0.5, H))
    for row, zc in enumerate((3.2, 8.4)):
        for k in range(6):
            wx = x0 - W / 2 + 0.5 + (k + 0.5) * (W - 1) / 6
            lit = (k + row) % 3 == 0
            g = P["lit" if lit else "glass"]
            g.box((wx, y0 + 0.02, zc), (2.0, 0.04, 2.8))
            g.tube([(wx, y0 + 0.0, zc + 1.4), (wx, y0 + 0.04, zc + 1.4)], 1.0, 18)   # arch head
            P["trim"].box((wx, y0 - 0.1, zc - 1.5), (2.4, 0.3, 0.14))
            for j in range(-2, 3):
                P["dark"].box((wx + j * 0.4, y0 - 0.03, zc), (0.04, 0.04, 2.8))
    P["trim"].box((x0, y0 - 0.3, H + 0.4), (W + 0.4, 0.8, 0.8))             # parapet
    P["roof"].box((x0, y0 + D / 2, H + 0.1), (W - 0.4, D - 0.4, 0.2))
    # water tower
    wt = (x0 + 5, y0 + 10, H)
    for a in range(4):
        ang = a * math.pi / 2 + 0.785
        P["dark"].beam((wt[0] + 1.6 * math.cos(ang), wt[1] + 1.6 * math.sin(ang), wt[2]), (wt[0] + 1.3 * math.cos(ang), wt[1] + 1.3 * math.sin(ang), wt[2] + 3.2), 0.18)
    P["wood"].cylinder((wt[0], wt[1], wt[2] + 4.6), 1.7, 2.8, 20)
    P["roof"].tube([(wt[0], wt[1], wt[2] + 6.0), (wt[0], wt[1], wt[2] + 6.01)], 1.8, 20)
    P["roof"].ico((wt[0], wt[1], wt[2] + 6.2), 1.75, 2, squash=0.35)
    return _finish(P)

def office(tag, x0, y0, floors=14, coll=None, lit_seed=3):
    """Financial District mid-rise: slab bands, mullion grid, setback crown."""
    P = _parts(tag, "concrete", coll, True)
    W, D, F = 24.0, 20.0, 3.6
    H = 1.0 + floors * F
    P["stone"].box((x0, y0 + D / 2, 2.5), (W, D, 5.0))                     # podium
    s = lit_seed
    for fl in range(floors):
        z = 5.0 + fl * F
        P["body"].box((x0, y0 + D / 2, z + 0.25), (W - 0.6, D - 0.6, 0.5))  # slab band
        for k in range(10):
            s = (s * 9301 + 49297) % 233280
            lit = s / 233280 < 0.45
            wx = x0 - W / 2 + 1.2 + k * (W - 2.4) / 9
            P["lit" if lit else "glass"].box((wx, y0 + 0.35, z + F / 2 + 0.2), (2.2, 0.04, F - 0.8))
            P["dark"].box((wx - 1.2, y0 + 0.28, z + F / 2 + 0.2), (0.14, 0.14, F - 0.6))
    P["body"].box((x0, y0 + D / 2 + 0.3, 5.0 + floors * F / 2), (W - 1.0, D - 1.0, floors * F))
    P["body"].box((x0, y0 + D / 2, H + 4.0), (W - 6, D - 6, 6.0))           # crown setback
    P["trim"].box((x0, y0 + 2.8, H + 7.2), (W - 5, 0.6, 0.6))
    P["roof"].box((x0, y0 + D / 2, H + 7.2), (W - 7, D - 7, 0.4))
    return _finish(P)

def filler(tag, x0, y0, w, d, h, facade="facade_blue", coll=None, lit=0.4, seed=1):
    """LOW-POLY skyline filler: one box, a cornice, a few emissive window strips."""
    body = Part(f"{tag}_f", facade, bevel=0.0, coll=coll)
    win = Part(f"{tag}_w", "window", bevel=0, coll=coll)
    body.box((x0, y0 + d / 2, h / 2), (w, d, h))
    body.box((x0, y0 + d / 2, h + 0.2), (w + 0.4, d + 0.4, 0.4))
    s = seed
    for fl in range(int(h / 3.2) - 1):
        s = (s * 9301 + 49297) % 233280
        if s / 233280 < lit:
            win.box((x0, y0 - 0.02, 2.4 + fl * 3.2), (w * 0.7, 0.04, 1.1))
    out = [body.finish()]
    out += [win.finish()] if win.bm.verts else []
    return out
