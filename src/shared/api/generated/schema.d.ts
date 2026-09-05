export interface paths {
    "/v1/auth/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Login Web SPA (Session Cookie)
         * @description Memvalidasi kredensial pengguna web SPA dan menginisialisasi sesi stateful cookie.
         */
        post: operations["auth.sessionLogin"];
        /**
         * Logout Web SPA
         * @description Mengakhiri sesi web SPA dan menginvaliasi session cookie.
         */
        delete: operations["auth.sessionLogout"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Login Mobile / Token Bearer
         * @description Memvalidasi kredensial mobile dan mengembalikan access token Sanctum beserta refresh token.
         */
        post: operations["auth.login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Perbarui access token mobile
         * @description Menukar refresh token yang masih valid dengan pasangan access token baru.
         */
        post: operations["auth.refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Logout Mobile (Revoke Token)
         * @description Mencabut access token aktif dan seluruh refresh token milik pengguna.
         */
        post: operations["auth.logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat data pengguna aktif
         * @deprecated
         * @description Mengembalikan profil, role, dan daftar permission pengguna yang saat ini login.
         *
         *     Alias kompatibilitas. Gunakan `/api/v1/auth/me` untuk integrasi baru. URL lama tetap tersedia sampai migrasi klien selesai.
         */
        get: operations["auth.me_0.legacy"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Perbarui profil
         * @deprecated
         * @description Memperbarui nama dan alamat email pengguna yang sedang login.
         *
         *     Alias kompatibilitas. Gunakan `/api/v1/auth/profile` untuk integrasi baru. URL lama tetap tersedia sampai migrasi klien selesai.
         */
        put: operations["auth.updateProfile_0.legacy"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/profile/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Ubah password
         * @deprecated
         * @description Mengganti password pengguna setelah password saat ini berhasil diverifikasi.
         *
         *     Alias kompatibilitas. Gunakan `/api/v1/auth/profile/password` untuk integrasi baru. URL lama tetap tersedia sampai migrasi klien selesai.
         */
        put: operations["auth.updatePassword_0.legacy"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat data pengguna aktif
         * @description Mengembalikan profil, role, dan daftar permission pengguna yang saat ini login.
         */
        get: operations["auth.me_0"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Perbarui profil
         * @description Memperbarui nama dan alamat email pengguna yang sedang login.
         */
        put: operations["auth.updateProfile_0"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/profile/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Ubah password
         * @description Mengganti password pengguna setelah password saat ini berhasil diverifikasi.
         */
        put: operations["auth.updatePassword_0"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dictionaries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar kategori dictionary
         * @description Mengembalikan daftar seluruh tipe dictionary beserta metadata label, icon, dan jumlah data aktif/nonaktif.
         */
        get: operations["dictionary.definitions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dictionaries/{type}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat isi dictionary berdasarkan tipe
         * @description Mengembalikan nilai master data berdasarkan tipe. Data nonaktif hanya tersedia bagi pengguna dengan permission view_master_data.
         */
        get: operations["dictionary.index"];
        put?: never;
        /**
         * Tambah item dictionary
         * @description Membuat rekaman baru untuk tipe dictionary yang ditentukan.
         */
        post: operations["dictionary.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dictionaries/{type}/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Urutkan ulang (reorder) item dictionary
         * @description Memperbarui susunan sort_order untuk seluruh item dictionary dalam suatu tipe.
         */
        post: operations["dictionary.reorder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dictionaries/{type}/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Ubah item dictionary
         * @description Memperbarui nama dan atribut item dictionary.
         */
        put: operations["dictionary.update"];
        post?: never;
        /**
         * Hapus item dictionary
         * @description Menghapus rekaman dictionary jika tidak sedang digunakan oleh data pembanding.
         */
        delete: operations["dictionary.destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dictionaries/{type}/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Ubah status aktif/nonaktif item dictionary
         * @description Mengaktifkan atau menonaktifkan item dictionary.
         */
        patch: operations["dictionary.updateStatus"];
        trace?: never;
    };
    "/v1/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat data dashboard
         * @description Mengembalikan ringkasan statistik, widget yang diizinkan, data sebaran peta, dan tren bulanan sesuai permission pengguna.
         */
        get: operations["dashboard"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/locations/provinces": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Cari provinsi
         * @description Mencari provinsi berdasarkan nama.
         */
        get: operations["location.provinces"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/locations/regencies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Cari kabupaten/kota
         * @description Mencari kabupaten atau kota, opsional dibatasi berdasarkan provinsi.
         */
        get: operations["location.regencies"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/locations/districts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Cari kecamatan
         * @description Mencari kecamatan, opsional dibatasi berdasarkan kabupaten/kota.
         */
        get: operations["location.districts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/locations/villages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Cari desa/kelurahan
         * @description Mencari desa atau kelurahan, opsional dibatasi berdasarkan kecamatan.
         */
        get: operations["location.villages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembandings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar pembanding
         * @description Mengembalikan data pembanding terpaginasikan dengan dukungan pencarian teks, filter wilayah hierarkis, jenis objek/listing, rentang tanggal dan harga.
         */
        get: operations["dataPembanding.index"];
        put?: never;
        /**
         * Tambah pembanding
         * @description Menyimpan data pembanding baru beserta foto properti melalui multipart/form-data. Jika terindikasi duplikat, mengembalikan HTTP 409 DUPLICATE_REVIEW_REQUIRED.
         */
        post: operations["dataPembanding.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembandings/map": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat sebaran pembanding
         * @description Mengembalikan koordinat dan informasi ringkas seluruh pembanding yang memiliki lokasi.
         */
        get: operations["pembandingMap"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembandings/form-options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Opsi form pembuatan/edit pembanding
         * @description Mengembalikan opsi dropdown (dictionary aktif, provinsi, nilai default) untuk formulir data pembanding.
         */
        get: operations["dataPembanding.formOptions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembandings/creators": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Daftar kontributor/pembuat data pembanding
         * @description Mengembalikan daftar pengguna yang tercatat telah membuat minimal satu data pembanding.
         */
        get: operations["dataPembanding.creators"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembandings/similar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cari pembanding serupa berdasarkan kriteria
         * @description Mencari dan memberi peringkat data pembanding berdasarkan lokasi serta karakteristik properti yang dikirim.
         */
        post: operations["dataPembanding.similarByPayload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembandings/{id}/similar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Cari pembanding serupa berdasarkan ID
         * @description Menilai kemiripan terhadap satu data pembanding yang sudah tersimpan.
         */
        get: operations["dataPembanding.similarById"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembandings/{id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat riwayat pembanding
         * @description Mengembalikan maksimal 100 perubahan terbaru beserta pelaku dan nilai field sebelum/sesudah perubahan.
         */
        get: operations["dataPembanding.history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembandings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat detail pembanding
         * @description Mengembalikan satu data pembanding beserta relasi master data dan pembuatnya.
         */
        get: operations["dataPembanding.show"];
        /**
         * Perbarui pembanding
         * @description Memperbarui data melalui PUT/PATCH, atau POST multipart dengan field _method=PUT sebagai workaround client.
         */
        put: operations["dataPembanding.update_2"];
        /**
         * Perbarui pembanding
         * @description Memperbarui data melalui PUT/PATCH, atau POST multipart dengan field _method=PUT sebagai workaround client.
         */
        post: operations["dataPembanding.update_1"];
        /**
         * Hapus pembanding
         * @description Melakukan soft delete langsung bagi pengguna yang memiliki permission penghapusan.
         */
        delete: operations["dataPembanding.destroy"];
        options?: never;
        head?: never;
        /**
         * Perbarui pembanding
         * @description Memperbarui data melalui PUT/PATCH, atau POST multipart dengan field _method=PUT sebagai workaround client.
         */
        patch: operations["dataPembanding.update_3"];
        trace?: never;
    };
    "/v1/pembandings/{id}/delete-request": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Ajukan penghapusan pembanding
         * @description Membuat permintaan penghapusan untuk dievaluasi moderator. Hanya satu permintaan pending diperbolehkan per data.
         */
        post: operations["dataPembanding.requestDelete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembanding-submissions/{submission}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat detail tinjauan duplikat
         * @description Mengembalikan perbandingan data yang baru disubmit dengan kandidat duplikat yang sudah tersimpan di database.
         */
        get: operations["pembandingDuplicateReview.show"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembanding-submissions/{submission}/image": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Stream gambar submission duplikat
         * @description Mengalirkan binary gambar dari file staged duplicate submission.
         */
        get: operations["pembandingDuplicateReview.image"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembanding-submissions/{submission}/resolution": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resolusi tinjauan duplikat
         * @description Menyelesaikan konflik duplikat dengan strategi use_existing (batalkan input baru) atau replace_existing (timpa record lama).
         */
        post: operations["pembandingDuplicateReview.resolve_0"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembanding-submissions/{submission}/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resolusi tinjauan duplikat
         * @deprecated
         * @description Menyelesaikan konflik duplikat dengan strategi use_existing (batalkan input baru) atau replace_existing (timpa record lama).
         *
         *     Alias kompatibilitas. Gunakan `/api/v1/pembanding-submissions/{submission}/resolution` untuk integrasi baru. URL lama tetap tersedia sampai migrasi klien selesai.
         */
        post: operations["pembandingDuplicateReview.resolve_0.legacy"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/geo/{resource}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar data geo administratif
         * @description Mengembalikan daftar wilayah administratif terpaginasi (provinces, regencies, districts, atau villages) beserta filter pencarian dan relasi induk.
         */
        get: operations["geoData.index"];
        put?: never;
        /**
         * Tambah data geo administratif
         * @description Menambahkan data wilayah administratif baru.
         */
        post: operations["geoData.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/geo/{resource}/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Ubah nama wilayah geo administratif
         * @description Memperbarui nama wilayah administratif yang ditentukan.
         */
        put: operations["geoData.update"];
        post?: never;
        /**
         * Hapus wilayah geo administratif
         * @description Menghapus data wilayah administratif jika tidak digunakan.
         */
        delete: operations["geoData.destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembanding-imports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar batch impor Excel
         * @description Mengembalikan riwayat batch impor Excel terpaginasi milik pengguna aktif (atau semua batch untuk super admin).
         */
        get: operations["bulkExcelImport.index"];
        put?: never;
        /**
         * Upload workbook Excel impor baru
         * @description Menerima file .xlsx/.xls, memvalidasi struktur kolom, dan membuat batch draf baru (atau membuka kembali draf yang sama).
         */
        post: operations["bulkExcelImport.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembanding-imports/{batch}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat detail batch impor dan baris staged
         * @description Mengembalikan statistik batch beserta daftar baris impor terpaginasi dengan filter status dan seleksi.
         */
        get: operations["bulkExcelImport.show"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembanding-imports/{batch}/selection": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Perbarui pilihan baris batch impor
         * @description Memilih atau membatalkan pilihan baris staged dalam batch (all, none, invert, atau ID spesifik).
         */
        patch: operations["bulkExcelImport.selection"];
        trace?: never;
    };
    "/v1/pembanding-imports/{batch}/bulk-apply": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Terapkan nilai massal ke baris terpilih
         * @description Mengisi atribut master data (status pemberi info, bentuk tanah, peruntukan, dsb.) sekaligus ke seluruh baris terpilih.
         */
        patch: operations["bulkExcelImport.bulkApply"];
        trace?: never;
    };
    "/v1/pembanding-imports/{batch}/finalize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Finalisasi batch impor (migrasikan ke data pembanding)
         * @description Menjalankan proses finalisasi asinkron untuk memasukkan seluruh baris terpilih yang berstatus siap ke tabel data pembanding utama.
         */
        post: operations["bulkExcelImport.finalize"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembanding-imports/{batch}/rows/{row}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat data satu baris staged untuk edit
         * @description Mengembalikan payload detail baris staged beserta opsi dropdown lokasi dan dictionary terkait.
         */
        get: operations["bulkExcelImport.editRow"];
        /**
         * Perbarui baris staged
         * @description Memperbaiki field yang kurang atau mengganti foto pada baris staged.
         */
        put: operations["bulkExcelImport.updateRow"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembanding-imports/{batch}/rows/{row}/image": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Stream gambar baris staged
         * @description Mengalirkan binary foto properti yang tersimpan pada baris impor draf.
         */
        get: operations["bulkExcelImport.rowImage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/pembanding-imports/{batch}/rows/{row}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Coba ulang (retry) baris impor yang gagal
         * @description Mengulang validasi atau proses impor untuk baris yang sebelumnya berstatus gagal/transient error.
         */
        post: operations["bulkExcelImport.retryRow"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/roles/options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Opsi role pengguna
         * @description Mengembalikan daftar pilihan role yang tersedia dalam sistem untuk dropdown form.
         */
        get: operations["user.roleOptions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/users/{user}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Ubah status aktif/nonaktif pengguna
         * @description Mengaktifkan atau menonaktifkan akun pengguna.
         */
        patch: operations["user.toggleStatus"];
        trace?: never;
    };
    "/v1/users/bulk-delete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Hapus pengguna massal (bulk delete)
         * @description Menghapus beberapa akun pengguna sekaligus berdasarkan daftar ID.
         */
        post: operations["user.bulkDelete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar pengguna
         * @description Mengembalikan daftar akun pengguna terpaginasi dengan filter pencarian nama/email, filter role, dan status aktif/nonaktif.
         */
        get: operations["user.index"];
        put?: never;
        /**
         * Tambah pengguna baru
         * @description Mendaftarkan akun pengguna baru beserta role awal.
         */
        post: operations["user.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/users/{user}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat detail pengguna
         * @description Mengembalikan informasi profil dan role akun pengguna tertentu.
         */
        get: operations["user.show"];
        /**
         * Perbarui pengguna
         * @description Memperbarui nama, email, password opsional, status aktivasi, dan role pengguna.
         */
        put: operations["user.update"];
        post?: never;
        /**
         * Hapus pengguna
         * @description Menghapus akun pengguna dari sistem.
         */
        delete: operations["user.destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar role
         * @description Mengembalikan seluruh role yang terdaftar beserta daftar permissions dan jumlah pengguna yang memegang role tersebut.
         */
        get: operations["accessControl.roles"];
        put?: never;
        /**
         * Tambah role baru
         * @description Membuat role baru dan menetapkan daftar permissions awalnya.
         */
        post: operations["accessControl.storeRole"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/roles/{role}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Perbarui role
         * @description Memperbarui nama role dan menyinkronkan daftar permission yang dimiliki.
         */
        put: operations["accessControl.updateRole"];
        post?: never;
        /**
         * Hapus role
         * @description Menghapus role jika tidak termasuk sistem terkunci (super_admin) dan tidak lagi digunakan oleh akun pengguna mana pun.
         */
        delete: operations["accessControl.destroyRole"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar permission
         * @description Mengembalikan seluruh permission aplikasi yang dikelompokkan menurut grup domain.
         */
        get: operations["accessControl.permissions"];
        put?: never;
        /**
         * Tambah custom permission
         * @description Menambahkan permission baru ke guard web.
         */
        post: operations["accessControl.storePermission"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/permissions/{permission}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Hapus custom permission
         * @description Menghapus permission jika tidak sedang dipetakan pada role atau pengguna mana pun.
         */
        delete: operations["accessControl.destroyPermission"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public/data-contributor-registration/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Verifikasi validitas token pendaftaran kontributor (Publik)
         * @description Mengecek apakah token undangan masih berlaku dan belum digunakan sebelum menampilkan form pendaftaran.
         */
        get: operations["dataContributorRegistration.show"];
        put?: never;
        /**
         * Submit pendaftaran kontributor baru (Publik)
         * @description Mendaftarkan permohonan kontributor dengan nama dan password. Sistem menghasilkan email domain otomatis.
         */
        post: operations["dataContributorRegistration.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data-contributor-invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar undangan kontributor
         * @description Mengembalikan daftar token undangan terpaginasi beserta status penggunaan.
         */
        get: operations["dataContributorInvitation.index"];
        put?: never;
        /**
         * Buat tautan undangan kontributor baru
         * @description Membuat token undangan pendaftaran kontributor (berlaku 7 hari). Token mentah hanya dikembalikan satu kali saat pembuatan.
         */
        post: operations["dataContributorInvitation.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data-contributor-invitations/{invite}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Hapus/Cabut token undangan
         * @description Menghapus token undangan yang belum pernah digunakan.
         */
        delete: operations["dataContributorInvitation.destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data-contributor-registration-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar pengajuan registrasi kontributor
         * @description Mengembalikan daftar pengajuan pendaftaran dari calon kontributor data.
         */
        get: operations["dataContributorInvitation.registrationRequests"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data-contributor-registration-requests/{registrationRequest}/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Setujui (accept) pendaftaran kontributor
         * @description Menerima pengajuan registrasi, membuat akun user baru, dan memberikan role data_contributor.
         */
        post: operations["dataContributorInvitation.accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data-contributor-registration-requests/{registrationRequest}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Tolak (reject) pendaftaran kontributor
         * @description Menolak pengajuan pendaftaran kontributor dengan mencantumkan alasan penolakan.
         */
        post: operations["dataContributorInvitation.reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/moderation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat antrean moderasi dan trash
         * @description Mengembalikan daftar permohonan hapus yang menunggu evaluasi (tab=requests) atau data yang berada di tempat sampah (tab=trash).
         */
        get: operations["moderation.index"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/moderation/delete-requests/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Setujui permohonan hapus pembanding
         * @description Menerima permohonan penghapusan dan langsung melakukan soft-delete pada data pembanding terkait.
         */
        post: operations["moderation.approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/moderation/delete-requests/{id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Tolak permohonan hapus pembanding
         * @description Menolak permohonan penghapusan dengan menyertakan catatan review dari moderator.
         */
        post: operations["moderation.reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/moderation/pembandings/{id}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Pulihkan data pembanding dari trash
         * @description Mengembalikan data pembanding yang berstatus soft-deleted kembali ke daftar aktif.
         */
        post: operations["moderation.restore"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/moderation/pembandings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Hapus permanen pembanding dari trash (force delete)
         * @description Menghapus data pembanding secara permanen dari database.
         */
        delete: operations["moderation.forceDelete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exports/configuration": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat konfigurasi ekspor
         * @description Mengembalikan daftar profil kolom ekspor, format yang tersedia, batasan limit baris, dan izin pengguna.
         */
        get: operations["export.configuration"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exports/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Preview jumlah data yang akan diekspor
         * @description Menghitung estimasi total baris, batas proses langsung (sinkron), dan apakah perlu dialihkan ke antrean asinkron.
         */
        post: operations["export.preview"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exports/runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat riwayat tugas ekspor asinkron (export runs)
         * @description Mengembalikan daftar tugas pembuatan file ekspor pengguna yang sedang berjalan, selesai, atau gagal.
         */
        get: operations["export.runs"];
        put?: never;
        /**
         * Minta pembuatan ekspor asinkron (background queue)
         * @description Mendaftarkan tugas ekspor ke antrean worker background untuk jumlah data besar.
         */
        post: operations["export.storeRun"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exports/runs/{exportRun}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat status tugas ekspor asinkron
         * @description Mengecek progres pemrosesan file ekspor (persentase selesai, URL unduh jika siap, atau pesan kegagalan).
         */
        get: operations["export.runStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exports/runs/{exportRun}/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Unduh file hasil tugas ekspor asinkron
         * @description Mengunduh file yang telah selesai di-generate oleh worker.
         */
        get: operations["export.downloadRun"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exports/runs/{exportRun}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Coba ulang (retry) tugas ekspor yang gagal
         * @description Mengulang pembuatan file ekspor yang sebelumnya terhenti karena kegagalan proses.
         */
        post: operations["export.retryRun"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exports/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Unduh ekspor langsung (sinkron)
         * @description Mengunduh langsung file ekspor untuk dataset di bawah batas sinkron (Excel/CSV/GeoJSON/KML/PDF).
         */
        get: operations["export.download"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Pencarian global lintas modul
         * @description Mencari entitas di seluruh sistem berdasarkan kata kunci dengan filter grup menu dan paginasi.
         */
        get: operations["search"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar notifikasi
         * @description Mengembalikan daftar notifikasi pengguna terpaginasi beserta jumlah notifikasi yang belum dibaca.
         */
        get: operations["appNotification.index"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Tandai notifikasi telah dibaca
         * @description Menandai satu notifikasi tertentu sebagai sudah dibaca.
         */
        patch: operations["appNotification.read"];
        trace?: never;
    };
    "/v1/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Tandai semua notifikasi telah dibaca
         * @description Menandai seluruh notifikasi yang belum dibaca milik pengguna aktif sebagai sudah dibaca.
         */
        post: operations["appNotification.readAll"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/activity-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat daftar activity logs
         * @description Mengembalikan daftar riwayat aktivitas sistem terpaginasi dengan pencarian kata kunci log, deskripsi, atau event.
         */
        get: operations["activityLog.index"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/activity-logs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat detail activity log
         * @description Mengembalikan detail lengkap satu rekaman aktivitas audit log beserta snapshot perubahan attributes dan old data.
         */
        get: operations["activityLog.show"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat seluruh pengaturan sistem
         * @description Mengembalikan seluruh konfigurasi sistem internal dan branding (memerlukan permission view_settings).
         */
        get: operations["setting.index"];
        /**
         * Perbarui pengaturan sistem
         * @description Menyimpan perubahan mode sistem (live/maintenance/off), versi, warna primer, nama perusahaan, email support, dan upload logo baru.
         */
        put: operations["setting.update_1"];
        /**
         * Perbarui pengaturan sistem
         * @description Menyimpan perubahan mode sistem (live/maintenance/off), versi, warna primer, nama perusahaan, email support, dan upload logo baru.
         */
        post: operations["setting.update_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/clear-cache": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Bersihkan cache aplikasi
         * @description Menjalankan pembersihan cache aplikasi, views, routes, dan konfigurasi framework.
         */
        post: operations["setting.clearCache"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/settings/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat pengaturan publik aplikasi
         * @description Mengembalikan informasi branding aman seperti nama aplikasi, logo, versi aplikasi, nama perusahaan, dan email support.
         */
        get: operations["publicSetting.show"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/backup/artifacts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lihat katalog berkas backup dan status kesiapan
         * @description Mengembalikan daftar arsip backup yang tersedia di server, riwayat backup legacy, status kesiapan storage/mysqldump, dan izin operasi.
         */
        get: operations["backup.index"];
        put?: never;
        /**
         * Buat arsip backup baru
         * @description Membuat paket backup database, uploads, atau full system.
         */
        post: operations["backupArtifact.store"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/backup/imports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Impor paket arsip backup
         * @description Mengunggah dan memverifikasi paket arsip backup eksternal.
         */
        post: operations["backupArtifact.import"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/backup/artifacts/{artifact}/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Unduh berkas arsip backup
         * @description Mengunduh file fisik arsip backup (.tar.gz / zip).
         */
        get: operations["backupFile.download"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/backup/artifacts/{artifact}/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Verifikasi integritas arsip backup
         * @description Mengecek keabsahan checksum SHA-256 dan cryptographic signature arsip backup.
         */
        post: operations["backupArtifact.verify"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/backup/artifacts/{artifact}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Hapus arsip backup
         * @description Menghapus berkas arsip backup dari server storage.
         */
        delete: operations["backupFile.destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/backup/artifacts/{artifact}/restore-uploads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Pulihkan berkas uploads dari arsip backup
         * @description Memulihkan direktori upload foto properti dari paket backup yang diverifikasi (hanya Super Admin).
         */
        post: operations["backupRestore.uploads"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/backup/artifacts/{artifact}/restore-database": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Pulihkan database dari arsip backup (Tertunda/Deferred)
         * @description Endpoint reservasi untuk pemulihan database via API (memerlukan CLI/maintenance runner).
         */
        post: operations["backupRestore.database"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** BackupCreateRequest */
        BackupCreateRequest: {
            type: components["schemas"]["BackupType"];
        };
        /** BackupImportRequest */
        BackupImportRequest: {
            /**
             * Format: binary
             * @description Maximum file size: 1048576 kilobytes.
             */
            package: string;
        };
        /** BackupRestoreRequest */
        BackupRestoreRequest: {
            current_password: string;
            confirmation: string;
        };
        /**
         * BackupType
         * @enum {string}
         */
        BackupType: "database" | "uploads" | "full";
        /** BulkExcelImportBulkApplyRequest */
        BulkExcelImportBulkApplyRequest: {
            /** @enum {string} */
            field: "status_pemberi_informasi_id" | "bentuk_tanah_id" | "posisi_tanah_id" | "kondisi_tanah_id" | "topografi_id" | "dokumen_tanah_id" | "peruntukan_id";
            value: number;
        };
        /** BulkExcelImportFinalizeRequest */
        BulkExcelImportFinalizeRequest: {
            /** @enum {unknown} */
            confirmed: "yes" | "on" | "1" | 1 | "true" | true;
        };
        /** BulkExcelImportRowUpdateRequest */
        BulkExcelImportRowUpdateRequest: {
            jenis_listing_id?: number | null;
            jenis_objek_id?: number | null;
            nama_pemberi_informasi?: string | null;
            nomer_telepon_pemberi_informasi?: string | null;
            status_pemberi_informasi_id?: number | null;
            alamat_data?: string | null;
            province_id?: string | null;
            regency_id?: string | null;
            district_id?: string | null;
            village_id?: string | null;
            latitude?: number | null;
            longitude?: number | null;
            /**
             * Format: binary
             * @description Maximum file size: 15360 kilobytes.
             */
            image?: string | null;
            luas_tanah?: number | null;
            luas_bangunan?: number | null;
            lebar_depan?: number | null;
            lebar_jalan?: number | null;
            tahun_bangun?: number | null;
            rasio_tapak?: string | null;
            bentuk_tanah_id?: number | null;
            posisi_tanah_id?: number | null;
            kondisi_tanah_id?: number | null;
            topografi_id?: number | null;
            dokumen_tanah_id?: number | null;
            peruntukan_id?: number | null;
            harga?: number | null;
            jangka_waktu_sewa?: number | null;
            /** @enum {string|null} */
            satuan_waktu_sewa?: "Bulan" | "Tahun" | null;
            catatan?: string | null;
            remove_image?: boolean;
        };
        /** BulkExcelImportSelectionRequest */
        BulkExcelImportSelectionRequest: {
            /** @enum {string} */
            action: "set_rows" | "select_all" | "clear_all" | "select_ready";
            row_ids?: number[];
            is_selected?: boolean;
        };
        /** BulkExcelImportStoreRequest */
        BulkExcelImportStoreRequest: {
            /**
             * Format: binary
             * @description Maximum file size: 10240 kilobytes.
             */
            file: string;
        };
        /** District */
        District: {
            id: string;
            regency_id: string;
            name: string;
            /** Format: date-time */
            created_at: string | null;
            /** Format: date-time */
            updated_at: string | null;
        };
        /** FindSimilarPembandingRequest */
        FindSimilarPembandingRequest: {
            latitude: number;
            longitude: number;
            district_id: string;
            regency_id?: string | null;
            /** @enum {string|null} */
            market_basis?: "sale" | "rent" | null;
            /** @enum {string|null} */
            evidence_type?: "transaction" | "offer" | "unknown" | null;
            /** Format: date */
            reference_date?: string | null;
            jenis_objek?: string | null;
            peruntukan: string;
            luas_tanah?: number | null;
            luas_bangunan?: number | null;
            dokumen_tanah?: string | null;
            lebar_jalan?: number | null;
            posisi_tanah?: string | null;
            kondisi_tanah?: string | null;
            harga?: number | null;
            limit?: number | null;
            range_km?: number | null;
        };
        /** LoginRequest */
        LoginRequest: {
            /** Format: email */
            email: string;
            password: string;
            device_name: string;
        };
        /** PembandingDeleteRequest */
        PembandingDeleteRequest: {
            id: number;
            pembanding_id: number;
            requested_by_id: number;
            reason: string;
            status: string;
            review_note: string | null;
            reviewed_by_id: number | null;
            /** Format: date-time */
            reviewed_at: string | null;
            /** Format: date-time */
            created_at: string | null;
            /** Format: date-time */
            updated_at: string | null;
        };
        /** PembandingExportRequest */
        PembandingExportRequest: {
            /** @enum {string|null} */
            format?: "excel" | "pdf" | "csv" | "geojson" | "kml" | null;
            /** @enum {string|null} */
            mode?: "summary" | "detail" | null;
            /** @enum {string|null} */
            profile?: "ringkas" | "lengkap" | "kontak" | "geospasial" | "audit" | null;
            /** @enum {string|null} */
            scope?: "selected" | "filtered" | null;
            /** @enum {string|null} */
            dataset?: "all" | "complete" | "issues" | null;
            ids?: string | null;
            columns?: string[] | null;
            province_id?: string | null;
            regency_id?: string | null;
            district_id?: string | null;
            village_id?: string | null;
            jenis_listing_id?: number | null;
            jenis_objek_id?: number | null;
            created_by?: number | null;
            /** Format: date-time */
            dari_tanggal?: string | null;
            /** Format: date-time */
            sampai_tanggal?: string | null;
            q?: string | null;
            /** @enum {integer|null} */
            per_page?: "25" | "50" | "100" | null;
        };
        /** PembandingResource */
        PembandingResource: {
            id: number;
            jenis_listing: {
                id: number;
                slug: string;
                name: string;
            };
            jenis_objek: {
                id: number;
                slug: string;
                name: string;
            };
            peruntukan: {
                id: number;
                slug: string;
                name: string;
            };
            bentuk_tanah: {
                id: number;
                slug: string;
                name: string;
            };
            dokumen_tanah: {
                id: number;
                slug: string;
                name: string;
            };
            posisi_tanah: {
                id: number;
                slug: string;
                name: string;
            };
            kondisi_tanah: {
                id: number;
                slug: string;
                name: string;
            };
            status_pemberi_informasi: {
                id: number;
                slug: string;
                name: string;
            };
            topografi: {
                id: number;
                slug: string;
                name: string;
            };
            nama_pemberi_informasi: string;
            nomer_telepon_pemberi_informasi: string | null;
            luas_tanah: number | null;
            luas_bangunan: number | null;
            tahun_bangun: string | null;
            lebar_depan: string | null;
            lebar_jalan: string | null;
            rasio_tapak: string | null;
            harga: number | null;
            is_sewa: boolean;
            jangka_waktu_sewa: number | null;
            satuan_waktu_sewa: string | null;
            sewa_periode_label: string | null;
            /** Format: date */
            tanggal_data: string | null;
            catatan: string | null;
            province: {
                id: string;
                name: string;
            };
            regency: {
                id: string;
                name: string;
            };
            district: {
                id: string;
                name: string;
            };
            village: {
                id: string;
                name: string;
            };
            alamat_data: string;
            latitude: number;
            longitude: number;
            image_url: string | null;
            created_by: {
                id: number;
                name: string;
            };
        };
        /** PembandingStoreRequest */
        PembandingStoreRequest: {
            jenis_listing_id: number;
            jenis_objek_id: number;
            nama_pemberi_informasi: string;
            nomer_telepon_pemberi_informasi?: string | null;
            status_pemberi_informasi_id?: number | null;
            /** Format: date */
            tanggal_data: string;
            alamat_data: string;
            province_id: string;
            regency_id: string;
            district_id: string;
            village_id: string;
            latitude: number;
            longitude: number;
            /**
             * Format: binary
             * @description Maximum file size: 15360 kilobytes.
             */
            image: string;
            luas_tanah: number;
            luas_bangunan?: number | null;
            lebar_depan: number;
            lebar_jalan: number;
            tahun_bangun?: number | null;
            rasio_tapak?: string | null;
            bentuk_tanah_id: number;
            posisi_tanah_id: number;
            kondisi_tanah_id: number;
            topografi_id: number;
            dokumen_tanah_id: number;
            peruntukan_id: number;
            harga: number;
            jangka_waktu_sewa?: number | null;
            /** @enum {string|null} */
            satuan_waktu_sewa?: "Bulan" | "Tahun" | null;
            catatan?: string | null;
        };
        /** PembandingUpdateRequest */
        PembandingUpdateRequest: {
            jenis_listing_id: number;
            jenis_objek_id: number;
            nama_pemberi_informasi: string;
            nomer_telepon_pemberi_informasi?: string | null;
            status_pemberi_informasi_id?: number | null;
            /** Format: date */
            tanggal_data: string;
            alamat_data: string;
            province_id: string;
            regency_id: string;
            district_id: string;
            village_id: string;
            latitude: number;
            longitude: number;
            /**
             * Format: binary
             * @description Maximum file size: 15360 kilobytes.
             */
            image?: string | null;
            luas_tanah: number;
            luas_bangunan?: number | null;
            lebar_depan: number;
            lebar_jalan: number;
            tahun_bangun?: number | null;
            rasio_tapak?: string | null;
            bentuk_tanah_id: number;
            posisi_tanah_id: number;
            kondisi_tanah_id: number;
            topografi_id: number;
            dokumen_tanah_id: number;
            peruntukan_id: number;
            harga: number;
            jangka_waktu_sewa?: number | null;
            /** @enum {string|null} */
            satuan_waktu_sewa?: "Bulan" | "Tahun" | null;
            catatan?: string | null;
        };
        /** Province */
        Province: {
            id: string;
            name: string;
            /** Format: date-time */
            created_at: string | null;
            /** Format: date-time */
            updated_at: string | null;
        };
        /** RefreshTokenRequest */
        RefreshTokenRequest: {
            refresh_token: string;
            device_name?: string | null;
        };
        /** Regency */
        Regency: {
            id: string;
            province_id: string;
            name: string;
            /** Format: date-time */
            created_at: string | null;
            /** Format: date-time */
            updated_at: string | null;
        };
        /** RejectRegistrationRequest */
        RejectRegistrationRequest: {
            reject_reason?: string | null;
        };
        /** SimilarPembandingResource */
        SimilarPembandingResource: {
            id: number;
            jenis_listing: {
                id: number;
                slug: string;
                name: string;
            };
            jenis_objek: {
                id: number;
                slug: string;
                name: string;
            };
            peruntukan: {
                id: number;
                slug: string;
                name: string;
            };
            bentuk_tanah: {
                id: number;
                slug: string;
                name: string;
            };
            dokumen_tanah: {
                id: number;
                slug: string;
                name: string;
            };
            posisi_tanah: {
                id: number;
                slug: string;
                name: string;
            };
            kondisi_tanah: {
                id: number;
                slug: string;
                name: string;
            };
            status_pemberi_informasi: {
                id: number;
                slug: string;
                name: string;
            };
            topografi: {
                id: number;
                slug: string;
                name: string;
            };
            nama_pemberi_informasi: string;
            nomer_telepon_pemberi_informasi: string | null;
            luas_tanah: number | null;
            luas_bangunan: number | null;
            tahun_bangun: string | null;
            lebar_depan: string | null;
            lebar_jalan: string | null;
            rasio_tapak: string | null;
            harga: number | null;
            is_sewa: boolean;
            jangka_waktu_sewa: number | null;
            satuan_waktu_sewa: string | null;
            sewa_periode_label: string | null;
            /** Format: date */
            tanggal_data: string | null;
            catatan: string | null;
            province: {
                id: string;
                name: string;
            };
            regency: {
                id: string;
                name: string;
            };
            district: {
                id: string;
                name: string;
            };
            village: {
                id: string;
                name: string;
            };
            alamat_data: string;
            latitude: number;
            longitude: number;
            image_url: string | null;
            created_by: {
                id: number;
                name: string;
            };
            score: number | null;
            similarity_score: number | null;
            reference_coverage: number | null;
            score_coverage: number | null;
            scoring_status: string | null;
            rankable: boolean | null;
            method_version: string | null;
            similarity_rank: number | null;
            eligibility_tier: string | null;
            eligibility_reasons: string[];
            evidence_quality: {
                score: number;
                components: {
                    [key: string]: unknown;
                };
            } | null;
            evidence_tier: string | null;
            component_scores: {
                [key: string]: {
                    weight: number;
                    applicable: boolean;
                    candidate_available: boolean;
                    similarity: number | null;
                    contribution: number;
                    warning: string | null;
                    context: {
                        [key: string]: unknown;
                    };
                };
            };
            warnings: string[];
            retrieval_stage: string | null;
            fallback_reason: string | null;
            report_readiness: string | null;
            report_completeness: number | null;
            report_missing_fields: string[];
            record_version: string | null;
            distance: number | null;
            rank: number | null;
            priority_rank: number | null;
            is_fallback: boolean;
        };
        /** SubmitRegistrationRequest */
        SubmitRegistrationRequest: {
            display_name: string;
            phone: string;
            password: string;
            password_confirmation: string;
        };
        /** UserResource */
        UserResource: {
            id: number;
            name: string;
            /** Format: email */
            email: string;
            roles: string[];
            permissions: string[];
            /** Format: date-time */
            created_at: string | null;
            /** Format: date-time */
            updated_at: string | null;
        };
        /** UserStoreRequest */
        UserStoreRequest: {
            name: string;
            /** Format: email */
            email: string;
            password: string;
            roles?: string[];
            is_active?: boolean;
        };
        /** UserUpdateRequest */
        UserUpdateRequest: {
            name: string;
            /** Format: email */
            email: string;
            password?: string | null;
            roles?: string[];
            is_active?: boolean;
        };
        /** Village */
        Village: {
            id: string;
            district_id: string;
            name: string;
            /** Format: date-time */
            created_at: string | null;
            /** Format: date-time */
            updated_at: string | null;
        };
    };
    responses: {
        /** @description Validation error */
        ValidationException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Errors overview. */
                    message: string;
                    /** @description A detailed description of each field that failed validation. */
                    errors: {
                        [key: string]: string[];
                    };
                };
            };
        };
        /** @description Unauthenticated */
        AuthenticationException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Error overview. */
                    message: string;
                };
            };
        };
        /** @description Authorization error */
        AuthorizationException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Error overview. */
                    message: string;
                };
            };
        };
        /** @description Not found */
        ModelNotFoundException: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": {
                    /** @description Error overview. */
                    message: string;
                };
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    "auth.sessionLogin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: email */
                    email: string;
                    password: string;
                    remember?: boolean | null;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Login berhasil.";
                        data: components["schemas"]["UserResource"];
                    };
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "USER_DEACTIVATED";
                        /** @constant */
                        message: "Akun Anda sedang dinonaktifkan.";
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "auth.sessionLogout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Logout berhasil.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "auth.login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Login Success";
                        data: {
                            /** @constant */
                            token_type: "Bearer";
                            access_token: string;
                            refresh_token: string;
                            expires_in: number;
                            user: {
                                id: number;
                                name: string;
                                email: string;
                                roles: unknown[];
                                permissions: unknown[];
                            };
                        } | null;
                    };
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "FORBIDDEN";
                        message: string;
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "auth.refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshTokenRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Token refreshed successfully";
                        data: {
                            /** @constant */
                            token_type: "Bearer";
                            access_token: string;
                            refresh_token: string;
                            expires_in: number;
                        } | null;
                    };
                };
            };
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "UNAUTHENTICATED";
                        /** @constant */
                        message: "Invalid or expired refresh token.";
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "auth.logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Successfully logged out";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "auth.me_0.legacy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "User data retrieved successfully";
                        data: components["schemas"]["UserResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "auth.updateProfile_0.legacy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    /** Format: email */
                    email: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Profile updated successfully";
                        data: components["schemas"]["UserResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "auth.updatePassword_0.legacy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    current_password: string;
                    password: string;
                    password_confirmation: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Password updated successfully";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "auth.me_0": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "User data retrieved successfully";
                        data: components["schemas"]["UserResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "auth.updateProfile_0": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    /** Format: email */
                    email: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Profile updated successfully";
                        data: components["schemas"]["UserResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "auth.updatePassword_0": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    current_password: string;
                    password: string;
                    password_confirmation: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Password updated successfully";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "dictionary.definitions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar kategori dictionary berhasil diambil.";
                        data: {
                            ""?: {
                                [key: string]: string | {
                                    /** @constant */
                                    model: "App\\Models\\JenisListing";
                                    /** @constant */
                                    label: "Jenis Listing";
                                    /** @constant */
                                    icon: "pi-tag";
                                    /** @constant */
                                    description: "Kategori penawaran atau transaksi properti.";
                                    extra: [
                                        "badge_color",
                                        "marker_icon_url"
                                    ];
                                } | {
                                    /** @constant */
                                    model: "App\\Models\\JenisObjek";
                                    /** @constant */
                                    label: "Jenis Objek";
                                    /** @constant */
                                    icon: "pi-building";
                                    /** @constant */
                                    description: "Jenis properti yang dicatat sebagai data pembanding.";
                                    extra: string[];
                                } | {
                                    /** @constant */
                                    model: "App\\Models\\StatusPemberiInformasi";
                                    /** @constant */
                                    label: "Status Pemberi Informasi";
                                    /** @constant */
                                    icon: "pi-user";
                                    /** @constant */
                                    description: "Hubungan pemberi informasi dengan objek properti.";
                                    extra: string[];
                                } | {
                                    /** @constant */
                                    model: "App\\Models\\BentukTanah";
                                    /** @constant */
                                    label: "Bentuk Tanah";
                                    /** @constant */
                                    icon: "pi-map";
                                    /** @constant */
                                    description: "Klasifikasi bentuk bidang tanah.";
                                    extra: string[];
                                } | {
                                    /** @constant */
                                    model: "App\\Models\\KondisiTanah";
                                    /** @constant */
                                    label: "Kondisi Tanah";
                                    /** @constant */
                                    icon: "pi-th-large";
                                    /** @constant */
                                    description: "Kondisi fisik tanah pada saat pendataan.";
                                    extra: string[];
                                } | {
                                    /** @constant */
                                    model: "App\\Models\\PosisiTanah";
                                    /** @constant */
                                    label: "Posisi Tanah";
                                    /** @constant */
                                    icon: "pi-arrows-h";
                                    /** @constant */
                                    description: "Posisi bidang tanah terhadap jalan atau lingkungan.";
                                    extra: string[];
                                } | {
                                    /** @constant */
                                    model: "App\\Models\\Topografi";
                                    /** @constant */
                                    label: "Topografi";
                                    /** @constant */
                                    icon: "pi-chart-line";
                                    /** @constant */
                                    description: "Kondisi kemiringan dan kontur permukaan tanah.";
                                    extra: string[];
                                } | {
                                    /** @constant */
                                    model: "App\\Models\\DokumenTanah";
                                    /** @constant */
                                    label: "Dokumen Tanah";
                                    /** @constant */
                                    icon: "pi-file";
                                    /** @constant */
                                    description: "Jenis bukti kepemilikan atau penguasaan tanah.";
                                    extra: string[];
                                } | {
                                    /** @constant */
                                    model: "App\\Models\\Peruntukan";
                                    /** @constant */
                                    label: "Peruntukan";
                                    /** @constant */
                                    icon: "pi-flag";
                                    /** @constant */
                                    description: "Pemanfaatan atau peruntukan utama properti.";
                                    extra: string[];
                                };
                            };
                            stats: {
                                total: string;
                                active: string;
                                inactive: string;
                            };
                        }[];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "dictionary.index": {
        parameters: {
            query?: {
                /**
                 * @description Jika false, sertakan data nonaktif (memerlukan permission view_master_data).
                 * @example true
                 */
                active_only?: boolean;
            };
            header?: never;
            path: {
                /**
                 * @description Tipe dictionary.
                 * @example jenis-objek
                 */
                type: "jenis-listing" | "jenis-objek" | "status-pemberi-informasi" | "bentuk-tanah" | "dokumen-tanah" | "posisi-tanah" | "kondisi-tanah" | "topografi" | "peruntukan";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        message: string;
                        data: string;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "FORBIDDEN";
                        /** @constant */
                        message: "Tidak diizinkan melihat dictionary nonaktif.";
                        errors: null;
                    };
                };
            };
        };
    };
    "dictionary.store": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data dictionary berhasil ditambahkan.";
                        data: string;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "dictionary.reorder": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    ids: number[];
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Urutan dictionary berhasil diperbarui.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "dictionary.update": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type: string;
                id: string | number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data dictionary berhasil diperbarui.";
                        data: string;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "FORBIDDEN";
                        /** @constant */
                        message: "Tidak diizinkan mengubah status data master.";
                        errors: null;
                    };
                };
            };
        };
    };
    "dictionary.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type: string;
                id: string | number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data dictionary berhasil dihapus.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "VALIDATION_FAILED";
                        message: string;
                        errors: {
                            delete: [
                                string
                            ];
                        };
                    };
                };
            };
        };
    };
    "dictionary.updateStatus": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type: string;
                id: string | number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    is_active: boolean;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Status dictionary berhasil diubah.";
                        data: string;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    dashboard: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data dashboard berhasil diambil.";
                        data: {
                            /** @enum {string} */
                            dashboard_variant: "data_contributor" | "default";
                            map_points: {
                                id: number;
                                alamat: string;
                                latitude: number;
                                longitude: number;
                                /** Format: date */
                                tanggal: string | null;
                                harga: number | null;
                                jenis_listing_id: number | null;
                                jenis_listing: string;
                                image_url: string;
                            }[];
                            stats: {
                                total: number;
                                this_month: number;
                                last_month: number;
                                with_coords: number;
                                province_count: number;
                            };
                            jenis_listing_options: {
                                label: string;
                                value: number;
                            }[];
                            can: {
                                [key: string]: string;
                            };
                            can_widgets: {
                                [key: string]: string;
                            };
                            delete_request_alert: {
                                count: number;
                                message: string | "1 permintaan penghapusan menunggu review.";
                            } | null;
                            recent_data: {
                                id: number;
                                alamat: string;
                                harga: number | null;
                                /** Format: date */
                                tanggal: string | null;
                                created_at: string;
                                image_url: string;
                                jenis_listing: string;
                                jenis_objek: string;
                            }[];
                            monthly_data: {
                                month: string;
                                count: number;
                            }[];
                            listing_ratio_monthly: {
                                labels: string[];
                                month_totals: number[];
                                series: {
                                    id: number;
                                    name: string;
                                    ratios: number[];
                                    counts: number[];
                                }[];
                            };
                            top_contributors: {
                                name: string;
                                total_input: number;
                            }[];
                            data_freshness: {
                                /** @constant */
                                basis: "Berdasarkan tanggal_data";
                                total: number;
                                with_date: Record<string, never> | null;
                                missing_date: number;
                                buckets: [
                                    {
                                        /** @constant */
                                        key: "fresh_0_30";
                                        /** @constant */
                                        label: "0-30 hari";
                                        count: number;
                                        percentage: number;
                                        /** @constant */
                                        color: "emerald";
                                    },
                                    {
                                        /** @constant */
                                        key: "fresh_31_90";
                                        /** @constant */
                                        label: "31-90 hari";
                                        count: number;
                                        percentage: number;
                                        /** @constant */
                                        color: "amber";
                                    },
                                    {
                                        /** @constant */
                                        key: "stale_over_90";
                                        /** @constant */
                                        label: "> 90 hari";
                                        count: number;
                                        percentage: number;
                                        /** @constant */
                                        color: "rose";
                                    }
                                ];
                            };
                            top_area_activity: {
                                /** @constant */
                                period_label: "30 hari terakhir";
                                total_input: number;
                                rows: {
                                    district_id: string;
                                    district_name: string;
                                    total_input: number;
                                    percentage: number;
                                }[];
                            };
                            object_type_counts: {
                                total_records: number;
                                rows: {
                                    id: number;
                                    name: string;
                                    total_input: number;
                                    percentage: number;
                                }[];
                            };
                        };
                    } | {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data dashboard berhasil diambil.";
                        data: {
                            /** @enum {string} */
                            dashboard_variant: "data_contributor" | "default";
                            map_points: {
                                id: number;
                                alamat: string;
                                latitude: number;
                                longitude: number;
                                /** Format: date */
                                tanggal: string | null;
                                harga: number | null;
                                jenis_listing_id: number | null;
                                jenis_listing: string;
                                image_url: string;
                            }[];
                            stats: {
                                total: number;
                                this_month: number;
                                last_month: number;
                                with_coords: number;
                                province_count: number;
                            };
                            jenis_listing_options: {
                                label: string;
                                value: number;
                            }[];
                            can: {
                                [key: string]: string;
                            };
                            can_widgets: {
                                [key: string]: string;
                            };
                            delete_request_alert: {
                                count: number;
                                message: string | "1 permintaan penghapusan menunggu review.";
                            } | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "location.provinces": {
        parameters: {
            query?: {
                /**
                 * @description Potongan nama provinsi.
                 * @example Jawa
                 */
                q?: string | null;
                /**
                 * @description Maksimal jumlah hasil (1-200).
                 * @example 25
                 */
                limit?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data Provinsi";
                        data: components["schemas"]["Province"][];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "location.regencies": {
        parameters: {
            query?: {
                /**
                 * @description ID provinsi induk.
                 * @example 32
                 */
                province_id?: string | null;
                /**
                 * @description Potongan nama kabupaten/kota.
                 * @example Bandung
                 */
                q?: string | null;
                /**
                 * @description Maksimal jumlah hasil (1-200).
                 * @example 25
                 */
                limit?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data Kabupaten/Kota";
                        data: components["schemas"]["Regency"][];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "location.districts": {
        parameters: {
            query?: {
                /**
                 * @description ID kabupaten/kota induk.
                 * @example 3273
                 */
                regency_id?: string | null;
                /**
                 * @description Potongan nama kecamatan.
                 * @example Coblong
                 */
                q?: string | null;
                /**
                 * @description Maksimal jumlah hasil (1-200).
                 * @example 25
                 */
                limit?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data Kecamatan";
                        data: components["schemas"]["District"][];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "location.villages": {
        parameters: {
            query?: {
                /**
                 * @description ID kecamatan induk.
                 * @example 3273030
                 */
                district_id?: string | null;
                /**
                 * @description Potongan nama desa/kelurahan.
                 * @example Dago
                 */
                q?: string | null;
                /**
                 * @description Maksimal jumlah hasil (1-200).
                 * @example 25
                 */
                limit?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data Desa/Kelurahan";
                        data: components["schemas"]["Village"][];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "dataPembanding.index": {
        parameters: {
            query?: {
                q?: string | null;
                province_id?: string | null;
                regency_id?: string | null;
                district_id?: string | null;
                village_id?: string | null;
                jenis_listing_id?: number | null;
                jenis_objek_id?: number | null;
                created_by?: number | null;
                dari_tanggal?: string | null;
                sampai_tanggal?: string | null;
                peruntukan?: string | null;
                jenis_objek?: string | null;
                min_harga?: number | null;
                max_harga?: number | null;
                min_luas_tanah?: number | null;
                max_luas_tanah?: number | null;
                sort?: "tanggal_data" | "harga" | "luas_tanah" | "luas_bangunan" | "created_at" | "id" | null;
                direction?: "asc" | "desc" | "ASC" | "DESC" | null;
                per_page?: number | null;
                limit?: number | null;
                range_km?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar data pembanding berhasil diambil.";
                        data: components["schemas"]["PembandingResource"][];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "dataPembanding.store": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["PembandingStoreRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data pembanding berhasil ditambahkan.";
                        data: components["schemas"]["PembandingResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "DUPLICATE_REVIEW_REQUIRED";
                        message: string | "Data terindikasi duplikat dengan data pembanding yang sudah ada.";
                        errors: null;
                        duplicate: {
                            id: unknown;
                            /** @enum {string} */
                            status: "deleted" | "active";
                            url: string | null;
                            submission_id: string;
                            submission_url: string;
                            expires_at: string | null;
                            candidate_ids: unknown[];
                        };
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    pembandingMap: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Marker peta berhasil diambil. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        message: string;
                        data: {
                            latitude: number;
                            longitude: number;
                            alamat_data: string;
                            image_url: string | null;
                        }[];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
        };
    };
    "dataPembanding.formOptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Opsi formulir pembanding berhasil diambil.";
                        data: {
                            provinces: {
                                label: string;
                                value: string;
                            }[];
                            regencies: {
                                label: string;
                                value: string;
                            }[];
                            districts: {
                                label: string;
                                value: string;
                            }[];
                            villages: {
                                label: string;
                                value: string;
                            }[];
                            jenisListings: {
                                label: string;
                                value: string;
                            }[];
                            jenisObjeks: {
                                label: string;
                                value: string;
                            }[];
                            statusPemberiInfos: {
                                label: string;
                                value: string;
                            }[];
                            bentukTanahs: {
                                label: string;
                                value: string;
                            }[];
                            posisiTanahs: {
                                label: string;
                                value: string;
                            }[];
                            kondisiTanahs: {
                                label: string;
                                value: string;
                            }[];
                            topografis: {
                                label: string;
                                value: string;
                            }[];
                            dokumenTanahs: {
                                label: string;
                                value: string;
                            }[];
                            peruntukans: {
                                label: string;
                                value: string;
                            }[];
                            tanahId: unknown;
                            sawahId: unknown;
                            tanahKebunId: unknown;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "dataPembanding.creators": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar pembuat data pembanding.";
                        data: {
                            id: number;
                            name: string;
                        }[];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
        };
    };
    "dataPembanding.similarByPayload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FindSimilarPembandingRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Beberapa data yang cocok";
                        data: components["schemas"]["SimilarPembandingResource"][];
                    } | {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Tidak ada data pembanding yang cocok";
                        data: string[];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "dataPembanding.similarById": {
        parameters: {
            query?: {
                q?: string | null;
                province_id?: string | null;
                regency_id?: string | null;
                district_id?: string | null;
                village_id?: string | null;
                jenis_listing_id?: number | null;
                jenis_objek_id?: number | null;
                created_by?: number | null;
                dari_tanggal?: string | null;
                sampai_tanggal?: string | null;
                peruntukan?: string | null;
                jenis_objek?: string | null;
                min_harga?: number | null;
                max_harga?: number | null;
                min_luas_tanah?: number | null;
                max_luas_tanah?: number | null;
                sort?: "tanggal_data" | "harga" | "luas_tanah" | "luas_bangunan" | "created_at" | "id" | null;
                direction?: "asc" | "desc" | "ASC" | "DESC" | null;
                per_page?: number | null;
                limit?: number | null;
                range_km?: number | null;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Beberapa data yang cocok";
                        data: components["schemas"]["SimilarPembandingResource"][];
                    } | {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Tidak ada data pembanding yang cocok";
                        data: string[];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        message: string;
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "dataPembanding.history": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Riwayat perubahan data pembanding";
                        data: string;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        message: string;
                        errors: null;
                    };
                };
            };
        };
    };
    "dataPembanding.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data Ditemukan";
                        data: components["schemas"]["PembandingResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        message: string;
                        errors: null;
                    };
                };
            };
        };
    };
    "dataPembanding.update_2": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["PembandingUpdateRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data pembanding berhasil diperbarui.";
                        data: components["schemas"]["PembandingResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        message: string;
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "dataPembanding.update_1": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["PembandingUpdateRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data pembanding berhasil diperbarui.";
                        data: components["schemas"]["PembandingResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        message: string;
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "dataPembanding.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data pembanding berhasil dihapus.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        message: string;
                        errors: null;
                    };
                };
            };
        };
    };
    "dataPembanding.update_3": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["PembandingUpdateRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data pembanding berhasil diperbarui.";
                        data: components["schemas"]["PembandingResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        message: string;
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "dataPembanding.requestDelete": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Permintaan hapus berhasil dikirim dan menunggu evaluasi moderator.";
                        data: components["schemas"]["PembandingDeleteRequest"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        message: string;
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "pembandingDuplicateReview.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The submission ID */
                submission: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data review duplikat berhasil diambil.";
                        data: {
                            submission: {
                                id: string;
                                expires_at: string;
                                image_url: string;
                                rows: {
                                    key: string;
                                    label: string;
                                    value: string;
                                }[];
                            };
                            candidates: {
                                id: number;
                                created_by: string;
                                updated_at: string | null;
                                deleted: boolean;
                                can_update: string;
                                image_url: string;
                                rows: {
                                    key: string;
                                    label: string;
                                    value: string;
                                }[];
                            }[];
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "FORBIDDEN";
                        /** @constant */
                        message: "Kandidat duplikat tidak dapat diakses oleh akun ini.";
                        errors: null;
                    };
                };
            };
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "pembandingDuplicateReview.image": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The submission ID */
                submission: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "pembandingDuplicateReview.resolve_0": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The submission ID */
                submission: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    strategy: "use_existing" | "replace_existing";
                    candidate_id: number;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Record lama berhasil diperbarui menggunakan data yang baru diinput.";
                        data: components["schemas"]["PembandingResource"];
                    } | {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data baru dibatalkan. Record lama tetap digunakan.";
                        data: components["schemas"]["PembandingResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "STALE_RECORD";
                        /** @constant */
                        message: "Record lama telah berubah. Muat ulang proses input dan periksa kembali.";
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "pembandingDuplicateReview.resolve_0.legacy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The submission ID */
                submission: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    strategy: "use_existing" | "replace_existing";
                    candidate_id: number;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Record lama berhasil diperbarui menggunakan data yang baru diinput.";
                        data: components["schemas"]["PembandingResource"];
                    } | {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data baru dibatalkan. Record lama tetap digunakan.";
                        data: components["schemas"]["PembandingResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "STALE_RECORD";
                        /** @constant */
                        message: "Record lama telah berubah. Muat ulang proses input dan periksa kembali.";
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "geoData.index": {
        parameters: {
            query?: {
                province_id?: string;
                regency_id?: string;
                district_id?: string;
            };
            header?: never;
            path: {
                /**
                 * @description Tipe wilayah administratif.
                 * @example provinces
                 */
                resource: "provinces" | "regencies" | "districts" | "villages";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        message: string;
                        data: {
                            id: string;
                            name: string;
                            children_count: string;
                        }[] | {
                            id: string;
                            name: string;
                            province_id: string;
                            parent_name: string;
                            children_count: string;
                        }[] | {
                            id: string;
                            name: string;
                            regency_id: string;
                            province_id: string;
                            parent_name: string | null;
                            children_count: string;
                        }[] | {
                            id: string;
                            name: string;
                            district_id: string;
                            regency_id: string;
                            province_id: string;
                            parent_name: string | null;
                            children_count: number;
                        }[] | string;
                        meta: {
                            current_page: number | string;
                            per_page: number | string;
                            from: number | null | string;
                            to: number | null | string;
                            total: number | string;
                            last_page: number | string;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                        resource_meta: string;
                        stats: {
                            provinces: number;
                            regencies: number;
                            districts: number;
                            villages: number;
                        };
                        options: {
                            provinces: {
                                value: string;
                                label: string;
                            }[];
                            regencies: {
                                value: string;
                                label: string;
                            }[];
                            districts: {
                                value: string;
                                label: string;
                            }[];
                        };
                    } | {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Metadata geo berhasil diambil.";
                        data: {
                            resources: {
                                key: string;
                                label: string;
                                singular: string;
                                icon: string;
                                children_label: string;
                                parent_key: string | null;
                            }[];
                            stats: {
                                provinces: number;
                                regencies: number;
                                districts: number;
                                villages: number;
                            };
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        /** @constant */
                        message: "Tipe resource wilayah tidak ditemukan.";
                        errors: null;
                    };
                };
            };
        };
    };
    "geoData.store": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                resource: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        message: string;
                        data: components["schemas"]["Province"] | components["schemas"]["Regency"] | components["schemas"]["District"] | components["schemas"]["Village"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        /** @constant */
                        message: "Resource tidak valid.";
                        errors: null;
                    };
                };
            };
        };
    };
    "geoData.update": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                resource: string;
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        message: string;
                        data: string | Record<string, never>;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        /** @constant */
                        message: "Resource tidak valid.";
                        errors: null;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "geoData.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                resource: string;
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        message: string;
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_FOUND";
                        /** @constant */
                        message: "Resource tidak valid.";
                        errors: null;
                    };
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "DELETE_FAILED";
                        /** @constant */
                        message: "Gagal menghapus data lokasi. Data ini mungkin masih digunakan.";
                        errors: null;
                    };
                };
            };
        };
    };
    "bulkExcelImport.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar batch impor Excel berhasil diambil.";
                        data: {
                            id: number;
                            filename: string;
                            owner: string;
                            status: string;
                            /** @enum {string} */
                            status_label: "Sedang dimasukkan" | "Selesai" | "Sebagian perlu diperbaiki" | "Perlu diperbaiki" | "Draf";
                            total_rows: number;
                            selected_rows: number;
                            ready_rows: number;
                            imported_rows: number;
                            failed_rows: number;
                            processing_rows: number;
                            unselected_rows: Record<string, never> | null;
                            can_edit: boolean;
                            can_finalize: string;
                            finalize_block_reason: string | null;
                            finalization_date: string;
                            finalized_at: string;
                            updated_at: string;
                        }[];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
        };
    };
    "bulkExcelImport.store": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["BulkExcelImportStoreRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @enum {string} */
                        message: "File ini sudah pernah diunggah. Draf sebelumnya dibuka kembali." | "File berhasil dibaca dan disimpan sebagai draf. Periksa data sebelum melanjutkan.";
                        data: {
                            batch: {
                                id: number;
                                filename: string;
                                owner: string;
                                status: string;
                                /** @enum {string} */
                                status_label: "Sedang dimasukkan" | "Selesai" | "Sebagian perlu diperbaiki" | "Perlu diperbaiki" | "Draf";
                                total_rows: number;
                                selected_rows: number;
                                ready_rows: number;
                                imported_rows: number;
                                failed_rows: number;
                                processing_rows: number;
                                unselected_rows: Record<string, never> | null;
                                can_edit: boolean;
                                can_finalize: string;
                                finalize_block_reason: string | null;
                                finalization_date: string;
                                finalized_at: string;
                                updated_at: string;
                            };
                            is_existing: boolean;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "bulkExcelImport.show": {
        parameters: {
            query?: {
                status?: "incomplete" | "needs_confirmation" | "invalid" | "duplicate" | "ready" | "imported" | "failed" | "queued" | "processing" | "final_duplicate" | "source_already_imported" | null;
                selected?: "0" | "1" | null;
            };
            header?: never;
            path: {
                /** @description The batch ID */
                batch: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Detail batch impor berhasil diambil.";
                        batch: {
                            id: number;
                            filename: string;
                            owner: string;
                            status: string;
                            /** @enum {string} */
                            status_label: "Sedang dimasukkan" | "Selesai" | "Sebagian perlu diperbaiki" | "Perlu diperbaiki" | "Draf";
                            total_rows: number;
                            selected_rows: number;
                            ready_rows: number;
                            imported_rows: number;
                            failed_rows: number;
                            processing_rows: number;
                            unselected_rows: Record<string, never> | null;
                            can_edit: boolean;
                            can_finalize: string;
                            finalize_block_reason: string | null;
                            finalization_date: string;
                            finalized_at: string;
                            updated_at: string;
                        };
                        data: {
                            id: number;
                            source_row_number: number;
                            status: string;
                            /** @enum {string} */
                            status_label: "Data sama" | "Perlu diperiksa" | "Perlu diperbaiki" | "Siap dimasukkan" | "Sedang diproses" | "Berhasil dimasukkan" | "Sudah ada di Data Pembanding" | "Sumber sudah pernah dimasukkan" | "Belum lengkap";
                            is_selected: boolean;
                            jenis_pembanding: unknown;
                            alamat: unknown;
                            location: string;
                            missing_fields: unknown[];
                            warnings: unknown[];
                            has_image: boolean;
                            image_url: string | null;
                            last_error: string | null;
                            failure_code: string | null;
                            result_url: string | null;
                        }[];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                        options: {
                            statusPemberiInfos: {
                                label: string;
                                value: string;
                            }[];
                            bentukTanahs: {
                                label: string;
                                value: string;
                            }[];
                            posisiTanahs: {
                                label: string;
                                value: string;
                            }[];
                            kondisiTanahs: {
                                label: string;
                                value: string;
                            }[];
                            topografis: {
                                label: string;
                                value: string;
                            }[];
                            dokumenTanahs: {
                                label: string;
                                value: string;
                            }[];
                            peruntukans: {
                                label: string;
                                value: string;
                            }[];
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "bulkExcelImport.selection": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The batch ID */
                batch: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BulkExcelImportSelectionRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Pilihan data berhasil disimpan.";
                        data: {
                            id: number;
                            filename: string;
                            owner: string;
                            status: string;
                            /** @enum {string} */
                            status_label: "Sedang dimasukkan" | "Selesai" | "Sebagian perlu diperbaiki" | "Perlu diperbaiki" | "Draf";
                            total_rows: number;
                            selected_rows: number;
                            ready_rows: number;
                            imported_rows: number;
                            failed_rows: number;
                            processing_rows: number;
                            unselected_rows: Record<string, never> | null;
                            can_edit: boolean;
                            can_finalize: string;
                            finalize_block_reason: string | null;
                            finalization_date: string;
                            finalized_at: string;
                            updated_at: string;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "bulkExcelImport.bulkApply": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The batch ID */
                batch: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BulkExcelImportBulkApplyRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        message: string | "Tidak ada data terpilih yang dapat diubah.";
                        data: {
                            updated_rows: number;
                            batch: {
                                id: number;
                                filename: string;
                                owner: string;
                                status: string;
                                /** @enum {string} */
                                status_label: "Sedang dimasukkan" | "Selesai" | "Sebagian perlu diperbaiki" | "Perlu diperbaiki" | "Draf";
                                total_rows: number;
                                selected_rows: number;
                                ready_rows: number;
                                imported_rows: number;
                                failed_rows: number;
                                processing_rows: number;
                                unselected_rows: Record<string, never> | null;
                                can_edit: boolean;
                                can_finalize: string;
                                finalize_block_reason: string | null;
                                finalization_date: string;
                                finalized_at: string;
                                updated_at: string;
                            };
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "bulkExcelImport.finalize": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The batch ID */
                batch: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BulkExcelImportFinalizeRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data mulai dimasukkan. Silakan pantau status pemrosesan.";
                        data: {
                            batch: {
                                id: number;
                                filename: string;
                                owner: string;
                                status: string;
                                /** @enum {string} */
                                status_label: "Sedang dimasukkan" | "Selesai" | "Sebagian perlu diperbaiki" | "Perlu diperbaiki" | "Draf";
                                total_rows: number;
                                selected_rows: number;
                                ready_rows: number;
                                imported_rows: number;
                                failed_rows: number;
                                processing_rows: number;
                                unselected_rows: Record<string, never> | null;
                                can_edit: boolean;
                                can_finalize: string;
                                finalize_block_reason: string | null;
                                finalization_date: string;
                                finalized_at: string;
                                updated_at: string;
                            };
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "bulkExcelImport.editRow": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The batch ID */
                batch: number;
                /** @description The row ID */
                row: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Detail baris impor berhasil diambil.";
                        data: {
                            row: {
                                id: number;
                                source_row_number: number;
                                status: string;
                                /** @enum {string} */
                                status_label: "Data sama" | "Perlu diperiksa" | "Perlu diperbaiki" | "Siap dimasukkan" | "Sedang diproses" | "Berhasil dimasukkan" | "Sudah ada di Data Pembanding" | "Sumber sudah pernah dimasukkan" | "Belum lengkap";
                                data: unknown[];
                                raw_payload: unknown[];
                                missing_fields: unknown[];
                                warnings: unknown[];
                                image_url: string | null;
                            };
                            options: {
                                provinces: {
                                    label: string;
                                    value: string;
                                }[];
                                regencies: {
                                    label: string;
                                    value: string;
                                }[];
                                districts: {
                                    label: string;
                                    value: string;
                                }[];
                                villages: {
                                    label: string;
                                    value: string;
                                }[];
                                jenisListings: {
                                    label: string;
                                    value: string;
                                }[];
                                jenisObjeks: {
                                    label: string;
                                    value: string;
                                }[];
                                statusPemberiInfos: {
                                    label: string;
                                    value: string;
                                }[];
                                bentukTanahs: {
                                    label: string;
                                    value: string;
                                }[];
                                posisiTanahs: {
                                    label: string;
                                    value: string;
                                }[];
                                kondisiTanahs: {
                                    label: string;
                                    value: string;
                                }[];
                                topografis: {
                                    label: string;
                                    value: string;
                                }[];
                                dokumenTanahs: {
                                    label: string;
                                    value: string;
                                }[];
                                peruntukans: {
                                    label: string;
                                    value: string;
                                }[];
                                tanahId: unknown;
                                sawahId: unknown;
                                tanahKebunId: unknown;
                            };
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "bulkExcelImport.updateRow": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The batch ID */
                batch: number;
                /** @description The row ID */
                row: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": components["schemas"]["BulkExcelImportRowUpdateRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @enum {string} */
                        message: "Draf tersimpan dan data ini sudah lengkap." | "Draf tersimpan. Lengkapi bagian yang masih ditandai.";
                        data: {
                            row: {
                                id: number;
                                status: string;
                                /** @enum {string} */
                                status_label: "Data sama" | "Perlu diperiksa" | "Perlu diperbaiki" | "Siap dimasukkan" | "Sedang diproses" | "Berhasil dimasukkan" | "Sudah ada di Data Pembanding" | "Sumber sudah pernah dimasukkan" | "Belum lengkap";
                                missing_fields: unknown[];
                                warnings: unknown[];
                            };
                            batch: {
                                id: number;
                                filename: string;
                                owner: string;
                                status: string;
                                /** @enum {string} */
                                status_label: "Sedang dimasukkan" | "Selesai" | "Sebagian perlu diperbaiki" | "Perlu diperbaiki" | "Draf";
                                total_rows: number;
                                selected_rows: number;
                                ready_rows: number;
                                imported_rows: number;
                                failed_rows: number;
                                processing_rows: number;
                                unselected_rows: Record<string, never> | null;
                                can_edit: boolean;
                                can_finalize: string;
                                finalize_block_reason: string | null;
                                finalization_date: string;
                                finalized_at: string;
                                updated_at: string;
                            };
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "bulkExcelImport.rowImage": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The batch ID */
                batch: number;
                /** @description The row ID */
                row: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "bulkExcelImport.retryRow": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The batch ID */
                batch: number;
                /** @description The row ID */
                row: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data akan dicoba kembali.";
                        data: {
                            row: {
                                id: number;
                                status: string;
                                /** @enum {string} */
                                status_label: "Data sama" | "Perlu diperiksa" | "Perlu diperbaiki" | "Siap dimasukkan" | "Sedang diproses" | "Berhasil dimasukkan" | "Sudah ada di Data Pembanding" | "Sumber sudah pernah dimasukkan" | "Belum lengkap";
                            };
                            batch: {
                                id: number;
                                filename: string;
                                owner: string;
                                status: string;
                                /** @enum {string} */
                                status_label: "Sedang dimasukkan" | "Selesai" | "Sebagian perlu diperbaiki" | "Perlu diperbaiki" | "Draf";
                                total_rows: number;
                                selected_rows: number;
                                ready_rows: number;
                                imported_rows: number;
                                failed_rows: number;
                                processing_rows: number;
                                unselected_rows: Record<string, never> | null;
                                can_edit: boolean;
                                can_finalize: string;
                                finalize_block_reason: string | null;
                                finalization_date: string;
                                finalized_at: string;
                                updated_at: string;
                            };
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "user.roleOptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar opsi role berhasil diambil.";
                        data: {
                            value: string;
                            label: string;
                        }[];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "user.toggleStatus": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The user ID */
                user: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        message: string;
                        data: {
                            id: number;
                            is_active: boolean;
                            deactivated_at: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "user.bulkDelete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    ids: number[];
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        message: string;
                        data: {
                            deleted_count: number;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "user.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar pengguna berhasil diambil.";
                        data: unknown[];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                        can: {
                            [key: string]: string;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "user.store": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserStoreRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Pengguna berhasil dibuat.";
                        data: components["schemas"]["UserResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "user.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The user ID */
                user: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Detail pengguna berhasil diambil.";
                        data: components["schemas"]["UserResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "user.update": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The user ID */
                user: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserUpdateRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Pengguna berhasil diperbarui.";
                        data: components["schemas"]["UserResource"];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "user.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The user ID */
                user: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Pengguna berhasil dihapus.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "CANNOT_DELETE_SELF";
                        /** @constant */
                        message: "Anda tidak dapat menghapus akun Anda sendiri.";
                        errors: null;
                    };
                };
            };
        };
    };
    "accessControl.roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar role berhasil diambil.";
                        data: {
                            id: number;
                            name: string;
                            guard_name: string;
                            permissions_count: string;
                            users_count: string;
                            permissions: unknown[];
                            is_locked: boolean;
                        }[];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "accessControl.storeRole": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Role berhasil dibuat.";
                        data: {
                            id: number;
                            name: string;
                            permissions: unknown[];
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "accessControl.updateRole": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The role ID */
                role: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Role berhasil diperbarui.";
                        data: {
                            id: number;
                            name: string;
                            permissions: unknown[];
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "accessControl.destroyRole": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The role ID */
                role: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Role berhasil dihapus.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "ROLE_IN_USE";
                        /** @constant */
                        message: "Role masih dipakai oleh user, lepaskan role dari user terlebih dahulu.";
                        errors: null;
                    } | {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "LOCKED_ROLE";
                        /** @constant */
                        message: "Role super_admin tidak boleh dihapus.";
                        errors: null;
                    };
                };
            };
        };
    };
    "accessControl.permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar permission berhasil diambil.";
                        data: {
                            id: number;
                            name: string;
                            guard_name: string;
                            group: string;
                            roles_count: string;
                            users_count: string;
                            is_locked: boolean;
                        }[];
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "accessControl.storePermission": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                };
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Permission berhasil dibuat.";
                        data: {
                            id: number;
                            name: string;
                            group: string;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "accessControl.destroyPermission": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The permission ID */
                permission: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Permission berhasil dihapus.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "PERMISSION_IN_USE";
                        /** @constant */
                        message: "Permission masih dipakai oleh role atau user.";
                        errors: null;
                    } | {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "LOCKED_PERMISSION";
                        /** @constant */
                        message: "Permission sistem ini tidak boleh dihapus.";
                        errors: null;
                    };
                };
            };
        };
    };
    "dataContributorRegistration.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Token undangan valid.";
                        data: {
                            is_valid: boolean;
                            valid: boolean;
                            expires_at: string | null;
                        };
                    } | {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Token undangan tidak valid atau kedaluwarsa.";
                        data: {
                            is_valid: boolean;
                            valid: boolean;
                            /** @constant */
                            message: "Link registrasi tidak valid, sudah digunakan, atau sudah kedaluwarsa.";
                        };
                    };
                };
            };
        };
    };
    "dataContributorRegistration.store": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubmitRegistrationRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Pendaftaran kontributor berhasil dikirim.";
                        data: {
                            generated_email: string;
                            /** @constant */
                            message: "Pendaftaran berhasil dikirim. Tunggu persetujuan admin untuk mengaktifkan akun Anda.";
                        };
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "dataContributorInvitation.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar token undangan berhasil diambil.";
                        data: {
                            id: number;
                            token_fingerprint: string;
                            status: string;
                            expires_at: string | null;
                            used_at: string | null;
                            created_at: string | null;
                            created_by: string;
                            request: {
                                display_name: string;
                                generated_email: string;
                                status: string;
                                submitted_at: string | null;
                            } | null;
                        }[];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "dataContributorInvitation.store": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Invitation link berhasil dibuat. Salin token ini karena hanya ditampilkan satu kali.";
                        data: {
                            id: number;
                            raw_token: string;
                            registration_url: string;
                            expires_at: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "dataContributorInvitation.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The invite ID */
                invite: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Invitation yang belum digunakan berhasil dihapus.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "CANNOT_REVOKE_USED_INVITE";
                        /** @constant */
                        message: "Invitation hanya bisa dihapus jika belum digunakan.";
                        errors: null;
                    };
                };
            };
        };
    };
    "dataContributorInvitation.registrationRequests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar pengajuan registrasi kontributor berhasil diambil.";
                        data: {
                            id: number;
                            display_name: string;
                            generated_email: string;
                            phone: string;
                            status: string;
                            submitted_at: string | null;
                            generated_by: string;
                            accepted_at: string | null;
                            accepted_by: string;
                            rejected_at: string | null;
                            rejected_by: string;
                            reject_reason: string | null;
                        }[];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "dataContributorInvitation.accept": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The registration request ID */
                registrationRequest: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data contributor berhasil dibuat.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "ACCEPT_FAILED";
                        /** @enum {string|null} */
                        message: "Email login sudah dipakai user lain. Request tidak bisa di-accept." | "Request ini sudah diproses." | null;
                        errors: null;
                    };
                };
            };
        };
    };
    "dataContributorInvitation.reject": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The registration request ID */
                registrationRequest: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["RejectRegistrationRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Request data contributor berhasil ditolak.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            403: components["responses"]["AuthorizationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "moderation.index": {
        parameters: {
            query?: {
                tab?: string;
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data moderasi berhasil diambil.";
                        tab: string | unknown[] | null;
                        data: {
                            id: number;
                            alamat_data: string;
                            harga: number | null;
                            deleted_at: string | null;
                            deleted_reason: string | null;
                            jenis_listing: {
                                name: string;
                                badge_color: string | null;
                            };
                            deleted_by: {
                                name: string;
                            };
                        }[];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                        can: {
                            [key: string]: string;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "moderation.approve": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Permohonan hapus disetujui dan data dipindahkan ke tempat sampah.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "ALREADY_PROCESSED";
                        /** @constant */
                        message: "Permohonan hapus sudah diproses sebelumnya.";
                        errors: null;
                    };
                };
            };
        };
    };
    "moderation.reject": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    review_note: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Permohonan hapus berhasil ditolak.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "moderation.restore": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data pembanding berhasil dipulihkan.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "moderation.forceDelete": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Data pembanding berhasil dihapus secara permanen.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "export.configuration": {
        parameters: {
            query?: {
                format?: "excel" | "pdf" | "csv" | "geojson" | "kml" | null;
                mode?: "summary" | "detail" | null;
                profile?: "ringkas" | "lengkap" | "kontak" | "geospasial" | "audit" | null;
                scope?: "selected" | "filtered" | null;
                dataset?: "all" | "complete" | "issues" | null;
                ids?: string | null;
                "columns[]"?: string[];
                province_id?: string | null;
                regency_id?: string | null;
                district_id?: string | null;
                village_id?: string | null;
                jenis_listing_id?: number | null;
                jenis_objek_id?: number | null;
                created_by?: number | null;
                dari_tanggal?: string | null;
                sampai_tanggal?: string | null;
                q?: string | null;
                per_page?: "25" | "50" | "100" | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Konfigurasi ekspor berhasil diambil.";
                        data: {
                            configuration: {
                                profiles: {
                                    value: string;
                                    label: string;
                                    columns: string[];
                                }[];
                                columns: {
                                    value: string;
                                    label: string;
                                    type: string;
                                }[];
                            };
                            limits: {
                                /** @constant */
                                excel: 5000;
                                /** @constant */
                                csv: 5000;
                                /** @constant */
                                geojson: 5000;
                                /** @constant */
                                kml: 5000;
                                /** @constant */
                                pdf_summary: 1000;
                                /** @constant */
                                pdf_detail: 100;
                            };
                            async_limits: {
                                /** @constant */
                                excel: 100000;
                                /** @constant */
                                csv: 100000;
                                /** @constant */
                                geojson: 50000;
                                /** @constant */
                                kml: 50000;
                                /** @constant */
                                pdf_summary: 5000;
                                /** @constant */
                                pdf_detail: 500;
                            };
                            can: {
                                [key: string]: string;
                            };
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "export.preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PembandingExportRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Preview ekspor berhasil dihitung.";
                        data: {
                            count: string;
                            sync_limit: number;
                            queued: boolean;
                            without_coordinates: string;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "export.runs": {
        parameters: {
            query?: {
                format?: "excel" | "pdf" | "csv" | "geojson" | "kml" | null;
                mode?: "summary" | "detail" | null;
                profile?: "ringkas" | "lengkap" | "kontak" | "geospasial" | "audit" | null;
                scope?: "selected" | "filtered" | null;
                dataset?: "all" | "complete" | "issues" | null;
                ids?: string | null;
                "columns[]"?: string[];
                province_id?: string | null;
                regency_id?: string | null;
                district_id?: string | null;
                village_id?: string | null;
                jenis_listing_id?: number | null;
                jenis_objek_id?: number | null;
                created_by?: number | null;
                dari_tanggal?: string | null;
                sampai_tanggal?: string | null;
                q?: string | null;
                per_page?: "25" | "50" | "100" | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar riwayat tugas ekspor berhasil diambil.";
                        data: {
                            id: number;
                            status: string;
                            format: string;
                            mode: string | null;
                            profile: string;
                            scope: string;
                            total_records: number;
                            processed_records: number;
                            created_at: string | null;
                            expires_at: string | null;
                            error: string | null;
                            download_url: string | null;
                        }[];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "export.storeRun": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PembandingExportRequest"];
            };
        };
        responses: {
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Tugas ekspor berhasil didaftarkan ke antrean.";
                        data: {
                            id: number;
                            status: string;
                            format: string;
                            mode: string | null;
                            profile: string;
                            scope: string;
                            total_records: number;
                            processed_records: number;
                            created_at: string | null;
                            expires_at: string | null;
                            error: string | null;
                            download_url: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "export.runStatus": {
        parameters: {
            query?: {
                format?: "excel" | "pdf" | "csv" | "geojson" | "kml" | null;
                mode?: "summary" | "detail" | null;
                profile?: "ringkas" | "lengkap" | "kontak" | "geospasial" | "audit" | null;
                scope?: "selected" | "filtered" | null;
                dataset?: "all" | "complete" | "issues" | null;
                ids?: string | null;
                "columns[]"?: string[];
                province_id?: string | null;
                regency_id?: string | null;
                district_id?: string | null;
                village_id?: string | null;
                jenis_listing_id?: number | null;
                jenis_objek_id?: number | null;
                created_by?: number | null;
                dari_tanggal?: string | null;
                sampai_tanggal?: string | null;
                q?: string | null;
                per_page?: "25" | "50" | "100" | null;
            };
            header?: never;
            path: {
                /** @description The export run ID */
                exportRun: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Status tugas ekspor.";
                        data: {
                            id: number;
                            status: string;
                            format: string;
                            mode: string | null;
                            profile: string;
                            scope: string;
                            total_records: number;
                            processed_records: number;
                            created_at: string | null;
                            expires_at: string | null;
                            error: string | null;
                            download_url: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "export.downloadRun": {
        parameters: {
            query?: {
                format?: "excel" | "pdf" | "csv" | "geojson" | "kml" | null;
                mode?: "summary" | "detail" | null;
                profile?: "ringkas" | "lengkap" | "kontak" | "geospasial" | "audit" | null;
                scope?: "selected" | "filtered" | null;
                dataset?: "all" | "complete" | "issues" | null;
                ids?: string | null;
                "columns[]"?: string[];
                province_id?: string | null;
                regency_id?: string | null;
                district_id?: string | null;
                village_id?: string | null;
                jenis_listing_id?: number | null;
                jenis_objek_id?: number | null;
                created_by?: number | null;
                dari_tanggal?: string | null;
                sampai_tanggal?: string | null;
                q?: string | null;
                per_page?: "25" | "50" | "100" | null;
            };
            header?: never;
            path: {
                /** @description The export run ID */
                exportRun: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": Record<string, never>;
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "export.retryRun": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The export run ID */
                exportRun: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PembandingExportRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Ekspor dijadwalkan ulang.";
                        data: {
                            id: number;
                            status: string;
                            format: string;
                            mode: string | null;
                            profile: string;
                            scope: string;
                            total_records: number;
                            processed_records: number;
                            created_at: string | null;
                            expires_at: string | null;
                            error: string | null;
                            download_url: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
            /** @description An error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /**
                         * @description Error overview.
                         * @example Hanya ekspor berstatus gagal yang dapat diulang.
                         */
                        message: string;
                    };
                };
            };
            422: components["responses"]["ValidationException"];
        };
    };
    "export.download": {
        parameters: {
            query?: {
                format?: "excel" | "pdf" | "csv" | "geojson" | "kml" | null;
                mode?: "summary" | "detail" | null;
                profile?: "ringkas" | "lengkap" | "kontak" | "geospasial" | "audit" | null;
                scope?: "selected" | "filtered" | null;
                dataset?: "all" | "complete" | "issues" | null;
                ids?: string | null;
                "columns[]"?: string[];
                province_id?: string | null;
                regency_id?: string | null;
                district_id?: string | null;
                village_id?: string | null;
                jenis_listing_id?: number | null;
                jenis_objek_id?: number | null;
                created_by?: number | null;
                dari_tanggal?: string | null;
                sampai_tanggal?: string | null;
                q?: string | null;
                per_page?: "25" | "50" | "100" | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    "Transfer-Encoding": "chunked";
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                    "text/csv; charset=UTF-8": string;
                    "application/geo+json; charset=UTF-8": string;
                    "application/vnd.google-earth.kml+xml; charset=UTF-8": string;
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    search: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Hasil pencarian berhasil diambil.";
                        query: string;
                        data: string[];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                        summary: {
                            raw_total: number;
                            filtered_total: number;
                        };
                        options: {
                            menu_groups: {
                                label: string;
                                value: string;
                            }[];
                            menu_names: {
                                label: string;
                                value: string;
                            }[];
                            resource_names: {
                                label: string;
                                value: string;
                            }[];
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "appNotification.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar notifikasi berhasil diambil.";
                        unread_count: number;
                        data: {
                            id: string;
                            type: string;
                            data: unknown[];
                            read_at: string | null;
                            created_at: string | null;
                        }[];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "appNotification.read": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Notifikasi telah ditandai sebagai dibaca.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "appNotification.readAll": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Semua notifikasi telah ditandai sebagai dibaca.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "activityLog.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Daftar activity log berhasil diambil.";
                        data: {
                            id: number;
                            log_name: string | null;
                            description: string;
                            event: string | null;
                            subject_type: string | null;
                            subject_id: number | null;
                            causer: {
                                id: number;
                                name: string;
                                email: string;
                            } | null;
                            properties: Record<string, never> | null;
                            created_at: string | null;
                        }[];
                        meta: {
                            current_page: number;
                            per_page: number;
                            from: number | null;
                            to: number | null;
                            total: number;
                            last_page: number;
                        };
                        links: {
                            first: string;
                            last: string;
                            prev: string | null;
                            next: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "activityLog.show": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Detail activity log berhasil diambil.";
                        data: {
                            id: string;
                            log_name: string;
                            description: string;
                            event: string;
                            subject_type: string;
                            subject_id: string;
                            causer: {
                                id: string;
                                name: string;
                                email: string;
                            } | null;
                            properties: string;
                            created_at: string | null;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "setting.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Pengaturan sistem berhasil diambil.";
                        data: {
                            settings: {
                                [key: string]: unknown;
                            };
                            can: {
                                [key: string]: string;
                            };
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "setting.update_1": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** @enum {string|null} */
                    system_mode?: "live" | "maintenance" | "off" | null;
                    app_version?: string | null;
                    primary_color?: string | null;
                    company_name?: string | null;
                    /** Format: email */
                    support_email?: string | null;
                    /**
                     * Format: binary
                     * @description Maximum file size: 2048 kilobytes.
                     */
                    app_logo?: string | null;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Pengaturan berhasil diperbarui.";
                        data: {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "setting.update_2": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** @enum {string|null} */
                    system_mode?: "live" | "maintenance" | "off" | null;
                    app_version?: string | null;
                    primary_color?: string | null;
                    company_name?: string | null;
                    /** Format: email */
                    support_email?: string | null;
                    /**
                     * Format: binary
                     * @description Maximum file size: 2048 kilobytes.
                     */
                    app_logo?: string | null;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Pengaturan berhasil diperbarui.";
                        data: {
                            [key: string]: unknown;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "setting.clearCache": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Semua cache berhasil dibersihkan.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "publicSetting.show": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Pengaturan publik berhasil diambil.";
                        data: {
                            app_name: string;
                            app_logo: unknown;
                            app_logo_url: null;
                            app_version: unknown;
                            company_name: unknown;
                            support_email: unknown;
                        };
                    };
                };
            };
        };
    };
    "backup.index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Katalog backup berhasil diambil.";
                        data: {
                            artifacts: {
                                id: string;
                                type: string;
                                /** @enum {string} */
                                type_label: "Database" | "Uploaded files" | "Backup lengkap";
                                filename: string;
                                size: number;
                                size_label: string;
                                checksum: string;
                                checksum_short: string;
                                created_at: string;
                                created_by: string;
                                origin: string;
                                verified: boolean;
                                verified_at: string | null;
                                last_restore: string | null;
                                download_url: string;
                            }[];
                            legacy_artifacts: {
                                id: string;
                                type: string;
                                /** @enum {string} */
                                type_label: "Database" | "Uploaded files";
                                filename: string;
                                size: string;
                                size_label: string;
                                created_at: string;
                                restorable: boolean;
                            }[];
                            readiness: {
                                zip: boolean;
                                storage_writable: boolean;
                                signing_key: boolean;
                                restore_enabled: boolean;
                                uploads_restore_ready: string;
                                database_restore_ready: boolean;
                                /** @constant */
                                database_restore_note: "Restore database belum diimplementasikan dan tetap dikunci.";
                                max_package_mb: number;
                                retention_days: number;
                            };
                            can: {
                                [key: string]: string | boolean;
                            };
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
        };
    };
    "backupArtifact.store": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BackupCreateRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Backup berhasil dibuat dan sudah dapat diunduh.";
                        data: {
                            id: string;
                            type: string;
                            /** @enum {string} */
                            type_label: "Database" | "Uploaded files" | "Backup lengkap";
                            filename: string;
                            size: number;
                            size_label: string;
                            checksum: string;
                            checksum_short: string;
                            created_at: string;
                            created_by: unknown[];
                            origin: string;
                            verified: boolean;
                            verified_at: string | null;
                            last_restore: unknown[] | null;
                            download_url: string;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "BACKUP_CREATION_FAILED";
                        message: string;
                        errors: null;
                    };
                };
            };
        };
    };
    "backupArtifact.import": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["BackupImportRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Paket terverifikasi dan berhasil ditambahkan.";
                        data: {
                            id: string;
                            type: string;
                            /** @enum {string} */
                            type_label: "Database" | "Uploaded files" | "Backup lengkap";
                            filename: string;
                            size: number;
                            size_label: string;
                            checksum: string;
                            checksum_short: string;
                            created_at: string;
                            created_by: unknown[];
                            origin: string;
                            verified: boolean;
                            verified_at: string | null;
                            last_restore: unknown[] | null;
                            download_url: string;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: components["responses"]["ValidationException"];
        };
    };
    "backupFile.download": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                artifact: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @example attachment */
                    "Content-Disposition": string;
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "backupArtifact.verify": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                artifact: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Signature dan checksum backup valid.";
                        data: {
                            id: string;
                            checksum: string;
                            verified: boolean;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "VERIFICATION_FAILED";
                        message: string;
                        errors: null;
                    };
                };
            };
        };
    };
    "backupFile.destroy": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                artifact: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Backup berhasil dihapus.";
                        data: null;
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            404: components["responses"]["ModelNotFoundException"];
        };
    };
    "backupRestore.uploads": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                artifact: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BackupRestoreRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "success";
                        /** @constant */
                        message: "Uploaded files berhasil dipulihkan. Backup keselamatan otomatis telah dibuat.";
                        data: {
                            restored_artifact_id: string;
                        };
                    };
                };
            };
            401: components["responses"]["AuthenticationException"];
            /** @description An error */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /**
                         * @description Error overview.
                         * @example Hanya super admin yang dapat melakukan pemulihan sistem.
                         */
                        message: string;
                    };
                };
            };
            404: components["responses"]["ModelNotFoundException"];
            422: components["responses"]["ValidationException"];
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "RESTORE_FAILED";
                        message: string;
                        errors: null;
                    } | {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "RESTORE_ROLLBACK_INCOMPLETE";
                        message: string;
                        errors: null;
                    };
                };
            };
        };
    };
    "backupRestore.database": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                artifact: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            401: components["responses"]["AuthenticationException"];
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @constant */
                        status: "error";
                        /** @constant */
                        code: "NOT_IMPLEMENTED";
                        /** @constant */
                        message: "Pemulihan database interaktif saat ini hanya dapat dijalankan melalui CLI/console runner.";
                        errors: null;
                    };
                };
            };
        };
    };
}
