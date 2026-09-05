# HJAR Sysinfo Web

Vue 3 SPA untuk alur kerja data pembanding properti HJAR. Frontend menggunakan TypeScript, Vue Router, Pinia, TanStack Vue Query, PrimeVue, dan client yang dihasilkan dari kontrak OpenAPI Laravel.

## Menjalankan aplikasi

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
- [Checklist implementasi](docs/IMPLEMENTATION_CHECKLIST.md)
- [Pola komponen](docs/COMPONENT_PATTERNS.md)
- [Design system](DESIGN.md)
