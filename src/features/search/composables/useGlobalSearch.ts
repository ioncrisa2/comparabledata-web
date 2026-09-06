import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import {
  fetchGlobalSearch,
  type GlobalSearchParams,
  type GlobalSearchResultItem,
} from '../api/search.api'

export function useGlobalSearchQuery(params: Ref<GlobalSearchParams>) {
  return useQuery({
    queryKey: ['global-search', params],
    queryFn: ({ signal }) => fetchGlobalSearch(params.value, { signal }),
    enabled: computed(() => params.value.q.trim().length > 0),
    staleTime: 30_000,
  })
}

export function resolveSearchResultRoute(item: GlobalSearchResultItem): RouteLocationRaw | null {
  switch (item.target_type) {
    case 'pembanding':
      return { name: 'pembanding.detail', params: { id: item.target_id } }
    case 'delete_request':
      return { name: 'moderation.index', query: { tab: 'requests', search: item.title } }
    case 'master_data':
      return { name: 'master-data.index', query: { type: item.target_id } }
    case 'geo_province':
      return { name: 'wilayah.index', query: { tab: 'provinces', search: item.title } }
    case 'geo_regency':
      return { name: 'wilayah.index', query: { tab: 'regencies', search: item.title } }
    case 'geo_district':
      return { name: 'wilayah.index', query: { tab: 'districts', search: item.title } }
    case 'geo_village':
      return { name: 'wilayah.index', query: { tab: 'villages', search: item.title } }
    case 'user':
      return { name: 'user.index', query: { search: item.title } }
    default:
      return null
  }
}

const isSearchOpen = ref(false)

export function useGlobalSearchState() {
  function openSearch() {
    isSearchOpen.value = true
  }

  function closeSearch() {
    isSearchOpen.value = false
  }

  function toggleSearch() {
    isSearchOpen.value = !isSearchOpen.value
  }

  return {
    isSearchOpen,
    openSearch,
    closeSearch,
    toggleSearch,
  }
}
