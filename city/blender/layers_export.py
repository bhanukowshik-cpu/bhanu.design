"""
Export the poster Golden Gate as relightable layers for the browser engine (poster-lab.html).
Per layer: <name>_light.png, _shadow.png (sRGB art colours), _normal.png (world normal*0.5+0.5, raw),
_depth.png (linear view distance, raw) + manifest.json.  Schema: storyboard/GAPS.md / poster-lab.html.
Run: Blender -b --factory-startup -P city/blender/layers_export.py -- city/layers/gg
"""
import bpy, sys, os, json, math
sys.path.insert(0, os.path.dirname(__file__))
import kit, gg_poster as gp
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

NEAR, FAR = 5.0, 1300.0
CAM = dict(pos=(0, 58, 6.5), target=(4, -40, 15), lens=30)

def layer_of(o):
    n = o.name
    if n.endswith(".001"):                       return "reflection"
    if n.startswith(("sky", "sun", "fog_", "wake", "ripple_", "halo")): return None   # the engine draws these
    if n == "water":                             return "water_mask"
    if n.startswith("far_hills"):                return n.replace("far_hills_", "far_hills")
    if n.startswith(("sf_",)):                   return "sf"
    if n.startswith("alcatraz"):                 return "alcatraz"
    if n.startswith(("deck_lamps", "beacon")):   return "bridge_lights"
    if n.startswith(("tower", "deck", "cable", "anchorages", "pier")): return "bridge"
    if n.startswith("ferry"):                    return "ferry"
    if n.startswith("sealion_"):                 return n
    if n.startswith(("lookout", "bhanu")):       return "lookout"
    if n.startswith("fg_"):                      return "fg"
    if n.startswith(("ferns", "flowers")):       return "ferns"
    if n.startswith(("redwood", "needles")):     return "redwoods"
    return "misc"

ORDER = ["far_hills2", "far_hills1", "far_hills0", "sf", "alcatraz", "reflection", "water_mask", "bridge", "bridge_lights",
         "ferry", "sealion_0", "sealion_1", "sealion_2", "lookout", "fg", "ferns", "redwoods", "misc"]
PARALLAX = {"far_hills2": 0.02, "far_hills1": 0.03, "far_hills0": 0.04, "sf": 0.06, "alcatraz": 0.07, "reflection": 0.1, "water_mask": 0.1,
            "bridge": 0.12, "bridge_lights": 0.12, "ferry": 0.14, "lookout": 0.35, "fg": 0.5, "ferns": 0.55, "redwoods": 0.7}

def colours(o):
    """(light, shadow, is_glow) for the object's material."""
    m = o.material_slots[0].material if o.material_slots else None
    if m is None: return (0.5, 0.5, 0.5), (0.2, 0.2, 0.25), False
    if "glow" in m: c = tuple(m["glow"]); return c, c, True
    if "light" in m: return tuple(m["light"]), tuple(m["shadow"]), False
    if m.name in kit.EMISSIVE: c = kit.EMISSIVE[m.name]; return c, c, True
    if m.name in kit.PALETTE:
        c = kit.PALETTE[m.name][0]; return c, tuple(v * 0.42 for v in (c[0] * 0.8, c[1] * 0.85, c[2] * 1.1)), False
    return (0.5, 0.5, 0.5), (0.2, 0.2, 0.25), False

_cache = {}
def flat(col):
    key = tuple(round(v, 4) for v in col)
    if key in _cache: return _cache[key]
    m = bpy.data.materials.new(f"flat_{len(_cache)}"); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear(); e = nt.nodes.new("ShaderNodeEmission"); e.inputs["Color"].default_value = (*col, 1)
    o = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(e.outputs[0], o.inputs["Surface"]); _cache[key] = m; return m

