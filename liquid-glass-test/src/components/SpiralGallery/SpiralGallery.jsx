import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import Lenis from '@studio-freight/lenis';
import RadialWaveform from '../RadialWaveform/RadialWaveform';

// ── Layout constants ──────────────────────────────────────────────────────────
const TOTAL_SLOTS  = 10;
const TURNS        = 1;
const RADIUS       = 4.5;   // sphere radius — must match shader below
const HELIX_HEIGHT = 22.0;  // step (22/10=2.2) > CARD_H (2.025) so adjacent cards clear each other cleanly
const ROW_GAP      = 0.3;   // small extra drop between front wrap and back wrap
const CARD_W       = 3.6;
const CARD_H       = 2.025; // 16:9
const BLOB_W       = 1.26;  // blob card — 30% smaller than original 1.8

// ── Shaders ───────────────────────────────────────────────────────────────────
// RADIUS is injected via template literal so shader always matches the JS constant.
const vertexShader = `
uniform vec3  uCenter;
uniform vec3  uRight;
uniform vec3  uUp;
uniform float uFlatness;
varying vec2  vUv;
varying float vFacing;
varying float vFlat;

void main() {
  vec3 worldPos  = uCenter + uRight * position.x + uUp * position.y;
  vec3 onSphere  = ${RADIUS} * normalize(worldPos);
  vec3 finalPos  = mix(onSphere, worldPos, uFlatness);
  vFacing = normalize(onSphere).z;
  vFlat   = uFlatness;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * vec4(finalPos, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uBrightness;
uniform float uBlur;
varying vec2  vUv;
varying float vFacing;
varying float vFlat;
void main() {
  float b = uBlur * 0.018;
  vec4 tex  = texture2D(uTexture, vUv)                    * 0.40;
  tex += texture2D(uTexture, vUv + vec2(-b, -b))          * 0.15;
  tex += texture2D(uTexture, vUv + vec2( b, -b))          * 0.15;
  tex += texture2D(uTexture, vUv + vec2(-b,  b))          * 0.15;
  tex += texture2D(uTexture, vUv + vec2( b,  b))          * 0.15;
  float sphereShade = 0.45 + 0.55 * max(0.0, vFacing);
  float shade = mix(sphereShade, 1.0, vFlat);
  gl_FragColor = vec4(tex.rgb * uBrightness * shade, tex.a * uOpacity);
}
`;

