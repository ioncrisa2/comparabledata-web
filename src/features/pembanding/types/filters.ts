export const PEMBANDING_PER_PAGE_OPTIONS = [25, 50, 100] as const
export const PEMBANDING_SORT_FIELDS = [
  'tanggal_data',
  'harga',
  'luas_tanah',
  'luas_bangunan',
  'created_at',
  'id',
] as const

export type PembandingSortField = (typeof PEMBANDING_SORT_FIELDS)[number]

export type PembandingListFilters = {
  page: number
  per_page: number
  q: string
  province_id?: string
  regency_id?: string
  district_id?: string
  village_id?: string
  jenis_listing_id?: number
  jenis_objek_id?: number
  created_by?: number
  dari_tanggal?: string
  sampai_tanggal?: string
  min_harga?: number
  max_harga?: number
  sort: PembandingSortField
  direction: 'asc' | 'desc'
}
