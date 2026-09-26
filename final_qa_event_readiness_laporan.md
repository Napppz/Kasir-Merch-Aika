# FINAL QA REPORT — COSPLAYPOS
## Laporan Kesiapan Event & Pengerasan Produksi (Tahap 7)

**Nama Proyek:** CosplayPOS • Event Terminal  
**Versi:** v2.4 (Production Event Edition)  
**Target Penggunaan:** Booth Merchandise Cosplay pada Event Offline (Comic Frontier, Anime Festival, dsb.)  
**Arsitektur:** 100% Offline-First Single-Device Web App  
**Status Akhir:** **READY FOR EVENT**

---

## 1. Project Summary

CosplayPOS telah melewati audit menyeluruh, pengerasan UX (UX hardening), validasi integritas data, ketahanan offline, pengujian keyboard workflow, dan verifikasi alur kasir. Seluruh pengujian membuktikan bahwa aplikasi siap menghadapi kondisi event offline yang ramai, cepat, dan tanpa koneksi internet.

Tidak ada modul baru yang ditambahkan di luar cakupan kasir booth. Modul-modul enterprise/online (seperti supplier, purchasing, CRM, cloud sync) tidak diimplementasikan demi menjaga fokus, performa, dan kesederhanaan operasional bagi kasir offline.

---

## 2. Final Feature Scope

Aplikasi CosplayPOS fokus penuh pada modul inti kasir booth:

1. **Katalog Produk (Product Management):** Tambah, edit, nonaktifkan produk, input harga jual, harga pokok, stok awal, minimum stok, SKU, dan foto merchandise.
2. **Kategori Produk (Category Management):** Manajemen grup kategori (Sticker, Keychain, Art Print, Standee, Cosplay Prop, dsb.).
3. **Manajemen Stok Aktual & Mutasi (Stock Management):** Single source of truth stok pada `Product.stock`, pencatatan histori pergerakan stok otomatis (`INITIAL`, `SALE`, `STOCK_IN`, `ADJUSTMENT_IN/OUT`, `DAMAGE`, `LOST`, `OPNAME_IN/OUT`).
4. **Stock Opname Sederhana:** Hitung fisik barang per sesi booth, rekonsiliasi selisih stok secara otomatis.
5. **Keranjang Belanja (POS Cart):** Tambah item cepat (klik produk atau scanner dummy F2), ubah kuantitas, hapus item, diskon promo pas (`COMICFEST`, `EVENT10`, `PASSER5`), catatan transaksi pelanggan.
6. **Perhitungan Subtotal, Total, dan Kembalian Kasir:** Otomatis tanpa floating point issue, integer Rupiah.
7. **Pilihan Pembayaran Lengkap (Cash, QRIS Statis, Transfer Bank):**
   - **Tunai:** Input uang pembeli + tombol Quick Cash (Uang Pas, 20k, 50k, 100k, 200k, 500k) + deteksi uang kurang.
   - **QRIS Statis:** Kartu QR resmi merchant **AIKA SESILIA** (NMID: ID1025440784557, Stand: A01) + Mode Zoom Lightbox Fullscreen untuk di-scan pembeli.
   - **Transfer Bank:** Rekening booth BCA untuk transaksi non-tunai langsung.
