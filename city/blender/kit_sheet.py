"""
Kit sheet — renders the whole kit for review:
  sheet_palette.png   every named material as a rounded tile
  sheet_people.png    the cast + street props
  sheet_buildings.png the SF building kit (hero types + low-poly filler)
Run: Blender -b --factory-startup -P city/blender/kit_sheet.py -- <out_dir>
"""
import bpy, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import kit, characters as ch, buildings as bd, props as pr
from kit import Part

def studio(sun_az=-35, sun_el=48, bg=(0.93, 0.91, 0.87)):
    w = bpy.data.worlds.new("studio"); bpy.context.scene.world = w; w.use_nodes = True
    bgn = w.node_tree.nodes["Background"]; bgn.inputs["Color"].default_value = (*bg, 1); bgn.inputs["Strength"].default_value = 0.85
    sun = bpy.data.lights.new("key", "SUN"); sun.energy = 3.2; sun.angle = math.radians(12); sun.color = (1.0, 0.95, 0.88)
    so = bpy.data.objects.new("key", sun); bpy.context.scene.collection.objects.link(so)
    so.rotation_euler = (math.radians(90 - sun_el), 0, math.radians(sun_az))

def ground(size=400):
    g = Part("ground", "clay", bevel=0)
    g.box((0, 0, -0.05), (size, size, 0.1)); g.finish()

def ortho_cam(center, scale, elev=32, az=-38):
    cam = bpy.data.cameras.new("cam"); cam.type = "ORTHO"; cam.ortho_scale = scale; cam.clip_end = 2000
    co = bpy.data.objects.new("cam", cam); bpy.context.scene.collection.objects.link(co)
    e, a = math.radians(elev), math.radians(az)
    d = 300
    co.location = (center[0] + d * math.cos(e) * math.sin(-a) * -1, center[1] - d * math.cos(e) * math.cos(a), center[2] + d * math.sin(e))
    tgt = bpy.data.objects.new("t", None); bpy.context.scene.collection.objects.link(tgt); tgt.location = center
    c = co.constraints.new("TRACK_TO"); c.target = tgt; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
    bpy.context.scene.camera = co

def sheet_palette(out):
    kit.reset(); studio(); ground()
    names = list(kit.SWATCH.keys()) + list(kit.EMISSIVE.keys())
    cols = 10
    for i, n in enumerate(names):
        r, c = divmod(i, cols)
        t = Part(f"tile_{n}", n, bevel=0.12, segments=3)
        t.box((c * 2.4 - cols * 1.2, -r * 2.4, 0.3), (2.0, 2.0, 0.6))
        t.finish()
    rows = math.ceil(len(names) / cols)
    ortho_cam((0, -rows * 1.2 + 1.2, 0), 26, elev=58, az=0)
    kit.render(os.path.join(out, "sheet_palette.png"), 1600, 900)
    print("PALETTE_ORDER", names)

def sheet_people(out):
    kit.reset(); studio(); ground()
    x = 0.0
    order = [("bhanu", "type"), ("student", "walk"), ("student2", "stand"), ("worker", "stand"), ("founder", "type"), ("wellness", "walk")]
    for tag, pose in order:
        ch.person(tag, x, 0, kind=pose, **ch.CAST[tag], facing=-1.2)
        if pose == "type":
            pr.bench(f"{tag}_bench", x - 0.05, 0.1, rot=-1.2 + math.pi / 2)
        x += 1.6
    pr.streetlamp("lamp", x + 0.4, 0.6); pr.tree("tree", x + 2.6, 0.8)
    pr.car("car", x + 6.5, 0.4, body="cloth_rust", rot=0)
    pr.cable_car("cc", x + 15.5, 0.8)
    pr.ferry("ferry", x + 32, 2.0)
    ortho_cam((x * 0.5 + 12, 0.5, 1.4), 48, elev=18, az=-28)
    kit.render(os.path.join(out, "sheet_people.png"), 1800, 800)
    kit.reset(); studio(); ground()           # close-up of the cast alone
    x = 0.0
    for tag, pose in order:
        ch.person(tag, x, 0, kind=pose, **ch.CAST[tag], facing=-1.2)
        if pose == "type":
            pr.bench(f"{tag}_bench", x - 0.05, 0.1, rot=-1.2 + math.pi / 2)
        x += 1.6
    ortho_cam((x * 0.5 - 0.8, 0, 0.95), 9.5, elev=12, az=-24)
    kit.render(os.path.join(out, "sheet_cast.png"), 1800, 800)

def sheet_buildings(out):
    kit.reset(); studio(); ground(600)
    x = 0.0
    for i, col in enumerate(("facade_rose", "facade_sage", "facade_blue", "facade_mauve", "facade_cream")):
        bd.victorian(f"vic{i}", x, 0, facade=col, lit_pattern=((i + 1) % 2, i % 2, 1, (i + 1) % 2, 1)); x += 7.8
    x += 2
    bd.edwardian("edw", x + 4.3, 0, facade="facade_blue"); x += 11
    bd.warehouse("wh", x + 11, 0); x += 25
    bd.office("off", x + 12, 0, floors=12); x += 28
    for i in range(5):
        bd.filler(f"fill{i}", x + i * 9, 0, 8, 10, 9 + (i * 7) % 20, facade=["facade_blue", "facade_cream", "facade_mauve", "facade_sage", "concrete"][i], seed=i + 3)
    x += 45
    for i in range(6):
        pr.tree(f"t{i}", 2 + i * 13.5, -4, h=5)
        pr.streetlamp(f"l{i}", 8 + i * 13.5, -4)
    ortho_cam((x * 0.5, 0, 14), x * 0.62, elev=20, az=-22)
    kit.render(os.path.join(out, "sheet_buildings.png"), 2000, 900)
    ortho_cam((19, 0, 7), 40, elev=14, az=-26)           # close-up on the painted ladies
    kit.render(os.path.join(out, "sheet_victorians.png"), 1800, 1000)

if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = argv[0] if argv else "/tmp"
    which = argv[1] if len(argv) > 1 else "all"
    if which in ("all", "palette"): sheet_palette(out)
    if which in ("all", "people"): sheet_people(out)
    if which in ("all", "buildings"): sheet_buildings(out)
