import { useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import {
  type DistrictParams,
  fetchDistricts,
  fetchProvinces,
  fetchRegencies,
  fetchVillages,
  type ProvinceParams,
  type RegencyParams,
  type VillageParams,
} from '../api/location.api'
import { locationKeys } from '../api/location.keys'

const REFERENCE_STALE_TIME = 30 * 60_000
const REFERENCE_GC_TIME = 60 * 60_000

function queryEnabled(enabled: MaybeRefOrGetter<boolean>) {
  return computed(() => toValue(enabled))
}

export function useProvincesQuery(params: MaybeRefOrGetter<ProvinceParams> = {}) {
  const resolvedParams = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => locationKeys.provinces(resolvedParams.value)),
    queryFn: ({ signal }) => fetchProvinces(resolvedParams.value, signal),
    staleTime: REFERENCE_STALE_TIME,
    gcTime: REFERENCE_GC_TIME,
  })
}

export function useRegenciesQuery(
  params: MaybeRefOrGetter<RegencyParams>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const resolvedParams = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => locationKeys.regencies(resolvedParams.value)),
    queryFn: ({ signal }) => fetchRegencies(resolvedParams.value, signal),
    enabled: queryEnabled(enabled),
    staleTime: REFERENCE_STALE_TIME,
    gcTime: REFERENCE_GC_TIME,
  })
}

export function useDistrictsQuery(
  params: MaybeRefOrGetter<DistrictParams>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const resolvedParams = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => locationKeys.districts(resolvedParams.value)),
    queryFn: ({ signal }) => fetchDistricts(resolvedParams.value, signal),
    enabled: queryEnabled(enabled),
    staleTime: REFERENCE_STALE_TIME,
    gcTime: REFERENCE_GC_TIME,
  })
}

export function useVillagesQuery(
  params: MaybeRefOrGetter<VillageParams>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const resolvedParams = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => locationKeys.villages(resolvedParams.value)),
    queryFn: ({ signal }) => fetchVillages(resolvedParams.value, signal),
    enabled: queryEnabled(enabled),
    staleTime: REFERENCE_STALE_TIME,
    gcTime: REFERENCE_GC_TIME,
  })
}
