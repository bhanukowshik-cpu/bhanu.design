/* spiral-gallery/spiral.js — vanilla Three.js r134 + GSAP 3, no build step */
(function () {
  'use strict';

  function init() {
    var el = document.getElementById('spiral-root');
    if (!el) return;
    if (typeof THREE === 'undefined') { console.warn('[spiral] Three.js not loaded'); return; }
    if (typeof gsap  === 'undefined') { console.warn('[spiral] GSAP not loaded');     return; }

    /* Grid on the container — behind the WebGL canvas so card geometry covers it naturally */
    el.style.backgroundColor = '#111111';
    el.style.backgroundImage = [
      'radial-gradient(ellipse 65% 60% at 50% 46%, transparent 0%, transparent 45%, rgba(8,8,8,0.60) 72%, rgba(8,8,8,0.96) 90%)',
      'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)'
    ].join(', ');
    el.style.backgroundSize = '100% 100%, 52px 52px, 52px 52px';

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

    // ── List view card data — single source of truth: matches S2_DATA in index.html
    var LIST_CARDS = [
      {
        eyebrow: '01', label: 'EverTutor AI System', type: 'Product Design',
        src: '/images/blob-dark.png', video: false,
        hero: { val: '2000+', lbl: 'Daily Active Users' },
        desc: "World's first multi-modal 1:1 voice AI tutor — 3 tools as one system enabling a billion minds.",
        metrics: [
          { val: '2000+',     lbl: 'Daily Active Users' },
          { val: '−96%',      lbl: 'Workflow Time'       },
          { val: '$300k ARR', lbl: 'Sole Designer'       }
        ],
        href: 'evertutor-live.html',
      },
      {
        eyebrow: '02', label: 'EverTutor Live', type: '0→1 Product',
        src: '/images/et-live.mp4', video: true, poster: '/images/et-live.png',
        hero: { val: '85%', lbl: 'Session Completion' },
        desc: 'Voice-first AI tutor — students master topics in 30 min vs 60 in a classroom. Taken from prototype to PMF.',
        metrics: [
          { val: '85%',   lbl: 'Session Completion' },
          { val: '2×',    lbl: 'Faster Mastery'     },
          { val: '$5/hr', lbl: 'vs $250 Before'     }
        ],
        href: 'evertutor-live.html',
      },
      {
        eyebrow: '03', label: 'EverTutor Studio', type: 'Design Systems',
        src: '/images/et-studio.mp4', video: true, poster: '/images/et-studio.png',
        hero: { val: '104→4hrs', lbl: 'Per Lesson' },
        desc: 'Lesson creation tool designed overnight. Cut content production from 104 hours down to 4.',
        metrics: [
          { val: '104→4hrs', lbl: 'Per Lesson' },
          { val: '12',       lbl: 'Schools'    },
          { val: '8',        lbl: 'Districts'  }
        ],
        href: 'evertutor-studio.html',
      },
      {
        eyebrow: '04', label: 'EverTutor Analytics', type: 'Data UX',
        src: '/images/et-analytics.mp4', video: true, poster: '/images/et-analytics.png',
        hero: { val: 'Live', lbl: 'In Production' },
        desc: 'Real-time student insights. The dog-ear system — complexity on demand, clean by default.',
        metrics: [
          { val: 'Live',    lbl: 'In Production' },
          { val: 'Dog-ear', lbl: 'System'        },
          { val: '0',       lbl: 'Extra Clicks'  }
        ],
        href: '#',
      },
      {
        eyebrow: '05', label: 'Stressie', type: 'Redesign',
        src: '/images/stressie.mp4', video: true, poster: null,
        hero: { val: '17.4%', lbl: 'Engagement Rate' },
        desc: 'Harvard-incubated workplace stress app. Full redesign — engagement hit 17.4% vs ~2% industry average.',
        metrics: [
          { val: '17.4%',  lbl: 'Engagement Rate' },
          { val: '$600k',  lbl: 'Funding'          },
          { val: 'Amazon', lbl: '& InKind Live'    }
        ],
        href: 'stressie-studio.html',
      },
      {
        eyebrow: '06', label: 'Dearly', type: 'Solo Build',
        src: '/images/dearly.mp4', video: true, poster: '/images/dearly.png',
        hero: { val: '48hrs', lbl: 'Built In' },
        desc: 'Animated handwriting with your real voice and photos — sent as a unique link. Built in 48 hours.',
        metrics: [
          { val: '140',   lbl: 'Letters Written' },
          { val: '35★',   lbl: '5-Star Ratings'  },
          { val: '48hrs', lbl: 'Built In'         }
        ],
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
uniform float uFogOpacity;
uniform float uAuroraStrength;

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

  // Bottom aurora — green glow rising from bottom edge, EverTutor card only
  float auroraFade = pow(1.0 - smoothstep(0.0, 0.5, vUv.y), 1.5);
  color.rgb += vec3(0.15, 0.85, 0.40) * auroraFade * uAuroraStrength;

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
        uFogOpacity:      { value: 1 },
        uAuroraStrength:  { value: 0 },
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
      var dup = ci + CARDS.length;

      if (card.video) {
        // Video cards: put video directly on the card face.
        // Plane is 16:9, videos are 16:9 → cover-fit ratio = 1:1, nothing cut off.
        var vid = document.createElement('video');
        vid.src = card.video; vid.loop = true; vid.muted = true;
        vid.playsInline = true; vid.preload = 'auto';
        videoEls.push(vid);
        var vtex = new THREE.VideoTexture(vid);
        vtex.minFilter = THREE.LinearFilter;
        vtex.magFilter = THREE.LinearFilter;
        uniforms[ci].uTexture.value        = vtex;
        uniforms[ci].uImageSizes.value.set(1920, 1080);
        uniforms[dup].uTexture.value       = vtex;
        uniforms[dup].uImageSizes.value.set(1920, 1080);
        uniforms[ci].uVideoTexture.value   = vtex;
        uniforms[dup].uVideoTexture.value  = vtex;
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
        uniforms[ci].uTexture.value        = blobAnimTex;
        uniforms[ci].uImageSizes.value.set(800, 450);
        uniforms[dup].uTexture.value       = blobAnimTex;
        uniforms[dup].uImageSizes.value.set(800, 450);
      }
    });

    // ── Scroll ────────────────────────────────────────────────────────────
    var wheelDeltaY       = 0;
    var targetWheelDeltaY = 0;
    var wheelDirection    = 1;
    var scrollOffset      = 4;  // positions EverTutor (index 0) at the visually-forward B=2 slot
    var entryTriggered    = false;
    var ENTRY_SPEED       = 0.6;    // initial spin speed on section enter (one full card cycle)
    var SLOW_DRIFT        = 0.0005; // gentle continuous forward drift after entry settles

    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      snapTarget         = null;   // user wheeling cancels snap
      targetWheelDeltaY += e.deltaY * 0.000075;
      targetWheelDeltaY  = Math.max(-1, Math.min(1, targetWheelDeltaY));
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
    listOverlay.style.cssText = 'position:absolute;inset:0;z-index:15;overflow-y:auto;padding:72px 40px 56px;box-sizing:border-box;display:none;opacity:0;transition:opacity 0.3s;';

    var lvGrid = document.createElement('div');
    lvGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:1120px;margin:0 auto;';

    LIST_CARDS.forEach(function (card) {
      var cardEl = document.createElement('div');
      cardEl.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;transition:border-color 0.3s,background 0.3s,transform 0.3s,box-shadow 0.3s;cursor:pointer;';

      // ── Media ─────────────────────────────────────────────────────────────
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

      // Number badge — top left
      var badge = document.createElement('span');
      badge.textContent = card.eyebrow;
      badge.style.cssText = 'position:absolute;top:14px;left:16px;font-family:"JetBrains Mono",monospace;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.12em;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);padding:4px 10px;border-radius:20px;';
      mediaWrap.appendChild(badge);

      // Type badge — top right (FAANG recruiters read this first)
      var typeBadge = document.createElement('span');
      typeBadge.textContent = card.type;
      typeBadge.style.cssText = 'position:absolute;top:14px;right:16px;font-family:"JetBrains Mono",monospace;font-size:10px;font-weight:700;color:#E6F28D;letter-spacing:0.08em;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);padding:4px 10px;border-radius:20px;';
      mediaWrap.appendChild(typeBadge);

      // ── Info ──────────────────────────────────────────────────────────────
      var info = document.createElement('div');
      info.style.cssText = 'padding:20px 22px 22px;display:flex;flex-direction:column;flex:1;';

      // Project name
      var name = document.createElement('h3');
      name.textContent = card.label;
      name.style.cssText = 'font-family:"Montserrat",sans-serif;font-size:20px;font-weight:700;color:#fff;margin:0 0 16px;line-height:1.2;letter-spacing:-0.2px;';

      // ── Hero metric — THE number that stops a recruiter's scroll ──────────
      var heroWrap = document.createElement('div');
      heroWrap.style.cssText = 'margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.07);';

      var heroVal = document.createElement('span');
      heroVal.textContent = card.hero.val;
      heroVal.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:clamp(38px,4.8vw,58px);font-weight:700;color:#E6F28D;line-height:1;letter-spacing:-1.5px;display:block;';

      var heroLbl = document.createElement('span');
      heroLbl.textContent = card.hero.lbl;
      heroLbl.style.cssText = 'font-family:"Montserrat",sans-serif;font-size:10px;font-weight:600;color:rgba(255,255,255,0.38);letter-spacing:0.1em;text-transform:uppercase;margin-top:7px;display:block;';

      heroWrap.appendChild(heroVal);
      heroWrap.appendChild(heroLbl);

      // Description — one to two lines, supports the hero number
      var desc = document.createElement('p');
      desc.textContent = card.desc;
      desc.style.cssText = 'font-family:"Montserrat",sans-serif;font-size:13px;line-height:1.65;color:rgba(255,255,255,0.42);margin:0;';

      // Bottom group — chips + CTA pinned to card bottom
      var bottomGroup = document.createElement('div');
      bottomGroup.style.cssText = 'margin-top:auto;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;gap:16px;';

      // Metrics row — all 3 metrics right above CTA
      var chipsRow = document.createElement('div');
      chipsRow.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;';

      card.metrics.forEach(function (m) {
        var cell = document.createElement('div');
        cell.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 12px;min-width:0;';
        var val = document.createElement('span');
        val.textContent = m.val;
        val.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:15px;font-weight:700;color:#E6F28D;display:block;letter-spacing:-0.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        var lbl = document.createElement('span');
        lbl.textContent = m.lbl;
        lbl.style.cssText = 'font-family:"Montserrat",sans-serif;font-size:9px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.06em;display:block;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        cell.appendChild(val);
        cell.appendChild(lbl);
        chipsRow.appendChild(cell);
      });

      // CTA — clean pill button, no outer wrapper
      var ctaWrap = document.createElement('div');
      if (card.href !== '#') {
        var cta = document.createElement('a');
        cta.href = card.href;
        cta.textContent = 'View Case Study →';
        cta.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:13px;font-weight:600;letter-spacing:0.02em;border-radius:999px;padding:9px 22px;color:#fff;text-decoration:none;display:inline-block;cursor:pointer;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);transition:background 0.2s,border-color 0.2s;';
        cta.addEventListener('mouseenter', function() { cta.style.background = 'rgba(255,255,255,0.13)'; cta.style.borderColor = 'rgba(255,255,255,0.28)'; });
        cta.addEventListener('mouseleave', function() { cta.style.background = 'rgba(255,255,255,0.08)'; cta.style.borderColor = 'rgba(255,255,255,0.15)'; });
        ctaWrap.appendChild(cta);
      } else {
        var ctaPlaceholder = document.createElement('span');
        ctaPlaceholder.textContent = 'Case study in progress';
        ctaPlaceholder.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:0.06em;';
        ctaWrap.appendChild(ctaPlaceholder);
      }

      bottomGroup.appendChild(chipsRow);
      bottomGroup.appendChild(ctaWrap);

      info.appendChild(name);
      info.appendChild(heroWrap);
      info.appendChild(desc);
      info.appendChild(bottomGroup);
      cardEl.appendChild(mediaWrap);
      cardEl.appendChild(info);

      // Hover — lime border glow signals the brand
      cardEl.addEventListener('mouseenter', function () {
        cardEl.style.borderColor = 'rgba(230,242,141,0.3)';
        cardEl.style.background = 'rgba(255,255,255,0.06)';
        cardEl.style.transform = 'translateY(-2px)';
        cardEl.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3),0 0 0 1px rgba(230,242,141,0.08)';
      });
      cardEl.addEventListener('mouseleave', function () {
        cardEl.style.borderColor = 'rgba(255,255,255,0.1)';
        cardEl.style.background = 'rgba(255,255,255,0.04)';
        cardEl.style.transform = 'translateY(0)';
        cardEl.style.boxShadow = 'none';
      });

      lvGrid.appendChild(cardEl);
    });

    listOverlay.appendChild(lvGrid);
    el.appendChild(listOverlay);

    // ── View toggle (driven by DOM buttons in s2-fw-header) ──────────────
    var frontLabelWrap = document.getElementById('s2FrontLabel');

    el.addEventListener('s2:setView', function (e) {
      var cardsZone   = el.parentElement;
      var container   = cardsZone && cardsZone.parentElement;
      var sectionWrap = container && container.parentElement;
      if (e.detail.view === 'spiral') {
        listOverlay.style.opacity = '0';
        el.style.height = '100vh';
        if (cardsZone)   { cardsZone.style.height = ''; cardsZone.style.overflow = ''; }
        if (container)   { container.style.height = ''; container.style.overflow = ''; }
        if (sectionWrap) { sectionWrap.style.height = ''; sectionWrap.style.overflow = ''; }
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
              var h = Math.max(window.innerHeight, listOverlay.scrollHeight);
              el.style.height = h + 'px';
              if (cardsZone)   { cardsZone.style.height = h + 'px'; cardsZone.style.overflow = 'visible'; }
              if (container)   { container.style.height = h + 'px'; container.style.overflow = 'visible'; }
              if (sectionWrap) { sectionWrap.style.height = h + 'px'; sectionWrap.style.overflow = 'visible'; }
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
    var snapTarget       = 0;      // snap EverTutor to the front on load

    el.addEventListener('s2:goToCard', function (e) {
      snapTarget = e.detail.idx;
    });

    // ── Lerp ──────────────────────────────────────────────────────────────
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ── Blob waveform canvas draw ─────────────────────────────────────────
    function drawBlobWave(ctx, t, img) {
      var W = 800, H = 450, cx = W / 2, cy = H / 2;
      var BR  = 108; // blob clip radius
      var NUM = 40;  // bar count
      var GAP = 5;   // px gap between blob edge and bar start

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
        ctx.fillStyle = '#111'; ctx.fill();
      }

      // 4. Outward-only tick bars — start just outside blob edge, point outward
      ctx.lineCap = 'round';
      for (var k = 0; k < NUM; k++) {
        var a    = (k / NUM) * Math.PI * 2 - Math.PI / 2;
        var wave = Math.max(0, Math.min(1,
          Math.sin(a * 2.5 + t * 1.1) * 0.32 +
          Math.sin(a * 5.0 + t * 1.8) * 0.24 +
          Math.sin(a * 11  + t * 2.7) * 0.14 +
          Math.sin(a * 20  + t * 3.6) * 0.07 + 0.33
        ));
        var len  = 10 + wave * 28; // 10–38 px, always visible
        var alph = 0.55 + wave * 0.45;
        var dx = Math.cos(a), dy = Math.sin(a);
        var r1 = BR + GAP;
        var r2 = r1 + len;
        var x1 = cx + dx * r1, y1 = cy + dy * r1;
        var x2 = cx + dx * r2, y2 = cy + dy * r2;

        // Glow pass — soft lime
        ctx.lineWidth   = 4;
        ctx.strokeStyle = 'rgba(140,255,60,' + (alph * 0.28).toFixed(2) + ')';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

        // Crisp core — bright neon lime
        ctx.lineWidth   = 1.5;
        ctx.strokeStyle = 'rgba(185,255,80,' + alph.toFixed(2) + ')';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }

    // ── GSAP ticker ───────────────────────────────────────────────────────
    gsap.ticker.lagSmoothing(0);

    gsap.ticker.add(function (time, deltaTime) {
      // Snap-to-card (overrides free scroll while active)
      // Target the B=2 slot (visually closest to camera) rather than B=0
      if (snapTarget !== null) {
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
      // Once entry animation has fired, floor the speed so the helix
      // never fully stops — it keeps a very slow continuous forward rotation.
      if (entryTriggered && snapTarget === null && targetWheelDeltaY < SLOW_DRIFT) {
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

        // Depth fog: darken cards further from the front slot (B=2)
        var distFromFront = Math.abs(B - 2);
        uniforms[i].uFogOpacity.value = Math.max(0.15, 1.0 - distFromFront * 0.25);

        // Bottom aurora: only on EverTutor cards, fades in as card approaches front
        var isEverTutor = (i % CARDS.length === 0);
        uniforms[i].uAuroraStrength.value = isEverTutor ? Math.max(0, 1.0 - distFromFront) * 0.75 : 0;
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
          window.dispatchEvent(new CustomEvent('s2:frontCard', { detail: { idx: fcIdx } }));
        }
      }

      // Redraw EverTutor blob waveform canvas every frame
      if (blobAnimTex) {
        drawBlobWave(blobAnimCtx, time, blobAnimImg);
        blobAnimTex.needsUpdate = true;
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
        // User has scrolled here — autoplay policy is satisfied; start all videos
        CARDS.forEach(function (card, ci) {
          if (videoEls[ci]) { videoEls[ci].play().catch(function () {}); }
        });
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
