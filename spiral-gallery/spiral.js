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
      { label: 'EverTutor',    img: '/images/blob.png',      video: null                        },
      { label: 'ET Live',      img: '/images/thumb-1.jpg',   video: '/images/et-live.mp4'       },
      { label: 'ET Studio',    img: '/images/thumb-2.jpg',   video: '/images/et-studio.mp4'     },
      { label: 'ET Analytics', img: '/images/thumb-3.jpg',   video: '/images/et-analytics.mp4'  },
      { label: 'Stressie',     img: '/images/thumb-5.jpg',   video: '/images/stressie.mp4'      },
      { label: 'Dearly',       img: '/images/thumb-4.jpg',   video: '/images/dearly.mp4'        },
    ];
    var allCards = CARDS.concat(CARDS);

    // ── List view card data ───────────────────────────────────────────────
    var LIST_CARDS = [
      {
        eyebrow: '01', label: 'EverTutor AI System',
        src: '/images/blob-dark.png', video: false,
        desc: "World's first multi-modal 1:1 voice AI tutor — 3 tools working as one system to enable a billion tutors for a billion minds.",
        metrics: [{ val: '2000+', lbl: 'Users' }, { val: '−96%', lbl: 'Saved' }, { val: '$300k', lbl: 'ARR' }],
        href: 'evertutor-live.html',
      },
      {
        eyebrow: '02', label: 'EverTutor Live',
        src: '/images/et-live.mp4', video: true, poster: '/images/et-live.png',
        desc: 'Voice-first AI tutor taken from prototype to PMF. Students master topics in 30 min vs 60 in a classroom.',
        metrics: [{ val: '85%', lbl: 'Rate' }, { val: '2×', lbl: 'Faster' }, { val: '$5/hr', lbl: 'vs $250' }],
        href: 'evertutor-live.html',
      },
      {
        eyebrow: '03', label: 'EverTutor Studio',
        src: '/images/et-studio.mp4', video: true, poster: '/images/et-studio.png',
        desc: 'Lesson creation tool designed overnight. Cut content production from 104 hours down to 4 — first lesson built in ~2 hours.',
        metrics: [{ val: '104→4', lbl: 'Hrs/Les.' }, { val: '12', lbl: 'Schools' }, { val: '8', lbl: 'District' }],
        href: 'evertutor-studio.html',
      },
      {
        eyebrow: '04', label: 'EverTutor Analytics',
        src: '/images/et-analytics.mp4', video: true, poster: '/images/et-analytics.png',
        desc: 'Real-time student insights. The dog-ear system — complexity on demand, clean by default. Fully in production.',
        metrics: [{ val: 'Live', lbl: 'Shipped' }, { val: 'Clean', lbl: 'Dog-ear' }, { val: '0', lbl: 'Bugs' }],
        href: '#',
      },
      {
        eyebrow: '05', label: 'Stressie',
        src: '/images/stressie.mp4', video: true, poster: null,
        desc: 'Harvard-incubated workplace stress app. Full redesign from the ground up — engagement hit 17.4% vs ~2% industry average.',
        metrics: [{ val: '17.4%', lbl: 'Engage' }, { val: '$600k', lbl: 'Funding' }, { val: 'Amzn', lbl: '& InKind' }],
        href: 'stressie-studio.html',
      },
      {
        eyebrow: '06', label: 'Dearly',
        src: '/images/dearly.mp4', video: true, poster: '/images/dearly.png',
        desc: 'Animated handwriting messages with your real voice and photos attached, sent as a unique link. Built in 48 hours.',
        metrics: [{ val: '140', lbl: 'Letters' }, { val: '35★', lbl: '5-Star' }, { val: '48hrs', lbl: 'Built In' }],
        href: '#',
      },
    ];

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
uniform sampler2D uVideoTexture;
uniform float uColorStrength;
uniform float uZoom;
uniform vec2  uPlaneSizes;
uniform vec2  uImageSizes;
uniform float uRevealProgress;
uniform float uVideoReveal;

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

  // ── Video sub-panel: physically slides up from below the card ────────────
  // Panel is 92% of the card with 4% margin on every side when fully revealed.
  // Constraint: panelSY + 2*panelMY = 1.0, panelSX + 2*panelMX = 1.0
  float panelMX  = 0.04;
  float panelMY  = 0.04;
  float panelSX  = 0.92;
  float panelSY  = 0.92;

  // uVideoReveal=0 → panel fully below card (panelTop=0, panelBot=-panelSY)
  // uVideoReveal=1 → panel in final inset position (panelBot=panelMY, panelTop=1-panelMY)
  float panelBot = -panelSY + uVideoReveal * (panelMY + panelSY);
  float panelTop =             uVideoReveal * (1.0 - panelMY);

  // Soft panel edges (anti-aliased)
  float fe       = 0.005;
  float inX      = smoothstep(panelMX - fe, panelMX + fe, vUv.x) *
                   smoothstep(1.0 - panelMX + fe, 1.0 - panelMX - fe, vUv.x);
  float inY      = smoothstep(panelBot - fe, panelBot + fe, vUv.y) *
                   smoothstep(panelTop  + fe, panelTop  - fe, vUv.y);
  float inPanel  = inX * inY * step(0.001, uVideoReveal);

  // Remap card UV → video texture UV (1:1 since both are 16:9)
  float vidU     = (vUv.x - panelMX) / panelSX;
  float vidV     = (vUv.y - panelBot) / panelSY;
  vec2  vidUV    = clamp(vec2(vidU, vidV), 0.0, 1.0);

  vec4 imgSample = texture2D(uTexture,      zoomedUv);
  vec4 vidSample = texture2D(uVideoTexture, vidUV);
  vec4 blended   = mix(imgSample, vidSample, inPanel);

  // Glowing scan-line at the leading (top) edge of the panel as it slides up
  float edgeDist = abs(vUv.y - panelTop);
  float edge     = 1.0 - smoothstep(0.0, 0.022, edgeDist);
  float edgeVis  = edge * inX * step(0.01, uVideoReveal) * step(uVideoReveal, 0.99);
  blended.rgb   += vec3(0.9, 0.95, 0.55) * edgeVis * 0.8;

  vec4 color;
  if (gl_FrontFacing) {
    color = blended;
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
    var videoRevealProgress = [];
    var videoRevealTarget   = [];

    allCards.forEach(function (_, i) {
      var geo = new THREE.PlaneGeometry(16/9, 1.0, 8, 8);
      var u = {
        uTexture:        { value: new THREE.Texture() },
        uVideoTexture:   { value: new THREE.Texture() },
        uColorStrength:  { value: 0 },
        uZoom:           { value: 1 },
        uPlaneSizes:     { value: new THREE.Vector2(16/9, 1.0) },
        uImageSizes:     { value: new THREE.Vector2(1280, 720) },
        uRevealProgress: { value: 0 },
        uVideoReveal:    { value: 0 },
        uScrollSpeed:    { value: 0 },
      };
      uniforms.push(u);
      hiddenProgress.push(1);
      hiddenTarget.push(1);
      hoverProgress.push(0);
      hoverTarget.push(0);
      videoRevealProgress.push(0);
      videoRevealTarget.push(0);

      var mat  = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: u, transparent: true, side: THREE.DoubleSide });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      meshes.push(mesh);
    });

    // ── Texture loading ───────────────────────────────────────────────────
    var loader   = new THREE.TextureLoader();
    var videoEls = []; // one per CARDS entry (null if no video)

    CARDS.forEach(function (card, ci) {
      var dup = ci + CARDS.length;

      // Static poster image for all cards
      loader.load(card.img, function (tex) {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        uniforms[ci].uTexture.value = tex;
        uniforms[ci].uImageSizes.value.set(tex.image.width, tex.image.height);
        uniforms[dup].uTexture.value = tex;
        uniforms[dup].uImageSizes.value.set(tex.image.width, tex.image.height);
      });

      // Video texture — created but not played until card is frontmost
      if (card.video) {
        var vid = document.createElement('video');
        vid.src = card.video; vid.loop = true; vid.muted = true;
        vid.playsInline = true; vid.preload = 'metadata';
        videoEls.push(vid);
        var vtex = new THREE.VideoTexture(vid);
        vtex.minFilter = THREE.LinearFilter;
        vtex.magFilter = THREE.LinearFilter;
        uniforms[ci].uVideoTexture.value  = vtex;
        uniforms[dup].uVideoTexture.value = vtex;
      } else {
        videoEls.push(null);
      }
    });

    // ── Scroll ────────────────────────────────────────────────────────────
    var wheelDeltaY       = 0;
    var targetWheelDeltaY = 0;
    var wheelDirection    = 1;
    var scrollOffset      = 0;

    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      snapTarget         = null;   // user wheeling cancels snap
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
    // ── List overlay ──────────────────────────────────────────────────────
    var listOverlay = document.createElement('div');
    listOverlay.style.cssText = 'position:absolute;inset:0;z-index:5;overflow-y:auto;padding:72px 40px 56px;box-sizing:border-box;display:none;opacity:0;transition:opacity 0.3s;';

    var lvGrid = document.createElement('div');
    lvGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:1120px;margin:0 auto;';

    LIST_CARDS.forEach(function (card) {
      var cardEl = document.createElement('div');
      cardEl.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;transition:border-color 0.25s,background 0.25s,transform 0.25s;cursor:default;';

      // ── Media ──────────────────────────────────────────────────────────────
      var mediaWrap = document.createElement('div');
      mediaWrap.style.cssText = 'width:100%;aspect-ratio:16/9;overflow:hidden;background:#111;flex-shrink:0;position:relative;';

      if (card.video) {
        var vid = document.createElement('video');
        vid.src = card.src;
        if (card.poster) vid.poster = card.poster;
        vid.autoplay = true; vid.muted = true; vid.loop = true; vid.playsInline = true;
        vid.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        mediaWrap.appendChild(vid);
      } else {
        var img = document.createElement('img');
        img.src = card.src; img.alt = card.label;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        mediaWrap.appendChild(img);
      }
      // eyebrow badge over the video
      var badge = document.createElement('span');
      badge.textContent = card.eyebrow;
      badge.style.cssText = 'position:absolute;top:14px;left:16px;font-family:"JetBrains Mono",monospace;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.12em;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);padding:4px 10px;border-radius:20px;';
      mediaWrap.appendChild(badge);

      // ── Content ────────────────────────────────────────────────────────────
      var info = document.createElement('div');
      info.style.cssText = 'padding:24px 28px 28px;display:flex;flex-direction:column;gap:0;flex:1;';

      // Project name
      var name = document.createElement('h3');
      name.textContent = card.label;
      name.style.cssText = 'font-family:"Montserrat",sans-serif;font-size:22px;font-weight:800;color:#fff;margin:0 0 10px;line-height:1.2;letter-spacing:-0.3px;';

      // Description
      var desc = document.createElement('p');
      desc.textContent = card.desc;
      desc.style.cssText = 'font-family:"Montserrat",sans-serif;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.5);margin:0 0 22px;';

      // Metrics — big numbers as the hero
      var metricsRow = document.createElement('div');
      metricsRow.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:0;padding:18px 0;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:24px;';

      card.metrics.forEach(function (m, idx) {
        var mt = document.createElement('div');
        mt.style.cssText = 'display:flex;flex-direction:column;gap:4px;min-width:0;overflow:hidden;' + (idx > 0 ? 'padding-left:12px;border-left:1px solid rgba(255,255,255,0.08);' : '');
        var mv = document.createElement('span');
        mv.textContent = m.val;
        mv.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:clamp(18px,2.2vw,32px);font-weight:700;color:#E6F28D;line-height:1;letter-spacing:-0.5px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        var ml = document.createElement('span');
        ml.textContent = m.lbl;
        ml.style.cssText = 'font-family:"Montserrat",sans-serif;font-size:10px;font-weight:500;color:rgba(255,255,255,0.38);letter-spacing:0.05em;text-transform:uppercase;margin-top:4px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        mt.appendChild(mv); mt.appendChild(ml);
        metricsRow.appendChild(mt);
      });

      // CTA
      var ctaWrap = document.createElement('div');
      ctaWrap.style.cssText = 'margin-top:auto;';
      if (card.href !== '#') {
        var cta = document.createElement('a');
        cta.href = card.href;
        cta.textContent = 'View Case Study →';
        cta.className = 'proj-cta';
        cta.style.marginTop = '0';
        ctaWrap.appendChild(cta);
      } else {
        var ctaPlaceholder = document.createElement('span');
        ctaPlaceholder.textContent = 'Case study in progress';
        ctaPlaceholder.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:12px;color:rgba(255,255,255,0.22);letter-spacing:0.06em;';
        ctaWrap.appendChild(ctaPlaceholder);
      }

      info.appendChild(name);
      info.appendChild(desc);
      info.appendChild(metricsRow);
      info.appendChild(ctaWrap);
      cardEl.appendChild(mediaWrap);
      cardEl.appendChild(info);

      cardEl.addEventListener('mouseenter', function () {
        cardEl.style.background = 'rgba(255,255,255,0.07)';
        cardEl.style.borderColor = 'rgba(255,255,255,0.2)';
        cardEl.style.transform = 'translateY(-3px)';
      });
      cardEl.addEventListener('mouseleave', function () {
        cardEl.style.background = 'rgba(255,255,255,0.04)';
        cardEl.style.borderColor = 'rgba(255,255,255,0.1)';
        cardEl.style.transform = 'translateY(0)';
      });

      lvGrid.appendChild(cardEl);
    });

    listOverlay.appendChild(lvGrid);
    el.appendChild(listOverlay);

    // ── View toggle (driven by DOM buttons in s2-fw-header) ──────────────
    var frontLabelWrap = document.getElementById('s2FrontLabel');

    el.addEventListener('s2:setView', function (e) {
      if (e.detail.view === 'spiral') {
        listOverlay.style.opacity = '0';
        el.style.height = '100vh';
        setTimeout(function () { listOverlay.style.display = 'none'; }, 300);
        renderer.domElement.style.transition = 'opacity 0.3s';
        renderer.domElement.style.opacity = '1';
        if (frontLabelWrap) frontLabelWrap.style.visibility = '';
        allCards.forEach(function (_, i) {
          setTimeout(function () { hiddenTarget[i] = 0; }, (i % 4) * 50);
        });
        gsap.to(camera.position, { z: 7, duration: 1, ease: 'power2.inOut' });
      } else {
        allCards.forEach(function (_, i) { hiddenTarget[i] = 1; });
        renderer.domElement.style.transition = 'opacity 0.3s';
        renderer.domElement.style.opacity = '0';
        if (frontLabelWrap) frontLabelWrap.style.visibility = 'hidden';
        setTimeout(function () {
          listOverlay.style.display = 'block';
          requestAnimationFrame(function () {
            listOverlay.style.opacity = '1';
            requestAnimationFrame(function () {
              el.style.height = Math.max(window.innerHeight, listOverlay.scrollHeight) + 'px';
            });
          });
        }, 300);
      }
    });

    // ── Initial reveal ────────────────────────────────────────────────────
    setTimeout(function () {
      allCards.forEach(function (_, i) {
        setTimeout(function () { hiddenTarget[i] = 0; }, (i % 4) * 50);
      });
    }, 600);

    // ── Front card tracking + snap-to-card ───────────────────────────────
    var lastFrontCardIdx = -1;
    var snapTarget       = null;   // CARDS index to snap to (0‑5), null = free scroll

    el.addEventListener('s2:goToCard', function (e) {
      snapTarget = e.detail.idx;
    });

    // ── Lerp ──────────────────────────────────────────────────────────────
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ── GSAP ticker ───────────────────────────────────────────────────────
    gsap.ticker.lagSmoothing(0);

    gsap.ticker.add(function (time, deltaTime) {
      // Snap-to-card (overrides free scroll while active)
      if (snapTarget !== null) {
        var base   = snapTarget - centerIndex;
        var desired = base + Math.round((scrollOffset - base) / totalCount) * totalCount;
        var diff    = desired - scrollOffset;
        scrollOffset      += diff * 0.1;
        wheelDeltaY        = 0;
        targetWheelDeltaY  = 0;
        if (Math.abs(diff) < 0.01) { scrollOffset = desired; snapTarget = null; }
      }

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

        // Animate video panel slide per card (~0.5s glide)
        var vrEase = 1 - Math.pow(1 - 0.04, deltaTime * 0.15);
        videoRevealProgress[i] = lerp(videoRevealProgress[i], videoRevealTarget[i], vrEase);
        uniforms[i].uVideoReveal.value    = videoRevealProgress[i];

        uniforms[i].uScrollSpeed.value    = wheelDeltaY;
        uniforms[i].uColorStrength.value  = 0.55 * hoverProgress[i];
        uniforms[i].uZoom.value           = 1 + 0.05 * hoverProgress[i];
        uniforms[i].uRevealProgress.value = (1 - hoverProgress[i] * 0.05) * (1 - hiddenProgress[i]);
      });

      // Frontmost card → slide label up + play video with bottom-wipe
      var fcFront = 0, fcMinB = Infinity;
      allCards.forEach(function (_, i) {
        if (hiddenTarget[i] > 0) return;
        var N = i - scrollOffset;
        N = ((N % totalCount) + totalCount) % totalCount;
        var B = N - centerIndex;
        if (Math.abs(B) < fcMinB) { fcMinB = Math.abs(B); fcFront = i; }
      });
      if (fcMinB < 0.45) {
        var fcIdx = fcFront % CARDS.length;
        if (fcIdx !== lastFrontCardIdx) {
          // Retract video on previous front card
          if (lastFrontCardIdx >= 0) {
            var prevDup = lastFrontCardIdx + CARDS.length;
            videoRevealTarget[lastFrontCardIdx] = 0;
            videoRevealTarget[prevDup]          = 0;
            var prevVid = videoEls[lastFrontCardIdx];
            if (prevVid) { prevVid.pause(); prevVid.currentTime = 0; }
          }

          lastFrontCardIdx = fcIdx;

          // Play video and wipe it in from bottom on new front card
          var fdup = fcIdx + CARDS.length;
          videoRevealTarget[fcIdx] = 1;
          videoRevealTarget[fdup]  = 1;
          var frontVid = videoEls[fcIdx];
          if (frontVid) { frontVid.currentTime = 0; frontVid.play().catch(function () {}); }

          window.dispatchEvent(new CustomEvent('s2:frontCard', { detail: { idx: fcIdx } }));
        }
      }

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
