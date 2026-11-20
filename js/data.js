/* =========================================================
   PanganLestari - Data & util dasar (tanpa dependensi luar)
   ========================================================= */

/* Ikon SVG inline (menggantikan FontAwesome CDN) */
const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  sprout: '<path d="M7 20h10"/><path d="M12 20v-9"/><path d="M12 11C12 7 9 5 5 5c0 4 2 6 7 6z"/><path d="M12 13c0-3 2-5 6-5 0 4-2 6-6 6"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  cloud: '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M16 14v6M8 14v6M12 16v6"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="m9 12 2 2 4-4"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  play: '<path d="m6 3 14 9-14 9z"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>'
};

function icon(name, size) {
  size = size || 18;
  return '<svg class="ico" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
}

/* Ambang batas status (dapat diubah admin) */
const DEFAULT_THRESHOLDS = { warn: 10, crit: 22 };

/*
  Data komoditas Papua Barat (simulasi proksi Bapanas & PIHPS).
  ref   = harga acuan (Rp/kg atau Rp/liter)
  price = harga saat ini
  fc30  = prediksi LSTM 30 hari ke depan
  mape  = MAPE model pada data uji (%)
  stock = estimasi stok (ton), need = kebutuhan per bulan (ton)
*/
const COMMODITIES = [
  { id: 'beras_premium', name: 'Beras Premium',      unit: 'kg',    ref: 14900,  price: 15250,  fc30: 15480,  mape: 3.21, stock: 1850, need: 1200, region: 'Manokwari' },
  { id: 'beras_medium',  name: 'Beras Medium',       unit: 'kg',    ref: 13500,  price: 13720,  fc30: 13900,  mape: 3.05, stock: 2300, need: 1500, region: 'Manokwari' },
  { id: 'minyak_goreng', name: 'Minyak Goreng',      unit: 'liter', ref: 17000,  price: 17400,  fc30: 17550,  mape: 3.84, stock: 640,  need: 420,  region: 'Sorong' },
  { id: 'gula_pasir',    name: 'Gula Pasir',         unit: 'kg',    ref: 18000,  price: 18300,  fc30: 18420,  mape: 3.60, stock: 520,  need: 380,  region: 'Sorong' },
  { id: 'daging_ayam',   name: 'Daging Ayam Ras',    unit: 'kg',    ref: 38000,  price: 39500,  fc30: 40300,  mape: 4.70, stock: 310,  need: 260,  region: 'Manokwari' },
  { id: 'tepung_terigu', name: 'Tepung Terigu',      unit: 'kg',    ref: 12000,  price: 12150,  fc30: 12240,  mape: 3.95, stock: 410,  need: 300,  region: 'Sorong' },
  { id: 'jagung',        name: 'Jagung Pipilan',     unit: 'kg',    ref: 6000,   price: 6200,   fc30: 6290,   mape: 4.10, stock: 280,  need: 150,  region: 'Manokwari' },
  { id: 'kedelai',       name: 'Kedelai Impor',      unit: 'kg',    ref: 11000,  price: 11350,  fc30: 11500,  mape: 4.35, stock: 190,  need: 120,  region: 'Sorong' },
  { id: 'ikan_kembung',  name: 'Ikan Kembung',       unit: 'kg',    ref: 36000,  price: 37200,  fc30: 37900,  mape: 4.90, stock: 150,  need: 110,  region: 'Manokwari' },
  { id: 'susu_kental',   name: 'Susu Kental Manis',  unit: 'kg',    ref: 14000,  price: 14300,  fc30: 14420,  mape: 3.70, stock: 120,  need: 80,   region: 'Sorong' },
  { id: 'garam',         name: 'Garam Beryodium',    unit: 'kg',    ref: 9500,   price: 9650,   fc30: 9720,   mape: 3.11, stock: 95,   need: 50,   region: 'Manokwari' },
  { id: 'ubi_kayu',      name: 'Ubi Kayu',           unit: 'kg',    ref: 5000,   price: 5150,   fc30: 5210,   mape: 4.55, stock: 260,  need: 140,  region: 'Manokwari' },
  { id: 'sagu',          name: 'Sagu Basah',         unit: 'kg',    ref: 12000,  price: 12300,  fc30: 12420,  mape: 4.20, stock: 330,  need: 210,  region: 'Sorong' },
  { id: 'bawang_merah',  name: 'Bawang Merah',       unit: 'kg',    ref: 38000,  price: 43700,  fc30: 46200,  mape: 5.10, stock: 85,   need: 90,   region: 'Manokwari' },
  { id: 'daging_sapi',   name: 'Daging Sapi',        unit: 'kg',    ref: 135000, price: 152000, fc30: 158500, mape: 5.30, stock: 60,   need: 70,   region: 'Sorong' },
  { id: 'telur_ayam',    name: 'Telur Ayam Ras',     unit: 'kg',    ref: 29000,  price: 33000,  fc30: 34600,  mape: 5.05, stock: 110,  need: 120,  region: 'Manokwari' },
  { id: 'cabai_rawit',   name: 'Cabai Rawit Merah',  unit: 'kg',    ref: 55000,  price: 71000,  fc30: 76500,  mape: 5.65, stock: 22,   need: 45,   region: 'Sorong' },
  { id: 'cabai_keriting',name: 'Cabai Merah Keriting',unit: 'kg',   ref: 42000,  price: 52500,  fc30: 56200,  mape: 5.40, stock: 28,   need: 50,   region: 'Manokwari' }
];

