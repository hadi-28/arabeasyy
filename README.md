# ArabEasy Full-Stack MVP

ArabEasy adalah fondasi aplikasi pembelajaran Bahasa Arab full-stack menggunakan Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, dan PostgreSQL.

## Fitur yang tersedia pada MVP ini
- Landing page, registrasi, login, logout, dan proteksi route.
- Profil pengguna dengan peran `student`, `teacher`, atau `admin`.
- Dashboard ringkasan belajar, materi, riwayat latihan, dan XP.
- Materi berbasis database: kategori, materi, kosakata, contoh Arab, dan terjemahan.
- Latihan interaktif dengan soal diambil dari database, opsi jawaban diacak, pemeriksaan jawaban di server, nilai 0–100, XP, dan riwayat sesi.
- Menandai materi selesai; progres tersimpan pada database dan mengikuti akun pengguna.
- Area pengajar/admin untuk menambahkan materi dan menerbitkannya.
- RLS (Row Level Security) untuk akses data dan kunci jawaban soal tidak tersedia langsung untuk browser learner.
- Data awal kategori, 10 materi, kosakata, dan 14 soal beserta pilihan jawaban melalui SQL migration.

## Prasyarat
- Node.js 20 atau versi LTS yang didukung Next.js.
- Akun Supabase.
- Git (opsional tetapi disarankan).

## Menjalankan lokal
1. Ekstrak ZIP.
2. Buka terminal pada folder proyek.
3. Instal dependency:

   ```bash
   npm install
   ```

4. Salin `.env.example` menjadi `.env.local`.
5. Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` dari Supabase Project Settings → API.
6. Di Supabase Dashboard, buka **SQL Editor**, lalu jalankan seluruh `supabase/migrations/0001_init.sql`.
7. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

8. Buka http://localhost:3000.

## Menyiapkan Supabase
1. Buat proyek di https://supabase.com.
2. Ambil Project URL dan anon/publishable key dari pengaturan API.
3. Ambil service role key untuk variabel server-only `SUPABASE_SERVICE_ROLE_KEY`.
4. Jangan pernah menaruh service role key di variabel `NEXT_PUBLIC_*`, di kode browser, atau di Git.
5. Jalankan migrasi SQL yang disediakan.
6. Buat akun melalui `/register`. Jika konfirmasi email aktif, verifikasi email sesuai instruksi Supabase sebelum login.
7. Agar akun pertama menjadi admin, setelah akun dibuat jalankan query berikut di SQL Editor, ganti alamat emailnya:

   ```sql
   update public.profiles p
   set role = 'admin'
   from auth.users u
   where p.id = u.id and u.email = 'email-admin-anda@example.com';
   ```

8. Keluar lalu masuk kembali. Menu “Kelola konten” akan tersedia untuk peran `admin` atau `teacher`.

## Deployment ke Vercel
1. Buat repository GitHub baru dan push seluruh isi folder proyek.
2. Buka https://vercel.com/new dan impor repository tersebut.
3. Tambahkan ketiga environment variable yang sama di Vercel Project Settings → Environment Variables.
4. Deploy.
5. Di Supabase Authentication → URL Configuration, atur Site URL ke domain Vercel dan tambahkan URL callback/redirect yang sesuai untuk login serta verifikasi email.

> GitHub Pages hanya melayani file statis; tidak menjalankan server Next.js. Untuk aplikasi full-stack ini gunakan Vercel atau hosting Node.js yang kompatibel.

## Catatan keamanan dan ruang lingkup
- `SUPABASE_SERVICE_ROLE_KEY` melewati RLS. Modul admin hanya digunakan dari server setelah identitas pengguna diverifikasi. Jangan mengimpor `src/lib/supabase/admin.ts` dari Client Component.
- Jawaban benar dan pemeriksaan jawaban kuis dilakukan server-side. Client hanya menerima teks pilihan, lalu meminta pemeriksaan setelah pengguna menjawab.
- RLS disediakan sebagai baseline. Lakukan audit kebijakan sebelum produksi, terutama saat menambahkan operasi edit/hapus, laporan kelas, unggahan file, dan pengelolaan pengguna.
- MVP ini belum mencakup edit/hapus materi, manajemen soal lengkap di dashboard, OAuth Google, email reset password, sertifikat, kelas/kelas virtual, atau multi-institusi.
- Seed memuat materi dasar sebagai titik awal. Tinjau ketepatan materi dan contoh Arab bersama pengajar sebelum digunakan secara formal.
- Google Fonts digunakan untuk Inter dan Amiri; untuk penggunaan tanpa internet, unduh font dan sajikan dari `public/fonts`.