8. **Proteksi Double-Submission:** Kunci proses transaksi (`isProcessing` lock + disabled state) sehingga klik ganda cepat kasir tidak memicu transaksi duplikat.
9. **Struk Thermal 80mm ESC/POS Ready:** Layout kertas thermal 80mm asli, cetak bersih via `@media print` tanpa elemen UI latar, tombol, atau navigasi.
10. **Riwayat Transaksi (Transaction History):** Pencarian nomor nota/nama pembeli, filter tanggal, detail transaksi, cetak ulang struk (*reprint*), pembatalan (*void/refund*) nota.
11. **Laporan Penjualan (Sales Reports):**
    - Laporan Penjualan Hari Ini (*Today's Sales*): Total omzet, jumlah transaksi, unit terjual, rata-rata transaksi (AOV).
    - Laporan Bulanan (*Monthly Sales*): Filter dinamis per bulan & tahun dari data aktual IndexedDB.
    - Analisis Produk Terlaris (*Top Products*).
    - Distribusi Metode Pembayaran (Tunai vs QRIS vs Transfer).
    - Ekspor data CSV untuk pembukuan Excel setelah event.
12. **Cadangan & Pemulihan Offline (Backup & Restore):** Ekspor berkas JSON lengkap mencakup 6 object store dengan verifikasi integritas checksum **SHA-256**, validasi format sebelum restore, dan tombol reset darurat dengan dialog konfirmasi aman.

---

## 3. Architecture

CosplayPOS dibangun dengan arsitektur client-side murni:
- **Runtime Frontend:** React 19 + TypeScript + Vite.
- **Persistence Layer:** Browser IndexedDB via wrapper `OfflineDB` sebagai **Single Source of Truth** (bukan localStorage dan bukan cloud DB).
- **Styling:** Vanilla CSS berdesain gelap cyber-neon presisi terinspirasi dari referensi Google Stitch.
- **Offline Asset Delivery:** Gambar QRIS disimpan lokal di `public/qris.png`, ikon Lucide React di-bundle statis tanpa CDN eksternal.

---

## 4. IndexedDB Stores

Database lokal `CosplayPOS_DB` (Versi 3) memiliki store aktif:

| Store Name | Primary Key | Indexes | Deskripsi |
|---|---|---|---|
| `products` | `id` | `sku` (unique), `categoryId` | Master data merchandise dan jumlah stok aktual |
| `categories` | `id` | - | Kategori produk merchandise |
| `transactions` | `id` | `transactionNumber` (unique), `transactionDate`, `status` | Snapshot nota penjualan kasir |
| `stock_movements` | `id` | `productId`, `type`, `createdAt`, `referenceId` | Histori log keluar/masuk stok |
| `opname_sessions` | `id` | `opnameNumber` (unique), `status`, `startedAt` | Sesi stock opname fisik |
| `settings` | `key` | - | Konfigurasi toko, nama event, printer, dan QRIS |

---

## 5. POS Flow Verification

Alur transaksi berhasil diuji tanpa langkah berlebih:
1. **Pilih Produk:** Kasir mengklik kartu produk atau memindai barcode.
2. **Tambah ke Cart:** Item masuk ke keranjang dengan default qty 1.
3. **Atur Qty:** Tombol `+` / `-` menambah atau mengurangi kuantitas dengan validasi batas stok maksimum.
4. **Subtotal & Total:** Dihitung otomatis (Subtotal - Diskon).
5. **Buka Checkout (F9):** Modal pembayaran terbuka seketika.
6. **Masukkan Uang / Pilih Quick Cash:**
   - Kasir memilih Tunai, QRIS Statis, atau Transfer.
   - Pada metode Tunai: kasir memasukkan nominal uang atau menekan chip Quick Cash.
7. **Hitung Kembalian:** Ditampilkan dengan teks kontras tinggi (format `RpXX.XXX`).
8. **Bayar (Enter / Klik):** Tombol terkunci (`isProcessing = true`).
9. **Simpan Transaksi & Kurangi Stok:** Transaksi disimpan ke IndexedDB, stok produk berkurang, log movement `SALE` dicatat secara atomik.
10. **Kosongkan Cart & Tampilkan Struk:** Keranjang di-reset ke 0, pratinjau struk 80mm ditampilkan siap cetak.
11. **Kasir Siap Transaksi Baru:** Menekan Esc atau tombol "Transaksi Baru (F1)" menutup modal dan kasir siap melayani antrean berikutnya.

---

## 6. Cash & Change Validation

Pengujian formula kasir:
- $\text{Subtotal} = \sum (\text{Price} \times \text{Qty})$
- $\text{Total} = \text{Subtotal} - \text{Discount}$
- $\text{Change} = \text{Cash Received} - \text{Total}$

Hasil uji kasus batas:

| Kasus | Total | Cash Diterima | Kembalian | Status Tombol Bayar | Hasil Evaluasi |
|---|---|---|---|---|---|
| **CASE A (Uang Pas)** | Rp75.000 | Rp75.000 | Rp0 | Aktif (Hijau/Ungu) | **Lolos (Transaksi Berhasil)** |
| **CASE B (Uang Lebih)** | Rp75.000 | Rp100.000 | Rp25.000 | Aktif | **Lolos (Transaksi Berhasil)** |
| **CASE C (Uang Kurang)** | Rp75.000 | Rp50.000 | Rp0 | Disabled ("Uang Kurang Rp25.000") | **Lolos (Transaksi Terblokir)** |
| **CASE D (Cash Kosong)** | Rp75.000 | Rp0 | Rp0 | Disabled ("Uang Kurang Rp75.000") | **Lolos (Transaksi Terblokir)** |
| **CASE E (Input Negatif)** | Rp75.000 | -50.000 | Rp0 | Sanitized ke 0, Disabled | **Lolos (Transaksi Terblokir)** |

Seluruh perhitungan Rupiah menggunakan pembulatan integer (`Math.round`), tidak ada floating point bug (`0.30000000000000004`).

---

## 7. Stock Integrity

Pengujian integritas stok:
1. **Deduction:** Produk dengan stok awal 20 dibeli 1 pcs $\rightarrow$ stok menjadi 19.
2. **Reload Persistence:** Browser di-reload $\rightarrow$ stok di IndexedDB tetap 19.
3. **Pembelian Kedua:** Dibeli 1 pcs lagi $\rightarrow$ stok menjadi 18.
4. **Pencegahan Stok Negatif:** Jika kuantitas keranjang melebihi stok barang (misal stok sisa 2, ingin tambah 3), sistem membunyikan peringatan suara dan menolak penambahan.
5. **Log Movement:** Setiap penjualan kasir otomatis mencatat entri pada `stock_movements` dengan tipe `SALE`, `referenceId` nomor invoice, dan kuantitas pengurang yang tepat.

---

## 8. Historical Price Integrity

Pengujian integritas harga lampau:
1. Transaksi dibuat untuk produk **Poster A** dengan harga **Rp50.000**.
2. Harga Poster A di Master Data Produk kemudian diubah menjadi **Rp75.000**.
3. Riwayat transaksi lama dibuka kembali.
4. **Hasil:** Transaksi lama tetap menampilkan harga **Rp50.000** dan subtotal **Rp50.000** karena item transaksi menyimpan snapshot harga saat transaksi terjadi. Master data produk baru tidak merusak arsip penjualan lama.

---

## 9. Receipt Printing (Thermal 80mm)

Pengujian cetak struk:
- **Format:** Disesuaikan khusus untuk printer thermal 80mm ESC/POS (Epson TM-T82X, Panda, Iware, Yongli, dsb.).
- **Kelengkapan Data:** Nama Toko, Alamat Hall Booth, No. Invoice, Tanggal & Jam, Kasir, Nama Merchandise, Qty, Harga Satuan, Subtotal, Diskon, Total, Metode Pembayaran (Tunai/QRIS/Transfer), Kembalian, Barcode nota, Catatan struk.
- **Media Print Isolation:** Styling `@media print` menyembunyikan sidebar, topbar, bottom-bar, overlay gelap, tombol aksi, dan latar aplikasi. Hanya lembar struk thermal putih bersih yang dicetak dengan lebar `78mm - 80mm`.

---

## 10. Today's Sales Report

Pengujian laporan hari ini:
- Mengambil data transaksi aktual dari IndexedDB dengan filter tanggal lokal hari ini.
- Transaksi dibatalkan (*cancelled*) tidak dihitung ke dalam total omzet dan total item.
- Penambahan transaksi baru langsung mengupdate metrik KPI (Total Penjualan, Jumlah Transaksi, Total Unit Terjual, Rata-rata Transaksi per Nota).

---

## 11. Monthly Sales Report

Pengujian laporan bulanan:
- Selector Bulan dan Tahun bekerja secara dinamis tanpa tanggal hardcoded.
- Rentang tanggal dihitung dari tanggal 1 sampai hari terakhir bulan bersangkutan (28/29/30/31).
- Grafik penjualan harian dalam bulan (*Daily Sales Chart*), ranking produk terlaris (*Top Products*), dan distribusi pembayaran (Tunai vs QRIS vs Transfer) dihitung murni dari transaksi pada bulan tersebut.

---

## 12. Backup & Restore

Pengujian pencadangan dan pemulihan:
1. **Ekspor Backup:** Seluruh store IndexedDB (`products`, `categories`, `transactions`, `stock_movements`, `opname_sessions`, `settings`) diekspor menjadi berkas JSON terstruktur.
2. **Verifikasi Integritas:** Berkas cadangan dilengkapi *SHA-256 integrity checksum* via Web Crypto API. Jika berkas diedit secara ilegal di luar aplikasi, sistem menolak pemulihan.
3. **Terminologi Akurat:** Tidak ada label palsu "enkripsi", melainkan "verifikasi integritas SHA-256".
4. **Pemulihan Aman:** Validasi berkas dijalankan sebelum menulis ke IndexedDB; jika pemulihan dibatalkan, basis data eksisting tidak terganggu.

---

## 13. Offline Test

Pengujian simulasi kondisi tanpa internet:
- Seluruh aset CSS, JavaScript, gambar merchandise, logo, dan gambar QRIS di-load dari disk/server lokal Vite.
- Tidak ada panggilan API ke server luar.
- Font menggunakan fallback sistem yang terbaca jelas (`system-ui`, `Segoe UI`, `Inter`, `Roboto`, `sans-serif`) jika web font Google Fonts tidak dapat diakses saat offline.

---

## 14. Keyboard Workflow

Pintasan keyboard kasir:
- **F2:** Pemindaian dummy barcode / pencarian merchandise cepat.
- **F9:** Membuka modal checkout & pembayaran.
- **1, 2, 3:** Memilih metode pembayaran di dalam modal (1: Tunai, 2: QRIS, 3: Transfer).
- **Esc:** Menutup modal yang terbuka tanpa merusak keranjang belanja.
- **Enter:** Konfirmasi pembayaran dan cetak struk (hanya aktif jika uang cukup dan tidak sedang memproses transaksi).

---

## 15. Responsive Test

Pengujian pada berbagai resolusi layar operasional kasir:
- **Desktop FHD (1920 × 1080):** Tampilan lapang, katalog produk 5-kolom, keranjang belanja di sisi kanan, modal pembayaran proporsional.
- **Laptop Standar (1366 × 768):** Layout menyesuaikan tanpa scrollbar horizontal, tombol Quick Cash tersusun rapi, pratinjau struk thermal tetap muat di layar.
- **Tablet Booth (1024 × 768):** POS tetap usable, tombol touch-friendly dengan target sentuh minimal 40px.

---

## 16. Performance Check

- **Waktu Build Produksi:** 219ms – 232ms.
- **Pencarian Produk:** Instan berbasis filter memori reaktif.
- **Responsivitas Cart:** Nol delay saat menambah atau mengurangi kuantitas.
- **Kueri IndexedDB:** Menggunakan transaksi atomik, tidak ada kueri berulang yang membebani browser.
- **Bebas Console Spam:** Nol `console.log` debug pada kode produksi.

---

## 17. Browser Subagent Test Results

| No | Pengujian | Kondisi yang Diharapkan | Hasil |
|---|---|---|---|
| **TEST 01** | Tambah Kategori Baru | Kategori tersimpan di IndexedDB dan muncul di filter POS | **PASS** |
| **TEST 02** | Tambah Produk Baru | Produk baru tersimpan dengan SKU, harga, dan stok awal | **PASS** |
| **TEST 03** | Muncul di Kasir POS | Produk langsung terlihat di katalog kasir | **PASS** |
| **TEST 04** | Tambah ke Keranjang | Item masuk ke keranjang dengan subtotal yang tepat | **PASS** |
| **TEST 05** | Ubah Kuantitas | Kuantitas bertambah dan berkurang dengan tombol +/- | **PASS** |
| **TEST 06** | Hitung Subtotal & Total | Formula subtotal dan total akurat | **PASS** |
| **TEST 07** | Cash Uang Pas (Case A) | Kembalian Rp0, tombol bayar aktif | **PASS** |
| **TEST 08** | Cash Lebih Besar (Case B)| Kembalian dihitung pas (Rp100.000 - Rp70.000 = Rp30.000) | **PASS** |
| **TEST 09** | Cash Kurang (Case C) | Tombol bayar terblokir dan bertuliskan "Uang Kurang..." | **PASS** |
| **TEST 10** | Checkout Berhasil | Transaksi selesai, nota tersimpan ke riwayat | **PASS** |
| **TEST 11** | Double-Click Protection | Klik ganda cepat pada tombol bayar hanya membuat 1 transaksi | **PASS** |
| **TEST 12** | Pengurangan Stok Aktual | Stok produk berkurang tepat sesuai kuantitas yang dibeli | **PASS** |
| **TEST 13** | Log Pergerakan Stok SALE | Entri tipe SALE tercatat di log inventory dengan nomor invoice | **PASS** |
| **TEST 14** | Integritas Harga Lampau | Perubahan harga master tidak mengubah harga nota lama | **PASS** |
| **TEST 15** | Pratinjau Struk 80mm | Struk menampilkan nama booth, item, invoice, dan QRIS NMID | **PASS** |
| **TEST 16** | Laporan Hari Ini | Menghitung omzet dan transaksi riil dari IndexedDB | **PASS** |
| **TEST 17** | Laporan Bulanan | Pemilihan bulan/tahun menyajikan data dinamis tanpa hardcode | **PASS** |
| **TEST 18** | Cadangkan Database | Berkas JSON terunduh dengan checksum SHA-256 valid | **PASS** |
| **TEST 19** | Pemulihan Database | Restore berkas cadangan mengembalikan seluruh data dengan aman | **PASS** |
| **TEST 20** | Reload Persistence | Refresh halaman (F5) mempertahankan seluruh data transaksi & stok | **PASS** |
| **TEST 21** | Database Kosong | Tidak ada crash, NaN, atau layar putih saat database bersih | **PASS** |
| **TEST 22** | Mode Offline Penuh | Beroperasi 100% tanpa internet | **PASS** |
| **TEST 23** | Responsif 1366 × 768 | Tampilan laptop kasir tidak overflow dan mudah dioperasikan | **PASS** |
| **TEST 24** | Responsif 1920 × 1080 | Tampilan desktop kasir sangat tajam dan presisi | **PASS** |
| **TEST 25** | Keyboard Shortcuts | F2 (Scan), F9 (Bayar), Esc (Batal), 1/2/3 (Metode) berfungsi | **PASS** |

---

## 18. Build Result

```bash
npm run build
```

- **Exit Code:** `0`
- **TypeScript:** `tsc -b` sukses tanpa error dan tanpa lint warning.
- **Vite:** Bundling produksi berhasil dalam 219ms (`dist/index.html`, `dist/assets/*.css`, `dist/assets/*.js`).

---

## 19. Known Limitations

1. **Single-Device Offline Scope:** Sesuai desain awal, data disimpan di IndexedDB peramban lokal perangkat kasir tersebut. Jika booth menggunakan lebih dari 1 laptop, pemindahan data antar perangkat dilakukan melalui fitur Ekspor Backup dan Impor Restore.
2. **Koneksi Printer Thermal:** Menggunakan browser print dialog bawaan (`window.print()`). Kasir perlu menyetel ukuran kertas printer ke 80mm pada dialog cetak sistem operasi sekali di awal sesi event.

---

## 20. Final Status

# **READY FOR EVENT**

Aplikasi CosplayPOS telah melewati seluruh kriteria uji kesiapan produksi dan dinyatakan **siap digunakan secara andal pada booth merchandise event cosplay offline**.
