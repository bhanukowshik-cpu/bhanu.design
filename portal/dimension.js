/* ═══════════════════════════════════════════════════════════════════════════
   DIMENSION — a scroll-driven crossing through a refractive boundary.

   One persistent WebGL world. Not scene-A → fade → scene-B: the camera flies
   a single corridor, and an optical event (screen-space refraction) peaks at
   the moment of maximum velocity, so you cannot tell whether the camera moved
   or the image bent. That ambiguity is the whole trick.

   Render chain
     instanced architecture ─┐
     anchor billboard      ──┴─► RT_scene ─► bright-pass ─► blur H ─► blur V
                                    └────────────► composite ◄──────────┘
     composite = radial refraction + chromatic dispersion + radial smear
                 + bloom + spectral rim + tonemap + vignette + grain

   Public API
     var d = Dimension.create(canvas, { quality: 'high' | 'low' });
     d.draw(progress, scrollVelocity);   // both 0..1
     d.resize(); d.dispose();

   Everything is a pure function of `progress`, so scrubbing backwards rewinds
   exactly. No internal animation state except wall-clock time (turbulence,
   emissive pulse) which is intentionally scrub-independent.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── tiny mat4 ─────────────────────────────────────────────────────────── */
  function m4() { return new Float32Array(16); }

  function perspective(o, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    o[0] = f / aspect; o[1] = 0; o[2] = 0; o[3] = 0;
    o[4] = 0; o[5] = f; o[6] = 0; o[7] = 0;
    o[8] = 0; o[9] = 0; o[10] = (far + near) * nf; o[11] = -1;
    o[12] = 0; o[13] = 0; o[14] = 2 * far * near * nf; o[15] = 0;
    return o;
  }

  function lookAt(o, ex, ey, ez, cx, cy, cz, ux, uy, uz) {
    var zx = ex - cx, zy = ey - cy, zz = ez - cz;
    var l = Math.sqrt(zx * zx + zy * zy + zz * zz) || 1;
    zx /= l; zy /= l; zz /= l;
    var xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx;
    l = Math.sqrt(xx * xx + xy * xy + xz * xz) || 1;
    xx /= l; xy /= l; xz /= l;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0;
    o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0;
    o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
    o[12] = -(xx * ex + xy * ey + xz * ez);
    o[13] = -(yx * ex + yy * ey + yz * ez);
    o[14] = -(zx * ex + zy * ey + zz * ez);
    o[15] = 1;
    return o;
  }

  function mul(o, a, b) {
    for (var c = 0; c < 4; c++) {
      var b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      o[c * 4]     = a[0] * b0 + a[4] * b1 + a[8]  * b2 + a[12] * b3;
      o[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9]  * b2 + a[13] * b3;
      o[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      o[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return o;
  }

  /* ── helpers ───────────────────────────────────────────────────────────── */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function mix(a, b, t) { return a + (b - a) * t; }
  function smoothstep(e0, e1, x) {
    var t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  }
  /* deterministic PRNG — the composition must be identical on every load,
     otherwise "authored" degrades into "random primitives floating" */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── FLIGHT PATH ───────────────────────────────────────────────────────────
     The camera's speed is authored as a curve; its *position* is the integral
     of that curve. Distortion is then driven by the same speed function, so
     peak refraction lands exactly on peak velocity by construction rather
     than by hand-matched keyframes that drift apart when timings change.     */
  var TRAVEL = 300;

  function speedAt(p) {
    var base  = 0.05;                                              // never fully still
    var drift = 0.34 * smoothstep(0.10, 0.50, p) *
                (1 - smoothstep(0.74, 0.92, p));                   // the pull
    var burst = 3.20 * Math.exp(-Math.pow((p - 0.665) / 0.072, 2)); // the crossing
    return base + drift + burst;
  }

  function buildFlight() {
    var N = 512, cum = new Float32Array(N + 1), spd = new Float32Array(N + 1), s = 0, i;
    for (i = 0; i <= N; i++) {
      var p = i / N;
      spd[i] = speedAt(p);
      if (i > 0) s += (spd[i] + spd[i - 1]) * 0.5 / N;
      cum[i] = s;
    }
    for (i = 0; i <= N; i++) cum[i] /= s;                          // normalise to 0..1
    var peak = 0;
    for (i = 0; i <= N; i++) if (spd[i] > peak) peak = spd[i];
    return {
      N: N,
      /* distance travelled, 0..1 */
      at: function (p) {
        var f = clamp01(p) * N, i0 = Math.floor(f), i1 = Math.min(i0 + 1, N);
        return mix(cum[i0], cum[i1], f - i0);
      },
      /* normalised instantaneous speed, 0..1 */
      vel: function (p) { return speedAt(clamp01(p)) / peak; },
      z: function (p) { return -TRAVEL * this.at(p); }
    };
  }

  /* ── CAMERA ────────────────────────────────────────────────────────────────
     Position, aim, roll and FOV all move. The FOV swing is what sells "space
     stretches" — a pure dolly at fixed FOV reads as a video, not as physics. */
  function cameraAt(flight, p) {
    var z = flight.z(p);
    /* lateral drift settles to dead-centre by arrival, so the new world reads
       square-on rather than skewed */
    var settle = 1 - smoothstep(0.66, 0.88, p);
    var x =  1.35 * Math.sin(p * 2.15 + 0.4) * settle;
    var y =  0.85 * Math.cos(p * 1.65 + 1.1) * settle + 0.5 * smoothstep(0.3, 0.7, p);

    /* aim slightly off the corridor axis, converging as we arrive */
    var tx = x * 0.35 * settle + 0.8 * Math.sin(p * 1.3) * settle;
    var ty = y * 0.30 * settle;

    /* roll — barely there, then a quick twist through the boundary */
    var roll = 0.035 * Math.sin(p * 2.7) +
               0.16 * Math.sin((p - 0.5) * 6.0) * Math.exp(-Math.pow((p - 0.67) / 0.10, 2));

    var fov = mix(40, 50, smoothstep(0.18, 0.52, p));
    fov = mix(fov, 88, smoothstep(0.52, 0.675, p));                // space opens
    fov = mix(fov, 47, smoothstep(0.685, 0.80, p));                // snaps shut
    fov = mix(fov, 43, smoothstep(0.82, 1.0, p));

    return { x: x, y: y, z: z, tx: tx, ty: ty, roll: roll, fov: fov * Math.PI / 180 };
  }

  /* ── GEOMETRY ──────────────────────────────────────────────────────────────
     One unit box, drawn ~900 times. Instance attributes carry position, scale,
     euler rotation, tint and emission — so beams, ribs, rails, slabs, debris
     and emissive chips are all the same draw call.

     Composition rules (this is what keeps it out of "tutorial demo" territory):
       · everything shares one vanishing point — the rails enforce it
       · rib sizes follow an authored rhythm, not rand()
       · whole Z-bands are left empty; negative space is the luxury
       · under 5% of instances emit
       · a handful of pieces are placed *analytically* at the camera's own
         position during the acceleration window, so they whip past on cue   */
  var STRIDE = 16;   // 4 × vec4

  function buildInstances(flight, dense) {
    var arr = [], r = rng(20260725);

    function push(px, py, pz, sx, sy, sz, rx, ry, rz, tr, tg, tb, em, warm) {
      arr.push(px, py, pz, r(),
               sx, sy, sz, em,
               rx, ry, rz, 0,
               tr, tg, tb, warm);
    }

    var COLD = [0.42, 0.62, 0.95];
    var PALE = [0.55, 0.60, 0.70];
    var far = -(TRAVEL + 90);

    /* 1 — RAILS. Long segmented filaments running the corridor's full length.
       These do the perspective work: six converging lines the eye can lock to. */
    var railXY = [[-11.2, -6.4], [11.2, -6.4], [-11.2, 6.4], [11.2, 6.4],
                  [-6.1, 8.6], [6.1, -8.6]];
    for (var ri = 0; ri < railXY.length; ri++) {
      var z = 26;
      while (z > far) {
        var len = 9 + r() * 22;
        push(railXY[ri][0] + (r() - 0.5) * 0.5, railXY[ri][1] + (r() - 0.5) * 0.5, z - len * 0.5,
             0.055 + r() * 0.05, 0.055 + r() * 0.05, len * 0.5,
             0, 0, (r() - 0.5) * 0.05,
             PALE[0], PALE[1], PALE[2], 0, 0);
        z -= len + (2 + r() * 16);                                 // irregular gaps
      }
    }

    /* 2 — RIBS. Rectangular portal frames marching into depth. The size
       pattern is authored so the corridor breathes wide/narrow instead of
       reading as uniform repetition. */
    var pattern = [26, 10, 10, 18, 10, 34, 12, 10, 22, 10, 30, 14];
    var idx = 0;
    for (var rz = 14; rz > far; rz -= 9.5) {
      var w = pattern[idx % pattern.length] * (dense ? 1 : 1.05);
      idx++;
      if (idx % 7 === 3) continue;                                 // deliberate gaps
      var h = w * (0.52 + (idx % 3) * 0.07);
      var th = 0.10 + r() * 0.16;
      var ro = (r() - 0.5) * 0.10;                                 // slight roll
      var ox = (r() - 0.5) * 2.2, oy = (r() - 0.5) * 1.6;
      var lit = (idx % 5 === 0) ? 0.06 : 0;
      /* top / bottom / left / right */
      push(ox, oy + h * 0.5, rz, w * 0.5, th, th, 0, 0, ro, PALE[0], PALE[1], PALE[2], lit, 0);
      push(ox, oy - h * 0.5, rz, w * 0.5, th, th, 0, 0, ro, PALE[0], PALE[1], PALE[2], lit, 0);
      push(ox - w * 0.5, oy, rz, th, h * 0.5, th, 0, 0, ro, PALE[0], PALE[1], PALE[2], 0, 0);
      push(ox + w * 0.5, oy, rz, th, h * 0.5, th, 0, 0, ro, PALE[0], PALE[1], PALE[2], 0, 0);
    }

    /* 3 — WALLS. The corridor is bounded by four dense fields of small
       rectangular fragments. This is what makes it read as *architecture*
       rather than debris in space: the eye finds four surfaces converging on
       one point, so the depth is unambiguous even before anything moves.
       Fragments are elongated along one axis and never cubes — cubes read as
       primitives, beams read as structure. */
    var WALLS = [
      [0, -1, 11.6, 7.4], [0, 1, 11.6, 7.4],      // floor / ceiling
      [-1, 0, 11.6, 7.4], [1, 0, 11.6, 7.4]       // left / right
    ];
    var nWall = dense ? 150 : 56;                  // per wall
    for (var wi = 0; wi < WALLS.length; wi++) {
      var W = WALLS[wi], vert = W[0] === 0;
      for (var wj = 0; wj < nWall; wj++) {
        var u = (r() - 0.5) * 2;                                    // across the wall
        var t = r();
        /* near-uniform in Z: perspective already compresses distant fragments
           into density, so biasing the distribution deep leaves a hole in the
           mid-field — the band the eye actually reads as "the corridor" */
        var wz = -6 - Math.pow(t, 1.15) * (TRAVEL + 70);
        var depth = (r() - 0.5) * 3.4;                              // relief off the wall plane
        var px = vert ? u * W[2] : W[0] * W[2] + depth;
        var py = vert ? W[1] * W[3] + depth : u * W[3];
        /* long in Z (rails/ledges) or long across the wall (ribs/struts) */
        var along = r() < 0.55;
        var a1 = 0.06 + r() * 0.14, a2 = 0.06 + r() * 0.12;
        var lz = along ? (0.5 + r() * 3.4) : (0.10 + r() * 0.30);
        var lu = along ? a1 : (0.4 + r() * 2.6);
        push(px, py, wz,
             vert ? lu : a1, vert ? a1 : lu, lz,
             0, 0, (r() - 0.5) * 0.14,
             PALE[0], PALE[1], PALE[2], 0, 0);
        /* every so often a fragment steps out into the corridor, breaking the
           plane so the walls never read as flat wallpaper */
        if (r() < 0.14) {
          push(px * (0.62 + r() * 0.2), py * (0.62 + r() * 0.2), wz + (r() - 0.5) * 4,
               0.07 + r() * 0.16, 0.07 + r() * 0.16, 0.4 + r() * 2.2,
               (r() - 0.5) * 0.3, (r() - 0.5) * 0.5, (r() - 0.5) * 0.3,
               PALE[0], PALE[1], PALE[2], 0, 0);
        }
      }
    }

    /* 4 — DEEP FIELD. A thin scatter well beyond the walls, only readable once
       the fog lifts — it is the evidence that the world continues past what
       you were able to perceive at the start. */
    var nDeb = dense ? 130 : 50;
    for (var d = 0; d < nDeb; d++) {
      var dt = r();
      var dz = -40 - dt * (TRAVEL + 120);
      var da = r() * Math.PI * 2;
      var dr = 15 + r() * 26;
      push(Math.cos(da) * dr, Math.sin(da) * dr * 0.72, dz,
           0.10 + r() * 0.30, 0.10 + r() * 0.30, 0.7 + r() * 5.0,
           (r() - 0.5) * 0.4, (r() - 0.5) * 0.9, (r() - 0.5) * 0.4,
           PALE[0], PALE[1], PALE[2], 0, 0);
    }

    /* 5 — CHIPS. The only emissive elements. Cold by default; a third are
       flagged warm and stay dark until the boundary is crossed. */
    var nChip = dense ? 210 : 80;
    for (var c = 0; c < nChip; c++) {
      var ct = r();
      var cz = -8 - ct * ct * (TRAVEL + 70);
      var wm = r() < 0.34 ? 1 : 0;
      /* most sit on the corridor walls, so the emission reads as lights set
         into the structure rather than fireflies drifting in the void */
      var onWall = r() < 0.78, cx, cy;
      if (onWall) {
        var wq = Math.floor(r() * 4);
        var uu = (r() - 0.5) * 2;
        cx = (wq < 2) ? uu * 11.4 : (wq === 2 ? -11.4 : 11.4) + (r() - 0.5) * 2.4;
        cy = (wq < 2) ? (wq === 0 ? -7.2 : 7.2) + (r() - 0.5) * 2.4 : uu * 7.2;
      } else {
        var ca = r() * Math.PI * 2, cr = 2.2 + r() * 11;
        cx = Math.cos(ca) * cr; cy = Math.sin(ca) * cr * 0.8;
      }
      push(cx, cy, cz,
           0.05 + r() * 0.13, 0.05 + r() * 0.12, 0.05 + r() * 0.26,
           0, 0, (r() - 0.5) * 0.6,
           COLD[0], COLD[1], COLD[2], 0.9 + r() * 1.5, wm);
    }

    /* 6 — PASSERS. Placed at the camera's own position during 0.50→0.73 so
       they are guaranteed to rush the lens exactly through the acceleration.
       Far geometry reads as camera movement; only near geometry reads as SPEED. */
    for (var k = 0; k < 15; k++) {
      var pp = 0.50 + (k / 14) * 0.23;
      var pz = flight.z(pp) - (3 + r() * 7);
      var side = (k % 2) ? 1 : -1;
      var off = (2.4 + r() * 3.4) * side;
      var vert = (r() - 0.5) * 5.5;
      push(off, vert, pz,
           0.13 + r() * 0.22, 1.6 + r() * 3.6, 0.13 + r() * 0.5,
           0, 0, (r() - 0.5) * 0.4,
           PALE[0], PALE[1], PALE[2], (k % 4 === 0) ? 0.35 : 0, 0);
    }

    return { data: new Float32Array(arr), count: arr.length / STRIDE };
  }

  /* unit box — 24 verts so each face gets a clean normal */
  function boxGeo() {
    var p = [], n = [], i = [], f = [
      [[1, 0, 0], [0, 0, 1], [0, 1, 0]], [[-1, 0, 0], [0, 0, -1], [0, 1, 0]],
      [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
      [[0, 0, 1], [-1, 0, 0], [0, 1, 0]], [[0, 0, -1], [1, 0, 0], [0, 1, 0]]
    ];
    for (var k = 0; k < 6; k++) {
      var nr = f[k][0], u = f[k][1], v = f[k][2], b = k * 4;
      for (var c = 0; c < 4; c++) {
        var su = (c === 0 || c === 3) ? -1 : 1, sv = (c < 2) ? -1 : 1;
        p.push(nr[0] + u[0] * su + v[0] * sv, nr[1] + u[1] * su + v[1] * sv, nr[2] + u[2] * su + v[2] * sv);
        n.push(nr[0], nr[1], nr[2]);
      }
      i.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    for (var q = 0; q < p.length; q++) p[q] *= 0.5;
    return { pos: new Float32Array(p), norm: new Float32Array(n), idx: new Uint16Array(i) };
  }

  /* ── SHADERS ───────────────────────────────────────────────────────────── */

  var SCENE_VS = [
    'attribute vec3 aPos; attribute vec3 aNorm;',
    'attribute vec4 iPos; attribute vec4 iScale; attribute vec4 iRot; attribute vec4 iTint;',
    'uniform mat4 uVP; uniform vec3 uEye; uniform float uTime;',
    'varying vec3 vN, vW; varying float vEmis, vDist, vWarm, vSeed; varying vec3 vTint;',
    'void main(){',
    ' vec3 e = iRot.xyz;',
    ' float sx=sin(e.x),cx=cos(e.x),sy=sin(e.y),cy=cos(e.y),sz=sin(e.z),cz=cos(e.z);',
    ' mat3 R = mat3(cz,sz,0.,-sz,cz,0.,0.,0.,1.)',
    '          * mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy)',
    '          * mat3(1.,0.,0.,0.,cx,sx,0.,-sx,cx);',
    ' vec3 w = R * (aPos * iScale.xyz) + iPos.xyz;',
    /* a hair of drift so the lattice is never dead — far too small to read as motion */
    ' w.y += sin(uTime*0.32 + iPos.w*6.283)*0.035;',
    ' vW = w; vN = R * aNorm;',
    ' vEmis = iScale.w; vWarm = iTint.w; vSeed = iPos.w; vTint = iTint.xyz;',
    ' vDist = length(w - uEye);',
    ' gl_Position = uVP * vec4(w,1.0);',
    '}'
  ].join('\n');

  var SCENE_FS = [
    'precision highp float;',
    'varying vec3 vN, vW; varying float vEmis, vDist, vWarm, vSeed; varying vec3 vTint;',
    'uniform vec3 uEye, uFogCol; uniform float uFog, uReveal, uIgnite, uTime, uArrival, uEnergy;',
    'void main(){',
    ' vec3 N = normalize(vN); vec3 V = normalize(uEye - vW);',
    /* fresnel is doing most of the work — it turns thin beams into filaments
       of light rather than grey sticks, which is the whole editorial look */
    /* Almost all of the light is grazing. A face turned flat to the camera goes
       black; only edges catch anything. That is the difference between "lit
       boxes" and architecture reading as filaments in a void — broad diffuse
       shading is the single biggest tell of a stock Three.js scene. */
    ' float fres = pow(1.0 - abs(dot(N,V)), 4.5);',
    ' float key  = max(dot(N, vec3(0.0,0.0,1.0)), 0.0);',
    ' float fill = max(dot(N, normalize(vec3(0.42,0.86,0.28))), 0.0);',
    ' vec3 cold = vec3(0.42,0.66,1.0);',
    ' vec3 warm = vec3(1.0,0.44,0.28);',
    ' vec3 col = vec3(0.009,0.012,0.018);',
    ' col += cold * key * 0.030;',
    ' col += vec3(0.55,0.68,0.86) * fill * 0.010;',
    ' col += cold * fres * 1.05;',
    /* emission: cold from the start, warm energy only once we are through */
    ' vec3 em = mix(cold*1.45, warm*1.35, vWarm*uIgnite);',
    ' float pulse = 0.80 + 0.20*sin(uTime*1.6 + vSeed*39.0);',
    ' float gate = mix(1.0 - vWarm, 1.0, uIgnite);',
    /* a chip drifting close to the lens would otherwise clip to a white blob —
       the sparkle should stay in the depth, not land on the glass */
    ' float emNear = smoothstep(1.6, 9.0, vDist);',
    /* the structure answers the crossing — emission and edge light surge as the
       boundary passes, so the frame is alive to its corners at the peak instead
       of a bright centre in a dead surround */
    ' col += em * vEmis * pulse * gate * emNear * uEnergy;',
    ' col += cold * fres * (uEnergy - 1.0) * 0.55;',
    /* Arrival inverts the contrast rather than just brightening it: the void
       goes luminous and the architecture resolves as fine dark structure with a
       cool edge sheen, dissolving into white with distance. Same world, read in
       light — and it hands straight off to the white page underneath. */
    ' vec3 lit = vec3(0.150,0.178,0.232) + vec3(0.42,0.54,0.72)*fres*0.60;',
    ' col = mix(col, lit, uArrival);',
    /* reveal — geometry past uReveal simply is not readable yet. The threshold
       is jittered per-instance so structures surface irregularly, as if the
       eye were adjusting rather than a curtain lifting. */
    ' float rd = uReveal * (0.70 + 0.60*fract(vSeed*17.31));',
    ' float rv = 1.0 - smoothstep(rd*0.55, rd, vDist);',
    ' float fog = exp(-pow(vDist*uFog, 2.0));',
    /* anything about to clip the near plane dissolves instead of swelling into
       a flat plate across the frame — a giant lit rectangle is the fastest way
       to break the illusion of scale */
    ' float near = smoothstep(0.6, 3.2, vDist);',
    ' col = mix(uFogCol, col, clamp(fog*rv*near, 0.0, 1.0));',
    ' gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /* the perceptual anchor — a billboarded core that moves *less* than the
     world, so the architecture appears to expand around it rather than the
     camera appearing to move through a static box */
  var ANCHOR_VS = [
    'attribute vec2 aPos;',
    'uniform mat4 uVP; uniform vec3 uCentre; uniform vec3 uRight, uUp; uniform float uSize;',
    'varying vec2 vUv;',
    'void main(){ vUv = aPos;',
    ' vec3 w = uCentre + uRight*aPos.x*uSize + uUp*aPos.y*uSize;',
    ' gl_Position = uVP * vec4(w,1.0); }'
  ].join('\n');

  var ANCHOR_FS = [
    'precision highp float; varying vec2 vUv;',
    'uniform vec3 uCol; uniform float uInt;',
    'void main(){',
    ' float r = length(vUv);',
    ' float core = exp(-r*r*30.0);',
    ' float halo = exp(-r*r*2.6)*0.22;',
    ' gl_FragColor = vec4(uCol*(core*1.6+halo)*uInt, 1.0); }'
  ].join('\n');

  var QUAD_VS = 'attribute vec2 aPos; varying vec2 vUv;' +
                'void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }';

  var BRIGHT_FS = [
    'precision mediump float; varying vec2 vUv;',
    'uniform sampler2D uTex; uniform float uThresh;',
    'void main(){',
    ' vec3 c = texture2D(uTex, vUv).rgb;',
    ' float l = dot(c, vec3(0.2126,0.7152,0.0722));',
    /* soft knee — a hard cut makes bloom pop on and off as things drift past */
    ' float k = smoothstep(uThresh, uThresh+0.28, l);',
    ' gl_FragColor = vec4(c*k, 1.0); }'
  ].join('\n');

  var BLUR_FS = [
    'precision mediump float; varying vec2 vUv;',
    'uniform sampler2D uTex; uniform vec2 uDir;',
    'void main(){',
    ' vec3 s = texture2D(uTex, vUv).rgb * 0.2270;',
    ' s += texture2D(uTex, vUv + uDir*1.3846).rgb * 0.3162;',
    ' s += texture2D(uTex, vUv - uDir*1.3846).rgb * 0.3162;',
    ' s += texture2D(uTex, vUv + uDir*3.2308).rgb * 0.0702;',
    ' s += texture2D(uTex, vUv - uDir*3.2308).rgb * 0.0702;',
    ' gl_FragColor = vec4(s,1.0); }'
  ].join('\n');

  /* ── THE OPTICAL EVENT ─────────────────────────────────────────────────────
     This is the pass that makes the *final image* bend. Not a material, not a
     blur — the rendered frame is resampled through a radial field whose
     magnitude grows with r², so the centre stays legible while the edges
     stretch, and RGB is fetched at three different offsets so curvature
     produces real spectral separation.                                       */
  function compFrag(taps) {
    return [
      'precision highp float; varying vec2 vUv;',
      'uniform sampler2D uScene, uBloom;',
      'uniform float uAspect, uTime;',
      'uniform float uRefract, uDisp, uWarp, uSmear, uLensR, uLensSoft;',
      'uniform float uBloomAmt, uSpectral, uVig, uGrain, uWhite, uExposure;',
      'uniform vec3 uWhiteCol;',
      'float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }',
      'float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);',
      ' float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));',
      ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }',
      'float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<3;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }',
      'vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }',
      'void main(){',
      ' vec2 uv = vUv;',
      ' vec2 c = uv*2.0-1.0; c.x *= uAspect;',
      ' float r = length(c);',
      ' vec2 dir = c / max(r, 1e-4);',
      /* low-frequency turbulence: real glass is never mathematically clean.
         Slow and large-scale — fast or small-scale reads as liquid/jelly. */
      ' float t = uTime*0.055;',
      ' vec2 turb = vec2(fbm(c*0.85 + vec2(t,0.0)), fbm(c*0.85 + vec2(5.2,-t))) - 0.5;',
      /* the boundary is larger than the viewport — we only ever see curvature,
         never a circle drawn on screen */
      ' float lens = smoothstep(uLensR + uLensSoft, uLensR - uLensSoft, r);',
      ' float k = uRefract * (0.16 + r*r) * mix(1.0, lens, 0.6);',
      ' vec2 disp = dir*k + turb*uWarp;',
      ' float d = uDisp * (0.20 + r*r*1.4);',
      ' vec3 acc = vec3(0.0); float wsum = 0.0;',
      '#define TAPS ' + taps,
      ' for(int i=0;i<TAPS;i++){',
      '   float f = float(i)/float(TAPS);',
      /* radial smear along the direction of travel — only at high velocity */
      '   vec2 o = disp + dir*uSmear*f*(0.12+r);',
      '   float w = 1.0 - 0.55*f;',
      '   acc.r += texture2D(uScene, uv - o*(1.0+d)).r * w;',
      '   acc.g += texture2D(uScene, uv - o).g * w;',
      '   acc.b += texture2D(uScene, uv - o*(1.0-d)).b * w;',
      '   wsum += w; }',
      ' vec3 col = acc / wsum;',
      ' vec3 bl = texture2D(uBloom, uv - disp*0.55).rgb;',
      ' col += bl * uBloomAmt;',
      /* spectral rim — light caught inside the curvature of the boundary.
         Present even at rest: the faint rainbow at the frame edge is what
         tells you the whole page is already behind thick glass. */
      ' float band = (r - uLensR)/max(uLensSoft, 0.04);',
      ' float ring = exp(-band*band);',
      ' float lum = dot(bl, vec3(0.333));',
      /* phase runs across the *band*, not across the whole radius — otherwise
         the sweep repeats and you get concentric rainbows, which reads as a
         target pattern rather than light caught in a curved boundary */
      ' float ph = band*0.28 + uTime*0.012;',
      ' vec3 spec = vec3(0.5+0.5*sin(6.2831*ph), 0.5+0.5*sin(6.2831*(ph+0.333)), 0.5+0.5*sin(6.2831*(ph+0.666)));',
      ' col += spec * ring * uSpectral * (0.22 + lum*2.2);',
      ' col *= uExposure;',
      ' col = aces(col);',
      ' col *= 1.0 - uVig*smoothstep(0.42,1.45,r);',
      ' col += (hash(gl_FragCoord.xy + fract(uTime))-0.5)*uGrain;',
      ' col = mix(col, uWhiteCol, uWhite);',
      ' gl_FragColor = vec4(col,1.0); }'
    ].join('\n');
  }

  /* ── GL plumbing ───────────────────────────────────────────────────────── */
  function makeProgram(gl, vsSrc, fsSrc) {
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('[dimension] shader:', gl.getShaderInfoLog(s), '\n', src);
        return null;
      }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, vsSrc), fs = sh(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    var p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('[dimension] link:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  function makeRT(gl, w, h, depth) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    var rb = null;
    if (depth) {
      rb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex: tex, fb: fb, rb: rb, w: w, h: h };
  }

  /* ═══ the experience ═══════════════════════════════════════════════════ */
  function create(canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
    var isGL2 = !!gl, ext = null;
    if (!gl) {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
      if (!gl) return null;
      ext = gl.getExtension('ANGLE_instanced_arrays');
      if (!ext) return null;                       // caller falls back to the flat shader
    }
    var divisor = isGL2 ? gl.vertexAttribDivisor.bind(gl) : ext.vertexAttribDivisorANGLE.bind(ext);
    var drawInst = isGL2 ? gl.drawElementsInstanced.bind(gl) : ext.drawElementsInstancedANGLE.bind(ext);

    var low = opts.quality === 'low';
    var flight = buildFlight();
    var inst = buildInstances(flight, !low);
    var geo = boxGeo();

    /* programs */
    var pScene = makeProgram(gl, SCENE_VS, SCENE_FS);
    var pAnchor = makeProgram(gl, ANCHOR_VS, ANCHOR_FS);
    var pBright = makeProgram(gl, QUAD_VS, BRIGHT_FS);
    var pBlur = makeProgram(gl, QUAD_VS, BLUR_FS);
    var pComp = makeProgram(gl, QUAD_VS, compFrag(low ? 2 : 5));
    if (!pScene || !pAnchor || !pBright || !pBlur || !pComp) return null;

    /* buffers */
    function buf(target, data, usage) {
      var b = gl.createBuffer();
      gl.bindBuffer(target, b);
      gl.bufferData(target, data, usage || gl.STATIC_DRAW);
      return b;
    }
    var bPos = buf(gl.ARRAY_BUFFER, geo.pos);
    var bNorm = buf(gl.ARRAY_BUFFER, geo.norm);
    var bIdx = buf(gl.ELEMENT_ARRAY_BUFFER, geo.idx);
    var bInst = buf(gl.ARRAY_BUFFER, inst.data);
    var bQuad = buf(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]));
    var bBill = buf(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]));

    /* uniform lookup, cached */
    function U(p, names) {
      var o = {};
      for (var i = 0; i < names.length; i++) o[names[i]] = gl.getUniformLocation(p, names[i]);
      return o;
    }
    var uS = U(pScene, ['uVP', 'uEye', 'uTime', 'uFog', 'uFogCol', 'uReveal', 'uIgnite', 'uArrival', 'uEnergy']);
    var uA = U(pAnchor, ['uVP', 'uCentre', 'uRight', 'uUp', 'uSize', 'uCol', 'uInt']);
    var uBr = U(pBright, ['uTex', 'uThresh']);
    var uBl = U(pBlur, ['uTex', 'uDir']);
    var uC = U(pComp, ['uScene', 'uBloom', 'uAspect', 'uTime', 'uRefract', 'uDisp', 'uWarp',
                       'uSmear', 'uLensR', 'uLensSoft', 'uBloomAmt', 'uSpectral', 'uVig',
                       'uGrain', 'uWhite', 'uExposure', 'uWhiteCol']);

    var aS = {
      pos: gl.getAttribLocation(pScene, 'aPos'), norm: gl.getAttribLocation(pScene, 'aNorm'),
      iPos: gl.getAttribLocation(pScene, 'iPos'), iScale: gl.getAttribLocation(pScene, 'iScale'),
      iRot: gl.getAttribLocation(pScene, 'iRot'), iTint: gl.getAttribLocation(pScene, 'iTint')
    };
    var aAnchor = gl.getAttribLocation(pAnchor, 'aPos');
    var aQuadB = gl.getAttribLocation(pBright, 'aPos');
    var aQuadL = gl.getAttribLocation(pBlur, 'aPos');
    var aQuadC = gl.getAttribLocation(pComp, 'aPos');

    /* render targets — rebuilt on resize */
    var rtScene = null, rtA = null, rtB = null, W = 0, H = 0;
    var DPR_CAP = low ? 1 : 1.5;

    function alloc(w, h) {
      if (rtScene) {
        gl.deleteTexture(rtScene.tex); gl.deleteFramebuffer(rtScene.fb); gl.deleteRenderbuffer(rtScene.rb);
        gl.deleteTexture(rtA.tex); gl.deleteFramebuffer(rtA.fb);
        gl.deleteTexture(rtB.tex); gl.deleteFramebuffer(rtB.fb);
      }
      rtScene = makeRT(gl, w, h, true);
      var bw = Math.max(2, w >> 2), bh = Math.max(2, h >> 2);
      rtA = makeRT(gl, bw, bh, false);
      rtB = makeRT(gl, bw, bh, false);
    }

    function viewSize() {
      /* screen.* fallback keeps this measurable in hidden/headless tabs where
         clientWidth reads 0 — see the lab harness */
      var w = canvas.clientWidth || canvas.width || (global.screen && screen.width) || 1280;
      var h = canvas.clientHeight || canvas.height || (global.screen && screen.height) || 720;
      return [w, h];
    }

    function resize() {
      var s = viewSize();
      var dpr = Math.min(global.devicePixelRatio || 1, DPR_CAP);
      var w = Math.max(2, Math.round(s[0] * dpr)), h = Math.max(2, Math.round(s[1] * dpr));
      if (w === W && h === H) return;
      W = w; H = h; canvas.width = w; canvas.height = h;
      alloc(w, h);
    }
    resize();

    var vp = m4(), proj = m4(), view = m4();
    var t0 = (global.performance || Date).now();

    function bindQuad(loc) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bQuad);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    /* ── the timeline. Every optical parameter is a pure function of p and
         of the flight's own velocity, so retiming the scroll never desyncs
         the effect from the motion. ────────────────────────────────────── */
    function draw(p, scrollVel) {
      p = clamp01(p);
      var sv = clamp01(scrollVel || 0);
      resize();
      var now = ((global.performance || Date).now() - t0) / 1000;

      var cam = cameraAt(flight, p);
      var vel = flight.vel(p);                       // 0..1, peaks at the crossing
      /* scroll speed makes the dimension react harder, but can never be the
         sole driver — clamped so a flick cannot produce a visual jump */
      var drive = clamp01(vel + sv * 0.35 * (0.25 + vel));

      var cross = Math.exp(-Math.pow((p - 0.672) / 0.055, 2));   // the short, violent window
      var arrival = smoothstep(0.74, 0.90, p);

      /* ---- scene uniforms ---- */
      var aspect = W / H;
      perspective(proj, cam.fov, aspect, 0.1, 600);
      /* roll by rotating the up-vector */
      var cr = Math.cos(cam.roll), sr = Math.sin(cam.roll);
      lookAt(view, cam.x, cam.y, cam.z, cam.tx, cam.ty, cam.z - 20, sr, cr, 0);
      mul(vp, proj, view);

      gl.bindFramebuffer(gl.FRAMEBUFFER, rtScene.fb);
      gl.viewport(0, 0, W, H);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.disable(gl.BLEND);

      /* fog recedes as we approach — the world was always there */
      var fog = mix(0.0180, 0.0042, smoothstep(0.08, 0.62, p));
      fog = mix(fog, 0.0026, smoothstep(0.62, 0.78, p));
      /* aerial perspective on arrival — structure dissolves into the white
         rather than the whole frame flattening to grey */
      fog = mix(fog, 0.0082, arrival);
      var reveal = mix(46, 300, smoothstep(0.05, 0.66, p));
      var fogR = mix(0.006, 0.957, arrival), fogG = mix(0.009, 0.967, arrival), fogB = mix(0.015, 0.985, arrival);

      gl.clearColor(fogR, fogG, fogB, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(pScene);
      gl.uniformMatrix4fv(uS.uVP, false, vp);
      gl.uniform3f(uS.uEye, cam.x, cam.y, cam.z);
      gl.uniform1f(uS.uTime, now);
      gl.uniform1f(uS.uFog, fog);
      gl.uniform3f(uS.uFogCol, fogR, fogG, fogB);
      gl.uniform1f(uS.uReveal, reveal);
      gl.uniform1f(uS.uIgnite, smoothstep(0.60, 0.76, p));
      gl.uniform1f(uS.uArrival, arrival);
      gl.uniform1f(uS.uEnergy, 1.0 + 2.4 * cross + 0.35 * drive);

      gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
      gl.enableVertexAttribArray(aS.pos); gl.vertexAttribPointer(aS.pos, 3, gl.FLOAT, false, 0, 0);
      divisor(aS.pos, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bNorm);
      gl.enableVertexAttribArray(aS.norm); gl.vertexAttribPointer(aS.norm, 3, gl.FLOAT, false, 0, 0);
      divisor(aS.norm, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bInst);
      var st = STRIDE * 4;
      [[aS.iPos, 0], [aS.iScale, 16], [aS.iRot, 32], [aS.iTint, 48]].forEach(function (a) {
        gl.enableVertexAttribArray(a[0]);
        gl.vertexAttribPointer(a[0], 4, gl.FLOAT, false, st, a[1]);
        divisor(a[0], 1);
      });
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
      drawInst(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, inst.count);

      /* ---- anchor: lags the camera, so the world expands around it ---- */
      var anchorZ = cam.z - mix(52, 14, smoothstep(0.45, 0.80, p));
      gl.useProgram(pAnchor);
      gl.uniformMatrix4fv(uA.uVP, false, vp);
      gl.uniform3f(uA.uCentre, cam.tx * 0.5, cam.ty * 0.5, anchorZ);
      gl.uniform3f(uA.uRight, cr, -sr, 0);
      gl.uniform3f(uA.uUp, sr, cr, 0);
      /* deliberately small and dim — it is a light *in* the corridor, not a
         glowing sphere parked on the lens. The bloom pass does the glowing;
         if the core itself is hot enough to clip, it reads as a stock asset. */
      gl.uniform1f(uA.uSize, mix(1.1, 3.2, smoothstep(0.3, 0.7, p)));
      var warmA = smoothstep(0.66, 0.86, p);
      gl.uniform3f(uA.uCol, mix(0.34, 1.0, warmA), mix(0.62, 0.90, warmA), mix(1.0, 0.86, warmA));
      /* gone entirely by arrival — a glowing core makes no sense once the world
         has inverted to dark structure on white */
      gl.uniform1f(uA.uInt, mix(0.20, 0.85, smoothstep(0.1, 0.67, p)) * (1 - arrival));
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, bBill);
      gl.enableVertexAttribArray(aAnchor);
      gl.vertexAttribPointer(aAnchor, 2, gl.FLOAT, false, 0, 0);
      divisor(aAnchor, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      gl.disable(gl.DEPTH_TEST);

      /* ---- bloom ---- */
      var bw = rtA.w, bh = rtA.h;
      gl.bindFramebuffer(gl.FRAMEBUFFER, rtA.fb);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(pBright);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rtScene.tex);
      gl.uniform1i(uBr.uTex, 0);
      gl.uniform1f(uBr.uThresh, mix(0.60, 0.40, drive));
      bindQuad(aQuadB);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.useProgram(pBlur);
      bindQuad(aQuadL);
      gl.uniform1i(uBl.uTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, rtB.fb);
      gl.bindTexture(gl.TEXTURE_2D, rtA.tex);
      gl.uniform2f(uBl.uDir, 1 / bw, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, rtA.fb);
      gl.bindTexture(gl.TEXTURE_2D, rtB.tex);
      gl.uniform2f(uBl.uDir, 0, 1 / bh);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      /* ---- composite: the optical event ---- */
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(pComp);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rtScene.tex);
      gl.uniform1i(uC.uScene, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rtA.tex);
      gl.uniform1i(uC.uBloom, 1);
      gl.uniform1f(uC.uAspect, aspect);
      gl.uniform1f(uC.uTime, now);

      /* refraction tracks velocity, plus a hard spike through the boundary */
      gl.uniform1f(uC.uRefract, 0.0045 + 0.038 * drive * drive + 0.075 * cross);
      gl.uniform1f(uC.uDisp, 0.0022 + 0.012 * drive * drive + 0.030 * cross);
      gl.uniform1f(uC.uWarp, 0.0016 + 0.008 * drive + 0.014 * cross);
      gl.uniform1f(uC.uSmear, (0.006 * drive + 0.042 * cross) * (1 - arrival));
      /* the boundary stays peripheral — it sweeps in from the corners but never
         reaches the centre. A ring that crosses the middle of frame stops being
         curvature you infer and becomes a shape you look at. */
      gl.uniform1f(uC.uLensR, mix(1.42, 0.92, smoothstep(0.40, 0.70, p)) + 0.5 * arrival);
      gl.uniform1f(uC.uLensSoft, mix(0.30, 0.17, drive));
      gl.uniform1f(uC.uBloomAmt, mix(0.40, 1.00, drive) * mix(1, 0.55, arrival) + 0.35 * cross);
      gl.uniform1f(uC.uSpectral, 0.012 + 0.030 * drive + 0.100 * cross);
      /* the vignette opens up through the crossing — holding it closed keeps the
         corners dead exactly when the periphery should carry the most speed */
      gl.uniform1f(uC.uVig, mix(0.42, 0.10, arrival) * (1 - 0.6 * cross));
      gl.uniform1f(uC.uGrain, mix(0.028, 0.012, arrival));
      gl.uniform1f(uC.uExposure, 1.0 + 0.28 * cross + 0.12 * drive);
      gl.uniform1f(uC.uWhite, smoothstep(0.90, 0.995, p));
      gl.uniform3f(uC.uWhiteCol, 0.969, 0.976, 0.988);
      bindQuad(aQuadC);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    return {
      draw: draw,
      resize: resize,
      instances: inst.count,
      gl2: isGL2,
      /* exposed for the lab harness / headless verification */
      _flight: flight,
      _camera: function (p) { return cameraAt(flight, p); },
      dispose: function () {
        [bPos, bNorm, bIdx, bInst, bQuad, bBill].forEach(function (b) { gl.deleteBuffer(b); });
        [pScene, pAnchor, pBright, pBlur, pComp].forEach(function (p) { gl.deleteProgram(p); });
        if (rtScene) {
          gl.deleteTexture(rtScene.tex); gl.deleteFramebuffer(rtScene.fb); gl.deleteRenderbuffer(rtScene.rb);
          gl.deleteTexture(rtA.tex); gl.deleteFramebuffer(rtA.fb);
          gl.deleteTexture(rtB.tex); gl.deleteFramebuffer(rtB.fb);
        }
      }
    };
  }

  global.Dimension = { create: create, TRAVEL: TRAVEL };
})(window);
