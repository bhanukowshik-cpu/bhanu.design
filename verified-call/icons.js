/* ICONS: four animated pixel stat icons rendered into every [data-icon] mount, drawn in the
   design system's pixel language: a 20 x 20 cell sheet, 1-cell strokes, pixel-cut corners,
   ink plus one grey, frames shown in whole steps (nothing tweens, nothing fades). The sheet
   is sized to a whole number of device pixels per cell (3px at 64, 8px at 160), so every cell
   lands on the pixel grid at 1x and 2x.
   Each mount carries data-state: idle (calm ambient loop), scanning (the detection story,
   ends on an ink flag) and resolved (the flag becomes an ink check, held 2s, then idle).
   SCENE drives states through `verified-check` {id, state}; without events a fallback
   director plays one story at a time. Reduced motion, a paused page or setStatic show a
   still frame that tells the whole story. Offscreen or hidden icons stop their clock.
   data-variant is gone: the old monoline concepts have no pixel counterparts. */
(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const N = 20;
  const INK = 1;
  const GREY = 2;
  const IDS = ['face-swap', 'ai-tools', 'avatar', 'camera'];
  const STATES = ['idle', 'scanning', 'resolved'];
  const RESOLVED_HOLD = 2000;
  const EVENT_HOLD = 4500;
  const REPEAT_GAP = 1400;
  const QUIET_MS = 15000;
  const DIRECTOR_MS = 6500;

  let forceStatic = false;
  let autoStories = true;
  let speed = 1;
  let lastEventAt = -Infinity;
  const instances = [];
  const byMount = new Map();

  const M = () => window.VerifiedMotion;
  const reduced = () => (M() ? M().reduced() : matchMedia('(prefers-reduced-motion: reduce)').matches);
  const paused = () => (M() ? M().isPaused() : false);
  const isStatic = () => forceStatic || reduced();
  const frozen = () => isStatic() || paused();
  // The lab's slow-motion switch scales GSAP's global timeline; the pixel clock follows it.
  const rate = () => speed * (window.gsap ? window.gsap.globalTimeline.timeScale() : 1);

  /* ====================================================================== Bitmaps */

  // A 20 x 20 sheet of tones: 0 empty, 1 ink, 2 grey.
  class Bits {
    constructor(src) { this.c = src ? src.c.slice() : new Uint8Array(N * N); }
    copy() { return new Bits(this); }
    at(x, y) { return x >= 0 && y >= 0 && x < N && y < N ? this.c[y * N + x] : 0; }
    put(x, y, t = INK) { if (x >= 0 && y >= 0 && x < N && y < N) this.c[y * N + x] = t; return this; }
    under(x, y, t = GREY) { if (!this.at(x, y)) this.put(x, y, t); return this; } // only on empty
    h(x0, x1, y, t = INK) { for (let x = x0; x <= x1; x++) this.put(x, y, t); return this; }
    v(x, y0, y1, t = INK) { for (let y = y0; y <= y1; y++) this.put(x, y, t); return this; }
    clear(x0, y0, x1, y1) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.put(x, y, 0); return this; }
    cells(list, t = INK) { list.forEach(p => this.put(p[0], p[1], t)); return this; }
    // String art: '#' ink, '+' grey, anything else leaves the cell alone.
    art(rows, ox, oy) {
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === '#') this.put(ox + x, oy + y, INK);
          else if (row[x] === '+') this.put(ox + x, oy + y, GREY);
        }
      });
      return this;
    }
    // Lab / review: the sheet as text ('#' ink, '+' grey, '.' empty).
    text() {
      const rows = [];
      for (let y = 0; y < N; y++) rows.push(Array.from(this.c.subarray(y * N, y * N + N), t => '.#+'[t]).join(''));
      return rows;
    }
    // One path per tone; each horizontal run of cells is one rectangle.
    paths() {
      const d = ['', ''];
      for (let y = 0; y < N; y++) {
        let x = 0;
        while (x < N) {
          const t = this.c[y * N + x];
          if (!t) { x++; continue; }
          let e = x + 1;
          while (e < N && this.c[y * N + e] === t) e++;
          d[t - 1] += `M${x} ${y}h${e - x}v1h${x - e}z`;
          x = e;
        }
      }
      return d;
    }
  }

  /* ====================================================================== Shared glyphs */

  // A head (or webcam body): 11 x 11, corners cut two steps, like the sheet's clock dial.
  const HEAD = [
    '..#######..',
    '.#.......#.',
    '#.........#',
    '#.........#',
    '#.........#',
    '#.........#',
    '#.........#',
    '#.........#',
    '#.........#',
    '.#.......#.',
    '..#######..'
  ];

  // Status corner (top right, kept clear by every scene): an ink flag while scanning, an ink
  // check when resolved. Never colour: green means verified and nothing else.
  const FLAG = ['####', '###.', '####', '#...', '#...', '#...'];
  const TICK = [[15, 3], [16, 4], [17, 3], [18, 2], [19, 1]];
  function corner(b, c) {
    if (c === 'f1') b.v(16, 4, 6);
    else if (c === 'f2') b.v(16, 1, 6).v(17, 1, 3);
    else if (c === 'flag') b.art(FLAG, 16, 1);
    else if (c && c[0] === 'k') {
      // The check draws pixel by pixel, a grey pen tip one cell ahead.
      const n = +c.slice(1);
      TICK.forEach(([x, y], i) => { if (i < n) b.put(x, y); else if (i === n) b.put(x, y, GREY); });
    }
    return b;
  }
  const on = (scene, c) => corner(scene.copy(), c);
  // Raise the flag, one blink, hold.
  const flagIn = scene => [['f1', 70], ['f2', 70], ['flag', 240], [null, 80], ['flag', 560]].map(([c, ms]) => [on(scene, c), ms]);
  // Lower the flag, draw the check, hold it for the resolved beat.
  const flagToCheck = (scene, lowered) => [['f2', 70], ['f1', 70], [null, 60], ['k1', 50], ['k2', 50], ['k3', 50], ['k4', 50], ['k5', RESOLVED_HOLD]]
    .map(([c, ms], i) => [on(i < 3 && lowered ? lowered[i] : scene, c), ms]);
  const checkOut = scene => [[on(scene, 'k2'), 70], [scene, 90]];

  /* ====================================================================== Icons */

  /* Face swap: a pixel figure. A scan bar sweeps the face left to right; the swept side is
     another person (cap of hair, narrow eyes, flat mouth). It pauses on the midline, where the
     face is two people, finishes the sweep, flag. Idle: the face glances and blinks. */
  function faceSwap() {
    const SMILE = [[6, 9], [12, 9], [7, 10], [8, 10], [9, 10], [10, 10], [11, 10]];
    const EYES_A = [[7, 6], [7, 7], [11, 6], [11, 7]];
    const FACE_B = [[5, 5], [6, 5], [7, 5], [6, 7], [7, 7], [11, 7], [12, 7], [8, 10], [9, 10], [10, 10]];
    for (let x = 6; x <= 12; x++) FACE_B.push([x, 3]);
    for (let x = 5; x <= 13; x++) FACE_B.push([x, 4]);
    const FACE_A = EYES_A.concat(SMILE);

    const figure = () => new Bits().art(HEAD, 4, 2)
      .h(5, 13, 14).put(4, 15).put(14, 15).v(3, 16, 18).v(15, 16, 18);
    // bar < 0: all face A; bar >= N: all face B; otherwise the bar column with A to its right.
    const swap = bar => {
      const b = figure();
      FACE_A.forEach(([x, y]) => { if (x > bar) b.put(x, y); });
      FACE_B.forEach(([x, y]) => { if (x < bar) b.put(x, y); });
      if (bar >= 0 && bar < N) {
        b.v(bar, 1, 13);
        for (let y = 1; y <= 13; y++) b.under(bar - 1, y); // grey scan light behind the bar
      }
      return b;
    };
    const look = (dx, shut) => {
      const b = figure().cells(SMILE);
      (shut ? [[7, 7], [11, 7]] : EYES_A).forEach(([x, y]) => b.put(x + dx, y));
      return b;
    };

    const rest = look(0);
    const story = [[rest, 120]];
    for (let x = 3; x <= 8; x++) story.push([swap(x), 70]);
    story.push([swap(9), 480]);
    for (let x = 10; x <= 15; x++) story.push([swap(x), 70]);
    story.push([swap(N), 160]);
    const swapped = swap(N);
    return {
      idle: [[rest, 2600], [look(-1), 420], [rest, 140], [look(1), 420], [rest, 1800], [look(0, true), 110], [rest, 900]],
      story: story.concat(flagIn(swapped)),
      resolve: flagToCheck(swapped),
      reset: checkOut(swapped),
      still: on(swap(9), 'flag'),
      done: on(swap(9), 'k5')
    };
  }

  /* AI avatar: a pixel face over a blink trace. Idle blinks are irregular, like a person.
     The scan runs the trace: every blink lands on a perfectly regular beat, flag. */
  function avatar() {
    const OPEN = [[6, 6], [7, 6], [6, 7], [7, 7], [11, 6], [12, 6], [11, 7], [12, 7]];
    const SHUT = [[6, 7], [7, 7], [11, 7], [12, 7]];
    const BEATS = [3, 7, 11, 15];
    // upto: trace drawn in ink up to this column; the rest of the baseline is a grey dotted
    // line. tip: a grey playhead one column ahead.
    const face = (shut, upto, tip) => {
      const b = new Bits().art(HEAD, 4, 2).cells(shut ? SHUT : OPEN).h(8, 10, 10);
      for (let x = 1; x <= 18; x++) {
        if (x <= upto) { b.put(x, 18); if (BEATS.includes(x)) b.v(x, 15, 17); }
        else if (x % 2) b.put(x, 18, GREY);
      }
      if (tip && upto < 18) b.v(upto + 1, 14, 18, GREY);
      return b;
    };
    const rest = face(false, 0);
    const shut = face(true, 0);
    const story = [[rest, 120]];
    for (let x = 1; x <= 18; x++) story.push([face(BEATS.includes(x), x, true), 75]);
    const traced = face(false, 18);
    story.push([traced, 140]);
    return {
      idle: [[rest, 1200], [shut, 110], [rest, 3600], [shut, 110], [rest, 160], [shut, 110], [rest, 3000], [shut, 110], [rest, 1300]],
      story: story.concat(flagIn(traced)),
      resolve: flagToCheck(traced),
      reset: checkOut(traced),
      still: on(traced, 'flag'),
      done: on(traced, 'k5')
    };
  }

  /* Hidden AI helper: a call window. An overlay panel floats over its corner, invisible to
     the call (a grey dotted ghost). A scan line sweeps down and reveals it; its answer lines
     type in behind the line, flag. */
  function aiTools() {
    const LINES = [[15, 11, 2], [11, 14, 6], [11, 16, 4]]; // x, y, length
    const START = [6, 9, 11]; // sweep step at which each line starts typing
    const call = () => new Bits()
      .h(1, 11, 4).v(0, 5, 15).v(12, 5, 15).h(1, 11, 16) // window x0..12, y4..16
      .put(2, 5, GREY).put(4, 5, GREY).h(1, 11, 6, GREY) // title bar
      .h(4, 5, 8).v(3, 9, 10).v(6, 9, 10).h(4, 5, 11) // the person on the call
      .h(3, 6, 13).v(2, 14, 15).v(7, 14, 15);
    const inPanel = (x, y) => x >= 9 && x <= 18 && y >= 8 && y <= 18 &&
      !((x === 9 || x === 18) && (y === 8 || y === 18));
    const panel = (typed, tip) => {
      const p = new Bits().h(10, 17, 8).v(9, 9, 17).v(18, 9, 17).h(10, 17, 18)
        .cells([[12, 10], [11, 11], [12, 11], [13, 11], [12, 12]]); // the AI spark
      LINES.forEach(([x, y, len], k) => {
        const n = Math.min(len, typed[k]);
        if (n > 0) p.h(x, x + n - 1, y);
        if (tip && n > 0 && n < len) p.put(x + n, y, GREY);
      });
      return p;
    };
    // revealTo: panel rows above this y are revealed; scan: the scan line row.
    const scene = (revealTo, typed, tip, scan, phase) => {
      const b = call();
      const p = panel(typed, tip);
      for (let y = 8; y <= 18; y++) {
        for (let x = 9; x <= 18; x++) {
          if (!inPanel(x, y)) continue;
          const edge = x === 9 || x === 18 || y === 8 || y === 18;
          if (y < revealTo) b.put(x, y, p.at(x, y));
          else if (edge && (x + y + phase) % 2 === 0) b.under(x, y);
        }
      }
      if (scan != null && scan < N) b.h(0, 19, scan, GREY).put(0, scan).put(19, scan);
      return b;
    };
    const rest = scene(0, [0, 0, 0], false, null, 0);
    const story = [[rest, 120]];
    const typedAt = s => START.map((s0, k) => Math.max(0, Math.min(LINES[k][2], s - s0 + 1)));
    for (let s = 0; s <= 14; s++) {
      const line = s <= 12 ? 7 + s : null; // rows 7..19, then two more typing steps
      story.push([scene(line == null ? 99 : line, typedAt(s), true, line, 0), 70]);
    }
    const shown = scene(99, [9, 9, 9], false, null, 0);
    story.push([shown, 160]);
    return {
      // The ghost shimmers now and then: its dots step one cell, twice.
      idle: [[rest, 2400], [scene(0, [0, 0, 0], false, null, 1), 120], [rest, 120], [scene(0, [0, 0, 0], false, null, 1), 120]],
      story: story.concat(flagIn(shown)),
      resolve: flagToCheck(shown),
      reset: checkOut(shown),
      still: on(shown, 'flag'),
      done: on(shown, 'k5')
    };
  }

  /* Camera trick: a webcam. An injected video layer (a frame with a play mark) slides over
     its lens. A ping from the real lens spreads out and exposes the layer as it passes (its
     edge breaks to grey dots, the lens shows through), flag. Resolved ejects the layer and
     settles on the genuine lens. Idle: the aperture steps open and closed. */
  function camera() {
    const LX = 7; // lens centre
    const LY = 9;
    const PLAY = [[8, 8], [8, 9], [9, 9], [8, 10], [9, 10], [10, 10], [8, 11], [9, 11], [8, 12]];
    const webcam = aperture => {
      const b = new Bits().art(HEAD, 2, 4) // body x2..12, y4..14
        .h(6, 8, 7).v(5, 8, 10).v(9, 8, 10).h(6, 8, 11) // lens ring
        .put(LX, 15).h(4, 10, 16); // stand
      if (aperture === 0) b.put(LX, LY).put(6, 8, GREY);
      else if (aperture === 1) b.cells([[7, 8], [6, 9], [7, 9], [8, 9], [7, 10]]);
      else b.h(6, 8, 8).h(6, 8, 9).h(6, 8, 10);
      return b;
    };
    // The layer: x4..14, y6..14 at rest, corners cut one cell; dx slides it right.
    const inCard = (x, y) => x >= 4 && x <= 14 && y >= 6 && y <= 14 &&
      !((x === 4 || x === 14) && (y === 6 || y === 14));
    const scene = (dx, exposeR, ring, aperture = 0) => {
      const b = webcam(aperture);
      if (dx != null) {
        for (let y = 6; y <= 14; y++) {
          for (let x = 4; x <= 14; x++) {
            if (!inCard(x, y) || x + dx >= N) continue;
            const X = x + dx;
            const edge = x === 4 || x === 14 || y === 6 || y === 14;
            const mark = PLAY.some(p => p[0] === x && p[1] === y);
            const exposed = exposeR != null && Math.hypot(X - LX, y - LY) <= exposeR;
            if (!exposed) b.put(X, y, edge || mark ? INK : 0);
            else if (edge && (X + y) % 2 === 0) b.under(X, y); // exposed: a dotted grey edge
          }
        }
      }
      if (ring) {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          if (Math.round(Math.hypot(x - LX, y - LY)) === ring) b.under(x, y);
        }
      }
      return b;
    };
    const rest = webcam(0);
    const story = [[rest, 120]];
    [12, 8, 4, 1].forEach(dx => story.push([scene(dx), 60]));
    story.push([scene(0), 300]);
    for (let r = 1; r <= 9; r++) story.push([scene(0, r, r), 65]);
    const exposed = scene(0, 99);
    story.push([exposed, 160]);
    const out = [scene(1, 99), scene(4, 99), scene(8, 99)];
    return {
      idle: [[rest, 2400], [webcam(1), 110], [webcam(2), 1100], [webcam(1), 110]],
      story: story.concat(flagIn(exposed)),
      resolve: flagToCheck(rest, out),
      reset: checkOut(rest),
      still: on(exposed, 'flag'),
      done: on(rest, 'k5')
    };
  }

  const ART = { 'face-swap': faceSwap, 'ai-tools': aiTools, avatar, camera };

  /* ---------- Compiled once per icon: every frame becomes two path strings ---------- */
  function seq(list) {
    let t = 0;
    const frames = list.map(([b, ms]) => ({ d: b.paths(), ms, b }));
    return { frames, ends: frames.map(f => (t += f.ms)), total: t };
  }
  const compiled = {};
  function artFor(id) {
    if (!compiled[id]) {
      const a = ART[id]();
      compiled[id] = {
        idle: seq(a.idle), story: seq(a.story), resolve: seq(a.resolve), reset: seq(a.reset),
        still: a.still.paths(), done: a.done.paths(), stillBits: a.still, doneBits: a.done
      };
    }
    return compiled[id];
  }

  /* ====================================================================== Clock */

  // Frames change in whole steps (50ms and up), so one timer wakes exactly when the next
  // frame is due for any running, visible icon (at most every 250ms during long holds), and
  // sleeps when nothing plays. No per-frame polling.
  let timer = 0;
  let last = 0;
  let ticking = false;
  const stepping = inst => inst.running && !inst.held && inst.live();
  function schedule() {
    let next = Infinity;
    instances.forEach(inst => { if (stepping(inst)) next = Math.min(next, inst.untilNext()); });
    clearTimeout(timer);
    timer = next < Infinity && !frozen() ? setTimeout(tick, Math.max(4, Math.min(250, next / rate()))) : 0;
  }
  function tick() {
    timer = 0;
    if (frozen()) return;
    const now = performance.now();
    const dt = Math.min(250, Math.max(0, now - last)) * rate();
    last = now;
    ticking = true;
    instances.forEach(inst => { if (stepping(inst)) inst.advance(dt); });
    ticking = false;
    schedule();
  }
  function wake() {
    if (ticking || frozen()) return;
    if (!timer) last = performance.now();
    schedule();
  }
  // Clock time already elapsed since the last tick, so a sequence started between ticks
  // starts at its own frame 0 instead of skipping ahead.
  const sinceTick = () => (timer && !ticking ? (performance.now() - last) * rate() : 0);

  /* ====================================================================== One icon */

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  class Icon {
    constructor(mount) {
      this.mount = mount;
      this.id = mount.getAttribute('data-icon');
      this.art = artFor(this.id);
      this.inView = !('IntersectionObserver' in window);
      this.mode = 'auto';
      this.seq = null;
      this.running = false;
      this.held = false;
      this.timer = 0;
      mount.textContent = '';
      this.svg = el('svg', { class: `vi vi-${this.id}`, viewBox: `0 0 ${N} ${N}`, 'shape-rendering': 'crispEdges', 'aria-hidden': 'true', focusable: 'false' }, mount);
      this.grey = el('path', { class: 'vi-grey' }, this.svg);
      this.ink = el('path', { class: 'vi-ink' }, this.svg);
      this.fit();
      this.draw(this.art.idle.frames[0].d);
      this.keyShown = false;
      this.state = 'idle';
      mount.setAttribute('data-state', 'idle');
    }
    // Whole device pixels per cell, so no cell edge ever falls on a half pixel.
    fit() {
      const m = this.mount;
      const asked = parseFloat(getComputedStyle(m).getPropertyValue('--icon-size'));
      const w = asked || Math.min(m.clientWidth || 64, m.clientHeight || m.clientWidth || 64);
      const dpr = window.devicePixelRatio || 1;
      const px = (Math.max(1, Math.floor((w * dpr + .01) / N)) / dpr) * N;
      if (px !== this.px) {
        this.px = px;
        this.svg.style.width = `${px}px`;
        this.svg.style.height = `${px}px`;
      }
    }
    draw(d) {
      if (d === this.shown) return;
      this.shown = d;
      this.ink.setAttribute('d', d[0]);
      this.grey.setAttribute('d', d[1]);
    }
    live() { return this.inView && !document.hidden; }
    stop() {
      this.running = false;
      this.onEnd = null;
      clearTimeout(this.timer);
    }
    play(s, loop, onEnd) {
      this.seq = s;
      this.loop = loop;
      this.onEnd = onEnd || null;
      this.t = -sinceTick();
      this.running = true;
      this.held = false;
      this.render();
      wake();
    }
    wait(ms, onEnd) { this.play({ frames: [{ d: this.shown, ms }], ends: [ms], total: ms }, false, onEnd); }
    render() {
      const s = this.seq;
      let i = 0;
      while (i < s.frames.length - 1 && this.t >= s.ends[i]) i++;
      this.i = i;
      this.draw(s.frames[i].d);
    }
    // Sequence time (ms) until the current frame ends.
    untilNext() { return Math.max(1, this.seq.ends[this.i] - this.t); }
    advance(dt) {
      const s = this.seq;
      this.t += dt;
      if (this.t >= s.total) {
        if (this.loop) this.t %= s.total;
        else {
          this.t = s.total;
          this.running = false;
          this.render();
          const done = this.onEnd;
          this.onEnd = null;
          if (done) done();
          return;
        }
      }
      this.render();
    }
    showKey() {
      this.keyShown = true;
      this.draw(this.state === 'resolved' ? this.art.done : this.art.still);
    }
    go(state) {
      const from = this.state;
      this.state = state;
      this.mount.setAttribute('data-state', state);
      this.stop();
      if (frozen()) {
        this.showKey();
        if (state === 'resolved') this.timer = setTimeout(() => this.go('idle'), RESOLVED_HOLD);
        return;
      }
      const shown = this.keyShown;
      this.keyShown = false;
      const a = this.art;
      if (state === 'idle') {
        // Leaving the resolved beat, the check steps out first; anything else cuts to rest.
        if (from === 'resolved' && !shown) this.play(a.reset, false, () => this.play(a.idle, true));
        else this.play(a.idle, true);
      } else if (state === 'scanning') {
        this.storyDone = false;
        this.play(a.story, false, () => this.storyEnd());
      } else {
        this.wantResolve = false;
        this.play(a.resolve, false, () => this.go('idle'));
      }
    }
    storyEnd() {
      this.storyDone = true;
      if (this.wantResolve || this.mode === 'auto') { this.go('resolved'); return; }
      if (this.mode === 'manual') this.wait(REPEAT_GAP, () => this.go('scanning'));
      else this.wait(EVENT_HOLD, () => this.go('resolved')); // `complete` never came
    }
    scan(mode) { this.mode = mode; this.wantResolve = false; this.go('scanning'); }
    resolve(mode) {
      this.mode = mode;
      if (!frozen() && this.state === 'scanning' && !this.storyDone) { this.wantResolve = true; return; }
      this.go('resolved');
    }
    force(state, mode) {
      if (state === 'scanning') this.scan(mode);
      else { this.mode = mode; this.go(state); }
    }
    refresh() {
      this.fit();
      if (frozen()) {
        if (!this.keyShown) { this.stop(); this.showKey(); }
        return;
      }
      this.held = false;
      if (this.keyShown || !this.seq) this.go('idle');
      else wake();
    }
  }

  /* ====================================================================== Wiring */

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(en => {
      const inst = byMount.get(en.target);
      if (!inst) return;
      inst.inView = en.isIntersecting;
      inst.refresh();
    }), { rootMargin: '60px' })
    : null;
  const ro = 'ResizeObserver' in window ? new ResizeObserver(entries => entries.forEach(en => byMount.get(en.target)?.fit())) : null;

  function mount(node) {
    if (byMount.has(node) || !ART[node.getAttribute('data-icon')]) return byMount.get(node);
    const inst = new Icon(node);
    instances.push(inst);
    byMount.set(node, inst);
    if (io) io.observe(node);
    if (ro) ro.observe(node);
    inst.refresh();
    return inst;
  }
  const refreshAll = () => instances.forEach(i => i.refresh());

  function targets(t) {
    if (!t) return instances.slice();
    if (typeof t !== 'string') return instances.filter(i => i.mount === t);
    if (IDS.includes(t)) return instances.filter(i => i.id === t);
    const nodes = Array.from(document.querySelectorAll(t));
    return instances.filter(i => nodes.includes(i.mount));
  }

  document.addEventListener('verified-check', e => {
    const d = (e && e.detail) || {};
    if (!IDS.includes(d.id)) return;
    lastEventAt = performance.now();
    instances.forEach(i => {
      if (i.id !== d.id || (!i.inView && !frozen())) return;
      if (d.state === 'active') i.scan('event');
      else if (d.state === 'complete') i.resolve('event');
    });
  });

  // Fallback director: without SCENE events, one icon at a time tells its story.
  let turn = 0;
  function direct() {
    if (!autoStories || frozen() || document.hidden) return;
    if (performance.now() - lastEventAt < QUIET_MS) return;
    for (let k = 0; k < IDS.length; k++) {
      const id = IDS[(turn + k) % IDS.length];
      const group = instances.filter(i => i.id === id && i.inView && i.state === 'idle');
      if (group.length) {
        group.forEach(i => i.scan('auto'));
        turn = (turn + k + 1) % IDS.length;
        return;
      }
    }
  }

  function init() {
    // .px-icon spans belong to the design system's own pixel sheet.
    document.querySelectorAll('[data-icon]:not(.px-icon)').forEach(mount);
    if (M()) M().onChange(refreshAll);
    else {
      document.addEventListener('visibilitychange', refreshAll);
      matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', refreshAll);
    }
    // Zoom or a move to another screen changes the device pixel ratio: re-fit the cells.
    const refit = () => instances.forEach(i => i.fit());
    window.addEventListener('resize', refit);
    (function watchRatio() {
      const q = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      if (q.addEventListener) q.addEventListener('change', () => { refit(); watchRatio(); }, { once: true });
    })();
    setTimeout(() => { direct(); setInterval(direct, DIRECTOR_MS); }, 4000);
  }

  const api = {
    ids: IDS.slice(),
    states: STATES.slice(),
    mount,
    refresh: refreshAll,
    setState(target, state) {
      if (!STATES.includes(state)) return;
      lastEventAt = performance.now();
      targets(target).forEach(i => i.force(state, 'manual'));
    },
    // QA: hold the current state's frames at a given second (resume with refresh()).
    seek(target, seconds) {
      targets(target).forEach(i => {
        if (!i.seq || frozen()) return;
        i.held = true;
        i.t = Math.max(0, Math.min(i.seq.total, seconds * 1000));
        i.render();
      });
    },
    setStatic(flag) { forceStatic = !!flag; refreshAll(); },
    isStatic,
    setAuto(flag) { autoStories = !!flag; },
    setSpeed(k) { speed = Math.max(.1, +k || 1); },
    // Lab / review: every frame of an icon as text rows with its duration in ms.
    sheets(id) {
      if (!ART[id]) return null;
      const a = artFor(id);
      const list = s => s.frames.map(f => ({ ms: f.ms, rows: f.b.text() }));
      return { idle: list(a.idle), story: list(a.story), resolve: list(a.resolve), reset: list(a.reset), still: a.stillBits.text(), done: a.doneBits.text() };
    }
  };
  window.VerifiedStatIcons = api;
  // The design system's pixel sheet (vendor/verified-ds/js/pixel-icons.js) also publishes
  // window.VerifiedIcons and loads after this file on the landing page. Share the global:
  // add these methods to whichever object holds it, never replacing the sheet's own.
  function share() {
    const host = window.VerifiedIcons;
    if (!host) { window.VerifiedIcons = api; return; }
    if (host !== api) Object.keys(api).forEach(k => { if (!(k in host)) host[k] = api[k]; });
  }
  share();
  document.addEventListener('DOMContentLoaded', share, { once: true });
  window.addEventListener('load', share, { once: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
