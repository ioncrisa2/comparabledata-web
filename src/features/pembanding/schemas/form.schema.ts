import { z } from 'zod'

import type { FormErrors, PembandingFormData } from '../types/form'

export const STEP_FIELD_MAPPING: Record<number, (keyof PembandingFormData)[]> = {
  0: [
    'jenis_listing_id',
    'jenis_objek_id',
    'tanggal_data',
    'harga',
    'jangka_waktu_sewa',
    'satuan_waktu_sewa',
  ],
  1: [
    'province_id',
    'regency_id',
    'district_id',
    'village_id',
    'alamat_data',
    'latitude',
    'longitude',
  ],
  2: [
    'luas_tanah',
    'luas_bangunan',
    'lebar_depan',
    'lebar_jalan',
    'tahun_bangun',
    'rasio_tapak',
    'bentuk_tanah_id',
    'posisi_tanah_id',
    'kondisi_tanah_id',
    'topografi_id',
    'dokumen_tanah_id',
    'peruntukan_id',
  ],
  3: [
    'nama_pemberi_informasi',
    'nomer_telepon_pemberi_informasi',
    'status_pemberi_informasi_id',
    'image',
    'catatan',
  ],
}

function positiveNumberRefinement(val: string) {
  if (!val || val.trim() === '') return false
  const num = Number(val)
  return Number.isFinite(num) && num > 0
}

function nonNegativeNumberRefinement(val: string) {
  if (!val || val.trim() === '') return true
  const num = Number(val)
  return Number.isFinite(num) && num >= 0
}

function latitudeRefinement(val: string) {
  if (!val || val.trim() === '') return false
  const num = Number(val)
  return Number.isFinite(num) && num >= -90 && num <= 90
}

function longitudeRefinement(val: string) {
  if (!val || val.trim() === '') return false
  const num = Number(val)
  return Number.isFinite(num) && num >= -180 && num <= 180
}

export const step1Schema = z.object({
  jenis_listing_id: z.string().min(1, 'Jenis listing wajib dipilih.'),
  jenis_objek_id: z.string().min(1, 'Jenis objek wajib dipilih.'),
  tanggal_data: z
    .string()
    .min(1, 'Tanggal data wajib diisi.')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal data harus YYYY-MM-DD.'),
  harga: z
    .string()
    .min(1, 'Harga wajib diisi.')
    .refine(positiveNumberRefinement, 'Harga harus lebih besar dari nol.'),
  jangka_waktu_sewa: z
    .string()
    .refine(nonNegativeNumberRefinement, 'Jangka waktu sewa harus berupa angka non-negatif.')
    .optional()
    .default(''),
  satuan_waktu_sewa: z.enum(['Bulan', 'Tahun', '']).optional().default(''),
})

export const step2Schema = z.object({
  province_id: z.string().min(1, 'Provinsi wajib dipilih.'),
  regency_id: z.string().min(1, 'Kabupaten/kota wajib dipilih.'),
  district_id: z.string().min(1, 'Kecamatan wajib dipilih.'),
  village_id: z.string().min(1, 'Desa/kelurahan wajib dipilih.'),
  alamat_data: z.string().min(1, 'Alamat lengkap wajib diisi.'),
  latitude: z
    .string()
    .min(1, 'Latitude wajib diisi.')
    .refine(latitudeRefinement, 'Latitude harus berada dalam rentang -90 hingga 90.'),
  longitude: z
    .string()
    .min(1, 'Longitude wajib diisi.')
    .refine(longitudeRefinement, 'Longitude harus berada dalam rentang -180 hingga 180.'),
})

export const step3Schema = z.object({
  luas_tanah: z
    .string()
    .min(1, 'Luas tanah wajib diisi.')
    .refine(positiveNumberRefinement, 'Luas tanah harus lebih besar dari nol.'),
  luas_bangunan: z
    .string()
    .refine(nonNegativeNumberRefinement, 'Luas bangunan harus berupa angka non-negatif.')
    .optional()
    .default(''),
  lebar_depan: z
    .string()
    .min(1, 'Lebar depan wajib diisi.')
    .refine(positiveNumberRefinement, 'Lebar depan harus lebih besar dari nol.'),
  lebar_jalan: z
    .string()
    .min(1, 'Lebar jalan wajib diisi.')
    .refine(positiveNumberRefinement, 'Lebar jalan harus lebih besar dari nol.'),
  tahun_bangun: z
    .string()
    .refine((val) => {
      if (!val || val.trim() === '') return true
      const num = Number(val)
      return Number.isInteger(num) && num >= 1800 && num <= 2100
    }, 'Tahun bangun harus berupa tahun yang valid.')
    .optional()
    .default(''),
  rasio_tapak: z
    .string()
    .refine(nonNegativeNumberRefinement, 'Rasio tapak harus berupa angka non-negatif.')
    .optional()
    .default(''),
  bentuk_tanah_id: z.string().min(1, 'Bentuk tanah wajib dipilih.'),
  posisi_tanah_id: z.string().min(1, 'Posisi tanah wajib dipilih.'),
  kondisi_tanah_id: z.string().min(1, 'Kondisi tanah wajib dipilih.'),
  topografi_id: z.string().min(1, 'Topografi wajib dipilih.'),
  dokumen_tanah_id: z.string().min(1, 'Dokumen tanah wajib dipilih.'),
  peruntukan_id: z.string().min(1, 'Peruntukan wajib dipilih.'),
})

export const step4Schema = z.object({
  nama_pemberi_informasi: z.string().min(1, 'Nama pemberi informasi wajib diisi.'),
  nomer_telepon_pemberi_informasi: z
    .string()
    .refine((val) => {
      if (!val || val.trim() === '') return true
      const digits = val.replace(/\D/g, '')
      return digits.length >= 8 && digits.length <= 16
    }, 'Nomor telepon minimal 8 digit angka.')
    .optional()
    .default(''),
  status_pemberi_informasi_id: z.string().optional().default(''),
  catatan: z.string().optional().default(''),
})

export const pembandingFormSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)

const STEP_SCHEMAS: Record<number, z.ZodTypeAny> = {
  0: step1Schema,
  1: step2Schema,
  2: step3Schema,
  3: step4Schema,
}

export function validateStep(step: number, data: PembandingFormData): FormErrors {
  const schema = STEP_SCHEMAS[step]
  if (!schema) return {}

  const result = schema.safeParse(data)
  if (result.success) return {}

  const errors: FormErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (field && typeof field === 'string' && !errors[field]) {
      errors[field] = issue.message
    }
  }
  return errors
}

export function validatePembandingForm(data: PembandingFormData): FormErrors {
  const result = pembandingFormSchema.safeParse(data)
  if (result.success) return {}

  const errors: FormErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (field && typeof field === 'string' && !errors[field]) {
      errors[field] = issue.message
    }
  }
  return errors
}

export function findStepForError(errors: FormErrors): number | null {
  const errorKeys = Object.keys(errors)
  for (let i = 0; i < 4; i++) {
    const stepKeys = STEP_FIELD_MAPPING[i]
    if (stepKeys && errorKeys.some((k) => stepKeys.includes(k as keyof PembandingFormData))) {
      return i
    }
  }
  return null
}
