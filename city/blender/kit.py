"""
City style kit — shared by every building script.

Rules (the "Daniel discipline"):
  * ONE palette of named matte materials (roughness 0.85). No ad-hoc colours.
  * Every edge bevelled (bevel modifier, 2 segments) — nothing ships with razor edges.
  * Hero assets get real detail; filler city blocks stay low-poly.
  * Units: 1 Blender unit ~ 8 m. Z up in Blender (glTF export converts to Y up).

Builders accumulate geometry into one bmesh per material-part, so a 1,000-piece truss
is one object, not 1,000.
"""
import bpy, bmesh, math
from mathutils import Matrix, Vector, Euler

# ── palette ───────────────────────────────────────────────────────────────────
# Sampled (k-means) from the two approved ChatGPT dusk-tower frames, 12 Nov 2026:
#   sky navy #1A2760 / #182764 · cobalt #26368C · dusk violet #4C4061 / #7A5B9A ·
#   umber #302A1B · rust #AA5F38 · sunset peach #F0A174 · dusty rose #D799AA
# Surface colours are the ROLE colours below (sRGB hex); everything matte, roughness ~0.85.
# Rule: no colour enters a model unless it is named here.
def _hex(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)   # sRGB → linear

SWATCH = {   # role: (hex, roughness)  — the kit sheet prints these
    # structure
    "orange":    ("#C2412B", 0.80),   # International Orange (bridge)
    "orange_d":  ("#7E2617", 0.85),   # the same paint in shadow / truss
    "concrete":  ("#D8D0C2", 0.90),
    "stone":     ("#8E877D", 0.90),
    "asphalt":   ("#2A2C34", 0.90),
    "ink":       ("#14161E", 0.80),   # trims, lamp posts, outlines
    "clay":      ("#F3ECDF", 0.88),   # neutral base / clay renders
    # SF facades (painted-lady pastels, pulled slightly toward the dusk palette)
    "facade_cream": ("#EADFC8", 0.88),
    "facade_sage":  ("#A9B79C", 0.88),
    "facade_blue":  ("#8EA3BF", 0.88),
    "facade_rose":  ("#D7A2A6", 0.88),   # ← dusty rose #D799AA
    "facade_mauve": ("#9A86A6", 0.88),   # ← dusk violet #7A5B9A, lifted
    "facade_terra": ("#B9663F", 0.88),   # ← rust #AA5F38
    "trim_white":   ("#F6F1E7", 0.85),
    "roof":         ("#4C4061", 0.90),   # ← dusk violet #4C4061
    "glass":        ("#1C2E81", 0.35),   # ← cobalt, unlit window glass
    "glass_tower":  ("#3A4E9A", 0.25),
    # nature
    "grass":     ("#5E7A55", 0.95),
    "foliage":   ("#3F5E45", 0.95),
    "foliage_l": ("#6F8F5C", 0.95),
    "earth":     ("#7A6250", 0.95),
    "wood":      ("#6B4530", 0.85),
    "water":     ("#1A2760", 0.30),   # ← sky navy
    # people
    "skin_1":    ("#8A5A3C", 0.80),
    "skin_2":    ("#C68B62", 0.80),
    "skin_3":    ("#E8C3A0", 0.80),
    "hair_dark": ("#1B1714", 0.85),
    "hair_brown":("#4A3022", 0.85),
    "cloth_navy":("#26368C", 0.90),   # ← cobalt
    "cloth_rust":("#AA5F38", 0.90),   # ← rust
    "cloth_peach":("#F0A174", 0.90),  # ← sunset peach
    "cloth_cream":("#EADFC8", 0.90),
    "cloth_ink": ("#1E2130", 0.90),
    "cloth_sage":("#7E9273", 0.90),
    # brand
    "vc_emerald":("#16845E", 0.60),   # Verified Call shield
}
PALETTE = {k: (_hex(h), r, 0.0) for k, (h, r) in SWATCH.items()}
EMISSIVE = {
    "lamp":    _hex("#FFC98A"),   # warm window / street light
    "window":  _hex("#FFC98A"),
    "screen":  _hex("#CFE4FF"),   # laptops, monitors
    "beacon":  _hex("#FF3B2F"),
    "vc_glow": _hex("#3FE0A0"),
}

