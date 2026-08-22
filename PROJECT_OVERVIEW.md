# IDN Boarding School — Dashboard Monitoring Santri (Mekkah & Madinah)
## Dokumentasi Proyek — **SCHEMA V3 (AKTIF)**

> **⚠️ UNTUK AI ASSISTANT / DEVELOPER (Antigravity, Claude, Cursor, dsb.)**
> Dokumen ini menggantikan versi sebelumnya secara total.
> Database sekarang menjalankan **`supabase/schema_master_v3.sql`**.
> Semua asumsi dari V2 **tidak berlaku lagi** — baca BAGIAN 0 sebelum menulis kode apa pun.

---

## 0. 🚨 PERUBAHAN WAJIB DIKETAHUI (V2 → V3)

Kesalahan paling umum saat menulis kode untuk proyek ini adalah memakai asumsi V2.
Tabel berikut adalah sumber kebenaran:

| Aspek | ❌ V2 (SALAH, jangan dipakai) | ✅ V3 (BENAR) |
|---|---|---|
| Sumber peran user | `user.user_metadata.role` | Tabel `public.profiles` |
| Akses database | Semua orang full access | RLS bertingkat per peran |
| Hak tulis | Siapa pun (termasuk anon) | **Hanya `role = 'admin'`** |
| Akun baru | Bisa pilih peran sendiri saat Sign Up | Selalu `walsan` + `is_active = false` |
| Wali santri | Melihat semua santri | Hanya anaknya (`parent_students`) |
| Timezone tanggal | `Asia/Jakarta` | **`Asia/Riyadh`** |
| Upload foto | Anon boleh | Admin saja |
| `submissions.jenis` | Diisi manual dari UI | **Otomatis** dari `subject_id` (trigger) |
| Validasi ayat | Tidak ada | Trigger `RAISE EXCEPTION` |
| Akun demo `idn123` | Ada di README | **Dihapus** — jangan dibuat ulang |

### Aturan mutlak untuk penulisan kode baru

1. **JANGAN** membaca peran dari `session.user.user_metadata`. Selalu query `profiles`.
2. **JANGAN** menambahkan pilihan peran di form Sign Up. Peran hanya ditetapkan admin.
3. **JANGAN** membuat policy `USING (true)` atau `GRANT ALL TO anon`.
4. **JANGAN** memakai `new Date()` sisi klien untuk menentukan "hari ini". Gunakan
   helper waktu Saudi (lihat BAGIAN 5) atau `public.app_today()` di sisi database.
5. **JANGAN** meng-hardcode `jenis` saat insert ke `submissions` — trigger akan menimpanya.
6. Setiap operasi tulis wajib menangani error PostgreSQL `42501` (*row-level security
   policy violation*) sebagai "Anda tidak punya hak akses", bukan sebagai bug.

---

## 1. 📌 Informasi Umum & Tech Stack

- **Nama Proyek**: IDN Mekkah & Madinah Dashboard
- **Lokasi**: `/Users/syifaanggraini/Desktop/idn-mekkah-madinah-dashboard`
- **Tujuan**: Mencatat dan memonitor kegiatan harian, kehadiran, setoran hafalan
  Al-Qur'an, dan mutabaah yaumiyah 4 santri IDN Boarding School di Mekkah & Madinah.
- **Stack**: React 19 + TypeScript + Vite 5 · Tailwind CSS v3 · `lucide-react` ·
  `react-router-dom` · Supabase PostgreSQL (`@supabase/supabase-js`)
- **Tema**: Minimalist Putih & Abu-abu (Slate / Zinc)
- **Supabase Project ID**: `fzjlvcekvjlbaqweacqj`
- **Schema aktif**: `supabase/schema_master_v3.sql` (idempoten, aman dijalankan ulang)

---

## 2. 👥 4 Santri Resmi

| # | Nama | Kelas |
|---|---|---|
| 1 | Ahmad Faaiz Al Ghufron | 12 |
| 2 | Sultan Islamy Al Hakim | 12 |
| 3 | Ezra Pa Prajna El Azmy | 11 |
| 4 | Faiz Aslam | 11 |

