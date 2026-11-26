# QC Audit Report — IDN Dashboard Mekkah & Madinah

Tanggal audit: 26 November 2026
Target: https://idnmekkahmadinahdashboard.vercel.app/ (build produksi = commit `0f08221`, hash aset identik dengan build lokal)

## Cakupan pengujian

- **Putaran 1:** tanpa login. Sign in diuji live; halaman terproteksi diaudit dari source code, build lokal, dan uji anonim ke Supabase (read-only).
- **Putaran 2:** login admin di browser pane, pada dev server lokal (`localhost:5173`, kode hasil perbaikan) yang terhubung ke database Supabase produksi. Semua halaman terproteksi diuji live di 320/375/430/768/1024/1440/1920px.
- Uji tulis ke database produksi hanya satu kali: menyimpan ulang presensi 26 Nov dengan nilai **identik** dengan yang sudah tersimpan (16× "Hadir"), untuk memicu refetch. Simulasi gagal jaringan dan respons usang dilakukan hanya di browser (stub `fetch`), tanpa menulis data.

---

## PHASE 1 — Reconnaissance

### Stack
React 19 + TypeScript + Vite 5, Tailwind CSS **v3.4**, react-router 7, Supabase (auth + Postgres RLS + Storage), recharts, jspdf + html2canvas. Deploy: Vercel (SPA rewrite).

### Daftar halaman & routes

| Route | Layout | Akses | Fungsi |
|---|---|---|---|
| `/signin` | AuthLayout | Publik | Login, lupa password (modal) |
| `/reset-password` | AuthLayout | Publik (link email) | Set password baru |
| `/` | AppLayout (sidebar) | Login aktif | **Input Harian**: Presensi 4 sesi, Setoran Qur'an (+ rubrik 5 aspek, kitab/bab), Mutabaah 9 amalan, Kegiatan & foto |
| `/?mode=weekly` | AppLayout | Login aktif | **Dashboard / Rekap Pekanan** (grafik recharts) |
| `/weekly-report` | AppLayout | Admin | Form Weekly Report Koordinator (10 section, upload foto) |
| `/report/daily` | PrintLayout | Login aktif | Laporan harian A4 |
| `/report/daily-batch` | PrintLayout | Login aktif | Arsip harian sepekan A4 |
| `/report/weekly` | PrintLayout | Login aktif | Laporan pekanan santri A4 |
| `/report/weekly-progress` | SlideLayout | Login aktif (menu: staff) | Slide 16:9 + ekspor PDF |
| `/dashboard`, `/kas`, `*` | — | — | Redirect |

### Peta navigasi
```
Sidebar
├─ PROGRAM
│  ├─ Dashboard ............ /?mode=weekly
│  ├─ Input Harian ......... /
│  └─ Laporan Pekanan Santri /report/weekly   (keluar dari app shell, tanpa sidebar)
└─ KOORDINATOR (admin/atasan)
   ├─ Form Weekly Report ... /weekly-report (admin)
   └─ Weekly Report Koor ... /report/weekly-progress
Header: toggle Harian/Pekanan · navigasi tanggal (‹ Hari ini ›, kalender) · menu Cetak & Unduh (window.open ke /report/*)
```

### Peran
`admin` (tulis), `atasan` (lihat semua), `walsan` (lihat anak sendiri). RLS ditegakkan di database — **terverifikasi**: request anonim ke `students`, `profiles`, `attendance_logs`, `submissions`, `mutabaah_records`, `activities`, `weekly_reports`, `kitab_bab`, `kas_transaksi` mengembalikan `[]`.

---

## PHASE 2 & 3 — Temuan & Prioritas