def material(name):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    if name in PALETTE:
        col, rough, metal = PALETTE[name]
        b.inputs["Base Color"].default_value = (*col, 1)
        b.inputs["Roughness"].default_value = rough
        b.inputs["Metallic"].default_value = metal
    elif name in EMISSIVE:
        c = EMISSIVE[name]
        b.inputs["Base Color"].default_value = (*c, 1)
        b.inputs["Emission Color"].default_value = (*c, 1)
        b.inputs["Emission Strength"].default_value = 6.0
    return m

# ── scene helpers ─────────────────────────────────────────────────────────────
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def collection(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    return c

class Part:
    """Accumulates boxes / tubes / prisms into one mesh with one material."""
    def __init__(self, name, mat, bevel=0.04, segments=2, coll=None):
        self.name, self.mat, self.bevel, self.segments = name, mat, bevel, segments
        self.bm = bmesh.new()
        self.coll = coll

    # axis-aligned or rotated box, centre + full size
    def box(self, center, size, rot=(0, 0, 0)):
        geom = bmesh.ops.create_cube(self.bm, size=1.0)
        verts = geom["verts"]
        m = Matrix.Translation(Vector(center)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*size, 1))
        bmesh.ops.transform(self.bm, matrix=m, verts=verts)
        return verts

    # a beam between two points with a rectangular section (w, h)
    def beam(self, a, b, w, h=None, up=(0, 0, 1)):
        h = h or w
        a, b = Vector(a), Vector(b)
        d = b - a
        L = d.length
        if L < 1e-6:
            return
        z = d.normalized()
        upv = Vector(up)
        if abs(z.dot(upv)) > 0.99:
            upv = Vector((1, 0, 0))
        x = upv.cross(z).normalized()
        y = z.cross(x)
        rot = Matrix((x, y, z)).transposed().to_4x4()
        geom = bmesh.ops.create_cube(self.bm, size=1.0)
        m = Matrix.Translation((a + b) / 2) @ rot @ Matrix.Diagonal((w, h, L, 1))
        bmesh.ops.transform(self.bm, matrix=m, verts=geom["verts"])

    # a round tube through a polyline (cables, posts)
    def tube(self, pts, r, sides=10, cap=True):
        pts = [Vector(p) for p in pts]
        rings = []
        for i, p in enumerate(pts):
            t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            ref = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
            n = ref.cross(t).normalized()
            bnorm = t.cross(n)
            ring = []
            for k in range(sides):
                a = 2 * math.pi * k / sides
                ring.append(self.bm.verts.new(p + r * (math.cos(a) * n + math.sin(a) * bnorm)))
            rings.append(ring)
        for i in range(len(rings) - 1):
            for k in range(sides):
                k2 = (k + 1) % sides
                self.bm.faces.new((rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]))
        if cap:
            self.bm.faces.new(list(reversed(rings[0])))
            self.bm.faces.new(rings[-1])

    def ellipsoid(self, center, radii, segs=16, rings=10, rot=(0, 0, 0)):
        geom = bmesh.ops.create_uvsphere(self.bm, u_segments=segs, v_segments=rings, radius=1.0)
        m = Matrix.Translation(Vector(center)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*radii, 1))
        bmesh.ops.transform(self.bm, matrix=m, verts=geom["verts"])

    def ico(self, center, r, subdiv=2, squash=1.0):
        geom = bmesh.ops.create_icosphere(self.bm, subdivisions=subdiv, radius=1.0)
        m = Matrix.Translation(Vector(center)) @ Matrix.Diagonal((r, r, r * squash, 1))
        bmesh.ops.transform(self.bm, matrix=m, verts=geom["verts"])

    def cylinder(self, center, r, h, sides=12):
        c = Vector(center)
        self.tube([c - Vector((0, 0, h / 2)), c + Vector((0, 0, h / 2))], r, sides)

    def finish(self):
        me = bpy.data.meshes.new(self.name)
        self.bm.normal_update()
        self.bm.to_mesh(me)
        self.bm.free()
        ob = bpy.data.objects.new(self.name, me)
        (self.coll or bpy.context.scene.collection).objects.link(ob)
        ob.data.materials.append(material(self.mat))
        if self.bevel:
            mod = ob.modifiers.new("bevel", "BEVEL")
            mod.width = self.bevel
            mod.segments = self.segments
            mod.limit_method = "ANGLE"
            mod.angle_limit = math.radians(40)
            mod.harden_normals = True
        for p in me.polygons:
            p.use_smooth = True
        return ob

