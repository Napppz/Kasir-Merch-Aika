# LAPORAN TAHAP 8 — ANDROID APK PACKAGING & OFFLINE EVENT READINESS
**CosplayPOS • Offline Merchandise Cashier Terminal**  
**Status Final:** `ANDROID APK READY FOR TESTING`

---

## 1. RINGKASAN EKSEKUTIF

Pada Tahap 8, aplikasi kasir offline **CosplayPOS** yang berbasis **React + TypeScript + Vite + IndexedDB** telah berhasil dibungkus (*wrapped*) menjadi aplikasi Android Native APK menggunakan **Capacitor 8** tanpa menulis ulang (*rewrite*) arsitektur kode bisnis. 

Seluruh prinsip inti **100% Offline-First**, IndexedDB sebagai **Single Source of Truth**, dan zero-cloud database dipertahankan seutuhnya. Hasil build menghasilkan file instalasi APK siap uji coba pada smartphone maupun tablet Android kasir booth.

- **Target Platform**: Android (Min SDK 24 / Android 7.0+, Target SDK 36 / Android 16)
- **Framework Wrapper**: Capacitor (`@capacitor/core`, `@capacitor/android`, `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`)
- **Java Runtime**: Eclipse Adoptium Temurin OpenJDK 21 LTS (`21.0.12.1`)
- **Android Build Tools**: 35.0.0 & Gradle 8.14.3
- **Output Artifact**: `android/app/build/outputs/apk/debug/app-debug.apk` (Ukuran: 4.48 MB)

---

## 2. ARSITEKTUR NATIVE WRAPPER

```
┌────────────────────────────────────────────────────────┐
│             CosplayPOS Android Application             │
├────────────────────────────────────────────────────────┤
│  Android Native Container (Capacitor 8 WebView)       │
│  ├── Hardware Back Button Listener                     │
│  ├── Native Dark Status Bar (#070b14)                  │
│  └── Splash Screen Auto-Dismiss                        │
├────────────────────────────────────────────────────────┤
│  Web Application Bundle (dist/ bundled locally)        │
│  ├── React 19 + TypeScript + Vite                      │
│  ├── Responsive Mobile UI (Drawer, Tabs, Floating Bar) │
│  ├── Offline Assets: Local QRIS & Static Icons         │
│  └── Single Source of Truth: IndexedDB (cosplay_pos_db)│
└────────────────────────────────────────────────────────┘
```

1. **Zero External Network Dependencies**: Web runtime dan seluruh asset statis (`qris.png`, icons, scripts, styles) disematkan langsung di dalam folder asset native APK (`android/app/src/main/assets/public/`).
2. **Persistence**: IndexedDB berjalan di dalam storage WebView perangkat secara permanen dan tidak terpengaruh ketiadaan koneksi internet (mode pesawat/airplane mode tetap berjalan 100%).

---

## 3. IDENTITAS & KONFIGURASI CAPACITOR