| ID | Halaman | Kategori | Temuan | Dampak | Prioritas | Rekomendasi |
|---|---|---|---|---|---|---|
| B-01 | Input Harian | Fungsi / data | Perubahan presensi & mutabaah yang **belum disimpan dihapus diam-diam** setiap kali data di-refetch: saat kembali ke tab browser (listener `visibilitychange`) dan saat section lain disimpan (save → `refreshCurrentData` → array baru → effect reset). | Admin kehilangan input tanpa peringatan; harus input ulang. | P1 | Jangan re-inisialisasi state lokal saat ada perubahan belum tersimpan pada tanggal yang sama. |
| B-02 | Input Harian | Fungsi / data | Race condition saat ganti tanggal cepat: respons tanggal lama bisa tiba setelah respons tanggal baru, dan selama loading section menampilkan data tanggal sebelumnya di bawah tanggal baru. Tombol Simpan memakai `selectedDate` baru. | Data tanggal A bisa tersimpan sebagai tanggal B. | P1 | Abaikan respons usang; jangan render form sebelum data tanggal terpilih selesai dimuat. |
| B-03 | Input Harian | Fungsi / error state | `fetchAttendanceLogs`/`fetchMutabaahRecords`/`fetchSubmissions`/`fetchActivities` mengembalikan `[]` saat gagal (jaringan, sesi kedaluwarsa). Presensi kosong otomatis tampil "Hadir" semua. | Gagal muat terlihat seperti "belum ada data"; menekan Simpan **menimpa data asli** (mis. "Sakit") menjadi "Hadir". | P1 | Lempar error, tampilkan error state + tombol Coba Lagi, sembunyikan form. |
| B-04 | Semua (AppLayout) | Fungsi / UX | Peringatan "data belum tersimpan" di Sidebar tidak pernah aktif: `AppLayout` tidak pernah menerima `hasUnsavedChanges`. | Klik menu sidebar membuang input tanpa konfirmasi. | P1 | Hubungkan status unsaved halaman ke AppLayout via outlet context. |
| B-05 | Input Harian | UX / data | Presensi yang belum pernah disimpan tampil sebagai "Hadir" tanpa penanda. | Admin mengira presensi sudah tercatat. | P2 | Badge "Belum diisi" saat belum ada log tersimpan untuk tanggal itu. |
| V-01 | Global | Visual | 130+ pemakaian class Tailwind v4 (`shadow-2xs` ×87, `shadow-xs` ×18, `backdrop-blur-xs`, `scrollbar-none`, `scrollbar-thin`, `animate-in`/`fade-in`/`zoom-in-95`/`slide-in-from-bottom`, `py-0.2`) padahal proyek memakai Tailwind v3 → class tidak dihasilkan. | Kartu tanpa elevasi, scrollbar tab tampil, animasi modal tidak jalan, desain tidak sesuai niat. | P2 | Tambahkan token `boxShadow.xs/2xs`, `backdropBlur.xs`, utilitas scrollbar & animasi enter di config/CSS. |
| P-01 | Global | Performa | Satu bundle JS 1,9 MB (530 KB gzip) termasuk jspdf, html2canvas, recharts untuk semua halaman, termasuk Sign in. DCL terukur ±11 detik pada koneksi pane. | Muat pertama lambat, terutama mobile di Saudi. | P2 | Code-splitting per route dengan `React.lazy`. |
| A-01 | Global | Aksesibilitas | 14+ elemen interaktif memakai `focus:outline-none` tanpa pengganti fokus; tidak ada gaya `:focus-visible` global. | Pengguna keyboard tidak melihat fokus (WCAG 2.4.7). | P2 | Ring `:focus-visible` global. |
| A-02 | Sign in | Aksesibilitas | Modal lupa password tanpa `role="dialog"`, `aria-modal`, tutup dengan Esc, label tidak terhubung ke input; pesan error tidak diumumkan (`role="alert"`). | Pembaca layar & keyboard kesulitan. | P2 | Tambah atribut dialog, Esc, `htmlFor`, `role="alert"`. |
| U-01 | Sign in | UX / copy | Bahasa campur: halaman Inggris ("Sign in", "Enter your credentials…") tapi "Lupa password?" dan modal berbahasa Indonesia, sementara seluruh aplikasi berbahasa Indonesia. Placeholder password `••••••••` terlihat seperti terisi. | Membingungkan, terkesan tidak konsisten. | P3 | Seragamkan ke Bahasa Indonesia; placeholder deskriptif. |
| U-02 | Sign in (mobile) | Visual / brand | Di < 1024px panel kiri disembunyikan sehingga tidak ada logo/identitas sama sekali. | Pengguna mobile tidak tahu sedang di situs apa. | P2 | Tampilkan logo di atas form pada mobile. |
| V-02 | Global | Visual | Favicon mengarah ke `/assets/react.svg` yang tidak ada (rewrite mengembalikan HTML); `public/favicon.svg` adalah logo default Vite. | Tab browser tanpa ikon / ikon salah. | P3 | Favicon dari logo IDN. |
| S-01 | Repo | Keamanan | README mencantumkan akun & password demo (`admin@idn.sch.id` / `idn123`) padahal PROJECT_OVERVIEW menyatakan sudah dihapus. | Bila akun masih ada, siapa pun bisa login sebagai admin. | P0* | Hapus dari README; **pemilik perlu memastikan** akun tersebut tidak ada/password diganti (tidak saya uji karena tidak boleh mencoba password). |
| S-02 | Storage | Keamanan / privasi | Bucket `dokumentasi` `public = true`; foto santri (anak di bawah umur) bisa dibuka siapa pun yang tahu URL. Listing anonim terblokir (terverifikasi). | Risiko privasi rendah–sedang. | P2 | Ubah bucket ke private + `createSignedUrl`. Butuh migrasi DB — **tidak diubah tanpa persetujuan**. |
| T-01 | Kode | Teknis | 30 warning oxlint (setState di effect, deps hilang); `sonner` dan `@tanstack/react-query` terpasang tapi tidak dipakai; `src/App.css`, `react.svg`, `vite.svg`, `hero.png` tidak dipakai. | Utang teknis. | P3 | Bersihkan bertahap. |
| T-02 | Laporan cetak | UX | ~~Halaman cetak tanpa tombol kembali~~ — **gugur**: ketiga halaman cetak sudah punya "Kembali ke Dashboard". | — | — | — |
| T-03 | Global | Tipografi | 430+ pemakaian `text-[9px]`–`text-[11px]`, termasuk `text-[8px]`. | Keterbacaan rendah di mobile. | P3 | Konsolidasi ke skala tipografi (min. 12px untuk teks isi). |

