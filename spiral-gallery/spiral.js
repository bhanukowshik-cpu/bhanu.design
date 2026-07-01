/* spiral-gallery/spiral.js — vanilla Three.js r134 + GSAP 3, no build step */
(function () {
  'use strict';

  function init() {
    var el = document.getElementById('spiral-root');
    if (!el) return;
    if (typeof THREE === 'undefined') { console.warn('[spiral] Three.js not loaded'); return; }
    if (typeof gsap  === 'undefined') { console.warn('[spiral] GSAP not loaded');     return; }

    /* Grid on the container — behind the WebGL canvas so card geometry covers it naturally */
    el.style.backgroundColor = '#0D0D0D';
    el.style.backgroundImage = [
      'radial-gradient(ellipse 65% 60% at 50% 46%, transparent 0%, transparent 45%, rgba(13,13,13,0.60) 72%, rgba(13,13,13,0.96) 90%)',
      'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)'
    ].join(', ');
    el.style.backgroundSize = '100% 100%, 52px 52px, 52px 52px';

    // ── Cards ─────────────────────────────────────────────────────────────
    var CARDS = [
      { label: 'EverTutor',    img: '/images/blob.png',              video: null                       },
      { label: 'ET Live',      img: '/images/card-et-live.png',      video: '/images/et-live.mp4'      },
      { label: 'ET Studio',    img: '/images/card-et-studio.png',    video: '/images/et-studio.mp4'    },
      { label: 'ET Analytics', img: '/images/card-et-analytics.png', video: '/images/et-analytics.mp4' },
      { label: 'Stressie',     img: '/images/card-stressie.png',     video: '/images/stressie.mp4', portrait: true },
      { label: 'Dearly',       img: '/images/card-dearly.png',       video: '/images/dearly.mp4'       },
    ];
    // 3 copies instead of 2 — fills more of the frame and pushes the modulo
    // wrap-around point (where a mesh's position resets) much farther from
    // the visible front region, so the reset happens somewhere already faded
    // out rather than in view.
    var LOOP_COPIES = 3;
    var allCards = [];
    for (var lc = 0; lc < LOOP_COPIES; lc++) allCards = allCards.concat(CARDS);

    // ── Grid view card data — sourced entirely from S2_DATA (window.S2_PROJECT_DATA,
    // exposed by the inline script in index.html) so title/desc/metrics/href have a
    // single source of truth shared with the spiral. Media (img/video) still comes
    // from CARDS above — both arrays share the same 6-item order.
    var POSTERS = [null, '/images/et-live.png', '/images/et-studio.png', '/images/et-analytics.png', null, '/images/dearly.png'];
    var S2_SOURCE = window.S2_PROJECT_DATA || [];
    var GRID_CARDS = CARDS.map(function (c, i) {
      var d = S2_SOURCE[i] || {};
      return {
        label:    c.label,
        img:      c.img,
        video:    c.video,
        poster:   POSTERS[i] || null,
        portrait: !!c.portrait,
        title:    d.title   || c.label,
        desc:     d.desc    || '',
        metrics:  d.metrics || [],
        href:     d.href    || '#'
      };
    });

    // ── Vertex shader ─────────────────────────────────────────────────────
    var vert = `
varying vec2 vUv;
varying vec3 vWorldPosition;
#define PI 3.14159265359

uniform float uScrollSpeed;
uniform float uVideoReveal;

void main() {
  vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 newPosition   = position;

  newPosition.z = sin(uv.x * PI) * 0.04;

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
uniform float uFogOpacity;
uniform float uAuroraStrength;
uniform float uTime;
uniform float uIsPortrait;

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

  // ── Video sub-panel: slides DOWN from above the card into place ──────────
  // Landscape videos fill a 92% panel; the portrait (phone) video shows FULLY
  // inside a narrow, tall 9:16 column centred on the card — nothing cropped.
  float portrait = step(0.5, uIsPortrait);
  float panelSY  = 0.92;
  float panelMY  = 0.04;
  float panelSX  = mix(0.92, 0.29, portrait);   // 9:16 phone width inside a 16:9 card
  float panelMX  = (1.0 - panelSX) * 0.5;

  // uVideoReveal=0 → panel fully above the card; =1 → final inset position.
  // Leading edge is the BOTTOM, descending from the top toward centre.
  float panelBot = 1.0 - uVideoReveal * (1.0 - panelMY);
  float panelTop = panelBot + panelSY;

  // Rounded-corner panel mask (anti-aliased rounded rectangle)
  float fe       = 0.004;
  float pr       = mix(0.045, 0.03, portrait);     // corner radius (tighter for the phone)
  vec2  pCenter  = vec2(0.5, (panelBot + panelTop) * 0.5);
  vec2  pHalf    = vec2(panelSX, panelSY) * 0.5;
  vec2  pq       = abs(vUv - pCenter) - pHalf + pr;
  float pSdf     = min(max(pq.x, pq.y), 0.0) + length(max(pq, 0.0)) - pr;
  float inPanel  = (1.0 - smoothstep(-fe, fe, pSdf)) * step(0.001, uVideoReveal);

  // Remap card UV → video texture UV (1:1 since both are 16:9)
  float vidU     = (vUv.x - panelMX) / panelSX;
  float vidV     = (vUv.y - panelBot) / panelSY;
  vec2  vidUV    = clamp(vec2(vidU, vidV), 0.0, 1.0);

  vec4 imgSample = texture2D(uTexture,      zoomedUv);
  vec4 vidSample = texture2D(uVideoTexture, vidUV);
  vec4 blended   = mix(imgSample, vidSample, inPanel);

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

  // Bottom aurora rays — animated vertical columns rising from bottom
  if (uAuroraStrength > 0.0) {
    float auroraY = pow(1.0 - smoothstep(0.0, 0.55, vUv.y), 2.0);
    float t = uTime * 0.35;
    float r1 = sin(vUv.x * 20.0 + t * 1.2) * 0.5 + 0.5;
    float r2 = sin(vUv.x * 13.0 - t * 0.8 + 1.5) * 0.5 + 0.5;
    float r3 = sin(vUv.x *  7.0 + t * 0.5 + 3.0) * 0.5 + 0.5;
    float rays = pow(r1 * r2 * r3, 0.4);
    float shimmer = sin(vUv.y * 18.0 - t * 2.5) * 0.12 + 0.88;
    rays *= shimmer;
    // Deep green base → portfolio lime #E6F28D at ray peaks
    vec3 auroraColor = mix(vec3(0.04, 0.42, 0.18), vec3(0.902, 0.949, 0.553), rays);
    color.rgb += auroraColor * auroraY * uAuroraStrength;
  }

  gl_FragColor = vec4(color.rgb * uFogOpacity, alpha);
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
    // Camera FOV/distance matched to the reference implementation's proven
    // values — 45deg below 900px width, 35deg at desktop widths, z=8.
    var CAMERA_Z = 8;
    function fovForWidth(w) { return w < 900 ? 45 : 35; }
    var camera = new THREE.PerspectiveCamera(fovForWidth(W), W / H, 0.1, 100);
    camera.position.set(0, 0, CAMERA_Z);

    // ── Spiral constants — matched to the reference implementation's proven
    //    values (verticalGap 0.5, angleGap 0.85, baseRadius 2), scaled up
    //    modestly by CARD_SCALE per the earlier size-bump request. ────────
    var CARD_SCALE   = 1.15;
    var VERTICAL_GAP = 0.5 * CARD_SCALE;
    var ANGLE_GAP    = 0.85;
    var BASE_RADIUS  = 2 * CARD_SCALE;
    var totalCount   = allCards.length;
    var centerIndex  = Math.floor(totalCount / 2);
    // B's two wrap edges (where a mesh's position resets as scrollOffset
    // advances) — used below to fade cards out before they reach either edge.
    var B_MIN        = -centerIndex;
    var B_MAX        = totalCount - 1 - centerIndex;
    var EDGE_FADE_MARGIN = 2.5;

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
      var geo = new THREE.PlaneGeometry(16/9 * CARD_SCALE, 1.0 * CARD_SCALE, 8, 8);
      var u = {
        uTexture:        { value: new THREE.Texture() },
        uVideoTexture:   { value: new THREE.Texture() },
        uColorStrength:  { value: 0 },
        uZoom:           { value: 1 },
        uPlaneSizes:     { value: new THREE.Vector2(16/9 * CARD_SCALE, 1.0 * CARD_SCALE) },
        uImageSizes:     { value: new THREE.Vector2(1280, 720) },
        uRevealProgress: { value: 0 },
        uVideoReveal:    { value: 0 },
        uScrollSpeed:    { value: 0 },
        uFogOpacity:      { value: 1 },
        uAuroraStrength:  { value: 0 },
        uTime:            { value: 0 },
        uIsPortrait:      { value: allCards[i].portrait ? 1.0 : 0.0 },
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

    // EverTutor animated canvas (blob-light + waveform, white bg)
    var blobAnimCanvas = null;
    var blobAnimCtx    = null;
    var blobAnimTex    = null;
    var blobAnimImg    = null;

    CARDS.forEach(function (card, ci) {
      // Every copy of this card (one per LOOP_COPIES) shares the same texture.
      var copyIdxs = [];
      for (var lc2 = 0; lc2 < LOOP_COPIES; lc2++) copyIdxs.push(ci + lc2 * CARDS.length);

      if (card.video) {
        // Video cards: STATIC thumbnail on the card face; the video lives in the
        // reveal panel (uVideoTexture) and only slides in / plays when this card
        // is the active (front) one — see the ticker + front-card logic below.
        var vid = document.createElement('video');
        vid.src = card.video; vid.loop = true; vid.muted = true;
        vid.playsInline = true; vid.preload = 'auto';
        videoEls.push(vid);
        var vtex = new THREE.VideoTexture(vid);
        vtex.minFilter = THREE.LinearFilter;
        vtex.magFilter = THREE.LinearFilter;
        copyIdxs.forEach(function (idx) { uniforms[idx].uVideoTexture.value = vtex; });

        // Load the static thumbnail as the card face so every card always shows
        // an image (never a blank/black frame before the video plays).
        loader.load(card.img, function (tex) {
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          var w = (tex.image && (tex.image.naturalWidth  || tex.image.width))  || 1280;
          var h = (tex.image && (tex.image.naturalHeight || tex.image.height)) || 720;
          copyIdxs.forEach(function (idx) {
            uniforms[idx].uTexture.value = tex;
            uniforms[idx].uImageSizes.value.set(w, h);
          });
        });
      } else {
        // EverTutor (no video): animated canvas — white bg + blob-light + waveform
        videoEls.push(null);

        blobAnimCanvas        = document.createElement('canvas');
        blobAnimCanvas.width  = 800;
        blobAnimCanvas.height = 450;
        blobAnimCtx           = blobAnimCanvas.getContext('2d');

        blobAnimImg     = new Image();
        blobAnimImg.src = '/images/blob-dark.png';

        blobAnimTex           = new THREE.CanvasTexture(blobAnimCanvas);
        blobAnimTex.minFilter = THREE.LinearFilter;
        blobAnimTex.magFilter = THREE.LinearFilter;
        copyIdxs.forEach(function (idx) {
          uniforms[idx].uTexture.value = blobAnimTex;
          uniforms[idx].uImageSizes.value.set(800, 450);
        });
      }
    });

    // ── Scroll ────────────────────────────────────────────────────────────
    var wheelDeltaY       = 0;
    var targetWheelDeltaY = 0;
    var wheelDirection    = 1;
    var scrollOffset      = totalCount - (centerIndex + 2);  // positions EverTutor (index 0) at the visually-forward B=2 slot
    var entryTriggered    = false;
    var ENTRY_SPEED       = 0.6;     // initial spin speed on section enter (one full card cycle)
    var SLOW_DRIFT        = 0.00025; // gentle continuous forward drift after entry settles — halved again, still felt too fast

    // Only the center 60% of the section's width drives the helix — the
    // outer 20% on each side lets the wheel event pass through untouched so
    // the page scrolls normally (e.g. on to the next section).
    el.addEventListener('wheel', function (e) {
      var rect       = el.getBoundingClientRect();
      var xRatio     = (e.clientX - rect.left) / rect.width;
      var inHelixZone = xRatio >= 0.2 && xRatio <= 0.8;
      if (!inHelixZone) return;

      e.preventDefault();
      snapTarget         = null;   // user wheeling cancels snap
      targetWheelDeltaY += e.deltaY * 0.00003; // ~60% slower than the original 0.000075 — still too fast at 40%
      targetWheelDeltaY  = Math.max(-1, Math.min(1, targetWheelDeltaY));
      wheelDirection     = e.deltaY > 0 ? 1 : -1;
    }, { passive: false });

    // ── Hover raycaster ───────────────────────────────────────────────────
    var raycaster = new THREE.Raycaster();
    var mouse     = new THREE.Vector2(-9999, -9999);

    var isHovered = false;
    el.addEventListener('mousemove', function (e) {
      var rect   = el.getBoundingClientRect();
      var xRatio = (e.clientX - rect.left) / rect.width;
      isHovered  = xRatio >= 0.2 && xRatio <= 0.8;
      mouse.x =  (xRatio * 2 - 1);
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    });
    el.addEventListener('mouseleave', function () {
      isHovered = false;
      mouse.set(-9999, -9999);
    });

    // ── Nav buttons ───────────────────────────────────────────────────────
    // ── Grid overlay — single row, horizontal scroll, full-bleed media ───
    var listOverlay = document.createElement('div');
    listOverlay.style.cssText = 'position:absolute;inset:0;z-index:15;overflow:hidden;padding:104px 0 0;box-sizing:border-box;display:none;opacity:0;transition:opacity 0.3s;';

    var lvTrack = document.createElement('div');
    lvTrack.className = 's2-grid-track';
    lvTrack.style.cssText = 'display:flex;gap:24px;height:100%;padding:0 40px 32px;box-sizing:border-box;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;cursor:grab;';

    // Hide the native scrollbar + define the swipe-hint animation (can't
    // reach index.html's <style> block from here, so inject a small one).
    var gridStyleTag = document.createElement('style');
    gridStyleTag.textContent =
      '.s2-grid-track::-webkit-scrollbar{display:none}' +
      '@keyframes s2SwipeHint{0%,100%{transform:translateY(-50%) translateX(0);opacity:.9}50%{transform:translateY(-50%) translateX(-10px);opacity:.4}}';
    document.head.appendChild(gridStyleTag);

    // Live blob canvas for grid card 01 (driven in the GSAP ticker)
    var listBlobCanvas = null, listBlobCtx = null;
    var gridCardEls    = [];
    var swipeHintEl    = null;

    GRID_CARDS.forEach(function (card, ci) {
      var cardEl = document.createElement('div');
      cardEl.className = 's2-grid-card';
      cardEl.style.cssText = 'position:relative;flex:0 0 auto;height:100%;display:flex;flex-direction:column;border-radius:20px;overflow:hidden;background:#14161a;cursor:pointer;scroll-snap-align:start;';

      // ── Section 1 (60%) — 16:9 video/canvas shown IN FULL (never cropped),
      // sitting over a softly blurred copy of the same artwork so the letterbox
      // never shows raw black bars.
      var videoRow = document.createElement('div');
      videoRow.style.cssText = 'position:relative;flex:0 0 60%;overflow:hidden;background:#000;';

      var bgFill = document.createElement('img');
      bgFill.src = card.img;
      bgFill.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(28px) brightness(0.55) saturate(120%);transform:scale(1.2);';
      videoRow.appendChild(bgFill);

      var mediaWrap = document.createElement('div');
      mediaWrap.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';

      if (card.video) {
        var vid = document.createElement('video');
        vid.src = card.video;
        if (card.poster) vid.poster = card.poster;
        vid.autoplay = true; vid.muted = true; vid.loop = true; vid.playsInline = true;
        vid.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
        mediaWrap.appendChild(vid);
      } else {
        // EverTutor AI System — live blob waveform, same animation as spiral card
        var lc = document.createElement('canvas');
        lc.width = 800; lc.height = 450;
        lc.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
        mediaWrap.appendChild(lc);
        listBlobCanvas = lc;
        listBlobCtx    = lc.getContext('2d');
      }
      videoRow.appendChild(mediaWrap);
      cardEl.appendChild(videoRow);

      // First card: animated hint pointing the swipe/scroll direction
      if (ci === 0) {
        swipeHintEl = document.createElement('div');
        swipeHintEl.style.cssText = 'position:absolute;top:50%;left:16px;transform:translateY(-50%);width:40px;height:40px;border-radius:999px;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2;animation:s2SwipeHint 1.6s ease-in-out infinite;';
        swipeHintEl.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
        videoRow.appendChild(swipeHintEl);
      }

      // ── Section 2 (remaining 40%) — title, description, metrics, CTA ────
      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-height:0;display:flex;flex-direction:column;padding:20px 22px;gap:8px;';

      var name = document.createElement('h3');
      name.textContent = card.title;
      name.style.cssText = 'font-family:"Montserrat",sans-serif;font-size:18px;font-weight:700;color:#fff;margin:0;line-height:1.25;letter-spacing:-0.2px;';

      var desc = document.createElement('p');
      desc.textContent = card.desc;
      desc.style.cssText = 'font-family:"Montserrat",sans-serif;font-size:12.5px;line-height:1.55;color:rgba(255,255,255,0.58);margin:0;flex:1;min-height:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;';

      var chipsRow = document.createElement('div');
      chipsRow.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;';

      card.metrics.forEach(function (m) {
        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:9px;padding:8px 10px;min-width:0;';
        var val = document.createElement('span');
        val.textContent = m.val;
        val.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:13px;font-weight:700;color:#E6F28D;display:block;letter-spacing:-0.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        var lbl = document.createElement('span');
        lbl.textContent = m.lbl;
        lbl.style.cssText = 'font-family:"Montserrat",sans-serif;font-size:8.5px;font-weight:600;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.05em;display:block;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        cell.appendChild(val);
        cell.appendChild(lbl);
        chipsRow.appendChild(cell);
      });

      info.appendChild(name);
      info.appendChild(desc);
      info.appendChild(chipsRow);

      // CTA — same glass-pill styling as the spiral/grid view toggle. Cards
      // with no case study yet (href '#') simply get no CTA, matching how
      // the spiral treats them — no "in progress" placeholder text.
      if (card.href && card.href !== '#') {
        var ctaPill = document.createElement('div');
        ctaPill.style.cssText = 'align-self:flex-start;margin-top:4px;background:rgba(23,23,23,0.88);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);border-radius:999px;padding:4px;';
        var cta = document.createElement('a');
        cta.href = card.href;
        cta.textContent = 'View Case Study →';
        cta.style.cssText = 'display:block;font-family:"JetBrains Mono",monospace;font-size:12px;font-weight:500;letter-spacing:0.02em;border-radius:999px;padding:8px 16px;color:#fff;text-decoration:none;background:linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 2.45%, rgba(255,255,255,0) 126.14%);box-shadow:1.1px 2.2px 0.5px -1.8px rgba(255,255,255,0.9) inset,-1.0px -2.2px 0.5px -1.8px rgba(255,255,255,0.9) inset;transition:background 0.2s;';
        cta.addEventListener('mouseenter', function() { cta.style.background = 'rgba(255,255,255,0.14)'; });
        cta.addEventListener('mouseleave', function() { cta.style.background = 'linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 2.45%, rgba(255,255,255,0) 126.14%)'; });
        ctaPill.appendChild(cta);
        info.appendChild(ctaPill);
      }

      cardEl.appendChild(info);

      // Click anywhere on the card navigates — suppressed if mid-drag (see below)
      cardEl.addEventListener('click', function () {
        if (card.href && card.href !== '#') window.location.href = card.href;
      });

      lvTrack.appendChild(cardEl);
      gridCardEls.push(cardEl);
    });

    listOverlay.appendChild(lvTrack);
    el.appendChild(listOverlay);

    // Fit exactly ~2.5 cards in the viewport, recomputed on resize.
    function sizeGridCards() {
      var gap = 24, sidePad = 80, visible = 2.5;
      var avail = el.clientWidth - sidePad;
      var cardW = Math.max(220, (avail - gap) / visible);
      gridCardEls.forEach(function (c) { c.style.width = cardW + 'px'; });
    }
    sizeGridCards();
    window.addEventListener('resize', sizeGridCards);

    // Dismiss the first-card swipe hint on first interaction with the track.
    function dismissSwipeHint() {
      if (!swipeHintEl) return;
      swipeHintEl.style.animation = 'none';
      swipeHintEl.style.opacity = '0';
      swipeHintEl.style.transition = 'opacity 0.4s';
    }
    lvTrack.addEventListener('scroll', dismissSwipeHint, { once: true, passive: true });
    lvTrack.addEventListener('pointerdown', dismissSwipeHint, { once: true });

    // Vertical wheel/trackpad input pans the row horizontally — same idea as
    // the spiral's wheel-to-rotation mapping. Passes through to page scroll
    // once the track has hit either end so the section doesn't trap scroll.
    lvTrack.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // native horizontal wheel — let it through
      var atStart = lvTrack.scrollLeft <= 0;
      var atEnd   = lvTrack.scrollLeft >= lvTrack.scrollWidth - lvTrack.clientWidth - 1;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
      e.preventDefault();
      lvTrack.scrollLeft += e.deltaY;
    }, { passive: false });

    // Mouse drag-to-scroll (touch already scrolls natively via overflow-x).
    var gridDrag = null;
    lvTrack.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      gridDrag = { startX: e.clientX, startScroll: lvTrack.scrollLeft, moved: false };
      lvTrack.setPointerCapture(e.pointerId);
      lvTrack.style.cursor = 'grabbing';
    });
    lvTrack.addEventListener('pointermove', function (e) {
      if (!gridDrag) return;
      var dx = e.clientX - gridDrag.startX;
      if (Math.abs(dx) > 4) gridDrag.moved = true;
      lvTrack.scrollLeft = gridDrag.startScroll - dx;
    });
    function endGridDrag() {
      if (!gridDrag) return;
      lvTrack.style.cursor = 'grab';
      if (gridDrag.moved) {
        var suppressClick = function (ev) { ev.stopPropagation(); ev.preventDefault(); };
        lvTrack.addEventListener('click', suppressClick, { capture: true, once: true });
      }
      gridDrag = null;
    }
    lvTrack.addEventListener('pointerup', endGridDrag);
    lvTrack.addEventListener('pointerleave', endGridDrag);

    // Left / right nav buttons (mirrors the spiral's up/down side-nav).
    var gridPrevBtn = document.getElementById('s2GridPrev');
    var gridNextBtn = document.getElementById('s2GridNext');
    function scrollGridByCard(dir) {
      var step = (gridCardEls[0] ? gridCardEls[0].getBoundingClientRect().width : 400) + 24;
      lvTrack.scrollBy({ left: dir * step, behavior: 'smooth' });
    }
    if (gridPrevBtn) gridPrevBtn.addEventListener('click', function () { scrollGridByCard(-1); });
    if (gridNextBtn) gridNextBtn.addEventListener('click', function () { scrollGridByCard(1); });

    // ── View toggle (driven by DOM buttons in s2-fw-header) ──────────────
    var frontLabelWrap = document.getElementById('s2FrontLabel');
    var sideNavWrap     = document.querySelector('.s2-side-nav');

    el.addEventListener('s2:setView', function (e) {
      if (e.detail.view === 'spiral') {
        listOverlay.style.opacity = '0';
        el.style.height = '100vh';
        setTimeout(function () { listOverlay.style.display = 'none'; }, 300);
        renderer.domElement.style.transition = 'opacity 0.3s';
        renderer.domElement.style.opacity = '1';
        if (frontLabelWrap) frontLabelWrap.style.visibility = '';
        if (sideNavWrap) sideNavWrap.style.display = '';
        if (gridPrevBtn) gridPrevBtn.style.display = 'none';
        if (gridNextBtn) gridNextBtn.style.display = 'none';
        allCards.forEach(function (_, i) {
          setTimeout(function () { hiddenTarget[i] = 0; }, (i % 4) * 50);
        });
        gsap.to(camera.position, { z: CAMERA_Z, duration: 1, ease: 'power2.inOut' });
      } else {
        allCards.forEach(function (_, i) { hiddenTarget[i] = 1; });
        renderer.domElement.style.transition = 'opacity 0.3s';
        renderer.domElement.style.opacity = '0';
        if (frontLabelWrap) frontLabelWrap.style.visibility = 'hidden';
        if (sideNavWrap) sideNavWrap.style.display = 'none';
        // Match the cards-zone's actual flexed height (not 100vh) — the
        // section header above it already eats into the viewport, so 100vh
        // here would push each card's bottom-anchored info panel off-screen.
        el.style.height = '100%';
        setTimeout(function () {
          listOverlay.style.display = 'block';
          sizeGridCards();
          if (gridPrevBtn) gridPrevBtn.style.display = 'flex';
          if (gridNextBtn) gridNextBtn.style.display = 'flex';
          requestAnimationFrame(function () { listOverlay.style.opacity = '1'; });
        }, 300);
      }
    });

    // ── Initial reveal ────────────────────────────────────────────────────
    // Gated on the glass loader lifting (same pattern used for the hero
    // entrance) — otherwise this fires on a flat timer from script-parse
    // time, finishes revealing while still hidden behind the loader (which
    // holds the screen ~2.8s+), and the fly-in animation is never actually
    // seen.
    function revealCards() {
      setTimeout(function () {
        allCards.forEach(function (_, i) {
          setTimeout(function () { hiddenTarget[i] = 0; }, (i % 4) * 50);
        });
      }, 600);
    }
    if (document.documentElement.classList.contains('glass-loading')) {
      window.addEventListener('glassloaderhidden', revealCards, { once: true });
    } else {
      revealCards();
    }

    // ── Front card tracking + snap-to-card ───────────────────────────────
    var lastFrontCardIdx = -1;
    var snapTarget       = 0;      // snap EverTutor to the front on load
    var snapRawTarget    = null;   // step-nav: snap to exact scrollOffset value

    el.addEventListener('s2:goToCard', function (e) {
      snapTarget    = e.detail.idx;
      snapRawTarget = null;
    });

    // Step ±1 from the current position — avoids the "long way around" bug
    // that occurs when s2:goToCard picks the nearest looped copy by abs distance.
    el.addEventListener('s2:stepCard', function (e) {
      snapRawTarget = Math.round(scrollOffset) + e.detail.dir;
      snapTarget    = null;
    });

    // ── Lerp ──────────────────────────────────────────────────────────────
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ── Blob waveform canvas draw ─────────────────────────────────────────
    function drawBlobWave(ctx, t, img) {
      var W = 800, H = 450, cx = W / 2, cy = H / 2;
      var NUM = 40;

      var BR = 122; // fixed blob radius

      // 1. Dark background
      ctx.fillStyle = '#060606';
      ctx.fillRect(0, 0, W, H);

      // 2. Ring halo — starts near blob edge, fades outward
      var halo = ctx.createRadialGradient(cx, cy, BR * 0.75, cx, cy, BR * 2.1);
      halo.addColorStop(0,    'rgba(50,210,80,0.55)');
      halo.addColorStop(0.30, 'rgba(40,190,70,0.28)');
      halo.addColorStop(0.65, 'rgba(20,160,50,0.10)');
      halo.addColorStop(1,    'rgba(10,140,40,0.00)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      // 3. Blob
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, BR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, cx - BR, cy - BR, BR * 2, BR * 2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, BR, 0, Math.PI * 2);
        ctx.fillStyle = '#0D0D0D'; ctx.fill();
      }

      // 4. Bidirectional tick bars — expand from midpoint both inward + outward
      var MID_OFFSET = 30; // gap from blob edge to bar centre
      ctx.lineCap = 'round';
      for (var k = 0; k < NUM; k++) {
        var a    = (k / NUM) * Math.PI * 2 - Math.PI / 2;
        var wave = Math.max(0, Math.min(1,
          Math.sin(a * 2.5 + t * 2.8) * 0.32 +
          Math.sin(a * 5.0 + t * 4.2) * 0.24 +
          Math.sin(a * 11  + t * 6.0) * 0.14 +
          Math.sin(a * 20  + t * 8.0) * 0.07 + 0.33
        ));
        var half = 5 + wave * 16;
        var alph = 0.55 + wave * 0.45;
        var dx = Math.cos(a), dy = Math.sin(a);
        var rMid = BR + MID_OFFSET;
        var x1 = cx + dx * (rMid - half), y1 = cy + dy * (rMid - half);
        var x2 = cx + dx * (rMid + half), y2 = cy + dy * (rMid + half);

        // Alternate: even = #4ade80 (green), odd = #86efac (light green)
        var gr = k % 2 === 0 ? '74,222,128' : '134,239,172';

        // Crisp core
        ctx.lineWidth   = 3;
        ctx.strokeStyle = 'rgba(' + gr + ',' + alph.toFixed(2) + ')';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }

    // ── GSAP ticker ───────────────────────────────────────────────────────
    gsap.ticker.lagSmoothing(0);

    gsap.ticker.add(function (time, deltaTime) {
      // Snap-to-card (overrides free scroll while active)
      // Target the B=2 slot (visually closest to camera) rather than B=0
      if (snapRawTarget !== null) {
        var diff = snapRawTarget - scrollOffset;
        scrollOffset      += diff * 0.1;
        wheelDeltaY        = 0;
        targetWheelDeltaY  = 0;
        if (Math.abs(diff) < 0.01) { scrollOffset = snapRawTarget; snapRawTarget = null; }
      } else if (snapTarget !== null) {
        var base    = snapTarget - centerIndex - 2;
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
      targetWheelDeltaY *= 0.9;
      // Once entry animation has fired, floor the speed so the helix never
      // fully stops — it keeps a very slow continuous forward rotation once
      // scroll input has actually decayed to near-zero. Must check magnitude,
      // not the raw signed value: checking targetWheelDeltaY < SLOW_DRIFT
      // directly was also true for any negative (upward-scroll) value,
      // snapping it back to positive every frame and fighting upward scroll
      // input almost immediately — that was the "scrolling up feels harder" bug.
      if (entryTriggered && snapTarget === null && !isHovered && Math.abs(targetWheelDeltaY) < SLOW_DRIFT) {
        targetWheelDeltaY = SLOW_DRIFT;
      }

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

        var flyDir = (hiddenTarget[i] > 0 ? 1.5 : -1.5) * CARD_SCALE;
        var y      = B * VERTICAL_GAP - 0.8 * CARD_SCALE - hiddenProgress[i] * flyDir;
        var radius = BASE_RADIUS * (1 - hiddenProgress[i] / 2);
        var angle  = B * ANGLE_GAP;

        meshes[i].position.set(
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius
        );
        meshes[i].rotation.y = -angle + Math.PI / 2;

        // Video reveals ONLY on the active (front, B≈2) card — every other card
        // keeps showing its static thumbnail.
        videoRevealTarget[i] = (allCards[i].video && Math.abs(B - 2) < 0.5) ? 1 : 0;

        // Animate video panel slide per card (~0.5s glide)
        var vrEase = 1 - Math.pow(1 - 0.04, deltaTime * 0.15);
        videoRevealProgress[i] = lerp(videoRevealProgress[i], videoRevealTarget[i], vrEase);
        uniforms[i].uVideoReveal.value    = videoRevealProgress[i];

        uniforms[i].uScrollSpeed.value    = wheelDeltaY;
        uniforms[i].uColorStrength.value  = 0; // darkening removed

        // Depth fog: darken cards further from the front slot (B=2)
        var distFromFront = Math.abs(B - 2);
        uniforms[i].uFogOpacity.value = Math.max(0.15, 1.0 - distFromFront * 0.25);

        // Edge fade: each mesh's B wraps (modulo) as scrollOffset advances —
        // that wrap is an instant jump from B_MIN to B_MAX (or vice versa).
        // Fade alpha to 0 near EITHER edge (signed distance, not distance-
        // from-front — those aren't the same thing and using distFromFront
        // here would incorrectly fade out cards mid-spiral on one side).
        var edgeFadeLow  = Math.max(0, Math.min(1, (B - B_MIN) / EDGE_FADE_MARGIN));
        var edgeFadeHigh = Math.max(0, Math.min(1, (B_MAX - B) / EDGE_FADE_MARGIN));
        var edgeFade     = edgeFadeLow * edgeFadeHigh;

        uniforms[i].uZoom.value           = 1 + 0.05 * hoverProgress[i];
        uniforms[i].uRevealProgress.value = (1 - hoverProgress[i] * 0.05) * (1 - hiddenProgress[i]) * edgeFade;

        // Bottom aurora: only on EverTutor cards, fades in as card approaches front
        var isEverTutor = (i % CARDS.length === 0);
        uniforms[i].uAuroraStrength.value = isEverTutor ? Math.max(0, 1.0 - distFromFront) * 0.75 : 0;
        uniforms[i].uTime.value = time;
      });

      // Frontmost card = the one closest to the camera, which sits at B=2 on the helix
      var fcFront = 0, fcMinB = Infinity;
      allCards.forEach(function (_, i) {
        if (hiddenTarget[i] > 0) return;
        var N = i - scrollOffset;
        N = ((N % totalCount) + totalCount) % totalCount;
        var B = N - centerIndex;
        if (Math.abs(B - 2) < fcMinB) { fcMinB = Math.abs(B - 2); fcFront = i; }
      });
      if (fcMinB < 0.45) {
        var fcIdx = fcFront % CARDS.length;
        if (fcIdx !== lastFrontCardIdx) {
          lastFrontCardIdx = fcIdx;
          // Play only the active card's video; pause every other one so videos
          // never play in the background on inactive cards.
          videoEls.forEach(function (v, ci) {
            if (!v) return;
            if (ci === fcIdx) { try { v.currentTime = 0; v.play().catch(function () {}); } catch (e) {} }
            else              { try { v.pause(); } catch (e) {} }
          });
          window.dispatchEvent(new CustomEvent('s2:frontCard', { detail: { idx: fcIdx } }));
        }
      }

      // Redraw EverTutor blob waveform canvas every frame
      if (blobAnimTex) {
        drawBlobWave(blobAnimCtx, time, blobAnimImg);
        blobAnimTex.needsUpdate = true;
      }
      // Mirror blob animation to list-view card 01
      if (listBlobCtx) {
        drawBlobWave(listBlobCtx, time, blobAnimImg);
      }

      renderer.render(scene, camera);
    });

    // ── Entry animation: fast spin → slow drift on section enter ─────────
    // Observes the spiral root element. On first intersect, waits until
    // the card-reveal animation (600ms) has started, then kicks off a fast
    // forward spin (ENTRY_SPEED) that naturally decays into SLOW_DRIFT.
    var spiralEntryObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !entryTriggered) {
        entryTriggered = true;
        spiralEntryObs.disconnect();
        // Videos play only on the active card now (handled in the front-card
        // detection above), so we no longer start them all on entry.
        setTimeout(function () {
          snapTarget        = null;
          targetWheelDeltaY = ENTRY_SPEED;
        }, 800);
      }
    }, { threshold: 0.1 });
    spiralEntryObs.observe(el);

    // ── Resize ────────────────────────────────────────────────────────────
    window.addEventListener('resize', function () {
      var w = el.clientWidth;
      var h = el.clientHeight;
      camera.aspect = w / h;
      camera.fov    = fovForWidth(window.innerWidth);
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
