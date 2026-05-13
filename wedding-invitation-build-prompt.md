# Prompt: Wedding Invitation Web App — Full Build

> Copy-paste prompt ini ke Claude, Cursor, atau AI coding agent lain.
> Prompt ini self-contained — semua keputusan arsitektur, stack, schema, dan requirement sudah terdefinisi.

---

## KONTEKS & TUJUAN

Bangun aplikasi web undangan pernikahan lengkap dengan dua layer:
1. **Public View** — halaman undangan yang dilihat tamu
2. **Admin Panel** — dashboard untuk pengantin/keluarga mengisi dan mengelola semua konten

Aplikasi ini harus bisa digunakan untuk satu pernikahan (single-tenant), di-deploy ke Vercel, dengan database Neon PostgreSQL.

---

## TECH STACK (TIDAK BOLEH DIUBAH)

```
Framework     : Next.js 14 (App Router)
Styling       : Tailwind CSS
Animasi       : Framer Motion
Database      : Neon PostgreSQL (@neondatabase/serverless)
Auth          : JWT (jsonwebtoken) + bcryptjs, disimpan di httpOnly cookie
Font          : next/font (Google Fonts — Cormorant Garamond + Jost)
Image         : next/image
Deploy target : Vercel
```

---

## STRUKTUR DIREKTORI LENGKAP

```
/app
  layout.tsx                        ← Root layout, font injection
  page.tsx                          ← Cover page (animasi buka undangan)

  /invitation
    page.tsx                        ← Public view (scroll-spy SPA)
    layout.tsx                      ← Navbar public

  /admin
    layout.tsx                      ← Guard: redirect ke /admin/login jika tidak ada session
    page.tsx                        ← Redirect ke /admin/dashboard

    /login
      page.tsx                      ← Form login admin

    /dashboard
      page.tsx                      ← Overview: statistik RSVP, ucapan pending, countdown

    /wedding
      page.tsx                      ← Edit data pasangan, orang tua, cover image, musik

    /events
      page.tsx                      ← Kelola 3 event (toggle aktif, edit detail)

    /gallery
      page.tsx                      ← Upload/reorder/hapus foto

    /rsvp
      page.tsx                      ← Tabel RSVP + export CSV

    /guestbook
      page.tsx                      ← Moderasi ucapan (approve/reject)

    /settings
      page.tsx                      ← Pilih tema (gelap/terang), music on/off, cover page text

/components
  /public
    CoverPage.tsx                   ← Animasi curtain reveal
    Navbar.tsx                      ← Sticky scroll-spy navbar
    HeroSection.tsx                 ← Nama pasangan, foto, quote
    EventsSection.tsx               ← 3 event cards + countdown per event
    GallerySection.tsx              ← Masonry grid + lightbox
    RSVPSection.tsx                 ← Form RSVP multi-event
    GuestbookSection.tsx            ← Tampilkan ucapan + form kirim ucapan
    EnvelopeSection.tsx             ← Amplop digital (nomor rekening)
    MusicPlayer.tsx                 ← Sticky floating music toggle
    FooterPublic.tsx

  /admin
    Sidebar.tsx                     ← Navigasi admin
    Header.tsx                      ← Topbar dengan nama user + logout
    StatCard.tsx                    ← Kartu statistik dashboard
    EventForm.tsx                   ← Form edit satu event
    GalleryUpload.tsx               ← Drag-drop upload
    RSVPTable.tsx                   ← Tabel dengan filter + pagination
    GuestbookTable.tsx              ← Tabel moderasi

  /ui
    Button.tsx
    Input.tsx
    Modal.tsx
    Toast.tsx
    Toggle.tsx
    Badge.tsx

/lib
  db.ts                             ← Neon connection pool (singleton)
  auth.ts                           ← JWT sign/verify, cookie helpers
  hash.ts                           ← bcrypt wrapper
  rateLimit.ts                      ← In-memory rate limiter (upstash-style)
  cache.ts                          ← Simple in-memory cache dengan TTL
  validations.ts                    ← Zod schemas untuk semua input

/middleware.ts                      ← Proteksi semua route /admin/* kecuali /admin/login

/app/api
  /auth
    /login/route.ts                 ← POST: login, set httpOnly cookie
    /logout/route.ts                ← POST: hapus cookie
    /me/route.ts                    ← GET: cek session aktif

  /wedding/route.ts                 ← GET (public), PUT (admin only)
  /events/route.ts                  ← GET (public), POST (admin)
  /events/[id]/route.ts             ← PUT, DELETE (admin)
  /gallery/route.ts                 ← GET (public), POST (admin)
  /gallery/[id]/route.ts            ← DELETE, PATCH reorder (admin)
  /rsvp/route.ts                    ← GET (admin), POST (public, rate-limited)
  /rsvp/export/route.ts             ← GET CSV export (admin)
  /guestbook/route.ts               ← GET approved (public), POST (public, rate-limited)
  /guestbook/[id]/route.ts          ← PATCH approve/reject (admin), DELETE (admin)
  /settings/route.ts                ← GET (public), PUT (admin)
```

