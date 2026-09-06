# HJAR Sysinfo Web

Vue 3 SPA untuk alur kerja data pembanding properti HJAR. Frontend menggunakan TypeScript, Vue Router, Pinia, TanStack Vue Query, PrimeVue, dan client yang dihasilkan dari kontrak OpenAPI Laravel.

## Menjalankan aplikasi

### Development dengan Docker

Requirement: Docker Engine/Docker Desktop dan Docker Compose v2 atau lebih baru.
Node.js dan npm di host tidak diperlukan.

```sh
docker compose up --build -d --wait
```

Buka <http://localhost:5173>. Source code di-mount dari direktori proyek sehingga
perubahan langsung masuk melalui hot reload. Container memakai Node.js `24.15.0`
untuk memenuhi requirement dependency dan berjalan sebagai user `node` (UID/GID 1000).
Dependency disimpan di volume Docker, terpisah dari `node_modules` host.

```sh
# Melihat log
docker compose logs -f web

# Menjalankan pemeriksaan kualitas di container yang sedang berjalan
docker compose exec web npm run check

# Menghentikan development (dependency tetap tersimpan)
docker compose down
```

Setelah `package.json` atau `package-lock.json` berubah, misalnya setelah pull atau
pindah branch, sinkronkan dependency di volume lalu restart Vite. Rebuild image
saja tidak memperbarui volume yang sudah ada:

```sh
docker compose stop web
docker compose run --rm --no-deps web npm ci --no-audit --no-fund
docker compose up -d --wait
```

Untuk menambah dependency, gunakan `docker compose exec web npm install <paket>`;
perubahan manifest dan lockfile juga tersimpan di host.

Konfigurasi API tetap dibaca dari `.env.development`. Override lokal dapat ditulis
ke `.env.development.local` (diabaikan Git). Contoh jika backend Laravel berjalan
di host pada port 8000:

```dotenv
API_PROXY_TARGET="http://host.docker.internal:8000"
```

Backend harus mendengarkan alamat yang bisa dijangkau container (misalnya
`0.0.0.0:8000`) dan menerima origin development untuk autentikasi Sanctum.
Restart container setelah mengubah konfigurasi env. Compose mengatur
`VITE_API_BASE_URL` ke origin frontend agar request tetap melewati proxy Vite.

Jika port 5173 sudah dipakai, jalankan `DEV_PORT=5174 docker compose up -d --wait`
lalu buka <http://localhost:5174>. Untuk Docker Desktop/WSL yang tidak mendeteksi
perubahan file, jalankan `VITE_USE_POLLING=true docker compose up -d --wait`.
Kedua opsi ini juga dapat disimpan di `.env` pada root proyek agar berlaku untuk
perintah Compose berikutnya. Polling menggunakan lebih banyak CPU.

Referensi: [Docker Compose](https://docs.docker.com/reference/compose-file/services/)
dan [opsi server Vite](https://vite.dev/config/server-options).

### Development tanpa Docker

Requirement: Node.js `^22.18.0` atau `>=24.12.0`.

```sh
npm install
npm run dev
```

`.env.development` memakai proxy Vite agar cookie Sanctum tetap same-origin di browser:

```dotenv
VITE_API_BASE_URL="http://localhost:5173"
API_PROXY_TARGET="https://pd-api.kjpp-hjar.co.id"
```

`cookieDomainRewrite` menghapus domain cookie milik backend hanya pada proxy development.
`.env.production` mengarah langsung ke `https://pd-api.kjpp-hjar.co.id`; domain web production harus
berbagi top-level domain dengan API agar autentikasi cookie Sanctum berfungsi. Nilai deployment dapat
dioverride saat build.

Semua variable `VITE_*` dikirim ke browser dan tidak boleh berisi token, password, atau secret lain.

## Integrasi API

Web menggunakan Laravel Sanctum session cookie, bukan bearer token. Urutan autentikasi yang digunakan:

1. `GET /sanctum/csrf-cookie`
2. `POST /api/v1/auth/session`
3. `GET /api/v1/auth/me`
4. Request feature di bawah `/api/v1`
5. `DELETE /api/v1/auth/session` saat logout

`src/shared/api/client.ts` selalu mengirim cookie, sedangkan `src/shared/api/csrf.ts` menginisialisasi CSRF dan meneruskan cookie `XSRF-TOKEN` sebagai header `X-XSRF-TOKEN` untuk mutation.

Jalankan pemeriksaan non-mutating terhadap CSRF, session, reference endpoint, dan CORS:

```sh
npm run api:probe
# atau backend lain
npm run api:probe -- https://api.example.com
```

Sebelum mengimplementasikan feature endpoint, ambil artifact OpenAPI backend sebagai `api.json`, lalu generate dan verifikasi tipe:

```sh
npm run api:generate
npm run api:check
```

Jangan membuat tipe response endpoint secara manual. Status dan dependency seluruh endpoint ada di [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md).

## Pemeriksaan kualitas

```sh
npm run typecheck
npm run lint
npm run test
npm run build
```

Semua pemeriksaan utama dapat dijalankan sekaligus dengan `npm run check`. Pengujian browser tersedia melalui `npm run test:e2e` setelah browser Playwright dipasang.

## Dokumentasi

- [Arsitektur frontend](docs/FRONTEND_ARCHITECTURE.md)
- [Katalog endpoint](docs/API_ENDPOINTS.md)
- [Widget dashboard dan permission](docs/DASHBOARD.md)
- [Checklist implementasi](docs/IMPLEMENTATION_CHECKLIST.md)
- [Pola komponen](docs/COMPONENT_PATTERNS.md)
- [Design system](DESIGN.md)
