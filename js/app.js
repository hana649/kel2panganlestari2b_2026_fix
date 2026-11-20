/* =========================================================
   PanganLestari - Logika aplikasi
   ========================================================= */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- penyimpanan (aman jika localStorage diblokir) ---------- */
  const store = {
    get(k, def) { try { const v = localStorage.getItem('pl_' + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem('pl_' + k, JSON.stringify(v)); } catch (e) { /* diabaikan */ } }
  };

  /* ---------- state ---------- */
  const state = {
    role: store.get('role', 'admin'),
    th: store.get('th', Object.assign({}, DEFAULT_THRESHOLDS)),
    prices: store.get('prices', {}),
    query: '',
    chartId: 'beras_premium',
    horizon: 7,
    lastForecast: null,
    blocks: store.get('blocks', null)
  };

  const list = () => COMMODITIES.map(c => Object.assign({}, c, { price: state.prices[c.id] != null ? state.prices[c.id] : c.price }));
  const byId = id => list().find(c => c.id === id);
  const matches = c => !state.query || (c.name + ' ' + c.region).toLowerCase().includes(state.query);
  const pill = s => '<span class="pill ' + s + '">' + s.charAt(0).toUpperCase() + s.slice(1) + '</span>';
  const signed = d => (d >= 0 ? '+' : '') + pct(d);

  function paintIcons(root) {
    $$('[data-icon]', root).forEach(el => { if (!el.firstChild) el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 20); });
  }

  /* ---------- navigasi ---------- */
  const titles = {
    dashboard: ['Dashboard Utama Ketahanan Pangan', 'Pemantauan stok proksi harga, prediksi LSTM, dan peringatan dini wilayah Papua Barat'],
    forecast:  ['Peramalan LSTM', 'Simulasi proyeksi harga komoditas menggunakan model LSTM 4-layer'],
    commodity: ['Data Komoditas', 'Harga terkini, deviasi terhadap harga acuan, dan estimasi ketersediaan stok'],
    macro:     ['Indikator Cuaca & Makro', 'Variabel eksogen yang memengaruhi harga dan pasokan pangan'],
    chain:     ['Verifikasi Blockchain', 'Integritas hasil prediksi dijamin hash SHA-256 berantai'],
    alerts:    ['Notifikasi Early Warning', 'Peringatan dini komoditas berstatus Waspada dan Kritis'],
    reports:   ['Ekspor Laporan', 'Unduh data dan proyeksi dalam format CSV']
  };
  function go(id) {
    if (!titles[id]) id = 'dashboard';
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.target === id));
    $$('.page').forEach(p => p.classList.toggle('active', p.id === id));
    $('#page-title').textContent = titles[id][0];
    $('#page-sub').textContent = titles[id][1];
    if (id === 'dashboard') drawMain();
    if (id === 'forecast' && state.lastForecast) drawForecastChart();
  }
  $$('.nav-item').forEach(n => n.addEventListener('click', e => { e.preventDefault(); history.replaceState(null, '', '#' + n.dataset.target); go(n.dataset.target); }));

  /* ---------- peran Admin / Publik ---------- */
  function applyRole() {
    document.body.classList.toggle('public', state.role === 'public');
    $$('#role-switch button').forEach(b => b.classList.toggle('active', b.dataset.role === state.role));
    renderCommodityTable();
  }
  $$('#role-switch button').forEach(b => b.addEventListener('click', () => { state.role = b.dataset.role; store.set('role', state.role); applyRole(); }));

  /* ---------- kartu statistik ---------- */
  function renderStats() {
    const all = list();
    const cnt = { aman: [], waspada: [], kritis: [] };
    all.forEach(c => cnt[statusOf(c, state.th)].push(c));
    const avgMape = all.reduce((a, c) => a + c.mape, 0) / all.length;
    const names = a => a.slice(0, 4).map(c => c.name).join(', ') + (a.length > 4 ? ', dll.' : '');
    $('#stats').innerHTML =
      '<div class="stat"><div class="lbl">Status Aman (Pasokan Stabil)</div><div class="val">' + cnt.aman.length + '</div><div class="sub">Komoditas dengan deviasi &lt; ' + pct(state.th.warn) + '. ' + names(cnt.aman) + '</div></div>' +
      '<div class="stat warn"><div class="lbl">Status Waspada (Perlu Pantau)</div><div class="val">' + cnt.waspada.length + '</div><div class="sub">Deviasi ' + pct(state.th.warn) + '–' + pct(state.th.crit - 0.1) + '. ' + (cnt.waspada.length ? names(cnt.waspada) : 'Tidak ada') + '</div></div>' +
      '<div class="stat crit"><div class="lbl">Status Kritis (Intervensi Segera)</div><div class="val">' + cnt.kritis.length + '</div><div class="sub">Lonjakan ≥ ' + pct(state.th.crit) + '. ' + (cnt.kritis.length ? names(cnt.kritis) : 'Tidak ada') + '</div></div>' +
      '<div class="stat"><div class="lbl">Akurasi Rata-rata Model LSTM</div><div class="val">' + pct(100 - avgMape, 2) + '</div><div class="sub">MAPE rata-rata ' + pct(avgMape, 2) + ' pada ' + all.length + ' komoditas</div></div>';
    $('#m-mape').textContent = pct(avgMape, 2);
    $('#alert-badge').textContent = cnt.waspada.length + cnt.kritis.length;
    $('#alert-badge').hidden = (cnt.waspada.length + cnt.kritis.length) === 0;
  }

  /* ---------- grafik utama ---------- */
  function drawMain() {
    const c = byId(state.chartId);
    const s = buildSeries(c, state.horizon);
    $('#chart-sub').textContent = c.name + ' · Rp/' + c.unit + ' · ' + state.horizon + ' hari historis + ' + state.horizon + ' hari proyeksi';
    drawLineChart($('#main-chart'), {
      labels: s.labels,
      series: [
        { name: 'Harga Historis (Rp/' + c.unit + ')', color: '#12714f', values: s.actual, area: true },
        { name: 'Proyeksi LSTM', color: '#e08a1e', values: s.forecast, dash: true }
      ]
    });
  }
  function fillSelect(sel, val) {
    sel.innerHTML = COMMODITIES.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
    sel.value = val;
  }
  fillSelect($('#chart-commodity'), state.chartId);
  fillSelect($('#fc-commodity'), 'beras_premium');
  $('#chart-commodity').addEventListener('change', e => { state.chartId = e.target.value; drawMain(); });
  $$('#chart-horizon button').forEach(b => b.addEventListener('click', () => {
    $$('#chart-horizon button').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); state.horizon = +b.dataset.h; drawMain();
  }));

  /* ---------- tabel ---------- */
  function renderWatch() {
    const rows = list().filter(c => statusOf(c, state.th) !== 'aman' && matches(c))
      .sort((a, b) => deviation(b) - deviation(a));
    $('#tbl-watch').innerHTML =
      '<thead><tr><th>Komoditas</th><th>Wilayah</th><th class="num">Harga Saat Ini</th><th class="num">Harga Acuan</th><th class="num">Deviasi</th><th class="num">Prediksi 30 Hari</th><th>Status</th></tr></thead><tbody>' +
      (rows.length ? rows.map(c => '<tr><td><b>' + c.name + '</b></td><td>' + c.region + '</td><td class="num">' + rupiah(c.price) + '</td><td class="num">' + rupiah(c.ref) +
        '</td><td class="num up">' + signed(deviation(c)) + '</td><td class="num">' + rupiah(c.fc30) + '</td><td>' + pill(statusOf(c, state.th)) + '</td></tr>').join('')
        : '<tr><td colspan="7" class="empty">Tidak ada komoditas yang cocok.</td></tr>') + '</tbody>';
  }

  function renderCommodityTable() {
    const admin = state.role === 'admin';
    const rows = list().filter(matches);
    $('#tbl-commodity').innerHTML =
      '<thead><tr><th>Komoditas</th><th>Wilayah</th><th class="num">Harga Saat Ini</th><th class="num">Harga Acuan</th><th class="num">Deviasi</th><th class="num">Prediksi LSTM 30h</th><th class="num">MAPE</th><th>Stok (ton)</th><th>Ketahanan</th><th>Status</th></tr></thead><tbody>' +
      (rows.length ? rows.map(c => {
        const d = deviation(c), st = statusOf(c, state.th), days = Math.round(c.stock / c.need * 30);
        const cover = Math.min(100, days / 45 * 100);
        const price = admin
          ? '<input type="number" min="1" step="50" value="' + c.price + '" data-id="' + c.id + '" class="price-edit">'
          : rupiah(c.price);
        return '<tr><td><b>' + c.name + '</b></td><td>' + c.region + '</td><td class="num">' + price + '</td><td class="num">' + rupiah(c.ref) +
          '</td><td class="num ' + (d > 0 ? 'up' : 'down') + '">' + signed(d) + '</td><td class="num">' + rupiah(c.fc30) + '</td><td class="num">' + pct(c.mape, 2) +
          '</td><td class="num">' + c.stock.toLocaleString('id-ID') + '</td><td><div class="bar" title="' + days + ' hari"><i class="' + (st === 'kritis' ? 'crit' : st === 'waspada' ? 'warn' : '') + '" style="width:' + cover + '%"></i></div><small>' + days + ' hari</small></td><td>' + pill(st) + '</td></tr>';
      }).join('') : '<tr><td colspan="10" class="empty">Tidak ada komoditas yang cocok.</td></tr>') + '</tbody>';
    $$('.price-edit').forEach(inp => inp.addEventListener('change', () => {
      const v = Math.round(+inp.value);
      if (v > 0) { state.prices[inp.dataset.id] = v; store.set('prices', state.prices); refreshAll(); }
    }));
  }

  /* ---------- makro & notifikasi ---------- */
  function renderMacro() {
    $('#exo-grid').innerHTML = INDICATORS.map(i =>
      '<div class="exo ' + i.tone + '"><div class="ic">' + icon(i.icon, 22) + '</div><div><small>' + i.label + '</small><b>' + i.value + '</b><small>' + i.note + '</small></div></div>').join('');
  }
  function renderAlerts() {
    const items = list().filter(c => statusOf(c, state.th) !== 'aman').sort((a, b) => deviation(b) - deviation(a));
    $('#alert-list').innerHTML = items.length ? items.map(c => {
      const st = statusOf(c, state.th), d = deviation(c), days = Math.round(c.stock / c.need * 30);
      const act = st === 'kritis' ? 'Rekomendasi: operasi pasar & distribusi cadangan pangan segera.' : 'Rekomendasi: pantau harian dan siapkan pasokan tambahan.';
      return '<div class="alert ' + st + '">' + icon('alert', 24) + '<div><h4>' + pill(st) + ' &nbsp;' + c.name + ' — ' + c.region + '</h4><p>Harga ' + rupiah(c.price) + '/' + c.unit +
        ' (' + signed(d) + ' dari acuan ' + rupiah(c.ref) + '). Prediksi LSTM 30 hari: ' + rupiah(c.fc30) + '. Stok ±' + c.stock + ' ton (cukup ' + days + ' hari). ' + act + '</p></div></div>';
    }).join('') : '<p class="muted">Tidak ada peringatan aktif. Semua komoditas berstatus aman.</p>';
  }

  /* ---------- peramalan ---------- */
  async function fetchForecast(c, horizon) {
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 2500);
      const r = await fetch('api/forecast.php?commodity=' + c.id + '&horizon=' + horizon + '&price=' + c.price, { signal: ctrl.signal });
      clearTimeout(t);
      const j = await r.json();
      if (j && j.status === 'success' && Array.isArray(j.data)) return { data: j.data, source: 'API PHP (api/forecast.php)', metrics: j.metrics };
    } catch (e) { /* lanjut ke simulasi lokal */ }
    return { data: localForecast(c, horizon), source: 'Simulasi lokal di browser (PHP tidak aktif)', metrics: null };
  }
  function drawForecastChart() {
    const f = state.lastForecast; if (!f) return;
    const c = f.c, n = f.data.length;
    const hist = buildSeries(c, Math.min(n, 30));
    const hl = hist.actual.filter(v => v != null);
    const labels = hist.labels.slice(0, hl.length).concat(f.data.map(d => fmtDate(new Date(d.date))));
    drawLineChart($('#fc-chart'), {
      labels: labels,
      series: [
        { name: 'Harga Historis', color: '#12714f', values: hl.concat(new Array(n).fill(null)), area: true },
        { name: 'Proyeksi LSTM', color: '#e08a1e', dash: true, values: new Array(hl.length - 1).fill(null).concat([c.price], f.data.map(d => d.predicted_price)) }
      ]
    });
  }
  $('#forecast-form').addEventListener('submit', async e => {
    e.preventDefault();
    const c = byId($('#fc-commodity').value);
    const horizon = Math.max(1, Math.min(365, parseInt($('#fc-horizon').value, 10) || 30));
    $('#fc-horizon').value = horizon;
    $('#fc-hint').textContent = 'Menjalankan model…';
    const res = await fetchForecast(c, horizon);
    const hash = sha256(JSON.stringify(res.data));
    state.lastForecast = { c: c, data: res.data, hash: hash, horizon: horizon };
    const last = res.data[res.data.length - 1].predicted_price;
    $('#fc-meta').innerHTML =
      '<span><b>Komoditas:</b> ' + c.name + '</span><span><b>Horizon:</b> ' + horizon + ' hari</span>' +
      '<span><b>Harga akhir prediksi:</b> ' + rupiah(last) + ' (' + signed((last - c.price) / c.price * 100) + ')</span>' +
      '<span><b>Model:</b> LSTM 4-Layer (256-128-64-32), MAPE ' + pct(c.mape, 2) + '</span>' +
      '<span><b>Sumber:</b> ' + res.source + '</span>' +
      '<span style="flex-basis:100%"><b>Hash SHA-256:</b> <span class="hash">' + hash + '</span></span>';
    $('#fc-table').innerHTML = '<thead><tr><th>Hari ke-</th><th>Tanggal</th><th class="num">Prediksi Harga</th></tr></thead><tbody>' +
      res.data.map(d => '<tr><td>' + d.day + '</td><td>' + d.date + '</td><td class="num">' + rupiah(d.predicted_price) + '</td></tr>').join('') + '</tbody>';
    $('#fc-result').hidden = false; $('#fc-hint').hidden = true;
    drawForecastChart();
  });
  $('#fc-record').addEventListener('click', () => {
    const f = state.lastForecast; if (!f) return;
    addBlock(f.c.name, 'Prediksi ' + f.horizon + ' hari · hash data ' + f.hash.slice(0, 16) + '…');
    $('#fc-record').textContent = '✓ Tercatat di ledger';
    setTimeout(() => { $('#fc-record').innerHTML = icon('plus', 15) + ' Catat Hasil ke Ledger Blockchain'; }, 2000);
  });

  /* ---------- ledger blockchain ---------- */
  const ZERO = '0'.repeat(64);
  const blockHash = b => sha256([b.i, b.time, b.commodity, b.payload, b.prev].join('|'));
  function makeBlock(i, time, commodity, payload, prev) {
    const b = { i: i, time: time, commodity: commodity, payload: payload, prev: prev };
    b.hash = blockHash(b); return b;
  }
  function initialChain() {
    const seeds = [
      ['Genesis', 'Inisialisasi ledger PanganLestari'],
      ['Beras Premium', 'Prediksi 30 hari · MAPE 3,21%'],
      ['Cabai Rawit Merah', 'Prediksi 30 hari · MAPE 5,65%'],
      ['Beras Medium', 'Prediksi 90 hari · MAPE 3,05%'],
      ['Bawang Merah', 'Prediksi 7 hari · MAPE 5,10%']
    ];
    const out = []; let prev = ZERO;
    seeds.forEach((s, i) => { const b = makeBlock(i, isoDate(addDays(new Date(), i - seeds.length)) + ' 08:00', s[0], s[1], prev); out.push(b); prev = b.hash; });
    return out;
  }
  if (!Array.isArray(state.blocks) || !state.blocks.length) { state.blocks = initialChain(); store.set('blocks', state.blocks); }

  function addBlock(commodity, payload) {
    const prev = state.blocks[state.blocks.length - 1].hash;
    const now = new Date(); const t = isoDate(now) + ' ' + now.toTimeString().slice(0, 5);
    state.blocks.push(makeBlock(state.blocks.length, t, commodity, payload, prev));
    store.set('blocks', state.blocks); renderChain();
  }
  function renderChain(badIndex) {
    $('#tbl-chain').innerHTML = '<thead><tr><th>#</th><th>Waktu</th><th>Komoditas</th><th>Catatan</th><th>Hash Sebelumnya</th><th>Hash Blok</th><th>Status</th></tr></thead><tbody>' +
      state.blocks.slice().reverse().map(b => {
        const bad = badIndex != null && b.i >= badIndex;
        return '<tr><td>' + b.i + '</td><td>' + b.time + '</td><td><b>' + b.commodity + '</b></td><td>' + b.payload + '</td><td class="hash">' + b.prev.slice(0, 14) + '…</td><td class="hash">' + b.hash.slice(0, 14) + '…</td><td>' +
          (badIndex === undefined ? '<span class="pill">—</span>' : bad ? '<span class="pill kritis">Tidak valid</span>' : '<span class="pill aman">Valid</span>') + '</td></tr>';
      }).join('') + '</tbody>';
  }
  function verifyChain() {
    let bad = null;
    for (let k = 0; k < state.blocks.length; k++) {
      const b = state.blocks[k];
      const prevOk = k === 0 ? b.prev === ZERO : b.prev === state.blocks[k - 1].hash;
      if (!prevOk || blockHash(b) !== b.hash) { bad = k; break; }
    }
    const box = $('#chain-status'); box.hidden = false;
    if (bad === null) { box.className = 'chain-status ok'; box.textContent = '✓ Rantai valid — ' + state.blocks.length + ' blok terverifikasi, tidak ada data yang dimanipulasi.'; renderChain(null); }
    else { box.className = 'chain-status bad'; box.textContent = '✗ Manipulasi terdeteksi pada blok #' + bad + ' — hash tidak cocok dengan isi data.'; renderChain(bad); }
  }
  $('#chain-verify').addEventListener('click', verifyChain);
  $('#chain-tamper').addEventListener('click', () => {
    const k = Math.min(2, state.blocks.length - 1);
    state.blocks[k].payload = state.blocks[k].payload + ' [DIUBAH]';
    renderChain(); verifyChain();
  });
  $('#chain-reset').addEventListener('click', () => { state.blocks = initialChain(); store.set('blocks', state.blocks); $('#chain-status').hidden = true; renderChain(); });

  /* ---------- ekspor CSV ---------- */
  function download(name, text) {
    const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $('#btn-export-csv').addEventListener('click', () => {
    let csv = 'Komoditas,Wilayah,Satuan,Harga_Saat_Ini,Harga_Acuan,Deviasi_Persen,Prediksi_LSTM_30_Hari,MAPE_Persen,Stok_Ton,Status\n';
    list().forEach(c => { csv += [c.name, c.region, c.unit, c.price, c.ref, deviation(c).toFixed(2), c.fc30, c.mape, c.stock, statusOf(c, state.th)].join(',') + '\n'; });
    download('data_komoditas_pangan_lestari.csv', csv);
  });
  $('#btn-export-fc').addEventListener('click', () => {
    let csv = 'Tanggal,Komoditas,Harga_Saat_Ini,Prediksi_LSTM\n';
    list().forEach(c => localForecast(c, 30).forEach(d => { csv += [d.date, c.name, c.price, d.predicted_price].join(',') + '\n'; }));
    download('proyeksi_30_hari_pangan_lestari.csv', csv);
  });

  /* ---------- ambang batas & pencarian ---------- */
  function syncThresholdInputs() { $('#th-warn').value = state.th.warn; $('#th-crit').value = state.th.crit; }
  function onThreshold() {
    let w = parseFloat($('#th-warn').value), c = parseFloat($('#th-crit').value);
    if (!(w > 0)) w = DEFAULT_THRESHOLDS.warn;
    if (!(c > w)) c = w + 1;
    state.th = { warn: w, crit: c }; store.set('th', state.th); syncThresholdInputs(); refreshAll();
  }
  $('#th-warn').addEventListener('change', onThreshold);
  $('#th-crit').addEventListener('change', onThreshold);
  $('#th-reset').addEventListener('click', () => { state.th = Object.assign({}, DEFAULT_THRESHOLDS); state.prices = {}; store.set('th', state.th); store.set('prices', state.prices); syncThresholdInputs(); refreshAll(); });
  $('#search').addEventListener('input', e => { state.query = e.target.value.trim().toLowerCase(); renderWatch(); renderCommodityTable(); });

  function refreshAll() { renderStats(); renderWatch(); renderCommodityTable(); renderAlerts(); drawMain(); }

  /* ---------- mulai ---------- */
  paintIcons(document);
  syncThresholdInputs();
  renderMacro();
  renderChain();
  applyRole();
  refreshAll();
  go((location.hash || '#dashboard').slice(1));
})();
