# Status alur Data Pembanding

## Implementasi yang tersedia

| Bagian | Implementasi |
| --- | --- |
| Daftar | Query API, pencarian dengan debounce, filter wilayah/jenis/harga/tanggal/pembuat, sorting, pagination, filter di URL, dan pintu masuk ekspor. |
| Detail | Informasi properti, foto beserta fallback, koordinat dan tautan peta, tombol edit, permintaan hapus, serta tombol Historis. |
| Tambah/edit | Empat langkah bersama: dasar, lokasi, properti, sumber/foto. Opsi dari API, wilayah bertingkat, payload multipart, dan pengingat perubahan yang belum disimpan. |
| Duplikat | Penanganan respons 409, halaman tinjauan, dan API resolusi duplikat tersedia. |

## Perbaikan pada alur form

- Pesan validasi Laravel 422 dibaca dari `ApiError.fieldErrors`, sesuai normalisasi API client. Form kembali ke langkah pertama yang memiliki kesalahan.
- Submit memakai callback `mutate` untuk menangani kegagalan. Penolakan request yang sudah ditampilkan di form tidak lagi diteruskan sebagai promise rejection ke layar error aplikasi.
- Pratinjau foto dibuat dari file dalam state form, sehingga tetap tersedia ketika langkah foto dibuka kembali. Object URL dilepas saat file berubah atau komponen dilepas.
- Tombol navigasi dan simpan pada tambah/edit membungkus ke baris berikutnya di layar kecil agar tidak menimbulkan scroll horizontal.

## Aturan akses dan historis

- Semua pengguna aktif yang sudah login dapat membuka daftar/detail dan mengedit pembanding tanpa permission edit khusus.
- Jika memiliki role `data_contributor`, pengguna hanya dapat melihat dan mengedit data dengan `created_by` miliknya. Filter pembuat di URL tidak dapat memperluas cakupan ini.
- Pengguna selain contributor dapat mengedit atau mengajukan hapus data contributor. Pengajuan tidak menghapus langsung; persetujuan moderator dan izin hapus tetap terpisah.
- Backend menerapkan batas contributor pada daftar, detail, edit, historis, pengajuan hapus, hasil serupa, pencarian global, peta, statistik dashboard, serta query ekspor. Izin ekspor yang sudah ada tetap berlaku.
- Tombol **Historis** membuka panel di halaman detail. Aktivitas memuat aktor/email, waktu WIB, jenis aktivitas, nama field, nilai sebelum/sesudah, dan penanda ditambahkan/diubah/dihapus. Rincian setiap aktivitas dapat dilipat.
- Riwayat diambil hanya saat panel dibuka, maksimal 100 aktivitas terbaru. Panel menyediakan keadaan memuat, kosong, gagal, dan coba lagi. Perubahan yang belum pernah dicatat backend tidak dapat direkonstruksi. Field referensi masih tampil sebagai ID sesuai catatan audit.
- Backend memperbaiki pemetaan riwayat untuk event penghapusan yang hanya memiliki `old`, serta mengirim waktu ISO 8601 dengan zona waktu. OpenAPI backend diberi anotasi respons historis; frontend sementara memvalidasi respons dengan Zod karena snapshot schema yang tersedia masih mendeskripsikan `data` sebagai string.

Perubahan API berada di repo saudara `HJARsysinfo` dan perlu dideploy agar aturan ini berlaku pada API production yang digunakan web lokal. Tidak ada migrasi database baru.

## Cakupan verifikasi

Tes browser ada di [e2e/pembanding.spec.ts](../e2e/pembanding.spec.ts):

- Tambah dengan foto → detail → edit harga/catatan tanpa unggah ulang foto pada lebar 1440 dan 360 px. Payload file dan `_method=PUT` diperiksa.
- Respons 422 pada tambah/edit menampilkan pesan di field yang tepat dan mempertahankan isian.
- Respons 500 pada tambah/edit mempertahankan isian dan dapat dicoba ulang sampai berhasil.
- Respons 409 menampilkan tindakan tinjauan duplikat, navigasi ke halaman review duplikat, pemilihan kandidat, dan resolusi duplikat (`use_existing` / `replace_existing`) berhasil ditangani sampai selesai.
- Pratinjau foto baru dan tombol pembatalan/penghapusan foto yang dipilih pada Step 4 telah diimplementasikan dan diuji.
- Skema validasi Zod klien per langkah (`form.schema.ts`) dan pemetaan kembali ke langkah bermasalah telah diimplementasikan dan diuji.
- Pencarian tetap tersimpan di URL setelah membuka detail dan kembali ke daftar.
- Edit data sendiri oleh contributor/pengguna lain tanpa permission edit; pengguna lain dapat mengedit dan mengajukan hapus data contributor. Kegagalan pengajuan hapus mempertahankan alasan dan bisa dicoba ulang.
- Contributor tidak mendapatkan tombol/isi detail/form untuk data orang lain, termasuk jika API lama mengembalikan rekaman tersebut.
- Historis di desktop dan mobile memuat aktor, waktu, nilai lama/baru; permintaan bersifat lazy, dengan keadaan kosong dan retry setelah gagal.

Tes memakai API mock dan data sintetis. Endpoint API yang belum dimock membuat tes gagal; request tersebut tidak diteruskan ke proxy production. Hasil ini memverifikasi frontend, bukan penyimpanan database/foto dan kebijakan akses pada API production.

Tes Laravel dijalankan pada salinan repo backend sementara menggunakan SQLite in-memory, tanpa jaringan. Cakupannya mencakup kebijakan contributor, edit/pengajuan hapus tanpa permission edit, pembatasan ekspor, pencarian/peta/dashboard, serta log create/update/delete/restore. Hasil ini tidak memverifikasi deployment API production.

Tes unit/API/komponen modul mencakup filter, API lokasi, create/update, ekspor, API review duplikat, format nomor telepon, riwayat perubahan (PembandingHistoryPanel), tinjau duplikat (PembandingDuplicateReviewPage), dan skema validasi form (form.schema).

## Pekerjaan berikutnya

1. Verifikasi integrasi memakai backend uji: penyimpanan foto sesungguhnya pada storage backend dan validasi menyeluruh pada database staging.
2. Evaluasi kebutuhan cropper foto bila spesifikasi media backend mewajibkan rasio tertentu.

Gate Phase 6 telah mencapai kesetaraan fitur frontend (feature parity) dan siap untuk verifikasi integrasi staging.
