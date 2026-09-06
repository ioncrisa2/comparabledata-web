import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

export type WilayahResource = 'provinces' | 'regencies' | 'districts' | 'villages'

export interface WilayahStats {
  provinces: number
  regencies: number
  districts: number
  villages: number
}

export interface WilayahResourceMeta {
  label: string
  singular: string
  icon: string
  id_label: string
  id_help: string
  parent_label?: string | null
  parent_key?: string | null
  children_label?: string | null
}

export interface WilayahParentOption {
  id: string
  name: string
}

export interface WilayahOptions {
  provinces?: WilayahParentOption[]
  regencies?: WilayahParentOption[]
  districts?: WilayahParentOption[]
}

export interface WilayahItem {
  id: string
  name: string
  province_id?: string
  regency_id?: string
  district_id?: string
  province?: { id: string; name: string }
  regency?: { id: string; name: string; province_id?: string }
  district?: { id: string; name: string; regency_id?: string }
  children_count?: number | string
}

export interface WilayahPaginationMeta {
  current_page: number
  per_page: number
  from: number | null
  to: number | null
  total: number
  last_page: number
}

export interface WilayahIndexResponse {
  status: 'success'
  message: string
  data: WilayahItem[]
  meta: WilayahPaginationMeta
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  resource_meta: WilayahResourceMeta
  stats: WilayahStats
  options: WilayahOptions
}

export interface WilayahFilterParams {
  search?: string
  province_id?: string
  regency_id?: string
  district_id?: string
  page?: number
  per_page?: number
}

export interface CreateWilayahPayload {
  name: string
  id?: string // required for provinces (2 digits)
  province_id?: string // required for regencies
  regency_id?: string // required for districts
  district_id?: string // required for villages
}

export interface UpdateWilayahPayload {
  name: string
}

function invalidResponse(resource: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Server tidak mengembalikan data wilayah ${resource} yang valid.`,
  })
}

export async function fetchWilayahList(
  resource: WilayahResource,
  params: WilayahFilterParams = {},
  options: { signal?: AbortSignal } = {},
): Promise<WilayahIndexResponse> {
  const queryParams: Record<string, string | number> = {}

  if (params.search) queryParams.search = params.search
  if (params.province_id) queryParams.province_id = params.province_id
  if (params.regency_id) queryParams.regency_id = params.regency_id
  if (params.district_id) queryParams.district_id = params.district_id
  if (params.page) queryParams.page = params.page
  if (params.per_page) queryParams.per_page = params.per_page

  const response = await apiClient.GET('/v1/geo/{resource}', {
    params: {
      path: { resource },
      query: queryParams as never,
    },
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse(resource)
  }

  return response.data as unknown as WilayahIndexResponse
}

export async function createWilayah(
  resource: WilayahResource,
  payload: CreateWilayahPayload,
  options: { signal?: AbortSignal } = {},
): Promise<WilayahItem> {
  const response = await apiClient.POST('/v1/geo/{resource}', {
    params: {
      path: { resource },
    },
    body: payload as never,
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse(resource)
  }

  return response.data.data
}

export async function updateWilayah(
  resource: WilayahResource,
  id: string,
  payload: UpdateWilayahPayload,
  options: { signal?: AbortSignal } = {},
): Promise<WilayahItem> {
  const response = await apiClient.PUT('/v1/geo/{resource}/{id}', {
    params: {
      path: { resource, id },
    },
    body: payload,
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse(resource)
  }

  return response.data.data as WilayahItem
}

export async function deleteWilayah(
  resource: WilayahResource,
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const response = await apiClient.DELETE('/v1/geo/{resource}/{id}', {
    params: {
      path: { resource, id },
    },
    signal: options.signal,
  })

  if (response.error) {
    throw invalidResponse(resource)
  }
}
