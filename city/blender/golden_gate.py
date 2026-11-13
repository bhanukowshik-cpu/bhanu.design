"""
Hero asset: the Golden Gate (stylised original rendering — no District marks used).
Run:  Blender -b --factory-startup -P city/blender/golden_gate.py -- <out_dir> [--glb]

Layout (Blender units, Z up): bridge runs along X, towers at x = ±TX, deck top at DECK.
Proportions follow the real bridge (span : tower height : clearance), compressed to
a miniature scale of ~8 m per unit.
"""
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import kit
from kit import Part

TX, AX = 80.0, 123.0          # tower x, anchorage x
DECK = 8.6                    # road surface height
TOP = 28.9                    # cable saddle height
LEG_Y = 1.95                  # cable planes / tower legs
MID = 10.2                    # main cable low point (mid-span)
PANEL = 1.6                   # suspender / truss panel spacing

def cable_z(x):
    a = abs(x)
    if a <= TX:
        return MID + (TOP - MID) * (a / TX) ** 2
    return 9.7 + (TOP - 9.7) * ((AX - a) / (AX - TX)) ** 2

def tower(cx, coll):
    o = Part(f"tower_{cx:+.0f}", "orange", bevel=0.05, coll=coll)
    deco = Part(f"tower_deco_{cx:+.0f}", "orange_d", bevel=0.0, coll=coll)
    tiers = [(0.0, 9.0, 1.55, 1.85), (9.0, 15.0, 1.40, 1.65), (15.0, 20.4, 1.26, 1.48),
             (20.4, 25.0, 1.12, 1.32), (25.0, TOP, 1.00, 1.18)]
    for ly in (-LEG_Y, LEG_Y):
        for z0, z1, wx, wy in tiers:
            o.box((cx, ly, (z0 + z1) / 2), (wx, wy, z1 - z0))
            # stepped setback collar at the top of each tier
            o.box((cx, ly, z1 - 0.12), (wx + 0.12, wy + 0.12, 0.24))
            # art-deco fluting: vertical ribs on the span-facing faces
            for sx in (-1, 1):
                for k in (-1, 0, 1):
                    deco.box((cx + sx * (wx / 2 + 0.02), ly + k * wy * 0.28, (z0 + z1) / 2 + 0.1),
                             (0.05, 0.10, (z1 - z0) - 0.6))
        # saddle housing on top
        o.box((cx, ly, TOP + 0.35), (1.15, 1.35, 0.7))
        o.box((cx, ly, TOP + 0.8), (0.8, 1.0, 0.3))
    # portal struts above the deck — each a deco panel with vertical lines
    for zc, h in ((13.4, 1.7), (18.7, 1.5), (23.6, 1.35), (27.6, 1.6)):
        inner = LEG_Y * 2 - 1.2
        o.box((cx, 0, zc), (1.0, inner, h))
        for sx in (-1, 1):
            o.box((cx + sx * 0.52, 0, zc), (0.06, inner - 0.3, h - 0.35))           # recessed face frame
            for k in range(-4, 5):
                deco.box((cx + sx * 0.56, k * inner / 10, zc), (0.04, 0.07, h - 0.6))
    # below-deck X bracing between the legs
    for sx in (-1, 1):
        x = cx + sx * 0.55
        o.beam((x, -LEG_Y + 0.7, 1.8), (x, LEG_Y - 0.7, DECK - 1.6), 0.28, 0.32)
        o.beam((x, LEG_Y - 0.7, 1.8), (x, -LEG_Y + 0.7, DECK - 1.6), 0.28, 0.32)
    o.box((cx, 0, DECK - 1.5), (1.1, LEG_Y * 2 - 1.0, 0.6))
    o.box((cx, 0, 1.6), (1.1, LEG_Y * 2 - 1.0, 0.5))
    # beacon on each leg top
    b = Part(f"beacon_{cx:+.0f}", "beacon", bevel=0, coll=coll)
    for ly in (-LEG_Y, LEG_Y):
        b.cylinder((cx, ly, TOP + 1.12), 0.12, 0.2, 10)
    # concrete pier + fender
    p = Part(f"pier_{cx:+.0f}", "concrete", bevel=0.08, coll=coll)
    p.box((cx, 0, 0.3), (3.4, LEG_Y * 2 + 2.6, 1.6))
    p.box((cx, 0, 1.15), (2.9, LEG_Y * 2 + 2.1, 0.2))
    if cx > 0:   # the San Francisco tower stands in an elliptical fender
        ring = [(cx + 4.6 * math.cos(t), 4.2 * math.sin(t), 0.6) for t in [i * 2 * math.pi / 48 for i in range(49)]]
        p.tube(ring, 0.32, 8, cap=False)
    return [o.finish(), deco.finish(), b.finish(), p.finish()]

