import { computed } from 'vue'
import { type LocationQuery, type LocationQueryRaw, useRoute, useRouter } from 'vue-router'

import {
  PEMBANDING_PER_PAGE_OPTIONS,
  PEMBANDING_SORT_FIELDS,
  type PembandingListFilters,
  type PembandingSortField,
} from '../types/filters'

function firstQueryValue(value: LocationQuery[string] | undefined): string | undefined {
  const resolved = Array.isArray(value) ? value[0] : value
  return typeof resolved === 'string' && resolved.trim() ? resolved.trim() : undefined
}

function positiveInteger(value: LocationQuery[string] | undefined): number | undefined {
  const parsed = Number(firstQueryValue(value))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function nonNegativeNumber(value: LocationQuery[string] | undefined): number | undefined {
  const parsed = Number(firstQueryValue(value))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function dateOnly(value: LocationQuery[string] | undefined): string | undefined {
  const resolved = firstQueryValue(value)
  if (!resolved || !/^\d{4}-\d{2}-\d{2}$/.test(resolved)) return undefined

  const parsed = new Date(`${resolved}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== resolved
    ? undefined
    : resolved
}

function sortField(value: LocationQuery[string] | undefined): PembandingSortField {
  const resolved = firstQueryValue(value)
  return PEMBANDING_SORT_FIELDS.find((field) => field === resolved) ?? 'tanggal_data'
}

export function parsePembandingFilters(query: LocationQuery): PembandingListFilters {
  const requestedPerPage = positiveInteger(query.per_page)

  return {
    page: positiveInteger(query.page) ?? 1,
    per_page: PEMBANDING_PER_PAGE_OPTIONS.some((option) => option === requestedPerPage)
      ? (requestedPerPage ?? 25)
      : 25,
    q: firstQueryValue(query.q) ?? '',
    province_id: firstQueryValue(query.province_id),
    regency_id: firstQueryValue(query.regency_id),
    district_id: firstQueryValue(query.district_id),
    village_id: firstQueryValue(query.village_id),
    jenis_listing_id: positiveInteger(query.jenis_listing_id),
    jenis_objek_id: positiveInteger(query.jenis_objek_id),
    created_by: positiveInteger(query.created_by),
    dari_tanggal: dateOnly(query.dari_tanggal),
    sampai_tanggal: dateOnly(query.sampai_tanggal),
    min_harga: nonNegativeNumber(query.min_harga),
    max_harga: nonNegativeNumber(query.max_harga),
    sort: sortField(query.sort),
    direction: firstQueryValue(query.direction)?.toLowerCase() === 'asc' ? 'asc' : 'desc',
  }
}

export function serializePembandingFilters(filters: PembandingListFilters): LocationQueryRaw {
  const query: LocationQueryRaw = {}

  if (filters.page > 1) query.page = String(filters.page)
  if (filters.per_page !== 25) query.per_page = String(filters.per_page)
  if (filters.q) query.q = filters.q
  if (filters.province_id) query.province_id = filters.province_id
  if (filters.regency_id) query.regency_id = filters.regency_id
  if (filters.district_id) query.district_id = filters.district_id
  if (filters.village_id) query.village_id = filters.village_id
  if (filters.jenis_listing_id) query.jenis_listing_id = String(filters.jenis_listing_id)
  if (filters.jenis_objek_id) query.jenis_objek_id = String(filters.jenis_objek_id)
  if (filters.created_by) query.created_by = String(filters.created_by)
  if (filters.dari_tanggal) query.dari_tanggal = filters.dari_tanggal
  if (filters.sampai_tanggal) query.sampai_tanggal = filters.sampai_tanggal
  if (filters.min_harga !== undefined) query.min_harga = String(filters.min_harga)
  if (filters.max_harga !== undefined) query.max_harga = String(filters.max_harga)
  if (filters.sort !== 'tanggal_data') query.sort = filters.sort
  if (filters.direction !== 'desc') query.direction = filters.direction

  return query
}

export function usePembandingFilters() {
  const route = useRoute()
  const router = useRouter()
  const filters = computed(() => parsePembandingFilters(route.query))

  async function update(patch: Partial<PembandingListFilters>) {
    const next = { ...filters.value, ...patch }
    if (!Object.prototype.hasOwnProperty.call(patch, 'page')) next.page = 1

    await router.replace({ name: 'pembanding.list', query: serializePembandingFilters(next) })
  }

  return {
    filters,
    reset: () => router.replace({ name: 'pembanding.list' }),
    setPage: (page: number) => update({ page: Math.max(1, page) }),
    setPerPage: (per_page: number) => update({ page: 1, per_page }),
    update,
  }
}
