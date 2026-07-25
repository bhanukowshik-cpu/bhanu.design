/* ═══════════════════════════════════════════════════════════════════════════
   REEL — a scroll-scrubbed frame sequence.

   Why frames and not <video>: seeking an encoded video on every scroll event
   judders. The decoder has to walk to the nearest keyframe and re-decode
   forward, so scrubbing backwards is worse than forwards and neither is
   frame-accurate. Decoding once into images and blitting the right one is
   exact, symmetric, and costs nothing per frame — which is why the product
   pages that do this well all ship sequences rather than video.

   Public API
     var reel = Reel.create(canvas, {
       src: function (i) { return 'images/portal/f' + pad(i) + '.webp'; },
       count: 120,
       onProgress: function (loaded, total) {},
       onReady: function () {}
     });
     reel.draw(progress);        // 0..1
     reel.ready                  // false until enough frames have decoded
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function create(canvas, opts) {
    var count = opts.count | 0;
    if (!canvas || !count) return null;

    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;

    var frames = new Array(count);
    var loaded = 0, shown = -1, W = 0, H = 0;
    var api = { ready: false, loadedCount: 0, total: count };

    /* Decode in order but a few at a time. In-order matters: the first frames
       are the ones needed first, so the transition can start before the tail
       of the sequence has arrived. */
    var CONCURRENCY = 6, next = 0;

    function pump() {
      while (next < count && (next - loaded) < CONCURRENCY) {
        (function (i) {
          var im = new Image();
          im.decoding = 'async';
          im.onload = function () {
            frames[i] = im;
            loaded++; api.loadedCount = loaded;
            if (opts.onProgress) opts.onProgress(loaded, count);
            /* usable as soon as the opening beats exist — the rest streams in
               while the visitor is still reading the hero */
            if (!api.ready && loaded >= Math.min(count, 12)) {
              api.ready = true;
              if (opts.onReady) opts.onReady();
            }
            pump();
          };
          im.onerror = function () {
            loaded++; api.loadedCount = loaded;                 // don't stall the queue
            pump();
          };
          im.src = opts.src(i);
        })(next);
        next++;
      }
    }
    pump();

    function size() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var w = canvas.clientWidth || canvas.width || (global.screen && screen.width) || 1280;
      var h = canvas.clientHeight || canvas.height || (global.screen && screen.height) || 720;
      w = Math.max(2, Math.round(w * dpr)); h = Math.max(2, Math.round(h * dpr));
      if (w !== W || h !== H) {
        W = w; H = h; canvas.width = w; canvas.height = h;
        shown = -1;                                             // force a repaint
      }
    }

    /* nearest decoded frame, so a gap in the queue never blanks the canvas */
    function pick(i) {
      if (frames[i]) return frames[i];
      for (var d = 1; d < count; d++) {
        if (i - d >= 0 && frames[i - d]) return frames[i - d];
        if (i + d < count && frames[i + d]) return frames[i + d];
      }
      return null;
    }

    function draw(p) {
      size();
      var i = Math.round(clamp01(p) * (count - 1));
      if (i === shown && shown >= 0) return;
      var im = pick(i);
      if (!im) return;
      shown = i;
      /* cover-fit — the sequence is 16:9 but the viewport is anything */
      var sw = im.naturalWidth, sh = im.naturalHeight;
      var scale = Math.max(W / sw, H / sh);
      var dw = sw * scale, dh = sh * scale;
      ctx.drawImage(im, (W - dw) * 0.5, (H - dh) * 0.5, dw, dh);
    }

    api.draw = draw;
    api.resize = size;
    api.dispose = function () { frames.length = 0; };
    return api;
  }

  global.Reel = { create: create };
})(window);
