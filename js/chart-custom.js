/* =========================================================
   Grafik garis SVG buatan sendiri + SHA-256
   Tidak membutuhkan Chart.js / CDN sehingga data SELALU muncul.
   ========================================================= */

/* ---------- SHA-256 (sinkron, murni JS) ---------- */
function sha256(msg) {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const bytes = Array.from(new TextEncoder().encode(msg));
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 0xff);
  let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < bytes.length; o += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i++) w[i] = (bytes[o+4*i] << 24) | (bytes[o+4*i+1] << 16) | (bytes[o+4*i+2] << 8) | bytes[o+4*i+3];
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15] >>> 3);
      const s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2] >>> 10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
    }
    let [a,b,c,d,e,f,g,h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H = [H[0]+a|0,H[1]+b|0,H[2]+c|0,H[3]+d|0,H[4]+e|0,H[5]+f|0,H[6]+g|0,H[7]+h|0];
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

/* ---------- Grafik garis SVG ---------- */
/*
  cfg = { labels:[], series:[{name,color,values:[],dash?,area?}] }
*/
const _charts = new Map();

function drawLineChart(container, cfg) {
  _charts.set(container, cfg);
  const W = Math.max(container.clientWidth, 320);
  const H = Math.max(container.clientHeight, 300);
  const m = { t: 40, r: 24, b: 40, l: 78 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const n = cfg.labels.length;

  const all = [];
  cfg.series.forEach(s => s.values.forEach(v => { if (v != null) all.push(v); }));
  let lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
  const pad = (hi - lo) * 0.12 || hi * 0.02;
  lo -= pad; hi += pad;

  const x = i => m.l + (n === 1 ? iw / 2 : i * iw / (n - 1));
  const y = v => m.t + ih - (v - lo) / (hi - lo) * ih;

  let svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik harga">';

  // grid horizontal + label sumbu Y
  for (let g = 0; g <= 4; g++) {
    const v = lo + (hi - lo) * g / 4, yy = y(v);
    svg += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + yy + '" y2="' + yy + '" class="c-grid"/>';
    svg += '<text x="' + (m.l - 10) + '" y="' + (yy + 4) + '" text-anchor="end" class="c-axis">' + Math.round(v).toLocaleString('id-ID') + '</text>';
  }
  // label sumbu X
  const step = Math.max(1, Math.ceil(n / Math.floor(iw / 70)));
  for (let i = 0; i < n; i += step) {
    svg += '<text x="' + x(i) + '" y="' + (H - m.b + 22) + '" text-anchor="middle" class="c-axis">' + cfg.labels[i] + '</text>';
  }

  // garis "hari ini" (batas historis vs proyeksi)
  const first = cfg.series[0].values;
  let lastActual = -1;
  first.forEach((v, i) => { if (v != null) lastActual = i; });
  if (lastActual >= 0 && lastActual < n - 1) {
    svg += '<line x1="' + x(lastActual) + '" x2="' + x(lastActual) + '" y1="' + m.t + '" y2="' + (m.t + ih) + '" class="c-today"/>';
    svg += '<text x="' + (x(lastActual) + 6) + '" y="' + (m.t + 12) + '" class="c-axis">Hari ini</text>';
  }

  // seri
  cfg.series.forEach(s => {
    let d = '', started = false, firstI = -1, lastI = -1;
    s.values.forEach((v, i) => {
      if (v == null) return;
      d += (started ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1);
      started = true; if (firstI < 0) firstI = i; lastI = i;
    });
    if (s.area && started) {
      svg += '<path d="' + d + 'L' + x(lastI) + ',' + (m.t + ih) + 'L' + x(firstI) + ',' + (m.t + ih) + 'Z" fill="' + s.color + '" opacity="0.10"/>';
    }
    svg += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"' + (s.dash ? ' stroke-dasharray="7 6"' : '') + '/>';
  });

  svg += '<line id="c-cursor" x1="0" x2="0" y1="' + m.t + '" y2="' + (m.t + ih) + '" class="c-cursor" style="display:none"/>';
  svg += '<g id="c-dots"></g>';
  svg += '<rect x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + ih + '" fill="transparent" class="c-hit"/>';
  svg += '</svg>';

  // legenda
  let legend = '<div class="c-legend">';
  cfg.series.forEach(s => {
    legend += '<span><i style="background:' + s.color + ';' + (s.dash ? 'background:repeating-linear-gradient(90deg,' + s.color + ' 0 5px,transparent 5px 9px)' : '') + '"></i>' + s.name + '</span>';
  });
  legend += '</div>';

  container.innerHTML = legend + svg + '<div class="c-tip" hidden></div>';

  // interaksi tooltip
  const svgEl = container.querySelector('svg');
  const tip = container.querySelector('.c-tip');
  const cursor = svgEl.querySelector('#c-cursor');
  const dots = svgEl.querySelector('#c-dots');
  const hit = svgEl.querySelector('.c-hit');

  hit.addEventListener('mousemove', ev => {
    const r = svgEl.getBoundingClientRect();
    const px = ev.clientX - r.left;
    let i = Math.round((px - m.l) / iw * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    cursor.setAttribute('x1', x(i)); cursor.setAttribute('x2', x(i)); cursor.style.display = '';
    let html = '<b>' + cfg.labels[i] + '</b>', dd = '';
    cfg.series.forEach(s => {
      const v = s.values[i];
      if (v != null) {
        html += '<div><i style="background:' + s.color + '"></i>' + s.name + ': <b>' + rupiah(v) + '</b></div>';
        dd += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="4.5" fill="' + s.color + '" stroke="#fff" stroke-width="2"/>';
      }
    });
    dots.innerHTML = dd;
    tip.innerHTML = html; tip.hidden = false;
    const cr = container.getBoundingClientRect();
    let left = ev.clientX - cr.left + 14;
    if (left + 230 > cr.width) left = ev.clientX - cr.left - 240;
    tip.style.left = left + 'px'; tip.style.top = (ev.clientY - cr.top + 12) + 'px';
  });
  hit.addEventListener('mouseleave', () => { cursor.style.display = 'none'; dots.innerHTML = ''; tip.hidden = true; });
}

window.addEventListener('resize', () => {
  _charts.forEach((cfg, el) => { if (document.body.contains(el) && el.offsetParent !== null) drawLineChart(el, cfg); });
});