---

## DATABASE SCHEMA (NEON POSTGRESQL)

Buat file `/lib/schema.sql` dengan isi berikut, dan buat juga `/lib/migrate.ts` untuk menjalankannya:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wedding config (single row, id = 'main')
CREATE TABLE IF NOT EXISTS wedding_config (
  id VARCHAR(10) PRIMARY KEY DEFAULT 'main',
  groom_name VARCHAR(100) NOT NULL DEFAULT '',
  bride_name VARCHAR(100) NOT NULL DEFAULT '',
  groom_full_name VARCHAR(150) DEFAULT '',
  bride_full_name VARCHAR(150) DEFAULT '',
  groom_parents TEXT DEFAULT '',
  bride_parents TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  music_url TEXT DEFAULT '',
  music_autoplay BOOLEAN DEFAULT FALSE,
  opening_quote TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config row
INSERT INTO wedding_config (id) VALUES ('main') ON CONFLICT DO NOTHING;

-- Events (max 3: lamaran, akad, resepsi)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('lamaran', 'akad', 'resepsi')),
  is_active BOOLEAN DEFAULT TRUE,
  event_date DATE,
  time_start TIME,
  time_end TIME,
  venue_name VARCHAR(200) DEFAULT '',
  address TEXT DEFAULT '',
  maps_url TEXT DEFAULT '',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  dress_code VARCHAR(100) DEFAULT '',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default 3 events
INSERT INTO events (type, order_index) VALUES
  ('lamaran', 1),
  ('akad', 2),
  ('resepsi', 3)
ON CONFLICT DO NOTHING;

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSVP
CREATE TABLE IF NOT EXISTS rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  guest_count INT DEFAULT 1,
  attending_lamaran BOOLEAN DEFAULT FALSE,
  attending_akad BOOLEAN DEFAULT FALSE,
  attending_resepsi BOOLEAN DEFAULT FALSE,
  message TEXT DEFAULT '',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guestbook
