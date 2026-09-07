import { describe, expect, it } from 'vitest'

import { emptyFormData } from '../types/form'
import { findStepForError, validatePembandingForm, validateStep } from './form.schema'

describe('form.schema', () => {
  it('validates step 0 (dasar)', () => {
    const empty = emptyFormData()
    const errors = validateStep(0, empty)

    expect(errors.jenis_listing_id).toBe('Jenis listing wajib dipilih.')
    expect(errors.jenis_objek_id).toBe('Jenis objek wajib dipilih.')
    expect(errors.tanggal_data).toBe('Tanggal data wajib diisi.')
    expect(errors.harga).toBe('Harga wajib diisi.')

    const invalidDateAndPrice = {
      ...empty,
      jenis_listing_id: '1',
      jenis_objek_id: '2',
      tanggal_data: '30-08-2026',
      harga: '0',
    }
    const errors2 = validateStep(0, invalidDateAndPrice)
    expect(errors2.tanggal_data).toBe('Format tanggal data harus YYYY-MM-DD.')
    expect(errors2.harga).toBe('Harga harus lebih besar dari nol.')

    const valid = {
      ...empty,
      jenis_listing_id: '1',
      jenis_objek_id: '2',
      tanggal_data: '2026-08-30',
      harga: '2500000000',
    }
    expect(validateStep(0, valid)).toEqual({})
  })

  it('validates step 1 (lokasi)', () => {
    const empty = emptyFormData()
    const errors = validateStep(1, empty)

    expect(errors.province_id).toBe('Provinsi wajib dipilih.')
    expect(errors.regency_id).toBe('Kabupaten/kota wajib dipilih.')
    expect(errors.district_id).toBe('Kecamatan wajib dipilih.')
    expect(errors.village_id).toBe('Desa/kelurahan wajib dipilih.')
    expect(errors.alamat_data).toBe('Alamat lengkap wajib diisi.')
    expect(errors.latitude).toBe('Latitude wajib diisi.')
    expect(errors.longitude).toBe('Longitude wajib diisi.')

    const invalidCoords = {
      ...empty,
      province_id: '32',
      regency_id: '3273',
      district_id: '3273020',
      village_id: '3273020005',
      alamat_data: 'Jl. Riau No. 10',
      latitude: '95',
      longitude: '-200',
    }
    const errors2 = validateStep(1, invalidCoords)
    expect(errors2.latitude).toBe('Latitude harus berada dalam rentang -90 hingga 90.')
    expect(errors2.longitude).toBe('Longitude harus berada dalam rentang -180 hingga 180.')

    const valid = {
      ...invalidCoords,
      latitude: '-6.9147',
      longitude: '107.6098',
    }
    expect(validateStep(1, valid)).toEqual({})
  })

  it('validates step 2 (properti)', () => {
    const empty = emptyFormData()
    const errors = validateStep(2, empty)

    expect(errors.luas_tanah).toBe('Luas tanah wajib diisi.')
    expect(errors.lebar_depan).toBe('Lebar depan wajib diisi.')
    expect(errors.lebar_jalan).toBe('Lebar jalan wajib diisi.')
    expect(errors.bentuk_tanah_id).toBe('Bentuk tanah wajib dipilih.')
    expect(errors.dokumen_tanah_id).toBe('Dokumen tanah wajib dipilih.')

    const invalidNumbers = {
      ...empty,
      luas_tanah: '-10',
      lebar_depan: '0',
      lebar_jalan: 'abc',
      tahun_bangun: '1500',
      bentuk_tanah_id: '1',
      posisi_tanah_id: '1',
      kondisi_tanah_id: '1',
      topografi_id: '1',
      dokumen_tanah_id: '1',
      peruntukan_id: '1',
    }
    const errors2 = validateStep(2, invalidNumbers)
    expect(errors2.luas_tanah).toBe('Luas tanah harus lebih besar dari nol.')
    expect(errors2.lebar_depan).toBe('Lebar depan harus lebih besar dari nol.')
    expect(errors2.lebar_jalan).toBe('Lebar jalan harus lebih besar dari nol.')
    expect(errors2.tahun_bangun).toBe('Tahun bangun harus berupa tahun yang valid.')

    const valid = {
      ...invalidNumbers,
      luas_tanah: '200',
      lebar_depan: '10',
      lebar_jalan: '6',
      tahun_bangun: '2020',
    }
    expect(validateStep(2, valid)).toEqual({})
  })

  it('validates step 3 (sumber)', () => {
    const empty = emptyFormData()
    const errors = validateStep(3, empty)

    expect(errors.nama_pemberi_informasi).toBe('Nama pemberi informasi wajib diisi.')

    const invalidPhone = {
      ...empty,
      nama_pemberi_informasi: 'Pak RT',
      nomer_telepon_pemberi_informasi: '123',
    }
    const errors2 = validateStep(3, invalidPhone)
    expect(errors2.nomer_telepon_pemberi_informasi).toBe('Nomor telepon minimal 8 digit angka.')

    const valid = {
      ...empty,
      nama_pemberi_informasi: 'Pak RT',
      nomer_telepon_pemberi_informasi: '081234567890',
    }
    expect(validateStep(3, valid)).toEqual({})
  })

  it('validates full form with validatePembandingForm', () => {
    const empty = emptyFormData()
    const errors = validatePembandingForm(empty)
    expect(Object.keys(errors).length).toBeGreaterThan(5)
    expect(errors.harga).toBe('Harga wajib diisi.')
    expect(errors.alamat_data).toBe('Alamat lengkap wajib diisi.')
  })

  it('maps field error keys to step indexes with findStepForError', () => {
    expect(findStepForError({ harga: 'Harga wajib diisi' })).toBe(0)
    expect(findStepForError({ village_id: 'Desa wajib dipilih' })).toBe(1)
    expect(findStepForError({ luas_tanah: 'Luas tanah wajib diisi' })).toBe(2)
    expect(findStepForError({ nama_pemberi_informasi: 'Wajib diisi' })).toBe(3)
    expect(findStepForError({ unknown_field: 'Error' })).toBeNull()
  })
})