| B-06 | Input Harian | Fungsi | *(ditemukan live)* Setelah membuang perubahan lalu pindah ke mode Pekanan, flag "belum tersimpan" tetap aktif (bar bawah + konfirmasi terus muncul) karena section di-unmount tanpa melapor. | Konfirmasi palsu di setiap navigasi. | P2 | Flag hanya berlaku selama form harian tampil. |
| R-01 | Laporan Harian, Laporan Pekanan, Arsip Sepekan | Responsif | *(ditemukan live)* Toolbar tidak bisa wrap; di 320–430px tombol **Cetak / Simpan PDF** terdorong keluar layar (overflow 25–194px). | Pengguna HP tidak bisa mencetak/unduh. | P1 | `flex-wrap` pada grup kontrol. |
| R-02 | Halaman cetak | Responsif | *(ditemukan live)* 8 tabel tanpa pembungkus scroll horizontal; tabel presensi Laporan Harian melebar 145px di 320px. | Halaman bergeser horizontal. | P2 | Bungkus `overflow-x-auto print:overflow-visible`. |
| R-03 | Slide 16:9 | Responsif | *(ditemukan live)* Di mobile isi slide terpotong (judul cover hilang di tengah) karena kotak 16:9 kecil tapi konten berukuran desktop. | Pratinjau menyesatkan. | P2 | Render di 1280×720 lalu skala proporsional (`ScaledSlide`). |
| U-03 | Global (simpan) | UX / copy | *(ditemukan live)* Simpan saat jaringan putus menampilkan teks mentah `TypeError: Failed to fetch`. | Admin tidak tahu apa yang terjadi / apakah data tersimpan. | P2 | Pesan jelas: koneksi terputus, data belum tersimpan, ulangi simpan. |
| U-04 | Input Harian | UX | Kartu "Kehadiran 4 Sesi" menulis "16 sesi belum hadir" bila presensi belum diisi sama sekali. | Salah tafsir: terkesan santri tidak hadir. | P3 | "Presensi hari ini belum diisi". |
| U-05 | Dashboard (mobile) | Visual | Badge "5 Hari Aktif" patah dua baris di 375px. | Terlihat berantakan. | P3 | `whitespace-nowrap`. |
| A-03 | Input Harian | Aksesibilitas | Tombol status presensi (H/I/S/A) dan toggle mutabaah tidak mengumumkan status terpilih; tombol mobile hanya berlabel huruf. | Pembaca layar tidak tahu status mana yang aktif. | P2 | `aria-pressed` + `aria-label` lengkap. |

