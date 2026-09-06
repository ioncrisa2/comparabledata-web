import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

export interface GlobalSearchResultItem {
  menu_group: string
  menu_name: string
  resource_name: string
  title: string
  target_type: string
  target_id: string
  api_url: string
  details: Record<string, unknown>
  icon: string
}

export interface SearchOption {
  label: string
  value: string
}

export interface SearchPaginationMeta {
  current_page: number
  per_page: number
  from: number | null
  to: number | null
  total: number
  last_page: number
}

export interface GlobalSearchResponse {
  status: 'success'
  message: string
  query: string
  data: GlobalSearchResultItem[]
  meta: SearchPaginationMeta
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  summary: {
    raw_total: number
    filtered_total: number
  }
  options: {
    menu_groups: SearchOption[]
    menu_names: SearchOption[]
    resource_names: SearchOption[]
  }
}

export interface GlobalSearchParams {
  q: string
  menu_group?: string
  menu_name?: string
  resource_name?: string
  page?: number
  per_page?: number
}

function invalidResponse(): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: 'Server tidak mengembalikan hasil pencarian yang valid.',
  })
}

export async function fetchGlobalSearch(
  params: GlobalSearchParams,
  options: { signal?: AbortSignal } = {},
): Promise<GlobalSearchResponse> {
  const queryParams: Record<string, string | number> = {
    q: params.q,
  }

  if (params.menu_group) queryParams.menu_group = params.menu_group
  if (params.menu_name) queryParams.menu_name = params.menu_name
  if (params.resource_name) queryParams.resource_name = params.resource_name
  if (params.page) queryParams.page = params.page
  if (params.per_page) queryParams.per_page = params.per_page

  const response = await apiClient.GET('/v1/search', {
    params: {
      query: queryParams as never,
    },
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse()
  }

  return response.data as unknown as GlobalSearchResponse
}
