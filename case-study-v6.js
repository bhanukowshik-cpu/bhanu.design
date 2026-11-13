/* CASE STUDY v6 — the painted chapter scene behind a case study's hero, time-true like the homepage (12 Nov 2026).
   Markup: <img class="cs-scene-img" data-scene="city/layers/chapters/vc-office" alt="" decoding="async" fetchpriority="high">
   Picks <scene>-night.webp / <scene>-day.webp / <scene>.webp (golden) from San Francisco's real sun, the same formula
   and thresholds as index.html; ?alt=N forces the sun altitude. Load with <script src="case-study-v6.js"></script>
   right after the img (not defer), so the right painting is requested first. */
(function () {
  function sunAlt(ms) {
    var R = Math.PI / 180, d = ms / 864e5 + 2440587.5 - 2451545, g = (357.529 + .98560028 * d) * R, q = 280.459 + .98564736 * d;
    var L = (q + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * R, e = (23.439 - .00000036 * d) * R;
    var RA = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
    var GMST = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24, HA = (GMST * 15 - 122.4194) * R - RA, p = 37.7749 * R;
    return Math.asin(Math.sin(p) * Math.sin(dec) + Math.cos(p) * Math.cos(dec) * Math.cos(HA)) / R;
  }
  var f = new URLSearchParams(location.search).get('alt'), a = f != null ? +f : sunAlt(Date.now());
  var k = a < -4 ? '-night' : a > 12 ? '-day' : '';
  document.documentElement.setAttribute('data-sf', k ? k.slice(1) : 'golden');
  [].forEach.call(document.querySelectorAll('img[data-scene]'), function (im) { if (!im.getAttribute('src')) im.src = im.dataset.scene + k + '.webp'; });
})();
