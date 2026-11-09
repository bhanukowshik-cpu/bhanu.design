/* Verified Call live demo. A cursor clicks the Verified badge in a Meet call,
   the panel opens, checks turn Verified one by one, then one finding appears.
   Runs only while on screen. Fires a 'vcstate' event (checking | ok | look)
   so a page can show the current state; el.vcShow(state) freezes on one. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  [].forEach.call(document.querySelectorAll('.vcd'), function (d) {
    var base = d.className, stg = d.querySelector('.stg'), cur = d.querySelector('.cur'), x = d.querySelector('.x'),
        bdg = d.querySelector('.bdg'), rows = {}, timers = [], on = false, frozen = false;
    [].forEach.call(d.querySelectorAll('.r'), function (r) { rows[r.dataset.k] = r; });
    var KEYS = ['cam', 'face', 'voice', 'hid', 'open'];

    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function emit(s) { d.dispatchEvent(new CustomEvent('vcstate', { detail: s })); }
    function pos(px, py, dur) {
      cur.style.transitionDuration = (dur || 0) + 'ms';
      cur.style.transform = 'translate(' + px + 'px,' + py + 'px)';
    }
    /* positions are in the stage's own (unzoomed) pixels, so they hold while it zooms */
    function local(el, fx, fy) {
      var s = stg.getBoundingClientRect(), b = el.getBoundingClientRect(), k = s.width / stg.offsetWidth;
      return [(b.left - s.left + b.width * fx) / k, (b.top - s.top + b.height * fy) / k];
    }
    function moveTo(el, fx, fy, dur) { var p = local(el, fx, fy); pos(p[0], p[1], dur); }
    /* Screen Studio style camera: zoom k toward an element, edges never show */
    function zoom(el, k, dur) {
      var W = stg.offsetWidth, H = stg.offsetHeight, tx = 0, ty = 0;
      if (el && k > 1) {
        /* the part of the demo the visitor can see (a card may crop it) */
        var a = d.getBoundingClientRect(), c = d.parentElement.getBoundingClientRect(), r = a.width / W;
        var L = Math.max(0, (c.left - a.left) / r), R = Math.min(W, (c.right - a.left) / r),
            T = Math.max(0, (c.top - a.top) / r), B = Math.min(H, (c.bottom - a.top) / r);
        var p = local(el, .5, .5), s = stg.getBoundingClientRect(), b = el.getBoundingClientRect(), kk = s.width / W;
        /* never zoom past the point where the target stops fitting */
        k = Math.max(1, Math.min(k, (B - T) * .88 / (b.height / kk), (R - L) * .88 / (b.width / kk)));
        tx = Math.min(L, Math.max(R - W * k, (L + R) / 2 - p[0] * k));
        ty = Math.min(T, Math.max(B - H * k, (T + B) / 2 - p[1] * k));
      } else k = 1;
      stg.style.transitionDuration = (dur == null ? 1100 : dur) + 'ms';
      stg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + k + ')';
    }
    function park(dur) { pos(stg.offsetWidth * .8, stg.offsetHeight * 1.05, dur); }
    function click() {
      cur.classList.remove('dn'); void cur.offsetWidth; cur.classList.add('dn');
      setTimeout(function () { cur.classList.remove('dn'); }, 180);
    }
    function reset() {
      d.className = base;
      KEYS.forEach(function (k) { rows[k].className = 'r'; });
      x.classList.remove('hov'); cur.classList.remove('hand', 'dn'); zoom(null, 1, 0); park(0);
    }
    function state(s) {
      clear(); reset(); d.classList.add('vc-open');
      if (s !== 'checking') { KEYS.forEach(function (k) { rows[k].classList.add('v'); }); d.classList.add('vc-ok'); }
      else { rows.cam.classList.add('v'); rows.face.classList.add('v'); }
      if (s === 'look') { rows.open.className = 'r a'; d.classList.add('vc-look'); }
      emit(s);
    }
    function run() {
      clear(); reset(); emit('checking');
      at(400, function () { moveTo(bdg, .5, .6, 1200); });
      at(900, function () { zoom(bdg, 1.55, 1000); });
      at(1500, function () { cur.classList.add('hand'); });
      at(1700, click);
      at(2050, function () { cur.classList.remove('hand'); });
      at(1850, function () { d.classList.add('vc-open'); });
      at(2200, function () { zoom(d.querySelector('.pnl'), 1.45, 1200); });
      at(2300, function () { moveTo(rows.voice, .92, 1.6, 1400); });
      KEYS.forEach(function (k, i) { at(2600 + i * 450, function () { rows[k].classList.add('v'); }); });
      at(4900, function () { d.classList.add('vc-ok'); emit('ok'); });
      at(6300, function () { rows.open.className = 'r a'; d.classList.add('vc-look'); emit('look'); });
      at(6700, function () { moveTo(rows.open, .55, .45, 900); });
      at(7500, function () { rows.open.classList.add('hov'); });
      at(8900, function () { zoom(null, 1, 1100); });
      at(9300, function () { rows.open.classList.remove('hov'); moveTo(x, .5, .55, 900); });
      at(10100, function () { x.classList.add('hov'); cur.classList.add('hand'); });
      at(10400, click);
      at(10550, function () { d.classList.remove('vc-open'); });
      at(10900, function () { cur.classList.remove('hand'); });
      at(11000, function () { park(900); });
      at(12200, function () { if (on && !frozen) run(); });
    }

    d.vcShow = function (s) { frozen = true; state(s); };
    d.vcPlay = function () { frozen = false; if (on) run(); };

    if (reduce) { state('look'); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !on) { on = true; if (!frozen) run(); }
        else if (!e.isIntersecting && on) { on = false; if (!frozen) { clear(); reset(); } }
      });
    }, { threshold: .35 }).observe(d);
  });
})();
