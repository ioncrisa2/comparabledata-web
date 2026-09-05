import type { Pembanding } from '../api/pembanding.api'

export function createPembanding(overrides: Partial<Pembanding> = {}): Pembanding {
  const relation = (id: number, slug: string, name: string) => ({ id, slug, name })

  return {
    id: 42,
    jenis_listing: relation(1, 'jual', 'Dijual'),
    jenis_objek: relation(2, 'rumah-tinggal', 'Rumah tinggal'),
    peruntukan: relation(3, 'permukiman', 'Permukiman'),
    bentuk_tanah: relation(4, 'persegi', 'Persegi'),
    dokumen_tanah: relation(5, 'shm', 'SHM'),
    posisi_tanah: relation(6, 'tengah', 'Tengah'),
    kondisi_tanah: relation(7, 'siap-bangun', 'Siap bangun'),
    status_pemberi_informasi: relation(8, 'pemilik', 'Pemilik'),
    topografi: relation(9, 'datar', 'Datar'),
    nama_pemberi_informasi: 'Budi Santoso',
    nomer_telepon_pemberi_informasi: '081234567890',
    luas_tanah: 180,
    luas_bangunan: 120,
    tahun_bangun: '2019',
    lebar_depan: '10',
    lebar_jalan: '6',
    rasio_tapak: '0.67',
    harga: 2_400_000_000,
    is_sewa: false,
    jangka_waktu_sewa: null,
    satuan_waktu_sewa: null,
    sewa_periode_label: null,
    tanggal_data: '2026-08-30',
    catatan: 'Akses jalan baik dan lingkungan tenang.',
    province: { id: '32', name: 'Jawa Barat' },
    regency: { id: '3273', name: 'Kota Bandung' },
    district: { id: '3273020', name: 'Coblong' },
    village: { id: '3273020005', name: 'Dago' },
    alamat_data: 'Jl. Ir. H. Juanda No. 42, Bandung',
    latitude: -6.884123,
    longitude: 107.613456,
    image_url: 'https://example.test/pembanding-42.jpg',
    created_by: { id: 7, name: 'Ayu Penilai' },
    ...overrides,
  }
}
