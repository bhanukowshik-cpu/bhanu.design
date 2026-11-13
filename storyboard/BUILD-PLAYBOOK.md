# Build playbook — how studios build scroll-driven 3D worlds (research, 12 Nov 2026)

Summary of a research pass; sources inline. "(inference)" = recommendation without a direct source.

1. **Pipeline:** Blender Python script per building → GLB; bake lighting in Cycles to a 2nd UV;
   `gltf-transform optimize --compress meshopt --texture-compress ktx2`; lightmaps as separate KTX2.
   Budget ≤5 MB before first interaction (Zippy Town: 25 MB → 5 MB).
   https://tympanus.net/codrops/?p=102783 · https://www.svilenkovic.com/3d/how-to-bake-lighting-for-web
2. **People inside lit floors:** interior mapping (cubemap rooms behind each window, ~8-room atlas,
   chosen by hash); people as alpha cards or baked into the rooms; a per-floor "lit" bit turns floors
   on/off with no new geometry. `three-fenestra` 0.3.0 (MIT) or a custom shader.
   https://gamedeveloper.com/programming/interior-mapping-rendering-real-rooms-without-geometry
3. **Crowds:** one InstancedMesh of merged low-poly people, walk cycle in the vertex shader;
   vertex-animation textures only if real gait is needed. Keep them out of shadow passes.
   https://discourse.threejs.org/t/one-draw-call-massive-crowd-performance-engineering-in-three-js/89928
4. **Painted backdrops:** 3–5 alpha planes for far hills, Marin, skyline; hero objects stay real 3D.
   Keep AI plates consistent by rendering the Blender scene from the web camera as the img2img/depth
   guide, and share one colour grade across sky, tone mapping and plates (inference).
5. **Scroll camera:** author camera + look-at as two curves in Blender, rebuild as CatmullRomCurve3;
   native scroll → t, camera follows a damped t. Lenis: `lenis.on('scroll', ScrollTrigger.update)`,
   `gsap.ticker.add(t => lenis.raf(t*1000))`, `lagSmoothing(0)`. Pause rendering when idle/offscreen.
   Closest comparable: Odessis https://discourse.threejs.org/t/odessis-one-reversible-three-js-city-across-eight-chapters/93981
6. **Time + weather:** two baked lightmap sets (day/night) blended by one uniform (Zippy Town);
   sun from SunCalc for SF (mind its south-based azimuth). Fog: height fog + 2–3 soft fog cards, no
   raymarching on mobile. Weather → fog density / rain overlay.
7. **Performance:** detect-gpu for a starting tier; adaptive DPR 0.75–1.5 on mobile; half-res bloom;
   no realtime shadows; frame pacer for 120 Hz; reduced-motion stills; progressive loading
   (hero first); prove content works with WebGL blocked.
8. **Golden Gate:** model it low-poly (towers, deck, instanced suspenders); headlands as painted
   backdrop. Legal (not legal advice): Calif. S&H Code §27563 restricts the District's marks and the
   name when selling goods/services or implying endorsement. Rule: no District logos/photos, no bridge
   name in branding, no implied endorsement. An original artistic rendering looks fine.

**Stack:** three 0.187 · gsap 3.15 + ScrollTrigger · lenis 1.3 · gltf-transform 4.5 + KTX2 · meshopt ·
suncalc 2.1.4 · detect-gpu 5 · Blender 5.3 Cycles (headless bakes).

**Biggest risks:** (1) mobile memory/fill rate: budget GPU per section, unload passed sections;
(2) AI plates drifting from the 3D lighting; (3) bake iteration time: automate headless bakes from day one.
