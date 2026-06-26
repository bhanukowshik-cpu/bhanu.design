/* spiral-gallery/spiral.js — vanilla Three.js r134 + GSAP 3, no build step */
(function () {
  'use strict';

  function init() {
    var el = document.getElementById('spiral-root');
    if (!el) return;
    if (typeof THREE === 'undefined') { console.warn('[spiral] Three.js not loaded'); return; }
    if (typeof gsap  === 'undefined') { console.warn('[spiral] GSAP not loaded');     return; }

    el.style.background      = '#1E1E1E';
    el.style.backgroundImage = 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)';
    el.style.backgroundSize  = '28px 28px';

    // ── Cards ─────────────────────────────────────────────────────────────
    var CARDS = [
      { label: 'EverTutor',    src: '/images/blob.png',          video: false },
      { label: 'ET Live',      src: '/images/et-live.mp4',       video: true  },
      { label: 'ET Studio',    src: '/images/et-studio.mp4',     video: true  },
      { label: 'ET Analytics', src: '/images/et-analytics.mp4',  video: true  },
      { label: 'Dearly',       src: '/images/dearly.mp4',        video: true  },
      { label: 'Stressie',     src: '/images/stressie.mp4',      video: true  },
    ];
    var allCards = CARDS.concat(CARDS);

    // ── Vertex shader ─────────────────────────────────────────────────────
    var vert = `
varying vec2 vUv;
varying vec3 vWorldPosition;
#define PI 3.14159265359

uniform float uScrollSpeed;

void main() {
  vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 newPosition   = position;

  newPosition.z = sin(uv.x * PI) * 0.2;

  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition  = viewMatrix  * modelPosition;

  viewPosition.x += pow(worldPosition.y, 2.0) * 0.1;
  viewPosition.x += sin(uv.y * PI) * uScrollSpeed * 2.0;

  gl_Position = projectionMatrix * viewPosition;
  vUv            = uv;
  vWorldPosition = worldPosition;
}
`;

    // ── Fragment shader ───────────────────────────────────────────────────
    var frag = `
uniform sampler2D uTexture;
uniform float uColorStrength;
uniform float uZoom;
uniform vec2  uPlaneSizes;
uniform vec2  uImageSizes;
uniform float uRevealProgress;

varying vec2 vUv;

float roundedRectSDF(vec2 uv, vec2 size, float radius) {
  vec2 d = abs(uv - 0.5) - size * 0.5 + radius;
  return length(max(d, 0.0)) - radius;
}

void main() {
  vec2 ratio = vec2(
    min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
    min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
  );
  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );

  vec2 zoomedUv = (uv - 0.5) / uZoom + 0.5;

  vec4 color;
  if (gl_FrontFacing) {
    color = texture2D(uTexture, zoomedUv);
    color = mix(color, vec4(0.0, 0.0, 0.0, 1.0), uColorStrength);
  } else {
    float offset = 40.0 / 1024.0;
    vec4 c = vec4(0.0);
    c += texture2D(uTexture, uv + vec2(-offset, -offset)) * 1.0;
    c += texture2D(uTexture, uv + vec2( 0.0,    -offset)) * 2.0;
    c += texture2D(uTexture, uv + vec2( offset, -offset)) * 1.0;
    c += texture2D(uTexture, uv + vec2(-offset,  0.0))    * 2.0;
    c += texture2D(uTexture, uv)                          * 4.0;
    c += texture2D(uTexture, uv + vec2( offset,  0.0))    * 2.0;
    c += texture2D(uTexture, uv + vec2(-offset,  offset)) * 1.0;
    c += texture2D(uTexture, uv + vec2( 0.0,     offset)) * 2.0;
    c += texture2D(uTexture, uv + vec2( offset,  offset)) * 1.0;
    c /= 16.0;
    color = c;
  }

  float reveal     = clamp(uRevealProgress, 0.0, 1.0);
  vec2  revealSize = vec2(reveal);
  float radius     = 0.05 * reveal;
  float sdf        = roundedRectSDF(vUv, revealSize, radius);
  float alpha      = 1.0 - smoothstep(0.0, 0.002, sdf);
  alpha           *= smoothstep(0.1, 1.0, uRevealProgress);

  gl_FragColor = vec4(color.rgb, alpha);
}
`;

    // ── Renderer / Scene / Camera ─────────────────────────────────────────
    var W = el.clientWidth  || window.innerWidth;
    var H = el.clientHeight || window.innerHeight;

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 7);

    // ── Spiral constants ──────────────────────────────────────────────────
    var VERTICAL_GAP = 0.5;
    var ANGLE_GAP    = 0.85;
    var BASE_RADIUS  = 2.0;
    var totalCount   = allCards.length;
    var centerIndex  = Math.floor(totalCount / 2);

    var uniforms       = [];
    var hiddenProgress = [];
    var hiddenTarget   = [];
    var hoverProgress  = [];
    var hoverTarget    = [];
    var meshes         = [];

    // ── Meshes ────────────────────────────────────────────────────────────
    allCards.forEach(function (_, i) {
      var geo = new THREE.PlaneGeometry(1.7, 1.0, 8, 8);
      var u = {
        uTexture:        { value: new THREE.Texture() },
        uColorStrength:  { value: 0 },
        uZoom:           { value: 1 },
        uPlaneSizes:     { value: new THREE.Vector2(1.7, 1.0) },
        uImageSizes:     { value: new THREE.Vector2(1280, 720) },
        uRevealProgress: { value: 0 },
        uScrollSpeed:    { value: 0 },
      };
      uniforms.push(u);
      hiddenProgress.push(1);
      hiddenTarget.push(1);
      hoverProgress.push(0);
      hoverTarget.push(0);

      var mat  = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: u, transparent: true, side: THREE.DoubleSide });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      meshes.push(mesh);
    });

    // ── Texture loading ───────────────────────────────────────────────────
    var loader  = new THREE.TextureLoader();
    var videoEls = [];

    CARDS.forEach(function (card, ci) {
      var dup = ci + CARDS.length;
      if (card.video) {
        var vid = document.createElement('video');
        vid.src = card.src; vid.loop = true; vid.muted = true;
        vid.playsInline = true; vid.autoplay = true;
        vid.play().catch(function () {});
        videoEls.push(vid);
        var tex = new THREE.VideoTexture(vid);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        uniforms[ci].uTexture.value  = tex;
        uniforms[ci].uImageSizes.value.set(1280, 720);
        uniforms[dup].uTexture.value = tex;
        uniforms[dup].uImageSizes.value.set(1280, 720);
      } else {
        loader.load(card.src, function (tex) {
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          uniforms[ci].uTexture.value = tex;
          uniforms[ci].uImageSizes.value.set(tex.image.width, tex.image.height);
          uniforms[dup].uTexture.value = tex;
          uniforms[dup].uImageSizes.value.set(tex.image.width, tex.image.height);
        });
      }
    });

    // ── Scroll ────────────────────────────────────────────────────────────
    var wheelDeltaY       = 0;
    var targetWheelDeltaY = 0;
    var wheelDirection    = 1;
    var scrollOffset      = 0;

    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      targetWheelDeltaY += e.deltaY * 0.00015;
      targetWheelDeltaY  = Math.max(-2, Math.min(2, targetWheelDeltaY));
      wheelDirection     = e.deltaY > 0 ? 1 : -1;
    }, { passive: false });

    // ── Hover raycaster ───────────────────────────────────────────────────
    var raycaster = new THREE.Raycaster();
    var mouse     = new THREE.Vector2(-9999, -9999);

    el.addEventListener('mousemove', function (e) {
      var rect = el.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    });
    el.addEventListener('mouseleave', function () { mouse.set(-9999, -9999); });

    // ── Nav buttons ───────────────────────────────────────────────────────
    var navEl = document.createElement('div');
    navEl.style.cssText = 'position:absolute;top:24px;left:50%;transform:translateX(-50%);z-index:10;display:flex;gap:8px;';

    function makeBtn(label) {
      var b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:0.08em;padding:6px 20px;border-radius:20px;cursor:pointer;transition:all 0.2s;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.45);';
      return b;
    }

    var spiralBtn = makeBtn('SPIRAL');
    var listBtn   = makeBtn('LIST');
    navEl.appendChild(spiralBtn);
    navEl.appendChild(listBtn);
    el.appendChild(navEl);

    function setActive(btn) {
      [spiralBtn, listBtn].forEach(function (b) {
        b.style.borderColor = 'rgba(255,255,255,0.2)';
        b.style.color       = 'rgba(255,255,255,0.45)';
        b.style.background  = 'rgba(255,255,255,0.06)';
      });
      btn.style.borderColor = 'rgba(255,255,255,0.65)';
      btn.style.color       = '#fff';
      btn.style.background  = 'rgba(255,255,255,0.1)';
    }
    setActive(spiralBtn);

    spiralBtn.addEventListener('click', function () {
      setActive(spiralBtn);
      allCards.forEach(function (_, i) {
        setTimeout(function () { hiddenTarget[i] = 0; }, (i % 4) * 50);
      });
      gsap.to(camera.position, { z: 7, duration: 1, ease: 'power2.inOut' });
    });

    listBtn.addEventListener('click', function () {
      setActive(listBtn);
      allCards.forEach(function (_, i) { hiddenTarget[i] = 1; });
      gsap.to(camera.position, { z: 9, duration: 1, ease: 'power2.inOut' });
    });

    // ── Initial reveal ────────────────────────────────────────────────────
    setTimeout(function () {
      allCards.forEach(function (_, i) {
        setTimeout(function () { hiddenTarget[i] = 0; }, (i % 4) * 50);
      });
    }, 600);

    // ── Lerp ──────────────────────────────────────────────────────────────
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ── GSAP ticker ───────────────────────────────────────────────────────
    gsap.ticker.lagSmoothing(0);

    gsap.ticker.add(function (time, deltaTime) {
      // Scroll physics
      wheelDeltaY       += (targetWheelDeltaY - wheelDeltaY) * 0.1;
      scrollOffset      += wheelDeltaY;
      if (Math.abs(targetWheelDeltaY) < 0.002) {
        targetWheelDeltaY = wheelDirection * 0.002;
      }
      targetWheelDeltaY *= 0.9;

      // Hover raycast — front faces only
      raycaster.setFromCamera(mouse, camera);
      var hits   = raycaster.intersectObjects(meshes);
      var hitSet = new Set();
      hits.forEach(function (h) {
        if (h.face && h.face.normal.dot(raycaster.ray.direction) < 0) hitSet.add(h.object);
      });

      // Per-card update
      allCards.forEach(function (_, i) {
        var hidEase = 1 - Math.pow(1 - 0.05, deltaTime * 0.15);
        hiddenProgress[i] = lerp(hiddenProgress[i], hiddenTarget[i], hidEase);

        hoverTarget[i] = hitSet.has(meshes[i]) ? 1 : 0;
        var hovEase = 1 - Math.pow(1 - (hoverTarget[i] ? 0.09 : 0.07), deltaTime * 0.2);
        hoverProgress[i] = lerp(hoverProgress[i], hoverTarget[i], hovEase);

        var N = i - scrollOffset;
        N = ((N % totalCount) + totalCount) % totalCount;
        var B = N - centerIndex;

        var flyDir = hiddenTarget[i] > 0 ? 1.5 : -1.5;
        var y      = B * VERTICAL_GAP - 0.8 - hiddenProgress[i] * flyDir;
        var radius = BASE_RADIUS * (1 - hiddenProgress[i] / 2);
        var angle  = B * ANGLE_GAP;

        meshes[i].position.set(
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius
        );
        meshes[i].rotation.y = -angle + Math.PI / 2;

        uniforms[i].uScrollSpeed.value    = wheelDeltaY;
        uniforms[i].uColorStrength.value  = 0.55 * hoverProgress[i];
        uniforms[i].uZoom.value           = 1 + 0.05 * hoverProgress[i];
        uniforms[i].uRevealProgress.value = (1 - hoverProgress[i] * 0.05) * (1 - hiddenProgress[i]);
      });

      renderer.render(scene, camera);
    });

    // ── Resize ────────────────────────────────────────────────────────────
    window.addEventListener('resize', function () {
      var w = el.clientWidth;
      var h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
