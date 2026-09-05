import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'
import type { components, operations } from '@/shared/api/generated/schema'

export type Province = components['schemas']['Province']
export type Regency = components['schemas']['Regency']
export type District = components['schemas']['District']
export type Village = components['schemas']['Village']

export type ProvinceParams = NonNullable<operations['location.provinces']['parameters']['query']>
export type RegencyParams = NonNullable<operations['location.regencies']['parameters']['query']>
export type DistrictParams = NonNullable<operations['location.districts']['parameters']['query']>
export type VillageParams = NonNullable<operations['location.villages']['parameters']['query']>

function requireCollection<T>(data: T[] | undefined, resource: string): T[] {
  if (Array.isArray(data)) return data

  throw new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Server tidak mengembalikan daftar ${resource} yang valid.`,
  })
}

export async function fetchProvinces(
  params: ProvinceParams = {},
  signal?: AbortSignal,
): Promise<Province[]> {
  const { data } = await apiClient.GET('/v1/locations/provinces', {
    params: { query: params },
    signal,
  })
  return requireCollection(data?.data, 'provinsi')
}

export async function fetchRegencies(
  params: RegencyParams = {},
  signal?: AbortSignal,
): Promise<Regency[]> {
  const { data } = await apiClient.GET('/v1/locations/regencies', {
    params: { query: params },
    signal,
  })
  return requireCollection(data?.data, 'kabupaten/kota')
}

export async function fetchDistricts(
  params: DistrictParams = {},
  signal?: AbortSignal,
): Promise<District[]> {
  const { data } = await apiClient.GET('/v1/locations/districts', {
    params: { query: params },
    signal,
  })
  return requireCollection(data?.data, 'kecamatan')
}

export async function fetchVillages(
  params: VillageParams = {},
  signal?: AbortSignal,
): Promise<Village[]> {
  const { data } = await apiClient.GET('/v1/locations/villages', {
    params: { query: params },
    signal,
  })
  return requireCollection(data?.data, 'desa/kelurahan')
}
