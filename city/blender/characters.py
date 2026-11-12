"""
Character system — every person in the city comes from person().
Toy proportions (~3.6 heads tall), rounded forms, palette clothes, readable at a
distance. Authored ~1.75 units tall; scenes scale them to their world.

Pose = a dict of joint points (shoulders, elbows, hands, hips, knees, feet), so a new
pose is just new points, not new modelling.
"""
import math
from mathutils import Vector
from kit import Part

def _pose(kind):
    # x = forward, y = side, z = up  (character faces +x)
    P = {"hip_y": 0.11, "sh_y": 0.21}
    if kind == "stand":
        P.update(knee=(0.0, 0.48), foot=(0.0, 0.06), elbow=(0.0, 1.08), hand=(0.02, 0.84), hip_z=0.86, sh_z=1.30, lean=0)
    elif kind == "walk":
        P.update(knee=(0.10, 0.48), foot=(0.20, 0.06), knee_b=(-0.06, 0.46), foot_b=(-0.22, 0.10),
                 elbow=(-0.10, 1.07), hand=(-0.16, 0.86), elbow_b=(0.10, 1.07), hand_b=(0.18, 0.88), hip_z=0.86, sh_z=1.30, lean=0.04)
    elif kind == "sit":
        P.update(knee=(0.42, 0.50), foot=(0.44, 0.06), elbow=(0.16, 0.86), hand=(0.36, 0.66), hip_z=0.50, sh_z=0.96, lean=-0.02)
    elif kind == "type":   # seated, hands forward on a desk / laptop
        P.update(knee=(0.42, 0.50), foot=(0.44, 0.06), elbow=(0.18, 0.80), hand=(0.42, 0.74), hip_z=0.50, sh_z=0.96, lean=0.06)
    return P

