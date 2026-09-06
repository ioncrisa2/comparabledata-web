import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

export interface UserItem {
  id: number
  name: string
  email: string
  is_active?: boolean
  deactivated_at?: string | null
  roles: string[]
  permissions?: string[]
  created_at?: string | null
  updated_at?: string | null
}

export interface UserListMeta {
  current_page: number
  per_page: number
  from: number | null
  to: number | null
  total: number
  last_page: number
}

export interface UserListCapabilities {
  create?: boolean
  update?: boolean
  delete?: boolean
  deleteAny?: boolean
}

export interface UserListResponse {
  status: string
  message: string
  data: UserItem[]
  meta: UserListMeta
  links?: Record<string, string | null>
  can?: UserListCapabilities
}

export interface UserFilterParams {
  search?: string
  role?: string
  status?: 'active' | 'inactive' | ''
  page?: number
  per_page?: number
}

export interface RoleOption {
  value: string
  label: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  roles: string[]
  is_active?: boolean
}

export interface UpdateUserPayload {
  name: string
  email: string
  password?: string
  roles: string[]
  is_active?: boolean
}

export interface ToggleStatusResponse {
  id: number
  is_active: boolean
  deactivated_at: string | null
}

export interface BulkDeleteResponse {
  deleted_count: number
}

function invalidResponse(action: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Respon server tidak valid saat ${action}.`,
  })
}

export async function fetchUsers(
  params: UserFilterParams = {},
  options: { signal?: AbortSignal } = {},
): Promise<UserListResponse> {
  const queryParams: Record<string, unknown> = {}
  if (params.search) queryParams.search = params.search
  if (params.role) queryParams.role = params.role
  if (params.status) queryParams.status = params.status
  if (params.page) queryParams.page = params.page
  if (params.per_page) queryParams.per_page = params.per_page

  const response = await apiClient.GET('/v1/users', {
    params: {
      query: queryParams as never,
    },
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse('mengambil daftar pengguna')
  }

  return response.data as unknown as UserListResponse
}

export async function fetchUser(
  id: number | string,
  options: { signal?: AbortSignal } = {},
): Promise<UserItem> {
  const response = await apiClient.GET('/v1/users/{user}', {
    params: {
      path: { user: String(id) as never },
    },
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse(`mengambil detail pengguna #${id}`)
  }

  return (response.data as unknown as { data: UserItem }).data
}

export async function fetchRoleOptions(
  options: { signal?: AbortSignal } = {},
): Promise<RoleOption[]> {
  const response = await apiClient.GET('/v1/roles/options', {
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse('mengambil opsi role pengguna')
  }

  return (response.data as unknown as { data: RoleOption[] }).data ?? []
}

export async function createUser(
  payload: CreateUserPayload,
  options: { signal?: AbortSignal } = {},
): Promise<UserItem> {
  const response = await apiClient.POST('/v1/users', {
    body: payload as never,
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse('menambahkan pengguna baru')
  }

  return (response.data as unknown as { data: UserItem }).data
}

export async function updateUser(
  id: number | string,
  payload: UpdateUserPayload,
  options: { signal?: AbortSignal } = {},
): Promise<UserItem> {
  const response = await apiClient.PUT('/v1/users/{user}', {
    params: {
      path: { user: String(id) as never },
    },
    body: payload as never,
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse(`memperbarui pengguna #${id}`)
  }

  return (response.data as unknown as { data: UserItem }).data
}

export async function toggleUserStatus(
  id: number | string,
  options: { signal?: AbortSignal } = {},
): Promise<ToggleStatusResponse> {
  const response = await apiClient.PATCH('/v1/users/{user}/status', {
    params: {
      path: { user: String(id) as never },
    },
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse(`mengubah status pengguna #${id}`)
  }

  return (response.data as unknown as { data: ToggleStatusResponse }).data
}

export async function deleteUser(
  id: number | string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const response = await apiClient.DELETE('/v1/users/{user}', {
    params: {
      path: { user: String(id) as never },
    },
    signal: options.signal,
  })

  if (response.error) {
    throw invalidResponse(`menghapus pengguna #${id}`)
  }
}

export async function bulkDeleteUsers(
  ids: number[],
  options: { signal?: AbortSignal } = {},
): Promise<BulkDeleteResponse> {
  const response = await apiClient.POST('/v1/users/bulk-delete', {
    body: { ids } as never,
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse('menghapus pengguna terpilih')
  }

  return (response.data as unknown as { data: BulkDeleteResponse }).data
}