CREATE TABLE IF NOT EXISTS guestbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  id VARCHAR(10) PRIMARY KEY DEFAULT 'main',
  theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  cover_title TEXT DEFAULT 'Kami Menikah',
  cover_subtitle TEXT DEFAULT 'Buka undangan untuk melihat detail',
  show_lamaran BOOLEAN DEFAULT TRUE,
  show_akad BOOLEAN DEFAULT TRUE,
  show_resepsi BOOLEAN DEFAULT TRUE,
  show_gallery BOOLEAN DEFAULT TRUE,
  show_envelope BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (id) VALUES ('main') ON CONFLICT DO NOTHING;

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_rsvp_created ON rsvp(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_approved ON guestbook(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery(order_index ASC);
```

---

## SECURITY & PERFORMANCE REQUIREMENTS

### 1. Rate Limiting (`/lib/rateLimit.ts`)

Implementasi in-memory rate limiter. Jangan gunakan library eksternal — buat sendiri:

```typescript
// Sliding window rate limiter
// Simpan di Map<ip, { count, resetAt }>
// Cleanup entry yang expired setiap 5 menit

export function rateLimit(config: {
  windowMs: number   // durasi window dalam ms
  max: number        // max request per window per IP
}) {
  // return middleware function yang bisa dipanggil di route handler
  // return { success: boolean, remaining: number, resetAt: number }
}

// Konfigurasi per endpoint:
// POST /api/rsvp       → max 3 per 10 menit per IP
// POST /api/guestbook  → max 5 per 10 menit per IP
// POST /api/auth/login → max 5 per 15 menit per IP (brute force protection)
```

### 2. Caching (`/lib/cache.ts`)

```typescript
// Simple TTL cache untuk data yang jarang berubah
// wedding_config    → TTL 60 detik
// events            → TTL 60 detik
// app_settings      → TTL 60 detik
// gallery           → TTL 30 detik
// guestbook public  → TTL 30 detik

// Cache HARUS di-invalidate saat admin melakukan PUT/POST/DELETE
// Implementasi: Map<key, { data, expiresAt }>
```

### 3. Input Validation (`/lib/validations.ts`)

Gunakan **Zod** untuk semua input. Schema wajib ada untuk:

```typescript
// RSVPSchema: name (min 2, max 150), phone (optional, format Indonesia),
//             guest_count (1-10), attending_* (boolean)
// GuestbookSchema: name (min 2, max 150), message (min 5, max 1000)
// LoginSchema: username (min 3), password (min 8)
// WeddingConfigSchema: semua field dengan max length
// EventSchema: date (valid date), time format, koordinat range valid
```

### 4. Auth & Session (`/lib/auth.ts`)

```typescript
// JWT payload: { userId, username, iat, exp }
// JWT_SECRET dari environment variable — WAJIB ada, throw error jika tidak
// Token expiry: 7 hari
// Cookie config: httpOnly: true, secure: true (production), sameSite: 'lax', path: '/'
// Middleware /middleware.ts: cek cookie di semua /admin/* kecuali /admin/login
//   → jika tidak ada/invalid token: redirect ke /admin/login
//   → jika ada token valid: set header X-User-Id untuk dipakai di API routes
```

### 5. API Security

Setiap API route yang membutuhkan auth admin harus:
```typescript
// 1. Panggil verifyAuth(request) — return null jika tidak terautentikasi
// 2. Return 401 jika null
// 3. JANGAN expose password_hash di response apapun
// 4. Sanitize semua string input (trim whitespace, escape HTML di message/quote)
// 5. Set Content-Security-Policy header di middleware
```

### 6. Environment Variables

Buat file `.env.example`:
```
DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require
JWT_SECRET=minimum-32-karakter-random-string
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=development
```

Validasi semua env var wajib ada saat startup di `/lib/env.ts` — throw error dengan pesan jelas jika ada yang kosong.

---

## PUBLIC VIEW — SPESIFIKASI UI/UX

### Cover Page (`/app/page.tsx` + `CoverPage.tsx`)

Tampilan pertama sebelum undangan dibuka:
- Background gelap (tema dark) atau champagne (tema light) dengan subtle texture/noise CSS
- Nama pasangan di tengah dengan font Cormorant Garamond italic, ukuran besar
- Tombol "Buka Undangan" — klik trigger animasi curtain reveal:
  - Dua panel (kiri & kanan) slide keluar ke sisi masing-masing (Framer Motion)
  - Di balik curtain langsung terlihat HeroSection
  - Setelah animasi selesai, Cover unmount dan URL berubah ke `/invitation`
- Teks cover bisa dikustomisasi dari admin settings

### Navbar Public (`Navbar.tsx`)

- Sticky top, z-50
- Awalnya transparent di atas hero, berubah menjadi blur backdrop + border bottom saat scroll > 80px
- Item: Beranda · Acara · Galeri · RSVP · Ucapan · Amplop
- Scroll-spy: highlight item aktif berdasarkan section yang sedang di viewport (IntersectionObserver)
- Klik item → smooth scroll ke section
- Mobile: hamburger menu → drawer dari kanan

### HeroSection

- Full viewport height
- Foto pasangan sebagai background dengan overlay gradient
- Nama pasangan: font Cormorant Garamond, animasi fade+scale saat load
- Tanggal pernikahan
- Ornamen dekoratif (SVG garis tipis, bukan emoji)
- Scroll indicator animasi bounce di bawah

### EventsSection

- Section label kecil "RANGKAIAN ACARA" dengan letter-spacing
- Tiga card event (hanya tampilkan yang `is_active = true`)
- Tiap card: nomor urut, judul event, tanggal, waktu, venue, dress code
- Countdown timer per event — angka berubah dengan AnimatePresence slide
- Tombol "Lihat Lokasi" → buka Google Maps di tab baru
- Card entrance: staggered dari bawah saat masuk viewport

### GallerySection

- Masonry grid (3 kolom desktop, 2 kolom mobile)
- Hover: overlay gelap + scale 1.03
- Klik foto → lightbox dengan Framer Motion `layoutId` expand animation
- Lightbox: navigasi prev/next, klik di luar untuk tutup

### RSVPSection

- Background berbeda (sedikit lebih gelap/terang dari sekitarnya)
- Field: Nama, Nomor HP, Jumlah tamu (1-10), Checkboxes event yang dihadiri
- Submit → optimistic UI (langsung tampilkan success state)
- Jika rate limit tercapai: tampilkan pesan ramah, bukan error generik
- Validasi client-side dengan Zod + react-hook-form sebelum submit

### GuestbookSection

- Tampilkan hanya ucapan yang `is_approved = true`
- Animasi: ucapan baru muncul dengan slide dari bawah
- Form kirim ucapan: nama + pesan
- Setelah submit: tampilkan "Ucapan sedang menunggu persetujuan"

### EnvelopeSection

- Card per rekening: nama bank, nomor rekening, nama pemilik
- Tombol "Salin" dengan feedback visual (berubah jadi "Tersalin ✓" selama 2 detik)

### Music Player (`MusicPlayer.tsx`)

- Floating button sudut kanan bawah
- Default: OFF (autoplay diblokir browser)
- Jika admin set `music_autoplay = true` di settings: coba autoplay setelah interaksi pertama user
- Animasi: icon berputar saat play, berhenti saat pause

---

## TEMA SYSTEM

Admin bisa pilih satu dari dua tema. Implementasi via CSS custom properties di root:

### Tema Dark (default)
```css
--bg-primary: #1A1410;
--bg-secondary: #2A1F14;
--bg-card: #231A10;
--text-primary: #FAF7F2;
--text-secondary: #B5A99A;
--text-muted: #7A6A58;
--accent: #B8965A;
--accent-light: #D4B483;
--border: rgba(184, 150, 90, 0.2);
--font-display: 'Cormorant Garamond', serif;
--font-body: 'Jost', sans-serif;
```

### Tema Light
```css
--bg-primary: #FAF7F2;
--bg-secondary: #F3EDE3;
--bg-card: #FFFFFF;
--text-primary: #2A1F14;
--text-secondary: #5C4A35;
--text-muted: #9A8A78;
--accent: #9E7340;
--accent-light: #C49A5A;
--border: rgba(158, 115, 64, 0.2);
```

Tema disimpan di `app_settings.theme`. Public view membaca dari API saat load dan menerapkan class `theme-dark` atau `theme-light` ke `<html>`.

---

## ADMIN PANEL — SPESIFIKASI UI/UX

### Layout Admin

- Sidebar fixed kiri (240px) — navigasi semua halaman admin
- Main content area dengan header (breadcrumb + nama user + logout)
- Sidebar mobile: drawer overlay
- Tema admin: selalu light (bersih, mudah dibaca)

### Dashboard (`/admin/dashboard`)

Tampilkan metric cards:
- Total RSVP
- Hadir Akad (count dari `attending_akad = true`)
- Hadir Resepsi (count dari `attending_resepsi = true`)
- Ucapan Pending (count `is_approved = false`)

Dibawahnya: tabel 5 RSVP terbaru, dan 3 ucapan pending dengan tombol approve langsung.

### Events (`/admin/events`)

Tiga card per event dengan:
- Toggle aktif/nonaktif (langsung update DB)
- Form inline untuk edit semua field
- Preview countdown kecil

### Gallery (`/admin/gallery`)

- Drag-drop reorder (react-beautiful-dnd atau @dnd-kit/sortable)
- Upload: input file dengan preview sebelum upload
- Untuk URL gambar: simpan URL eksternal (Cloudinary/Uploadthing/direct URL) — jangan simpan binary di DB
- Tombol hapus per foto dengan konfirmasi modal

### RSVP (`/admin/rsvp`)

- Tabel sortable: nama, HP, jumlah tamu, event yang dihadiri, tanggal submit
- Filter per event
- Search by nama
- Tombol "Export CSV" — download semua data sebagai file CSV

### Guestbook (`/admin/guestbook`)

- Tab: Pending | Approved | Rejected
- Tiap row: nama, pesan (truncated), tanggal, tombol Approve + Reject
- Bulk action: approve semua pending

### Settings (`/admin/settings`)

- Toggle tema: Dark / Light (dengan preview thumbnail)
- Toggle music autoplay
- Edit teks cover page
- Toggle show/hide per section
- Danger zone: Reset semua data (dengan konfirmasi double)

---

## ANIMASI — SPESIFIKASI FRAMER MOTION

```typescript
// Variants yang harus konsisten dipakai di seluruh app:

export const fadeUpVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
}

export const staggerContainerVariant = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
}

