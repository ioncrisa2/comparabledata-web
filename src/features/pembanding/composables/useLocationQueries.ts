import { useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import { fetchDistricts, fetchProvinces, fetchRegencies, fetchVillages } from '../api/location.api'

const LOCATION_STALE = 10 * 60_000 // 10 menit

export function useProvincesQuery() {
  return useQuery({
    queryKey: ['locations', 'provinces'],
    queryFn: ({ signal }) => fetchProvinces(undefined, signal),
    staleTime: LOCATION_STALE,
  })
}

export function useRegenciesQuery(provinceId: MaybeRefOrGetter<string>) {
  const resolved = computed(() => toValue(provinceId))

  return useQuery({
    queryKey: computed(() => ['locations', 'regencies', resolved.value]),
    queryFn: ({ signal }) => fetchRegencies(resolved.value, undefined, signal),
    enabled: computed(() => Boolean(resolved.value)),
    staleTime: LOCATION_STALE,
  })
}

export function useDistrictsQuery(regencyId: MaybeRefOrGetter<string>) {
  const resolved = computed(() => toValue(regencyId))

  return useQuery({
    queryKey: computed(() => ['locations', 'districts', resolved.value]),
    queryFn: ({ signal }) => fetchDistricts(resolved.value, undefined, signal),
    enabled: computed(() => Boolean(resolved.value)),
    staleTime: LOCATION_STALE,
  })
}

export function useVillagesQuery(districtId: MaybeRefOrGetter<string>) {
  const resolved = computed(() => toValue(districtId))

  return useQuery({
    queryKey: computed(() => ['locations', 'villages', resolved.value]),
    queryFn: ({ signal }) => fetchVillages(resolved.value, undefined, signal),
    enabled: computed(() => Boolean(resolved.value)),
    staleTime: LOCATION_STALE,
  })
}