Tabel `students` kini punya `UNIQUE (nama)` sehingga seed tidak lagi menghasilkan duplikat.

---

## 3. 🔐 Sistem Peran (RBAC) — Arsitektur Baru

### Tabel `profiles`
```
id         uuid PK → auth.users(id)
email      text
nama       text
role       text  CHECK IN ('admin','atasan','walsan')  DEFAULT 'walsan'
is_active  boolean  DEFAULT false
```

Baris `profiles` dibuat **otomatis** oleh trigger `trg_on_auth_user_created` pada
`auth.users`. Peran default selalu `walsan` dan `is_active = false`.
Pengguna **tidak bisa** mengubah `role` atau `is_active` miliknya sendiri —
ditolak oleh policy `profiles_self_update`.

### Tabel `parent_students`
```
profile_id  uuid   → profiles(id)
student_id  bigint → students(id)
hubungan    text   CHECK IN ('ayah','ibu','wali')
UNIQUE (profile_id, student_id)
```
Menentukan santri mana yang boleh dilihat seorang wali. Tanpa baris di sini,
akun `walsan` tidak melihat data apa pun.

### Matriks hak akses (ditegakkan di database, bukan di UI)

| Peran | Baca santri | Baca transaksi | Tulis / Hapus | Upload foto |
|---|---|---|---|---|
| `admin` | Semua | Semua | ✅ Ya | ✅ Ya |
| `atasan` | Semua | Semua | ❌ Tidak | ❌ Tidak |
| `walsan` | Anaknya saja | Anaknya saja | ❌ Tidak | ❌ Tidak |
| `anon` (belum login) | — | — | ❌ Tidak | ❌ Tidak |

Satu-satunya tabel yang terbuka untuk `anon` adalah `surahs` (dibutuhkan dropdown
114 surah sebelum login).

### Fungsi otorisasi (SECURITY DEFINER, dipakai di dalam policy)
- `public.auth_role()` → `text | null` (null bila belum login atau `is_active = false`)
- `public.is_admin()` → boolean
- `public.is_staff()` → boolean (admin **atau** atasan)
- `public.can_view_student(student_id bigint)` → boolean

Fungsi-fungsi ini juga boleh dipanggil dari klien lewat RPC untuk menentukan
tampilan UI, contoh: `await supabase.rpc('is_admin')`.

### Bootstrap (dilakukan sekali, manual di SQL Editor)
```sql
UPDATE public.profiles SET role='admin', is_active=true WHERE email='...';
```
Tanpa ini, **tidak ada** yang bisa menulis data.

---

## 4. 🗄️ Struktur Database

### Master
| Tabel | Isi | Catatan V3 |
|---|---|---|
| `students` | 4 santri | + `UNIQUE(nama)`, `updated_at`, `created_by` |
| `surahs` | 114 surah + `offset_ayat` | Riwayat Hafsh, total 6.236 ayat (terverifikasi) |
| `subjects` | 12 mapel | + kolom `jenis_setoran` (sumber kebenaran `submissions.jenis`) |
| `attendance_sessions` | 4 sesi | + `UNIQUE(nama)` |
| `mutabaah_activities` | 9 amalan | + kolom `bobot numeric DEFAULT 1` |
| `activity_types` | 7 harian + 6 pekanan | — |

**4 Sesi presensi**: Persiapan Tahfidz · Setoran Mufrodat · KBM Pagi · Halaqah di Nabawi

**9 Amalan yaumiyah**: Tahajjud · Qabliyah Subuh · Dzikir Pagi · Dhuha ·
Tilawah *(angka, halaman)* · Puasa Sunnah · Dzikir Petang ·
Setoran Mufradat *(angka, kata)* · Baca Buku/Kitab *(angka, halaman)*

