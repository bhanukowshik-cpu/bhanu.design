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

    /* ── THE LATTICE ────────────────────────────────────────────────────────
       A structural framework, not a scatter. Girders sit on a regular 3D grid
       so the eye reads rectangular cells marching into depth the way a
       building's skeleton does — that density IS the subject. A clear bore is
       left down the axis for the flight path, which is what turns a solid
       block of geometry into a corridor you are inside of.

       Irregularity comes from broken runs, jittered thickness and skipped
       stations rather than from random placement: a lattice that wanders isn't
       architecture, and a lattice that never breaks is wallpaper. */
    var STEP = dense ? 7.2 : 9.6;                 // cell size
    var NX = dense ? 4 : 3, NY = dense ? 3 : 2;   // cells out from the axis
    var BORE = 10.5;                              // radius of the clear flight tube
    var GIRD = 0.34;                              // girder half-thickness — chunky reads as mass
    var SPANX = NX * STEP, SPANY = NY * STEP;

    /* 1 — LONGITUDINAL GIRDERS. The converging lines that own the perspective. */
    for (var gx = -NX; gx <= NX; gx++) {
      for (var gy = -NY; gy <= NY; gy++) {
        var nx = gx * STEP, ny = gy * STEP;
        var rad = Math.sqrt(nx * nx + ny * ny);
        if (rad <= BORE) continue;                              // keep the bore clear
        /* heavier near the bore, tapering outward — reads as load-bearing */
        var fall = 1 - Math.min(1, (rad - BORE) / SPANX);
        var th = GIRD * (0.55 + 0.80 * fall) * (0.80 + r() * 0.45);
        var z = 26;
        while (z > far) {
          var len = 16 + r() * 32;
          push(nx + (r() - 0.5) * 0.30, ny + (r() - 0.5) * 0.30, z - len * 0.5,
               th, th, len * 0.5, 0, 0, 0,
               PALE[0], PALE[1], PALE[2], 0, 0);
          /* mostly continuous run, occasionally a real break */
          z -= len + (r() < 0.74 ? 0.5 : 4 + r() * 15);
        }
      }
    }

    /* 2 — TRANSVERSE BEAMS. The rungs that turn converging lines into cells.
       Each one stops at the bore, so the frames you fly through stay open. */
    var station = 0;
    for (var sz = 20; sz > far; sz -= STEP * 2) {
      station++;
      if (station % 3 === 1) continue;                          // rhythm, not metronome
      var tb = GIRD * (0.70 + r() * 0.65);
      var jz = sz + (r() - 0.5) * 1.2;
      var i2;
      for (i2 = -NY; i2 <= NY; i2++) {                          // horizontal rungs
        var hy = i2 * STEP;
        if (Math.abs(hy) >= BORE) {
          push(0, hy, jz, SPANX, tb, tb, 0, 0, 0, PALE[0], PALE[1], PALE[2], 0, 0);
        } else {
          var xin = Math.sqrt(Math.max(0, BORE * BORE - hy * hy));
          if (SPANX > xin + 0.5) {
            var hh = (SPANX - xin) * 0.5, hc = (SPANX + xin) * 0.5;
            push(-hc, hy, jz, hh, tb, tb, 0, 0, 0, PALE[0], PALE[1], PALE[2], 0, 0);
            push(hc, hy, jz, hh, tb, tb, 0, 0, 0, PALE[0], PALE[1], PALE[2], 0, 0);
          }
        }
      }
      for (i2 = -NX; i2 <= NX; i2++) {                          // vertical rungs
        var vx = i2 * STEP;
        if (Math.abs(vx) >= BORE) {
          push(vx, 0, jz, tb, SPANY, tb, 0, 0, 0, PALE[0], PALE[1], PALE[2], 0, 0);
        } else {
          var yin = Math.sqrt(Math.max(0, BORE * BORE - vx * vx));
          if (SPANY > yin + 0.5) {
            var vh = (SPANY - yin) * 0.5, vc = (SPANY + yin) * 0.5;
            push(vx, -vc, jz, tb, vh, tb, 0, 0, 0, PALE[0], PALE[1], PALE[2], 0, 0);
            push(vx, vc, jz, tb, vh, tb, 0, 0, 0, PALE[0], PALE[1], PALE[2], 0, 0);
          }
        }
      }
    }

    /* 3 — BRACES. Sparse diagonals across the outer cells. They break the grid
       just enough that it stops reading as a repeating tile. */
    var nBrace = dense ? 90 : 34;
    for (var b = 0; b < nBrace; b++) {
      var bx = (Math.floor(r() * (2 * NX + 1)) - NX) * STEP;
      var by = (Math.floor(r() * (2 * NY + 1)) - NY) * STEP;
      if (Math.sqrt(bx * bx + by * by) <= BORE + STEP * 0.5) continue;
      var bz = 14 - r() * (TRAVEL + 70);
      var diag = Math.sqrt(2) * STEP * 0.5;
      push(bx + STEP * 0.5, by + STEP * 0.5, bz,
           GIRD * 0.55, diag, GIRD * 0.55,
           0, 0, (r() < 0.5 ? 1 : -1) * Math.PI * 0.25,
           PALE[0], PALE[1], PALE[2], 0, 0);
    }

    /* 4 — PLATES. Occasional solid slabs bolted into the framework, so the
       lattice has mass between its lines and isn't only edges. */
    var nPlate = dense ? 110 : 44;
    for (var pl = 0; pl < nPlate; pl++) {
      var px2 = (Math.floor(r() * (2 * NX + 1)) - NX) * STEP + STEP * 0.5;
      var py2 = (Math.floor(r() * (2 * NY + 1)) - NY) * STEP + STEP * 0.5;
      if (Math.sqrt(px2 * px2 + py2 * py2) <= BORE + 1.5) continue;
      var pz2 = 12 - r() * (TRAVEL + 80);
      var flat = r() < 0.5;
      push(px2, py2, pz2,
           flat ? STEP * (0.20 + r() * 0.28) : GIRD * 0.8,
           flat ? GIRD * 0.8 : STEP * (0.18 + r() * 0.26),
           STEP * (0.20 + r() * 0.55),
           0, 0, 0,
           PALE[0], PALE[1], PALE[2], 0, 0);
    }

    /* 5 — DEEP FIELD. A thin scatter well beyond the framework, only readable
       once the fog lifts — evidence the world continues past what you could
       perceive at the start. */
    var nDeb = dense ? 110 : 44;
    for (var d = 0; d < nDeb; d++) {
      var dz = -40 - r() * (TRAVEL + 120);
      var da = r() * Math.PI * 2;
      var dr = SPANX * 1.15 + r() * 26;
      push(Math.cos(da) * dr, Math.sin(da) * dr * 0.72, dz,
           0.14 + r() * 0.34, 0.14 + r() * 0.34, 0.9 + r() * 5.0,
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
      /* clamped onto the girder grid, so emission reads as lights set into the
         structure rather than fireflies drifting in the void */
      var cx, cy;
      if (r() < 0.82) {
        cx = (Math.floor(r() * (2 * NX + 1)) - NX) * STEP + (r() - 0.5) * 0.7;
        cy = (Math.floor(r() * (2 * NY + 1)) - NY) * STEP + (r() - 0.5) * 0.7;
        if (Math.sqrt(cx * cx + cy * cy) <= BORE) { cx *= 1.9; cy *= 1.9; }
      } else {
        var ca = r() * Math.PI * 2, cr = BORE + r() * SPANX * 0.9;
        cx = Math.cos(ca) * cr; cy = Math.sin(ca) * cr * 0.75;
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

  /* ── THE SPIRAL ────────────────────────────────────────────────────────────
     A vortex you fall into, rather than a corridor you fly down.

     This reads where the lattice did not, and the reason is legibility: an
     abstract framework has no shape the viewer already expects, so distorting
     it communicates nothing. A spiral does — rotation is unmistakable, and a
     centre that everything converges toward is unmistakable. The dimensional
     feeling comes from the structure itself instead of from an optical trick
     that has to be sold.

     Radius is large near the camera and converges with depth, so the arms
     sweep in from off-frame and wind down to a core. Shards are aligned
     *tangentially* to their arm — that one detail is what makes the field read
     as flow rather than as scattered debris.                                 */
  function buildSpiral(flight, dense) {
    var arr = [], r = rng(20260726);

    function push(px, py, pz, sx, sy, sz, rx, ry, rz, tr, tg, tb, em, warm) {
      arr.push(px, py, pz, r(),
               sx, sy, sz, em,
               rx, ry, rz, 0,
               tr, tg, tb, warm);
    }

    var DEPTH = TRAVEL + 150;
    var ARMS = 3;
    var TURNS = 2.7;
    var R0 = 46;                                   // mouth, out past the frame
    var RMIN = 2.0;                                // the core
    var COLD = [0.42, 0.66, 1.00];
    var PALE = [0.62, 0.72, 0.88];
    var WARM = [1.00, 0.62, 0.42];

    /* 1 — ARM SHARDS */
    var N = dense ? 4400 : 1400;
    for (var i = 0; i < N; i++) {
      var t = Math.pow(r(), 0.82);                 // a little denser toward the mouth
      var arm = Math.floor(r() * ARMS);
      var z = -t * DEPTH;
      var rad = RMIN + (R0 - RMIN) * (1 - t);
      /* arm thickness — two uniforms make a cheap bell, so arms have a dense
         spine and a soft edge instead of a hard-edged ribbon */
      rad += rad * 0.17 * (r() + r() - 1);
      var theta = t * TURNS * Math.PI * 2 + arm * (Math.PI * 2 / ARMS) + (r() - 0.5) * 0.34;

      /* Long along the arm. Short marks read as a dot field however many you
         add; drawn-out ones overlap into continuous curves, and the curve is
         the whole point — it is what tells the eye this is a spiral. */
      var big = r() < 0.09;
      var len = (big ? 3.0 + r() * 6.0 : 0.9 + r() * 2.8) * (0.55 + (1 - t) * 1.3);
      var th = (big ? 0.10 + r() * 0.15 : 0.05 + r() * 0.09) * (0.6 + (1 - t) * 1.0);

      /* emissive fraction climbs toward the core, so the centre is the
         brightest thing without anything being placed there by hand */
      var lit = r() < (0.34 + t * 0.34);
      var wm = lit && r() < 0.30 ? 1 : 0;
      var c = lit ? COLD : PALE;

      push(Math.cos(theta) * rad, Math.sin(theta) * rad, z,
           len, th, th * (1 + r() * 1.6),
           0, 0, theta + Math.PI * 0.5,             // tangential — this is what makes it flow
           c[0], c[1], c[2],
           lit ? (0.7 + r() * 1.9) * (0.45 + t) : 0, wm);
    }

    /* 2 — DUST. Fills the volume between the arms so the vortex sits in a
       universe rather than in an empty box. Unaligned and tiny. */
    var nDust = dense ? 900 : 320;
    for (var d = 0; d < nDust; d++) {
      var dt = Math.pow(r(), 0.7);
      var dz = -dt * DEPTH;
      var drad = (RMIN + (R0 - RMIN) * (1 - dt)) * (0.25 + r() * 1.25);
      var dth = r() * Math.PI * 2;
      var dlit = r() < 0.22;
      push(Math.cos(dth) * drad, Math.sin(dth) * drad, dz,
           0.04 + r() * 0.10, 0.04 + r() * 0.10, 0.04 + r() * 0.22,
           0, 0, r() * 3.14,
           dlit ? COLD[0] : PALE[0], dlit ? COLD[1] : PALE[1], dlit ? COLD[2] : PALE[2],
           dlit ? 0.35 + r() * 0.9 : 0, r() < 0.25 ? 1 : 0);
    }

    /* 3 — PASSERS. Placed on the camera's own path through the acceleration
       window, so something always rushes the lens exactly when it should.
       Far geometry reads as camera movement; only near geometry reads as SPEED. */
    for (var k = 0; k < 18; k++) {
      var pp = 0.48 + (k / 17) * 0.26;
      var pz = flight.z(pp) - (2 + r() * 8);
      var pth = r() * Math.PI * 2;
      var prad = 3.5 + r() * 7;
      push(Math.cos(pth) * prad, Math.sin(pth) * prad, pz,
           1.6 + r() * 3.8, 0.09 + r() * 0.16, 0.09 + r() * 0.3,
           0, 0, pth + Math.PI * 0.5,
           WARM[0], WARM[1], WARM[2], (k % 3 === 0) ? 0.55 : 0, 1);
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
    'uniform mat4 uVP; uniform vec3 uEye; uniform float uTime; uniform float uSpin;',
    'varying vec3 vN, vW; varying float vEmis, vDist, vWarm, vSeed; varying vec3 vTint;',
    'void main(){',
    ' vec3 e = iRot.xyz;',
    ' float sx=sin(e.x),cx=cos(e.x),sy=sin(e.y),cy=cos(e.y),sz=sin(e.z),cz=cos(e.z);',
    ' mat3 R = mat3(cz,sz,0.,-sz,cz,0.,0.,0.,1.)',
    '          * mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy)',
    '          * mat3(1.,0.,0.,0.,cx,sx,0.,-sx,cx);',
    ' vec3 w = R * (aPos * iScale.xyz) + iPos.xyz;',
    /* Spin the whole field about the axis. Deeper rings lag slightly, which
       shears the arms into a corkscrew instead of turning the vortex like a
       rigid wheel — differential rotation is what makes it read as a fluid. */
    ' float sp = uSpin * (1.0 + w.z * 0.0016);',
    ' float cs = cos(sp), sn = sin(sp);',
    ' w.xy = vec2(w.x*cs - w.y*sn, w.x*sn + w.y*cs);',
    /* a hair of drift so the field is never dead — too small to read as motion */
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
    ' float fres = pow(1.0 - abs(dot(N,V)), 3.4);',
    ' float key  = max(dot(N, vec3(0.0,0.0,1.0)), 0.0);',
    ' float fill = max(dot(N, normalize(vec3(0.42,0.86,0.28))), 0.0);',
    ' vec3 cold = vec3(0.42,0.66,1.0);',
    ' vec3 warm = vec3(1.0,0.44,0.28);',
    /* girders need enough diffuse to read as solid mass — pure fresnel turns
       structure into wireframe, which is what made this look like floating
       bars instead of a building. Still dark: silhouette first, then edges. */
    ' vec3 col = vec3(0.016,0.020,0.028);',
    ' col += cold * key * 0.105;',
    ' col += vec3(0.55,0.68,0.86) * fill * 0.045;',
    ' col += cold * fres * 0.85;',
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

  /* ── THE TITLE PLANE ───────────────────────────────────────────────────────
     The single most important part of the illusion, and the easiest to leave
     out. Abstract geometry can distort as hard as it likes and the eye cannot
     tell — there is no reference for what it *should* look like, so refraction
     on a lattice just reads as "the lattice is shaped like that". Type is
     different. You were reading it a second ago, so when it stretches and bows
     you attribute the change to the space rather than to the letters. The
     departure has to be built out of something familiar or the arrival means
     nothing.                                                                 */
  var TITLE_VS = [
    'attribute vec2 aPos;',
    'uniform mat4 uVP; uniform vec3 uCentre; uniform vec2 uSize;',
    'varying vec2 vUv;',
    'void main(){',
    ' vUv = vec2(aPos.x*0.5+0.5, 0.5-aPos.y*0.5);',
    ' vec3 w = uCentre + vec3(aPos.x*uSize.x, aPos.y*uSize.y, 0.0);',
    ' gl_Position = uVP * vec4(w,1.0); }'
  ].join('\n');

  var TITLE_FS = [
    'precision mediump float; varying vec2 vUv;',
    'uniform sampler2D uTex; uniform float uAlpha; uniform vec3 uTint;',
    'void main(){',
    ' vec4 t = texture2D(uTex, vUv);',
    ' gl_FragColor = vec4(uTint * t.a * uAlpha, t.a * uAlpha); }'
  ].join('\n');

  /* Glyphs are placed by hand rather than with ctx.letterSpacing so the pull
     is exact, animatable, and identical on every engine. */
  function drawTitle(cv, lines, spread, family) {
    var W = cv.width, H = cv.height;
    var x = cv.getContext('2d');
    x.clearRect(0, 0, W, H);
    if (!lines.length) return;
    x.fillStyle = '#ffffff';
    x.textBaseline = 'middle';

    var lead = H / (lines.length + 0.55);
    var size = lead * 0.74;

    function lineWidth(s, sz, gp) {
      x.font = '560 ' + Math.round(sz) + 'px ' + family;
      var w = 0;
      for (var i = 0; i < s.length; i++) w += x.measureText(s[i]).width + (i < s.length - 1 ? gp : 0);
      return w;
    }
    /* shrink to fit — the spread grows the line as it pulls apart, so the fit
       has to be resolved against the *current* spacing, not the resting one */
    for (var pass = 0; pass < 3; pass++) {
      var gp = size * spread * 0.62, mx = 0, li;
      for (li = 0; li < lines.length; li++) mx = Math.max(mx, lineWidth(lines[li], size, gp));
      if (mx <= W * 0.86) break;
      size *= (W * 0.86) / mx;
    }

    var gap = size * spread * 0.62;                   // the letters pulling apart
    x.font = '560 ' + Math.round(size) + 'px ' + family;
    for (var l = 0; l < lines.length; l++) {
      var s = lines[l], n = s.length, w = lineWidth(s, size, gap), i;
      x.font = '560 ' + Math.round(size) + 'px ' + family;
      var cx = (W - w) * 0.5, cy = lead * (l + 0.8);
      for (i = 0; i < n; i++) {
        x.fillText(s[i], cx, cy);
        cx += x.measureText(s[i]).width + gap;
      }
    }
  }

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
      ' col *= uExposure;',
      ' col = aces(col);',
      ' col *= 1.0 - uVig*smoothstep(0.42,1.45,r);',
      /* The arc goes on *after* tonemap and vignette. It is light refracting in
         the boundary itself, not light in the scene — and both of those stages
         attack it hardest exactly where it lives, at the frame edge, which is
         what was crushing it to nothing. It also needs a floor that survives an
         empty edge, since in the reference it glows against pure black. */
      /* lum is clamped: at the crossing the bloom buffer is enormous, and an
         unclamped term turns the arc into a full-frame rainbow */
      ' col += spec * ring * uSpectral * (0.55 + min(lum,0.5)*1.3);',
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
    /* 'lattice' is the earlier architectural corridor — kept because it still
       builds and is useful to compare against, but the spiral is the default:
       it reads on its own without needing the optics to explain it. */
    var inst = (opts.world === 'lattice' ? buildInstances : buildSpiral)(flight, !low);
    var geo = boxGeo();

    /* programs */
    var pScene = makeProgram(gl, SCENE_VS, SCENE_FS);
    var pAnchor = makeProgram(gl, ANCHOR_VS, ANCHOR_FS);
    var pBright = makeProgram(gl, QUAD_VS, BRIGHT_FS);
    var pBlur = makeProgram(gl, QUAD_VS, BLUR_FS);
    var pComp = makeProgram(gl, QUAD_VS, compFrag(low ? 2 : 5));
    var pTitle = makeProgram(gl, TITLE_VS, TITLE_FS);
    if (!pScene || !pAnchor || !pBright || !pBlur || !pComp || !pTitle) return null;

    /* ---- the headline we fly through ---- */
    var titleLines = opts.title || [];
    var titleFamily = opts.titleFont || "'Instrument Sans', system-ui, sans-serif";
    var TITLE_Z = -26;
    var titleCv = null, titleTex = null, titleSpread = -1, titleDirty = true, titleAspect = 0;
    /* The plane is sized once, from the frustum at rest, so it exactly fills the
       frame at p=0 — and then stays fixed in world space. That is what makes it
       grow as the camera closes: sizing it to the *current* frustum would hold
       it at a constant apparent size and it would never rush the lens. */
    var REF_DIST = -TITLE_Z, REF_FOV = 40 * Math.PI / 180;
    var titleH = REF_DIST * Math.tan(REF_FOV / 2) * 0.92;
    if (titleLines.length) {
      titleCv = document.createElement('canvas');
      titleCv.width = low ? 1024 : 2048;
      titleCv.height = low ? 512 : 1024;
      titleTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, titleTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      /* webfonts land after first paint — rebuild once they do, or the type
         flies past in a fallback face */
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { titleDirty = true; titleSpread = -1; });
      }
    }

    function syncTitle(spread) {
      /* quantised: redrawing every frame would cost a full texture upload for a
         change too small to see */
      var q = Math.round(spread * 14) / 14;
      if (!titleDirty && q === titleSpread) return;
      titleSpread = q; titleDirty = false;
      drawTitle(titleCv, titleLines, q, titleFamily);
      gl.bindTexture(gl.TEXTURE_2D, titleTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, titleCv);
    }

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
    var uS = U(pScene, ['uVP', 'uEye', 'uTime', 'uFog', 'uFogCol', 'uReveal', 'uIgnite', 'uArrival', 'uEnergy', 'uSpin']);
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
    var uT = U(pTitle, ['uVP', 'uCentre', 'uSize', 'uTex', 'uAlpha', 'uTint']);
    var aTitle = gl.getAttribLocation(pTitle, 'aPos');
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
      /* The spiral has to be legible from the first frame — its whole job is to
         be a shape you recognise. So depth opens rather than unveils: the fog
         thins and the far arms resolve, but nothing is ever hidden outright the
         way the corridor's structure was. */
      var fog = mix(0.0052, 0.0021, smoothstep(0.06, 0.62, p));
      fog = mix(fog, 0.0015, smoothstep(0.62, 0.78, p));
      /* aerial perspective on arrival — structure dissolves into the white
         rather than the whole frame flattening to grey */
      fog = mix(fog, 0.0075, arrival);
      var reveal = mix(210, 620, smoothstep(0.03, 0.60, p));
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
      gl.uniform1f(uS.uEnergy, 1.0 + 1.10 * cross + 0.22 * drive);
      /* Scroll turns the vortex. Most of the rotation is bound to progress so
         scrubbing back unwinds it exactly; the small time term keeps it alive
         when the visitor stops, and velocity gives it a kick when they don't. */
      gl.uniform1f(uS.uSpin, p * 2.9 + now * 0.035 + sv * 0.30);

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

      /* ---- the headline, and the camera going through it ----
         Depth-tested so lattice in front of the plane occludes it, additive so
         it blooms and picks up the dispersion in the composite. */
      if (titleLines.length) {
        var dist = cam.z - TITLE_Z;                    // > 0 while still approaching
        if (dist > 1.0) {
          /* the pull: spacing opens as the lens takes hold. Reaching ~2.0 by the
             time we arrive means the words are already coming apart before the
             camera is close enough for the scale alone to explain it. */
          /* keep the texture's shape locked to the viewport, or the glyphs
             stretch on anything that isn't the aspect it was drawn at */
          if (Math.abs(aspect - titleAspect) > 0.02) {
            titleAspect = aspect;
            titleCv.height = Math.max(64, Math.round(titleCv.width / aspect));
            titleDirty = true;
          }
          syncTitle(smoothstep(0.03, 0.40, p) * 2.0);
          gl.useProgram(pTitle);
          gl.uniformMatrix4fv(uT.uVP, false, vp);
          gl.uniform3f(uT.uCentre, 0, 0, TITLE_Z);
          gl.uniform2f(uT.uSize, titleH * aspect, titleH);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, titleTex);
          gl.uniform1i(uT.uTex, 0);
          /* fades out before the plane reaches the lens — flying through
             something still opaque would clip as a hard edge across the frame */
          gl.uniform1f(uT.uAlpha, smoothstep(1.5, 9.0, dist));
          gl.uniform3f(uT.uTint, 0.92, 0.95, 1.0);
          gl.depthMask(false);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
          gl.bindBuffer(gl.ARRAY_BUFFER, bBill);
          gl.enableVertexAttribArray(aTitle);
          gl.vertexAttribPointer(aTitle, 2, gl.FLOAT, false, 0, 0);
          divisor(aTitle, 0);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          gl.disable(gl.BLEND);
          gl.depthMask(true);
        }
      }

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
      /* the vortex core — the thing you are falling toward, so it needs real
         presence, but still small enough that the bloom does the glowing */
      gl.uniform1f(uA.uSize, mix(3.4, 8.0, smoothstep(0.25, 0.72, p)));
      var warmA = smoothstep(0.66, 0.86, p);
      gl.uniform3f(uA.uCol, mix(0.40, 1.0, warmA), mix(0.68, 0.90, warmA), mix(1.0, 0.84, warmA));
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
      /* The glass is always there. At rest it still bends the frame and still
         throws a spectral arc down each side — that baseline is what makes the
         whole page feel like it sits behind thick optical glass, rather than
         like an effect that switches on when you scroll. */
      gl.uniform1f(uC.uRefract, 0.016 + 0.034 * drive * drive + 0.050 * cross);
      gl.uniform1f(uC.uDisp, 0.0060 + 0.009 * drive * drive + 0.012 * cross);
      gl.uniform1f(uC.uWarp, 0.0030 + 0.007 * drive + 0.010 * cross);
      gl.uniform1f(uC.uSmear, (0.005 * drive + 0.026 * cross) * (1 - arrival));
      /* r is aspect-corrected: on 16:9 the left/right edges sit near 1.78 while
         top/bottom sit at 1.0. Parking the boundary *between* them is what makes
         it read as two tall arcs down the sides instead of a ring drawn on the
         screen — so the radius has to follow the viewport, not be a constant. */
      var edgeR = 1.0 + (aspect - 1.0) * 0.58;
      gl.uniform1f(uC.uLensR, edgeR * mix(1.0, 0.74, smoothstep(0.40, 0.70, p)) + 0.45 * arrival);
      gl.uniform1f(uC.uLensSoft, mix(0.44, 0.30, drive));
      gl.uniform1f(uC.uBloomAmt, mix(0.34, 0.72, drive) * mix(1, 0.55, arrival) + 0.14 * cross);
      gl.uniform1f(uC.uSpectral, 0.24 + 0.09 * drive + 0.10 * cross);
      /* the vignette opens up through the crossing — holding it closed keeps the
         corners dead exactly when the periphery should carry the most speed */
      gl.uniform1f(uC.uVig, mix(0.28, 0.10, arrival) * (1 - 0.6 * cross));
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
        [pScene, pAnchor, pBright, pBlur, pComp, pTitle].forEach(function (p) { gl.deleteProgram(p); });
        if (titleTex) gl.deleteTexture(titleTex);
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