# ── preview rig: dusk light, sky, camera ──────────────────────────────────────
def light_rig(sun_elev=6, sun_az=-150, strength=3.5, sky=(0.06, 0.08, 0.20), horizon=(0.95, 0.52, 0.32)):
    w = bpy.data.worlds.new("dusk"); bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    grad = nt.nodes.new("ShaderNodeTexGradient"); grad.gradient_type = "LINEAR"
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mapn = nt.nodes.new("ShaderNodeMapping")
    mapn.inputs["Rotation"].default_value = (0, math.radians(-90), 0)
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.42; ramp.color_ramp.elements[0].color = (*horizon, 1)
    ramp.color_ramp.elements[1].position = 0.62; ramp.color_ramp.elements[1].color = (*sky, 1)
    nt.links.new(tc.outputs["Generated"], mapn.inputs["Vector"])
    nt.links.new(mapn.outputs["Vector"], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.9
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])

    sun = bpy.data.lights.new("sun", "SUN"); sun.energy = strength; sun.color = (1.0, 0.72, 0.5); sun.angle = math.radians(4)
    so = bpy.data.objects.new("sun", sun); bpy.context.scene.collection.objects.link(so)
    so.rotation_euler = Euler((math.radians(90 - sun_elev), 0, math.radians(sun_az)))
    fill = bpy.data.lights.new("fill", "SUN"); fill.energy = 0.6; fill.color = (0.55, 0.65, 1.0)
    fo = bpy.data.objects.new("fill", fill); bpy.context.scene.collection.objects.link(fo)
    fo.rotation_euler = Euler((math.radians(50), 0, math.radians(40)))

def camera(loc, target, lens=50, level=False):
    """level=True: architectural camera — no pitch (verticals stay vertical); the aim height is
    reached with a lens shift instead of tilting, like a shift lens / poster perspective."""
    cam = bpy.data.cameras.new("cam"); cam.lens = lens; cam.clip_end = 3000
    co = bpy.data.objects.new("cam", cam); bpy.context.scene.collection.objects.link(co)
    co.location = loc
    if level:
        dx, dy, dz = target[0] - loc[0], target[1] - loc[1], target[2] - loc[2]
        pitch = math.atan2(dz, math.hypot(dx, dy))
        cam.sensor_fit = "HORIZONTAL"
        cam.shift_y = math.tan(pitch) * lens / cam.sensor_width
        target = (target[0], target[1], loc[2])
    tgt = bpy.data.objects.new("target", None); bpy.context.scene.collection.objects.link(tgt); tgt.location = target
    c = co.constraints.new("TRACK_TO"); c.target = tgt; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
    bpy.context.scene.camera = co
    return co

def render(path, w=1600, h=1000, samples=48):
    s = bpy.context.scene
    s.render.engine = "BLENDER_EEVEE"
    s.render.resolution_x, s.render.resolution_y = w, h
    s.render.film_transparent = False
    try:
        s.eevee.taa_render_samples = samples
        s.eevee.use_shadows = True
        s.eevee.use_raytracing = True
    except Exception:
        pass
    try:
        s.view_settings.view_transform = "AgX"
        s.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass
    s.render.filepath = path
    bpy.ops.render.render(write_still=True)

def export_glb(path, objects=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in (objects or bpy.context.scene.objects):
        if o.type == "MESH":
            o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True,
                              export_apply=True, export_yup=True)
