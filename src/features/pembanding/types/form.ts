/** State form data pembanding — semua field sebagai string/null untuk kompatibilitas `<input>` */
export interface PembandingFormData {
  // Step 1 – Dasar
  jenis_listing_id: string
  jenis_objek_id: string
  tanggal_data: string
  harga: string
  jangka_waktu_sewa: string
  satuan_waktu_sewa: 'Bulan' | 'Tahun' | ''

  // Step 2 – Lokasi
  province_id: string
  regency_id: string
  district_id: string
  village_id: string
  alamat_data: string
  latitude: string
  longitude: string

  // Step 3 – Fisik & Karakteristik
  luas_tanah: string
  luas_bangunan: string
  lebar_depan: string
  lebar_jalan: string
  tahun_bangun: string
  rasio_tapak: string
  bentuk_tanah_id: string
  posisi_tanah_id: string
  kondisi_tanah_id: string
  topografi_id: string
  dokumen_tanah_id: string
  peruntukan_id: string

  // Step 4 – Sumber & Media
  nama_pemberi_informasi: string
  nomer_telepon_pemberi_informasi: string
  status_pemberi_informasi_id: string
  image: File | null
  catatan: string
}

export function emptyFormData(): PembandingFormData {
  return {
    jenis_listing_id: '',
    jenis_objek_id: '',
    tanggal_data: '',
    harga: '',
    jangka_waktu_sewa: '',
    satuan_waktu_sewa: '',

    province_id: '',
    regency_id: '',
    district_id: '',
    village_id: '',
    alamat_data: '',
    latitude: '',
    longitude: '',

    luas_tanah: '',
    luas_bangunan: '',
    lebar_depan: '',
    lebar_jalan: '',
    tahun_bangun: '',
    rasio_tapak: '',
    bentuk_tanah_id: '',
    posisi_tanah_id: '',
    kondisi_tanah_id: '',
    topografi_id: '',
    dokumen_tanah_id: '',
    peruntukan_id: '',

    nama_pemberi_informasi: '',
    nomer_telepon_pemberi_informasi: '',
    status_pemberi_informasi_id: '',
    image: null,
    catatan: '',
  }
}

export type FormErrors = Partial<Record<string, string>>

export interface FormStep {
  label: string
  description: string
}

export const FORM_STEPS: FormStep[] = [
  { label: 'Dasar', description: 'Jenis, tanggal, dan harga' },
  { label: 'Lokasi', description: 'Wilayah dan koordinat' },
  { label: 'Properti', description: 'Ukuran dan karakteristik' },
  { label: 'Sumber', description: 'Informan dan foto' },
]

/** Konversi PembandingFormData ke FormData untuk request multipart */
export function toFormData(form: PembandingFormData): FormData {
  const fd = new FormData()

  const appendIfFilled = (key: string, value: string | File | null | undefined) => {
    if (value === null || value === undefined || value === '') return
    fd.append(key, value instanceof File ? value : String(value))
  }

  fd.append('jenis_listing_id', form.jenis_listing_id)
  fd.append('jenis_objek_id', form.jenis_objek_id)
  fd.append('tanggal_data', form.tanggal_data)
  fd.append('harga', form.harga)
  appendIfFilled('jangka_waktu_sewa', form.jangka_waktu_sewa)
  appendIfFilled('satuan_waktu_sewa', form.satuan_waktu_sewa)

  fd.append('province_id', form.province_id)
  fd.append('regency_id', form.regency_id)
  fd.append('district_id', form.district_id)
  fd.append('village_id', form.village_id)
  fd.append('alamat_data', form.alamat_data)
  fd.append('latitude', form.latitude)
  fd.append('longitude', form.longitude)

  fd.append('luas_tanah', form.luas_tanah)
  appendIfFilled('luas_bangunan', form.luas_bangunan)
  fd.append('lebar_depan', form.lebar_depan)
  fd.append('lebar_jalan', form.lebar_jalan)
  appendIfFilled('tahun_bangun', form.tahun_bangun)
  appendIfFilled('rasio_tapak', form.rasio_tapak)
  fd.append('bentuk_tanah_id', form.bentuk_tanah_id)
  fd.append('posisi_tanah_id', form.posisi_tanah_id)
  fd.append('kondisi_tanah_id', form.kondisi_tanah_id)
  fd.append('topografi_id', form.topografi_id)
  fd.append('dokumen_tanah_id', form.dokumen_tanah_id)
  fd.append('peruntukan_id', form.peruntukan_id)

  fd.append('nama_pemberi_informasi', form.nama_pemberi_informasi)
  const phone = form.nomer_telepon_pemberi_informasi?.trim()
  const phoneDigits = phone ? phone.replace(/\D/g, '') : ''
  if (phoneDigits && phoneDigits !== '62' && phoneDigits !== '0') {
    appendIfFilled('nomer_telepon_pemberi_informasi', phone)
  }
  appendIfFilled('status_pemberi_informasi_id', form.status_pemberi_informasi_id)

  if (form.image) fd.append('image', form.image)
  appendIfFilled('catatan', form.catatan)

  return fd
}