\* P0 bersyarat: kritis hanya jika akun demo masih aktif di Supabase Auth.

### Skor per halaman (estimasi)

| Halaman | Kondisi | Skor |
|---|---|---|
| Sign in | Rapi & minimal di desktop; mobile tanpa brand; bahasa campur; a11y modal kurang | 72 |
| Reset password | Sederhana, fungsional (kode) | 75 |
| Input Harian | Fitur kaya, tapi 4 bug data-loss/integritas (B-01–B-04) | 55 |
| Dashboard / Rekap Pekanan | Grafik & tabel; bundle berat | 70 |
| Form Weekly Report | 10 section, validasi modal; belum diuji live | 70 |
| Laporan cetak (3 halaman) | A4 print CSS ada; belum diuji live | 72 |
| Slide 16:9 | Ekspor PDF; belum diuji live | 72 |

**Overall (sebelum QC): 66 / 100.**

---

## PHASE 7 — Final Report

### 1. Executive summary
Fokus QC adalah keandalan data di **Input Harian**, karena di sanalah admin bekerja setiap hari dan bug di sana dapat menghapus atau menimpa catatan santri. Kelima bug data (B-01 s.d. B-04, B-06) sudah diperbaiki **dan diverifikasi live** dengan akun admin.

Audit live juga menemukan masalah responsif yang tidak terlihat dari kode: tombol Cetak tidak terjangkau di HP, dan slide terpotong di mobile. Keduanya sudah diperbaiki. Sekarang ke-7 halaman terproteksi bebas horizontal overflow di 7 ukuran layar (320–1920px).

Redesign visual besar **tidak dilakukan**. Setelah dilihat langsung, Dashboard, Input Harian, Form Weekly Report, laporan cetak, dan slide sudah konsisten, rapi, dan punya hierarki yang jelas. Masalah sebenarnya ada di keandalan, responsif, dan aksesibilitas, jadi perubahan diarahkan ke sana. Pertimbangannya sesuai prinsip brief: "jangan redesign hanya demi estetika".

### 2. Daftar perbaikan & status