Konfigurasi native didefinisikan pada [`capacitor.config.ts`](file:///c:/Users/PC/Documents/Projekl/Projek%20Kasir%20Oflen%20Mobile%20Aika/capacitor.config.ts):

| Parameter | Nilai Konfigurasi | Deskripsi |
| :--- | :--- | :--- |
| **App ID / Package Name** | `com.cosplaypos.app` | Package identitas unik Android |
| **App Name** | `CosplayPOS` | Nama label aplikasi pada launcher Android |
| **Web Directory** | `dist` | Direktori hasil kompilasi produksi Vite |
| **Android Scheme** | `https` | Skema internal WebView aman lokal |
| **Status Bar Style** | `DARK` | Teks dan ikon status bar terang di latar gelap |
| **Status Bar Color** | `#070b14` | Harmonis dengan palet cyberpunk terminal kasir |

---

## 4. OPTIMASI MOBILE UI & SAFE AREA (PORTRAIT)

Aplikasi telah dioptimalkan secara spesifik untuk orientasi vertikal (*portrait*) pada layar smartphone umum (360x800, 390x844, 412x915):

1. **Safe Area Insets**:
   - `index.html` dikonfigurasi dengan `viewport-fit=cover`.
   - CSS mengadopsi `--sat: env(safe-area-inset-top)` dan `--sab: env(safe-area-inset-bottom)` agar notch kamera depan dan bilah navigasi gestur Android tidak menutupi tombol kasir.
2. **Mobile Drawer Navigation**:
   - Pada resolusi layar $\le 768\text{px}$, sidebar navigasi disembunyikan dan diakses melalui tombol hamburger menu di pojok kiri atas `TopBar`.
   - Dilengkapi *backdrop overlay* gelap berkabut (*blur*) untuk menutup drawer dengan satu ketukan.
3. **Adaptive POS Layout (Katalog vs Keranjang)**:
   - Pada desktop/tablet: Layout split-view (katalog di kiri, keranjang di kanan).
   - Pada smartphone: Disediakan tab atas `[Katalog Produk]` dan `[Keranjang (X) • Rp Total]`.
   - Saat berada di katalog produk dengan keranjang terisi, muncul bilah melayang bawah (*floating cart bar*) yang menampilkan ringkasan jumlah item dan total belanja, serta tombol cepat ke keranjang.
4. **Checkout Modal Responsive**:
   - Tampilan modal pembayaran bertransformasi dari 2 kolom horizontal menjadi layout vertikal bertumpuk dengan scroll mandiri, memudahkan kasir mengetik nominal tunai atau memindai QRIS di smartphone.

---

## 5. PENANGANAN SAFE ANDROID BACK BUTTON

Melalui custom hook [`src/hooks/useCapacitorNative.ts`](file:///c:/Users/PC/Documents/Projekl/Projek%20Kasir%20Oflen%20Mobile%20Aika/src/hooks/useCapacitorNative.ts), tombol fisik/gestur Back pada Android ditangani dengan hierarki aman:

1. **Prioritas 1**: Jika modal Struk/Nota terbuka $\rightarrow$ Tutup modal struk.
2. **Prioritas 2**: Jika modal Checkout terbuka $\rightarrow$ Tutup modal checkout (**TIDAK** memicu transaksi, keranjang tetap utuh).
3. **Prioritas 3**: Jika drawer menu samping terbuka $\rightarrow$ Tutup drawer menu.
4. **Prioritas 4**: Jika sedang membuka halaman lain (Produk, Transaksi, Laporan, Pengaturan) $\rightarrow$ Kembali ke halaman Kasir POS.
5. **Prioritas 5**: Jika sedang di tab Keranjang pada smartphone $\rightarrow$ Kembali ke tab Katalog Produk.
6. **Prioritas 6**: Jika berada di halaman utama POS tanpa ada modal aktif $\rightarrow$ Keluar dari aplikasi (`Capacitor App.exitApp()`).

---

## 6. VERIFIKASI ASSET OFFLINE (QRIS & DATA)

- **File QRIS Booth**: [`public/qris.png`](file:///c:/Users/PC/Documents/Projekl/Projek%20Kasir%20Oflen%20Mobile%20Aika/public/qris.png) telah disalin otomatis ke:
  `android/app/src/main/assets/public/qris.png`
- **Zoom & Modal QRIS**: Fitur perbesar QRIS dapat dipanggil instan tanpa koneksi internet, siap diperlihatkan ke pembeli di event cosplay offline.
- **IndexedDB**: Penyimpanan data katalog merch, stok, varian, dan riwayat transaksi tersimpan di engine WebView Android Chromium lokal.

---

## 7. HASIL BUILD APK

Build APK diselesaikan melalui Gradle wrapper dengan detail:

```powershell
.\gradlew.bat assembleDebug
BUILD SUCCESSFUL in 10s
183 actionable tasks: 27 executed, 156 up-to-date
```

### Lokasi & Spesifikasi File APK:
- **Lokasi File**: [`android/app/build/outputs/apk/debug/app-debug.apk`](file:///c:/Users/PC/Documents/Projekl/Projek%20Kasir%20Oflen%20Mobile%20Aika/android/app/build/outputs/apk/debug/app-debug.apk)
- **Ukuran File**: `4,483,049 bytes` (~4.48 MB)
- **Signature**: Android Debug Keystore
- **Target SDK**: Android 16 (API Level 36)
- **Minimum SDK**: Android 7.0 (API Level 24)

---

## 8. INSTRUKSI INSTALASI KE HP / TABLET KASIR

### Metode 1: Menggunakan Kabel USB (ADB)
1. Aktifkan **USB Debugging** di HP Android (Pengaturan $\rightarrow$ Opsi Pengembang $\rightarrow$ Debugging USB).
2. Hubungkan HP ke laptop/PC dengan kabel data.
3. Jalankan perintah terminal:
   ```powershell
   adb install -r android\app\build\outputs\apk\debug\app-debug.apk
   ```

### Metode 2: Transfer Langsung File APK
1. Salin file `android\app\build\outputs\apk\debug\app-debug.apk` ke HP via WhatsApp, kabel USB, Google Drive, atau flashdisk OTG.
2. Buka file manager di HP dan ketuk `app-debug.apk`.
3. Izinkan instalasi dari sumber tidak dikenal (*Install from Unknown Sources*).
4. Aplikasi **CosplayPOS** akan terpasang di layar utama dengan nama dan logo resmi.

---

## 9. STATUS VERIFIKASI AKHIR

| Komponen | Status | Keterangan |
| :--- | :---: | :--- |
| **Koneksi GitHub Remote** | **TERHUBUNG & SINKRON** | `origin -> https://github.com/Napppz/Kasir-Merch-Aika.git` |
| **Capacitor Android Project** | **SELESAI** | Folder native `android/` terkonfigurasi lengkap |
| **Responsive Mobile Layout** | **TERUJI** | Drawer, Tabs, dan Safe Area Insets aktif |
| **Safe Android Back Button** | **TERUJI** | Tidak menghilangkan keranjang, menutup modal bertahap |
| **Offline QRIS Asset** | **TERBUNDEL** | Terverifikasi ada di dalam APK assets |
| **Debug APK Output** | **BERHASIL DIBUAT** | `app-debug.apk` (4.48 MB) |
| **Browser Web Regression** | **0 ERROR** | Berjalan mulus di mode web desktop dan mobile |

**STATUS FINAL TAHAP 8:** `ANDROID APK READY FOR TESTING`
