# Dashboard

Dashboard menggunakan satu request `GET /api/v1/dashboard` melalui typed API client
dan Vue Query (`['dashboard']`, stale time 60 detik). Widget membaca payload yang
sama, sehingga membuka grafik, memilih titik, dan mengganti filter peta tidak
menambah request dashboard.

Implementasi frontend dicocokkan pada 5 September 2026 dengan
[DashboardController backend](https://github.com/ioncrisa2/HJARsysinfo/blob/e001929065cb91b742315980b922b99746052d29/app/Http/Controllers/Api/DashboardController.php)
dan [AppAccess backend](https://github.com/ioncrisa2/HJARsysinfo/blob/e001929065cb91b742315980b922b99746052d29/app/Support/AppAccess.php).
Pemeriksaan ini memverifikasi sumber kode, bukan deployment atau data production.

## Widget dan permission

Frontend hanya menampilkan widget jika `can_widgets[key]` memberikan izin eksplisit.
Data yang ada di payload tidak dianggap sebagai izin. Backend tetap melakukan
authorization dan menentukan cakupan datanya.

| Widget | Key `can_widgets` | Permission backend | Data |
|---|---|---|---|
| Statistik | `statsOverview` | `widget_StatsOverview` | `stats` |
| Peta sebaran | `map` | `widget_Map` | `map_points` |
| Tren input | `dataEntryTrendChart` | `widget_DataEntryTrendChart` | `monthly_data` |
| Komposisi listing | `listingCompositionChart` | `widget_ListingCompositionChart` | `listing_ratio_monthly` |
| Data terbaru | `latestPembandingTable` | `widget_LatestPembandingTable` | `recent_data` |
| Kontributor teratas | `topContributorTable` | `widget_TopContributorTable` | `top_contributors` |
| Keterkinian data | `dataFreshnessWidget` | `widget_DataFreshnessWidget` | `data_freshness` |
| Wilayah aktif | `topAreaActivityTable` | `widget_TopAreaActivityTable` | `top_area_activity` |
| Jenis objek | `objectTypeCountTable` | `widget_ObjectTypeCountTable` | `object_type_counts` |

Varian `data_contributor` hanya menerima payload dasar: statistik, peta, options,
capabilities, dan alert. Frontend tidak mengharuskan field widget tambahan tersedia.
Akun tanpa izin widget mendapat pesan akses yang jelas. Tautan dari lokasi terpilih
ke detail memakai `can.viewData`; halaman detail tetap tunduk pada policy API.

## Peta

- Leaflet dan CSS-nya dimuat ketika widget dengan titik valid dipasang.
- Marker memakai canvas untuk mengurangi jumlah elemen DOM. Memilih marker atau
  rekaman pada daftar menampilkan ringkasan dan menyorot titik terpilih.
- Tombol zoom, tombol lihat semua titik, dan daftar lokasi berhalaman menyediakan
  kontrol alternatif. Scroll halaman tidak otomatis mengubah zoom peta.
- Filter jenis listing bekerja pada `map_points` yang diterima dan disimpan sebagai
  `?map_listing=<id>`. Filter tidak mengubah statistik atau grafik. Back/forward dan
  deep link menggunakan filter yang sama.
- Koordinat non-finite atau di luar rentang lintang/bujur ditolak dan jumlahnya
  diinformasikan. Nilai nol tetap merupakan koordinat valid.
- Peta dasar menggunakan tile OpenStreetMap beserta atribusi. Kegagalan tile
  memiliki pesan dan retry; titik serta daftar tetap dapat digunakan. Deployment
  dengan CSP perlu mengizinkan gambar dari `https://tile.openstreetmap.org`.
- Backend saat ini mengirim semua titik yang memenuhi query tanpa pagination.
  Evaluasi ukuran payload dan kebutuhan agregasi/cluster dengan data staging
  sebelum menganggap performa skala production terverifikasi.

Referensi implementasi: [Leaflet](https://leafletjs.com/reference.html) dan
[kebijakan tile OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/).

## Grafik dan ringkasan

Chart.js dimuat ketika grafik dengan data tersedia dipasang. Grafik responsif,
tanpa animasi, dan memiliki nama aksesibel, ringkasan, serta tabel angka yang dapat
dibuka dengan keyboard. Seri listing dibedakan dengan bentuk titik dan pola garis.

- Tren mengikuti `monthly_data` dari backend (12 bulan pada controller saat ini),
  dihitung dari tanggal input `created_at`. Bulan dengan nol input tetap ditampilkan.
- Komposisi mengikuti `ratios`, `counts`, dan `month_totals` dari server. Backend
  mengirim hingga lima jenis listing teratas; total persentase seri yang ditampilkan
  tidak selalu mencapai 100%. Nilai tidak dinormalisasi ulang di frontend.
- Keterkinian dihitung backend dari `tanggal_data`, bukan tanggal input. Rekaman
  tanpa tanggal mempunyai baris terpisah.
- Kontributor dihitung sepanjang waktu; aktivitas kecamatan memakai periode
  `30 hari terakhir`; jenis objek mengikuti objek aktif dari backend.

Referensi: [integrasi Chart.js](https://www.chartjs.org/docs/latest/getting-started/integration.html).

## Status dan batas kontrak

Initial loading, error/retry, data kosong, dan tidak ada izin dibedakan. Refetch
yang gagal tetap menampilkan data terakhir beserta pemberitahuan; request yang
tertunda karena offline menampilkan status koneksi. Tombol perbarui memakai query
yang sama.

Generated schema masih menyebut `can`/`can_widgets` sebagai string, sementara
backend mengirim boolean. Helper `capabilityGranted` menerima grant eksplisit
`true`, `"true"`, `1`, atau `"1"`; nilai lain ditolak, termasuk `"false"`.
Schema juga salah menggambarkan `data_freshness.with_date`; frontend tidak memakai
field tersebut. Generated file tidak diedit manual. Perbaikan schema backend dan
regenerasi dari artifact OpenAPI masih diperlukan.

Parameter `period`, `jenis_listing_id`, dan `widgets[]` pada katalog endpoint adalah
target kontrak; operasi generated saat ini mendefinisikan `query?: never` dan
controller belum memproses parameter tersebut. Frontend tidak mengirim parameter
yang belum didukung.

## Verifikasi

```sh
docker compose exec web npx vitest run src/features/dashboard
docker compose exec web npx eslint src/features/dashboard e2e/dashboard.spec.ts
# Dengan browser Playwright terpasang di environment pengujian:
npm run test:e2e -- e2e/dashboard.spec.ts --project=chromium
```

Component tests mencakup grant/deny permission, koordinat invalid, bulan nol,
filter URL, pemilihan titik, empty state, dan kegagalan background refetch. E2E
mencakup 360/768/1024/1440px, back/forward, peta dasar gagal, tabel alternatif,
retry, varian kontributor, dan pemeriksaan axe pada area dashboard.

Pengukuran build lokal awal: chunk dashboard sekitar 8,5 KB gzip, Leaflet 43,4 KB,
Chart.js 56,2 KB; entry sekitar 98,6 KB. Seluruhnya di bawah bundle budget proyek.
E2E memastikan satu request dashboard untuk flow interaksi yang diuji. Screenshot
menggunakan fixture, bukan data production; pengukuran payload dan render dengan
volume data nyata serta verifikasi login staging masih terbuka.