export const curtainVariant = {
  initial: { x: 0 },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'left' ? '-100%' : '100%',
    transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] }
  })
}

// Countdown digit flip:
export const digitVariant = {
  enter: { y: -20, opacity: 0 },
  center: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: { y: 20, opacity: 0, transition: { duration: 0.3 } }
}

// Semua whileInView harus pakai: viewport={{ once: true, margin: "-50px" }}
// Ini memastikan animasi hanya trigger sekali, tidak repeat saat scroll balik
```

---

## SETUP & INITIAL DATA

Buat script `/scripts/setup.ts` yang bisa dijalankan dengan `npx ts-node scripts/setup.ts`:

1. Jalankan semua SQL dari `schema.sql`
2. Buat admin user default:
   - Username: `admin`
   - Password: `admin123` (bcrypt hash, user HARUS ganti setelah login pertama)
3. Insert sample data wedding config dan events kosong
4. Print instruksi ke terminal: "Setup selesai. Login ke /admin dengan admin/admin123. Segera ganti password."

---

## PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "^18",
    "react-dom": "^18",
    "tailwindcss": "^3",
    "@neondatabase/serverless": "^0.9.x",
    "framer-motion": "^11",
    "jsonwebtoken": "^9",
    "bcryptjs": "^2.4",
    "zod": "^3",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^8"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9",
    "@types/bcryptjs": "^2.4",
    "typescript": "^5"
  }
}
```

