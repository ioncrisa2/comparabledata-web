import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'
import type { components } from '@/shared/api/generated/schema'

export type Province = components['schemas']['Province']
export type Regency = components['schemas']['Regency']
export type District = components['schemas']['District']
export type Village = components['schemas']['Village']

function invalidResponse(resource: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Server tidak mengembalikan ${resource} yang valid.`,
  })
}

export async function fetchProvinces(
  q?: string,
  signal?: AbortSignal,
): Promise<Province[]> {
  const { data } = await apiClient.GET('/v1/locations/provinces', {
    params: { query: { q, limit: 100 } },
    signal,
  })
  if (Array.isArray(data?.data)) return data.data
  throw invalidResponse('daftar provinsi')
}

export async function fetchRegencies(
  provinceId: string,
  q?: string,
  signal?: AbortSignal,
): Promise<Regency[]> {
  const { data } = await apiClient.GET('/v1/locations/regencies', {
    params: { query: { province_id: provinceId, q, limit: 200 } },
    signal,
  })
  if (Array.isArray(data?.data)) return data.data
  throw invalidResponse('daftar kabupaten/kota')
}

export async function fetchDistricts(
  regencyId: string,
  q?: string,
  signal?: AbortSignal,
): Promise<District[]> {
  const { data } = await apiClient.GET('/v1/locations/districts', {
    params: { query: { regency_id: regencyId, q, limit: 200 } },
    signal,
  })
  if (Array.isArray(data?.data)) return data.data
  throw invalidResponse('daftar kecamatan')
}

export async function fetchVillages(
  districtId: string,
  q?: string,
  signal?: AbortSignal,
): Promise<Village[]> {
  const { data } = await apiClient.GET('/v1/locations/villages', {
    params: { query: { district_id: districtId, q, limit: 200 } },
    signal,
  })
  if (Array.isArray(data?.data)) return data.data
  throw invalidResponse('daftar desa/kelurahan')
}
