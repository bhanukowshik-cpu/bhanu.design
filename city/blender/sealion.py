"""
Hero creature: California sea lion, head and neck out of the water.
Built from metaballs (organic blends), converted to mesh, then detail added:
eyes with highlights, nose pad, whisker pads, ear flaps, wet sheen.
Run: Blender -b --factory-startup -P city/blender/sealion.py -- <out_dir>
"""
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import kit
from kit import Part, _hex

def metaball_mesh(name, balls, resolution=0.035):
    mb = bpy.data.metaballs.new(name); mb.resolution = resolution; mb.render_resolution = resolution * 0.7; mb.threshold = 0.6
    for (co, r, scale, rot) in balls:
        e = mb.elements.new(); e.type = "ELLIPSOID" if scale else "BALL"; e.co = co; e.radius = r
        if scale: e.size_x, e.size_y, e.size_z = scale
        if rot: e.rotation = rot
    ob = bpy.data.objects.new(name, mb); bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.convert(target="MESH")
    me = bpy.context.active_object
    for p in me.data.polygons: p.use_smooth = True
    return me

def skin_mat():
    """Wet sea-lion skin: warm brown base, darker back, glossy sheen."""
    m = bpy.data.materials.new("sealion_skin"); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.28; b.inputs["Coat Weight"].default_value = 0.6; b.inputs["Coat Roughness"].default_value = 0.08
    # darker on top (wet back), lighter toward the chest: gradient on generated Z / Y
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB"); e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0.15, (*_hex("#2A211D"), 1)
    e[1].position, e[1].color = 0.75, (*_hex("#7A5E4A"), 1)
    nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 18; nz.inputs["Detail"].default_value = 3
    bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.05
    nt.links.new(tc.outputs["Generated"], sep.inputs[0]); nt.links.new(sep.outputs["Y"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(nz.outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m

def sealion(tag, x=0.0, y=0.0, turn=0.0, lift=1.0):
    """Head + neck emerging at the origin waterline (z=0). Faces +X before `turn`. `lift` = how far out of the water."""
    L = lift
    balls = [
        ((0.00, 0, -0.30 * L), 0.55, (0.95, 0.80, 1.20), None),        # shoulders, under water
        ((0.05, 0, 0.25 * L), 0.42, (0.80, 0.70, 1.25), None),         # neck (sleek, tapering)
        ((0.18, 0, 0.72 * L), 0.36, (0.95, 0.78, 0.95), None),         # back of head
        ((0.32, 0, 0.80 * L), 0.30, (1.00, 0.82, 0.80), None),         # forehead dome
        ((0.58, 0, 0.72 * L), 0.22, (1.25, 0.80, 0.70), None),         # muzzle
        ((0.76, 0, 0.68 * L), 0.15, (1.10, 0.85, 0.75), None),         # snout tip
        ((0.60, 0.11, 0.66 * L), 0.12, None, None), ((0.60, -0.11, 0.66 * L), 0.12, None, None),   # whisker pads
    ]
    body = metaball_mesh(f"{tag}_body", balls)
    body.data.materials.append(skin_mat())
    sub = body.modifiers.new("sub", "SUBSURF"); sub.levels = 1; sub.render_levels = 2
    parts = [body]
    d = Part(f"{tag}_detail", "ink", bevel=0)
    for s in (-1, 1):
        d.ellipsoid((0.46, s * 0.20, 0.86 * L), (0.065, 0.06, 0.075), 16, 12)        # eyes (big, dark, glossy)
        d.ellipsoid((0.27, s * 0.235, 0.86 * L), (0.035, 0.025, 0.05), 10, 8)         # ear flaps
        for k in range(3):
            d.ellipsoid((0.66 + k * 0.035, s * (0.14 + k * 0.012), 0.64 * L - k * 0.02), (0.01, 0.01, 0.01), 6, 4)   # whisker dots
    d.ellipsoid((0.86, 0, 0.70 * L), (0.05, 0.07, 0.04), 12, 8)                     # nose pad
    do = d.finish()
    gm = bpy.data.materials.new("eye_gloss"); gm.use_nodes = True
    gb = gm.node_tree.nodes["Principled BSDF"]; gb.inputs["Base Color"].default_value = (0.01, 0.01, 0.012, 1); gb.inputs["Roughness"].default_value = 0.05
    do.data.materials.clear(); do.data.materials.append(gm)
    parts.append(do)
    hl = Part(f"{tag}_hl", "trim_white", bevel=0)                                    # catch-lights
    for s in (-1, 1):
        hl.ellipsoid((0.515, s * 0.215, 0.89 * L), (0.012, 0.012, 0.014), 8, 6)
    parts.append(hl.finish())
    for o in parts:
        o.rotation_euler = (0, 0, turn); o.location = (x, y, 0)
    return parts

def water_line(tag, x, y, r=0.62):
    """Not rings: a dark wet collar + a thin broken foam lip right where the body meets the water."""
    c = Part(f"{tag}_collar", "water", bevel=0)
    c.tube([(x + r * math.cos(a), y + r * 0.9 * math.sin(a), 0.02) for a in [i * 2 * math.pi / 48 for i in range(49)]], 0.06, 8, cap=False)
    f = Part(f"{tag}_foam", "trim_white", bevel=0)
    for seg in range(9):
        a0 = seg * 2 * math.pi / 9 + 0.2
        pts = [(x + (r + 0.12) * math.cos(a), y + (r + 0.12) * 0.9 * math.sin(a), 0.03) for a in [a0 + j * 0.06 for j in range(5)]]
        f.tube(pts, 0.02, 6, cap=False)
    return [c.finish(), f.finish()]

if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = argv[0] if argv else "/tmp"
    kit.reset()
    # water with real reflections for the close-up
    w = Part("water", "water", bevel=0); w.box((0, 0, -0.05), (80, 80, 0.1)); wo = w.finish()
    wm = wo.data.materials[0]; wb = wm.node_tree.nodes["Principled BSDF"]
    wb.inputs["Base Color"].default_value = (*_hex("#3B6E7E"), 1); wb.inputs["Roughness"].default_value = 0.04
    nz = wm.node_tree.nodes.new("ShaderNodeTexWave"); nz.inputs["Scale"].default_value = 3.0; nz.inputs["Distortion"].default_value = 6
    bump = wm.node_tree.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.08
    wm.node_tree.links.new(nz.outputs["Fac"], bump.inputs["Height"]); wm.node_tree.links.new(bump.outputs["Normal"], wb.inputs["Normal"])
    sealion("a", 0, 0, turn=math.radians(-25), lift=1.0); water_line("a", 0, 0)
    sealion("b", 2.2, 1.4, turn=math.radians(-150), lift=0.75); water_line("b", 2.2, 1.4, 0.55)
    sealion("c", -1.8, 2.3, turn=math.radians(20), lift=0.55); water_line("c", -1.8, 2.3, 0.5)
    kit.light_rig(sun_elev=12, sun_az=-120, strength=4.0, sky=(0.35, 0.45, 0.65), horizon=(0.98, 0.70, 0.55))
    kit.camera((4.4, -5.0, 1.5), (0.4, 0.8, 0.5), lens=45)
    s = bpy.context.scene
    s.render.engine = "BLENDER_EEVEE"; s.render.resolution_x, s.render.resolution_y = 1600, 1000
    s.eevee.taa_render_samples = 64
    try: s.eevee.use_raytracing = True
    except Exception: pass
    s.view_settings.view_transform = "AgX"
    s.render.filepath = os.path.join(out, "sealions_v2.png")
    bpy.ops.render.render(write_still=True)