def deck(coll):
    road = Part("deck_road", "asphalt", bevel=0.03, coll=coll)
    walk = Part("deck_walk", "concrete", bevel=0.02, coll=coll)
    steel = Part("deck_steel", "orange", bevel=0.03, coll=coll)
    truss = Part("deck_truss", "orange_d", bevel=0.0, coll=coll)
    rail = Part("deck_rail", "orange", bevel=0.0, coll=coll)
    lamps = Part("deck_lamps", "lamp", bevel=0.0, coll=coll)
    posts = Part("deck_posts", "ink", bevel=0.0, coll=coll)
    X0, X1 = -AX - 6, AX + 6
    L = X1 - X0
    road.box(((X0 + X1) / 2, 0, DECK - 0.12), (L, 2.9, 0.24))
    for sy in (-1, 1):
        walk.box(((X0 + X1) / 2, sy * 1.68, DECK - 0.04), (L, 0.5, 0.18))
        steel.box(((X0 + X1) / 2, sy * 1.98, DECK - 0.25), (L, 0.14, 0.5))           # fascia girder
    # stiffening truss: two Warren trusses + floor beams + bottom lateral bracing
    TT, TB = DECK - 0.35, DECK - 1.55
    n = int(L / PANEL)
    for sy in (-1.45, 1.45):
        truss.beam((X0, sy, TT), (X1, sy, TT), 0.12, 0.16)
        truss.beam((X0, sy, TB), (X1, sy, TB), 0.12, 0.16)
        for i in range(n + 1):
            x = X0 + i * PANEL
            truss.beam((x, sy, TB), (x, sy, TT), 0.08)
            if i < n:
                a, b = ((x, sy, TB), (x + PANEL, sy, TT)) if i % 2 == 0 else ((x, sy, TT), (x + PANEL, sy, TB))
                truss.beam(a, b, 0.07)
    for i in range(n + 1):
        x = X0 + i * PANEL
        truss.beam((x, -1.45, TB), (x, 1.45, TB), 0.07)
        if i < n and i % 2 == 0:
            truss.beam((x, -1.45, TB), (x + PANEL * 2, 1.45, TB), 0.05)
    # railings: posts + two rails; lamp posts every third panel
    for sy in (-1, 1):
        y = sy * 1.92
        for k, z in ((0, DECK + 0.45), (1, DECK + 0.22)):
            rail.tube([(X0, y, z), (X1, y, z)], 0.025, 6)
        for i in range(int(L / 0.8) + 1):
            rail.box((X0 + i * 0.8, y, DECK + 0.22), (0.04, 0.04, 0.46))
        for i in range(0, n, 3):
            x = X0 + i * PANEL + PANEL / 2
            if abs(abs(x) - TX) < 1.2:
                continue
            posts.box((x, y, DECK + 0.75), (0.07, 0.07, 1.5))
            posts.box((x, y - sy * 0.14, DECK + 1.5), (0.06, 0.32, 0.06))
            lamps.box((x, y - sy * 0.28, DECK + 1.44), (0.14, 0.14, 0.08))
    return [p.finish() for p in (road, walk, steel, truss, rail, lamps, posts)]

