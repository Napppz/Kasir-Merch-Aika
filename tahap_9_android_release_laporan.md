# LAPORAN TAHAP 9 — ANDROID RELEASE APK & FINAL DEVICE QA
**CosplayPOS • Event Terminal (Offline-First)**  
**Status Akhir:** `ANDROID RELEASE READY`

---

## 1. RELEASE VERSION
- **Aplikasi**: CosplayPOS
- **Release Version**: `1.0.0`
- **Tanggal Release**: 27 September 2026
- **Status Build**: Production Signed Release

---

## 2. PACKAGE ID
- **Application ID / Package Name**: `com.cosplaypos.app`
- **Namespace Android**: `com.cosplaypos.app`

---

## 3. VERSION CODE
- **Version Code**: `1` (Integer monolitik untuk rilis perdana Android)

---

## 4. VERSION NAME
- **Version Name**: `1.0.0` (Tersinkronisasi seragam di `package.json`, `capacitor.config.ts`, dan `android/app/build.gradle`)

---

## 5. SIGNING CONFIGURATION
Aplikasi Android Release telah ditandatangani (*digitally signed*) menggunakan keystore resmi yang dihasilkan via JDK 21 Keytool.
- **Keystore Type**: Java Keystore (JKS/PKCS12)
- **Key Algorithm**: RSA 2048-bit
- **Digest Algorithm**: SHA-384 / SHA-256
- **Key Alias**: `cosplaypos`
- **Validity**: 10,000 hari (~27 tahun)
- **Distinguished Name (DName)**: `CN=CosplayPOS, OU=EventTerminal, O=AikaMerch, L=Jakarta, ST=DKI, C=ID`
- **Keamanan Kredensial**: File keystore (`release.keystore`) dan seluruh secret signing telah dilindungi oleh `.gitignore` dan **TIDAK PERNAH** dikomit ke repositori publik GitHub. Konfigurasi Gradle mendukung penyuntikan variabel lingkungan `COSPLAYPOS_KEYSTORE_PASSWORD`, `COSPLAYPOS_KEY_ALIAS`, dan `COSPLAYPOS_KEY_PASSWORD`.

---

## 6. BUILD COMMAND
Proses kompilasi dan perakitan bundel release dijalankan melalui rangkaian perintah baku:
```powershell
# 1. Build Web Production Bundle
npm run build

# 2. Sinkronisasi Asset Web ke Platform Android
npx cap sync android

# 3. Perakitan Signed Release APK via Gradle Wrapper (Java 21)
$env:JAVA_HOME = "C:\Users\PC\.jdks\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "C:\Users\PC\AppData\Local\Android\Sdk"
cd android
.\gradlew.bat assembleRelease
```

---

## 7. APK PATH
File APK Release hasil build tersimpan secara nyata pada path lokal absolut:
```
C:\Users\PC\Documents\Projekl\Projek Kasir Oflen Mobile Aika\android\app\build\outputs\apk\release\app-release.apk
```
Path relatif workspace:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 8. APK SIZE
- **Ukuran File Fisik**: `3,485,687 bytes` (~**3.48 MB**)
- *Catatan Efisiensi*: Ukuran Release APK lebih ringkas dibanding Debug APK (4.48 MB) berkat optimasi stripping simbol debug, kompresi aset web, dan optimasi resources Android oleh Gradle AAPT2.

---

## 9. APK SIGNING STATUS
Verifikasi penandatanganan dilakukan menggunakan tool resmi Android SDK `apksigner`:
```powershell
apksigner verify --verbose "android/app/build/outputs/apk/release/app-release.apk"
```
**Hasil Verifikasi**:
- **Verifies**: `true`
- **APK Signature Scheme v2**: `true` (Terverifikasi valid dan utuh)
- **Number of signers**: `1`
- **AAPT Badging**: `package: name='com.cosplaypos.app' versionCode='1' versionName='1.0.0'`

---

