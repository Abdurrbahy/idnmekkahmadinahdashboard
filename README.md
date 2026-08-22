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

## 👥 3 Akun Bawaan (1-Klik di Halaman Login):
- **🛡️ Admin**: `admin@idn.sch.id` (Password: `idn123`) — Akses penuh input, edit, & simpan.
- **👔 Atasan**: `atasan@idn.sch.id` (Password: `idn123`) — Akses pantau & hanya lihat (Read-Only).
- **👨‍👩‍👦 Walsan**: `walsan@idn.sch.id` (Password: `idn123`) — Akses orang tua santri (Read-Only).

## 🗄️ Database Supabase
File skrip SQL master bersih: `supabase/schema_master.sql`.
