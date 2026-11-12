"""
Golden Gate — layered-poster style (NPR), the view from the Marin Headlands.
Style recipe (from the approved 'layered park poster' reference):
  * every shape: two-tone gradient (shadow → light by sun direction) + lift toward its top
  * stipple grain, pixel-locked, denser in shadow
  * atmospheric haze: colour fades to a pale teal-cream with distance (view depth)
  * real reflections in the water (EEVEE raytracing), fog bands between layers
Run: Blender -b --factory-startup -P city/blender/gg_poster.py -- <out_dir>
"""
import bpy, sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))
import kit, golden_gate as gg, characters as ch, props as pr
from kit import Part, _hex
from mathutils import Vector

RES = (1920, 1080)
SUN = Vector((-0.72, -0.35, 0.6)).normalized()      # golden light from upper right (west)
HAZE = _hex("#D9E8DF")                               # far colour (pale teal-cream)
HAZE_NEAR, HAZE_FAR = 40.0, 700.0

def npr(name, light, shadow, haze_k=1.0, grain=0.42, lift=0.18):
    """Flat poster material: gradient by sun + vertical lift + haze by depth + stipple grain."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    m["light"], m["shadow"] = list(light), list(shadow)          # read by layers_export.py
    nt = m.node_tree; nt.nodes.clear(); N, L = nt.nodes, nt.links
    out = N.new("ShaderNodeOutputMaterial")
    emit = N.new("ShaderNodeEmission")
    geo = N.new("ShaderNodeNewGeometry")
    dot = N.new("ShaderNodeVectorMath"); dot.operation = "DOT_PRODUCT"; dot.inputs[1].default_value = SUN
    lam = N.new("ShaderNodeMapRange"); lam.inputs["From Min"].default_value = -0.25; lam.inputs["From Max"].default_value = 0.85
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    liftm = N.new("ShaderNodeMath"); liftm.operation = "MULTIPLY_ADD"; liftm.inputs[1].default_value = lift
    shade = N.new("ShaderNodeMath"); shade.operation = "ADD"; shade.use_clamp = True
    mixc = N.new("ShaderNodeMix"); mixc.data_type = "RGBA"
    mixc.inputs[6].default_value = (*shadow, 1); mixc.inputs[7].default_value = (*light, 1)
    # stipple grain
    win = N.new("ShaderNodeVectorMath"); win.operation = "MULTIPLY"; win.inputs[1].default_value = (RES[0], RES[1], 1)
    flo = N.new("ShaderNodeVectorMath"); flo.operation = "FLOOR"
    wn = N.new("ShaderNodeTexWhiteNoise"); wn.noise_dimensions = "3D"
    dens = N.new("ShaderNodeMath"); dens.operation = "MULTIPLY_ADD"; dens.inputs[1].default_value = -grain; dens.inputs[2].default_value = grain + 0.04
    lt = N.new("ShaderNodeMath"); lt.operation = "LESS_THAN"
    dark = N.new("ShaderNodeMix"); dark.data_type = "RGBA"; dark.blend_type = "MULTIPLY"
    dark.inputs[7].default_value = (0.62, 0.66, 0.78, 1)
    # haze
    cam = N.new("ShaderNodeCameraData")
    hz = N.new("ShaderNodeMapRange"); hz.inputs["From Min"].default_value = HAZE_NEAR; hz.inputs["From Max"].default_value = HAZE_FAR
    hpow = N.new("ShaderNodeMath"); hpow.operation = "POWER"; hpow.inputs[1].default_value = 0.7
    hmul = N.new("ShaderNodeMath"); hmul.operation = "MULTIPLY"; hmul.inputs[1].default_value = 0.92 * haze_k; hmul.use_clamp = True
    hmix = N.new("ShaderNodeMix"); hmix.data_type = "RGBA"; hmix.inputs[7].default_value = (*HAZE, 1)

    L.new(geo.outputs["Normal"], dot.inputs[0]); L.new(dot.outputs["Value"], lam.inputs["Value"])
    L.new(tc.outputs["Generated"], sep.inputs[0]); L.new(sep.outputs["Z"], liftm.inputs[0]); liftm.inputs[2].default_value = -lift * 0.5
    L.new(lam.outputs["Result"], shade.inputs[0]); L.new(liftm.outputs["Value"], shade.inputs[1])
    L.new(shade.outputs["Value"], mixc.inputs[0])
    L.new(tc.outputs["Window"], win.inputs[0]); L.new(win.outputs["Vector"], flo.inputs[0]); L.new(flo.outputs["Vector"], wn.inputs["Vector"])
    L.new(shade.outputs["Value"], dens.inputs[0]); L.new(wn.outputs["Value"], lt.inputs[0]); L.new(dens.outputs["Value"], lt.inputs[1])
    L.new(lt.outputs["Value"], dark.inputs[0]); L.new(mixc.outputs[2], dark.inputs[6])
    L.new(cam.outputs["View Z Depth"], hz.inputs["Value"]); L.new(hz.outputs["Result"], hpow.inputs[0]); L.new(hpow.outputs["Value"], hmul.inputs[0])
    L.new(hmul.outputs["Value"], hmix.inputs[0]); L.new(dark.outputs[2], hmix.inputs[6])
    L.new(hmix.outputs[2], emit.inputs["Color"]); L.new(emit.outputs["Emission"], out.inputs["Surface"])
    return m

def glow(name, col, strength=4.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    m["glow"] = list(col)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Emission Color"].default_value = (*col, 1)
    b.inputs["Emission Strength"].default_value = strength
    return m

def alpha_card(name, col, alpha=0.6):
    """Soft fog band: emission colour, alpha fading at the top and bottom edges (vertical gradient)."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear(); N, L = nt.nodes, nt.links
    out = N.new("ShaderNodeOutputMaterial"); mixs = N.new("ShaderNodeMixShader")
    tr = N.new("ShaderNodeBsdfTransparent"); em = N.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (*col, 1)
    tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ")
    ramp = N.new("ShaderNodeValToRGB")
    e = ramp.color_ramp.elements; e[0].position, e[0].color = 0.0, (0, 0, 0, 1); e[1].position, e[1].color = 0.45, (alpha, alpha, alpha, 1)
    e3 = e.new(1.0); e3.color = (0, 0, 0, 1)
    L.new(tc.outputs["Generated"], sep.inputs[0]); L.new(sep.outputs["Z"], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], mixs.inputs["Fac"]); L.new(tr.outputs[0], mixs.inputs[1]); L.new(em.outputs[0], mixs.inputs[2])
    L.new(mixs.outputs[0], out.inputs["Surface"])
    try: m.surface_render_method = "BLENDED"
    except Exception: pass
    return m