def person(tag, x, y, kind="stand", skin="skin_2", hair="hair_dark", top="cloth_navy", bottom="cloth_ink",
           shoes="ink", hair_style="short", beard=False, glasses=False, prop=None, coll=None, facing=0.0):
    """Returns the list of finished objects for one character at (x, y)."""
    P = _pose(kind)
    ca, sa = math.cos(facing), math.sin(facing)
    def W(px, py, pz):   # local → world (rotate about z by `facing`)
        return (x + px * ca - py * sa, y + px * sa + py * ca, pz)

    s = Part(f"{tag}_skin", skin, bevel=0, coll=coll)
    h = Part(f"{tag}_hair", hair, bevel=0, coll=coll)
    t = Part(f"{tag}_top", top, bevel=0, coll=coll)
    b = Part(f"{tag}_bottom", bottom, bevel=0, coll=coll)
    f = Part(f"{tag}_shoes", shoes, bevel=0, coll=coll)
    extra = []

    hz, sz, lean = P["hip_z"], P["sh_z"], P["lean"]
    # torso (top) — a soft, slightly tapered ellipsoid pair
    t.ellipsoid(W(lean * 0.5, 0, (hz + sz) / 2 + 0.02), (0.15, 0.22, 0.28), 18, 12)
    t.ellipsoid(W(lean, 0, sz - 0.04), (0.14, 0.25, 0.10), 18, 8)          # shoulders
    # hips / seat (bottom)
    b.ellipsoid(W(0.02 if kind in ("sit", "type") else 0, 0, hz + 0.02), (0.15, 0.19, 0.12), 16, 10)
    # neck + head
    s.tube([W(lean, 0, sz + 0.02), W(lean, 0, sz + 0.10)], 0.06, 10)
    head_c = W(lean + 0.01, 0, sz + 0.27)
    s.ellipsoid(head_c, (0.165, 0.155, 0.185), 20, 14)
    s.ellipsoid(W(lean + 0.165, 0, sz + 0.25), (0.03, 0.03, 0.035), 8, 6)  # nose
    for side in (-1, 1):                                                    # ears
        s.ellipsoid(W(lean + 0.0, side * 0.155, sz + 0.26), (0.03, 0.02, 0.045), 8, 6)
    # hair
    if hair_style == "short":
        h.ellipsoid(W(lean - 0.03, 0, sz + 0.335), (0.178, 0.17, 0.155), 32, 16)
    elif hair_style == "bun":
        h.ellipsoid(W(lean - 0.03, 0, sz + 0.335), (0.178, 0.17, 0.155), 32, 16)
        h.ellipsoid(W(lean - 0.12, 0, sz + 0.44), (0.07, 0.07, 0.07), 12, 8)
    elif hair_style == "long":
        h.ellipsoid(W(lean - 0.03, 0, sz + 0.33), (0.18, 0.172, 0.16), 32, 16)
        h.ellipsoid(W(lean - 0.11, 0, sz + 0.17), (0.08, 0.16, 0.17), 24, 12)    # hair falls behind, not over the face
    elif hair_style == "cap":
        h.ellipsoid(W(lean - 0.02, 0, sz + 0.345), (0.18, 0.172, 0.125), 32, 16)
        h.ellipsoid(W(lean + 0.14, 0, sz + 0.33), (0.10, 0.12, 0.02), 12, 6)
    # eyes — two small ink dots; a face without them reads eerie
    eyes = Part(f"{tag}_eyes", "ink", bevel=0, coll=coll)
    for side in (-1, 1):
        eyes.ellipsoid(W(lean + 0.158, side * 0.062, sz + 0.29), (0.012, 0.022, 0.028), 10, 8)
    extra.append(eyes)
    if beard:
        h.ellipsoid(W(lean + 0.075, 0, sz + 0.16), (0.1, 0.135, 0.085), 28, 14)
    if glasses:
        g = Part(f"{tag}_glasses", "ink", bevel=0, coll=coll)
        for side in (-1, 1):
            g.tube([W(lean + 0.165, side * 0.065 - 0.03, sz + 0.29), W(lean + 0.165, side * 0.065 + 0.03, sz + 0.29)], 0.012, 6)
        extra.append(g)

    # legs + shoes (bottoms over thighs/shins)
    for side in (-1, 1):
        k = "knee" if side == -1 or "knee_b" not in P else "knee_b"
        ft = "foot" if side == -1 or "foot_b" not in P else "foot_b"
        hip = W(0.02 if kind in ("sit", "type") else 0, side * P["hip_y"], hz)
        knee = W(P[k][0], side * P["hip_y"], P[k][1])
        foot = W(P[ft][0], side * P["hip_y"], P[ft][1] + 0.04)
        b.tube([hip, knee, foot], 0.068, 12)
        f.ellipsoid(W(P[ft][0] + 0.06, side * P["hip_y"], P[ft][1] - 0.01), (0.11, 0.055, 0.05), 12, 8)
    # arms (sleeves = top) + hands (skin)
    for side in (-1, 1):
        e = "elbow" if side == -1 or "elbow_b" not in P else "elbow_b"
        hd = "hand" if side == -1 or "hand_b" not in P else "hand_b"
        sh = W(lean, side * P["sh_y"], sz - 0.04)
        el = W(P[e][0], side * (P["sh_y"] + 0.03), P[e][1])
        ha = W(P[hd][0], side * (P["sh_y"] - (0.06 if kind == "type" else 0.0)), P[hd][1])
        t.tube([sh, el, ha], 0.052, 10)
        s.ellipsoid(ha, (0.045, 0.04, 0.05), 10, 8)

    # props
    if prop == "laptop":
        lb = Part(f"{tag}_laptop", "ink", bevel=0.005, coll=coll)
        lb.box(W(0.40, 0, 0.66), (0.24, 0.32, 0.015))
        lb.box(W(0.53, 0, 0.77), (0.015, 0.32, 0.21), rot=(0, -0.25, facing))
        sc = Part(f"{tag}_screen", "screen", bevel=0, coll=coll)
        sc.box(W(0.52, 0, 0.77), (0.006, 0.29, 0.18), rot=(0, -0.25, facing))
        extra += [lb, sc]
    elif prop == "backpack":
        bp = Part(f"{tag}_pack", "cloth_rust", bevel=0.03, coll=coll)
        bp.box(W(-0.19, 0, sz - 0.18), (0.12, 0.30, 0.36))
        extra.append(bp)
    elif prop == "coffee":
        c = Part(f"{tag}_cup", "clay", bevel=0, coll=coll)
        hd = P.get("hand")
        c.cylinder(W(hd[0] + 0.03, -P["sh_y"], hd[1] + 0.06), 0.035, 0.1, 12)
        extra.append(c)
    elif prop == "mat":
        m = Part(f"{tag}_mat", "cloth_peach", bevel=0, coll=coll)
        m.tube([W(-0.16, -0.18, sz - 0.30), W(-0.16, 0.18, sz + 0.05)], 0.05, 14)
        extra.append(m)
    return [p.finish() for p in (s, h, t, b, f, *extra)]

# the cast — reusable presets so the city's people stay consistent
CAST = {
    "bhanu":   dict(skin="skin_1", hair="hair_dark", top="cloth_ink", bottom="cloth_navy", hair_style="short", beard=True, prop="laptop"),
    "student": dict(skin="skin_2", hair="hair_brown", top="cloth_rust", bottom="cloth_navy", hair_style="bun", prop="backpack"),
    "student2":dict(skin="skin_3", hair="hair_dark", top="cloth_sage", bottom="cloth_ink", hair_style="cap", prop="backpack"),
    "worker":  dict(skin="skin_3", hair="hair_brown", top="cloth_cream", bottom="cloth_ink", hair_style="long", glasses=True, prop="coffee"),
    "founder": dict(skin="skin_1", hair="hair_dark", top="cloth_navy", bottom="cloth_ink", hair_style="short", prop="laptop"),
    "wellness":dict(skin="skin_2", hair="hair_dark", top="cloth_sage", bottom="cloth_cream", hair_style="long", prop="mat"),
}
