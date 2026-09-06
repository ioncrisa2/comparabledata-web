import { apiClient } from '@/shared/api/client'
import { ApiError, apiErrorFromUnknown, isApiError } from '@/shared/api/error'

export interface RoleItem {
  id: number
  name: string
  guard_name: string
  permissions_count: number
  users_count: number
  permissions: string[]
  is_locked: boolean
}

export interface CreateRolePayload {
  name: string
  permissions?: string[]
}

export interface UpdateRolePayload {
  name: string
  permissions?: string[]
}

export interface PermissionItem {
  id: number
  name: string
  guard_name: string
  group: string
  roles_count: number
  users_count: number
  is_locked: boolean
}

export interface CreatePermissionPayload {
  name: string
}

function invalidResponse(action: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Respon server tidak valid saat ${action}.`,
  })
}

function unwrapError(error: unknown, fallbackAction: string): ApiError {
  if (isApiError(error)) return error
  if (error) return apiErrorFromUnknown(error)
  return invalidResponse(fallbackAction)
}

export async function fetchRoles(
  options: { signal?: AbortSignal } = {},
): Promise<RoleItem[]> {
  const response = await apiClient.GET('/v1/roles', {
    signal: options.signal,
  })

  if (response.error) {
    throw unwrapError(response.error, 'mengambil daftar role')
  }
  if (!response.data) {
    throw invalidResponse('mengambil daftar role')
  }

  return (response.data as unknown as { data: RoleItem[] }).data ?? []
}

export async function createRole(
  payload: CreateRolePayload,
  options: { signal?: AbortSignal } = {},
): Promise<RoleItem> {
  const response = await apiClient.POST('/v1/roles', {
    body: payload as never,
    signal: options.signal,
  })

  if (response.error) {
    throw unwrapError(response.error, 'menambahkan role baru')
  }
  if (!response.data) {
    throw invalidResponse('menambahkan role baru')
  }

  return (response.data as unknown as { data: RoleItem }).data
}

export async function updateRole(
  id: number | string,
  payload: UpdateRolePayload,
  options: { signal?: AbortSignal } = {},
): Promise<RoleItem> {
  const response = await apiClient.PUT('/v1/roles/{role}', {
    params: {
      path: { role: String(id) as never },
    },
    body: payload as never,
    signal: options.signal,
  })

  if (response.error) {
    throw unwrapError(response.error, `memperbarui role #${id}`)
  }
  if (!response.data) {
    throw invalidResponse(`memperbarui role #${id}`)
  }

  return (response.data as unknown as { data: RoleItem }).data
}

export async function deleteRole(
  id: number | string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const response = await apiClient.DELETE('/v1/roles/{role}', {
    params: {
      path: { role: String(id) as never },
    },
    signal: options.signal,
  })

  if (response.error) {
    throw unwrapError(response.error, `menghapus role #${id}`)
  }
}

export async function fetchPermissions(
  options: { signal?: AbortSignal } = {},
): Promise<PermissionItem[]> {
  const response = await apiClient.GET('/v1/permissions', {
    signal: options.signal,
  })

  if (response.error) {
    throw unwrapError(response.error, 'mengambil daftar permission')
  }
  if (!response.data) {
    throw invalidResponse('mengambil daftar permission')
  }

  return (response.data as unknown as { data: PermissionItem[] }).data ?? []
}

export async function createPermission(
  payload: CreatePermissionPayload,
  options: { signal?: AbortSignal } = {},
): Promise<PermissionItem> {
  const response = await apiClient.POST('/v1/permissions', {
    body: payload as never,
    signal: options.signal,
  })

  if (response.error) {
    throw unwrapError(response.error, 'menambahkan permission baru')
  }
  if (!response.data) {
    throw invalidResponse('menambahkan permission baru')
  }

  return (response.data as unknown as { data: PermissionItem }).data
}

export async function deletePermission(
  id: number | string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const response = await apiClient.DELETE('/v1/permissions/{permission}', {
    params: {
      path: { permission: String(id) as never },
    },
    signal: options.signal,
  })

  if (response.error) {
    throw unwrapError(response.error, `menghapus permission #${id}`)
  }
}
