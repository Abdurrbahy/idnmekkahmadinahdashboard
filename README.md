# IDN Boarding School — Dashboard Mekkah & Madinah

Sistem Monitoring & Input Harian Cepat Santri IDN Boarding School di Mekkah & Madinah.

## 📖 Dokumentasi Lengkap Proyek
Silakan baca file [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) untuk dokumentasi lengkap arsitektur, database Supabase, 4 santri resmi, sistem autentikasi 3 peran (Admin, Atasan, Walsan), dan roadmap UI.

## 🚀 Menjalankan Aplikasi

```bash
# Instal dependensi
npm install

# Jalankan server development
npm run dev

# Build produksi
npm run build
```

## 👥 Akun & Peran
Tidak ada akun bawaan. Akun baru selalu berperan `walsan` dan nonaktif sampai diaktifkan admin
(lihat BAGIAN 3 di [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)). Jangan menulis kredensial di repositori.

## 🗄️ Database Supabase
Skema aktif: `supabase/schema_master_v3.sql` (plus file `migration_v3_*.sql`).
