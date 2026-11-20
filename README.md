# PanganLestari — Dashboard Ketahanan Pangan Papua Barat (LSTM & Blockchain)

## Cara menjalankan
**VS Code Live Server:** klik kanan `index.html` → *Open with Live Server*. 
**XAMPP / PHP:** taruh folder di `htdocs`, buka `http://localhost/<nama_folder>/index.php`. 
(atau `php -S localhost:8000` di folder proyek)

Tidak butuh internet: grafik, ikon, dan SHA-256 dibuat langsung dengan JavaScript (tanpa Chart.js/FontAwesome CDN).

## Struktur
- `js/data.js` — data 18 komoditas, indikator makro, pembuat deret harga. **Ubah harga/komoditas di sini.**
- `js/chart-custom.js` — grafik garis SVG + SHA-256
- `js/app.js` — logika semua halaman (stat, tabel, peramalan, ledger, notifikasi, CSV)
- `api/forecast.php` — API peramalan; bila PHP tidak aktif (Live Server) otomatis memakai simulasi lokal

## Aturan status
Deviasi = (harga − harga acuan) / harga acuan. Aman < 10% · Waspada 10–21,9% · Kritis ≥ 22% (ambang dapat diubah di mode Admin).