---

## INSTRUKSI UNTUK AI AGENT

1. **Buat SEMUA file** yang tercantum di struktur direktori — jangan skip
2. **Jangan gunakan `any` TypeScript** — semua harus typed dengan benar
3. **Setiap API route** wajib: validasi input dengan Zod, cek auth jika diperlukan, tangani error dengan response JSON yang konsisten `{ success, data?, error? }`
4. **Jangan gunakan `localStorage`** untuk menyimpan JWT — wajib httpOnly cookie
5. **Semua form admin** harus ada loading state dan error handling
6. **Mobile responsive** wajib untuk semua halaman public dan admin
7. **Saat ragu antara dua implementasi**, pilih yang lebih sederhana dan lebih mudah di-maintain
8. **Buat `README.md`** dengan instruksi setup lengkap: clone, install, setup env, migrate DB, jalankan dev server
9. **Jangan hardcode** data pernikahan apapun — semua dari DB
10. **Setelah selesai**, list semua file yang dibuat dan perintah untuk menjalankan setup script

---

## CHECKLIST SEBELUM SELESAI

- [ ] Semua route `/admin/*` ter-protect oleh middleware
- [ ] Rate limiting aktif di endpoint RSVP, Guestbook, Login
- [ ] Cache di-invalidate setiap kali admin update data
- [ ] Password hash menggunakan bcrypt (bukan md5/sha)
- [ ] JWT secret dibaca dari env, bukan hardcode
- [ ] Tidak ada `console.log` dengan data sensitif di production code
- [ ] Semua input di-sanitize sebelum masuk DB
- [ ] Export CSV tidak expose kolom IP address
- [ ] `next/image` dipakai untuk semua gambar
- [ ] `loading.tsx` ada di setiap admin route untuk loading state
- [ ] Error boundary ada di public view
- [ ] `.env.example` ada di root project
- [ ] `.env` ada di `.gitignore`
