import type { PembandingCreator, PembandingFormOptions } from '../api/pembanding.api'
import type { PembandingListFilters } from '../types/filters'
import { formatCurrency, formatDate } from '@/shared/formatters'

export type PembandingActiveFilter = {
  key: keyof PembandingListFilters
  label: string
  value: string
}

function optionLabel(
  options: { label: string; value: string }[] | undefined,
  value: number | undefined,
): string | undefined {
  return options?.find((option) => String(option.value) === String(value))?.label
}

export function buildActiveFilters(
  filters: PembandingListFilters,
  options?: PembandingFormOptions,
  creators: PembandingCreator[] = [],
): PembandingActiveFilter[] {
  const active: PembandingActiveFilter[] = []
  const add = (filter: PembandingActiveFilter | undefined) => {
    if (filter) active.push(filter)
  }

  if (filters.q) add({ key: 'q', label: 'Pencarian', value: filters.q })
  if (filters.province_id) {
    add({
      key: 'province_id',
      label: 'Provinsi',
      value: optionLabel(options?.provinces, Number(filters.province_id)) ?? filters.province_id,
    })
  }
  if (filters.regency_id) {
    add({
      key: 'regency_id',
      label: 'Kabupaten/kota',
      value: optionLabel(options?.regencies, Number(filters.regency_id)) ?? filters.regency_id,
    })
  }
  if (filters.district_id) {
    add({
      key: 'district_id',
      label: 'Kecamatan',
      value: optionLabel(options?.districts, Number(filters.district_id)) ?? filters.district_id,
    })
  }
  if (filters.village_id) {
    add({
      key: 'village_id',
      label: 'Desa/kelurahan',
      value: optionLabel(options?.villages, Number(filters.village_id)) ?? filters.village_id,
    })
  }
  if (filters.jenis_listing_id) {
    add({
      key: 'jenis_listing_id',
      label: 'Listing',
      value:
        optionLabel(options?.jenisListings, filters.jenis_listing_id) ??
        String(filters.jenis_listing_id),
    })
  }
  if (filters.jenis_objek_id) {
    add({
      key: 'jenis_objek_id',
      label: 'Objek',
      value:
        optionLabel(options?.jenisObjeks, filters.jenis_objek_id) ?? String(filters.jenis_objek_id),
    })
  }
  if (filters.created_by) {
    add({
      key: 'created_by',
      label: 'Pembuat',
      value:
        creators.find((creator) => creator.id === filters.created_by)?.name ??
        String(filters.created_by),
    })
  }
  if (filters.dari_tanggal) {
    add({ key: 'dari_tanggal', label: 'Mulai', value: formatDate(filters.dari_tanggal) })
  }
  if (filters.sampai_tanggal) {
    add({ key: 'sampai_tanggal', label: 'Sampai', value: formatDate(filters.sampai_tanggal) })
  }
  if (filters.min_harga !== undefined) {
    add({ key: 'min_harga', label: 'Harga min.', value: formatCurrency(filters.min_harga) })
  }
  if (filters.max_harga !== undefined) {
    add({ key: 'max_harga', label: 'Harga maks.', value: formatCurrency(filters.max_harga) })
  }

  return active
}

export function clearFilterPatch(key: keyof PembandingListFilters): Partial<PembandingListFilters> {
  switch (key) {
    case 'province_id':
      return {
        province_id: undefined,
        regency_id: undefined,
        district_id: undefined,
        village_id: undefined,
      }
    case 'regency_id':
      return { regency_id: undefined, district_id: undefined, village_id: undefined }
    case 'district_id':
      return { district_id: undefined, village_id: undefined }
    case 'village_id':
    case 'jenis_listing_id':
    case 'jenis_objek_id':
    case 'created_by':
    case 'dari_tanggal':
    case 'sampai_tanggal':
    case 'min_harga':
    case 'max_harga':
      return { [key]: undefined }
    case 'q':
      return { q: '' }
    default:
      return {}
  }
}