| ID | Perbaikan | File | Status |
|---|---|---|---|
| B-01 | Edit presensi/mutabaah yang belum disimpan tidak ditimpa refetch (guard `dirtyRef` + tanggal); refetch saat kembali ke tab dilewati selama ada edit. | `AttendanceSection.tsx`, `MutabaahSection.tsx`, `DailyInputPage.tsx` | **Fixed & verified** — status "Izin" bertahan setelah `visibilitychange`; toggle Tahajjud bertahan setelah presensi disimpan & data di-refetch. |
| B-02 | Respons usang diabaikan (`requestId`); form hanya tampil bila data milik tanggal terpilih, skeleton saat memuat. | `DailyInputPage.tsx` | **Fixed & verified** — respons palsu "Alpa" untuk 25 Nov yang ditunda 4 dtk tiba setelah pindah ke 26 Nov dan diabaikan (16 "Hadir" tetap). |
| B-03 | Fetcher harian melempar error. Gagal muat awal → error state + "Coba lagi", form disembunyikan. Gagal refresh tanggal yang sudah termuat → banner peringatan, form tetap. | `supabase.ts`, `DailyInputPage.tsx`, `DailyReportPage.tsx` | **Fixed & verified** (Input Harian) — pesan "koneksi ke server terputus…", "Coba lagi" memulihkan form. Error state Laporan Harian: fixed, not fully verified. |
| B-04 | Status unsaved dikirim ke `AppLayout`, sehingga konfirmasi Sidebar aktif. | `AppLayout.tsx`, `DailyInputPage.tsx` | **Fixed & verified** — "Batal" tetap di halaman, "OK" berpindah. |
| B-05 | Badge "Belum diisi" & "Tersimpan". | `AttendanceSection.tsx`, `MutabaahSection.tsx` | **Fixed & verified** ("Tersimpan" muncul setelah simpan). |
| B-06 | Flag unsaved hanya berlaku saat form harian tampil. | `DailyInputPage.tsx` | Fixed, not fully verified (type-check lolos; logika diturunkan dari state yang sudah terverifikasi). |
| R-01 | Toolbar halaman cetak bisa wrap. | `DailyReportPage.tsx`, `WeeklyReportPage.tsx`, `DailyBatchReportPage.tsx` | **Fixed & verified** — tombol Cetak terlihat di 375px, overflow 0. |
| R-02 | 8 tabel dibungkus `overflow-x-auto print:overflow-visible`. | 3 halaman cetak | **Fixed & verified** — overflow 0 di 320/375/430px. Hasil cetak A4 belum dicetak ulang. |
| R-03 | `ScaledSlide`: slide dirender 1280×720 lalu diskala. | `ScaledSlide.tsx`, `WeeklyProgressSlidesPage.tsx` | **Fixed & verified** di 375px & 1440px (desktop tidak berubah). Print/PDF slide belum diuji ulang. |
| U-03 | Pesan error jaringan saat simpan & muat dalam Bahasa Indonesia yang jelas. | `supabase.ts` | **Fixed & verified** (pesan muat); pesan simpan fixed, not fully verified. |
| U-04, U-05 | Teks kartu presensi kosong; badge tidak patah. | `DailySummaryCard.tsx`, `WeeklyOverviewSection.tsx` | U-05 **verified**; U-04 fixed, not fully verified (tidak ada tanggal kosong di hari aktif untuk diuji). |
| A-03 | `aria-pressed` + `aria-label` pada tombol status & toggle mutabaah. | `AttendanceSection.tsx`, `MutabaahSection.tsx` | **Fixed & verified** (dipakai oleh skrip uji B-02). |
| V-01 | Token Tailwind v4 yang hilang + utilitas scrollbar/animasi. | `tailwind.config.js`, `index.css` | **Fixed & verified** — class ada di CSS build; bayangan kartu terlihat di halaman terproteksi. |
| P-01 | Code-splitting per route. | `App.tsx`, `AppLayout.tsx` | **Fixed & verified** — semua halaman lazy termuat tanpa error. |
| A-01 | Ring `:focus-visible` global. | `index.css` | **Fixed & verified** (Sign in). |
| A-02, U-01, U-02 | Sign in: dialog aksesibel, Bahasa Indonesia, logo di mobile. | `SignInPage.tsx`, `AuthContext.tsx` | **Fixed & verified**. |
| V-02 | Favicon logo IDN. | `index.html`, `public/favicon.png` | **Fixed & verified**. |
| S-01 | Kredensial demo dihapus dari README. | `README.md` | Fixed (docs). Akun di Supabase belum dicek — perlu pemilik. |

### 3. Before vs after