def assign(objs, mat):
    for o in objs:
        o.data.materials.clear(); o.data.materials.append(mat)

def scaled(objs, s, loc, rot_z=0.0):
    for o in objs:
        o.scale = (s, s, s); o.rotation_euler = (0, 0, rot_z); o.location = loc
    return objs

# ── palette for this scene (poster reference) ─────────────────────────────────
C = {k: _hex(v) for k, v in {
    "bridge_l": "#F0703F", "bridge_s": "#8E2E22",
    "redwood_l": "#B5532F", "redwood_s": "#1B1A3F",
    "tree_l": "#9DBF5A", "tree_s": "#1F4A3E", "tree2_l": "#E8A33A", "tree2_s": "#6A4A2A",
    "hill_l": "#6E9C78", "hill_s": "#24474A", "rock_l": "#B7AA92", "rock_s": "#4A4C55",
    "city_l": "#E7E1D2", "city_s": "#7F93A6", "sf_hill_l": "#A9C2B4", "sf_hill_s": "#6C8796",
    "alc_l": "#D9CDB4", "alc_s": "#7B8592", "ship_l": "#FFFFFF", "ship_s": "#9AA8BC",
    "seal_l": "#7A6656", "seal_s": "#2A2228", "ink": "#151826", "flower": "#F2B632", "fern_l": "#3F7A5C", "fern_s": "#0B2629",
}.items()}

MIRROR_SRC = []

def mirror_all():
    for o in MIRROR_SRC:
        c = o.copy(); bpy.context.scene.collection.objects.link(c)
        c.scale = (o.scale.x, o.scale.y, -o.scale.z); c.location = (o.location.x, o.location.y, -o.location.z - 0.3)

