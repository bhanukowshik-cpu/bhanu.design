// Dev tool (12 Nov 2026): find a painted device's flat-black screen in a chapter painting and return its four corners
// (TL, TR, BR, BL in painting pixels) for chapters-lab.html's data-quad. Run in a localhost page:
//   const { findQuad } = await import('/tools/find-screen-quad.js');
//   await findQuad('city/layers/chapters/vc-office.webp', .45, .95, .25, .8, 45)
// x0..x1 / y0..y1 = search window as fractions of the image; thr = max R+G+B counted as "screen black"
// (use ~30 for night paintings). It flood-fills the largest black blob and takes its extreme corners.
export async function findQuad(src, x0 = .45, x1 = .95, y0 = .25, y1 = .8, thr = 45) {
  const im = new Image(); im.src = src + '?' + Date.now(); await im.decode();
  const W = im.naturalWidth, H = im.naturalHeight, c = document.createElement('canvas');
  c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, W, H).data;
  const dk = (x, y) => { const i = (y * W + x) * 4; return d[i] + d[i + 1] + d[i + 2] < thr; };
  let best = null; const seen = new Uint8Array(W * H);
  for (let y = Math.floor(H * y0); y < H * y1; y += 6) for (let x = Math.floor(W * x0); x < W * x1; x += 6) {
    if (seen[y * W + x] || !dk(x, y)) continue;
    const st = [[x, y]], pts = []; seen[y * W + x] = 1;
    while (st.length) {
      const [px, py] = st.pop(); pts.push([px, py]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx; if (!seen[j] && dk(nx, ny)) { seen[j] = 1; st.push([nx, ny]); }
      }
    }
    if (!best || pts.length > best.length) best = pts;
  }
  let tl, tr, bl, br;
  for (const [x, y] of best) {
    if (!tl || x + y < tl[0] + tl[1]) tl = [x, y];
    if (!br || x + y > br[0] + br[1]) br = [x, y];
    if (!tr || x - y > tr[0] - tr[1]) tr = [x, y];
    if (!bl || y - x > bl[1] - bl[0]) bl = [x, y];
  }
  return { W, H, n: best.length, tl, tr, br, bl };
}