### Transaksional
| Tabel | Kunci unik | Catatan V3 |
|---|---|---|
| `attendance_logs` | `(student_id, session_id, tanggal)` | + audit columns |
| `submissions` | — | `jenis` di-set trigger; `nilai` dibatasi 0–100 |
| `quran_submission_details` | — | Validasi rentang ayat via trigger |
| `mutabaah_records` | `(student_id, activity_id, tanggal)` | + audit columns |
| `activities` | *(constraint lama dihapus)* | Kini boleh >1 kegiatan sejenis per hari |
| `activity_media` | — | — |

### Trigger aktif
| Trigger | Tabel | Fungsi |
|---|---|---|
| `trg_on_auth_user_created` | `auth.users` | Buat baris `profiles` otomatis |
| `trg_validate_quran_range` | `quran_submission_details` | **BEFORE** — tolak ayat di luar jangkauan |
| `trg_sync_quran_capaian` | `quran_submission_details` | **AFTER** — hitung `capaian` ayat mutlak |
| `trg_sync_submission_jenis` | `submissions` | Isi `jenis` dari `subject_id` |
| `trg_touch_*` | 6 tabel | Perbarui `updated_at` |
| `trg_creator_*` | 5 tabel | Isi `created_by = auth.uid()` |

---

## 5. ⏰ Penanganan Tanggal (KRITIS)

Santri berdomisili di **Mekkah & Madinah (UTC+3)**, sedangkan pengelola berada di
Indonesia (UTC+7). Selisih 4 jam ini menyebabkan bug nyata: setoran ba'da Isya
pukul 20:30 waktu Madinah tercatat sebagai **tanggal keesokan harinya** di V2.

- Sisi database: `public.app_today()` memakai `Asia/Riyadh`.
- Sisi klien: **jangan** pakai `new Date().toISOString().split('T')[0]`. Gunakan:

```ts
export const todayRiyadh = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
// → "2026-08-22"
```

Semua kolom `tanggal` bertipe `date` (bukan `timestamptz`) dan mengacu pada waktu Saudi.

---

## 6. 📐 Perhitungan Capaian Hafalan

`capaian` **tidak boleh** dihitung di frontend. Cukup insert baris ke
`quran_submission_details`; trigger akan mengisi `submissions.capaian` secara otomatis:

```
capaian = (offset[surah_akhir] + ayat_akhir) − (offset[surah_awal] + ayat_awal) + 1
```

Rumus ini benar untuk setoran lintas surah. Bila rentang tidak valid (ayat melebihi
jumlah ayat surah, atau posisi akhir mendahului awal), trigger melempar exception —
tangani sebagai pesan validasi ke pengguna, jangan ditelan diam-diam.

---

## 7. 🖥️ Status UI

### Selesai (V3 Compliant)
- `AuthPage.tsx` — Sign In / Sign Up split layout (tanpa pilihan role manual di Sign Up, akun baru default walsan pending approval).
- `Header.tsx` — Navigasi tanggal berbasis `Asia/Riyadh` (UTC+3), badge peran real-time dari `profiles`, indikator akun aktif/pending, logout.
- `DailyInputPage.tsx` — 4 tab: Presensi · Setoran Qur'an · Mutabaah · Kegiatan.
- `DailySummaryCard.tsx` — 4 metrik ringkasan harian.
- Penanganan error PostgreSQL `42501` (Row-level security violation) di seluruh form aksi tulis.

### Roadmap berikutnya
`DashboardOverviewPage` · `StudentsListPage` + `StudentDetailPage` ·
`QuranTrackerPage` (peta 30 juz) · `ActivityGalleryPage` · `ReportPrintPage` (cetak PDF)

---

## 8. 💻 Menjalankan Proyek

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # type-check + build produksi
```

Setup database: buka Supabase SQL Editor → jalankan `supabase/schema_master_v3.sql`
→ lanjutkan dengan bootstrap admin:
```sql
UPDATE public.profiles SET role='admin', is_active=true WHERE email='email_admin@idn.sch.id';
```

---
*Dokumen ini adalah sumber kebenaran tunggal untuk konteks proyek. Bila ada
konflik antara dokumen ini dan komentar di dalam kode, dokumen ini yang berlaku.*