def build_scene():
    kit.reset()
    s = bpy.context.scene
    world = bpy.data.worlds.new("w"); s.world = world; world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (*HAZE, 1)

    # sky card (gradient + grain via npr with flat normal facing the camera)
    sky = Part("sky", "clay", bevel=0); sky.box((0, -1200, 220), (3600, 2, 900)); sky_o = sky.finish()
    skym = bpy.data.materials.new("skym"); skym.use_nodes = True; nt = skym.node_tree; nt.nodes.clear()
    N, L = nt.nodes, nt.links
    out = N.new("ShaderNodeOutputMaterial"); em = N.new("ShaderNodeEmission"); tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ")
    ramp = N.new("ShaderNodeValToRGB"); e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0.40, (*_hex("#F7E3B0"), 1); e[1].position, e[1].color = 0.62, (*_hex("#9FD0CF"), 1)
    e3 = e.new(0.85); e3.color = (*_hex("#4E8FBF"), 1)
    L.new(tc.outputs["Generated"], sep.inputs[0]); L.new(sep.outputs["Z"], ramp.inputs["Fac"]); L.new(ramp.outputs["Color"], em.inputs["Color"])
    L.new(em.outputs[0], out.inputs["Surface"]); assign([sky_o], skym)
    # sun + halo (upper right)
    sun = Part("sun", "clay", bevel=0); sun.ellipsoid((-230, -1100, 300), (40, 2, 40), 96, 6); assign([sun.finish()], glow("sunm", _hex("#FFF4CF"), 1.6))

    # far East Bay / SF hills — layered silhouettes, paler with distance
    random.seed(7)
    for li, (y, zc, k) in enumerate(((-620, 26, 1.0), (-470, 20, 0.85), (-330, 14, 0.7))):
        h = Part(f"far_hills_{li}", "clay", bevel=0)
        for i in range(14):
            x = -380 + i * 60 + random.random() * 30
            h.ellipsoid((x, y + random.random() * 30, 0), (60 + random.random() * 40, 30, zc + random.random() * zc), 24, 12)
        assign([h.finish()], npr(f"far_hill_m{li}", C["sf_hill_l"], C["sf_hill_s"], haze_k=k))

    # San Francisco skyline on its hills (left / centre, behind the bridge)
    cityp = Part("sf_city", "clay", bevel=0.2)
    for i in range(90):
        x = 20 + random.random() * 260; y = -200 - random.random() * 90
        w = 4 + random.random() * 7; h = 6 + random.random() ** 2.5 * 38
        cityp.box((x, y, h / 2 + 4), (w, w * 0.8, h))
    cityp.box((120, -230, 30), (5, 5, 58)); cityp.box((120, -230, 62), (2.6, 2.6, 8))          # an original slender spire
    tri = Part("sf_pyramid", "clay", bevel=0)                                                   # an original tapered tower
    tri.tube([(150, -245, 4), (150, -245, 70)], 4.5, 4)
    assign([cityp.finish(), tri.finish()], npr("city_m", C["city_l"], C["city_s"], haze_k=0.8, grain=0.3))
    sfh = Part("sf_hills", "clay", bevel=0)
    for i in range(9):
        sfh.ellipsoid((10 + i * 36, -215 - (i % 3) * 25, 0), (40, 45, 10 + (i % 4) * 5), 24, 12)
    assign([sfh.finish()], npr("sf_hill_m", C["sf_hill_l"], C["sf_hill_s"], haze_k=0.75))
    # gumdrop trees on SF hills (Presidio)
    gt = Part("sf_trees", "clay", bevel=0)
    for i in range(60):
        x = -10 + random.random() * 110; y = -170 - random.random() * 30
        r = 1.6 + random.random() * 1.6; gt.ellipsoid((x, y, r * 1.2 + 2), (r, r, r * 2.2), 14, 10)
    assign([gt.finish()], npr("sf_tree_m", C["tree_l"], C["tree_s"], haze_k=0.7))

    # Alcatraz (left, in the bay)
    al = Part("alcatraz", "clay", bevel=0.2)
    al.ellipsoid((95, -110, 0), (16, 9, 4), 24, 10); al.box((95, -110, 5.5), (10, 4, 3)); al.box((102, -108, 9), (1.2, 1.2, 9))
    assign([al.finish()], npr("alc_m", C["alc_l"], C["alc_s"], haze_k=0.6))

    # the bridge (detailed kit asset), floodlit-orange poster tones
    objs = gg.build(kit.collection("gg"))
    sc = 0.62
    for o in objs:
        o.scale = (sc, sc, sc); o.rotation_euler = (0, 0, math.radians(-14)); o.location = (0, -40, 0)
    bm = npr("bridge_m", C["bridge_l"], C["bridge_s"], haze_k=0.35, grain=0.3)
    for o in objs:
        nm = o.data.materials[0].name if o.data.materials else ""
        if nm in ("lamp", "beacon"):
            continue
        o.data.materials.clear(); o.data.materials.append(bm if nm != "asphalt" else npr("road_m", _hex("#5A4A55"), _hex("#2A2433"), 0.35))
    # fog under the deck + along the strait
    for i, (y, z, w, h, a) in enumerate(((-34, 1.0, 400, 9, 0.75), (-60, 2.0, 500, 12, 0.6), (-150, 4.0, 700, 14, 0.5), (-260, 6.0, 900, 18, 0.45))):
        f = Part(f"fog_{i}", "clay", bevel=0); f.box((0, y, z + h / 2), (w, 1, h)); assign([f.finish()], alpha_card(f"fog_m{i}", HAZE, a))

    # water — glossy, reflects bridge, sky and city; subtle ripple bump
    w = Part("water", "clay", bevel=0); w.box((0, -200, -0.5), (3000, 900, 1)); wo = w.finish()
    wm = bpy.data.materials.new("water_m"); wm.use_nodes = True; b = wm.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*_hex("#2E6C7A"), 1); b.inputs["Roughness"].default_value = 0.2
    b.inputs["Alpha"].default_value = 0.62
    try: wm.surface_render_method = "BLENDED"
    except Exception: pass
    nz = wm.node_tree.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 6.0
    bump = wm.node_tree.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.12
    mp = wm.node_tree.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (0.05, 0.6, 1)
    tcw = wm.node_tree.nodes.new("ShaderNodeTexCoord")
    wm.node_tree.links.new(tcw.outputs["Object"], mp.inputs["Vector"]); wm.node_tree.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    wm.node_tree.links.new(nz.outputs["Fac"], bump.inputs["Height"]); wm.node_tree.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    assign([wo], wm)
    # mirrored world under the water line = reflections (bridge, city, hills, ferry added later)
    MIRROR_SRC.extend(o for o in bpy.data.objects if o.type == "MESH" and (o.name.startswith(("tower", "deck", "cable", "anchorages", "pier", "sf_", "far_hills", "alcatraz", "sun"))))

    # ferry under the bridge + V wake
    fo = pr.ferry("ferry", 0, 0); scaled(fo, 0.3, (18, -46, 0.1), math.radians(-14))
    for o in fo:
        nm = o.data.materials[0].name
        if nm != "window":
            o.data.materials.clear(); o.data.materials.append(npr("ship_m", C["ship_l"], C["ship_s"], 0.35, grain=0.25))
    wk = Part("wake", "clay", bevel=0)
    import math as _m
    a0 = _m.radians(-14)
    for sgn in (-1, 1):
        ang = a0 + sgn * 0.22
        L = 38
        cx, cy = 22 + _m.cos(ang) * L / 2, -46 + _m.sin(ang) * L / 2
        wk.box((cx, cy, 0.05), (L, 0.45, 0.06), rot=(0, 0, ang))
    wk.ellipsoid((21, -46, 0.05), (3.5, 1.4, 0.05), 20, 4)
    assign([wk.finish()], glow("wake_m", _hex("#F4FBFF"), 0.9))

    # foreground cove with sea lions + ripple rings
    for i, (x, y) in enumerate(((-6, 18), (-11, 22), (-2, 25))):
        sl = Part(f"sealion_{i}", "clay", bevel=0)
        sl.ellipsoid((x, y, 0.35), (0.55, 0.42, 0.7), 18, 12)
        sl.ellipsoid((x + 0.15, y - 0.35, 0.95), (0.32, 0.38, 0.3), 18, 12, rot=(0.4, 0, 0))   # head turned to the bridge
        sl.ellipsoid((x + 0.2, y - 0.68, 0.9), (0.14, 0.16, 0.12), 12, 8)                      # snout
        assign([sl.finish()], npr("seal_m", C["seal_l"], C["seal_s"], 0.0, grain=0.5))
        rp = Part(f"ripple_{i}", "clay", bevel=0)
        for r in (1.0, 1.7, 2.5):
            pts = [(x + r * math.cos(a), y + r * 0.55 * math.sin(a), 0.03) for a in [j * 2 * math.pi / 40 for j in range(41)]]
            rp.tube(pts, 0.05, 6, cap=False)
        assign([rp.finish()], glow("ripple_m", _hex("#DFF3F0"), 0.7))

    # lookout rock (right) with the bench and Bhanu
    rk = Part("lookout", "clay", bevel=0)
    rk.ellipsoid((-22, 28, -1.5), (9, 7, 4.5), 24, 14); rk.ellipsoid((-28, 34, -1), (8, 8, 6), 24, 14)
    assign([rk.finish()], npr("rock_m", C["rock_l"], C["rock_s"], 0.0))
    bob = ch.person("bhanu", 0, 0, kind="type", **ch.CAST["bhanu"], facing=math.radians(-100))
    bb = pr.bench("bhanu_bench", -0.05, 0.1, rot=math.radians(-100) + math.pi / 2)
    scaled(bob + bb, 0.75, (-21, 27.5, 2.85), 0)

    # foreground slope, ferns, flowers
    fg = Part("fg_slope", "clay", bevel=0)
    fg.ellipsoid((8, 44, -3), (40, 14, 5), 32, 16); fg.ellipsoid((-30, 44, -2), (26, 12, 5), 32, 16)
    assign([fg.finish()], npr("fg_m", C["fern_l"], C["fern_s"], 0.0))
    fern = Part("ferns", "clay", bevel=0)
    for i in range(40):
        x = -40 + random.random() * 80; y = 36 + random.random() * 8
        for k in range(5):
            a = -0.9 + k * 0.45
            fern.beam((x, y, 0.5), (x + 1.6 * math.sin(a), y - 0.4, 0.5 + 1.6 * math.cos(a)), 0.18, 0.04)
    assign([fern.finish()], npr("fern_m", C["fern_l"], C["fern_s"], 0.0))
    fl = Part("flowers", "clay", bevel=0)
    for i in range(70):
        x = -38 + random.random() * 76; y = 33 + random.random() * 8
        fl.ellipsoid((x, y, 0.9 + random.random() * 0.8), (0.35, 0.35, 0.12), 12, 6)
    assign([fl.finish()], npr("flower_m", C["flower"], _hex("#B5671E"), 0.0, grain=0.25))

    # redwood trunks framing left and right
    for i, (x, y, r) in enumerate(((10.5, 46, 1.9), (7.6, 40, 1.1), (-11.5, 47, 2.2), (-8.4, 41, 1.0))):
        t = Part(f"redwood_{i}", "clay", bevel=0)
        for k in range(8):
            z0, z1 = k * 14 - 4, (k + 1) * 14 - 4
            t.tube([(x, y, z0), (x + 0.2 * math.sin(k), y, z1)], r * (1 - k * 0.06), 20)
        assign([t.finish()], npr(f"redwood_m", C["redwood_l"], C["redwood_s"], 0.0, grain=0.55))
    # needle clusters at the top corners (gumdrop masses)
    nd = Part("needles", "clay", bevel=0)
    for (x, y, z) in ((10, 44, 24), (7, 41, 21), (-11, 45, 25), (-8, 41, 22), (-4, 44, 27)):
        for k in range(5):
            nd.ellipsoid((x + random.uniform(-3, 3), y, z + random.uniform(-2, 2)), (3.2, 1.0, 1.3), 18, 10)
    assign([nd.finish()], npr("needle_m", C["tree_l"], C["tree_s"], 0.0, grain=0.5))

def render(out):
    s = bpy.context.scene
    cam = kit.camera((0, 58, 6.5), (4, -40, 15), lens=30, level=True)
    s.render.engine = "BLENDER_EEVEE"; s.render.resolution_x, s.render.resolution_y = RES
    try:
        s.eevee.taa_render_samples = 32; s.eevee.use_raytracing = True
        s.eevee.ray_tracing_options.resolution_scale = "1"
    except Exception as e:
        print("eevee opt", e)
    s.view_settings.view_transform = "Standard"     # flat poster colour — no filmic roll-off
    s.render.filepath = os.path.join(out, "gg_poster.png")
    bpy.ops.render.render(write_still=True)

if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = argv[0] if argv else "/tmp"
    build_scene(); mirror_all(); render(out)