export default function SpiralGallery({ cards }) {
  const mountRef        = useRef(null);
  const blobGlowRef     = useRef(null);
  const blobWaveformRef = useRef(null);
  const blobLeftRef     = useRef(null);
  const blobRightRef    = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    const W  = el.clientWidth  || window.innerWidth;
    const H  = el.clientHeight || window.innerHeight;

    // Renderer — transparent so the glow div behind it shows through the blob's alpha
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Scene & Camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 100);
    camera.position.set(0, 0, 10.5);
    camera.lookAt(0, 0, 0);

    // Solid-color fallback when image 404s; transparent canvas for blob slot
    function makeFallback(hex) {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 36;
      const ctx = cv.getContext('2d');
      if (hex !== 'transparent') {
        ctx.fillStyle = hex;
        ctx.fillRect(0, 0, 64, 36);
      }
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }

    const loader = new THREE.TextureLoader();
    const meshes = [];

    for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
      const cardIndex = slot % cards.length;
      const card      = cards[cardIndex];

      // Slot 0 is the blob — smaller square card; project cards use CARD_W × CARD_H
      const cardW = (slot === 0) ? BLOB_W : CARD_W;
      const cardH = (slot === 0) ? BLOB_W : CARD_H;
      const geo      = new THREE.PlaneGeometry(cardW, cardH, 48, 32);
      const fallback = makeFallback(card.color);
      const tex      = loader.load(card.image, undefined, undefined,
        () => { mat.uniforms.uTexture.value = fallback; }
      );
      tex.colorSpace = THREE.SRGBColorSpace;

      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTexture:    { value: tex },
          uCenter:     { value: new THREE.Vector3() },
          uRight:      { value: new THREE.Vector3() },
          uUp:         { value: new THREE.Vector3(0, 1, 0) },
          uFlatness:   { value: 0 },
          uOpacity:    { value: 1 },
          uBrightness: { value: 1 },
          uBlur:       { value: 0 },
        },
        transparent: true,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false; // vertices placed by shader, not mesh.position
      scene.add(mesh);
      meshes.push({ mesh, mat, cardIndex });
    }

    // ── Progress ──────────────────────────────────────────────────────────────
    // progress=2.5 puts slot 0 (blob card) exactly at front (t=0.25).
    // Clamped to [−6.5, 2.5]: covers 10 positions (blob + 9 project cards), no looping.
    let targetProgress  = 2.5;
    let currentProgress = 2.5;
    let globalYOffset   = -20;  // all cards below viewport until entry
    let entryTriggered  = false;

    // Blob overlay tracking — screen-projected position and radius of slot 0
    let blobSX = 0, blobSY = 0, blobDist = 1, blobScreenRadius = 120;
    let cardsReveal = 0, cardsRevealTarget = 0; // project cards hidden during entry animation
    const tmpV = new THREE.Vector3();

    function updateCards(progress) {
      meshes.forEach(({ mesh, mat, cardIndex }, slot) => {
        const t     = (slot + progress) / TOTAL_SLOTS;
        const angle = t * TURNS * Math.PI * 2;

        const tFrac = ((t % 1) + 1) % 1;
        const posX  = RADIUS * Math.cos(angle);
        const posZ  = RADIUS * Math.sin(angle);

        const angModEarly = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const gapT    = Math.max(0, Math.min(1, (angModEarly - Math.PI * 0.85) / (Math.PI * 0.3)));
        const devFrac = ((tFrac + 0.25) % 1) - 0.5;
        const posY    = -devFrac * HELIX_HEIGHT - gapT * ROW_GAP;

        const angMod = angModEarly;
        let angDiff  = angMod - Math.PI / 2;
        if (angDiff >  Math.PI) angDiff -= Math.PI * 2;
        if (angDiff < -Math.PI) angDiff += Math.PI * 2;
        const dist = Math.abs(angDiff) / Math.PI;

        // Sharp edge fade to hide Y teleport at helix wrap point
        const yEdge    = Math.min(tFrac, 1 - tFrac) * 2;
        const edgeMult = Math.min(1, yEdge * 30);

        // Scale: front card is dominant, background cards smaller
        const scale = Math.max(0.45, 1 - dist * 0.4);

        // Track blob card screen position + screen radius for the HTML overlay
        // (must be after scale is defined)
        if (slot === 0) {
          tmpV.set(posX, posY + globalYOffset, posZ);
          tmpV.project(camera);
          blobSX = (tmpV.x + 1) / 2 * el.clientWidth;
          blobSY = (1 - (tmpV.y + 1) / 2) * el.clientHeight;
          blobDist = dist;
          // Project the right edge to get blob's screen-space radius
          tmpV.set(
            posX + (BLOB_W / 2) * Math.sin(angle) * scale,
            posY + globalYOffset,
            posZ - (BLOB_W / 2) * Math.cos(angle) * scale
          );
          tmpV.project(camera);
          blobScreenRadius = Math.abs((tmpV.x + 1) / 2 * el.clientWidth - blobSX);
        }

        mat.uniforms.uCenter.value.set(posX, posY + globalYOffset, posZ);
        mat.uniforms.uRight.value.set( Math.sin(angle) * scale, 0, -Math.cos(angle) * scale);
        mat.uniforms.uUp.value.set(0, scale, 0);

        mat.uniforms.uFlatness.value   = Math.max(0, 1 - dist / 0.1);
        mat.uniforms.uBlur.value       = Math.min(1, dist * 2.5);
        const baseVis = Math.max(0.2, 1 - dist * 0.7) * edgeMult;
        mat.uniforms.uOpacity.value    = baseVis * (slot === 0 ? 1 : cardsReveal);
        mat.uniforms.uBrightness.value = baseVis * (slot === 0 ? 1 : cardsReveal);
        mesh.renderOrder = 1 - dist;
      });
    }

    // ── Auto-advance ─────────────────────────────────────────────────────────
    let autoTimer = null;
    function resetAutoAdvance() {
      if (autoTimer) clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        const newP = targetProgress - 1;
        if (newP >= -6.5) {
          targetProgress = newP;
          resetAutoAdvance(); // keep advancing until last card
        }
        // at -6.5 (slot 9 at front) → stop; not infinite
      }, 8000);
    }
    // auto-advance starts after entry animation settles (see IntersectionObserver)

    // ── Entry animation — triggered when section scrolls into view ────────────
    const entryObj = { y: -20 };
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !entryTriggered) {
        entryTriggered = true;
        observer.disconnect();
        gsap.to(entryObj, {
          y: -0.6,
          duration: 2.8,
          delay: 1.2,
          ease: 'power3.out',
          onUpdate: () => { globalYOffset = entryObj.y; },
        });
        // Reveal project cards and begin auto-advance once entry animation settles
        setTimeout(() => {
          cardsRevealTarget = 1;
          resetAutoAdvance();
        }, 4500);
      }
    }, { threshold: 0.1 });
    observer.observe(el);

    // ── Scroll ────────────────────────────────────────────────────────────────
    const lenis = new Lenis({ smoothWheel: true, wheelMultiplier: 0 });

    function onWheel(e) {
      e.preventDefault();
      targetProgress -= e.deltaY * 0.015;
      // Clamp: progress=2.5 → blob at front; progress=-6.5 → slot 9 at front
      targetProgress = Math.max(-6.5, Math.min(2.5, targetProgress));
      resetAutoAdvance();
    }
    el.addEventListener('wheel', onWheel, { passive: false });

    // ── GSAP ticker ───────────────────────────────────────────────────────────
    const tickerFn = (time) => {
      lenis.raf(time * 1000);
      currentProgress += (targetProgress - currentProgress) * 0.07;
      // Fade in project cards after entry animation settles (cardsRevealTarget set via setTimeout)
      cardsReveal += (cardsRevealTarget - cardsReveal) * 0.04;
      updateCards(currentProgress);
      renderer.render(scene, camera);

      // Move glow (behind canvas) and waveform (in front) to follow blob card
      const opacity = Math.max(0, 1 - blobDist / 0.35).toFixed(3);
      const glow = blobGlowRef.current;
      if (glow) { glow.style.left = blobSX.toFixed(1) + 'px'; glow.style.top = blobSY.toFixed(1) + 'px'; glow.style.opacity = opacity; }
      // Scale waveform so the ring (RADIUS=120 in canvas) sits just outside the blob edge
      const waveScale = Math.max(1, (blobScreenRadius + 28) / 120);
      const wave = blobWaveformRef.current;
      if (wave) {
        wave.style.left = blobSX.toFixed(1) + 'px';
        wave.style.top  = blobSY.toFixed(1) + 'px';
        wave.style.transform = `translate(-50%, -50%) scale(${waveScale.toFixed(3)})`;
        wave.style.opacity = opacity;
      }
      // Position content panels outside the waveform ring on each side
      const waveEdge = 120 * waveScale;
      const leftPanel = blobLeftRef.current;
      if (leftPanel) {
        const w = Math.max(0, blobSX - waveEdge - 24);
        leftPanel.style.width   = w.toFixed(0) + 'px';
        leftPanel.style.top     = blobSY.toFixed(1) + 'px';
        leftPanel.style.opacity = opacity;
      }
      const rightPanel = blobRightRef.current;
      if (rightPanel) {
        const l = blobSX + waveEdge + 24;
        const w = Math.max(0, el.clientWidth - l);
        rightPanel.style.left   = l.toFixed(0) + 'px';
        rightPanel.style.width  = w.toFixed(0) + 'px';
        rightPanel.style.top    = blobSY.toFixed(1) + 'px';
        rightPanel.style.opacity = opacity;
      }
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    updateCards(currentProgress);

    function onResize() {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      el.removeEventListener('wheel', onWheel);
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
      if (autoTimer) clearTimeout(autoTimer);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{
      width: '100%', height: '100vh',
      background: '#1E1E1E',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Dot grid — z0 */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Blob glow — z2, BEHIND the transparent Three.js canvas so it glows through the blob's alpha */}
      <div
        ref={blobGlowRef}
        style={{
          position: 'absolute', zIndex: 2, pointerEvents: 'none',
          left: 0, top: 0,
          transform: 'translate(-50%, -50%)',
          width: '340px', height: '340px',
        }}
      >
        <div style={{
          position: 'absolute', width: '160px', height: '160px',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'rgba(5,5,5,0.88)', filter: 'blur(24px)',
        }} />
        <div style={{
          position: 'absolute', width: '260px', height: '260px',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(163,230,53,0.60) 0%, rgba(163,230,53,0.28) 40%, transparent 70%)',
          filter: 'blur(28px)',
        }} />
      </div>

      {/* WebGL canvas — z3, transparent bg so glow shows through blob alpha */}
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 3 }} />

      {/* Blob waveform ring — z5, in front of canvas, centered on blob */}
      <div
        ref={blobWaveformRef}
        style={{
          position: 'absolute', zIndex: 5, pointerEvents: 'none',
          left: 0, top: 0,
          transform: 'translate(-50%, -50%)',
          width: '340px', height: '340px',
        }}
      >
        <RadialWaveform />
      </div>

      {/* Blob left content — EverTutor AI System metrics */}
      <div
        ref={blobLeftRef}
        style={{
          position: 'absolute', zIndex: 4, pointerEvents: 'none',
          left: 0, top: 0,
          transform: 'translateY(-50%)',
          width: 0, opacity: 0,
          padding: '0 20px 0 24px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        }}
      >
        {/* Title — 40px Montserrat, #F5F5F7 (matches ws-et-title) */}
        <div style={{ color: '#F5F5F7', fontFamily: "'Montserrat', sans-serif", fontSize: '40px', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: '28px' }}>
          EverTutor AI System
        </div>
        {/* Metrics row with vertical divider — matches ws-et-metric-row */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ color: '#E5F28D', fontFamily: "'JetBrains Mono', monospace", fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>2,000+</div>
            <div style={{ color: 'rgba(255,252,248,0.60)', fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 500, letterSpacing: '0.02em' }}>Daily Active Users</div>
          </div>
          <div style={{ width: '1px', height: '44px', background: 'rgba(255,252,248,0.15)', margin: '0 24px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ color: '#E5F28D', fontFamily: "'JetBrains Mono', monospace", fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>-96%</div>
            <div style={{ color: 'rgba(255,252,248,0.60)', fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 500, letterSpacing: '0.02em' }}>Workflow time</div>
          </div>
        </div>
        {/* ARR metric */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ color: '#E5F28D', fontFamily: "'JetBrains Mono', monospace", fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>0→$300k ARR</div>
          <div style={{ color: 'rgba(255,252,248,0.60)', fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 500, letterSpacing: '0.02em' }}>as Sole Product Designer</div>
        </div>
      </div>

      {/* Blob right content — role tags + description */}
      <div
        ref={blobRightRef}
        style={{
          position: 'absolute', zIndex: 4, pointerEvents: 'none',
          left: 0, top: 0,
          transform: 'translateY(-50%)',
          width: 0, opacity: 0,
          padding: '0 24px 0 20px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Tags — JetBrains Mono 15px, border-radius 6px — matches ws-role-tag */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 500, color: 'rgba(255,252,248,0.80)', background: 'rgba(255,252,248,0.08)', border: '1px solid rgba(255,252,248,0.18)', borderRadius: '6px', padding: '7px 14px', letterSpacing: '0.03em', width: 'fit-content', whiteSpace: 'nowrap' }}>
            <img src="Parallax cards/EverTutor Glimpse/Portfolio icons SVG/Profile dark theme.svg" width="16" height="14" alt="" aria-hidden="true" />
            Sole Product Designer
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 500, color: 'rgba(255,252,248,0.80)', background: 'rgba(255,252,248,0.08)', border: '1px solid rgba(255,252,248,0.18)', borderRadius: '6px', padding: '7px 14px', letterSpacing: '0.03em', width: 'fit-content', whiteSpace: 'nowrap' }}>
              <img src="Parallax cards/EverTutor Glimpse/Portfolio icons SVG/Thunder Dark Theme.svg" width="10" height="16" alt="" aria-hidden="true" />
              0 to 1
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontFamily: "'JetBrains Mono', monospace", fontSize: '15px', fontWeight: 500, color: 'rgba(255,252,248,0.80)', background: 'rgba(255,252,248,0.08)', border: '1px solid rgba(255,252,248,0.18)', borderRadius: '6px', padding: '7px 14px', letterSpacing: '0.03em', width: 'fit-content', whiteSpace: 'nowrap' }}>
              <img src="Parallax cards/EverTutor Glimpse/Portfolio icons SVG/Desktop Icon.svg" width="16" height="13" alt="" aria-hidden="true" />
              Desktop · B2B · B2C
            </span>
          </div>
        </div>
        {/* Description — 18px, #FFFCF8, em italic bold — matches ws-et-desc */}
        <p style={{ color: '#FFFCF8', fontSize: '18px', lineHeight: 1.7, margin: 0 }}>
          World's 1st multi modal 1:1 voice first AI tutor powered by{' '}
          <em style={{ fontStyle: 'italic', fontWeight: 700 }}>3 tools working as one system</em>
          {' '}to enable billion tutors for billion minds.
        </p>
      </div>
    </div>
  );
}