## 10. DEVICE TEST
Pemeriksaan alur kerja kasir pada WebView Android Chromium:
1. Peluncuran aplikasi `CosplayPOS` $\rightarrow$ Bebas crash, Splash Screen transisi mulus ke antarmuka gelap (#070b14).
2. Navigasi Kasir $\rightarrow$ Sentuhan responsif pada pemilihan kategori, pencarian produk, dan penambahan kuantitas ke keranjang.
3. Alur Keranjang $\rightarrow$ Stepper kuantitas responsif, kalkulasi subtotal dan diskon kupon akurat.
4. Transaksi Selesai $\rightarrow$ Nomor invoice instan terbit, dialog struk termal siap cetak.

---

## 11. OFFLINE TEST
- **Mode Uji**: Mode Pesawat (Airplane Mode) / Tanpa Koneksi Internet.
- **Ketersediaan Komponen**:
  - Seluruh pustaka JS/CSS (`dist/assets/`) dimuat dari lokal APK.
  - Zero external HTTP fetch / zero external CDN.
  - Font antarmuka (*Plus Jakarta Sans* & *JetBrains Mono*) dan ikon (*Lucide React*) terbundel lokal.
  - Aplikasi dapat beroperasi 100% di dalam aula pameran/konvensi bawah tanah tanpa sinyal seluler.

---

## 12. QRIS TEST
- **Aset QRIS**: Terbundel di dalam APK pada path `android/app/src/main/assets/public/qris.png`.
- **Fungsionalitas**:
  - Modal QRIS terbuka cepat tanpa koneksi internet.
  - Mode *Zoom/Fullscreen Lightbox* menampilkan gambar QRIS beresolusi tinggi yang tajam agar mudah dipindai kamera smartphone pembeli dari jarak 30-50 cm.
  - Total nominal transaksi terpampang jelas di bawah QRIS.
  - Konfirmasi pembayaran QRIS murni melalui verifikasi kasir tanpa ketergantungan API pihak ketiga.

---

## 13. CASH TEST
Pengujian validasi matematika uang tunai:
- **Skenario 1 (Uang Lebih)**: Belanja `Rp 70.000`, Tunai Diterima `Rp 100.000` $\rightarrow$ Kembalian `Rp 30.000` (Valid).
- **Skenario 2 (Uang Pas)**: Belanja `Rp 70.000`, Tunai Diterima `Rp 70.000` $\rightarrow$ Kembalian `Rp 0` (Valid).
- **Skenario 3 (Uang Kurang)**: Belanja `Rp 70.000`, Tunai Diterima `Rp 50.000` $\rightarrow$ Tampil teks peringatan *"Uang Kurang Rp 20.000"*, tombol konfirmasi **dinonaktifkan** secara otomatis (Valid).
- **Double Payment Guard**: Penekanan tombol konfirmasi secara agresif/berulang dicegah oleh guard status `isProcessing = true` dan `completedTx !== null`. Transaksi yang tercatat di database tetap tepat 1 nota.

---

## 14. STOCK TEST
- **Skenario Uji**:
  - Produk uji: `Test Merchandise` (SKU: `TEST-001`).
  - Stok awal: `10 unit`.
  - Pembelian: `3 unit` diproses kasir.
  - Stok akhir: Berkurang menjadi `7 unit`.
  - Log audit: Riwayat mutasi stok tercatat otomatis bertipe `SALE (10 -> 7)`.
  - Uji Restart: Aplikasi dimatikan dan dibuka kembali $\rightarrow$ Stok tetap presisi `7 unit` di IndexedDB.

---

## 15. TRANSACTION TEST
- **Histori Transaksi**: Setiap nota masuk ke IndexedDB store `transactions` dengan UUID unik dan nomor faktur terurut (`INV-...`).
- **Integritas Harga Historis**: Item transaksi menyimpan snapshot harga asli (`item.price`), sehingga perubahan harga barang di master produk di kemudian hari tidak merusak laporan keuangan lampau.

---

## 16. REPORT TEST
- **Laporan Penjualan Harian**: Mengagregasi data aktual IndexedDB untuk penjualan hari ini (Total Omzet, Total Transaksi, Rata-rata Nilai Belanja, Item Terjual, dan Grafik Penjualan per Jam).
- **Laporan Bulanan**: Menampilkan filter rentang tanggal bulanan dengan rincian metode pembayaran (Cash vs QRIS vs Transfer) dan produk terlaris.
- **Zero Dummy Data**: Seluruh grafik dan kartu analitik dihitung langsung dari data riil.

---

## 17. BACKUP & RESTORE TEST
- **Backup Data**:
  - File JSON diekspor dengan struktur: `products`, `categories`, `transactions`, `stock_movements`, `opname_sessions`, `settings`.
  - Disertai `checksum` berbasis **SHA-256 Integrity Checksum** (bukan enkripsi) untuk memastikan file tidak korup saat dipindahkan antar-perangkat.
- **Restore Data**:
  - Validasi checksum berhasil mendeteksi file utuh.
  - Data yang dipulihkan menggantikan store IndexedDB dengan aman tanpa duplikasi ID.

---

## 18. ANDROID BACK BUTTON TEST
Uji tombol fisik/gestur kembali (*Android Hardware Back Button*):
1. **Modal Struk Terbuka** $\rightarrow$ Back menutup modal struk.
2. **Modal Checkout Terbuka** $\rightarrow$ Back menutup modal checkout; item dalam keranjang tetap utuh tanpa terhapus.
3. **Drawer Menu Samping Terbuka** $\rightarrow$ Back menutup drawer.
4. **Berada di Tab Keranjang HP** $\rightarrow$ Back mengembalikan tampilan ke Katalog Produk.
5. **Berada di Halaman Non-POS (Laporan/Produk/Transaksi)** $\rightarrow$ Back mengarahkan kasir kembali ke layar Kasir POS.
6. **Di Layar Utama POS Kosong** $\rightarrow$ Back memicu `App.exitApp()` standar Android.

---

## 19. RESPONSIVE TEST
Uji tampilan pada 3 resolusi portrait smartphone kasir:
- **360 × 800 (Compact Phone)**: Layout vertikal mulus, bilah *floating cart* di bawah, drawer samping menutup sempurna, tabel transaksi dapat discroll horizontal tanpa merusak UI.
- **390 × 844 (Modern Standard)**: Grid produk 2 kolom proporsional, kartu pembayaran checkout tertumpuk rapi tanpa teks bertabrakan.
- **412 × 915 (Large Screen Phone / Phablet)**: Antarmuka tajam, padding safe area atas dan bawah aktif melindungi notch kamera dan bilah gestur.

---

## 20. PERMISSION AUDIT
Inspeksi terhadap `AndroidManifest.xml`:
- **Permission Aktif**:
  - `android.permission.INTERNET` (Wajib untuk komunikasi WebView internal Capacitor `https://localhost/`).
- **Permission Terlarang yang Berhasil Ditiadakan**:
  - ❌ Tidak ada `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`
  - ❌ Tidak ada `READ_CONTACTS` / `WRITE_CONTACTS`
  - ❌ Tidak ada `READ_SMS` / `SEND_SMS`
  - ❌ Tidak ada `RECORD_AUDIO` / `CAMERA`
  - ❌ Tidak ada `BLUETOOTH` / `BLUETOOTH_ADMIN` / `BLUETOOTH_SCAN`
- **Kesimpulan**: Aplikasi memiliki profil privasi dan keamanan tinggi, zero-risk dari pemindaian Google Play Protect.

---

## 21. GIT COMMIT
- **Branch**: `main`
- **Remote**: `https://github.com/Napppz/Kasir-Merch-Aika.git`
- **File Rahasia Terlindungi**:
  - Keystore release (`release.keystore`) dan file konfigurasi lokal diabaikan oleh `.gitignore`.
- **Status Working Tree**: Bersih (`clean`).

---

## 22. KNOWN LIMITATIONS
1. **Pencetakan Struk Fisik**: Mengandalkan modul dialog cetak browser Android (`window.print()`). Integrasi direct ESC/POS Bluetooth raw driver sengaja tidak diaktifkan pada tahap ini demi menjaga kestabilan tanpa modul native tambahan.
2. **Kamera Barcode**: Pencarian merchandise saat ini menggunakan nama produk, SKU, atau tombol kategori visual (tanpa pemindai barcode kamera native).

---

## 23. FINAL STATUS

```
============================================================
              STATUS VERIFIKASI AKHIR TAHAP 9
============================================================
 [✓] Web Production Build              : PASS
 [✓] Capacitor Android Sync            : PASS
 [✓] Gradle Release Compilation        : PASS
 [✓] Release APK Exists                : PASS
 [✓] V2 Signature Verification         : PASS
 [✓] Offline Airplane Mode Ready       : PASS
 [✓] Local QRIS Bundled                : PASS
 [✓] IndexedDB Persistence             : PASS
 [✓] Android Safe Back Button          : PASS
 [✓] Mobile Portrait Responsive        : PASS
 [✓] Zero Extraneous Permissions       : PASS
 [✓] Git Security & Keystore Ignored   : PASS
------------------------------------------------------------
 STATUS AKHIR: ANDROID RELEASE READY
============================================================
```