| Aspek | Sebelum | Sesudah |
|---|---|---|
| JS yang dimuat di halaman pertama | 1.915 KB (530 KB gzip) | 562 KB (161 KB gzip) |
| Class desain yang tidak ter-compile | 130+ | 0 dari daftar V-01 |
| Gagal muat data harian | Tampak "kosong", presensi default Hadir dan bisa disimpan menimpa data | Error state + Coba lagi, form disembunyikan |
| Ganti tanggal cepat | Data tanggal lama bisa tersimpan ke tanggal baru | Respons usang diabaikan |
| Pindah tab browser / simpan section lain | Edit belum tersimpan hilang diam-diam | Edit dipertahankan |
| Navigasi sidebar saat ada edit | Tanpa konfirmasi | Konfirmasi |
| Cetak dari HP | Tombol di luar layar | Terlihat & bisa diklik |
| Slide di HP | Terpotong | Utuh (skala) |
| Horizontal overflow (7 halaman × 320–1920px) | 3 halaman bermasalah di 320–430px | 0 |
| Pesan simpan saat offline | `TypeError: Failed to fetch` | Penjelasan + langkah selanjutnya |

### 4. Testing results

| Cek | Hasil |
|---|---|
| `tsc -b` | Lolos |
| `vite build` | Lolos |
| `oxlint` | 31 warning (sebelumnya 33); tidak ada warning baru |
| Horizontal overflow, 7 halaman terproteksi × 320/375/430/768/1024/1440/1920px | 0 di semua kombinasi |
| Request Supabase gagal (reload bersih semua halaman) | 0 |
| B-01, B-02, B-03, B-04, B-05, A-03 | Lulus uji live (lihat tabel di atas) |
| Sign in (320/430/768/1440px, dialog, Esc, fokus) | Lulus |
| Unit test `src/lib/__tests__` | **Tidak bisa dijalankan**, baik sebelum maupun sesudah: tidak ada test runner TS (import tanpa ekstensi gagal di `node --test`) |

Catatan console:
- Error `useAuth must be used within an AuthProvider` hanya muncul saat hot-reload dev setelah `AuthContext.tsx` diedit (URL bertanda `?t=`), bukan di produksi.
- 406/400 yang terlihat di awal sesi tidak bisa direproduksi di halaman mana pun setelah reload bersih. Dugaan: refresh token yang bentrok saat banyak iframe uji dibuka bersamaan, atau percobaan login sebelumnya.

### 5. Remaining issues

| ID | Status | Catatan |
|---|---|---|
| S-01 akun demo | Requires external dependency | Pemilik perlu cek di Supabase Auth bahwa `admin@`, `atasan@`, `walsan@idn.sch.id` tidak ada atau passwordnya sudah diganti. |
| S-02 bucket foto publik | Not fixed | Butuh migrasi storage + signed URL; menunggu persetujuan. |
| Cetak A4 & PDF slide | Not fully verified | Tampilan layar sudah diuji. Dialog cetak/unduh PDF tidak dijalankan karena memblokir otomasi browser — mohon dicoba sekali secara manual. |
| Deploy | Not done | Perubahan belum di-commit/deploy; situs live masih versi lama. |
| T-01 utang teknis | Not fixed | Dependency tak terpakai (`sonner`, `@tanstack/react-query`), aset tak terpakai, warning lint lama. |
| T-03 teks 8–11px | Not fixed | Banyak label 9–11px; di layar nyata masih terbaca, tapi di bawah rekomendasi 12px. |
| Teks slide di HP | By design | Slide diskala ~30% di 375px; untuk dibaca gunakan "Download PDF" atau mode lanskap. |
| Unit test runner | Not fixed | Rekomendasi: tambah `vitest` dan skrip `npm test`. |

### 6. Final quality score

| Halaman | Sebelum | Sesudah |
|---|---|---|
| Sign in | 72 | 88 |
| Input Harian | 55 | 86 |
| Dashboard / Rekap Pekanan | 70 | 84 |
| Form Weekly Report | 70 | 80 |
| Laporan cetak (3) | 72 (live: lebih rendah, tombol Cetak tak terjangkau di HP) | 82 |
| Slide 16:9 | 72 (live: terpotong di HP) | 80 |

**Overall: 66 → 83 / 100.**
