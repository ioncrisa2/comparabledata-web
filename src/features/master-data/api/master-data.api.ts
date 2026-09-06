import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

export type DictionaryType =
  | 'jenis-listing'
  | 'jenis-objek'
  | 'status-pemberi-informasi'
  | 'bentuk-tanah'
  | 'dokumen-tanah'
  | 'posisi-tanah'
  | 'kondisi-tanah'
  | 'topografi'
  | 'peruntukan'

export interface DictionaryCategoryStats {
  total: number
  active: number
  inactive: number
}

export interface DictionaryCategory {
  type: string
  label: string
  icon: string
  description: string
  extra?: string[]
  stats: DictionaryCategoryStats
}

export interface DictionaryItem {
  id: number
  name: string
  slug: string
  sort_order: number
  is_active: boolean
  badge_color_token?: string | null
  badge_color?: string | null
  marker_icon_url?: string | null
  pembandings_count?: number
}

export interface CreateDictionaryItemPayload {
  name: string
  is_active?: boolean
  badge_color?: string | null
  marker_icon_url?: string | null
}

export interface UpdateDictionaryItemPayload {
  name: string
  is_active?: boolean
  badge_color?: string | null
  marker_icon_url?: string | null
}

function invalidResponse(resource: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Server tidak mengembalikan data ${resource} yang valid.`,
  })
}

export async function fetchDictionaryCategories(
  options: { signal?: AbortSignal } = {},
): Promise<DictionaryCategory[]> {
  const response = await apiClient.GET('/v1/dictionaries', {
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse('kategori master data')
  }

  // Response data can be an array or an object keyed by type
  const rawData = response.data.data
  if (Array.isArray(rawData)) {
    return rawData as unknown as DictionaryCategory[]
  }

  if (rawData && typeof rawData === 'object') {
    return Object.entries(rawData).map(([key, val]) => ({
      type: key,
      ...(val as Record<string, unknown>),
    })) as unknown as DictionaryCategory[]
  }

  return []
}

export async function fetchDictionaryItems(
  type: string,
  activeOnly = false,
  options: { signal?: AbortSignal } = {},
): Promise<DictionaryItem[]> {
  const response = await apiClient.GET('/v1/dictionaries/{type}', {
    params: {
      path: { type: type as never },
      query: { active_only: activeOnly },
    },
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse(`item master data ${type}`)
  }

  return response.data.data as unknown as DictionaryItem[]
}

export async function createDictionaryItem(
  type: string,
  payload: CreateDictionaryItemPayload,
  options: { signal?: AbortSignal } = {},
): Promise<DictionaryItem> {
  const response = await apiClient.POST('/v1/dictionaries/{type}', {
    params: {
      path: { type: type as never },
    },
    body: payload as never,
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse(`item master data ${type}`)
  }

  return response.data.data as unknown as DictionaryItem
}

export async function updateDictionaryItem(
  type: string,
  id: number | string,
  payload: UpdateDictionaryItemPayload,
  options: { signal?: AbortSignal } = {},
): Promise<DictionaryItem> {
  const response = await apiClient.PUT('/v1/dictionaries/{type}/{id}', {
    params: {
      path: { type: type as never, id },
    },
    body: payload as never,
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse(`item master data ${type}`)
  }

  return response.data.data as unknown as DictionaryItem
}

export async function updateDictionaryStatus(
  type: string,
  id: number | string,
  isActive: boolean,
  options: { signal?: AbortSignal } = {},
): Promise<DictionaryItem> {
  const response = await apiClient.PATCH('/v1/dictionaries/{type}/{id}/status', {
    params: {
      path: { type: type as never, id },
    },
    body: { is_active: isActive },
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse(`status master data ${type}`)
  }

  return response.data.data as unknown as DictionaryItem
}

export async function deleteDictionaryItem(
  type: string,
  id: number | string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const response = await apiClient.DELETE('/v1/dictionaries/{type}/{id}', {
    params: {
      path: { type: type as never, id },
    },
    signal: options.signal,
  })

  if (response.error) {
    throw invalidResponse(`item master data ${type}`)
  }
}

export async function reorderDictionaryItems(
  type: string,
  ids: number[],
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const response = await apiClient.POST('/v1/dictionaries/{type}/reorder', {
    params: {
      path: { type: type as never },
    },
    body: { ids },
    signal: options.signal,
  })

  if (response.error) {
    throw invalidResponse(`urutan master data ${type}`)
  }
}
