# Gap analysis: Blender build v2 vs the ChatGPT reference (12 Nov 2026)

| # | Gap | Why it exists | How we close it | Who |
|---|---|---|---|---|
| 1 | **Painterly richness** (foliage, rocks, sky texture) | Procedural shapes are clean, not hand-felt | ChatGPT generates detail layers in the style (ferns, rock faces, sky clouds); Blender keeps the structural layers | Me in ChatGPT + you approve |
| 2 | **Composition by eye** | Code placement ≠ art direction | Lock the composition to the approved reference: match its camera, horizon and framing; one review pass per scene | You + me |
| 3 | **Live sun direction** (SF real time) | A rendered image bakes its light: the sun can't move | **Relight in the browser.** Blender exports each layer as *light colour + shadow colour + normals + depth*; a WebGL shader re-shades every layer from SF's real sun angle, live. The two-tone "poster" lighting stays art-directed (each material keeps its own light and shadow colours) | Engine agent + me |
| 4 | **Life** (sea lions, ferry, wake, ripples, fog, gulls) | Stills can't move | Each living thing is its own layer or is drawn in code (ripples, wake, fog, shimmer) | Engine agent |
| 5 | **Reflections that shimmer** | Mirrored geometry is static | Reflection layer distorted by an animated ripple field in the shader | Engine agent |
| 6 | **Hero creature detail** (sea lion faces, gulls) | Low-poly blobs | Model better heads in Blender, or ChatGPT cut-out sprites | Me |
| 7 | **Typography in the scene** | Not part of the render | Outlined title as live HTML over the layers | Engine agent |
| 8 | **Phones** | Many full-screen layers | Half-res layers on mobile, fewer parallax planes, reduced-motion still | Engine agent |

## The pipeline (hybrid)
1. **Blender**: build each scene by script; render each layer to `city/layers/<scene>/<layer>_{light,shadow,normal,depth}.png` + `manifest.json`.
2. **ChatGPT**: optional detail layers in the same style, saved as PNGs with alpha (your OK per download).
3. **Browser engine** (`poster-lab.html`): composes layers back to front, relights with the live SF sun, adds haze, grain, fog, water, reflections, animation, parallax and the title.

## Agents
- **Engine agent:** builds the browser compositor/relighter against the manifest schema (runs in parallel with the Blender export).
- **Me:** Blender layer export, art direction, ChatGPT layers, integration, review against the reference.
- Later, per scene: one Blender agent per building (school, wellness studio, letter shop, tower) once the style kit is locked.
