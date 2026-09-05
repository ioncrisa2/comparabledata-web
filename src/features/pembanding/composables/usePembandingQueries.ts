import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import {
  fetchPembanding,
  fetchPembandingCreators,
  fetchPembandingFormOptions,
  fetchPembandings,
} from '../api/pembanding.api'
import { pembandingKeys } from '../api/pembanding.keys'
import type { PembandingListFilters } from '../types/filters'

export function usePembandingListQuery(
  filters: MaybeRefOrGetter<PembandingListFilters>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const resolvedFilters = computed(() => toValue(filters))

  return useQuery({
    queryKey: computed(() => pembandingKeys.list(resolvedFilters.value)),
    queryFn: ({ signal }) => fetchPembandings(resolvedFilters.value, signal),
    enabled: computed(() => toValue(enabled)),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function usePembandingDetailQuery(id: MaybeRefOrGetter<string>) {
  const resolvedId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => pembandingKeys.detail(resolvedId.value)),
    queryFn: ({ signal }) => fetchPembanding(resolvedId.value, signal),
    enabled: computed(() => /^\d+$/.test(resolvedId.value)),
    staleTime: 60_000,
  })
}

export function usePembandingFormOptionsQuery() {
  return useQuery({
    queryKey: pembandingKeys.options(),
    queryFn: ({ signal }) => fetchPembandingFormOptions(signal),
    staleTime: 30 * 60_000,
  })
}

export function usePembandingCreatorsQuery() {
  return useQuery({
    queryKey: pembandingKeys.creators(),
    queryFn: ({ signal }) => fetchPembandingCreators(signal),
    staleTime: 5 * 60_000,
  })
}