/* Indikator cuaca & makro */
const INDICATORS = [
  { icon: 'cloud',    label: 'Curah Hujan BMKG',      value: '245 mm/bulan', note: 'Normal – panen padi Papua Barat aman', tone: 'ok' },
  { icon: 'trend',    label: 'Inflasi Pangan (yoy)',   value: '2,8%',         note: 'Terkendali (target 2–4%)',            tone: 'ok' },
  { icon: 'activity', label: 'Kurs USD/IDR',           value: 'Rp 15.650',    note: 'Berpengaruh pada kedelai & terigu',   tone: 'warn' },
  { icon: 'alert',    label: 'Anomali Suhu (El Niño)', value: '+0,4 °C',      note: 'Pantau risiko kekeringan Q1',         tone: 'warn' },
  { icon: 'database', label: 'Harga BBM Non-subsidi',  value: 'Rp 13.100/l',  note: 'Biaya logistik antar-pulau stabil',   tone: 'ok' },
  { icon: 'sprout',   label: 'Luas Tanam Padi',        value: '4.280 ha',     note: '+3,1% dibanding periode lalu',        tone: 'ok' }
];

/* ---------- util ---------- */
const rupiah = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const pct = (n, d) => n.toLocaleString('id-ID', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d }) + '%';

function seeded(seed) {
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function strSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function deviation(c) { return (c.price - c.ref) / c.ref * 100; }
function statusOf(c, th) {
  const d = deviation(c);
  if (d >= th.crit) return 'kritis';
  if (d >= th.warn) return 'waspada';
  return 'aman';
}

const fmtDate = d => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
const isoDate = d => d.toISOString().slice(0, 10);
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

/* Deret harga historis (n hari ke belakang) + proyeksi LSTM (n hari ke depan) */
function buildSeries(c, n) {
  const rnd = seeded(strSeed(c.id + n));
  const today = new Date();
  const labels = [], actual = [], forecast = [];
  const start = c.price - (c.price - c.ref) * 0.55;       // harga di awal periode historis
  for (let k = -n; k <= 0; k++) {
    const t = (k + n) / n;
    const noise = k === 0 ? 0 : (rnd() - 0.5) * c.price * 0.012;
    labels.push(fmtDate(addDays(today, k)));
    actual.push(Math.round(start + (c.price - start) * t + noise));
    forecast.push(k === 0 ? c.price : null);
  }
  for (let k = 1; k <= n; k++) {
    const target = c.price + (c.fc30 - c.price) * (k / 30);
    const noise = (rnd() - 0.5) * c.price * 0.008;
    labels.push(fmtDate(addDays(today, k)));
    actual.push(null);
    forecast.push(Math.round(target + noise));
  }
  return { labels, actual, forecast };
}

/* Peramalan lokal (cadangan jika api/forecast.php tidak tersedia, mis. Live Server) */
function localForecast(c, horizon) {
  const rnd = seeded(strSeed(c.id + '|' + horizon));
  const today = new Date();
  let p = c.price;
  const drift = (c.fc30 - c.price) / 30;
  const data = [];
  for (let i = 1; i <= horizon; i++) {
    p += drift + (rnd() - 0.5) * c.price * 0.006;
    data.push({ day: i, date: isoDate(addDays(today, i)), predicted_price: Math.round(p) });
  }
  return data;
}