def normal_mat():
    m = bpy.data.materials.new("pass_normal"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    g = nt.nodes.new("ShaderNodeNewGeometry"); v = nt.nodes.new("ShaderNodeVectorMath"); v.operation = "MULTIPLY_ADD"
    v.inputs[1].default_value = (0.5, 0.5, 0.5); v.inputs[2].default_value = (0.5, 0.5, 0.5)
    e = nt.nodes.new("ShaderNodeEmission"); o = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(g.outputs["Normal"], v.inputs[0]); nt.links.new(v.outputs["Vector"], e.inputs["Color"]); nt.links.new(e.outputs[0], o.inputs["Surface"])
    return m

def depth_mat():
    m = bpy.data.materials.new("pass_depth"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    c = nt.nodes.new("ShaderNodeCameraData"); r = nt.nodes.new("ShaderNodeMapRange")
    r.inputs["From Min"].default_value = NEAR; r.inputs["From Max"].default_value = FAR
    e = nt.nodes.new("ShaderNodeEmission"); o = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(c.outputs["View Distance"], r.inputs["Value"]); nt.links.new(r.outputs["Result"], e.inputs["Color"]); nt.links.new(e.outputs[0], o.inputs["Surface"])
    return m

def main(out):
    os.makedirs(out, exist_ok=True)
    gp.build_scene(); gp.mirror_all()
    s = bpy.context.scene
    cam = kit.camera(CAM["pos"], CAM["target"], lens=CAM["lens"], level=True)   # verticals stay vertical
    s.render.engine = "BLENDER_EEVEE"; s.render.resolution_x, s.render.resolution_y = gp.RES
    s.render.film_transparent = True; s.render.image_settings.file_format = "PNG"; s.render.image_settings.color_mode = "RGBA"
    s.eevee.taa_render_samples = 16
    meshes = [o for o in s.objects if o.type == "MESH"]
    groups = {}
    for o in meshes:
        L = layer_of(o)
        if L: groups.setdefault(L, []).append(o)
        else: o.hide_render = True
    COL = {o.name: colours(o) for o in meshes}        # read art colours BEFORE switching slots (the object slot starts empty)
    for o in meshes:                                  # per-object material override (mirror copies share mesh data)
        if o.material_slots:
            o.material_slots[0].link = "OBJECT"
    NM, DM = normal_mat(), depth_mat()
    bpy.context.view_layer.update()
    def uv(p):
        v = world_to_camera_view(s, cam, Vector(p)); return [round(v.x, 4), round(1 - v.y, 4)]
    layers = []
    for name in [n for n in ORDER if n in groups]:
        objs = groups[name]
        for o in meshes: o.hide_render = o not in objs
        glow = all(COL[o.name][2] for o in objs)
        passes = ["light"] if glow else ["light", "shadow", "normal", "depth"]
        if name == "water_mask": passes = ["light"]
        files = {}
        for ps in passes:
            for o in objs:
                lt, sh, _ = COL[o.name]
                mat = {"light": flat(lt), "shadow": flat(sh), "normal": NM, "depth": DM}[ps]
                if o.material_slots: o.material_slots[0].material = mat
            s.view_settings.view_transform = "Standard" if ps in ("light", "shadow") else "Raw"
            fn = f"{name}_{ps}.png"; s.render.filepath = os.path.join(out, fn)
            bpy.ops.render.render(write_still=True); files[ps] = fn
        kind = "glow" if glow else "reflection" if name == "reflection" else "water_mask" if name == "water_mask" else \
               "sprite" if name.startswith(("sealion", "ferry")) else "lit"
        anim = None
        if name.startswith("sealion"):
            i = int(name[-1]); x, y = [(-6, 18), (-11, 22), (-2, 25)][i]
            anim = {"type": "bob", "amp_px": 7, "period_s": 3.0 + i * 0.7, "phase": i * 1.3, "clip_y": uv((x, y, 0.0))[1]}
        if name == "ferry":
            a = math.radians(-14); dx, dy = math.cos(a), math.sin(a)
            anim = {"type": "path", "from": uv((18 - 70 * dx, -46 - 70 * dy, 1)), "to": uv((18 + 50 * dx, -46 + 50 * dy, 1)), "period_s": 48,
                    "origin": uv((18, -46, 1))}
        layers.append({"name": name, "order": len(layers), "parallax": PARALLAX.get(name, 0.2), "kind": kind, "files": files, "anim": anim})
        print("LAYER", name, kind, len(objs))
    man = {"width": gp.RES[0], "height": gp.RES[1],
           "camera": {"pos": list(CAM["pos"]), "target": [CAM["target"][0], CAM["target"][1], CAM["pos"][2]], "lens_mm": CAM["lens"], "sensor_mm": 36,
                      "shift_y": round(cam.data.shift_y, 5), "note": "level camera + vertical lens shift (fraction of sensor width)"},
           "depth_near": NEAR, "depth_far": FAR, "horizon_y": uv((4, -1100, 0))[1], "layers": layers,
           "note": "ferry.anim.origin = where the sprite was rendered; translate the sprite by (pos - origin)."}
    with open(os.path.join(out, "manifest.json"), "w") as f: json.dump(man, f, indent=1)
    print("MANIFEST", os.path.join(out, "manifest.json"))

if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    main(argv[0] if argv else "/tmp/layers")