def cables(coll):
    main = Part("cable_main", "orange", bevel=0.0, coll=coll)
    bands = Part("cable_bands", "orange_d", bevel=0.0, coll=coll)
    hang = Part("cable_suspenders", "orange", bevel=0.0, coll=coll)
    for ly in (-LEG_Y, LEG_Y):
        pts = [(x, ly, cable_z(x)) for x in [-AX + i * 0.8 for i in range(int(2 * AX / 0.8) + 1)]]
        main.tube(pts, 0.22, 14, cap=False)
        x = -AX + PANEL
        while x < AX - 0.5:
            if abs(abs(x) - TX) > 1.0:
                z = cable_z(x)
                dz = (cable_z(x + 0.05) - cable_z(x - 0.05)) / 0.1
                t = (1, 0, dz)
                tl = math.sqrt(1 + dz * dz)
                bands.tube([(x - 0.06 / tl, ly, z - 0.06 * dz / tl), (x + 0.06 / tl, ly, z + 0.06 * dz / tl)], 0.27, 12)
                for off in (-0.06, 0.06):
                    hang.tube([(x + off, ly, DECK + 0.05), (x + off, ly, z - 0.2)], 0.028, 6, cap=False)
            x += PANEL
    return [p.finish() for p in (main, bands, hang)]

def anchorages(coll):
    a = Part("anchorages", "concrete", bevel=0.1, coll=coll)
    for sx in (-1, 1):
        x = sx * AX
        a.box((x, 0, 4.2), (6.0, 7.0, 8.4))
        a.box((x, 0, 8.9), (5.0, 6.2, 1.0))           # deco setback
        a.box((x - sx * 2.2, 0, 9.6), (1.4, 5.0, 0.6))
        for k in (-1, 0, 1):                            # vertical pilasters
            a.box((x - sx * 3.05, k * 2.2, 4.4), (0.18, 0.5, 7.6))
    for x in (-AX - 6, AX + 6):                        # approach piers
        a.box((x, 0, 3.6), (1.4, 3.2, 7.2))
    return [a.finish()]

def build(coll=None):
    coll = coll or kit.collection("golden_gate")
    objs = []
    for cx in (-TX, TX):
        objs += tower(cx, coll)
    objs += deck(coll) + cables(coll) + anchorages(coll)
    return objs

def preview_context():
    """Water + simple headlands so the preview reads; the real terrain is its own asset."""
    env = kit.collection("preview_env")
    w = Part("water", "water", bevel=0, coll=env)
    w.box((0, 0, -0.5), (1200, 1200, 1.0))
    h = Part("headlands", "grass", bevel=0, coll=env)
    import random; random.seed(4)
    for i in range(26):   # Marin (left, behind) — lumpy hills
        x = -150 - random.random() * 140; y = 20 + random.random() * 160
        r = 18 + random.random() * 26
        h.box((x, y, r * 0.25), (r * 2, r * 1.6, r * 0.9), rot=(0, 0, random.random()))
    w.finish(); h.finish()

if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = argv[0] if argv else "/tmp"
    kit.reset()
    objs = build()
    preview_context()
    kit.light_rig(sun_elev=5, sun_az=-140)
    tris = 0
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        me = o.evaluated_get(dg).to_mesh(); tris += sum(len(p.vertices) - 2 for p in me.polygons); o.evaluated_get(dg).to_mesh_clear()
    print(f"BRIDGE_TRIS {tris}")
    kit.camera((52, -118, 19), (-8, 0, 15), lens=38)
    kit.render(os.path.join(out, "gg_wide.png"))
    kit.camera((96, -15, 12), (80, 0, 17), lens=35)
    kit.render(os.path.join(out, "gg_tower.png"))
    if "--glb" in argv:
        kit.export_glb(os.path.join(out, "golden_gate.glb"), objs)
